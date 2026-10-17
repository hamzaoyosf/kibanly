import React, { useMemo } from 'react'
import { Flame, CheckCircle2, Zap, ShieldCheck } from 'lucide-react'
import { useHabits, useHabitLogs } from '../useHabits'
import { useEnergyLogs } from '../useEnergyLogs'
import { calculateCurrentStreak } from '@/lib/streaks'
import { calculateWellnessRadar } from '@/lib/wellnessScore'

interface GrowthStatsHeaderProps {
  selectedDate: string // YYYY-MM-DD
}

export const GrowthStatsHeader: React.FC<GrowthStatsHeaderProps> = ({ selectedDate }) => {
  const { data: habits = [] } = useHabits()
  const { data: habitLogs = [] } = useHabitLogs()
  const { data: energyLogs = [] } = useEnergyLogs()

  const selectedDateObj = useMemo(() => {
    const [y, m, d] = selectedDate.split('-').map(Number)
    return new Date(y, m - 1, d)
  }, [selectedDate])

  // Completed habits for selected date
  const completedTodayCount = useMemo(() => {
    const completedSet = new Set<string>()
    habitLogs.forEach((l) => {
      if (l.date === selectedDate && l.done) {
        completedSet.add(l.habitId)
      }
    })
    return habits.filter((h) => completedSet.has(h.id)).length
  }, [habits, habitLogs, selectedDate])

  // Highest current streak
  const bestCurrentStreak = useMemo(() => {
    let best = 0
    const habitLogsMap = new Map<string, Set<string>>()
    habitLogs.forEach((l) => {
      if (l.done) {
        if (!habitLogsMap.has(l.habitId)) {
          habitLogsMap.set(l.habitId, new Set())
        }
        habitLogsMap.get(l.habitId)!.add(l.date)
      }
    })

    habits.forEach((h) => {
      const dates = habitLogsMap.get(h.id) || new Set<string>()
      const streak = calculateCurrentStreak(dates, h, selectedDateObj)
      if (streak > best) best = streak
    })
    return best
  }, [habits, habitLogs, selectedDateObj])

  // Energy log for selected date
  const todayEnergyLog = useMemo(() => {
    return energyLogs.find((l) => l.date === selectedDate) || null
  }, [energyLogs, selectedDate])

  // Wellness score average
  const wellnessAverage = useMemo(() => {
    const radar = calculateWellnessRadar(energyLogs, habits, habitLogs, selectedDateObj)
    if (radar.length === 0) return 0
    return Math.round(radar.reduce((acc, p) => acc + p.score, 0) / radar.length)
  }, [energyLogs, habits, habitLogs, selectedDateObj])

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
      {/* Tile 1: Completed Habits */}
      <div className="card p-3.5 bg-surface/60 border border-[rgba(255,255,255,0.06)] flex items-center space-x-3">
        <div className="p-2.5 rounded-xl bg-growth/15 text-growth shrink-0">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-mono text-text-muted truncate">Habits Done</p>
          <p className="text-lg font-bold font-mono text-text mt-0.5">
            {completedTodayCount} <span className="text-xs text-text-faint">/ {habits.length}</span>
          </p>
        </div>
      </div>

      {/* Tile 2: Best Streak */}
      <div className="card p-3.5 bg-surface/60 border border-[rgba(255,255,255,0.06)] flex items-center space-x-3">
        <div className="p-2.5 rounded-xl bg-growth/15 text-growth shrink-0">
          <Flame className="w-5 h-5 fill-growth text-growth" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-mono text-text-muted truncate">Top Streak</p>
          <p className="text-lg font-bold font-mono text-growth mt-0.5">
            {bestCurrentStreak} <span className="text-xs text-text-faint">days</span>
          </p>
        </div>
      </div>

      {/* Tile 3: Energy Score */}
      <div className="card p-3.5 bg-surface/60 border border-[rgba(255,255,255,0.06)] flex items-center space-x-3">
        <div className="p-2.5 rounded-xl bg-action/15 text-action shrink-0">
          <Zap className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-mono text-text-muted truncate">Daily Energy</p>
          <p className="text-lg font-bold font-mono text-text mt-0.5">
            {todayEnergyLog ? `${todayEnergyLog.energy}.0` : '—'}{' '}
            <span className="text-xs text-text-faint">/ 5.0</span>
          </p>
        </div>
      </div>

      {/* Tile 4: Wellness Radar Avg */}
      <div className="card p-3.5 bg-surface/60 border border-[rgba(255,255,255,0.06)] flex items-center space-x-3">
        <div className="p-2.5 rounded-xl bg-growth/15 text-growth shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-mono text-text-muted truncate">Equilibrium</p>
          <p className="text-lg font-bold font-mono text-growth mt-0.5">{wellnessAverage}%</p>
        </div>
      </div>
    </div>
  )
}
