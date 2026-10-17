import React from 'react'
import { Sparkles, Zap, Activity } from 'lucide-react'
import { useUIStore } from '@/app/store/uiStore'

export const DashboardHeader: React.FC = () => {
  const openQuickCapture = useUIStore((s) => s.openQuickCapture)

  const today = new Date()
  const dateFormatted = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[rgba(255,255,255,0.06)] animate-fade-in">
      <div>
        <div className="flex items-center space-x-2.5 mb-1.5">
          <span className="p-1.5 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.08)] text-white shadow-sm flex items-center justify-center">
            <Activity className="w-4 h-4 text-action" />
          </span>
          <span className="text-xs font-mono text-text-faint tracking-wider uppercase font-semibold">
            {dateFormatted}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text flex items-center space-x-2">
          <span>Command Center</span>
          <Sparkles className="w-5 h-5 text-capital animate-pulse" />
        </h1>
        <p className="mt-1 text-xs text-text-muted max-w-xl">
          Unified synthesis across Action, Growth, Capital, and Knowledge. Your autonomous daily executive overview.
        </p>
      </div>

      {/* Hub Status Pulses & Quick Actions */}
      <div className="flex items-center flex-wrap gap-2.5">
        {/* Hub Pulses */}
        <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-surface-2/80 border border-[rgba(255,255,255,0.06)] text-[11px] font-mono text-text-faint">
          <span className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-action animate-ping" />
            <span className="text-text">Action</span>
          </span>
          <span>·</span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-growth" />
            <span className="text-text">Growth</span>
          </span>
          <span>·</span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-capital" />
            <span className="text-text">Capital</span>
          </span>
          <span>·</span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-knowledge" />
            <span className="text-text">Knowledge</span>
          </span>
        </div>

        {/* Quick Capture Button */}
        <button
          type="button"
          onClick={openQuickCapture}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-action/15 text-action hover:bg-action hover:text-black border border-action/30 transition-all text-xs font-semibold shadow-sm font-mono"
          title="Press 'Q' or click to quick-capture a thought or task"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Quick Capture</span>
          <kbd className="px-1 py-0.2 rounded bg-black/40 border border-action/30 text-[10px]">Q</kbd>
        </button>
      </div>
    </div>
  )
}
