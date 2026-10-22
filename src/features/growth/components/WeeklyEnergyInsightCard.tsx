import React, { useState } from 'react'
import {
  Sparkles,
  Zap,
  Moon,
  Clock,
  RotateCw,
  Cpu,
  Key,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getISOWeek, getYear } from 'date-fns'
import { useEnergyLogs } from '../useEnergyLogs'
import { useHabits, useHabitLogs } from '../useHabits'
import {
  generateWeeklyEnergyInsights,
  isGeminiConfigured,
  GeminiConfigModal,
  AIWeeklyEnergyInsights,
} from '@/services/ai'
import { cn } from '@/lib/utils'

interface WeeklyEnergyInsightCardProps {
  selectedDate: string // YYYY-MM-DD
}

function getImpactBadge(impact: string) {
  switch (impact) {
    case 'high':
      return 'bg-growth/20 text-growth border-growth/40'
    case 'medium':
      return 'bg-action/20 text-action border-action/40'
    default:
      return 'bg-surface-2 text-text-muted border-[rgba(255,255,255,0.08)]'
  }
}

function getCategoryColor(category: string) {
  switch (category) {
    case 'sleep':
      return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
    case 'focus':
      return 'text-action bg-action/10 border-action/20'
    case 'movement':
      return 'text-growth bg-growth/10 border-growth/20'
    case 'equilibrium':
      return 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    default:
      return 'text-text-muted bg-surface-2 border-[rgba(255,255,255,0.08)]'
  }
}

export const WeeklyEnergyInsightCard: React.FC<WeeklyEnergyInsightCardProps> = ({
  selectedDate,
}) => {
  const [isConfigOpen, setConfigOpen] = useState(false)
  const [isForcingRefresh, setForcingRefresh] = useState(false)

  const dateObj = new Date(selectedDate)
  const weekKey = `${getYear(dateObj)}-W${String(getISOWeek(dateObj)).padStart(2, '0')}`

  const { data: energyLogs = [] } = useEnergyLogs()
  const { data: habits = [] } = useHabits()
  const { data: habitLogs = [] } = useHabitLogs()

  // Extract the user's last 7 days of Energy and Habit logs relative to the active date
  const sevenDaysAgo = new Date(dateObj)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
  const minDateStr = sevenDaysAgo.toISOString().slice(0, 10)
  const maxDateStr = dateObj.toISOString().slice(0, 10)

  const last7DaysEnergyLogs = energyLogs.filter((l) => l.date >= minDateStr && l.date <= maxDateStr)
  const last7DaysHabitLogs = habitLogs.filter((l) => l.date >= minDateStr && l.date <= maxDateStr)

  const {
    data: insights,
    isLoading,
    refetch,
    isFetching,
  } = useQuery<AIWeeklyEnergyInsights>({
    queryKey: ['weeklyEnergyInsights', weekKey, last7DaysEnergyLogs.length, last7DaysHabitLogs.length],
    queryFn: async () => {
      return generateWeeklyEnergyInsights({
        weekKey,
        energyLogs: last7DaysEnergyLogs.length > 0 ? last7DaysEnergyLogs : energyLogs.slice(-7),
        habits,
        habitLogs: last7DaysHabitLogs.length > 0 ? last7DaysHabitLogs : habitLogs.slice(-28),
        forceRefresh: isForcingRefresh,
      })
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  })

  const handleManualRefresh = async () => {
    setForcingRefresh(true)
    await refetch()
    setForcingRefresh(false)
  }

  const isGeminiActive = isGeminiConfigured()

  return (
    <div
      className="card p-5 md:p-6 space-y-5 border border-[rgba(255,255,255,0.08)] bg-surface/90 shadow-xl transition-all"
      data-hub="growth"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[rgba(255,255,255,0.06)]">
        <div className="flex items-center space-x-2.5">
          <span className="p-2 rounded-xl bg-growth/15 text-growth border border-growth/30 shadow-sm">
            <Sparkles className="w-5 h-5" />
          </span>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold tracking-tight text-text">
                Weekly Vitality & Energy Insights
              </h2>
              <span className="font-mono text-[10px] text-text-faint px-1.5 py-0.5 rounded bg-surface-2 border border-[rgba(255,255,255,0.06)]">
                {weekKey}
              </span>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              AI-driven synthesis of your energy audits, sleep consistency, and habit discipline.
            </p>
          </div>
        </div>

        {/* Engine Badge & Refresh Button */}
        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setConfigOpen(true)}
            className={cn(
              'flex items-center space-x-1.5 px-2.5 py-1 rounded-chip text-xs font-mono border transition-all',
              isGeminiActive
                ? 'bg-growth/10 border-growth/30 text-growth hover:bg-growth/20'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
            )}
            title="Configure AI Assistant credentials"
          >
            {isGeminiActive ? (
              <>
                <Sparkles className="w-3 h-3" />
                <span>AI Assistant</span>
              </>
            ) : (
              <>
                <Cpu className="w-3 h-3" />
                <span>Private Mode</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isLoading || isFetching}
            className="p-1.5 rounded-lg border border-[rgba(255,255,255,0.08)] bg-surface-2 text-text-muted hover:text-growth hover:border-growth/40 transition-colors"
            title="Regenerate insights"
          >
            <RotateCw
              className={cn('w-3.5 h-3.5', (isLoading || isFetching) && 'animate-spin text-growth')}
            />
          </button>
        </div>
      </div>

      {/* API Key Missing Notice (Placeholder) */}
      {!isGeminiActive && (
        <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-start justify-between gap-3 text-xs">
          <div className="flex items-start space-x-2.5">
            <Key className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
            <div className="space-y-0.5">
              <p className="font-semibold text-amber-300">
                Running in Private Local Mode
              </p>
              <p className="text-amber-300/80 text-[11px] leading-relaxed">
                Connect your AI key to unlock multi-day biometric correlation, chronotype profiling, and personalized habit nudges.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setConfigOpen(true)}
            className="px-2.5 py-1 rounded-lg bg-amber-400 text-black font-semibold text-[11px] hover:brightness-110 shrink-0 shadow-sm"
          >
            Connect AI
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="h-24 bg-surface-2/60 rounded-xl" />
            <div className="h-24 bg-surface-2/60 rounded-xl" />
          </div>
          <div className="h-20 bg-surface-2/40 rounded-xl" />
          <div className="h-28 bg-surface-2/30 rounded-xl" />
        </div>
      ) : insights ? (
        <div className="space-y-5">
          {/* Top KPI Cards: Vitality Score & Peak Focus Window */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Vitality Score */}
            <div className="p-4 rounded-xl bg-surface-2/50 border border-[rgba(255,255,255,0.06)] flex items-center space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-growth/15 border border-growth/30 flex items-center justify-center shrink-0">
                <span className="text-2xl font-black font-mono text-growth">
                  {insights.vitalityScore}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted">
                  Vitality Score
                </span>
                <p className="text-sm font-semibold text-text mt-0.5">
                  {insights.vitalityScore >= 80
                    ? 'High Equilibrium'
                    : insights.vitalityScore >= 60
                    ? 'Moderate Momentum'
                    : 'Recovery Required'}
                </p>
                <div className="mt-1.5 w-28 h-1.5 rounded-full bg-surface-3 overflow-hidden">
                  <div
                    className="h-full bg-growth transition-all duration-500 rounded-full"
                    style={{ width: `${insights.vitalityScore}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Peak Focus Window */}
            <div className="p-4 rounded-xl bg-surface-2/50 border border-[rgba(255,255,255,0.06)] flex items-center space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-action/15 border border-action/30 flex items-center justify-center shrink-0 text-action">
                <Clock className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted">
                  Peak Focus Window
                </span>
                <p className="text-sm font-semibold text-text mt-0.5 truncate">
                  {insights.peakFocusWindow}
                </p>
                <p className="text-[11px] text-text-faint mt-1 flex items-center space-x-1">
                  <Zap className="w-3 h-3 text-action" />
                  <span>Reserve for Q1 & Deep Work</span>
                </p>
              </div>
            </div>
          </div>

          {/* Executive Summary */}
          <div className="p-4 rounded-xl bg-surface-2/30 border border-[rgba(255,255,255,0.06)] space-y-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-growth font-semibold flex items-center space-x-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Weekly Executive Synthesis</span>
            </span>
            <p className="text-sm text-text leading-relaxed">
              {insights.summary}
            </p>
          </div>

          {/* Sleep & Routine Interplay */}
          {insights.sleepHabitCorrelation && (
            <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-start space-x-3 text-xs text-text">
              <Moon className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-semibold text-indigo-300">
                  Circadian & Habit Interplay
                </p>
                <p className="text-text-muted text-[11px] leading-relaxed">
                  {insights.sleepHabitCorrelation}
                </p>
              </div>
            </div>
          )}

          {/* 3 High-Impact Actionable Interventions */}
          <div className="space-y-2.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-text-muted font-semibold flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-growth" />
              <span>Actionable Behavioral Interventions</span>
            </span>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {insights.recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-surface-2/60 border border-[rgba(255,255,255,0.06)] flex flex-col justify-between space-y-2.5 hover:border-[rgba(255,255,255,0.12)] transition-all"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          'text-[9px] font-mono uppercase font-bold px-1.5 py-0.5 rounded border',
                          getCategoryColor(rec.category)
                        )}
                      >
                        {rec.category}
                      </span>
                      <span
                        className={cn(
                          'text-[9px] font-mono uppercase font-bold px-1.5 py-0.5 rounded border',
                          getImpactBadge(rec.impact)
                        )}
                      >
                        {rec.impact} impact
                      </span>
                    </div>
                    <h3 className="text-xs font-semibold text-text leading-tight">
                      {rec.title}
                    </h3>
                    <p className="text-[11px] text-text-muted leading-relaxed">
                      {rec.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-text-muted text-sm border border-dashed border-[rgba(255,255,255,0.08)] rounded-xl">
          No weekly energy insights available yet. Log daily energy audits to generate insights.
        </div>
      )}

      {/* Config Modal */}
      <GeminiConfigModal
        isOpen={isConfigOpen}
        onClose={() => setConfigOpen(false)}
        onSaved={handleManualRefresh}
      />
    </div>
  )
}
