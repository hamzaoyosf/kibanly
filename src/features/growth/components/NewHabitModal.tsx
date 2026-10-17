import React, { useState, useEffect } from 'react'
import { X, Sparkles, Pencil } from 'lucide-react'
import { Habit, HabitCategory, HabitFrequencyType } from '@/data/ports/schemas'
import { useCreateHabit, useUpdateHabit } from '../useHabits'

interface NewHabitModalProps {
  isOpen: boolean
  onClose: () => void
  initialHabit?: Habit | null
}

const CATEGORIES: { id: HabitCategory; label: string }[] = [
  { id: 'movement', label: 'Movement & Fitness' },
  { id: 'mindfulness', label: 'Mindfulness & Mental' },
  { id: 'nutrition', label: 'Nutrition & Health' },
  { id: 'sleep', label: 'Sleep & Recovery' },
  { id: 'focus', label: 'Focus & Deep Work' },
  { id: 'other', label: 'General / Other' },
]

export const NewHabitModal: React.FC<NewHabitModalProps> = ({
  isOpen,
  onClose,
  initialHabit,
}) => {
  const isEditing = Boolean(initialHabit)
  const [name, setName] = useState('')
  const [category, setCategory] = useState<HabitCategory>('movement')
  const [frequencyType, setFrequencyType] = useState<HabitFrequencyType>('daily')
  const [targetPerWeek, setTargetPerWeek] = useState(7)

  const createHabitMutation = useCreateHabit()
  const updateHabitMutation = useUpdateHabit()

  useEffect(() => {
    if (initialHabit) {
      setName(initialHabit.name)
      setCategory(initialHabit.category)
      setFrequencyType(initialHabit.frequency.type)
      setTargetPerWeek(initialHabit.targetPerWeek || 7)
    } else {
      setName('')
      setCategory('movement')
      setFrequencyType('daily')
      setTargetPerWeek(7)
    }
  }, [initialHabit, isOpen])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    if (initialHabit) {
      updateHabitMutation.mutate(
        {
          id: initialHabit.id,
          patch: {
            name: name.trim(),
            category,
            frequency: {
              type: frequencyType,
              targetPerWeek,
            },
            targetPerWeek,
          },
        },
        {
          onSuccess: () => {
            onClose()
          },
        }
      )
    } else {
      createHabitMutation.mutate(
        {
          name: name.trim(),
          category,
          icon: 'sparkles',
          frequency: {
            type: frequencyType,
            targetPerWeek,
          },
          targetPerWeek,
          archived: false,
          order: 1000,
        },
        {
          onSuccess: () => {
            setName('')
            onClose()
          },
        }
      )
    }
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
        data-hub="growth"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[rgba(255,255,255,0.06)]">
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <Pencil className="w-4 h-4 text-growth" />
            ) : (
              <Sparkles className="w-4 h-4 text-growth" />
            )}
            <h2 className="text-sm font-semibold text-text">
              {isEditing ? 'Edit Habit' : 'New Habit'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-text-muted hover:text-text hover:bg-surface-2 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-text-muted mb-1.5">Habit Name</label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Read 20 pages, 30m Run, Morning Hydration..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.08)] text-sm text-text focus:outline-none focus:border-growth/60 placeholder:text-text-faint"
            />
          </div>

          <div>
            <label className="block font-medium text-text-muted mb-1.5">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as HabitCategory)}
              className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.08)] text-text focus:outline-none focus:border-growth/60"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-text-muted mb-1.5">Frequency</label>
              <select
                value={frequencyType}
                onChange={(e) => {
                  const val = e.target.value as HabitFrequencyType
                  setFrequencyType(val)
                  if (val === 'weekdays') setTargetPerWeek(5)
                  else if (val === 'daily') setTargetPerWeek(7)
                }}
                className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.08)] text-text focus:outline-none focus:border-growth/60"
              >
                <option value="daily">Daily (7 days)</option>
                <option value="weekdays">Weekdays (Mon-Fri)</option>
                <option value="x_per_week">X Times Per Week</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-text-muted mb-1.5">Target / Week</label>
              <input
                type="number"
                min={1}
                max={7}
                value={targetPerWeek}
                onChange={(e) => setTargetPerWeek(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.08)] font-mono text-text focus:outline-none focus:border-growth/60"
              />
            </div>
          </div>

          {/* Footer Actions */}
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
              disabled={createHabitMutation.isPending || updateHabitMutation.isPending}
              className="px-4 py-1.5 rounded-chip bg-growth text-black font-semibold hover:brightness-110 active:scale-95 transition-all shadow-sm"
            >
              {isEditing ? 'Save Changes' : 'Create Habit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
