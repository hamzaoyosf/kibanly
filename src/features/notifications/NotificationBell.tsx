import React, { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Bell, ArrowRight, Check, Plus, Loader2, X } from 'lucide-react'
import { useRenewalAlerts, RenewalAlertItem } from '@/features/capital/useRenewalAlerts'
import { cn } from '@/lib/utils'

interface NotificationBellProps {
  placement?: 'sidebar-collapsed' | 'sidebar-expanded' | 'header'
  align?: 'left' | 'right'
  className?: string
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  placement = 'header',
  align = 'right',
  className,
}) => {
  const {
    items,
    todayCount,
    overdueCount,
    formattedTotalAmount,
    createTaskReminder,
  } = useRenewalAlerts(7)

  const [isOpen, setIsOpen] = useState(false)
  const [createdTasks, setCreatedTasks] = useState<Record<string, boolean>>({})
  const containerRef = useRef<HTMLDivElement>(null)

  const totalAlerts = items.length
  const isUrgent = todayCount > 0 || overdueCount > 0

  // Close dropdown on click outside
  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const handleCreateTask = async (alert: RenewalAlertItem) => {
    try {
      await createTaskReminder.mutateAsync(alert)
      setCreatedTasks((prev) => ({ ...prev, [alert.subscription.id]: true }))
    } catch (err) {
      console.error('Failed to create task from notification:', err)
    }
  }

  return (
    <div className={cn('relative', className)} ref={containerRef}>
      {/* Trigger Button */}
      {placement === 'sidebar-expanded' ? (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'w-full flex items-center justify-between h-9 px-3 rounded-lg border text-xs transition-all',
            isOpen
              ? 'bg-surface-2 text-text border-gray-600 shadow-sm'
              : 'bg-surface border-border text-text-muted hover:text-text hover:bg-surface-2 hover:border-gray-600'
          )}
          title="Notifications & Subscription Renewal Alerts"
          aria-expanded={isOpen}
          aria-label="Open notifications"
        >
          <div className="flex items-center space-x-2">
            <span className="relative">
              <Bell className="w-3.5 h-3.5" />
              {totalAlerts > 0 && (
                <span
                  className={cn(
                    'absolute -top-1.5 -right-1.5 w-2 h-2 rounded-full',
                    isUrgent ? 'bg-red-500' : 'bg-emerald-500'
                  )}
                />
              )}
            </span>
            <span>Alerts</span>
          </div>

          {totalAlerts > 0 ? (
            <span
              className={cn(
                'px-1.5 py-0.5 rounded text-[10px] font-mono font-bold leading-none',
                isUrgent ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              )}
            >
              {totalAlerts}
            </span>
          ) : (
            <span className="text-[10px] font-mono text-text-faint">0</span>
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'relative p-2 rounded-lg text-text-muted hover:text-text hover:bg-surface-2 transition-colors',
            isOpen && 'text-text bg-surface-2'
          )}
          title="Notifications & Subscription Renewal Alerts"
          aria-expanded={isOpen}
          aria-label="Open notifications"
        >
          <Bell className="w-4 h-4" />
          {totalAlerts > 0 && (
            <span
              className={cn(
                'absolute top-1 right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full text-[10px] font-mono font-bold leading-none shadow-sm',
                isUrgent ? 'bg-red-500 text-white' : 'bg-emerald-500 text-gray-950'
              )}
            >
              {totalAlerts}
            </span>
          )}
        </button>
      )}

      {/* Notifications Popover */}
      {isOpen && (
        <>
          {/* Mobile Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-black/60 z-40 md:hidden animate-in fade-in duration-150"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          <div
            className={cn(
              'z-50 rounded-xl bg-surface border border-border shadow-2xl animate-in fade-in duration-150',
              // Mobile (< md): Centered viewport modal fixed just below the mobile top bar with safe horizontal margins
              'fixed inset-x-3 top-16 max-w-sm sm:max-w-md mx-auto md:static md:inset-x-auto md:top-auto md:max-w-none',
              // Desktop (>= md) placements:
              placement === 'sidebar-collapsed' && 'md:absolute md:bottom-0 md:left-full md:ml-3.5 md:w-96',
              placement === 'sidebar-expanded' && 'md:absolute md:bottom-full md:left-0 md:mb-2 md:w-80',
              placement === 'header' && (align === 'right' ? 'md:absolute md:top-full md:right-0 md:mt-2 md:w-96' : 'md:absolute md:top-full md:left-0 md:mt-2 md:w-96')
            )}
            role="dialog"
            aria-label="Notifications panel"
            aria-modal="true"
          >
            {/* Popover Header */}
            <div className="flex items-center justify-between p-3.5 border-b border-border">
              <div className="flex items-center space-x-2">
                <span className="p-1 rounded bg-surface-2 text-emerald-400">
                  <Bell className="w-3.5 h-3.5" />
                </span>
                <h3 className="text-xs font-semibold text-text uppercase tracking-wider">
                  Notifications
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                {totalAlerts > 0 ? (
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded text-[10px] font-mono font-semibold',
                      isUrgent
                        ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                        : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    )}
                  >
                    {totalAlerts} Upcoming
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-emerald-400">All Clear</span>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="md:hidden p-1 text-text-muted hover:text-text rounded-md hover:bg-surface-2 transition-colors ml-1"
                  aria-label="Close notifications"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

          {/* Popover Content */}
          <div className="max-h-80 overflow-y-auto divide-y divide-border/60">
            {totalAlerts === 0 ? (
              <div className="py-8 px-4 text-center space-y-2">
                <div className="w-8 h-8 rounded-full bg-surface-2 border border-border flex items-center justify-center mx-auto text-emerald-400">
                  <Check className="w-4 h-4 stroke-[2.5]" />
                </div>
                <p className="text-xs font-medium text-text">All caught up!</p>
                <p className="text-[11px] text-text-muted max-w-[220px] mx-auto">
                  No upcoming subscription renewals or active alerts at this time.
                </p>
              </div>
            ) : (
              items.map((alert) => {
                const isTaskAdded = createdTasks[alert.subscription.id]

                return (
                  <div
                    key={alert.subscription.id}
                    className="p-3.5 hover:bg-surface-2/40 transition-colors space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="text-xs font-semibold text-text truncate">
                            {alert.subscription.name}
                          </p>
                          {alert.isToday && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] font-mono font-bold">
                              Due Today
                            </span>
                          )}
                          {alert.isOverdue && (
                            <span className="px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 border border-red-500/30 text-[9px] font-mono font-bold">
                              Overdue
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] font-mono text-text-muted mt-0.5">
                          Renewal: <span className="text-text">{alert.subscription.nextRenewal}</span>
                          {!alert.isToday && !alert.isOverdue && (
                            <span className="text-text-faint ml-1">
                              (in {alert.daysUntilRenewal}d)
                            </span>
                          )}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono text-xs font-bold text-text">
                          {alert.formattedAmount}
                        </span>
                        <p className="text-[10px] text-text-faint font-mono capitalize">
                          {alert.subscription.cycle}
                        </p>
                      </div>
                    </div>

                    {/* Action button */}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] font-mono text-text-muted">
                        Category: <span className="capitalize">{alert.subscription.category}</span>
                      </span>

                      <button
                        type="button"
                        disabled={isTaskAdded || createTaskReminder.isPending}
                        onClick={() => handleCreateTask(alert)}
                        className={cn(
                          'flex items-center space-x-1 px-2.5 py-1 rounded text-[11px] font-mono transition-all',
                          isTaskAdded
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 cursor-default'
                            : 'bg-surface-2 hover:bg-surface-3 border border-border text-text hover:text-emerald-400 active:scale-95'
                        )}
                        title="Add this renewal as a GTD Next Action in Action Hub"
                      >
                        {createTaskReminder.isPending ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Adding...</span>
                          </>
                        ) : isTaskAdded ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>Task Added</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3 h-3" />
                            <span>Add to Tasks</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Popover Footer */}
          <div className="p-3 border-t border-border flex items-center justify-between text-xs bg-surface-2/30">
            {totalAlerts > 0 ? (
              <span className="text-[11px] font-mono text-text-muted">
                Total due: <span className="text-text font-bold">{formattedTotalAmount}</span>
              </span>
            ) : (
              <span className="text-[11px] font-mono text-text-faint">
                OBOiFY Alerts
              </span>
            )}

            <Link
              to="/app/capital"
              onClick={() => setIsOpen(false)}
              className="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 transition-colors"
            >
              <span>Manage Subscriptions</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </>
    )}
  </div>
  )
}
