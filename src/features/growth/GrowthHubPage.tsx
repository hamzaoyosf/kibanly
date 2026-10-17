import React, { useState } from 'react'
import {
  TrendingUp,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { GrowthStatsHeader } from './components/GrowthStatsHeader'
import { HabitTracker } from './components/HabitTracker'
import { EnergyAuditCard } from './components/EnergyAuditCard'
import { WellnessRadar } from './components/WellnessRadar'
import { cn } from '@/lib/utils'
import { formatYYYYMMDD } from '@/lib/wellnessScore'

export const GrowthHubPage: React.FC = () => {
  const [selectedDateObj, setSelectedDateObj] = useState<Date>(() => new Date())
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

  const formattedDate = selectedDateObj.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2" data-hub="growth">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[rgba(255,255,255,0.06)]">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="p-2 rounded-xl bg-growth/10 text-growth">
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

        {/* Date Navigation Bar */}
        <div className="flex items-center space-x-2 p-1.5 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.06)] self-start md:self-auto">
          <button
            type="button"
            onClick={handlePrevDay}
            className="p-1.5 rounded-lg border border-[rgba(255,255,255,0.06)] bg-surface text-text-muted hover:text-text hover:bg-surface-2 transition-colors"
            title="Previous day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center space-x-2 px-2">
            <CalendarIcon className="w-4 h-4 text-growth" />
            <span className="font-mono text-xs font-semibold text-text whitespace-nowrap">
              {formattedDate}
            </span>
            {isToday && (
              <span className="text-[10px] font-mono text-growth uppercase font-semibold px-1.5 py-0.2 rounded bg-growth/10 border border-growth/30">
                Today
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleToday}
            className={cn(
              'px-2.5 py-1 rounded-lg text-xs font-semibold font-mono border transition-all',
              isToday
                ? 'bg-growth/20 text-growth border-growth/40'
                : 'bg-surface text-text-muted border-[rgba(255,255,255,0.06)] hover:text-text'
            )}
          >
            Today
          </button>

          <button
            type="button"
            onClick={handleNextDay}
            className="p-1.5 rounded-lg border border-[rgba(255,255,255,0.06)] bg-surface text-text-muted hover:text-text hover:bg-surface-2 transition-colors"
            title="Next day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
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
    </div>
  )
}
