import React from 'react'
import { useDraggable } from '@dnd-kit/core'
import { Trash2, Pencil, Calendar, RotateCw, Check } from 'lucide-react'
import { PositionedTimeBlock } from './layoutBlocks'
import { TimeBlock, TimeBlockCategory } from '@/data/ports/schemas'
import { isCalendarTokenValid } from '@/services/calendar'
import { cn } from '@/lib/utils'

interface TimeBlockCardProps {
  positioned: PositionedTimeBlock
  onDelete?: (id: string) => void
  onEdit?: (block: TimeBlock) => void
  isDropTargetBlocked?: boolean
  isSRS?: boolean
}

function getCategoryStyles(category: TimeBlockCategory, isFromGCal: boolean) {
  if (isFromGCal) {
    // Minimalist Dark Gray theme: solid distinct color strip, no glowing borders
    return {
      border: 'border-l-2 border-l-slate-400 border-border',
      bg: 'bg-surface-2 hover:bg-surface-3',
      text: 'text-slate-300',
    }
  }

  switch (category) {
    case 'deep_work':
      return {
        border: 'border-l-4 border-l-action border-border/80',
        bg: 'bg-action/10 hover:bg-action/15',
        text: 'text-action',
      }
    case 'learning':
      return {
        border: 'border-l-4 border-l-knowledge border-border/80',
        bg: 'bg-knowledge/10 hover:bg-knowledge/15',
        text: 'text-knowledge',
      }
    case 'recovery':
    case 'personal':
      return {
        border: 'border-l-4 border-l-growth border-border/80',
        bg: 'bg-growth/10 hover:bg-growth/15',
        text: 'text-growth',
      }
    case 'admin':
      return {
        border: 'border-l-4 border-l-capital border-border/80',
        bg: 'bg-capital/10 hover:bg-capital/15',
        text: 'text-capital',
      }
    case 'meeting':
      return {
        border: 'border-l-4 border-l-[#94A3B8] border-border/80',
        bg: 'bg-surface-2 hover:bg-surface-2/80',
        text: 'text-[#94A3B8]',
      }
    case 'external':
      return {
        border: 'border-l-2 border-l-slate-400 border-border',
        bg: 'bg-surface-2 hover:bg-surface-3',
        text: 'text-slate-300',
      }
  }
}

function formatTime(isoString: string): string {
  const d = new Date(isoString)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
}

export const TimeBlockCard: React.FC<TimeBlockCardProps> = ({
  positioned,
  onDelete,
  onEdit,
  isDropTargetBlocked = false,
  isSRS = false,
}) => {
  const { block, topPx, heightPx, leftPct, widthPct } = positioned
  const isFromGCal = block.source === 'gcal' || block.category === 'external'
  const isGCalActive = isCalendarTokenValid()
  const isQueuedToPush = isGCalActive && !isFromGCal && !block.gcal?.eventId
  const isSyncedToGCal = !isFromGCal && !!block.gcal?.eventId
  const isSRSBlock = Boolean(block.srsGroupId || isSRS)

  const styles = getCategoryStyles(block.category, isFromGCal)

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: block.id,
    data: {
      type: 'TimeBlock',
      block,
    },
  })

  const timeLabel = `${formatTime(block.start)} – ${formatTime(block.end)}`

  return (
    <div
      ref={setNodeRef}
      style={{
        top: `${topPx}px`,
        height: `${heightPx}px`,
        left: `calc(${leftPct}% + 2px)`,
        width: `calc(${widthPct}% - 4px)`,
        pointerEvents: isDragging || isDropTargetBlocked ? 'none' : 'auto',
        zIndex: isDragging ? 30 : isDropTargetBlocked ? 0 : 20,
      }}
      {...attributes}
      {...listeners}
      onClick={() => onEdit?.(block)}
      className={cn(
        'absolute rounded-xl border p-2 cursor-grab active:cursor-grabbing',
        'transition-all duration-150 group overflow-hidden flex flex-col justify-between select-none shadow-sm',
        styles.border,
        styles.bg,
        isFromGCal ? 'bg-surface-2 shadow-none' : 'backdrop-blur-md',
        isDragging && 'opacity-30 ring-1 ring-action'
      )}
    >
      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0 flex-1">
          <div className="flex items-center space-x-1.5 min-w-0">
            {isFromGCal && (
              <span className="p-0.5 rounded bg-surface border border-border text-slate-400 shrink-0">
                <Calendar className="w-3 h-3" />
              </span>
            )}
            {isSRSBlock && (
              <span
                className="p-0.5 rounded bg-action/15 border border-action/30 text-action shrink-0"
                title="Spaced Repetition (SRS)"
              >
                <RotateCw className="w-2.5 h-2.5" />
              </span>
            )}
            <p className="text-xs font-semibold leading-tight truncate text-text">
              {block.title}
            </p>
          </div>
          <p className="text-[10px] font-mono mt-0.5 text-text-muted">
            {timeLabel}
          </p>
        </div>

        {/* Action Controls (Edit & Delete) */}
        <div
          className="flex items-center space-x-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity"
          onPointerDown={(e) => e.stopPropagation()}
        >
          {onEdit && (
            <button
              type="button"
              aria-label="Edit block"
              onClick={(e) => {
                e.stopPropagation()
                onEdit(block)
              }}
              className="p-1 rounded text-text-muted hover:text-text hover:bg-surface transition-colors"
              title="Edit block"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              aria-label="Delete block"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(block.id)
              }}
              className="p-1 rounded text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
              title="Delete block"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {heightPx > 36 && (
        <div className="flex flex-wrap items-center gap-1.5 self-start mt-1">
          {/* Category Pill */}
          <span
            className={cn(
              'uppercase tracking-wider font-mono text-[9px] px-1.5 py-0.2 rounded border border-[rgba(255,255,255,0.06)] bg-surface/80',
              styles.text
            )}
          >
            {block.category.replace('_', ' ')}
          </span>

          {/* GCal External Indicator */}
          {isFromGCal && (
            <span className="font-mono text-[9px] uppercase px-1.5 py-0.2 rounded bg-surface border border-border text-slate-300 font-medium">
              Google Calendar
            </span>
          )}

          {/* GCal Queuing Status Indicator */}
          {isQueuedToPush && (
            <span
              className="inline-flex items-center space-x-1 text-[9px] font-mono text-sky-400 bg-sky-950/60 px-1.5 py-0.2 rounded border border-sky-800/50"
              title="Queued to sync to Google Calendar"
            >
              <RotateCw className="w-2.5 h-2.5 animate-spin" />
              <span>Queued for GCal</span>
            </span>
          )}

          {/* GCal Synced Status Indicator */}
          {isSyncedToGCal && (
            <span
              className="inline-flex items-center space-x-1 text-[9px] font-mono text-emerald-400 bg-emerald-950/50 px-1.5 py-0.2 rounded border border-emerald-800/50"
              title="Synchronized with Google Calendar"
            >
              <Check className="w-2.5 h-2.5" />
              <span>Synced</span>
            </span>
          )}
        </div>
      )}
    </div>
  )
}
