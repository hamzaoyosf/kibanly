import React, { useState } from 'react'
import { addDays, format, parseISO } from 'date-fns'
import {
  CheckSquare,
  X,
  RefreshCw,
  ArrowRight,
  Layers,
} from 'lucide-react'
import { InboxItem } from '@/data/ports/schemas'
import { useConvertToTask } from './useInbox'
import { cn } from '@/lib/utils'

interface ConvertTaskModalProps {
  item: InboxItem
  isOpen: boolean
  onClose: () => void
}

export const ConvertTaskModal: React.FC<ConvertTaskModalProps> = ({
  item,
  isOpen,
  onClose,
}) => {
  const [title, setTitle] = useState(item.text)
  const [scheduledDate, setScheduledDate] = useState(() => {
    return item.ai?.suggestedDue || format(new Date(), 'yyyy-MM-dd')
  })
  const [enableSrs, setEnableSrs] = useState(false)

  const convertMutation = useConvertToTask()

  if (!isOpen) return null

  // Calculate review dates for live preview
  const baseDate = scheduledDate
    ? scheduledDate.includes('T')
      ? parseISO(scheduledDate)
      : new Date(scheduledDate + 'T00:00:00')
    : new Date()

  const date1 = format(addDays(baseDate, 1), 'MMM d, yyyy')
  const date2 = format(addDays(baseDate, 14), 'MMM d, yyyy')
  const date3 = format(addDays(baseDate, 60), 'MMM d, yyyy')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    convertMutation.mutate(
      {
        item,
        title: title.trim(),
        scheduledDate: scheduledDate || null,
        enableSrs,
      },
      {
        onSuccess: () => {
          onClose()
        },
      }
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="w-full max-w-lg card p-6 bg-surface border border-[rgba(255,255,255,0.12)] shadow-2xl space-y-4"
        data-hub="action"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[rgba(255,255,255,0.06)]">
          <div className="flex items-center space-x-2">
            <CheckSquare className="w-5 h-5 text-action" />
            <h2 className="text-base font-semibold text-text">
              Convert Capture to GTD Task
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-text-muted hover:text-text hover:bg-surface-2 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">
              Task Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Actionable task title..."
              className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.08)] text-sm text-text focus:outline-none focus:border-action/60 font-sans"
              autoFocus
            />
          </div>

          {/* Scheduled Date */}
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">
              Scheduled Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.08)] text-sm text-text focus:outline-none focus:border-action/60 font-mono"
              />
            </div>
          </div>

          {/* SRS Checkbox / Toggle */}
          <div className="p-3.5 rounded-xl border border-[rgba(255,255,255,0.08)] bg-surface-2/40 space-y-2">
            <label className="flex items-center space-x-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={enableSrs}
                onChange={(e) => setEnableSrs(e.target.checked)}
                className="w-4 h-4 rounded border-border-strong text-action focus:ring-action bg-surface cursor-pointer"
              />
              <div className="flex-1 min-w-0">
                <span className="text-xs font-semibold text-text flex items-center space-x-1.5">
                  <RefreshCw className="w-3.5 h-3.5 text-action" />
                  <span>Enable Spaced Repetition (SRS)</span>
                </span>
                <p className="text-[11px] text-text-muted mt-0.5">
                  Automatically schedules 3 spaced review tasks at 24 hours, 2 weeks, and 2 months.
                </p>
              </div>
            </label>

            {/* Live Review Cards Preview when SRS enabled */}
            {enableSrs && (
              <div className="mt-3 pt-3 border-t border-[rgba(255,255,255,0.06)] space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                <p className="text-[10px] font-mono uppercase tracking-wider text-action font-semibold flex items-center space-x-1">
                  <Layers className="w-3 h-3" />
                  <span>Automated SRS Review Schedule:</span>
                </p>

                <div className="space-y-1.5 text-xs font-mono">
                  <div className="p-2 rounded-lg bg-surface/80 border border-[rgba(255,255,255,0.05)] flex items-center justify-between text-text">
                    <span className="truncate pr-2">Parent: {title || 'Task'}</span>
                    <span className="text-[11px] text-text-muted shrink-0">
                      {scheduledDate || 'Today'}
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-action/5 border border-action/20 flex items-center justify-between text-action">
                    <span className="truncate pr-2">
                      1st Review (24h): {title || 'Task'}
                    </span>
                    <span className="text-[11px] shrink-0 font-medium">{date1}</span>
                  </div>

                  <div className="p-2 rounded-lg bg-action/5 border border-action/20 flex items-center justify-between text-action">
                    <span className="truncate pr-2">
                      2nd Review (2 weeks): {title || 'Task'}
                    </span>
                    <span className="text-[11px] shrink-0 font-medium">{date2}</span>
                  </div>

                  <div className="p-2 rounded-lg bg-action/5 border border-action/20 flex items-center justify-between text-action">
                    <span className="truncate pr-2">
                      3rd Review (2 months): {title || 'Task'}
                    </span>
                    <span className="text-[11px] shrink-0 font-medium">{date3}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[rgba(255,255,255,0.06)]">
            <button
              type="button"
              onClick={onClose}
              disabled={convertMutation.isPending}
              className="px-4 py-2 rounded-chip text-xs font-medium text-text-muted hover:text-text hover:bg-surface-2 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!title.trim() || convertMutation.isPending}
              className={cn(
                'flex items-center space-x-1.5 px-4 py-2 rounded-chip text-xs font-semibold',
                'bg-action text-black hover:brightness-110 active:scale-95 transition-all shadow-sm',
                (!title.trim() || convertMutation.isPending) && 'opacity-50 cursor-not-allowed'
              )}
            >
              <span>{enableSrs ? 'Convert with SRS (4 Tasks)' : 'Convert to Task'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
