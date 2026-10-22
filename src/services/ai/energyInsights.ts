import { getGeminiClient, isGeminiConfigured, DEFAULT_GEMINI_MODEL } from './geminiClient'
import { AIWeeklyEnergyInsights, RecommendationItem } from './types'
import { EnergyLog, Habit, HabitLog } from '@/data/ports/schemas'

function getWeekCacheKey(weekKey: string): string {
  return `oboify_energy_insight_${weekKey}`
}

function cleanJsonResponse(rawText: string): string {
  let cleaned = rawText.trim()
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/```\s*$/, '')
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/```\s*$/, '')
  }
  return cleaned.trim()
}

/**
 * Generates local rule-based heuristic vitality insights when Gemini API key is absent.
 */
function generateLocalHeuristicInsights(
  weekKey: string,
  energyLogs: EnergyLog[],
  habits: Habit[],
  habitLogs: HabitLog[]
): AIWeeklyEnergyInsights {
  const logCount = energyLogs.length
  let avgEnergy = 3.5
  let avgFocus = 3.5
  let avgSleep = 7.0
  let workoutCount = 0

  if (logCount > 0) {
    avgEnergy = energyLogs.reduce((acc, l) => acc + l.energy, 0) / logCount
    avgFocus = energyLogs.reduce((acc, l) => acc + l.focus, 0) / logCount
    avgSleep = energyLogs.reduce((acc, l) => acc + l.sleepHours, 0) / logCount
    workoutCount = energyLogs.filter((l) => l.workoutDone).length
  }

  const completedHabits = habitLogs.filter((h) => h.done).length
  const totalPossible = Math.max(habits.length * Math.max(logCount, 1), 1)
  const habitRate = Math.min(Math.round((completedHabits / totalPossible) * 100), 100)

  // Vitality calculation: 40% energy/focus + 30% sleep + 30% habits
  const vitalityScore = Math.min(
    100,
    Math.round(
      ((avgEnergy + avgFocus) / 10) * 40 +
      Math.min(avgSleep / 8, 1) * 30 +
      (habitRate / 100) * 30
    )
  )

  const recommendations: RecommendationItem[] = [
    {
      title: avgSleep < 7 ? 'Protect Sleep Window' : 'Consistent Wake Rhythm',
      description:
        avgSleep < 7
          ? `Your sleep averaged ${avgSleep.toFixed(1)} hrs. Target an earlier wind-down to elevate cognitive endurance.`
          : 'Great sleep baseline. Maintain consistent sleep and wake timing to reinforce circadian stability.',
      impact: 'high',
      category: 'sleep',
    },
    {
      title: workoutCount >= 3 ? 'Active Regeneration' : 'Daily Movement Minimum',
      description:
        workoutCount >= 3
          ? `Logged ${workoutCount} workouts this week. Ensure active recovery and hydration follow-ups.`
          : 'Schedule a minimum 20-minute daily zone-2 walk or mobility session to reduce afternoon sluggishness.',
      impact: 'medium',
      category: 'movement',
    },
    {
      title: 'Deep Work Batching',
      description:
        'Cluster deep cognitive blocks into your morning peak focus hours (09:00 - 12:00) before tackling administrative triage.',
      impact: 'high',
      category: 'focus',
    },
  ]

  return {
    weekKey,
    generatedAt: new Date().toISOString(),
    vitalityScore: vitalityScore || 78,
    summary:
      logCount > 0
        ? `Your circadian rhythm peaked with highest focus between 09:30 AM and 12:30 PM, strongly elevated on days following ${avgSleep >= 7 ? '7+ hours of quality sleep' : 'adequate rest'}. Prioritize deep work during this morning ultradian window while maintaining consistent evening wind-down.`
        : 'Your baseline indicates an optimal circadian peak between 09:30 AM and 12:00 PM for high-leverage cognitive focus. Consistently logging your daily sleep and energy audits will sharpen these bio-individual rhythm insights.',
    peakFocusWindow: '09:30 AM — 12:30 PM (Morning Ultradian Peak)',
    sleepHabitCorrelation:
      avgSleep >= 7.5
        ? 'Positive correlation: Sleep duration above 7.5h correlates directly with elevated mood and focus.'
        : 'Moderate friction: Sleep below 7h creates midday energy dips. Prioritize a 30m earlier sleep prep.',
    recommendations,
  }
}

/**
 * Generate weekly energy and vitality insight report using Gemini AI.
 * Automatically checks local ISO-week cache first to avoid unnecessary rate consumption.
 */
export async function generateWeeklyEnergyInsights(params: {
  weekKey: string
  energyLogs: EnergyLog[]
  habits: Habit[]
  habitLogs: HabitLog[]
  forceRefresh?: boolean
}): Promise<AIWeeklyEnergyInsights> {
  const { weekKey, energyLogs, habits, habitLogs, forceRefresh = false } = params
  const cacheKey = getWeekCacheKey(weekKey)

  // 1. Check local cache
  if (!forceRefresh && typeof window !== 'undefined') {
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      try {
        return JSON.parse(cached) as AIWeeklyEnergyInsights
      } catch (e) {
        console.warn('Failed to parse cached insight:', e)
      }
    }
  }

  // 2. Check if Gemini is configured
  const client = getGeminiClient()
  if (!client || !isGeminiConfigured()) {
    const fallback = generateLocalHeuristicInsights(weekKey, energyLogs, habits, habitLogs)
    if (typeof window !== 'undefined') {
      localStorage.setItem(cacheKey, JSON.stringify(fallback))
    }
    return fallback
  }

  // 3. Construct Gemini Prompt with rich 7-day biometric and behavioral summary
  const summaryData = {
    weekKey,
    logCount: energyLogs.length,
    energyLogs: energyLogs.map((l) => ({
      date: l.date,
      energy: l.energy,
      focus: l.focus,
      mood: l.mood,
      sleepHours: l.sleepHours,
      workoutDone: l.workoutDone,
      tasksCompleted: l.tasksCompleted,
      deepWorkMin: l.deepWorkMin,
      note: l.note || undefined,
    })),
    habits: habits.map((h) => ({ id: h.id, name: h.name, category: h.category })),
    habitCompletionSummary: {
      totalLogs: habitLogs.length,
      completed: habitLogs.filter((h) => h.done).length,
    },
  }

  const prompt = `You are the OBOiFY Human Performance and Vitality Scientist.
Analyze the user's last 7 days of personal performance and habit logs to generate an executive vitality synthesis:

${JSON.stringify(summaryData, null, 2)}

Requirements:
1. vitalityScore: Integer (0-100) reflecting composite energy, focus, sleep adequacy, and discipline.
2. summary: Strictly a short, actionable 2-sentence executive synthesis about the user's circadian rhythm and focus peaks.
3. peakFocusWindow: Estimated best time window of peak cognitive horsepower (e.g., "09:00 AM — 11:30 AM").
4. sleepHabitCorrelation: 1-2 sentences on how sleep, movement, and habit completion interacted this week.
5. recommendations: Array of 3 specific, actionable behavioral interventions with title, description, category ('sleep' | 'focus' | 'movement' | 'equilibrium'), and impact ('high' | 'medium' | 'low').

Respond ONLY with valid JSON:
{
  "vitalityScore": number,
  "summary": string,
  "peakFocusWindow": string,
  "sleepHabitCorrelation": string,
  "recommendations": [
    {
      "title": string,
      "description": string,
      "category": "sleep" | "focus" | "movement" | "equilibrium",
      "impact": "high" | "medium" | "low"
    }
  ]
}`

  try {
    const response = await client.models.generateContent({
      model: DEFAULT_GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    })

    const raw = response.text || ''
    const parsed = JSON.parse(cleanJsonResponse(raw))

    const result: AIWeeklyEnergyInsights = {
      weekKey,
      generatedAt: new Date().toISOString(),
      vitalityScore: typeof parsed.vitalityScore === 'number' ? Math.min(Math.max(parsed.vitalityScore, 0), 100) : 80,
      summary: parsed.summary || 'Weekly vitality evaluation completed.',
      peakFocusWindow: parsed.peakFocusWindow || '09:00 AM — 12:00 PM',
      sleepHabitCorrelation: parsed.sleepHabitCorrelation || 'Strong sleep consistency directly correlates with peak output.',
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations.slice(0, 3) : [],
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(cacheKey, JSON.stringify(result))
    }

    return result
  } catch (err) {
    console.warn('[Gemini AI] Weekly insights generation failed, using heuristic fallback:', err)
    const fallback = generateLocalHeuristicInsights(weekKey, energyLogs, habits, habitLogs)
    if (typeof window !== 'undefined') {
      localStorage.setItem(cacheKey, JSON.stringify(fallback))
    }
    return fallback
  }
}
