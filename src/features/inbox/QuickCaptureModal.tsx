import React, { useState, useEffect, useRef } from 'react'
import { Sparkles, X, CornerDownLeft } from 'lucide-react'
import { useUIStore } from '@/app/store/uiStore'
import { useCreateInboxItem } from './useInbox'
import { cn } from '@/lib/utils'

export const QuickCaptureModal: React.FC = () => {
  const { isQuickCaptureOpen, closeQuickCapture } = useUIStore()
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const createMutation = useCreateInboxItem()

  useEffect(() => {
    if (isQuickCaptureOpen) {
      setText('')
      // Ensure focus on next frame
      setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
    }
  }, [isQuickCaptureOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isQuickCaptureOpen) {
        closeQuickCapture()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isQuickCaptureOpen, closeQuickCapture])

  if (!isQuickCaptureOpen) return null

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return

    createMutation.mutate({ text: trimmed })
    closeQuickCapture()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 px-4 bg-black/70 backdrop-blur-md transition-opacity animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeQuickCapture()
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-capture-title"
    >
      <div
        className={cn(
          'w-full max-w-xl card p-5 relative border border-[rgba(255,255,255,0.12)]',
          'bg-surface/95 shadow-2xl transition-all duration-200'
        )}
        data-hub="action"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[rgba(255,255,255,0.06)]">
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded-md bg-action/10 text-action">
              <Sparkles className="w-4 h-4" />
            </span>
            <h2 id="quick-capture-title" className="text-sm font-semibold text-text tracking-wide">
              Quick Capture
            </h2>
          </div>
          <button
            type="button"
            onClick={closeQuickCapture}
            className="p-1 text-text-muted hover:text-text rounded-md hover:bg-surface-2 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Text Input */}
        <form onSubmit={handleSubmit} className="mt-3">
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
            placeholder="What's on your mind? (Ideas, tasks, expenses, notes...)"
            className={cn(
              'w-full bg-transparent text-text placeholder:text-text-faint text-base md:text-lg',
              'resize-none focus:outline-none leading-relaxed'
            )}
          />

          {/* Footer Controls */}
          <div className="flex items-center justify-between pt-3 mt-2 border-t border-[rgba(255,255,255,0.06)] text-xs text-text-faint">
            <div className="flex items-center space-x-3">
              <span className="flex items-center space-x-1">
                <kbd className="px-1.5 py-0.5 rounded bg-surface-2 border border-[rgba(255,255,255,0.08)] font-mono text-[10px]">
                  Enter ↵
                </kbd>
                <span>capture</span>
              </span>
              <span className="flex items-center space-x-1">
                <kbd className="px-1.5 py-0.5 rounded bg-surface-2 border border-[rgba(255,255,255,0.08)] font-mono text-[10px]">
                  Shift + Enter
                </kbd>
                <span>line</span>
              </span>
            </div>

            <button
              type="submit"
              disabled={!text.trim() || createMutation.isPending}
              className={cn(
                'flex items-center space-x-1.5 px-3 py-1.5 rounded-chip font-medium text-xs transition-all',
                text.trim()
                  ? 'bg-action text-black hover:brightness-110 active:scale-95 shadow-sm'
                  : 'bg-surface-2 text-text-faint cursor-not-allowed'
              )}
            >
              <span>Capture</span>
              <CornerDownLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
