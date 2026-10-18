import React from 'react'
import { formatDistanceToNow } from 'date-fns'
import { CheckSquare, Trash2, ArrowRight, Sparkles, Loader2, Calendar, Target } from 'lucide-react'
import { InboxItem } from '@/data/ports/schemas'
import { useConvertToTask, useDeleteInboxItem, useAICategorizeInboxItem } from './useInbox'
import { isGeminiConfigured } from '@/services/ai'
import { cn } from '@/lib/utils'

interface InboxRowProps {
  item: InboxItem
  onOpenGeminiConfig?: () => void
}

function getCategoryColor(category?: string) {
  switch (category) {
    case 'task':
      return 'text-action border-action/30 bg-action/10'
    case 'habit':
      return 'text-growth border-growth/30 bg-growth/10'
    case 'expense':
      return 'text-capital border-capital/30 bg-capital/10'
    case 'income':
      return 'text-growth border-growth/30 bg-growth/10'
    case 'note':
    case 'reference':
      return 'text-knowledge border-knowledge/30 bg-knowledge/10'
    case 'event':
      return 'text-action border-action/30 bg-action/10'
    default:
      return 'text-text-muted border-[rgba(255,255,255,0.1)] bg-surface-2'
  }
}

export const InboxRow: React.FC<InboxRowProps> = ({ item, onOpenGeminiConfig }) => {
  const convertMutation = useConvertToTask()
  const deleteMutation = useDeleteInboxItem()
  const aiCategorizeMutation = useAICategorizeInboxItem()

  const timeAgo = item.createdAt
    ? formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })
    : ''

  const isProcessed = item.status === 'processed'
  const isPending =
    convertMutation.isPending || deleteMutation.isPending || aiCategorizeMutation.isPending

  const isGeminiModel = item.ai?.model?.includes('gemini')

  const handleAICategorize = () => {
    if (!isGeminiConfigured() && onOpenGeminiConfig) {
      onOpenGeminiConfig()
      return
    }
    aiCategorizeMutation.mutate({ itemId: item.id, text: item.text })
  }

  return (
    <div
      className={cn(
        'group card p-4 md:p-5 transition-all duration-150',
        'hover:border-border-strong hover:bg-surface-2/40',
        isProcessed && 'opacity-60 bg-surface/40'
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        {/* Left: Text & Metadata */}
        <div className="flex-1 min-w-0">
          <p className="text-sm md:text-base text-text leading-relaxed font-normal break-words">
            {item.text}
          </p>

          {/* AI Reasoning Preview */}
          {item.ai?.reasoning && (
            <div className="mt-2 text-xs text-text-muted flex items-start space-x-1.5 bg-surface-2/60 px-2.5 py-1.5 rounded-lg border border-[rgba(255,255,255,0.04)]">
              <Sparkles className="w-3.5 h-3.5 text-action shrink-0 mt-0.5" />
              <p className="italic text-[11px] leading-relaxed">
                {item.ai.reasoning}
              </p>
            </div>
          )}

          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            {/* AI Category & Priority Chip */}
            {item.ai && (
              <span
                className={cn(
                  'inline-flex items-center px-2 py-0.5 rounded-chip text-[11px] font-mono uppercase tracking-wider border',
                  getCategoryColor(item.ai.category)
                )}
              >
                {isGeminiModel && <Sparkles className="w-2.5 h-2.5 mr-1 text-action" />}
                <span>{item.ai.category}</span>
                <span className="mx-1 opacity-50">•</span>
                <span className="capitalize">{item.ai.priority}</span>
              </span>
            )}

            {/* Suggested Quadrant */}
            {item.ai?.suggestedQuadrant && (
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-chip text-[11px] font-mono border border-action/30 bg-action/10 text-action">
                <Target className="w-3 h-3" />
                <span className="uppercase">{item.ai.suggestedQuadrant}</span>
              </span>
            )}

            {/* Suggested Due Date */}
            {item.ai?.suggestedDue && (
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-chip text-[11px] font-mono border border-[rgba(255,255,255,0.08)] bg-surface-2 text-text-muted">
                <Calendar className="w-3 h-3 text-action" />
                <span>Due {item.ai.suggestedDue}</span>
              </span>
            )}

            {/* AI Model Tag */}
            {item.ai?.model && (
              <span className="text-[10px] font-mono text-text-faint px-1.5 py-0.5 rounded bg-surface-2">
                {item.ai.model}
              </span>
            )}

            {/* Time Stamp */}
            <span className="text-[11px] font-mono text-text-faint">
              {timeAgo}
            </span>

            {/* Processed Badge */}
            {isProcessed && item.convertedTo && (
              <span className="text-[11px] font-mono text-action flex items-center space-x-1">
                <CheckSquare className="w-3 h-3" />
                <span>Task created ({item.convertedTo.id.slice(0, 8)})</span>
              </span>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center mt-2 sm:mt-0">
          {!isProcessed && (
            <>
              {/* AI Re-classify button */}
              <button
                type="button"
                onClick={handleAICategorize}
                disabled={isPending}
                className={cn(
                  'flex items-center space-x-1 px-2.5 py-1.5 rounded-chip text-xs font-medium',
                  'border border-[rgba(255,255,255,0.1)] text-text-muted hover:text-action hover:border-action/40 hover:bg-action/10',
                  'transition-all duration-150 active:scale-95'
                )}
                title={
                  isGeminiConfigured()
                    ? 'Classify with Gemini AI'
                    : 'Connect Gemini AI Key'
                }
              >
                {aiCategorizeMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-action" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-action" />
                )}
                <span className="hidden md:inline">
                  {isGeminiModel ? 'Re-analyze' : 'AI Classify'}
                </span>
              </button>

              {/* Convert to Task */}
              <button
                type="button"
                onClick={() => convertMutation.mutate(item)}
                disabled={isPending}
                className={cn(
                  'flex items-center space-x-1.5 px-3 py-1.5 rounded-chip text-xs font-medium',
                  'bg-action/15 text-action border border-action/30 hover:bg-action hover:text-black hover:border-transparent',
                  'transition-all duration-150 active:scale-95'
                )}
                title="Convert this item into a GTD Task"
              >
                <span>Convert</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => deleteMutation.mutate(item.id)}
            disabled={isPending}
            className="p-1.5 rounded-lg text-text-faint hover:text-danger hover:bg-danger/10 transition-colors"
            title="Delete item"
            aria-label="Delete capture"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
