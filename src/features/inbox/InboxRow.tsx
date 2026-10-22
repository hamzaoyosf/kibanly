import React, { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { CheckSquare, Trash2, ArrowRight, Sparkles, Loader2, Calendar, Target, Clock, Compass } from 'lucide-react'
import { InboxItem } from '@/data/ports/schemas'
import { useConvertToTask, useDeleteInboxItem, useAICategorizeInboxItem } from './useInbox'
import { ConvertTaskModal } from './ConvertTaskModal'
import { isGeminiConfigured } from '@/services/ai'
import { cn } from '@/lib/utils'

interface InboxRowProps {
  item: InboxItem
  onOpenGeminiConfig?: () => void
}

function getHubBadgeColor(hub?: string) {
  switch (hub) {
    case 'Action':
      return 'text-sky-400 bg-sky-950/40 border-sky-800/40'
    case 'Growth':
      return 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40'
    case 'Capital':
      return 'text-amber-400 bg-amber-950/40 border-amber-800/40'
    case 'Knowledge':
      return 'text-purple-400 bg-purple-950/40 border-purple-800/40'
    default:
      return 'text-text-muted bg-surface-2 border-border'
  }
}

function getContextBadgeColor(context?: string) {
  switch (context) {
    case 'Next Action':
      return 'text-emerald-300 bg-emerald-900/30 border-emerald-700/40'
    case 'Waiting For':
      return 'text-amber-300 bg-amber-900/30 border-amber-700/40'
    case 'Scheduled':
      return 'text-sky-300 bg-sky-900/30 border-sky-700/40'
    case 'Someday':
      return 'text-slate-300 bg-slate-900/30 border-slate-700/40'
    default:
      return 'text-text-muted bg-surface-2 border-border'
  }
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
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false)
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
            {/* Structured Hub Badge */}
            {item.ai?.hub && (
              <span
                className={cn(
                  'inline-flex items-center space-x-1 px-2 py-0.5 rounded-chip text-[11px] font-mono font-semibold uppercase tracking-wider border',
                  getHubBadgeColor(item.ai.hub)
                )}
                title={`Target Operating System Hub: ${item.ai.hub}`}
              >
                <Compass className="w-3 h-3 shrink-0" />
                <span>{item.ai.hub}</span>
              </span>
            )}

            {/* Structured GTD Context Badge */}
            {item.ai?.context && (
              <span
                className={cn(
                  'inline-flex items-center px-2 py-0.5 rounded-chip text-[11px] font-mono font-medium border',
                  getContextBadgeColor(item.ai.context)
                )}
                title={`GTD Context: ${item.ai.context}`}
              >
                <span>{item.ai.context}</span>
              </span>
            )}

            {/* Structured Estimated Duration */}
            {(item.ai?.estimatedTime || item.ai?.estimateMin) && (
              <span
                className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-chip text-[11px] font-mono border border-border bg-surface-2 text-text-muted"
                title="Estimated duration"
              >
                <Clock className="w-3 h-3 text-action shrink-0" />
                <span>{item.ai.estimatedTime || `${item.ai.estimateMin}m`}</span>
              </span>
            )}

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
                    ? 'Classify with AI Assistant'
                    : 'Connect AI Assistant Key'
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
                onClick={() => setIsConvertModalOpen(true)}
                disabled={isPending}
                className={cn(
                  'flex items-center space-x-1.5 px-3 py-1.5 rounded-chip text-xs font-medium',
                  'bg-action/15 text-action border border-action/30 hover:bg-action hover:text-black hover:border-transparent',
                  'transition-all duration-150 active:scale-95'
                )}
                title="Convert this item into a GTD Task (with Recall Loop options)"
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

      {/* Convert to Task & SRS Modal */}
      <ConvertTaskModal
        item={item}
        isOpen={isConvertModalOpen}
        onClose={() => setIsConvertModalOpen(false)}
      />
    </div>
  )
}
