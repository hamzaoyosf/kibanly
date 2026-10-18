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
      name: 'kibanly_user_preferences',
    }
  )
)
