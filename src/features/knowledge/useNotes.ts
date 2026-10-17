import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { repos } from '@/data'
import { Note } from '@/data/ports/schemas'

export const NOTES_QUERY_KEY = ['notes']

export function useNotes() {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (repos.notes.subscribe) {
      const unsubscribe = repos.notes.subscribe(() => {
        queryClient.invalidateQueries({ queryKey: NOTES_QUERY_KEY })
      })
      return () => unsubscribe()
    }
  }, [queryClient])

  return useQuery({
    queryKey: NOTES_QUERY_KEY,
    queryFn: async () => {
      const items = await repos.notes.list({
        orderBy: 'updatedAt',
        orderDirection: 'desc',
      })
      // Non-archived first, pinned sorted to top
      return items.filter((n) => !n.archived).sort((a, b) => {
        if (a.pinned && !b.pinned) return -1
        if (!a.pinned && b.pinned) return 1
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      })
    },
  })
}

export function useCreateNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (
      newNote: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'schemaVersion'>
    ) => {
      const now = new Date().toISOString()
      return repos.notes.create({
        ...newNote,
        createdAt: now,
        updatedAt: now,
        schemaVersion: 1,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTES_QUERY_KEY })
    },
  })
}

export function useUpdateNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Note> }) => {
      return repos.notes.update(id, {
        ...patch,
        updatedAt: new Date().toISOString(),
      })
    },
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: NOTES_QUERY_KEY })
      queryClient.setQueriesData<Note[]>({ queryKey: NOTES_QUERY_KEY }, (old) => {
        if (!old) return []
        return old.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n))
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: NOTES_QUERY_KEY })
    },
  })
}

export function useDeleteNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await repos.notes.remove(id)
      return id
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: NOTES_QUERY_KEY })
      queryClient.setQueriesData<Note[]>({ queryKey: NOTES_QUERY_KEY }, (old) => {
        if (!old) return []
        return old.filter((n) => n.id !== id)
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: NOTES_QUERY_KEY })
    },
  })
}
