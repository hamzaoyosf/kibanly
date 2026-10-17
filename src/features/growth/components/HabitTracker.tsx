import React, { useState, useMemo } from 'react'
import { Plus, CheckCircle2, Filter } from 'lucide-react'
import { Habit, HabitCategory } from '@/data/ports/schemas'
import { useHabits, useHabitLogs, useToggleHabitLog, useDeleteHabit } from '../useHabits'
import { HabitRow } from './HabitRow'
import { NewHabitModal } from './NewHabitModal'
import { calculateCurrentStreak } from '@/lib/streaks'
import { cn } from '@/lib/utils'

interface HabitTrackerProps {
  selectedDate: string // YYYY-MM-DD
}

export const HabitTracker: React.FC<HabitTrackerProps> = ({ selectedDate }) => {
  const { data: habits = [], isLoading: habitsLoading } = useHabits()
  const { data: logs = [], isLoading: logsLoading } = useHabitLogs()
  const toggleMutation = useToggleHabitLog()
  const deleteMutation = useDeleteHabit()

  const [selectedCategory, setSelectedCategory] = useState<HabitCategory | 'all'>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)

  // Map of completed dates per habitId: Set<YYYY-MM-DD>
  const habitLogsMap = useMemo(() => {
    const map = new Map<string, Set<string>>()
    logs.forEach((log) => {
      if (log.done) {
        if (!map.has(log.habitId)) {
          map.set(log.habitId, new Set())
        }
        map.get(log.habitId)!.add(log.date)
      }
    })
    return map
  }, [logs])

  // Completed status for selectedDate
  const completedTodaySet = useMemo(() => {
    const set = new Set<string>()
    logs.forEach((log) => {
      if (log.date === selectedDate && log.done) {
        set.add(log.habitId)
      }
    })
    return set
  }, [logs, selectedDate])

  // Filtered habits
  const filteredHabits = useMemo(() => {
    if (selectedCategory === 'all') return habits
    return habits.filter((h) => h.category === selectedCategory)
  }, [habits, selectedCategory])

  const totalCount = habits.length
  const completedCount = habits.filter((h) => completedTodaySet.has(h.id)).length
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const handleToggle = (habitId: string) => {
    toggleMutation.mutate({ habitId, date: selectedDate })
  }

  const handleEdit = (habit: Habit) => {
    setEditingHabit(habit)
  }

  const handleDelete = (habitId: string) => {
    if (confirm('Are you sure you want to delete this habit?')) {
      deleteMutation.mutate(habitId)
    }
  }

  const selectedDateObj = useMemo(() => {
    const [y, m, d] = selectedDate.split('-').map(Number)
    return new Date(y, m - 1, d)
  }, [selectedDate])

  return (
    <div className="card p-5 bg-surface/50 border border-[rgba(255,255,255,0.06)] flex flex-col space-y-4 h-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[rgba(255,255,255,0.06)]">
        <div>
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-growth" />
            <h2 className="text-base font-semibold text-text">Daily Habits</h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-semibold bg-growth/15 text-growth border border-growth/30">
              {completedCount}/{totalCount}
            </span>
          </div>
          <p className="text-xs text-text-faint mt-1">
            Build consistency. Streaks update dynamically with every check-in.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className={cn(
            'flex items-center space-x-1.5 px-3 py-1.5 rounded-chip font-semibold text-xs self-start sm:self-auto',
            'bg-growth text-black hover:brightness-110 active:scale-95 transition-all shadow-sm'
          )}
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Habit</span>
        </button>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-text-muted">Today's Progress</span>
          <span className="text-growth font-semibold">{progressPercent}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-surface-2 overflow-hidden border border-[rgba(255,255,255,0.04)]">
          <div
            className="h-full bg-growth transition-all duration-300 shadow-[0_0_8px_rgba(52,245,164,0.5)]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
        <span className="flex items-center space-x-1 text-text-faint font-medium pl-1 pr-1.5 shrink-0">
          <Filter className="w-3 h-3" />
        </span>
        {[
          { id: 'all', label: 'All' },
          { id: 'movement', label: 'Movement' },
          { id: 'nutrition', label: 'Nutrition' },
          { id: 'mindfulness', label: 'Mindfulness' },
          { id: 'sleep', label: 'Sleep' },
          { id: 'focus', label: 'Focus' },
        ].map((tab) => {
          const isSelected = selectedCategory === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedCategory(tab.id as HabitCategory | 'all')}
              className={cn(
                'px-2.5 py-1 rounded-chip font-medium whitespace-nowrap transition-colors border text-[11px]',
                isSelected
                  ? 'bg-growth/15 text-growth border-growth/40 shadow-sm'
                  : 'bg-surface-2 text-text-muted border-[rgba(255,255,255,0.06)] hover:text-text'
              )}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Habits List */}
      <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[580px] pr-1">
        {habitsLoading || logsLoading ? (
          <div className="space-y-2.5">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-16 rounded-xl animate-pulse bg-surface-2/40" />
            ))}
          </div>
        ) : filteredHabits.length === 0 ? (
          <div className="p-8 text-center text-xs text-text-faint border border-dashed border-[rgba(255,255,255,0.08)] rounded-tile">
            No habits found in this category. Click &quot;New Habit&quot; to create one.
          </div>
        ) : (
          filteredHabits.map((habit) => {
            const isDone = completedTodaySet.has(habit.id)
            const completedDates = habitLogsMap.get(habit.id) || new Set<string>()
            const streak = calculateCurrentStreak(completedDates, habit, selectedDateObj)

            return (
              <HabitRow
                key={habit.id}
                habit={habit}
                isDone={isDone}
                currentStreak={streak}
                onToggle={handleToggle}
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            )
          })
        )}
      </div>

      {/* Modal (New or Edit) */}
      <NewHabitModal
        isOpen={isModalOpen || !!editingHabit}
        initialHabit={editingHabit}
        onClose={() => {
          setIsModalOpen(false)
          setEditingHabit(null)
        }}
      />
    </div>
  )
}
