import React from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { AlertCircle, Calendar, Users, Trash2, Inbox } from 'lucide-react'
import { Task } from '@/data/ports/schemas'
import { TaskCard } from './TaskCard'
import { cn } from '@/lib/utils'

interface EisenhowerQuadrantProps {
  id: string
  title: string
  subtitle: string
  icon: React.ReactNode
  accentColor: string
  tasks: Task[]
  onEditTask?: (task: Task) => void
  isTray?: boolean
}

const QuadrantBox: React.FC<EisenhowerQuadrantProps> = ({
  id,
  title,
  subtitle,
  icon,
  accentColor,
  tasks,
  onEditTask,
  isTray = false,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      type: 'quadrant',
      quadrantId: id === 'unassigned' ? null : id,
    },
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col rounded-card bg-surface/50 border border-[rgba(255,255,255,0.06)]',
        isTray ? 'min-h-[200px]' : 'min-h-[380px]',
        'transition-colors duration-150',
        isOver && 'border-action/40 bg-action/[0.02] ring-1 ring-action/20'
      )}
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-[rgba(255,255,255,0.06)]">
        <div className="flex items-center space-x-2.5">
          <span className="shrink-0" style={{ color: accentColor }}>
            {icon}
          </span>
          <div>
            <h3 className="text-sm font-semibold tracking-wide text-text leading-none">{title}</h3>
            <p className="text-[11px] text-text-faint mt-1">{subtitle}</p>
          </div>
        </div>

        <span
          className="px-2 py-0.5 rounded-full font-mono text-xs font-semibold"
          style={{
            backgroundColor: `color-mix(in srgb, ${accentColor} 15%, transparent)`,
            color: accentColor,
          }}
        >
          {tasks.length}
        </span>
      </div>

      {/* Task List Container */}
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div
          className={cn(
            'p-3 flex-1 overflow-y-auto',
            isTray
              ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5'
              : 'flex flex-col space-y-2.5'
          )}
        >
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onEdit={onEditTask} />
          ))}

          {tasks.length === 0 && (
            <div
              className={cn(
                'flex-1 min-h-[90px] flex items-center justify-center rounded-tile text-center px-4',
                isTray && 'col-span-full',
                'border border-dashed border-[rgba(255,255,255,0.08)] text-xs text-text-faint',
                isOver && 'border-action text-action/70 bg-action/5'
              )}
            >
              {isTray
                ? 'All tasks are assigned to a quadrant! Drag tasks here to unassign.'
                : 'Drop tasks into this quadrant'}
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  )
}

interface EisenhowerGridProps {
  tasks: Task[]
  onEditTask?: (task: Task) => void
}

export const EisenhowerGrid: React.FC<EisenhowerGridProps> = ({ tasks, onEditTask }) => {
  const doTasks = tasks.filter((t) => t.quadrant === 'do')
  const scheduleTasks = tasks.filter((t) => t.quadrant === 'schedule')
  const delegateTasks = tasks.filter((t) => t.quadrant === 'delegate')
  const deleteTasks = tasks.filter((t) => t.quadrant === 'delete')
  const unassignedTasks = tasks.filter((t) => !t.quadrant)

  return (
    <div className="space-y-4 lg:space-y-5">
      {/* 2x2 Priority Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
        {/* Q1: Urgent & Important -> Do */}
        <QuadrantBox
          id="do"
          title="Q1: Do"
          subtitle="Urgent & Important — Act immediately"
          icon={<AlertCircle className="w-4 h-4" />}
          accentColor="var(--danger)"
          tasks={doTasks}
          onEditTask={onEditTask}
        />

        {/* Q2: Not Urgent & Important -> Schedule */}
        <QuadrantBox
          id="schedule"
          title="Q2: Schedule"
          subtitle="Not Urgent & Important — Plan for deep work"
          icon={<Calendar className="w-4 h-4" />}
          accentColor="var(--action)"
          tasks={scheduleTasks}
          onEditTask={onEditTask}
        />

        {/* Q3: Urgent & Not Important -> Delegate */}
        <QuadrantBox
          id="delegate"
          title="Q3: Delegate"
          subtitle="Urgent & Not Important — Automate or hand off"
          icon={<Users className="w-4 h-4" />}
          accentColor="var(--capital)"
          tasks={delegateTasks}
          onEditTask={onEditTask}
        />

        {/* Q4: Not Urgent & Not Important -> Delete */}
        <QuadrantBox
          id="delete"
          title="Q4: Eliminate"
          subtitle="Not Urgent & Not Important — Drop or archive"
          icon={<Trash2 className="w-4 h-4" />}
          accentColor="var(--text-faint)"
          tasks={deleteTasks}
          onEditTask={onEditTask}
        />
      </div>

      {/* 5th Droppable Area: Uncategorized / Inbox Tray */}
      <QuadrantBox
        id="unassigned"
        title="Uncategorized / Inbox Tray"
        subtitle="Tasks converted from Inbox or created without a priority quadrant — Drag into a quadrant above"
        icon={<Inbox className="w-4 h-4" />}
        accentColor="var(--action)"
        tasks={unassignedTasks}
        onEditTask={onEditTask}
        isTray
      />
    </div>
  )
}
