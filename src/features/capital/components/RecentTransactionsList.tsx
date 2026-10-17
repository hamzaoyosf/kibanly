import React, { useState, useMemo } from 'react'
import {
  ArrowDownRight,
  ArrowUpRight,
  MoreVertical,
  Trash2,
  Pencil,
  Search,
  Receipt,
  X,
} from 'lucide-react'
import { Transaction, TransactionScope, TransactionType } from '@/data/ports/schemas'
import { useDeleteTransaction, useUpdateTransaction } from '../useTransactions'
import { formatMoney, parseMoneyToMinor } from '@/lib/money'
import { cn } from '@/lib/utils'

interface RecentTransactionsListProps {
  transactions: Transaction[]
}

export const RecentTransactionsList: React.FC<RecentTransactionsListProps> = ({
  transactions,
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all')
  const [editingTxn, setEditingTxn] = useState<Transaction | null>(null)
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)

  const deleteMutation = useDeleteTransaction()
  const updateMutation = useUpdateTransaction()

  const categories = useMemo(() => {
    const set = new Set<string>()
    transactions.forEach((t) => set.add(t.category))
    return Array.from(set)
  }, [transactions])

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchesSearch =
        searchQuery === '' ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCat =
        selectedCategoryFilter === 'all' || t.category === selectedCategoryFilter
      return matchesSearch && matchesCat
    })
  }, [transactions, searchQuery, selectedCategoryFilter])

  const handleDelete = (id: string) => {
    if (confirm('Delete this transaction?')) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div className="card p-5 bg-surface/50 border border-[rgba(255,255,255,0.06)] flex flex-col space-y-4">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[rgba(255,255,255,0.06)]">
        <div className="flex items-center space-x-2">
          <Receipt className="w-5 h-5 text-capital" />
          <h2 className="text-base font-semibold text-text">Transaction Ledger</h2>
          <span className="px-2 py-0.5 rounded-full text-xs font-mono font-semibold bg-capital/15 text-capital border border-capital/30">
            {filteredTransactions.length}
          </span>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center space-x-2">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-text-faint absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Filter ledger..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg bg-surface-2 border border-[rgba(255,255,255,0.06)] text-xs text-text focus:outline-none focus:border-capital/60 placeholder:text-text-faint w-36 sm:w-44"
            />
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-surface-2 border border-[rgba(255,255,255,0.06)] text-xs text-text focus:outline-none focus:border-capital/60"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Transaction Feed */}
      <div className="space-y-2 overflow-y-auto max-h-[460px] pr-1">
        {filteredTransactions.length === 0 ? (
          <div className="p-8 text-center text-xs text-text-faint border border-dashed border-[rgba(255,255,255,0.08)] rounded-tile">
            No transactions found matching your criteria.
          </div>
        ) : (
          filteredTransactions.map((txn) => {
            const isIncome = txn.type === 'income'
            return (
              <div
                key={txn.id}
                className={cn(
                  'group flex items-center justify-between p-3 rounded-xl border transition-all duration-150',
                  'bg-surface hover:bg-surface-2/60 border-[rgba(255,255,255,0.06)] hover:border-border-strong'
                )}
              >
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  {/* Type Icon Chip */}
                  <div
                    className={cn(
                      'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border',
                      isIncome
                        ? 'bg-growth/10 text-growth border-growth/20 shadow-[0_0_8px_rgba(52,245,164,0.15)]'
                        : 'bg-danger/10 text-danger border-danger/20'
                    )}
                  >
                    {isIncome ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                  </div>

                  {/* Metadata */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text truncate">
                      {txn.description}
                    </p>
                    <div className="flex items-center space-x-2 mt-1 text-[10px] font-mono">
                      <span className="text-text-muted">{txn.date}</span>
                      <span className="text-text-faint">•</span>
                      <span className="px-1.5 py-0.2 rounded bg-surface-2 border border-[rgba(255,255,255,0.06)] text-text-muted capitalize">
                        {txn.category}
                      </span>
                      <span
                        className={cn(
                          'px-1.5 py-0.2 rounded capitalize font-medium',
                          txn.scope === 'business'
                            ? 'bg-capital/10 text-capital border border-capital/20'
                            : 'bg-knowledge/10 text-knowledge border border-knowledge/20'
                        )}
                      >
                        {txn.scope}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Amount & Actions */}
                <div className="flex items-center space-x-2 shrink-0 pl-3">
                  <span
                    className={cn(
                      'text-sm font-bold font-mono',
                      isIncome ? 'text-growth' : 'text-text'
                    )}
                  >
                    {isIncome ? '+' : '-'}
                    {formatMoney(txn.amountMinor, txn.currency)}
                  </span>

                  {/* Options Menu */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setActiveMenuId(activeMenuId === txn.id ? null : txn.id)
                      }
                      className="p-1 rounded-lg text-text-faint hover:text-text hover:bg-surface-2 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {activeMenuId === txn.id && (
                      <div
                        className="absolute right-0 top-7 z-20 w-32 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.12)] shadow-xl p-1 animate-in fade-in zoom-in-95 duration-100 font-sans"
                        onMouseLeave={() => setActiveMenuId(null)}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuId(null)
                            setEditingTxn(txn)
                          }}
                          className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs text-text hover:bg-surface hover:text-capital transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5 text-capital" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuId(null)
                            handleDelete(txn.id)
                          }}
                          className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs text-danger hover:bg-danger/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Edit Transaction Modal */}
      {editingTxn && (
        <EditTransactionModal
          txn={editingTxn}
          onClose={() => setEditingTxn(null)}
          onSave={(patch) => {
            updateMutation.mutate({ id: editingTxn.id, patch })
            setEditingTxn(null)
          }}
        />
      )}
    </div>
  )
}

interface EditTransactionModalProps {
  txn: Transaction
  onClose: () => void
  onSave: (patch: Partial<Transaction>) => void
}

const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  txn,
  onClose,
  onSave,
}) => {
  const [type, setType] = useState<TransactionType>(txn.type)
  const [scope, setScope] = useState<TransactionScope>(txn.scope)
  const [amountStr, setAmountStr] = useState((txn.amountMinor / 100).toFixed(2))
  const [description, setDescription] = useState(txn.description)
  const [category, setCategory] = useState(txn.category)
  const [date, setDate] = useState(txn.date)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    const amountMinor = parseMoneyToMinor(amountStr)
    if (!description.trim() || amountMinor <= 0) return

    onSave({
      type,
      scope,
      amountMinor,
      description: description.trim(),
      category,
      date,
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
            <h2 className="text-sm font-semibold text-text">Edit Transaction</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-text-muted hover:text-text hover:bg-surface-2 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-1 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.06)] flex">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={cn(
                  'flex-1 py-1 rounded-lg text-xs font-medium transition-all',
                  type === 'expense'
                    ? 'bg-danger/20 text-danger border border-danger/40 font-semibold'
                    : 'text-text-muted hover:text-text'
                )}
              >
                Outflow
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                className={cn(
                  'flex-1 py-1 rounded-lg text-xs font-medium transition-all',
                  type === 'income'
                    ? 'bg-growth/20 text-growth border border-growth/40 font-semibold'
                    : 'text-text-muted hover:text-text'
                )}
              >
                Inflow
              </button>
            </div>

            <div className="p-1 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.06)] flex">
              <button
                type="button"
                onClick={() => setScope('business')}
                className={cn(
                  'flex-1 py-1 rounded-lg text-xs font-medium transition-all',
                  scope === 'business'
                    ? 'bg-capital/20 text-capital border border-capital/40 font-semibold'
                    : 'text-text-muted hover:text-text'
                )}
              >
                Business
              </button>
              <button
                type="button"
                onClick={() => setScope('personal')}
                className={cn(
                  'flex-1 py-1 rounded-lg text-xs font-medium transition-all',
                  scope === 'personal'
                    ? 'bg-capital/20 text-capital border border-capital/40 font-semibold'
                    : 'text-text-muted hover:text-text'
                )}
              >
                Personal
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-mono text-text-muted mb-1">
                Amount ($)
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
                Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.08)] font-mono text-xs text-text focus:outline-none focus:border-capital/60"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-text-muted mb-1">
              Description
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.08)] text-xs text-text focus:outline-none focus:border-capital/60"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-text-muted mb-1">
              Category
            </label>
            <input
              type="text"
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
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
