import React from 'react'
import { Check, Flame, MoreVertical, Trash2, Pencil } from 'lucide-react'
import { Habit, HabitCategory } from '@/data/ports/schemas'
import { cn } from '@/lib/utils'

interface HabitRowProps {
  habit: Habit
  isDone: boolean
  currentStreak: number
  onToggle: (habitId: string) => void
  onDelete?: (habitId: string) => void
  onEdit?: (habit: Habit) => void
}

function getCategoryBadge(category: HabitCategory) {
  switch (category) {
    case 'movement':
      return {
        label: 'Movement',
        bg: 'bg-action/10 text-action border-action/30',
      }
    case 'mindfulness':
      return {
        label: 'Mindfulness',
        bg: 'bg-knowledge/10 text-knowledge border-knowledge/30',
      }
    case 'nutrition':
      return {
        label: 'Nutrition',
        bg: 'bg-growth/10 text-growth border-growth/30',
      }
    case 'sleep':
      return {
        label: 'Sleep',
        bg: 'bg-knowledge-dim/30 text-[#A78BFA] border-[#A78BFA]/30',
      }
    case 'focus':
      return {
        label: 'Focus',
        bg: 'bg-capital/10 text-capital border-capital/30',
      }
    case 'other':
    default:
      return {
        label: 'Habit',
        bg: 'bg-surface-2 text-text-muted border-[rgba(255,255,255,0.06)]',
      }
  }
}

export const HabitRow: React.FC<HabitRowProps> = ({
  habit,
  isDone,
  currentStreak,
  onToggle,
  onDelete,
  onEdit,
}) => {
  const [showMenu, setShowMenu] = React.useState(false)
  const categoryBadge = getCategoryBadge(habit.category)

  return (
    <div
      className={cn(
        'group flex items-center justify-between p-3.5 rounded-xl border transition-all duration-150',
        'bg-surface hover:bg-surface-2/60',
        isDone
          ? 'border-growth/40 bg-growth/[0.03]'
          : 'border-[rgba(255,255,255,0.06)] hover:border-border-strong'
      )}
    >
      <div className="flex items-center space-x-3.5 min-w-0 flex-1">
        {/* Interactive Custom Checkbox */}
        <button
          type="button"
          onClick={() => onToggle(habit.id)}
          className={cn(
            'w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-150 shrink-0 border',
            isDone
              ? 'bg-growth text-black border-growth shadow-[0_0_12px_rgba(52,245,164,0.4)] scale-105'
              : 'border-[rgba(255,255,255,0.2)] bg-surface-2 hover:border-growth/60 hover:bg-growth/10'
          )}
          aria-label={`Toggle habit ${habit.name}`}
        >
          {isDone && <Check className="w-4 h-4 stroke-[3]" />}
        </button>

        {/* Habit Name & Metadata */}
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              'text-sm font-medium leading-tight truncate transition-colors',
              isDone ? 'line-through text-text-muted' : 'text-text'
            )}
          >
            {habit.name}
          </p>

          <div className="flex items-center space-x-2 mt-1.5 text-[10px] font-mono">
            {/* Category Badge */}
            <span
              className={cn(
                'px-1.5 py-0.2 rounded border capitalize font-sans font-medium',
                categoryBadge.bg
              )}
            >
              {categoryBadge.label}
            </span>

            {/* Frequency */}
            <span className="text-text-faint capitalize">
              {habit.frequency.type === 'daily'
                ? 'Daily'
                : habit.frequency.type === 'weekdays'
                ? 'Mon–Fri'
                : 'Target'}
            </span>
          </div>
        </div>
      </div>

      {/* Streak Badge & Actions */}
      <div className="flex items-center space-x-2.5 shrink-0 pl-3">
        {/* Streak Counter (SRS §3.5 dynamic calculation) */}
        <div
          className={cn(
            'flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-mono font-semibold transition-all',
            currentStreak > 0
              ? 'bg-growth/15 text-growth border border-growth/30 shadow-[0_0_10px_rgba(52,245,164,0.15)]'
              : 'bg-surface-2 text-text-faint border border-[rgba(255,255,255,0.06)]'
          )}
          title={`Current streak: ${currentStreak} days`}
        >
          <Flame
            className={cn(
              'w-3.5 h-3.5',
              currentStreak > 0 ? 'text-growth fill-growth' : 'text-text-faint'
            )}
          />
          <span>{currentStreak}d</span>
        </div>

        {/* Menu Toggle */}
        {(onDelete || onEdit) && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded-lg text-text-faint hover:text-text hover:bg-surface-2 transition-colors opacity-0 group-hover:opacity-100"
              title="Options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <div
                className="absolute right-0 top-7 z-20 w-32 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.12)] shadow-xl p-1 animate-in fade-in zoom-in-95 duration-100"
                onMouseLeave={() => setShowMenu(false)}
              >
                {onEdit && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false)
                      onEdit(habit)
                    }}
                    className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs text-text hover:bg-surface hover:text-growth transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5 text-growth" />
                    <span>Edit Habit</span>
                  </button>
                )}

                {onDelete && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false)
                      onDelete(habit.id)
                    }}
                    className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs text-danger hover:bg-danger/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Habit</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
