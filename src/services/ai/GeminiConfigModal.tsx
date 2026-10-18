import React, { useState } from 'react'
import { Sparkles, Key, Check, AlertCircle, X, ExternalLink, Trash2 } from 'lucide-react'
import { getGeminiApiKey, setCustomGeminiApiKey, isGeminiConfigured } from './geminiClient'
import { cn } from '@/lib/utils'

interface GeminiConfigModalProps {
  isOpen: boolean
  onClose: () => void
  onSaved?: () => void
}

export const GeminiConfigModal: React.FC<GeminiConfigModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const currentKey = getGeminiApiKey() || ''
  const [keyInput, setKeyInput] = useState(currentKey)
  const [savedSuccess, setSavedSuccess] = useState(false)
  const isEnvConfigured = !!import.meta.env.VITE_GEMINI_API_KEY && !import.meta.env.VITE_GEMINI_API_KEY.includes('YOUR_')

  if (!isOpen) return null

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setCustomGeminiApiKey(keyInput.trim() || null)
    setSavedSuccess(true)
    setTimeout(() => {
      setSavedSuccess(false)
      onSaved?.()
      onClose()
    }, 800)
  }

  const handleClear = () => {
    setCustomGeminiApiKey(null)
    setKeyInput('')
    onSaved?.()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={cn(
          'w-full max-w-lg card p-6 relative border border-[rgba(255,255,255,0.14)]',
          'bg-surface/95 shadow-2xl space-y-5'
        )}
        data-hub="action"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[rgba(255,255,255,0.08)]">
          <div className="flex items-center space-x-2.5">
            <span className="p-2 rounded-xl bg-action/15 text-action border border-action/30">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-text">
                Gemini AI Configuration
              </h2>
              <p className="text-xs text-text-muted">
                Powers Inbox Auto-Categorization & Growth Vitality Insights
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-text-muted hover:text-text rounded-lg hover:bg-surface-2 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Indicator */}
        <div
          className={cn(
            'p-3.5 rounded-xl border flex items-start space-x-3 text-xs',
            isGeminiConfigured()
              ? 'bg-action/10 border-action/30 text-action'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
          )}
        >
          {isGeminiConfigured() ? (
            <Check className="w-4 h-4 mt-0.5 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          )}
          <div className="space-y-1">
            <p className="font-semibold">
              {isGeminiConfigured()
                ? 'Gemini AI is Connected & Active'
                : 'Offline Heuristic Engine Active'}
            </p>
            <p className="opacity-90 leading-relaxed text-[11px]">
              {isGeminiConfigured()
                ? `Using Google GenAI (gemini-1.5-flash). ${
                    isEnvConfigured ? 'Supplied via .env.local file.' : 'Custom key saved in browser storage.'
                  }`
                : 'Without an API key, OBOiFY runs its offline heuristic parser. Connect your free Google AI Studio key below for high-fidelity reasoning.'}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-mono font-medium text-text-muted mb-1.5">
              GOOGLE AI STUDIO API KEY
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                <Key className="w-4 h-4" />
              </span>
              <input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className={cn(
                  'w-full pl-9 pr-3 py-2.5 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.1)]',
                  'text-text text-sm font-mono placeholder:text-text-faint',
                  'focus:outline-none focus:border-action/60 focus:ring-1 focus:ring-action/60 transition-colors'
                )}
              />
            </div>
          </div>

          {/* Links & Guidance */}
          <div className="flex items-center justify-between text-xs text-text-muted pt-1">
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 text-action hover:underline"
            >
              <span>Get Free API Key on Google AI Studio</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            {keyInput && (
              <button
                type="button"
                onClick={handleClear}
                className="inline-flex items-center space-x-1 text-danger hover:underline text-[11px]"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear Override</span>
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end space-x-2 border-t border-[rgba(255,255,255,0.06)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-chip text-xs font-medium text-text-muted hover:text-text hover:bg-surface-2 transition-colors"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={savedSuccess}
              className={cn(
                'flex items-center space-x-1.5 px-4 py-2 rounded-chip text-xs font-medium',
                'bg-action text-black hover:brightness-110 active:scale-95 transition-all shadow-md'
              )}
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save API Key</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
