import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { repos } from '@/data'
import { Habit, HabitLog } from '@/data/ports/schemas'

export const HABITS_QUERY_KEY = ['habits']
export const HABIT_LOGS_QUERY_KEY = ['habitLogs']

export function useHabits() {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (repos.habits.subscribe) {
      const unsubscribe = repos.habits.subscribe(() => {
        queryClient.invalidateQueries({ queryKey: HABITS_QUERY_KEY })
      })
      return () => unsubscribe()
    }
  }, [queryClient])

  return useQuery({
    queryKey: HABITS_QUERY_KEY,
    queryFn: async () => {
      const items = await repos.habits.list({ orderBy: 'order', orderDirection: 'asc' })
      return items.filter((h) => !h.archived)
    },
  })
}

export function useHabitLogs() {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (repos.habitLogs.subscribe) {
      const unsubscribe = repos.habitLogs.subscribe(() => {
        queryClient.invalidateQueries({ queryKey: HABIT_LOGS_QUERY_KEY })
      })
      return () => unsubscribe()
    }
  }, [queryClient])

  return useQuery({
    queryKey: HABIT_LOGS_QUERY_KEY,
    queryFn: async () => {
      return repos.habitLogs.list()
    },
  })
}

export function useCreateHabit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (newHabit: Omit<Habit, 'id' | 'createdAt' | 'updatedAt' | 'schemaVersion'>) => {
      const now = new Date().toISOString()
      return repos.habits.create({
        ...newHabit,
        createdAt: now,
        updatedAt: now,
        schemaVersion: 1,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HABITS_QUERY_KEY })
    },
  })
}

export function useUpdateHabit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Habit> }) => {
      return repos.habits.update(id, patch)
    },
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: HABITS_QUERY_KEY })
      queryClient.setQueriesData<Habit[]>({ queryKey: HABITS_QUERY_KEY }, (old) => {
        if (!old) return []
        return old.map((h) => (h.id === id ? { ...h, ...patch } : h))
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: HABITS_QUERY_KEY })
    },
  })
}

export function useDeleteHabit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await repos.habits.remove(id)
      return id
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: HABITS_QUERY_KEY })
      queryClient.setQueriesData<Habit[]>({ queryKey: HABITS_QUERY_KEY }, (old) => {
        if (!old) return []
        return old.filter((h) => h.id !== id)
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HABITS_QUERY_KEY })
    },
  })
}

export function useToggleHabitLog() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ habitId, date }: { habitId: string; date: string }) => {
      const deterministicId = `${habitId}_${date}`
      const existing = await repos.habitLogs.get(deterministicId)
      const now = new Date().toISOString()

      if (existing) {
        // Toggle the done flag
        return repos.habitLogs.update(deterministicId, {
          done: !existing.done,
          updatedAt: now,
        })
      } else {
        // Create new log with done = true
        return repos.habitLogs.create({
          id: deterministicId,
          habitId,
          date,
          done: true,
          note: null,
          createdAt: now,
          updatedAt: now,
          schemaVersion: 1,
        })
      }
    },
    onMutate: async ({ habitId, date }) => {
      await queryClient.cancelQueries({ queryKey: HABIT_LOGS_QUERY_KEY })
      const deterministicId = `${habitId}_${date}`

      queryClient.setQueriesData<HabitLog[]>({ queryKey: HABIT_LOGS_QUERY_KEY }, (old) => {
        if (!old) return []
        const found = old.find((l) => l.id === deterministicId)
        if (found) {
          return old.map((l) => (l.id === deterministicId ? { ...l, done: !l.done } : l))
        } else {
          const newEntry: HabitLog = {
            id: deterministicId,
            habitId,
            date,
            done: true,
            note: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            schemaVersion: 1,
          }
          return [...old, newEntry]
        }
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: HABIT_LOGS_QUERY_KEY })
    },
  })
}
