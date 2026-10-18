import React, { useState } from 'react'
import {
  TrendingUp,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import { GrowthStatsHeader } from './components/GrowthStatsHeader'
import { HabitTracker } from './components/HabitTracker'
import { EnergyAuditCard } from './components/EnergyAuditCard'
import { WellnessRadar } from './components/WellnessRadar'
import { WeeklyEnergyInsightCard } from './components/WeeklyEnergyInsightCard'
import { GrowthPresetsModal } from './components/GrowthPresetsModal'
import { cn } from '@/lib/utils'
import { formatYYYYMMDD } from '@/lib/wellnessScore'

export const GrowthHubPage: React.FC = () => {
  const [selectedDateObj, setSelectedDateObj] = useState<Date>(() => new Date())
  const [isPresetsOpen, setIsPresetsOpen] = useState(false)
  const selectedDateStr = formatYYYYMMDD(selectedDateObj)

  const isToday = selectedDateStr === formatYYYYMMDD(new Date())

  const handlePrevDay = () => {
    const next = new Date(selectedDateObj)
    next.setDate(next.getDate() - 1)
    setSelectedDateObj(next)
  }

  const handleNextDay = () => {
    const next = new Date(selectedDateObj)
    next.setDate(next.getDate() + 1)
    setSelectedDateObj(next)
  }

  const handleToday = () => {
    setSelectedDateObj(new Date())
  }

  const formattedDateMobile = selectedDateObj.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

  const formattedDateDesktop = selectedDateObj.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2 w-full max-w-full overflow-x-hidden" data-hub="growth">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="p-2 rounded-xl bg-surface-2 text-emerald-400 border border-border">
              <TrendingUp className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-text">
              Personal Growth Hub
            </h1>
          </div>
          <p className="mt-1 text-sm text-text-muted">
            Condition & habit tracking engine. Maintain daily streaks, conduct energy audits, and optimize lifestyle equilibrium.
          </p>
        </div>

        {/* Header Controls: Date Navigation & Presets Modal Trigger */}
        <div className="flex flex-wrap items-center gap-2 max-w-full w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setIsPresetsOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-surface-2 hover:bg-surface-3 border border-border text-emerald-400 text-xs font-semibold font-mono transition-all shadow-sm shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Presets & Routines</span>
          </button>

          <div className="flex items-center justify-between space-x-1 sm:space-x-1.5 p-1 sm:p-1.5 rounded-xl bg-surface-2 border border-border max-w-full overflow-hidden">
            <button
              type="button"
              onClick={handlePrevDay}
              className="p-1.5 rounded-lg border border-border bg-surface text-text-muted hover:text-text hover:bg-surface-2 transition-colors shrink-0"
              title="Previous day"
            >
              <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            <div className="flex items-center space-x-1.5 px-1 sm:px-2 min-w-0">
              <CalendarIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0 hidden xs:inline-block" />
              <span className="font-mono text-[11px] sm:text-xs font-semibold text-text truncate">
                <span className="sm:hidden">{formattedDateMobile}</span>
                <span className="hidden sm:inline">{formattedDateDesktop}</span>
              </span>
              {isToday && (
                <span className="text-[9px] sm:text-[10px] font-mono text-emerald-400 uppercase font-semibold px-1 py-0.2 rounded bg-emerald-500/10 border border-emerald-500/30 shrink-0">
                  Today
                </span>
              )}
            </div>

            <div className="flex items-center space-x-1 shrink-0">
              <button
                type="button"
                onClick={handleToday}
                className={cn(
                  'px-2 py-1 rounded-lg text-[11px] sm:text-xs font-semibold font-mono border transition-all shrink-0',
                  isToday
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'bg-surface text-text-muted border-border hover:text-text'
                )}
              >
                Today
              </button>

              <button
                type="button"
                onClick={handleNextDay}
                className="p-1.5 rounded-lg border border-border bg-surface text-text-muted hover:text-text hover:bg-surface-2 transition-colors shrink-0"
                title="Next day"
              >
                <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Top Bento Stats Header */}
      <GrowthStatsHeader selectedDate={selectedDateStr} />

      {/* Main Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Daily Habit Tracker (7 cols) */}
        <div className="lg:col-span-7">
          <HabitTracker selectedDate={selectedDateStr} />
        </div>

        {/* Right: Energy Audit & Wellness Radar (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <EnergyAuditCard selectedDate={selectedDateStr} />
          <WellnessRadar selectedDate={selectedDateStr} />
        </div>
      </div>

      {/* Weekly AI Vitality & Energy Insights */}
      <WeeklyEnergyInsightCard selectedDate={selectedDateStr} />

      {/* Growth Presets & Routines Modal */}
      <GrowthPresetsModal
        isOpen={isPresetsOpen}
        onClose={() => setIsPresetsOpen(false)}
        selectedDate={selectedDateStr}
      />
    </div>
  )
}
