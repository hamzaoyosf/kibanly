import React, { useState } from 'react'
import {
  CreditCard,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ExternalLink,
  Check,
  Clock,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useRenewalAlerts, RenewalAlertItem } from '../useRenewalAlerts'
import { cn } from '@/lib/utils'

interface RenewalAlertBannerProps {
  className?: string
}

export const RenewalAlertBanner: React.FC<RenewalAlertBannerProps> = ({
  className,
}) => {
  const {
    items,
    formattedTotalAmount,
    hasRenewals,
    todayCount,
    overdueCount,
    createTaskReminder,
  } = useRenewalAlerts(7)

  const [isExpanded, setIsExpanded] = useState(false)
  const [createdTaskIds, setCreatedTaskIds] = useState<Record<string, boolean>>({})

  if (!hasRenewals) return null

  const handleCreateTask = async (alert: RenewalAlertItem) => {
    try {
      await createTaskReminder.mutateAsync(alert)
      setCreatedTaskIds((prev) => ({ ...prev, [alert.subscription.id]: true }))
    } catch (err) {
      console.error('Failed to create task reminder:', err)
    }
  }

  const isUrgent = todayCount > 0 || overdueCount > 0

  return (
    <div
      className={cn(
        'rounded-2xl border transition-all duration-300',
        isUrgent
          ? 'bg-amber-500/5 border-amber-500/30 hover:border-amber-500/50'
          : 'bg-surface-2/60 border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.14)]',
        'p-3.5 backdrop-blur-md',
        className
      )}
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div
            className={cn(
              'p-2 rounded-xl relative shrink-0 border',
              isUrgent
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : 'bg-capital/10 text-capital border-capital/20'
            )}
          >
            {isUrgent ? (
              <AlertCircle className="w-4 h-4 animate-pulse" />
            ) : (
              <CreditCard className="w-4 h-4" />
            )}
            {isUrgent && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
            )}
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-text">
                Capital Alert
              </span>
              <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-surface border border-[rgba(255,255,255,0.08)] text-text-muted">
                {items.length} {items.length === 1 ? 'Renewal' : 'Renewals'} (Next 7d)
              </span>
              {todayCount > 0 && (
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40">
                  {todayCount} Due Today
                </span>
              )}
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              Total commitments due:{' '}
              <span className="font-mono text-text font-semibold">{formattedTotalAmount}</span>
            </p>
          </div>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center space-x-2">
          <Link
            to="/capital"
            className="hidden sm:flex items-center space-x-1 text-xs font-mono text-capital hover:text-capital/80 px-2 py-1 rounded-lg hover:bg-capital/10 transition-colors"
          >
            <span>Manage</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-surface transition-colors"
            title={isExpanded ? 'Collapse' : 'Expand renewal items'}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Subscription List */}
      {isExpanded && (
        <div className="mt-3.5 pt-3.5 border-t border-[rgba(255,255,255,0.08)] space-y-2 animate-fadeIn">
          {items.map((alert) => {
            const hasTaskCreated = createdTaskIds[alert.subscription.id]

            return (
              <div
                key={alert.subscription.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-surface border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)] transition-all"
              >
                <div className="flex items-center space-x-3">
                  <div className="text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-text">
                        {alert.subscription.name}
                      </span>
                      {alert.subscription.url && (
                        <a
                          href={alert.subscription.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-text-muted hover:text-text"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-[11px] font-mono text-text-muted mt-0.5">
                      <span className="capitalize">{alert.subscription.cycle}</span>
                      <span>•</span>
                      <span>{alert.subscription.category}</span>
                      <span>•</span>
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-text-muted" />
                        <span>{alert.subscription.nextRenewal}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <span className="font-mono text-xs font-semibold text-text">
                      {alert.formattedAmount}
                    </span>
                    <div className="text-[10px] font-mono">
                      {alert.isOverdue ? (
                        <span className="text-red-400 font-semibold">Overdue</span>
                      ) : alert.isToday ? (
                        <span className="text-amber-400 font-semibold">Today</span>
                      ) : (
                        <span className="text-text-muted">In {alert.daysUntilRenewal}d</span>
                      )}
                    </div>
                  </div>

                  {/* Add GTD Task reminder */}
                  <button
                    type="button"
                    disabled={hasTaskCreated || createTaskReminder.isPending}
                    onClick={() => handleCreateTask(alert)}
                    className={cn(
                      'p-1.5 rounded-lg border text-xs font-mono transition-all',
                      hasTaskCreated
                        ? 'bg-growth/20 text-growth border-growth/40'
                        : 'bg-surface-2 text-text-muted hover:text-text hover:bg-white/10 border-[rgba(255,255,255,0.08)]'
                    )}
                    title={hasTaskCreated ? 'Task reminder added' : 'Add to Action Hub tasks'}
                  >
                    {hasTaskCreated ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <div className="flex items-center space-x-1 px-1">
                        <span className="text-[10px] font-semibold">+ Task</span>
                      </div>
                    )}
                  </button>
                </div>
              </div>
            )
          })}

          <div className="flex items-center justify-between pt-1 text-[11px] font-mono text-text-muted">
            <span>Click "+ Task" to schedule review in your Action Hub</span>
            <Link to="/capital" className="text-capital hover:underline">
              View all subscriptions →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
