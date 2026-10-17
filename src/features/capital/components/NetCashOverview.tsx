import React, { useMemo } from 'react'
import { Wallet, TrendingUp, TrendingDown, Layers, ShieldCheck } from 'lucide-react'
import { Transaction, TransactionScope } from '@/data/ports/schemas'
import { calculateNetCash, formatMoney, calculateMonthlyEquivalent } from '@/lib/money'
import { useSubscriptions } from '../useSubscriptions'
import { useMilestones } from '../useMilestones'
import { cn } from '@/lib/utils'

interface NetCashOverviewProps {
  transactions: Transaction[]
  selectedScope: 'all' | TransactionScope | string
  onSelectScope: (scope: 'all' | TransactionScope) => void
}

export const NetCashOverview: React.FC<NetCashOverviewProps> = ({
  transactions,
  selectedScope,
  onSelectScope,
}) => {
  const { data: subscriptions = [] } = useSubscriptions(selectedScope as any)
  const { data: milestones = [] } = useMilestones()

  const { totalIncomeMinor, totalExpenseMinor, netCashMinor, operatingMarginPercent } =
    calculateNetCash(transactions, selectedScope)

  const isPositiveNet = netCashMinor >= 0

  // Total monthly subscriptions burn for active subscriptions in current scope
  const monthlySubscriptionBurnMinor = useMemo(() => {
    return subscriptions
      .filter((s) => s.status === 'active')
      .reduce((sum, s) => sum + calculateMonthlyEquivalent(s.amountMinor, s.cycle), 0)
  }, [subscriptions])

  // Total currently saved in milestones in current scope
  const milestonesSavedMinor = useMemo(() => {
    const targetScope = (selectedScope || 'all').toLowerCase()
    return milestones
      .filter(
        (m) =>
          targetScope === 'all' ||
          (m.scope || 'personal').toLowerCase() === targetScope
      )
      .reduce((sum, m) => sum + (m.currentMinor || 0), 0)
  }, [milestones, selectedScope])

  // Safe to Spend = (Net Cash) - (Total Monthly Subscriptions Burn) - (Total Current Saved in Milestones)
  const safeToSpendMinor =
    netCashMinor - monthlySubscriptionBurnMinor - milestonesSavedMinor
  const isSafePositive = safeToSpendMinor >= 0

  return (
    <div className="space-y-3">
      {/* Scope Filter Bar */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center space-x-1.5 p-1 rounded-xl bg-surface-2/80 border border-[rgba(255,255,255,0.06)] text-xs font-mono">
          <span className="flex items-center space-x-1 px-2 text-text-faint font-sans text-[11px]">
            <Layers className="w-3.5 h-3.5" />
            <span>Scope:</span>
          </span>
          {[
            { id: 'all', label: 'All Capital' },
            { id: 'business', label: 'Business' },
            { id: 'personal', label: 'Personal' },
          ].map((scope) => {
            const isSelected = (selectedScope || 'all').toLowerCase() === scope.id
            return (
              <button
                key={scope.id}
                type="button"
                onClick={() => onSelectScope(scope.id as 'all' | TransactionScope)}
                className={cn(
                  'px-3 py-1 rounded-lg font-medium transition-all text-xs font-sans',
                  isSelected
                    ? 'bg-capital/20 text-capital border border-capital/40 shadow-[0_0_10px_rgba(251,191,36,0.15)] font-semibold'
                    : 'text-text-muted hover:text-text hover:bg-surface'
                )}
              >
                {scope.label}
              </button>
            )
          })}
        </div>

        {/* Operating Margin Pill */}
        <div className="hidden sm:flex items-center space-x-2 text-xs font-mono">
          <span className="text-text-faint text-[11px]">Net Margin:</span>
          <span
            className={cn(
              'px-2.5 py-0.5 rounded-full font-bold border',
              isPositiveNet
                ? 'bg-growth/15 text-growth border-growth/30'
                : 'bg-danger/15 text-danger border-danger/30'
            )}
          >
            {operatingMarginPercent}%
          </span>
        </div>
      </div>

      {/* 3 Bento Stat Tiles (SRS §3.7.6 S x 3) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Tile 1: Net Cash / Balance + Safe-to-Spend Metric */}
        <div className="card p-4 bg-surface/60 border border-[rgba(255,255,255,0.06)] flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3.5">
              <div className="p-3 rounded-2xl bg-capital/15 text-capital shrink-0 shadow-[0_0_12px_rgba(251,191,36,0.2)]">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-mono text-text-muted">Net Cash Flow</p>
                <p
                  className={cn(
                    'text-xl sm:text-2xl font-bold font-mono tracking-tight mt-0.5',
                    isPositiveNet ? 'text-capital' : 'text-danger'
                  )}
                >
                  {formatMoney(netCashMinor)}
                </p>
              </div>
            </div>
            <span
              className={cn(
                'px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase self-start',
                isPositiveNet
                  ? 'bg-capital/10 text-capital border border-capital/20'
                  : 'bg-danger/10 text-danger border border-danger/20'
              )}
            >
              {isPositiveNet ? 'Surplus' : 'Deficit'}
            </span>
          </div>

          {/* Safe-to-Spend Sub-Metric (PRD Proactive Liquidity Model) */}
          <div className="pt-2.5 border-t border-[rgba(255,255,255,0.06)] flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <ShieldCheck
                className={cn('w-4 h-4', isSafePositive ? 'text-growth' : 'text-danger')}
              />
              <div>
                <p className="text-xs font-semibold text-text flex items-center space-x-1">
                  <span>Safe to Spend</span>
                  <span className="text-[10px] font-mono text-text-faint font-normal">
                    (Free Cash Flow)
                  </span>
                </p>
                <p className="text-[10px] text-text-faint font-mono">
                  after subs & savings
                </p>
              </div>
            </div>
            <div className="text-right">
              <span
                className={cn(
                  'text-base font-bold font-mono tracking-tight',
                  isSafePositive ? 'text-growth' : 'text-danger'
                )}
              >
                {formatMoney(safeToSpendMinor)}
              </span>
              <p className="text-[9px] font-mono text-text-muted">
                {isSafePositive ? 'True liquidity' : 'Deficit risk'}
              </p>
            </div>
          </div>
        </div>

        {/* Tile 2: Total Income */}
        <div className="card p-4 bg-surface/60 border border-[rgba(255,255,255,0.06)] flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3.5">
              <div className="p-3 rounded-2xl bg-growth/15 text-growth shrink-0 shadow-[0_0_12px_rgba(52,245,164,0.15)]">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-mono text-text-muted">Total Inflows</p>
                <p className="text-xl sm:text-2xl font-bold font-mono text-growth tracking-tight mt-0.5">
                  {formatMoney(totalIncomeMinor)}
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono text-growth bg-growth/10 border border-growth/20 self-start">
              Revenue
            </span>
          </div>

          <div className="pt-2.5 border-t border-[rgba(255,255,255,0.06)] flex items-center justify-between text-[11px] font-mono">
            <span className="text-text-faint">Operating Margin:</span>
            <span className={cn('font-bold', isPositiveNet ? 'text-growth' : 'text-danger')}>
              {operatingMarginPercent}%
            </span>
          </div>
        </div>

        {/* Tile 3: Total Expenses */}
        <div className="card p-4 bg-surface/60 border border-[rgba(255,255,255,0.06)] flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3.5">
              <div className="p-3 rounded-2xl bg-danger/15 text-danger shrink-0 shadow-[0_0_12px_rgba(251,113,133,0.15)]">
                <TrendingDown className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-mono text-text-muted">Total Outflows</p>
                <p className="text-xl sm:text-2xl font-bold font-mono text-danger tracking-tight mt-0.5">
                  {formatMoney(totalExpenseMinor)}
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono text-danger bg-danger/10 border border-danger/20 self-start">
              Burn
            </span>
          </div>

          <div className="pt-2.5 border-t border-[rgba(255,255,255,0.06)] flex items-center justify-between text-[11px] font-mono">
            <span className="text-text-faint">Monthly Sub Burn:</span>
            <span className="font-bold text-capital">
              {formatMoney(monthlySubscriptionBurnMinor)}/mo
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
