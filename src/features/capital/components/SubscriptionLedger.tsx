import React, { useState, useMemo, useRef, useEffect } from 'react'
import {
  CreditCard,
  Plus,
  ExternalLink,
  Trash2,
  Pencil,
  X,
  Clock,
  Sparkles,
  MoreVertical,
} from 'lucide-react'
import {
  Subscription,
  SubscriptionCycle,
  SubscriptionStatus,
  TransactionScope,
} from '@/data/ports/schemas'
import {
  useSubscriptions,
  useCreateSubscription,
  useUpdateSubscription,
  useDeleteSubscription,
} from '../useSubscriptions'
import {
  formatMoney,
  calculateMonthlyEquivalent,
  parseMoneyToMinor,
} from '@/lib/money'
import { usePreferencesStore } from '@/app/store/preferencesStore'
import { useExchangeRates } from '../useExchangeRates'
import { cn } from '@/lib/utils'

interface SubscriptionLedgerProps {
  selectedScope: 'all' | TransactionScope
}

function getDaysUntil(dateStr: string): number {
  const target = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  const diffTime = target.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

interface SubscriptionActionsMenuProps {
  onEdit: () => void
  onDelete: () => void
}

const SubscriptionActionsMenu: React.FC<SubscriptionActionsMenuProps> = ({
  onEdit,
  onDelete,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [openUpward, setOpenUpward] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect()
      if (window.innerHeight - rect.bottom < 110) {
        setOpenUpward(true)
      } else {
        setOpenUpward(false)
      }
    }
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
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

  return (
    <div
      className="relative shrink-0"
      ref={menuRef}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen((prev) => !prev)
        }}
        className={cn(
          'p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-surface transition-colors',
          isOpen && 'bg-surface text-text'
        )}
        aria-label="More options"
        title="More options"
        aria-expanded={isOpen}
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div
          className={cn(
            'absolute right-0 z-30 w-28 py-1 rounded-lg bg-surface border border-border shadow-2xl animate-in fade-in zoom-in-95 duration-100',
            openUpward ? 'bottom-full mb-1' : 'top-full mt-1'
          )}
          role="menu"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => {
              setIsOpen(false)
              onEdit()
            }}
            className="w-full flex items-center space-x-2 px-3 py-1.5 text-xs text-text hover:bg-surface-2 transition-colors text-left"
            role="menuitem"
          >
            <Pencil className="w-3.5 h-3.5 text-text-muted" />
            <span>Edit</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsOpen(false)
              onDelete()
            }}
            className="w-full flex items-center space-x-2 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors text-left"
            role="menuitem"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
            <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  )
}

export const SubscriptionLedger: React.FC<SubscriptionLedgerProps> = ({
  selectedScope,
}) => {
  const { data: subscriptions = [], isLoading } = useSubscriptions(selectedScope)
  const defaultCurrency = usePreferencesStore((s) => s.defaultCurrency) || 'USD'
  const { convert } = useExchangeRates()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingSub, setEditingSub] = useState<Subscription | null>(null)
  const deleteMutation = useDeleteSubscription()
  const updateMutation = useUpdateSubscription()

  // Monthly burn calculation normalized to defaultCurrency using live/cached exchange rates
  const totalMonthlyRunRateMinor = useMemo(() => {
    return subscriptions
      .filter((s) => s.status === 'active')
      .reduce((sum, s) => {
        const monthly = calculateMonthlyEquivalent(s.amountMinor, s.cycle)
        return sum + convert(monthly, s.currency || 'USD', defaultCurrency)
      }, 0)
  }, [subscriptions, defaultCurrency, convert])

  const handleDelete = (id: string) => {
    if (confirm('Cancel / delete this subscription record?')) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div className="card p-5 bg-surface/50 border border-[rgba(255,255,255,0.06)] flex flex-col space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 pb-3 border-b border-border max-w-full">
        <div className="min-w-0">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-surface-2 text-amber-400 border border-border">
              <CreditCard className="w-4 h-4" />
            </span>
            <h2 className="text-base font-semibold text-text">Subscription Ledger</h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
              {subscriptions.length} active
            </span>
          </div>
          <p className="text-xs text-text-muted mt-1 truncate">
            Recurring commitments with renewal countdowns
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 max-w-full">
          {/* Monthly Run Rate Pill */}
          <div className="px-2.5 py-1.5 rounded-lg bg-surface-2 border border-border flex items-center space-x-1.5 text-xs font-mono shrink-0">
            <span className="text-text-muted text-[11px]">Monthly Burn:</span>
            <span className="font-bold text-amber-400">
              {formatMoney(totalMonthlyRunRateMinor, defaultCurrency)}/mo
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className={cn(
              'flex items-center space-x-1.5 px-3 py-1.5 rounded-chip font-bold text-xs shrink-0',
              'bg-amber-400 hover:bg-amber-300 text-gray-950 active:scale-95 transition-all shadow-sm'
            )}
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Sub</span>
          </button>
        </div>
      </div>

      {/* Subscriptions Table / List */}
      <div>
        {isLoading ? (
          <div className="h-40 rounded-xl animate-pulse bg-surface-2/40" />
        ) : subscriptions.length === 0 ? (
          <div className="p-8 text-center text-xs text-text-muted border border-dashed border-border rounded-tile">
            No active subscriptions in this scope.
          </div>
        ) : (
          <div className="space-y-3">
            {subscriptions.map((sub) => {
              const daysUntil = getDaysUntil(sub.nextRenewal)
              const isUrgent = daysUntil >= 0 && daysUntil <= 3
              return (
                <div
                  key={sub.id}
                  className="relative flex flex-col gap-y-3 p-3.5 sm:p-4 rounded-lg bg-surface-2/40 hover:bg-surface-2/70 border border-border/80 hover:border-gray-600 transition-all group shadow-sm"
                >
                  {/* Top Row: Icon + Title + External Link */}
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 rounded-lg bg-surface-2 border border-border text-amber-400 shrink-0">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div className="flex items-center space-x-1.5 min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-text whitespace-normal break-words leading-snug">
                        {sub.name}
                      </h3>
                      {sub.url && (
                        <a
                          href={sub.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-text-muted hover:text-amber-400 transition-colors shrink-0"
                          title="Open website"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Middle Row: Frequency • Category Badge • Type */}
                  <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono text-text-muted">
                    <span className="capitalize">{sub.cycle}</span>
                    <span className="text-text-muted/40">•</span>
                    <span className="px-1.5 py-0.5 rounded bg-surface border border-border text-text-muted text-[11px] capitalize">
                      {sub.category}
                    </span>
                    <span className="text-text-muted/40">•</span>
                    <span className="capitalize text-text-muted/70">
                      {sub.scope}
                    </span>
                  </div>

                  {/* Bottom Row: Renewal Countdown (Left) | Price + 3-Dot Action Menu (Right) */}
                  <div className="flex items-center justify-between gap-3 pt-1 border-t border-border/30">
                    {/* Left side: Renewal Countdown Badge */}
                    <div
                      className={cn(
                        'flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold border shrink-0',
                        isUrgent
                          ? 'bg-red-500/15 text-red-400 border-red-500/40 shadow-sm'
                          : daysUntil < 0
                          ? 'bg-surface-2 text-text-muted border-border'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      )}
                    >
                      <Clock className="w-3 h-3" />
                      <span>
                        {daysUntil < 0
                          ? 'Overdue'
                          : daysUntil === 0
                          ? 'Today'
                          : `in ${daysUntil}d`}
                      </span>
                    </div>

                    {/* Right side: Price Block (USD top, MAD bottom) + 3-Dot Action Menu */}
                    <div className="flex items-center space-x-3 shrink-0">
                      <div className="text-right">
                        <p className="text-xs sm:text-sm font-bold font-mono text-text leading-tight">
                          {formatMoney(sub.amountMinor, sub.currency)}
                        </p>
                        <p className="text-[10px] sm:text-[11px] font-mono text-text-muted leading-tight mt-0.5">
                          {sub.currency !== defaultCurrency
                            ? `~${formatMoney(
                                convert(
                                  calculateMonthlyEquivalent(sub.amountMinor, sub.cycle),
                                  sub.currency,
                                  defaultCurrency
                                ),
                                defaultCurrency
                              )}`
                            : `~${formatMoney(calculateMonthlyEquivalent(sub.amountMinor, sub.cycle), sub.currency)}/mo`}
                        </p>
                      </div>

                      <SubscriptionActionsMenu
                        onEdit={() => setEditingSub(sub)}
                        onDelete={() => handleDelete(sub.id)}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add Subscription Modal */}
      {isAddModalOpen && (
        <AddSubscriptionModal onClose={() => setIsAddModalOpen(false)} />
      )}

      {/* Edit Subscription Modal */}
      {editingSub && (
        <EditSubscriptionModal
          sub={editingSub}
          onClose={() => setEditingSub(null)}
          onSave={(patch) => {
            updateMutation.mutate({ id: editingSub.id, patch })
            setEditingSub(null)
          }}
        />
      )}
    </div>
  )
}

interface AddSubscriptionModalProps {
  onClose: () => void
}

const AddSubscriptionModal: React.FC<AddSubscriptionModalProps> = ({ onClose }) => {
  const [name, setName] = useState('')
  const [amountStr, setAmountStr] = useState('')
  const [cycle, setCycle] = useState<SubscriptionCycle>('monthly')
  const [nextRenewal, setNextRenewal] = useState('')
  const [scope, setScope] = useState<TransactionScope>('business')
  const [category, setCategory] = useState('dev_tools')
  const [url, setUrl] = useState('')

  const createMutation = useCreateSubscription()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const amountMinor = parseMoneyToMinor(amountStr)
    if (!name.trim() || amountMinor <= 0 || !nextRenewal) return

    createMutation.mutate(
      {
        name: name.trim(),
        amountMinor,
        currency: 'USD',
        cycle,
        nextRenewal,
        scope,
        category,
        status: 'active',
        remindDaysBefore: 3,
        url: url.trim() || null,
      },
      {
        onSuccess: () => {
          onClose()
        },
      }
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="w-full max-w-md card p-5 bg-surface border border-[rgba(255,255,255,0.12)] shadow-2xl space-y-4"
        data-hub="capital"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[rgba(255,255,255,0.06)]">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-capital" />
            <h2 className="text-sm font-semibold text-text">New Subscription</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-text-muted hover:text-text hover:bg-surface-2 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-[11px] font-mono text-text-muted mb-1">
              Service / Tool Name
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Vercel, Figma, ChatGPT Plus..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.08)] text-xs text-text focus:outline-none focus:border-capital/60 placeholder:text-text-faint"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-mono text-text-muted mb-1">
                Cost per cycle ($)
              </label>
              <input
                type="text"
                required
                placeholder="20.00"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.08)] font-mono text-sm text-text focus:outline-none focus:border-capital/60"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-text-muted mb-1">
                Billing Cycle
              </label>
              <select
                value={cycle}
                onChange={(e) => setCycle(e.target.value as SubscriptionCycle)}
                className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.08)] text-xs text-text focus:outline-none focus:border-capital/60"
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="quarterly">Quarterly</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-mono text-text-muted mb-1">
                Next Renewal Date
              </label>
              <input
                type="date"
                required
                value={nextRenewal}
                onChange={(e) => setNextRenewal(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.08)] font-mono text-xs text-text focus:outline-none focus:border-capital/60"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-text-muted mb-1">Scope</label>
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value as TransactionScope)}
                className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.08)] text-xs text-text focus:outline-none focus:border-capital/60"
              >
                <option value="business">Business</option>
                <option value="personal">Personal</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-text-muted mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.08)] text-xs text-text focus:outline-none focus:border-capital/60"
            >
              <option value="dev_tools">Developer Tools</option>
              <option value="productivity">Productivity</option>
              <option value="cloud">Cloud / Infrastructure</option>
              <option value="entertainment">Entertainment</option>
              <option value="fitness">Fitness & Health</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-text-muted mb-1">
              Website URL (Optional)
            </label>
            <input
              type="url"
              placeholder="https://..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.08)] text-xs text-text focus:outline-none focus:border-capital/60 placeholder:text-text-faint"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[rgba(255,255,255,0.06)]">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-chip text-text-muted hover:text-text hover:bg-surface-2 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-1.5 rounded-chip bg-capital text-black font-semibold hover:brightness-110 active:scale-95 transition-all shadow-sm"
            >
              Add Subscription
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface EditSubscriptionModalProps {
  sub: Subscription
  onClose: () => void
  onSave: (patch: Partial<Subscription>) => void
}

const EditSubscriptionModal: React.FC<EditSubscriptionModalProps> = ({
  sub,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(sub.name)
  const [amountStr, setAmountStr] = useState((sub.amountMinor / 100).toFixed(2))
  const [cycle, setCycle] = useState<SubscriptionCycle>(sub.cycle)
  const [nextRenewal, setNextRenewal] = useState(sub.nextRenewal)
  const [scope, setScope] = useState<TransactionScope>(sub.scope)
  const [category, setCategory] = useState(sub.category)
  const [status, setStatus] = useState<SubscriptionStatus>(sub.status)
  const [url, setUrl] = useState(sub.url || '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const amountMinor = parseMoneyToMinor(amountStr)
    if (!name.trim() || amountMinor <= 0 || !nextRenewal) return

    onSave({
      name: name.trim(),
      amountMinor,
      cycle,
      nextRenewal,
      scope,
      category,
      status,
      url: url.trim() || null,
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="w-full max-w-md card p-5 bg-surface border border-[rgba(255,255,255,0.12)] shadow-2xl space-y-4"
        data-hub="capital"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[rgba(255,255,255,0.06)]">
          <div className="flex items-center space-x-2">
            <Pencil className="w-4 h-4 text-capital" />
            <h2 className="text-sm font-semibold text-text">Edit Subscription</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-text-muted hover:text-text hover:bg-surface-2 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-[11px] font-mono text-text-muted mb-1">
              Service / Tool Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.08)] text-xs text-text focus:outline-none focus:border-capital/60"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-mono text-text-muted mb-1">
                Cost per cycle ($)
              </label>
              <input
                type="text"
                required
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.08)] font-mono text-sm text-text focus:outline-none focus:border-capital/60"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-text-muted mb-1">
                Billing Cycle
              </label>
              <select
                value={cycle}
                onChange={(e) => setCycle(e.target.value as SubscriptionCycle)}
                className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.08)] text-xs text-text focus:outline-none focus:border-capital/60"
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="quarterly">Quarterly</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-mono text-text-muted mb-1">
                Next Renewal Date
              </label>
              <input
                type="date"
                required
                value={nextRenewal}
                onChange={(e) => setNextRenewal(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.08)] font-mono text-xs text-text focus:outline-none focus:border-capital/60"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-text-muted mb-1">Scope</label>
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value as TransactionScope)}
                className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.08)] text-xs text-text focus:outline-none focus:border-capital/60"
              >
                <option value="business">Business</option>
                <option value="personal">Personal</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-mono text-text-muted mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as SubscriptionStatus)}
                className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.08)] text-xs text-text focus:outline-none focus:border-capital/60"
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="canceled">Canceled</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-text-muted mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.08)] text-xs text-text focus:outline-none focus:border-capital/60"
              >
                <option value="dev_tools">Developer Tools</option>
                <option value="productivity">Productivity</option>
                <option value="cloud">Cloud / Infrastructure</option>
                <option value="entertainment">Entertainment</option>
                <option value="fitness">Fitness & Health</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-text-muted mb-1">
              Website URL (Optional)
            </label>
            <input
              type="url"
              placeholder="https://..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.08)] text-xs text-text focus:outline-none focus:border-capital/60"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[rgba(255,255,255,0.06)]">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-chip text-text-muted hover:text-text hover:bg-surface-2 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-chip bg-capital text-black font-semibold hover:brightness-110 active:scale-95 transition-all shadow-sm"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
