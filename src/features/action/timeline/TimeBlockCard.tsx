import React from 'react'
import { useDraggable } from '@dnd-kit/core'
import { Trash2, Pencil } from 'lucide-react'
import { PositionedTimeBlock } from './layoutBlocks'
import { TimeBlock, TimeBlockCategory } from '@/data/ports/schemas'
import { cn } from '@/lib/utils'

interface TimeBlockCardProps {
  positioned: PositionedTimeBlock
  onDelete?: (id: string) => void
  onEdit?: (block: TimeBlock) => void
  isDropTargetBlocked?: boolean
}

function getCategoryStyles(category: TimeBlockCategory) {
  switch (category) {
    case 'deep_work':
      return {
        border: 'border-l-action',
        bg: 'bg-action/10 hover:bg-action/15',
        text: 'text-action',
      }
    case 'learning':
      return {
        border: 'border-l-knowledge',
        bg: 'bg-knowledge/10 hover:bg-knowledge/15',
        text: 'text-knowledge',
      }
    case 'recovery':
    case 'personal':
      return {
        border: 'border-l-growth',
        bg: 'bg-growth/10 hover:bg-growth/15',
        text: 'text-growth',
      }
    case 'admin':
      return {
        border: 'border-l-capital',
        bg: 'bg-capital/10 hover:bg-capital/15',
        text: 'text-capital',
      }
    case 'meeting':
      return {
        border: 'border-l-[#94A3B8] border-r border-t border-b border-knowledge/30',
        bg: 'bg-surface-2 hover:bg-surface-2/80',
        text: 'text-[#94A3B8]',
      }
    case 'external':
      return {
        border: 'border-l-slate-500',
        bg: 'bg-surface/60',
        text: 'text-text-faint',
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
}) => {
  const { block, topPx, heightPx, leftPct, widthPct } = positioned
  const styles = getCategoryStyles(block.category)

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
        'absolute rounded-xl border border-[rgba(255,255,255,0.08)] border-l-4 p-2 cursor-grab active:cursor-grabbing',
        'backdrop-blur-md shadow-sm transition-all duration-150 group overflow-hidden flex flex-col justify-between select-none',
        styles.border,
        styles.bg,
        isDragging && 'opacity-25 ring-2 ring-action'
      )}
    >
      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold leading-tight truncate text-text">
            {block.title}
          </p>
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
              className="p-1 rounded text-text-muted hover:text-text hover:bg-surface-2 transition-colors"
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

      {heightPx > 40 && (
        <span
          className={cn(
            'self-start uppercase tracking-wider font-mono text-[9px] px-1 py-0.2 rounded',
            styles.text
          )}
        >
          {block.category.replace('_', ' ')}
        </span>
      )}
    </div>
  )
}
