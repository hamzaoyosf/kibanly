import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { repos } from '@/data'
import { Task } from '@/data/ports/schemas'
import { QueryOpts } from '@/data/ports/Repo'

export const TASKS_QUERY_KEY = ['tasks']

export function useTasks(queryOpts?: QueryOpts) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (repos.tasks.subscribe) {
      const unsubscribe = repos.tasks.subscribe((items) => {
        queryClient.setQueryData(TASKS_QUERY_KEY, items)
      })
      return () => unsubscribe()
    }
  }, [queryClient])

  return useQuery({
    queryKey: queryOpts ? [...TASKS_QUERY_KEY, queryOpts] : TASKS_QUERY_KEY,
    queryFn: () => repos.tasks.list(queryOpts),
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (newTask: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'schemaVersion'>) => {
      return repos.tasks.create({
        ...newTask,
        schemaVersion: 1,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY })
    },
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Task> }) => {
      return repos.tasks.update(id, patch)
    },
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: TASKS_QUERY_KEY })
      const previous = queryClient.getQueryData<Task[]>(TASKS_QUERY_KEY) || []
      queryClient.setQueryData<Task[]>(
        TASKS_QUERY_KEY,
        previous.map((t) => (t.id === id ? { ...t, ...patch } : t))
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(TASKS_QUERY_KEY, context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY })
    },
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => {
      return repos.tasks.remove(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY })
    },
  })
}
