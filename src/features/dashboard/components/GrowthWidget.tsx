import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Activity, ArrowUpRight, Check, Flame, Zap } from 'lucide-react'
import { useHabits, useHabitLogs, useToggleHabitLog } from '@/features/growth/useHabits'
import { useEnergyLogs } from '@/features/growth/useEnergyLogs'
import { calculateEquilibriumScore } from '@/lib/wellnessScore'
import { cn } from '@/lib/utils'

export const GrowthWidget: React.FC = () => {
  const { data: habits = [] } = useHabits()
  const { data: habitLogs = [] } = useHabitLogs()
  const { data: energyLogs = [] } = useEnergyLogs()
  const toggleMutation = useToggleHabitLog()

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), [])

  // Calculate overall equilibrium score (0-100)
  const equilibriumScore = useMemo(() => {
    return calculateEquilibriumScore(energyLogs, habits, habitLogs)
  }, [energyLogs, habits, habitLogs])

  // Today's audit (if logged)
  const todayAudit = useMemo(() => {
    return energyLogs.find((l) => l && l.date === todayStr) || null
  }, [energyLogs, todayStr])

  // Active habit logs for today
  const todayLogSet = useMemo(() => {
    return new Set(
      habitLogs
        .filter((l) => l && l.date === todayStr && l.done)
        .map((l) => l.habitId)
    )
  }, [habitLogs, todayStr])

  const handleToggleHabit = (habitId: string) => {
    toggleMutation.mutate({ habitId, date: todayStr })
  }

  // Habits to display (up to 4 active)
  const displayHabits = habits.slice(0, 4)
  const completedTodayCount = displayHabits.filter((h) => h && todayLogSet.has(h.id)).length

  return (
    <div
      className="card p-5 bg-surface border border-[rgba(255,255,255,0.06)] hover:border-growth/40 transition-all flex flex-col justify-between space-y-4"
      data-hub="growth"
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[rgba(255,255,255,0.06)]">
          <div className="flex items-center space-x-2.5">
            <span className="p-2 rounded-xl bg-growth/10 text-growth shadow-[0_0_12px_rgba(52,245,164,0.2)]">
              <Activity className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold text-text">Equilibrium & Habits</h2>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-growth/15 text-growth font-mono font-medium">
                  {equilibriumScore}% Balanced
                </span>
              </div>
              <p className="text-[11px] text-text-faint font-mono">Growth Hub</p>
            </div>
          </div>
          <Link
            to="/growth"
            className="p-1.5 rounded-lg text-text-faint hover:text-growth hover:bg-surface-2 transition-colors"
            title="Open Growth Hub"
          >
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Equilibrium Gauge Bar */}
        <div className="mt-3.5 p-3 rounded-xl bg-surface-2/40 border border-[rgba(255,255,255,0.04)] space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-text-muted flex items-center space-x-1">
              <Zap className="w-3.5 h-3.5 text-growth" />
              <span>Vitality Equilibrium</span>
            </span>
            <span className="font-bold text-growth">{equilibriumScore}%</span>
          </div>

          <div className="w-full h-2 rounded-full bg-surface overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-growth-dim to-growth transition-all duration-500 shadow-[0_0_8px_rgba(52,245,164,0.4)]"
              style={{ width: `${Math.max(4, equilibriumScore)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-text-faint pt-1">
            <span>Sleep: {todayAudit ? `${todayAudit.sleepHours}h` : 'Pending'}</span>
            <span>Energy: {todayAudit ? `${todayAudit.energy}/5` : '—'}</span>
            <span>Focus: {todayAudit ? `${todayAudit.focus}/5` : '—'}</span>
            <span>Mood: {todayAudit ? `${todayAudit.mood}/5` : '—'}</span>
          </div>
        </div>

        {/* Today's Habits Strip */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono text-text-faint">
            <span className="flex items-center space-x-1">
              <Flame className="w-3.5 h-3.5 text-growth" />
              <span>TODAY&apos;S HABITS</span>
            </span>
            <span>
              {completedTodayCount} of {displayHabits.length} completed
            </span>
          </div>

          {displayHabits.length === 0 ? (
            <p className="p-3 rounded-xl bg-surface-2/30 text-center text-xs text-text-faint font-mono">
              No habits configured yet.{' '}
              <Link to="/growth" className="text-growth hover:underline">
                Create in Growth Hub →
              </Link>
            </p>
          ) : (
            <div className="space-y-1.5">
              {displayHabits.map((h) => {
                const isDone = todayLogSet.has(h.id)
                return (
                  <div
                    key={h.id}
                    onClick={() => handleToggleHabit(h.id)}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-surface-2/40 hover:bg-surface-2/80 border border-[rgba(255,255,255,0.04)] cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      <button
                        type="button"
                        className={cn(
                          'w-4 h-4 rounded flex items-center justify-center transition-all shrink-0',
                          isDone
                            ? 'bg-growth text-black shadow-[0_0_8px_rgba(52,245,164,0.3)]'
                            : 'border border-[rgba(255,255,255,0.2)] bg-surface-2 group-hover:border-growth/60'
                        )}
                      >
                        {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                      </button>
                      <span
                        className={cn(
                          'text-xs truncate transition-all',
                          isDone ? 'line-through text-text-faint' : 'text-text group-hover:text-white'
                        )}
                      >
                        {h.name}
                      </span>
                    </div>

                    <span className="text-[10px] font-mono text-text-faint uppercase px-1.5 py-0.2 rounded bg-surface-2/60 shrink-0 ml-2">
                      {h.category}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer Deep-Link */}
      <div className="pt-3 border-t border-[rgba(255,255,255,0.04)] flex items-center justify-between text-xs">
        <span className="text-text-faint font-mono text-[11px]">5-Axis Wellness Radar</span>
        <Link
          to="/growth"
          className="text-growth hover:underline font-medium flex items-center space-x-1 text-xs font-mono"
        >
          <span>Open Hub</span>
          <span>→</span>
        </Link>
      </div>
    </div>
  )
}
