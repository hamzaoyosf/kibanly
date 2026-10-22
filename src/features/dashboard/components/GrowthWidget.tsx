import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Activity, ArrowUpRight, Check, Flame } from 'lucide-react'
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
      className="card p-5 bg-surface border border-border border-t-2 border-t-emerald-400 hover:border-gray-600 hover:shadow-card-hover transition-all flex flex-col justify-between space-y-4"
      data-hub="growth"
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center space-x-2.5">
            <span className="p-2 rounded-lg bg-surface-2 text-emerald-400 border border-border">
              <Activity className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold text-text">Habit Routines & State</h2>
                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-emerald-500/15 text-emerald-400 font-mono font-medium border border-emerald-500/20">
                  {equilibriumScore}% Balanced
                </span>
              </div>
              <p className="text-[11px] text-text-faint font-mono">Personal Growth Hub</p>
            </div>
          </div>
          <Link
            to="/app/growth"
            className="p-1.5 rounded-lg text-text-faint hover:text-text hover:bg-surface-2 transition-colors"
            title="Open Growth Hub"
          >
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Daily Condition Strip */}
        <div className="mt-3.5 p-3 rounded-lg bg-surface-2/40 border border-border flex items-center justify-between text-xs">
          <div>
            <span className="text-text-muted font-mono text-[11px]">DAILY ENERGY AUDIT</span>
            <div className="text-sm font-semibold text-text mt-0.5">
              {todayAudit ? (
                <span className="text-emerald-400 flex items-center space-x-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>Logged ({todayAudit.sleepHours}h sleep • {todayAudit.energy}/5 energy)</span>
                </span>
              ) : (
                <span className="text-text-muted">Not logged yet today</span>
              )}
            </div>
          </div>
          <Link
            to="/app/growth"
            className="text-[11px] font-mono text-emerald-400 hover:underline px-2 py-1 rounded bg-surface-2 border border-border"
          >
            {todayAudit ? 'Review' : 'Log Audit'}
          </Link>
        </div>

        {/* Today's Habits Check-off List */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono text-text-faint">
            <span>DAILY HABITS</span>
            <span>
              {completedTodayCount}/{displayHabits.length} completed
            </span>
          </div>

          <div className="space-y-1.5">
            {displayHabits.length === 0 ? (
              <p className="p-3 rounded-lg bg-surface-2/40 border border-border/50 text-center text-xs text-text-muted font-mono">
                No active habits defined. Create your first routine in Growth Hub.
              </p>
            ) : (
              displayHabits.map((h) => {
                const isDone = todayLogSet.has(h.id)
                return (
                  <div
                    key={h.id}
                    onClick={() => handleToggleHabit(h.id)}
                    className={cn(
                      'flex items-center justify-between p-2.5 rounded-lg border transition-all cursor-pointer group',
                      isDone
                        ? 'bg-emerald-950/20 border-emerald-900/40'
                        : 'bg-surface-2/40 hover:bg-surface-2 border-border'
                    )}
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      <div
                        className={cn(
                          'w-4 h-4 rounded-[4px] border flex items-center justify-center transition-colors shrink-0',
                          isDone
                            ? 'bg-emerald-600 border-emerald-500 text-white'
                            : 'border-border group-hover:border-emerald-500 bg-surface'
                        )}
                      >
                        {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span
                        className={cn(
                          'text-xs truncate transition-all',
                          isDone ? 'line-through text-text-muted' : 'text-text group-hover:text-white'
                        )}
                      >
                        {h.name}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1 font-mono text-[11px] text-text-muted">
                      <Flame className={cn('w-3 h-3', isDone ? 'text-emerald-400' : 'text-text-faint')} />
                      <span>{h.targetPerWeek}d/w</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Footer Deep-Link */}
      <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
        <span className="text-text-faint font-mono text-[11px]">Wellness Radar & Presets</span>
        <Link
          to="/app/growth"
          className="text-emerald-400 hover:underline font-medium flex items-center space-x-1 text-xs font-mono"
        >
          <span>Open Hub</span>
          <span>→</span>
        </Link>
      </div>
    </div>
  )
}
