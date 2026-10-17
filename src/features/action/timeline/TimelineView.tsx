import React, { useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import { TimeBlock } from '@/data/ports/schemas'
import { useTasks } from '../useTasks'
import { useTimeBlocks, useDeleteTimeBlock } from '../useTimeBlocks'
import { layoutTimeBlocks } from './layoutBlocks'
import { TimeGrid } from './TimeGrid'
import { UnscheduledTasksSidebar } from './UnscheduledTasksSidebar'
import { EditTimeBlockModal } from './EditTimeBlockModal'
import { cn } from '@/lib/utils'

interface TimelineViewProps {
  selectedDate: Date
  onSelectDate: (date: Date) => void
  isDraggingActive?: boolean
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  selectedDate,
  onSelectDate,
  isDraggingActive = false,
}) => {
  const selectedDateStr = selectedDate.toISOString().slice(0, 10)

  const { data: allTasks = [] } = useTasks()
  const { data: dayBlocks = [], isLoading } = useTimeBlocks(selectedDateStr)
  const deleteBlockMutation = useDeleteTimeBlock()

  const [blockToEdit, setBlockToEdit] = useState<TimeBlock | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // Unscheduled tasks: tasks not currently mapped to a TimeBlock for this selected date
  const scheduledTaskIds = new Set(dayBlocks.map((b) => b.taskId).filter(Boolean))
  const unscheduledTasks = allTasks.filter(
    (t) => t.status !== 'done' && !scheduledTaskIds.has(t.id)
  )

  // Calculate side-by-side positioned blocks with pixel coordinates
  const positionedBlocks = layoutTimeBlocks(dayBlocks)

  // Date Navigation Helpers
  const handlePrevDay = () => {
    const next = new Date(selectedDate)
    next.setDate(next.getDate() - 1)
    onSelectDate(next)
  }

  const handleNextDay = () => {
    const next = new Date(selectedDate)
    next.setDate(next.getDate() + 1)
    onSelectDate(next)
  }

  const handleToday = () => {
    onSelectDate(new Date())
  }

  const formattedDate = selectedDate.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const isToday = selectedDateStr === new Date().toISOString().slice(0, 10)

  const handleOpenEdit = (block: TimeBlock) => {
    setBlockToEdit(block)
    setIsEditModalOpen(true)
  }

  return (
    <div className="space-y-4">
      {/* Date Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-surface/40 border border-[rgba(255,255,255,0.06)]">
        <div className="flex items-center space-x-3">
          <CalendarIcon className="w-5 h-5 text-action" />
          <div>
            <h2 className="text-base font-semibold text-text">{formattedDate}</h2>
            {isToday && (
              <span className="text-[11px] font-mono text-action uppercase tracking-wider">
                Today
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 self-end sm:self-center">
          <button
            type="button"
            onClick={handlePrevDay}
            className="p-1.5 rounded-lg border border-[rgba(255,255,255,0.06)] bg-surface-2 text-text-muted hover:text-text hover:bg-surface transition-colors"
            title="Previous day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleToday}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-semibold font-mono border transition-all',
              isToday
                ? 'bg-action/20 text-action border-action/40'
                : 'bg-surface-2 text-text-muted border-[rgba(255,255,255,0.06)] hover:text-text'
            )}
          >
            Today
          </button>

          <button
            type="button"
            onClick={handleNextDay}
            className="p-1.5 rounded-lg border border-[rgba(255,255,255,0.06)] bg-surface-2 text-text-muted hover:text-text hover:bg-surface transition-colors"
            title="Next day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Grid Area */}
      {isLoading ? (
        <div className="card p-8 animate-pulse bg-surface-2/40 h-[600px]" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5">
          {/* Left: Unscheduled Tasks Sidebar (4 cols on lg) */}
          <div className="lg:col-span-4">
            <UnscheduledTasksSidebar tasks={unscheduledTasks} />
          </div>

          {/* Right: Daily Schedule Grid (8 cols on lg) */}
          <div className="lg:col-span-8">
            <TimeGrid
              selectedDate={selectedDateStr}
              positionedBlocks={positionedBlocks}
              onDeleteBlock={(id) => deleteBlockMutation.mutate(id)}
              onEditBlock={handleOpenEdit}
              isDraggingActive={isDraggingActive}
            />
          </div>
        </div>
      )}

      {/* Edit/Delete TimeBlock Modal */}
      <EditTimeBlockModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        block={blockToEdit}
      />
    </div>
  )
}
