import React, { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  pointerWithin,
  rectIntersection,
  closestCenter,
  CollisionDetection,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { Zap, Kanban as KanbanIcon, Grid, Clock, Plus, Filter, CalendarCheck } from 'lucide-react'
import { Task, GTDList, TaskStatus, EisenhowerQuadrant, TimeBlock } from '@/data/ports/schemas'
import { useTasks, useUpdateTask } from './useTasks'
import { useTimeBlocks, useCreateTimeBlock, useUpdateTimeBlock } from './useTimeBlocks'
import { KanbanBoard } from './KanbanBoard'
import { EisenhowerGrid } from './EisenhowerGrid'
import { TaskCard } from './TaskCard'
import { TaskModal } from './TaskModal'
import { WeeklyReviewWizard } from './components/WeeklyReviewWizard'
import { TimelineView } from './timeline/TimelineView'
import { useUIStore } from '@/app/store/uiStore'
import { cn } from '@/lib/utils'

type ActionViewMode = 'kanban' | 'eisenhower' | 'timeline'

export const ActionHubPage: React.FC = () => {
  const { data: allTasks = [], isLoading } = useTasks()
  const updateTaskMutation = useUpdateTask()
  const openWeeklyReview = useUIStore((s) => s.openWeeklyReview)

  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date())
  const selectedDateStr = selectedDate.toISOString().slice(0, 10)
  useTimeBlocks(selectedDateStr) // Preload day timeBlocks into TanStack cache
  const createTimeBlockMutation = useCreateTimeBlock()
  const updateTimeBlockMutation = useUpdateTimeBlock()

  const [viewMode, setViewMode] = useState<ActionViewMode>('kanban')
  const [selectedGTD, setSelectedGTD] = useState<GTDList | 'all'>('all')
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [activeBlock, setActiveBlock] = useState<TimeBlock | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null)

  // Configure accessible drag sensors with distance constraint
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Prioritize pointer collisions with graceful fallbacks so drops never bounce back
  const collisionDetectionStrategy: CollisionDetection = (args) => {
    const pointerCollisions = pointerWithin(args)
    if (pointerCollisions.length > 0) {
      return pointerCollisions
    }
    const rectCollisions = rectIntersection(args)
    if (rectCollisions.length > 0) {
      return rectCollisions
    }
    return closestCenter(args)
  }

  // Filter tasks by GTD List if selected
  const filteredTasks = allTasks.filter((task) => {
    if (selectedGTD === 'all') return true
    return task.gtdList === selectedGTD
  })

  const handleDragStart = (event: DragStartEvent) => {
    const activeData = event.active.data.current
    if (activeData?.type === 'TimeBlock') {
      setActiveBlock(activeData.block as TimeBlock)
      setActiveTask(null)
    } else if (activeData?.type === 'Task' || activeData?.task) {
      setActiveTask(activeData.task as Task)
      setActiveBlock(null)
    } else {
      const task = allTasks.find((t) => t.id === event.active.id)
      if (task) {
        setActiveTask(task)
        setActiveBlock(null)
      }
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    console.log("DRAG END: ", { activeId: active.id, overId: over?.id })

    setActiveTask(null)
    setActiveBlock(null)

    if (!over) return

    try {
      const overId = String(over.id)
      const activeId = String(active.id)
      const activeData = active.data.current
      const activeType = activeData?.type

      // 1. Sidebar task drop onto Timeline 15-minute slot
      if (overId.startsWith('slot-') && (activeId.startsWith('tsk_') || activeId.startsWith('task-') || activeType === 'Task' || activeData?.task)) {
        const draggedTask = allTasks.find((t) => t.id === active.id || `task-${t.id}` === active.id || t.id === activeId.replace('task-', ''))
        if (!draggedTask) return

        const [slotH, slotM] = overId.replace('slot-', '').split(':').map(Number)
        const startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), slotH, slotM, 0)
        const durationMin = draggedTask.estimateMin && draggedTask.estimateMin > 0 ? draggedTask.estimateMin : 45
        const endDate = new Date(startDate.getTime() + durationMin * 60000)

        console.log("MUTATION FIRED", startDate, endDate)

        createTimeBlockMutation.mutate({
          title: draggedTask.title,
          category: 'deep_work',
          color: 'cyan',
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          taskId: draggedTask.id,
          source: 'KiBANLY',
          gcal: null,
        })

        // Good UX: Mark task as scheduled
        if (draggedTask.gtdList !== 'scheduled') {
          updateTaskMutation.mutate({
            id: draggedTask.id,
            patch: { gtdList: 'scheduled' },
          })
        }
        return
      }

      // 2. Moving an existing TimeBlock on Timeline (Timeline to Timeline)
      if (overId.startsWith('slot-') && (activeId.startsWith('blk_') || activeType === 'TimeBlock' || activeData?.block)) {
        const block = (activeData?.block as TimeBlock)
        if (!block) return

        const [slotH, slotM] = overId.replace('slot-', '').split(':').map(Number)
        const startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), slotH, slotM, 0)

        const origStart = new Date(block.start)
        const origEnd = new Date(block.end)
        const durationMs =
          !isNaN(origStart.getTime()) && !isNaN(origEnd.getTime())
            ? Math.max(15 * 60 * 1000, origEnd.getTime() - origStart.getTime())
            : 45 * 60 * 1000

        const endDate = new Date(startDate.getTime() + durationMs)

        console.log("MUTATION FIRED", startDate, endDate)

        updateTimeBlockMutation.mutate({
          id: block.id,
          patch: {
            start: startDate.toISOString(),
            end: endDate.toISOString(),
          },
        })
        return
      }

      // 2. Kanban Board Drops
      if (viewMode === 'kanban') {
        const activeId = String(active.id)
        const currentTask = allTasks.find((t) => t.id === activeId || `task-${t.id}` === activeId)
        if (!currentTask) return

        const validColumns: TaskStatus[] = ['draft', 'in_progress', 'done']
        let targetStatus: TaskStatus | null = null

        if (validColumns.includes(overId as TaskStatus)) {
          targetStatus = overId as TaskStatus
        } else {
          const overTask = allTasks.find((t) => t.id === overId)
          if (overTask) {
            targetStatus = overTask.status
          }
        }

        if (targetStatus && currentTask.status !== targetStatus) {
          updateTaskMutation.mutate({
            id: currentTask.id,
            patch: {
              status: targetStatus,
              completedAt: targetStatus === 'done' ? new Date().toISOString() : null,
            },
          })
        }
        return
      }

      // 3. Eisenhower Matrix Drops
      if (viewMode === 'eisenhower') {
        const activeId = String(active.id)
        const currentTask = allTasks.find((t) => t.id === activeId || `task-${t.id}` === activeId)
        if (!currentTask) return

        let targetQuadrant: EisenhowerQuadrant = null
        let isValidDrop = false

        if (overId === 'unassigned') {
          targetQuadrant = null
          isValidDrop = true
        } else if (['do', 'schedule', 'delegate', 'delete'].includes(overId)) {
          targetQuadrant = overId as EisenhowerQuadrant
          isValidDrop = true
        } else {
          const overTask = allTasks.find((t) => t.id === overId)
          if (overTask) {
            targetQuadrant = overTask.quadrant
            isValidDrop = true
          }
        }

        if (isValidDrop && currentTask.quadrant !== targetQuadrant) {
          updateTaskMutation.mutate({
            id: currentTask.id,
            patch: {
              quadrant: targetQuadrant,
            },
          })
        }
        return
      }
    } catch (err) {
      console.error("Error in onDragEnd:", err)
    }
  }

  const handleEditTask = (task: Task) => {
    setTaskToEdit(task)
    setIsModalOpen(true)
  }

  const handleNewTask = () => {
    setTaskToEdit(null)
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[rgba(255,255,255,0.06)]">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="p-2 rounded-xl bg-action/10 text-action">
              <Zap className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-text">Action Hub</h1>
          </div>
          <p className="mt-1 text-sm text-text-muted">
            Execution engine. Organize in Kanban, prioritize in Eisenhower, and block time on the Timeline.
          </p>
        </div>

        {/* View Toggle & New Task */}
        <div className="flex items-center space-x-3">
          {/* View Mode Toggle: 3 Modes */}
          <div className="flex items-center p-1 bg-surface-2 rounded-xl border border-[rgba(255,255,255,0.06)]">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={cn(
                'flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                viewMode === 'kanban'
                  ? 'bg-surface text-action shadow-sm'
                  : 'text-text-muted hover:text-text'
              )}
            >
              <KanbanIcon className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('eisenhower')}
              className={cn(
                'flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                viewMode === 'eisenhower'
                  ? 'bg-surface text-action shadow-sm'
                  : 'text-text-muted hover:text-text'
              )}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Eisenhower</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('timeline')}
              className={cn(
                'flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                viewMode === 'timeline'
                  ? 'bg-surface text-action shadow-sm'
                  : 'text-text-muted hover:text-text'
              )}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Timeline</span>
            </button>
          </div>

          {/* Weekly Review Launcher */}
          <button
            type="button"
            onClick={openWeeklyReview}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-chip font-medium text-xs bg-surface-2 border border-[rgba(255,255,255,0.08)] text-text-muted hover:text-growth hover:border-growth/40 transition-all active:scale-95 shadow-sm"
            title="Launch GTD Weekly Review Wizard"
          >
            <CalendarCheck className="w-3.5 h-3.5 text-growth" />
            <span className="hidden sm:inline">Weekly Review</span>
          </button>

          {/* New Task Button */}
          <button
            type="button"
            onClick={handleNewTask}
            className={cn(
              'flex items-center space-x-1.5 px-3.5 py-2 rounded-chip font-semibold text-xs',
              'bg-action text-black hover:brightness-110 active:scale-95 transition-all shadow-md'
            )}
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* GTD Filter Bar (Visible in Kanban & Eisenhower) */}
      {viewMode !== 'timeline' && (
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
          <span className="flex items-center space-x-1 text-text-faint font-medium pl-1 pr-2 shrink-0">
            <Filter className="w-3.5 h-3.5" />
            <span>GTD:</span>
          </span>

          {[
            { id: 'all', label: 'All Tasks' },
            { id: 'next', label: 'Next Action' },
            { id: 'scheduled', label: 'Scheduled' },
            { id: 'waiting', label: 'Waiting For' },
            { id: 'someday', label: 'Someday' },
          ].map((filter) => {
            const isSelected = selectedGTD === filter.id
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => setSelectedGTD(filter.id as GTDList | 'all')}
                className={cn(
                  'px-3 py-1.5 rounded-chip font-medium whitespace-nowrap transition-colors border',
                  isSelected
                    ? 'bg-action/15 text-action border-action/40 shadow-sm'
                    : 'bg-surface-2 text-text-muted border-[rgba(255,255,255,0.06)] hover:text-text hover:bg-surface'
                )}
              >
                {filter.label}
              </button>
            )
          })}
        </div>
      )}

      {/* Unified DndContext for Kanban, Eisenhower, and Timeline */}
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetectionStrategy}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="card p-6 animate-pulse bg-surface-2/40 h-96" />
            ))}
          </div>
        ) : viewMode === 'timeline' ? (
          <TimelineView
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            isDraggingActive={Boolean(activeTask || activeBlock)}
          />
        ) : viewMode === 'kanban' ? (
          <KanbanBoard tasks={filteredTasks} onEditTask={handleEditTask} />
        ) : (
          <EisenhowerGrid tasks={filteredTasks} onEditTask={handleEditTask} />
        )}

        {/* Global Drag Overlay */}
        <DragOverlay dropAnimation={null}>
          {activeTask ? (
            <TaskCard task={activeTask} isOverlay />
          ) : activeBlock ? (
            <div className="card p-3 bg-surface-2 border border-action/60 shadow-2xl scale-[1.02] rotate-1 ring-1 ring-action/50 text-xs w-64 pointer-events-none">
              <p className="font-semibold text-text truncate">{activeBlock.title}</p>
              <p className="text-[10px] font-mono text-action mt-1 flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>Move time block</span>
              </p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Task Creation / Edit Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        taskToEdit={taskToEdit}
      />

      {/* GTD Weekly Review Wizard */}
      <WeeklyReviewWizard />
    </div>
  )
}
