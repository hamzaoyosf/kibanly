export type GrowthPresetCategory = 'workout' | 'nutrition' | 'recovery'

export interface GrowthPreset {
  id: string
  title: string
  description: string
  category: GrowthPresetCategory
  durationMin?: number
  details: string[]
  targetHabitNames: string[]
  energyAuditNote: string
  isCustom?: boolean
}
