import React, { useState } from 'react'
import { Inbox, CheckCircle2, Plus, Sparkles, Archive, Loader2, Cpu } from 'lucide-react'
import { useInbox, useBatchAICategorizeInbox } from './useInbox'
import { InboxRow } from './InboxRow'
import { useUIStore } from '@/app/store/uiStore'
import { GeminiConfigModal, isGeminiConfigured } from '@/services/ai'
import { RenewalAlertBanner } from '@/features/capital/components/RenewalAlertBanner'
import { cn } from '@/lib/utils'

export const InboxPage: React.FC = () => {
  const { data: items = [], isLoading } = useInbox()
  const { openQuickCapture } = useUIStore()
  const [activeTab, setActiveTab] = useState<'unprocessed' | 'processed'>('unprocessed')
  const [isConfigModalOpen, setConfigModalOpen] = useState(false)
  const batchCategorizeMutation = useBatchAICategorizeInbox()

  const unprocessedItems = items.filter((item) => item.status === 'unprocessed')
  const processedItems = items.filter((item) => item.status === 'processed')

  const displayedItems = activeTab === 'unprocessed' ? unprocessedItems : processedItems

  const handleBatchCategorize = () => {
    if (!isGeminiConfigured()) {
      setConfigModalOpen(true)
      return
    }
    const itemsToClassify = unprocessedItems.map((i) => ({ id: i.id, text: i.text }))
    batchCategorizeMutation.mutate(itemsToClassify)
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[rgba(255,255,255,0.06)]">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="p-2 rounded-xl bg-action/10 text-action">
              <Inbox className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-text">
              Global Inbox
            </h1>
          </div>
          <p className="mt-1 text-sm text-text-muted">
            Frictionless capture stream. Clarify thoughts and convert them to GTD tasks.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* AI Connection Status Pill */}
          <button
            type="button"
            onClick={() => setConfigModalOpen(true)}
            className={cn(
              'flex items-center space-x-1.5 px-3 py-1.5 rounded-chip text-xs font-mono border transition-all',
              isGeminiConfigured()
                ? 'bg-action/10 border-action/30 text-action hover:bg-action/20'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
            )}
            title="Click to manage Gemini API credentials"
          >
            {isGeminiConfigured() ? (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Gemini Active</span>
              </>
            ) : (
              <>
                <Cpu className="w-3.5 h-3.5" />
                <span>Offline Engine • Connect AI</span>
              </>
            )}
          </button>

          {/* Capture Action Button */}
          <button
            type="button"
            onClick={openQuickCapture}
            className={cn(
              'flex items-center space-x-2 px-4 py-2 rounded-chip font-medium text-sm',
              'bg-action text-black hover:brightness-110 active:scale-95 transition-all shadow-md'
            )}
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Capture</span>
            <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.5 rounded bg-black/20 text-black font-mono text-[10px]">
              Q
            </kbd>
          </button>
        </div>
      </div>

      {/* Capital Hub Renewal Alerts */}
      <RenewalAlertBanner />

      {/* Tabs & Batch Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2 p-1 bg-surface-2 rounded-xl border border-[rgba(255,255,255,0.06)]">
          <button
            type="button"
            onClick={() => setActiveTab('unprocessed')}
            className={cn(
              'flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              activeTab === 'unprocessed'
                ? 'bg-surface text-text shadow-sm'
                : 'text-text-muted hover:text-text'
            )}
          >
            <Sparkles className="w-3.5 h-3.5 text-action" />
            <span>Unprocessed</span>
            <span className="px-1.5 py-0.2 rounded-full bg-action/20 text-action font-mono text-[10px]">
              {unprocessedItems.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('processed')}
            className={cn(
              'flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              activeTab === 'processed'
                ? 'bg-surface text-text shadow-sm'
                : 'text-text-muted hover:text-text'
            )}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Processed</span>
            <span className="px-1.5 py-0.2 rounded-full bg-surface-2 text-text-muted font-mono text-[10px]">
              {processedItems.length}
            </span>
          </button>
        </div>

        {/* Batch Auto-Sort Button */}
        {activeTab === 'unprocessed' && unprocessedItems.length > 0 && (
          <button
            type="button"
            onClick={handleBatchCategorize}
            disabled={batchCategorizeMutation.isPending}
            className={cn(
              'flex items-center space-x-1.5 px-3 py-1.5 rounded-chip text-xs font-medium',
              'border border-action/30 bg-action/10 text-action hover:bg-action hover:text-black hover:border-transparent',
              'transition-all duration-150 active:scale-95'
            )}
            title="Batch classify all unprocessed items using Gemini AI"
          >
            {batchCategorizeMutation.isPending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Classifying {unprocessedItems.length} items...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Auto-Sort All ({unprocessedItems.length})</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Item List / Loading / Empty State */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="card p-5 animate-pulse bg-surface-2/40 h-20" />
          ))}
        </div>
      ) : displayedItems.length > 0 ? (
        <div className="space-y-3">
          {displayedItems.map((item) => (
            <InboxRow
              key={item.id}
              item={item}
              onOpenGeminiConfig={() => setConfigModalOpen(true)}
            />
          ))}
        </div>
      ) : activeTab === 'unprocessed' ? (
        /* Inbox Zero State */
        <div
          className="card p-10 text-center flex flex-col items-center justify-center space-y-3 border-dashed border-[rgba(255,255,255,0.1)]"
          data-hub="action"
        >
          <div className="w-12 h-12 rounded-full bg-action/10 flex items-center justify-center text-action">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-semibold text-text">Inbox Zero</h2>
          <p className="text-sm text-text-muted max-w-sm">
            All thoughts and captures are processed. Press{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-surface-2 border border-[rgba(255,255,255,0.08)] font-mono text-xs text-text">
              Q
            </kbd>{' '}
            or tap Capture anytime to log a thought.
          </p>
        </div>
      ) : (
        <div className="card p-8 text-center text-text-muted text-sm">
          No processed items yet.
        </div>
      )}

      {/* Gemini Configuration Modal */}
      <GeminiConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setConfigModalOpen(false)}
      />
    </div>
  )
}
