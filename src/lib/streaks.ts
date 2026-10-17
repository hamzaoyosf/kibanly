import { Habit } from '@/data/ports/schemas'

function formatYYYYMMDD(d: Date): string {
  const year = d.getFullYear()
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const day = d.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}

function addDays(d: Date, days: number): Date {
  const result = new Date(d)
  result.setDate(result.getDate() + days)
  return result
}

/**
 * Checks if a habit is scheduled for a given date based on its frequency.
 */
export function isHabitScheduled(habit: Habit, date: Date): boolean {
  const dayOfWeek = date.getDay() // 0 = Sun, 1 = Mon, ..., 6 = Sat

  switch (habit.frequency.type) {
    case 'daily':
      return true
    case 'weekdays':
      return dayOfWeek >= 1 && dayOfWeek <= 5
    case 'custom':
      if (habit.frequency.daysOfWeek && habit.frequency.daysOfWeek.length > 0) {
        return habit.frequency.daysOfWeek.includes(dayOfWeek)
      }
      return true
    case 'x_per_week':
    default:
      return true
  }
}

/**
 * Streak (current) algorithm strictly implementing SRS §3.5:
 * Consecutive scheduled days completed ending today (or yesterday if today is pending).
 * Streaks are computed from logs, never stored as the source of truth (FR-HAB-01).
 */
export function calculateCurrentStreak(
  completedDates: Set<string>,
  habit: Habit,
  today: Date = new Date()
): number {
  const scheduled = (d: Date) => isHabitScheduled(habit, d)

  // If scheduled today and today is not completed yet, streak check starts from yesterday
  let d = scheduled(today) && !completedDates.has(formatYYYYMMDD(today))
    ? addDays(today, -1)
    : today

  let n = 0
  // Guard max lookback to prevent infinite loops (e.g., up to 365 days)
  const maxIterations = 365
  let iterations = 0

  while (iterations < maxIterations) {
    iterations++
    if (!scheduled(d)) {
      d = addDays(d, -1)
      continue
    }
    if (!completedDates.has(formatYYYYMMDD(d))) {
      break
    }
    n++
    d = addDays(d, -1)
  }

  return n
}

/**
 * Calculates the longest historical streak achieved for a habit.
 */
export function calculateLongestStreak(
  completedDates: Set<string>,
  habit: Habit,
  today: Date = new Date(),
  lookbackDays = 365
): number {
  if (completedDates.size === 0) return 0

  const scheduled = (d: Date) => isHabitScheduled(habit, d)
  let maxStreak = 0
  let currentRun = 0

  let d = addDays(today, -lookbackDays)

  for (let i = 0; i <= lookbackDays; i++) {
    if (!scheduled(d)) {
      d = addDays(d, 1)
      continue
    }

    if (completedDates.has(formatYYYYMMDD(d))) {
      currentRun++
      if (currentRun > maxStreak) {
        maxStreak = currentRun
      }
    } else {
      currentRun = 0
    }

    d = addDays(d, 1)
  }

  return maxStreak
}
