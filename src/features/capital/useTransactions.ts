import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { repos } from '@/data'
import { Transaction, TransactionScope } from '@/data/ports/schemas'

export const TRANSACTIONS_QUERY_KEY = ['transactions']

export function useTransactions(scope: 'all' | TransactionScope = 'all') {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (repos.transactions.subscribe) {
      const unsubscribe = repos.transactions.subscribe(() => {
        queryClient.invalidateQueries({ queryKey: TRANSACTIONS_QUERY_KEY })
      })
      return () => unsubscribe()
    }
  }, [queryClient])

  return useQuery({
    queryKey: [...TRANSACTIONS_QUERY_KEY, (scope || 'all').toLowerCase()],
    queryFn: async () => {
      const items = await repos.transactions.list({
        orderBy: 'date',
        orderDirection: 'desc',
      })
      const targetScope = (scope || 'all').toLowerCase()
      if (targetScope === 'all') return items
      return items.filter((t) => (t.scope || 'business').toLowerCase() === targetScope)
    },
  })
}

export function useCreateTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (
      newTxn: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'schemaVersion'>
    ) => {
      const now = new Date().toISOString()
      return repos.transactions.create({
        ...newTxn,
        createdAt: now,
        updatedAt: now,
        schemaVersion: 1,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_QUERY_KEY })
    },
  })
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Transaction> }) => {
      return repos.transactions.update(id, patch)
    },
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: TRANSACTIONS_QUERY_KEY })
      queryClient.setQueriesData<Transaction[]>(
        { queryKey: TRANSACTIONS_QUERY_KEY },
        (old) => {
          if (!old) return []
          return old.map((t) => (t.id === id ? { ...t, ...patch } : t))
        }
      )
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_QUERY_KEY })
    },
  })
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await repos.transactions.remove(id)
      return id
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: TRANSACTIONS_QUERY_KEY })
      queryClient.setQueriesData<Transaction[]>(
        { queryKey: TRANSACTIONS_QUERY_KEY },
        (old) => {
          if (!old) return []
          return old.filter((t) => t.id !== id)
        }
      )
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_QUERY_KEY })
    },
  })
}
