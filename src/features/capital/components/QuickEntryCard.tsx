import React, { useState } from 'react'
import { PlusCircle, ArrowDownRight, ArrowUpRight, Check, Zap } from 'lucide-react'
import { TransactionType, TransactionScope } from '@/data/ports/schemas'
import { useCreateTransaction } from '../useTransactions'
import { parseMoneyToMinor } from '@/lib/money'
import { cn } from '@/lib/utils'

const EXPENSE_CATEGORIES = [
  'Software',
  'Equipment',
  'Cloud',
  'Office',
  'Marketing',
  'Travel',
  'Groceries',
  'Living',
  'Fitness',
  'General',
]

const INCOME_CATEGORIES = [
  'Consulting',
  'SaaS',
  'Retainer',
  'Freelance',
  'Dividends',
  'Salary',
  'Other',
]

function getTodayStr(): string {
  const d = new Date()
  const year = d.getFullYear()
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const day = d.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const QuickEntryCard: React.FC = () => {
  const [type, setType] = useState<TransactionType>('expense')
  const [scope, setScope] = useState<TransactionScope>('business')
  const [amountStr, setAmountStr] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0])
  const [date, setDate] = useState(getTodayStr())
  const [savedSuccess, setSavedSuccess] = useState(false)

  const createMutation = useCreateTransaction()

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType)
    setCategory(newType === 'expense' ? EXPENSE_CATEGORIES[0] : INCOME_CATEGORIES[0])
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!description.trim() || !amountStr.trim()) return

    const amountMinor = parseMoneyToMinor(amountStr)
    if (amountMinor <= 0) return

    createMutation.mutate(
      {
        type,
        scope,
        amountMinor,
        currency: 'USD',
        category,
        description: description.trim(),
        date: date || getTodayStr(),
        subscriptionId: null,
      },
      {
        onSuccess: () => {
          setAmountStr('')
          setDescription('')
          setSavedSuccess(true)
          setTimeout(() => setSavedSuccess(false), 2200)
        },
      }
    )
  }

  const currentCategories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES

  return (
    <div className="card p-5 bg-surface/50 border border-[rgba(255,255,255,0.06)] flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[rgba(255,255,255,0.06)]">
        <div className="flex items-center space-x-2">
          <Zap className="w-4 h-4 text-capital" />
          <h2 className="text-sm font-semibold text-text">Quick Entry Transaction</h2>
        </div>
        {savedSuccess && (
          <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-mono text-growth bg-growth/10 border border-growth/30 animate-in fade-in">
            <Check className="w-3 h-3" />
            <span>Logged</span>
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
        {/* Row 1: Type & Scope Pill Toggles */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Type Toggle */}
          <div className="p-1 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.06)] flex">
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={cn(
                'flex-1 flex items-center justify-center space-x-1 py-1 rounded-lg text-xs font-medium transition-all',
                type === 'expense'
                  ? 'bg-danger/20 text-danger border border-danger/40 font-semibold'
                  : 'text-text-muted hover:text-text'
              )}
            >
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>Outflow</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={cn(
                'flex-1 flex items-center justify-center space-x-1 py-1 rounded-lg text-xs font-medium transition-all',
                type === 'income'
                  ? 'bg-growth/20 text-growth border border-growth/40 font-semibold'
                  : 'text-text-muted hover:text-text'
              )}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Inflow</span>
            </button>
          </div>

          {/* Scope Toggle */}
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

        {/* Row 2: Amount & Date */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] font-mono text-text-muted mb-1">
              Amount ($ USD)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-text-faint font-mono text-sm">$</span>
              <input
                type="text"
                required
                placeholder="0.00"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="w-full pl-7 pr-3 py-2 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.08)] font-mono text-sm text-text focus:outline-none focus:border-capital/60"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-text-muted mb-1">Date</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.08)] font-mono text-xs text-text focus:outline-none focus:border-capital/60"
            />
          </div>
        </div>

        {/* Row 3: Description */}
        <div>
          <label className="block text-[11px] font-mono text-text-muted mb-1">
            Description / Vendor
          </label>
          <input
            type="text"
            required
            placeholder="e.g. AWS Hosting, Client Retainer, New Monitor..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.08)] text-xs text-text focus:outline-none focus:border-capital/60 placeholder:text-text-faint"
          />
        </div>

        {/* Row 4: Category Select */}
        <div>
          <label className="block text-[11px] font-mono text-text-muted mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.08)] text-xs text-text focus:outline-none focus:border-capital/60"
          >
            {currentCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={createMutation.isPending}
          className={cn(
            'w-full flex items-center justify-center space-x-1.5 py-2.5 rounded-xl font-semibold text-xs',
            'bg-capital text-black hover:brightness-110 active:scale-95 transition-all shadow-[0_0_12px_rgba(251,191,36,0.25)]'
          )}
        >
          <PlusCircle className="w-4 h-4 stroke-[2.5]" />
          <span>Record Transaction</span>
        </button>
      </form>
    </div>
  )
}
