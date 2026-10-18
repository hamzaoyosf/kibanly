import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { repos } from '@/data'
import { GrowthPreset } from './types/presets'
import { ENERGY_LOGS_QUERY_KEY } from './useEnergyLogs'
import { HABIT_LOGS_QUERY_KEY } from './useHabits'

const CUSTOM_PRESETS_STORAGE_KEY = 'oboify_custom_growth_presets'
const LEGACY_PRESETS_STORAGE_KEY = 'kibanly_custom_growth_presets'

export const BUILT_IN_PRESETS: GrowthPreset[] = [
  // Workouts
  {
    id: 'preset_workout_upper',
    title: 'Upper Body Hypertrophy',
    description: 'Bench press, weighted pull-ups, overhead press, and arm accessory superset.',
    category: 'workout',
    durationMin: 50,
    details: [
      'Incline DB Press: 4x8-10 (RPE 8)',
      'Weighted Neutral-Grip Pull-ups: 4x6-8',
      'Standing Barbell Overhead Press: 3x8',
      'Incline Dumbbell Curls & Tricep Dips: 3x12',
    ],
    targetHabitNames: ['workout', 'exercise', 'gym', 'training', 'movement'],
    energyAuditNote: 'Completed Upper Body Hypertrophy (50m, High intensity)',
  },
  {
    id: 'preset_workout_zone2',
    title: 'Zone-2 Aerobic Base',
    description: '45-minute steady-state cardiovascular engine builder at nasal breathing threshold.',
    category: 'workout',
    durationMin: 45,
    details: [
      '5 min warm-up jog / spin',
      '35 min continuous Zone-2 output (130-140 bpm)',
      '5 min cool-down & hamstring breathing drill',
    ],
    targetHabitNames: ['cardio', 'run', 'walk', 'workout', 'movement'],
    energyAuditNote: 'Completed Zone-2 Aerobic Cardio (45m, Steady-state endurance)',
  },
  {
    id: 'preset_workout_mobility',
    title: 'Full Body Structural Mobility',
    description: 'Joint decompression, hip capsule mobilization, and thoracic extension.',
    category: 'workout',
    durationMin: 30,
    details: [
      '90/90 Hip Openers & Shin Box: 5 min',
      'Cat-Cow & Thoracic Rotation: 5 min',
      'Couch Stretch & Ankle Dorsiflexion: 10 min',
      'Deadhangs & Deep Squat Hold: 10 min',
    ],
    targetHabitNames: ['stretch', 'mobility', 'yoga', 'workout', 'recovery'],
    energyAuditNote: 'Completed Full Body Mobility & Joint Decompression (30m)',
  },
  {
    id: 'preset_workout_hiit',
    title: 'Tabata HIIT Engine',
    description: 'High-output anaerobic conditioning with 20s work / 10s rest intervals.',
    category: 'workout',
    durationMin: 20,
    details: [
      'Round 1: Kettlebell Swings (4 min)',
      'Round 2: Air Bike / Row Sprints (4 min)',
      'Round 3: Burpee Box Jump Overs (4 min)',
      'Round 4: Hollow Body Rocks & Planks (4 min)',
    ],
    targetHabitNames: ['hiit', 'workout', 'cardio', 'exercise'],
    energyAuditNote: 'Completed Tabata HIIT Protocol (20m High Output)',
  },

  // Nutrition / Meal-Prep
  {
    id: 'preset_nutrition_protein',
    title: 'High-Protein Muscle Synthesis',
    description: '180g+ protein target, whole unprocessed foods, and 3.5L hydration.',
    category: 'nutrition',
    details: [
      'Meal 1: 4 pasture eggs + egg whites, avocado, sourdough',
      'Meal 2: Grilled chicken breast (200g), jasmine rice, steamed greens',
      'Snack: Greek yogurt (0%), whey protein isolate, blueberries',
      'Meal 3: Wild salmon filet, roasted sweet potatoes, olive oil',
    ],
    targetHabitNames: ['water', 'hydration', 'nutrition', 'protein', 'diet'],
    energyAuditNote: 'High-Protein Protocol executed (180g+ protein, 3.5L water)',
  },
  {
    id: 'preset_nutrition_clean',
    title: 'Clean Anti-Inflammatory / Whole30',
    description: 'Zero refined seed oils, zero added sugar, high omega-3 fatty acids.',
    category: 'nutrition',
    details: [
      'Extra virgin olive oil & wild salmon / sardines',
      'Dark leafy cruciferous vegetables (spinach, broccoli sprouts)',
      'Turmeric ginger bone broth',
      'Zero gluten, dairy, or refined sugar',
    ],
    targetHabitNames: ['healthy eating', 'nutrition', 'clean food', 'diet'],
    energyAuditNote: 'Clean Anti-Inflammatory nutrition protocol applied',
  },
  {
    id: 'preset_nutrition_fasting',
    title: 'Intermittent Fasting 16/8 Protocol',
    description: 'Fasting window from 8:00 PM to 12:00 PM next day. Mineral electrolyte hydration.',
    category: 'nutrition',
    details: [
      'Morning: Black coffee, green tea, 1L water with Celtic sea salt',
      'Break fast (12:00 PM): Nutrient-dense protein and healthy fats',
      'Final meal (7:30 PM): Complex carbohydrates and protein',
      'Begin fast (8:00 PM): Chamomile tea, magnesium glycinate',
    ],
    targetHabitNames: ['fasting', 'water', 'nutrition'],
    energyAuditNote: 'Intermittent Fasting 16/8 window followed strictly',
  },
  {
    id: 'preset_nutrition_plant',
    title: 'Plant-Forward Vitality Fuel',
    description: 'Rich micronutrient diversity, 30+ plant foods, fermented kefir/kimchi.',
    category: 'nutrition',
    details: [
      'Lentil quinoa power bowl with tahini and pumpkin seeds',
      'Tempeh stir-fry with shiitake mushrooms, bok choy, and ginger',
      'Raw fermented sauerkraut / kimchi with meals',
      'Walnuts, chia seeds, and berries for brain recovery',
    ],
    targetHabitNames: ['nutrition', 'water', 'healthy eating'],
    energyAuditNote: 'Plant-forward micronutrient protocol applied',
  },
]

export function useGrowthPresets() {
  const [customPresets, setCustomPresets] = useState<GrowthPreset[]>(() => {
    try {
      const stored = localStorage.getItem(CUSTOM_PRESETS_STORAGE_KEY) || localStorage.getItem(LEGACY_PRESETS_STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(CUSTOM_PRESETS_STORAGE_KEY, JSON.stringify(customPresets))
    } catch (e) {
      console.warn('Failed to persist custom presets:', e)
    }
  }, [customPresets])

  const addCustomPreset = (preset: Omit<GrowthPreset, 'id' | 'isCustom'>) => {
    const newPreset: GrowthPreset = {
      ...preset,
      id: `custom_preset_${Date.now()}`,
      isCustom: true,
    }
    setCustomPresets((prev) => [newPreset, ...prev])
  }

  const deleteCustomPreset = (id: string) => {
    setCustomPresets((prev) => prev.filter((p) => p.id !== id))
  }

  const allPresets = [...customPresets, ...BUILT_IN_PRESETS]

  return {
    presets: allPresets,
    addCustomPreset,
    deleteCustomPreset,
  }
}

export function useApplyGrowthPreset() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ preset, date }: { preset: GrowthPreset; date: string }) => {
      const now = new Date().toISOString()

      // 1. Update or create EnergyLog for this date
      const existingLog = await repos.energyLogs.get(date)
      if (existingLog) {
        const updatedNote = existingLog.note
          ? `${existingLog.note}\n• ${preset.energyAuditNote}`
          : preset.energyAuditNote

        await repos.energyLogs.update(date, {
          workoutDone: preset.category === 'workout' ? true : existingLog.workoutDone,
          note: updatedNote,
          updatedAt: now,
        })
      } else {
        await repos.energyLogs.create({
          id: date,
          date,
          energy: 4,
          focus: 4,
          mood: 4,
          sleepHours: 7.5,
          workoutDone: preset.category === 'workout',
          tasksCompleted: 0,
          deepWorkMin: preset.durationMin || 30,
          note: preset.energyAuditNote,
          createdAt: now,
          updatedAt: now,
          schemaVersion: 1,
        })
      }

      // 2. Check off matching daily habits for this date
      const habits = await repos.habits.list()
      const targetKeywords = preset.targetHabitNames.map((n) => n.toLowerCase())

      for (const habit of habits) {
        const habitNameLower = habit.name.toLowerCase()
        const isMatch =
          targetKeywords.some((kw) => habitNameLower.includes(kw)) ||
          (preset.category === 'workout' && habit.category === 'movement') ||
          (preset.category === 'nutrition' && habit.category === 'nutrition')

        if (isMatch) {
          const logId = `${habit.id}_${date}`
          const existingHabitLog = await repos.habitLogs.get(logId)
          if (existingHabitLog) {
            await repos.habitLogs.update(logId, { done: true, updatedAt: now })
          } else {
            await repos.habitLogs.create({
              id: logId,
              habitId: habit.id,
              date,
              done: true,
              note: `Completed via preset: ${preset.title}`,
              createdAt: now,
              updatedAt: now,
              schemaVersion: 1,
            })
          }
        }
      }

      return { preset, date }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ENERGY_LOGS_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: HABIT_LOGS_QUERY_KEY })
    },
  })
}
