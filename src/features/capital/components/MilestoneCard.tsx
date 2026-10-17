import React, { useState } from 'react'
import { Target, Plus, Sparkles, X, Trash2, Pencil } from 'lucide-react'
import { Milestone, TransactionScope } from '@/data/ports/schemas'
import {
  useMilestones,
  useCreateMilestone,
  useUpdateMilestone,
  useDeleteMilestone,
} from '../useMilestones'
import {
  formatMoney,
  calculateMilestoneEtaMonths,
  parseMoneyToMinor,
} from '@/lib/money'
import { cn } from '@/lib/utils'

export const MilestoneCard: React.FC = () => {
  const { data: milestones = [], isLoading } = useMilestones()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null)
  const deleteMutation = useDeleteMilestone()
  const updateMutation = useUpdateMilestone()

  const handleDelete = (id: string) => {
    if (confirm('Delete this milestone?')) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div className="card p-5 bg-surface/50 border border-[rgba(255,255,255,0.06)] flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[rgba(255,255,255,0.06)]">
        <div>
          <div className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-capital" />
            <h2 className="text-base font-semibold text-text">Capital Milestones</h2>
          </div>
          <p className="text-xs text-text-faint mt-1">
            Savings and equipment goals with formula-driven ETA projections (FR-CAP-02)
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className={cn(
            'flex items-center space-x-1.5 px-3 py-1.5 rounded-chip font-semibold text-xs',
            'bg-capital text-black hover:brightness-110 active:scale-95 transition-all shadow-sm'
          )}
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Goal</span>
        </button>
      </div>

      {/* Milestones Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {isLoading ? (
          <div className="col-span-2 h-32 rounded-xl animate-pulse bg-surface-2/40" />
        ) : milestones.length === 0 ? (
          <div className="col-span-2 p-8 text-center text-xs text-text-faint border border-dashed border-[rgba(255,255,255,0.08)] rounded-tile">
            No milestones created yet. Click &quot;New Goal&quot; to set a savings target.
          </div>
        ) : (
          milestones.map((ms) => {
            const percent = Math.min(
              100,
              Math.round((ms.currentMinor / ms.targetMinor) * 100)
            )
            const etaMonths = calculateMilestoneEtaMonths(
              ms.targetMinor,
              ms.currentMinor,
              ms.monthlyContributionMinor
            )

            return (
              <div
                key={ms.id}
                className="p-4 rounded-xl bg-surface border border-[rgba(255,255,255,0.06)] space-y-3 relative group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-text">{ms.name}</h3>
                    <p className="text-[11px] font-mono text-text-faint capitalize mt-0.5">
                      {ms.scope} goal
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* ETA Badge (SRS FR-CAP-02) */}
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border',
                        percent >= 100
                          ? 'bg-growth/15 text-growth border-growth/30'
                          : etaMonths !== null
                          ? 'bg-capital/15 text-capital border-capital/30'
                          : 'bg-surface-2 text-text-faint border-[rgba(255,255,255,0.06)]'
                      )}
                    >
                      {percent >= 100
                        ? 'Achieved'
                        : etaMonths !== null
                        ? `ETA: ${etaMonths} mo`
                        : 'ETA: —'}
                    </span>

                    <button
                      type="button"
                      onClick={() => setEditingMilestone(ms)}
                      className="p-1 rounded text-text-faint hover:text-capital hover:bg-capital/10 transition-colors opacity-0 group-hover:opacity-100"
                      title="Edit milestone"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(ms.id)}
                      className="p-1 rounded text-text-faint hover:text-danger hover:bg-danger/10 transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete milestone"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-text font-bold">
                      {formatMoney(ms.currentMinor, ms.currency)}
                    </span>
                    <span className="text-text-muted">
                      of {formatMoney(ms.targetMinor, ms.currency)} ({percent}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-surface-2 overflow-hidden border border-[rgba(255,255,255,0.04)]">
                    <div
                      className="h-full bg-capital transition-all duration-300 shadow-[0_0_8px_rgba(251,191,36,0.4)]"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                {/* Contribution note */}
                <div className="flex items-center justify-between text-[11px] font-mono text-text-faint pt-1 border-t border-[rgba(255,255,255,0.04)]">
                  <span>Pacing:</span>
                  <span className="text-text-muted">
                    +{formatMoney(ms.monthlyContributionMinor, ms.currency)}/month
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Add Milestone Modal */}
      {isModalOpen && <AddMilestoneModal onClose={() => setIsModalOpen(false)} />}

      {/* Edit Milestone Modal */}
      {editingMilestone && (
        <EditMilestoneModal
          ms={editingMilestone}
          onClose={() => setEditingMilestone(null)}
          onSave={(patch) => {
            updateMutation.mutate({ id: editingMilestone.id, patch })
            setEditingMilestone(null)
          }}
        />
      )}
    </div>
  )
}

interface AddMilestoneModalProps {
  onClose: () => void
}

const AddMilestoneModal: React.FC<AddMilestoneModalProps> = ({ onClose }) => {
  const [name, setName] = useState('')
  const [targetStr, setTargetStr] = useState('')
  const [currentStr, setCurrentStr] = useState('0.00')
  const [monthlyStr, setMonthlyStr] = useState('')
  const [scope, setScope] = useState<TransactionScope>('business')

  const createMutation = useCreateMilestone()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const targetMinor = parseMoneyToMinor(targetStr)
    const currentMinor = parseMoneyToMinor(currentStr)
    const monthlyContributionMinor = parseMoneyToMinor(monthlyStr)

    if (!name.trim() || targetMinor <= 0) return

    createMutation.mutate(
      {
        name: name.trim(),
        targetMinor,
        currentMinor,
        monthlyContributionMinor,
        currency: 'USD',
        targetDate: null,
        scope,
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
            <h2 className="text-sm font-semibold text-text">New Capital Goal</h2>
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
              Goal / Equipment Name
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. 6-Month Runway, Studio Upgrade..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.08)] text-xs text-text focus:outline-none focus:border-capital/60 placeholder:text-text-faint"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-mono text-text-muted mb-1">
                Target Amount ($)
              </label>
              <input
                type="text"
                required
                placeholder="10000.00"
                value={targetStr}
                onChange={(e) => setTargetStr(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.08)] font-mono text-sm text-text focus:outline-none focus:border-capital/60"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-text-muted mb-1">
                Currently Saved ($)
              </label>
              <input
                type="text"
                required
                placeholder="2500.00"
                value={currentStr}
                onChange={(e) => setCurrentStr(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.08)] font-mono text-sm text-text focus:outline-none focus:border-capital/60"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-mono text-text-muted mb-1">
                Monthly Contribution ($)
              </label>
              <input
                type="text"
                required
                placeholder="500.00"
                value={monthlyStr}
                onChange={(e) => setMonthlyStr(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.08)] font-mono text-sm text-text focus:outline-none focus:border-capital/60"
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
              Save Milestone
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface EditMilestoneModalProps {
  ms: Milestone
  onClose: () => void
  onSave: (patch: Partial<Milestone>) => void
}

const EditMilestoneModal: React.FC<EditMilestoneModalProps> = ({
  ms,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(ms.name)
  const [targetStr, setTargetStr] = useState((ms.targetMinor / 100).toFixed(2))
  const [currentStr, setCurrentStr] = useState((ms.currentMinor / 100).toFixed(2))
  const [monthlyStr, setMonthlyStr] = useState(
    (ms.monthlyContributionMinor / 100).toFixed(2)
  )
  const [scope, setScope] = useState<TransactionScope>(ms.scope)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const targetMinor = parseMoneyToMinor(targetStr)
    const currentMinor = parseMoneyToMinor(currentStr)
    const monthlyContributionMinor = parseMoneyToMinor(monthlyStr)

    if (!name.trim() || targetMinor <= 0) return

    onSave({
      name: name.trim(),
      targetMinor,
      currentMinor,
      monthlyContributionMinor,
      scope,
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
            <h2 className="text-sm font-semibold text-text">Edit Milestone</h2>
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
              Goal / Equipment Name
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
                Target Amount ($)
              </label>
              <input
                type="text"
                required
                value={targetStr}
                onChange={(e) => setTargetStr(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.08)] font-mono text-sm text-text focus:outline-none focus:border-capital/60"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-text-muted mb-1">
                Currently Saved ($)
              </label>
              <input
                type="text"
                required
                value={currentStr}
                onChange={(e) => setCurrentStr(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.08)] font-mono text-sm text-text focus:outline-none focus:border-capital/60"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-mono text-text-muted mb-1">
                Monthly Contribution ($)
              </label>
              <input
                type="text"
                required
                value={monthlyStr}
                onChange={(e) => setMonthlyStr(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.08)] font-mono text-sm text-text focus:outline-none focus:border-capital/60"
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
