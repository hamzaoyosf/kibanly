import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { CheckSquare, TrendingUp, Coins, BookOpen, ArrowUpRight } from 'lucide-react'
import { useTasks } from '@/features/action/useTasks'
import { useHabits, useHabitLogs } from '@/features/growth/useHabits'
import { useTransactions } from '@/features/capital/useTransactions'
import { useSubscriptions } from '@/features/capital/useSubscriptions'
import { useNotes } from '@/features/knowledge/useNotes'
import { usePreferencesStore } from '@/app/store/preferencesStore'
import { useExchangeRates } from '@/features/capital/useExchangeRates'
import { calculateNetCash, formatMoney } from '@/lib/money'

export const TopMetricStrip: React.FC = () => {
  const { data: tasks = [] } = useTasks()
  const { data: habits = [] } = useHabits()
  const { data: habitLogs = [] } = useHabitLogs()
  const { data: transactions = [] } = useTransactions('all')
  const { data: subscriptions = [] } = useSubscriptions('all')
  const { data: notes = [] } = useNotes()

  const defaultCurrency = usePreferencesStore((s) => s.defaultCurrency) || 'USD'
  const { convert } = useExchangeRates()

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), [])

  // 1. Action metrics
  const tasksDoneToday = tasks.filter(
    (t) => t.status === 'done' && (t.completedAt?.startsWith(todayStr) || t.updatedAt?.startsWith(todayStr))
  ).length
  const activeNextTasks = tasks.filter((t) => t.status !== 'done')

  // 2. Growth metrics
  const activeHabits = habits.filter((h) => !h.archived)
  const habitsDoneToday = activeHabits.filter((h) =>
    habitLogs.some((l) => l.habitId === h.id && l.date === todayStr && l.done)
  ).length

  // 3. Capital metrics
  const { netCashMinor } = calculateNetCash(transactions, 'all', defaultCurrency, convert)
  const activeSubs = subscriptions.filter((s) => s.status === 'active')

  // 4. Knowledge metrics
  const totalCrossLinks = notes.reduce((sum, n) => sum + (n.linkedNoteIds?.length || 0), 0)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
      {/* 1. Action Hub Card */}
      <Link
        to="/app/action"
        className="card p-4 sm:p-5 bg-surface border border-border border-t-2 border-t-sky-400 hover:border-gray-600 hover:bg-surface-2/40 hover:shadow-card-hover transition-all flex flex-col justify-between min-h-[120px] group cursor-pointer"
        title="Open Action Hub"
      >
        <div className="flex items-center justify-between text-xs text-text-muted">
          <span className="font-semibold text-text flex items-center space-x-2">
            <span className="p-1 rounded bg-sky-950/60 border border-sky-900/60 text-sky-400">
              <CheckSquare className="w-3.5 h-3.5" />
            </span>
            <span>Action Velocity</span>
          </span>
          <ArrowUpRight className="w-4 h-4 text-text-faint group-hover:text-text group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
        </div>
        <div className="mt-3">
          <div className="font-mono text-2xl font-bold text-text tracking-tight">
            {tasksDoneToday} <span className="text-xs font-normal font-sans text-text-muted">completed today</span>
          </div>
          <p className="text-[11px] font-mono text-text-muted mt-1 truncate">
            {activeNextTasks.length} Next Actions pending
          </p>
        </div>
      </Link>

      {/* 2. Growth Hub Card */}
      <Link
        to="/app/growth"
        className="card p-4 sm:p-5 bg-surface border border-border border-t-2 border-t-emerald-400 hover:border-gray-600 hover:bg-surface-2/40 hover:shadow-card-hover transition-all flex flex-col justify-between min-h-[120px] group cursor-pointer"
        title="Open Growth Hub"
      >
        <div className="flex items-center justify-between text-xs text-text-muted">
          <span className="font-semibold text-text flex items-center space-x-2">
            <span className="p-1 rounded bg-emerald-950/60 border border-emerald-900/60 text-emerald-400">
              <TrendingUp className="w-3.5 h-3.5" />
            </span>
            <span>Habits & Routines</span>
          </span>
          <ArrowUpRight className="w-4 h-4 text-text-faint group-hover:text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
        </div>
        <div className="mt-3">
          <div className="font-mono text-2xl font-bold text-emerald-400 tracking-tight">
            {habitsDoneToday} <span className="text-xs font-normal font-sans text-text-muted">/ {activeHabits.length || 0} habits logged</span>
          </div>
          <p className="text-[11px] font-mono text-text-muted mt-1 truncate">
            {activeHabits.length > 0 && habitsDoneToday === activeHabits.length
              ? 'All daily habits logged'
              : `${Math.max(0, activeHabits.length - habitsDoneToday)} remaining today`}
          </p>
        </div>
      </Link>

      {/* 3. Capital Hub Card */}
      <Link
        to="/app/capital"
        className="card p-4 sm:p-5 bg-surface border border-border border-t-2 border-t-amber-400 hover:border-gray-600 hover:bg-surface-2/40 hover:shadow-card-hover transition-all flex flex-col justify-between min-h-[120px] group cursor-pointer"
        title="Open Capital Hub"
      >
        <div className="flex items-center justify-between text-xs text-text-muted">
          <span className="font-semibold text-text flex items-center space-x-2">
            <span className="p-1 rounded bg-amber-950/60 border border-amber-900/60 text-amber-400">
              <Coins className="w-3.5 h-3.5" />
            </span>
            <span>Net Liquidity</span>
          </span>
          <ArrowUpRight className="w-4 h-4 text-text-faint group-hover:text-amber-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
        </div>
        <div className="mt-3">
          <div className="font-mono text-2xl font-bold text-text truncate tracking-tight">
            {formatMoney(netCashMinor, defaultCurrency)}
          </div>
          <p className="text-[11px] font-mono text-text-muted mt-1 truncate">
            {activeSubs.length} active subscription{activeSubs.length === 1 ? '' : 's'}
          </p>
        </div>
      </Link>

      {/* 4. Knowledge Hub Card */}
      <Link
        to="/app/knowledge"
        className="card p-4 sm:p-5 bg-surface border border-border border-t-2 border-t-violet-400 hover:border-gray-600 hover:bg-surface-2/40 hover:shadow-card-hover transition-all flex flex-col justify-between min-h-[120px] group cursor-pointer"
        title="Open Knowledge Hub"
      >
        <div className="flex items-center justify-between text-xs text-text-muted">
          <span className="font-semibold text-text flex items-center space-x-2">
            <span className="p-1 rounded bg-violet-950/60 border border-violet-900/60 text-violet-400">
              <BookOpen className="w-3.5 h-3.5" />
            </span>
            <span>Second Brain</span>
          </span>
          <ArrowUpRight className="w-4 h-4 text-text-faint group-hover:text-violet-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
        </div>
        <div className="mt-3">
          <div className="font-mono text-2xl font-bold text-text tracking-tight">
            {notes.length} <span className="text-xs font-normal font-sans text-text-muted">notes indexed</span>
          </div>
          <p className="text-[11px] font-mono text-text-muted mt-1 truncate">
            {totalCrossLinks} bidirectional link{totalCrossLinks === 1 ? '' : 's'}
          </p>
        </div>
      </Link>
    </div>
  )
}
