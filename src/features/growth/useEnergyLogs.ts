import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { repos } from '@/data'
import { EnergyLog } from '@/data/ports/schemas'

export const ENERGY_LOGS_QUERY_KEY = ['energyLogs']

export function useEnergyLogs() {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (repos.energyLogs.subscribe) {
      const unsubscribe = repos.energyLogs.subscribe(() => {
        queryClient.invalidateQueries({ queryKey: ENERGY_LOGS_QUERY_KEY })
      })
      return () => unsubscribe()
    }
  }, [queryClient])

  return useQuery({
    queryKey: ENERGY_LOGS_QUERY_KEY,
    queryFn: async () => {
      return repos.energyLogs.list({ orderBy: 'date', orderDirection: 'desc' })
    },
  })
}

export function useEnergyLogByDate(date: string) {
  const { data: allLogs = [], isLoading } = useEnergyLogs()
  const log = allLogs.find((l) => l.date === date) || null
  return { log, isLoading }
}

export function useSaveEnergyLog() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (
      payload: Omit<EnergyLog, 'id' | 'createdAt' | 'updatedAt' | 'schemaVersion'>
    ) => {
      const deterministicId = payload.date // One per date (FR-ENG-01)
      const existing = await repos.energyLogs.get(deterministicId)
      const now = new Date().toISOString()

      if (existing) {
        // Overwrite existing audit for this date
        return repos.energyLogs.update(deterministicId, {
          ...payload,
          updatedAt: now,
        })
      } else {
        // Create new audit
        return repos.energyLogs.create({
          ...payload,
          id: deterministicId,
          createdAt: now,
          updatedAt: now,
          schemaVersion: 1,
        })
      }
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ENERGY_LOGS_QUERY_KEY })
      const deterministicId = payload.date

      queryClient.setQueriesData<EnergyLog[]>({ queryKey: ENERGY_LOGS_QUERY_KEY }, (old) => {
        if (!old) return []
        const found = old.find((l) => l.id === deterministicId)
        if (found) {
          return old.map((l) =>
            l.id === deterministicId
              ? { ...l, ...payload, updatedAt: new Date().toISOString() }
              : l
          )
        } else {
          const newEntry: EnergyLog = {
            ...payload,
            id: deterministicId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            schemaVersion: 1,
          }
          return [newEntry, ...old]
        }
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ENERGY_LOGS_QUERY_KEY })
    },
  })
}
