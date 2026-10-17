import { EnergyLog, Habit, HabitLog } from '@/data/ports/schemas'

export interface RadarDataPoint {
  axis: string
  score: number // 0-100
  fullMark: number
}

export function formatYYYYMMDD(d: Date): string {
  const year = d.getFullYear()
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const day = d.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Normalizes a 1-5 rating scale to a 0-100% scale.
 * 1 (lowest) maps strictly to 0%.
 * 5 (peak) maps strictly to 100%.
 * Formula: ((score - 1) / 4) * 100
 */
export function normalize1To5(score: number): number {
  return Math.max(0, Math.min(100, ((score - 1) / 4) * 100))
}

/**
 * Helper to calculate habit completion rate (0-100%) for a specific habit category
 * across the specified 7-day date window.
 */
function getHabitCompletionRate(
  category: string,
  habits: Habit[],
  habitLogs: HabitLog[],
  dateSet: Set<string>
): { rate: number; hasHabits: boolean } {
  const categoryHabits = habits.filter((h) => !h.archived && h.category === category)
  if (categoryHabits.length === 0) {
    return { rate: 0, hasHabits: false }
  }
  const categoryHabitIds = new Set(categoryHabits.map((h) => h.id))
  const totalPossible = categoryHabits.length * 7
  const completed = habitLogs.filter(
    (log) => dateSet.has(log.date) && log.done && categoryHabitIds.has(log.habitId)
  ).length
  const rate = Math.min(100, Math.max(0, (completed / totalPossible) * 100))
  return { rate, hasHabits: true }
}

/**
 * Combines Habit completion rate and Energy Audit data for an axis.
 * If both habit and audit data exist, blends them equally (50% / 50%).
 * If only audit data exists, returns audit score.
 * If only habit data exists, returns habit score.
 * If neither exists, returns 0.
 * If actual calculated score is 0, strictly returns 0 (no baseline padding).
 */
function combineAxisScore(
  habitPart: { rate: number; hasHabits: boolean },
  auditScore: number,
  hasAuditLogs: boolean
): number {
  if (habitPart.hasHabits && hasAuditLogs) {
    return Math.round((habitPart.rate + auditScore) / 2)
  }
  if (hasAuditLogs) {
    return Math.round(auditScore)
  }
  if (habitPart.hasHabits) {
    return Math.round(habitPart.rate)
  }
  return 0
}

/**
 * Wellness radar score (0-100 per axis) implementing SRS §3.5 & PRD PG-6:
 * Strictly combines Habit completion rates AND Energy Audit data across the 5 axes:
 * 1. Sleep: Sleep habits completion rate + Audit Sleep score (min(sleepHours / 8, 1) * 100)
 * 2. Movement: Movement habits completion rate + Audit Movement score (workoutDone & physical energy)
 * 3. Mindfulness: Mindfulness habits completion rate + Audit Mood score (((mood - 1) / 4) * 100)
 * 4. Nutrition: Nutrition habits completion rate + Audit Vitality score (((energy - 1) / 4) * 100)
 * 5. Focus: Focus habits completion rate + Audit Focus score (((focus - 1) / 4) * 100)
 *
 * True Zero State:
 * When all habits are unchecked, sleep is 0 hours, and all energy audit fields are 1,
 * every axis strictly evaluates to 0 (0% equilibrium).
 */
export function calculateWellnessRadar(
  energyLogs: EnergyLog[],
  habits: Habit[],
  habitLogs: HabitLog[],
  referenceDate: Date = new Date()
): RadarDataPoint[] {
  // 1. Gather the last 7 dates ending on referenceDate
  const last7Dates: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(referenceDate)
    d.setDate(d.getDate() - i)
    last7Dates.push(formatYYYYMMDD(d))
  }
  const dateSet = new Set(last7Dates)

  // 2. Filter energy logs for the 7-day rolling window
  const weekEnergyLogs = energyLogs.filter((log) => dateSet.has(log.date))
  const hasAuditLogs = weekEnergyLogs.length > 0

  // 3. Sleep Axis (0-100)
  // Habit: Sleep habits completion rate
  // Audit: min(sleepHours / 8, 1) * 100
  const sleepHabit = getHabitCompletionRate('sleep', habits, habitLogs, dateSet)
  const auditSleepScore = hasAuditLogs
    ? (weekEnergyLogs.reduce(
        (acc, log) => acc + Math.min(Math.max(log.sleepHours, 0) / 8, 1),
        0
      ) /
        weekEnergyLogs.length) *
      100
    : 0
  const sleepScore = combineAxisScore(sleepHabit, auditSleepScore, hasAuditLogs)

  // 4. Movement Axis (0-100)
  // Habit: Movement habits completion rate
  // Audit: Blend of workoutDone (boolean) and physical energy rating (((energy - 1) / 4) * 100)
  const movementHabit = getHabitCompletionRate('movement', habits, habitLogs, dateSet)
  const auditMovementScore = hasAuditLogs
    ? weekEnergyLogs.reduce((acc, log) => {
        const workoutVal = log.workoutDone ? 100 : 0
        const energyVal = normalize1To5(log.energy)
        return acc + (workoutVal + energyVal) / 2
      }, 0) / weekEnergyLogs.length
    : 0
  const movementScore = combineAxisScore(movementHabit, auditMovementScore, hasAuditLogs)

  // 5. Mindfulness Axis (0-100)
  // Habit: Mindfulness habits completion rate
  // Audit: Mood normalized from 1-5 scale (((mood - 1) / 4) * 100)
  const mindfulnessHabit = getHabitCompletionRate('mindfulness', habits, habitLogs, dateSet)
  const auditMoodScore = hasAuditLogs
    ? weekEnergyLogs.reduce((acc, log) => acc + normalize1To5(log.mood), 0) / weekEnergyLogs.length
    : 0
  const mindfulnessScore = combineAxisScore(mindfulnessHabit, auditMoodScore, hasAuditLogs)

  // 6. Nutrition Axis (0-100)
  // Habit: Nutrition habits completion rate
  // Audit: Metabolic vitality / energy normalized from 1-5 scale (((energy - 1) / 4) * 100)
  const nutritionHabit = getHabitCompletionRate('nutrition', habits, habitLogs, dateSet)
  const auditEnergyScore = hasAuditLogs
    ? weekEnergyLogs.reduce((acc, log) => acc + normalize1To5(log.energy), 0) / weekEnergyLogs.length
    : 0
  const nutritionScore = combineAxisScore(nutritionHabit, auditEnergyScore, hasAuditLogs)

  // 7. Focus Axis (0-100)
  // Habit: Focus habits completion rate
  // Audit: Focus normalized from 1-5 scale (((focus - 1) / 4) * 100)
  const focusHabit = getHabitCompletionRate('focus', habits, habitLogs, dateSet)
  const auditFocusScore = hasAuditLogs
    ? weekEnergyLogs.reduce((acc, log) => acc + normalize1To5(log.focus), 0) / weekEnergyLogs.length
    : 0
  const focusScore = combineAxisScore(focusHabit, auditFocusScore, hasAuditLogs)

  return [
    { axis: 'Sleep', score: Math.max(0, Math.min(100, sleepScore)), fullMark: 100 },
    { axis: 'Movement', score: Math.max(0, Math.min(100, movementScore)), fullMark: 100 },
    { axis: 'Mindfulness', score: Math.max(0, Math.min(100, mindfulnessScore)), fullMark: 100 },
    { axis: 'Nutrition', score: Math.max(0, Math.min(100, nutritionScore)), fullMark: 100 },
    { axis: 'Focus', score: Math.max(0, Math.min(100, focusScore)), fullMark: 100 },
  ]
}

/**
 * Returns overall 0-100% equilibrium score across the 5 axes.
 */
export function calculateEquilibriumScore(
  energyLogs: EnergyLog[],
  habits: Habit[],
  habitLogs: HabitLog[],
  referenceDate: Date = new Date()
): number {
  const points = calculateWellnessRadar(energyLogs, habits, habitLogs, referenceDate)
  if (points.length === 0) return 0
  const avg = points.reduce((sum, p) => sum + p.score, 0) / points.length
  return Math.round(avg)
}
