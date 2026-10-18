import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Coins, ArrowUpRight, ShieldCheck, Target } from 'lucide-react'
import { useTransactions } from '@/features/capital/useTransactions'
import { useSubscriptions } from '@/features/capital/useSubscriptions'
import { useMilestones } from '@/features/capital/useMilestones'
import {
  calculateNetCash,
  formatMoney,
  calculateMonthlyEquivalent,
  calculateMilestoneEtaMonths,
} from '@/lib/money'

export const CapitalWidget: React.FC = () => {
  const { data: transactions = [] } = useTransactions('all')
  const { data: subscriptions = [] } = useSubscriptions('all')
  const { data: milestones = [] } = useMilestones()

  // Calculate Net Cash via money helper
  const { netCashMinor } = useMemo(() => {
    return calculateNetCash(transactions, 'all')
  }, [transactions])

  // Calculate Total Monthly Subscriptions Burn
  const monthlySubscriptionBurnMinor = useMemo(() => {
    return subscriptions
      .filter((s) => s.status === 'active')
      .reduce((sum, s) => sum + calculateMonthlyEquivalent(s.amountMinor, s.cycle), 0)
  }, [subscriptions])

  // Calculate Total Current Saved in Milestones
  const totalMilestonesSavedMinor = useMemo(() => {
    return milestones.reduce((sum, m) => sum + (m.currentMinor || 0), 0)
  }, [milestones])

  // Safe to Spend = Net Cash - Subscriptions Burn - Milestones Allocated
  const safeToSpendMinor = useMemo(() => {
    return netCashMinor - monthlySubscriptionBurnMinor - totalMilestonesSavedMinor
  }, [netCashMinor, monthlySubscriptionBurnMinor, totalMilestonesSavedMinor])

  // Top Active Milestone
  const topMilestone = useMemo(() => {
    return (
      milestones
        .filter((m) => m && (m.targetMinor || 0) > 0 && (m.currentMinor || 0) < m.targetMinor)
        .sort((a, b) => (b.currentMinor || 0) / b.targetMinor - (a.currentMinor || 0) / a.targetMinor)[0] || null
    )
  }, [milestones])

  const topMilestonePercent = topMilestone && topMilestone.targetMinor > 0
    ? Math.round(((topMilestone.currentMinor || 0) / topMilestone.targetMinor) * 100)
    : 0

  const topMilestoneEta = topMilestone
    ? calculateMilestoneEtaMonths(
        topMilestone.targetMinor,
        topMilestone.currentMinor,
        topMilestone.monthlyContributionMinor
      )
    : null

  return (
    <div
      className="card p-5 bg-surface border border-[rgba(255,255,255,0.06)] hover:border-capital/40 transition-all flex flex-col justify-between space-y-4"
      data-hub="capital"
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[rgba(255,255,255,0.06)]">
          <div className="flex items-center space-x-2.5">
            <span className="p-2 rounded-xl bg-capital/10 text-capital shadow-[0_0_12px_rgba(251,191,36,0.2)]">
              <Coins className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold text-text">Capital & Liquidity</h2>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-capital/15 text-capital font-mono font-medium">
                  {formatMoney(netCashMinor)} Net Cash
                </span>
              </div>
              <p className="text-[11px] text-text-faint font-mono">Capital Hub</p>
            </div>
          </div>
          <Link
            to="/capital"
            className="p-1.5 rounded-lg text-text-faint hover:text-capital hover:bg-surface-2 transition-colors"
            title="Open Capital Hub"
          >
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Safe-to-Spend Proactive Metric */}
        <div className="mt-3.5 p-3.5 rounded-xl bg-capital/5 border border-capital/20 relative overflow-hidden space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-text-muted flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-capital" />
              <span>Safe-to-Spend (Free Cash Flow)</span>
            </span>
            <span className="text-[10px] text-text-faint font-sans">True Liquidity</span>
          </div>

          <div className="flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-capital font-mono tracking-tight drop-shadow-[0_0_12px_rgba(251,191,36,0.3)]">
              {formatMoney(safeToSpendMinor)}
            </span>
          </div>

          {/* Breakdown Pills */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[rgba(255,255,255,0.06)] text-[11px] font-mono">
            <div>
              <span className="text-text-faint block text-[10px]">Monthly Burn:</span>
              <span className="text-danger font-semibold">
                -{formatMoney(monthlySubscriptionBurnMinor)}/mo
              </span>
            </div>
            <div>
              <span className="text-text-faint block text-[10px]">Allocated Savings:</span>
              <span className="text-sky-400 font-semibold">
                -{formatMoney(totalMilestonesSavedMinor)}
              </span>
            </div>
          </div>
        </div>

        {/* Active Milestone Progress */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono text-text-faint">
            <span className="flex items-center space-x-1">
              <Target className="w-3.5 h-3.5 text-capital" />
              <span>TOP ACTIVE MILESTONE</span>
            </span>
            {topMilestone && (
              <span className="text-capital">
                {topMilestonePercent}%
              </span>
            )}
          </div>

          {topMilestone ? (
            <div className="p-3 rounded-xl bg-surface-2/40 border border-[rgba(255,255,255,0.04)] space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-text font-medium truncate font-sans">
                  {topMilestone.name}
                </span>
                <span className="text-text-faint text-[11px] ml-2 shrink-0">
                  {formatMoney(topMilestone.currentMinor)} / {formatMoney(topMilestone.targetMinor)}
                </span>
              </div>

              <div className="w-full h-1.5 rounded-full bg-surface overflow-hidden">
                <div
                  className="h-full rounded-full bg-capital transition-all duration-500 shadow-[0_0_8px_rgba(251,191,36,0.4)]"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(4, topMilestonePercent)
                    )}%`,
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-text-faint">
                <span>
                  Velocity:{' '}
                  {topMilestone.monthlyContributionMinor > 0
                    ? `${formatMoney(topMilestone.monthlyContributionMinor)}/mo`
                    : 'Discretionary'}
                </span>
                <span>
                  ETA:{' '}
                  {topMilestoneEta !== null
                    ? `${topMilestoneEta} mo`
                    : topMilestone.targetDate?.slice(0, 7) || 'Dynamic'}
                </span>
              </div>
            </div>
          ) : (
            <p className="p-3 rounded-xl bg-surface-2/30 text-center text-xs text-text-faint font-mono">
              All milestones achieved.{' '}
              <Link to="/capital" className="text-capital hover:underline">
                Create new milestone →
              </Link>
            </p>
          )}
        </div>
      </div>

      {/* Footer Deep-Link */}
      <div className="pt-3 border-t border-[rgba(255,255,255,0.04)] flex items-center justify-between text-xs">
        <span className="text-text-faint font-mono text-[11px]">Cash Flow & Milestones</span>
        <Link
          to="/capital"
          className="text-capital hover:underline font-medium flex items-center space-x-1 text-xs font-mono"
        >
          <span>Open Hub</span>
          <span>→</span>
        </Link>
      </div>
    </div>
  )
}
