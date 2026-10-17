import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { repos } from '@/data'
import { Milestone } from '@/data/ports/schemas'

export const MILESTONES_QUERY_KEY = ['milestones']

export function useMilestones() {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (repos.milestones.subscribe) {
      const unsubscribe = repos.milestones.subscribe(() => {
        queryClient.invalidateQueries({ queryKey: MILESTONES_QUERY_KEY })
      })
      return () => unsubscribe()
    }
  }, [queryClient])

  return useQuery({
    queryKey: MILESTONES_QUERY_KEY,
    queryFn: async () => {
      return repos.milestones.list()
    },
  })
}

export function useCreateMilestone() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (
      newMs: Omit<Milestone, 'id' | 'createdAt' | 'updatedAt' | 'schemaVersion'>
    ) => {
      const now = new Date().toISOString()
      return repos.milestones.create({
        ...newMs,
        createdAt: now,
        updatedAt: now,
        schemaVersion: 1,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MILESTONES_QUERY_KEY })
    },
  })
}

export function useUpdateMilestone() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Milestone> }) => {
      return repos.milestones.update(id, patch)
    },
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: MILESTONES_QUERY_KEY })
      queryClient.setQueriesData<Milestone[]>(
        { queryKey: MILESTONES_QUERY_KEY },
        (old) => {
          if (!old) return []
          return old.map((m) => (m.id === id ? { ...m, ...patch } : m))
        }
      )
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: MILESTONES_QUERY_KEY })
    },
  })
}

export function useDeleteMilestone() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await repos.milestones.remove(id)
      return id
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: MILESTONES_QUERY_KEY })
      queryClient.setQueriesData<Milestone[]>(
        { queryKey: MILESTONES_QUERY_KEY },
        (old) => {
          if (!old) return []
          return old.filter((m) => m.id !== id)
        }
      )
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: MILESTONES_QUERY_KEY })
    },
  })
}
