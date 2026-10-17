import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { repos } from '@/data'
import { Resource, ResourceStatus } from '@/data/ports/schemas'

export const RESOURCES_QUERY_KEY = ['resources']

export function useResources(statusFilter: 'all' | ResourceStatus = 'all') {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (repos.resources.subscribe) {
      const unsubscribe = repos.resources.subscribe(() => {
        queryClient.invalidateQueries({ queryKey: RESOURCES_QUERY_KEY })
      })
      return () => unsubscribe()
    }
  }, [queryClient])

  return useQuery({
    queryKey: [...RESOURCES_QUERY_KEY, statusFilter],
    queryFn: async () => {
      const items = await repos.resources.list({
        orderBy: 'updatedAt',
        orderDirection: 'desc',
      })
      if (statusFilter === 'all') return items
      return items.filter((r) => r.status === statusFilter)
    },
  })
}

export function useCreateResource() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (
      newRes: Omit<Resource, 'id' | 'createdAt' | 'updatedAt' | 'schemaVersion'>
    ) => {
      const now = new Date().toISOString()
      return repos.resources.create({
        ...newRes,
        createdAt: now,
        updatedAt: now,
        schemaVersion: 1,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RESOURCES_QUERY_KEY })
    },
  })
}

export function useUpdateResource() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Resource> }) => {
      return repos.resources.update(id, {
        ...patch,
        updatedAt: new Date().toISOString(),
      })
    },
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: RESOURCES_QUERY_KEY })
      queryClient.setQueriesData<Resource[]>(
        { queryKey: RESOURCES_QUERY_KEY },
        (old) => {
          if (!old) return []
          return old.map((r) =>
            r.id === id ? { ...r, ...patch, updatedAt: new Date().toISOString() } : r
          )
        }
      )
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: RESOURCES_QUERY_KEY })
    },
  })
}

export function useDeleteResource() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await repos.resources.remove(id)
      return id
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: RESOURCES_QUERY_KEY })
      queryClient.setQueriesData<Resource[]>(
        { queryKey: RESOURCES_QUERY_KEY },
        (old) => {
          if (!old) return []
          return old.filter((r) => r.id !== id)
        }
      )
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: RESOURCES_QUERY_KEY })
    },
  })
}
