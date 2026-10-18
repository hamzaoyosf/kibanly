import React, { useState, useEffect } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  ArrowRightLeft,
  AlertCircle,
  Sparkles,
  CreditCard,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { TimeBlock } from '@/data/ports/schemas'
import { useTasks } from '../useTasks'
import { useSubscriptions } from '@/features/capital/useSubscriptions'
import {
  useTimeBlocks,
  useDeleteTimeBlock,
  useSyncGoogleCalendar,
} from '../useTimeBlocks'
import { layoutTimeBlocks } from './layoutBlocks'
import { TimeGrid } from './TimeGrid'
import { UnscheduledTasksSidebar } from './UnscheduledTasksSidebar'
import { EditTimeBlockModal } from './EditTimeBlockModal'
import {
  CalendarSyncModal,
  isCalendarTokenValid,
  isCalendarTokenExpired,
  isCalendarConfigured,
} from '@/services/calendar'
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
  const { data: allSubscriptions = [] } = useSubscriptions('all')
  const deleteBlockMutation = useDeleteTimeBlock()
  const syncCalendarMutation = useSyncGoogleCalendar()

  const dayRenewals = allSubscriptions.filter(
    (s) => s.status === 'active' && s.nextRenewal === selectedDateStr
  )

  const [blockToEdit, setBlockToEdit] = useState<TimeBlock | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false)

  const isGCalActive = isCalendarTokenValid()
  const isGCalExpired = isCalendarTokenExpired()
  const isGCalSetup = isCalendarConfigured()

  // Inbound sync on mount / date change if Google Calendar token is valid
  useEffect(() => {
    if (isCalendarTokenValid()) {
      syncCalendarMutation.mutate(selectedDateStr)
    }
  }, [selectedDateStr])

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
      {/* Date Header & Navigation & GCal Sync Controls */}
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

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
          {/* Google Calendar Sync Pill */}
          <button
            type="button"
            onClick={() => setIsCalendarModalOpen(true)}
            className={cn(
              'flex items-center space-x-1.5 px-3 py-1.5 rounded-chip text-xs font-mono border transition-all',
              isGCalActive
                ? 'bg-action/10 border-action/30 text-action hover:bg-action/20'
                : isGCalExpired
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                : 'bg-surface-2 border-[rgba(255,255,255,0.08)] text-text-muted hover:text-text'
            )}
            title="Manage Google Calendar 2-Way Sync"
          >
            {isGCalActive ? (
              <>
                <ArrowRightLeft
                  className={cn(
                    'w-3.5 h-3.5',
                    syncCalendarMutation.isPending && 'animate-spin'
                  )}
                />
                <span>GCal Active</span>
              </>
            ) : isGCalExpired ? (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>GCal Expired • Reconnect</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-action" />
                <span>{isGCalSetup ? 'Connect GCal' : 'Setup GCal'}</span>
              </>
            )}
          </button>

          {/* Date Pagination */}
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

      {/* Subscription Renewal Alert for Selected Date */}
      {dayRenewals.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs animate-fadeIn">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-text">
                Scheduled Subscription Renewal{dayRenewals.length > 1 ? 's' : ''} on this day:
              </span>{' '}
              <span className="text-text-muted">
                {dayRenewals
                  .map((r) => `${r.name} ($${(r.amountMinor / 100).toFixed(2)})`)
                  .join(', ')}
              </span>
            </div>
          </div>
          <Link
            to="/capital"
            className="font-mono text-amber-400 hover:text-amber-300 underline underline-offset-2 flex items-center space-x-1"
          >
            <span>Review in Capital Hub →</span>
          </Link>
        </div>
      )}

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

      {/* Google Calendar Sync Modal */}
      <CalendarSyncModal
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
        selectedDate={selectedDateStr}
      />
    </div>
  )
}
