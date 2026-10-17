import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { repos } from '@/data'
import { Subscription, TransactionScope } from '@/data/ports/schemas'

export const SUBSCRIPTIONS_QUERY_KEY = ['subscriptions']

export function useSubscriptions(scope: 'all' | TransactionScope = 'all') {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (repos.subscriptions.subscribe) {
      const unsubscribe = repos.subscriptions.subscribe(() => {
        queryClient.invalidateQueries({ queryKey: SUBSCRIPTIONS_QUERY_KEY })
      })
      return () => unsubscribe()
    }
  }, [queryClient])

  return useQuery({
    queryKey: [...SUBSCRIPTIONS_QUERY_KEY, (scope || 'all').toLowerCase()],
    queryFn: async () => {
      const items = await repos.subscriptions.list({
        orderBy: 'nextRenewal',
        orderDirection: 'asc',
      })
      const targetScope = (scope || 'all').toLowerCase()
      if (targetScope === 'all') return items
      return items.filter((s) => (s.scope || 'business').toLowerCase() === targetScope)
    },
  })
}

export function useCreateSubscription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (
      newSub: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt' | 'schemaVersion'>
    ) => {
      const now = new Date().toISOString()
      return repos.subscriptions.create({
        ...newSub,
        createdAt: now,
        updatedAt: now,
        schemaVersion: 1,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTIONS_QUERY_KEY })
    },
  })
}

export function useUpdateSubscription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Subscription> }) => {
      return repos.subscriptions.update(id, patch)
    },
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: SUBSCRIPTIONS_QUERY_KEY })
      queryClient.setQueriesData<Subscription[]>(
        { queryKey: SUBSCRIPTIONS_QUERY_KEY },
        (old) => {
          if (!old) return []
          return old.map((s) => (s.id === id ? { ...s, ...patch } : s))
        }
      )
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTIONS_QUERY_KEY })
    },
  })
}

export function useDeleteSubscription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await repos.subscriptions.remove(id)
      return id
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: SUBSCRIPTIONS_QUERY_KEY })
      queryClient.setQueriesData<Subscription[]>(
        { queryKey: SUBSCRIPTIONS_QUERY_KEY },
        (old) => {
          if (!old) return []
          return old.filter((s) => s.id !== id)
        }
      )
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTIONS_QUERY_KEY })
    },
  })
}
