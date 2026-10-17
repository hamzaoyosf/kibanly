import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { repos } from '@/data'
import { Tag } from '@/data/ports/schemas'

export const TAGS_QUERY_KEY = ['tags']

export function useTags() {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (repos.tags.subscribe) {
      const unsubscribe = repos.tags.subscribe(() => {
        queryClient.invalidateQueries({ queryKey: TAGS_QUERY_KEY })
      })
      return () => unsubscribe()
    }
  }, [queryClient])

  return useQuery({
    queryKey: TAGS_QUERY_KEY,
    queryFn: async () => {
      const items = await repos.tags.list()
      return items.sort((a, b) => a.name.localeCompare(b.name))
    },
  })
}

export function useCreateTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (name: string) => {
      const cleanName = name.toLowerCase().replace(/[^a-z0-9_-]/g, '').trim()
      const now = new Date().toISOString()
      return repos.tags.create({
        name: cleanName,
        color: 'violet',
        createdAt: now,
        schemaVersion: 1,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAGS_QUERY_KEY })
    },
  })
}

export function useDeleteTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await repos.tags.remove(id)
      return id
    },
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: TAGS_QUERY_KEY })
      queryClient.setQueriesData<Tag[]>({ queryKey: TAGS_QUERY_KEY }, (old) => {
        if (!old) return []
        return old.filter((t) => t.id !== id)
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TAGS_QUERY_KEY })
    },
  })
}
