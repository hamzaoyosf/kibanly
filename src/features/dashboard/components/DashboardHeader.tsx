import React from 'react'
import { Activity, Search, Plus } from 'lucide-react'
import { useUIStore } from '@/app/store/uiStore'
import { AuthPill } from '@/features/auth/components/AuthPill'

export const DashboardHeader: React.FC = () => {
  const openQuickCapture = useUIStore((s) => s.openQuickCapture)
  const openCommandPalette = useUIStore((s) => s.openCommandPalette)

  const today = new Date()
  const dateFormatted = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
      <div>
        <div className="flex items-center space-x-2.5 mb-1">
          <span className="p-1.5 rounded-lg bg-surface-2 border border-border text-emerald-400 shadow-sm flex items-center justify-center">
            <Activity className="w-3.5 h-3.5" />
          </span>
          <span className="text-xs font-mono text-text-muted uppercase tracking-wider font-semibold">
            {dateFormatted}
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-text">
          Command Deck
        </h1>
        <p className="mt-0.5 text-xs text-text-muted">
          Unified execution console across Action, Growth, Capital, and Knowledge.
        </p>
      </div>

      {/* Quick Actions & Auth */}
      <div className="flex items-center flex-wrap gap-2.5">
        {/* Cloud Auth Status Pill */}
        <AuthPill />

        {/* Command Palette Trigger */}
        <button
          type="button"
          onClick={openCommandPalette}
          className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-surface border border-border text-text-muted hover:text-text hover:bg-surface-2 hover:border-gray-600 transition-all text-xs font-mono shadow-sm"
          title="Search Command Palette (Cmd+K)"
        >
          <Search className="w-3.5 h-3.5 text-text-muted" />
          <span className="hidden sm:inline">Search</span>
          <kbd className="px-1 py-0.2 rounded bg-surface-2 border border-border text-[10px] text-text-faint">
            ⌘K
          </kbd>
        </button>

        {/* Quick Capture Button - Semantic Green */}
        <button
          type="button"
          onClick={openQuickCapture}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all text-xs font-semibold shadow-sm hover:shadow font-mono active:scale-95"
          title="Press 'Q' or click to quick-capture a thought or task"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Capture</span>
          <kbd className="px-1 py-0.2 rounded bg-black/25 text-white/90 text-[10px]">Q</kbd>
        </button>
      </div>
    </div>
  )
}
