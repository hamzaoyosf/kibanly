import { InboxCategory, Priority, EisenhowerQuadrant } from '@/data/ports/schemas'

export interface AICategorizedItem {
  category: InboxCategory
  priority: Priority
  suggestedDue?: string | null
  confidence: number
  model: string
  reasoning?: string
  tags?: string[]
  suggestedQuadrant?: EisenhowerQuadrant
  estimateMin?: number
}

export interface RecommendationItem {
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  category: 'sleep' | 'focus' | 'movement' | 'equilibrium'
}

export interface AIWeeklyEnergyInsights {
  weekKey: string // ISO week, e.g., "2026-W42"
  generatedAt: string
  vitalityScore: number // 0-100
  summary: string
  peakFocusWindow: string
  sleepHabitCorrelation: string
  recommendations: RecommendationItem[]
}
