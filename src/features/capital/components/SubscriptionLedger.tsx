import React, { useState, useMemo } from 'react'
import {
  CreditCard,
  Plus,
  ExternalLink,
  Trash2,
  Pencil,
  X,
  Clock,
  Sparkles,
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

export const SubscriptionLedger: React.FC<SubscriptionLedgerProps> = ({
  selectedScope,
}) => {
  const { data: subscriptions = [], isLoading } = useSubscriptions(selectedScope)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingSub, setEditingSub] = useState<Subscription | null>(null)
  const deleteMutation = useDeleteSubscription()
  const updateMutation = useUpdateSubscription()

  // Monthly burn calculation
  const totalMonthlyRunRateMinor = useMemo(() => {
    return subscriptions
      .filter((s) => s.status === 'active')
      .reduce((sum, s) => sum + calculateMonthlyEquivalent(s.amountMinor, s.cycle), 0)
  }, [subscriptions])

  const handleDelete = (id: string) => {
    if (confirm('Cancel / delete this subscription record?')) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div className="card p-5 bg-surface/50 border border-[rgba(255,255,255,0.06)] flex flex-col space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[rgba(255,255,255,0.06)]">
        <div>
          <div className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5 text-capital" />
            <h2 className="text-base font-semibold text-text">Subscription Ledger</h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-semibold bg-capital/15 text-capital border border-capital/30">
              {subscriptions.length} active
            </span>
          </div>
          <p className="text-xs text-text-faint mt-1">
            Recurring commitments with renewal countdowns and run-rate projections
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Monthly Run Rate Pill */}
          <div className="px-3 py-1.5 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.06)] flex items-center space-x-2 text-xs font-mono">
            <span className="text-text-faint text-[11px]">Monthly Burn:</span>
            <span className="font-bold text-capital">
              {formatMoney(totalMonthlyRunRateMinor)}/mo
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className={cn(
              'flex items-center space-x-1.5 px-3 py-1.5 rounded-chip font-semibold text-xs',
              'bg-capital text-black hover:brightness-110 active:scale-95 transition-all shadow-sm'
            )}
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Sub</span>
          </button>
        </div>
      </div>

      {/* Subscriptions Table / List */}
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="h-40 rounded-xl animate-pulse bg-surface-2/40" />
        ) : subscriptions.length === 0 ? (
          <div className="p-8 text-center text-xs text-text-faint border border-dashed border-[rgba(255,255,255,0.08)] rounded-tile">
            No active subscriptions in this scope.
          </div>
        ) : (
          <div className="divide-y divide-[rgba(255,255,255,0.04)]">
            {subscriptions.map((sub) => {
              const daysUntil = getDaysUntil(sub.nextRenewal)
              const isUrgent = daysUntil >= 0 && daysUntil <= 3
              return (
                <div
                  key={sub.id}
                  className="flex items-center justify-between py-3 px-1.5 hover:bg-surface-2/30 rounded-lg transition-colors group"
                >
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className="p-2 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.06)] text-capital shrink-0">
                      <CreditCard className="w-4 h-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-semibold text-text truncate">{sub.name}</p>
                        {sub.url && (
                          <a
                            href={sub.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-text-faint hover:text-capital transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 mt-1 text-[10px] font-mono">
                        <span className="capitalize text-text-muted">{sub.cycle}</span>
                        <span className="text-text-faint">•</span>
                        <span className="px-1.5 py-0.2 rounded bg-surface-2 border border-[rgba(255,255,255,0.06)] text-text-muted capitalize">
                          {sub.category}
                        </span>
                        <span className="capitalize text-text-faint">{sub.scope}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0 pl-3">
                    {/* Renewal Countdown Badge */}
                    <div
                      className={cn(
                        'flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-mono font-semibold border',
                        isUrgent
                          ? 'bg-danger/15 text-danger border-danger/40 shadow-[0_0_8px_rgba(251,113,133,0.2)]'
                          : daysUntil < 0
                          ? 'bg-surface-2 text-text-faint border-[rgba(255,255,255,0.06)]'
                          : 'bg-capital/10 text-capital border-capital/20'
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

                    {/* Amount */}
                    <div className="text-right">
                      <p className="text-sm font-bold font-mono text-text">
                        {formatMoney(sub.amountMinor, sub.currency)}
                      </p>
                      <p className="text-[10px] font-mono text-text-faint">
                        ~{formatMoney(calculateMonthlyEquivalent(sub.amountMinor, sub.cycle))}/mo
                      </p>
                    </div>

                    {/* Edit action */}
                    <button
                      type="button"
                      onClick={() => setEditingSub(sub)}
                      className="p-1 rounded-lg text-text-faint hover:text-capital hover:bg-capital/10 transition-colors opacity-0 group-hover:opacity-100"
                      title="Edit subscription"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete action */}
                    <button
                      type="button"
                      onClick={() => handleDelete(sub.id)}
                      className="p-1 rounded-lg text-text-faint hover:text-danger hover:bg-danger/10 transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete subscription"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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
