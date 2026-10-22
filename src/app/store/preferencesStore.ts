import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface PreferencesState {
  aiAutoCategorize: boolean
  setAiAutoCategorize: (enabled: boolean) => void
  defaultCurrency: string
  setDefaultCurrency: (currency: string) => void
  dailyGoalTasks: number
  setDailyGoalTasks: (count: number) => void
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      aiAutoCategorize: true,
      setAiAutoCategorize: (enabled) => set({ aiAutoCategorize: enabled }),
      defaultCurrency: 'USD',
      setDefaultCurrency: (currency) => set({ defaultCurrency: currency }),
      dailyGoalTasks: 5,
      setDailyGoalTasks: (count) => set({ dailyGoalTasks: count }),
    }),
    {
      name: 'oboify_user_preferences',
      storage: {
        getItem: (name) => {
          if (typeof window === 'undefined') return null
          const existing = localStorage.getItem(name)
          if (existing) return JSON.parse(existing)
          const legacy = localStorage.getItem('kibanly_user_preferences')
          if (legacy) {
            localStorage.setItem(name, legacy)
            return JSON.parse(legacy)
          }
          return null
        },
        setItem: (name, value) => {
          if (typeof window !== 'undefined') {
            localStorage.setItem(name, JSON.stringify(value))
          }
        },
        removeItem: (name) => {
          if (typeof window !== 'undefined') {
            localStorage.removeItem(name)
          }
        },
      },
    }
  )
)
