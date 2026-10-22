import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { repos } from '@/data'
import { Task } from '@/data/ports/schemas'
import { QueryOpts } from '@/data/ports/Repo'
import {
  calculateRecallChildDate,
  getRecallIntervalDays,
  useTaskStore,
} from '@/app/store/taskStore'

export const TASKS_QUERY_KEY = ['tasks']

export function useTasks(queryOpts?: QueryOpts) {
  const queryClient = useQueryClient()
  const setTasksInStore = useTaskStore((s) => s.setTasks)

  useEffect(() => {
    if (repos.tasks.subscribe) {
      const unsubscribe = repos.tasks.subscribe((items) => {
        queryClient.setQueryData(TASKS_QUERY_KEY, items)
        setTasksInStore(items)
      })
      return () => unsubscribe()
    }
  }, [queryClient, setTasksInStore])

  return useQuery({
    queryKey: queryOpts ? [...TASKS_QUERY_KEY, queryOpts] : TASKS_QUERY_KEY,
    queryFn: async () => {
      const list = await repos.tasks.list(queryOpts)
      setTasksInStore(list)
      return list
    },
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
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Task> }) => {
      // If scheduledDate is updated, ensure dueDate matches and vice-versa
      const effectiveScheduledDate =
        patch.scheduledDate !== undefined
          ? patch.scheduledDate
          : patch.dueDate !== undefined
          ? patch.dueDate
          : undefined

      const effectivePatch: Partial<Task> = { ...patch }
      if (effectiveScheduledDate !== undefined && effectiveScheduledDate !== null) {
        const cleanDate = String(effectiveScheduledDate).trim().split('T')[0]
        effectivePatch.scheduledDate = cleanDate
        effectivePatch.dueDate = cleanDate
      }

      // Delegate to taskStore.updateTask (handles Grace Period, Reset Penalty & repo persist)
      useTaskStore.getState().updateTask(id, effectivePatch)

      // Update the target task in repository
      return await repos.tasks.update(id, effectivePatch)
    },
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: TASKS_QUERY_KEY })
      const previous = queryClient.getQueryData<Task[]>(TASKS_QUERY_KEY) || []
      const target = previous.find((t) => t.id === id)

      const effectiveScheduledDate =
        patch.scheduledDate !== undefined
          ? patch.scheduledDate
          : patch.dueDate !== undefined
          ? patch.dueDate
          : undefined

      const groupId = target?.recallGroupId || target?.srsGroupId
      const role = target?.recallRole || target?.srsRole

      const isParentRecall = Boolean(
        groupId && (role === 'parent' || !role) && effectiveScheduledDate
      )

      const parentDateStr = effectiveScheduledDate
        ? String(effectiveScheduledDate).trim().split('T')[0]
        : undefined

      queryClient.setQueryData<Task[]>(
        TASKS_QUERY_KEY,
        previous.map((t) => {
          if (t.id === id) {
            return {
              ...t,
              ...patch,
              ...(parentDateStr !== undefined && {
                scheduledDate: parentDateStr,
                dueDate: parentDateStr,
              }),
            }
          }
          if (
            isParentRecall &&
            (t.recallGroupId === groupId || t.srsGroupId === groupId) &&
            ((t.recallRole || t.srsRole) === 'child' || t.id !== id) &&
            parentDateStr
          ) {
            const intervalDays = getRecallIntervalDays(t)
            const newChildDate = calculateRecallChildDate(parentDateStr, intervalDays)
            return {
              ...t,
              scheduledDate: newChildDate,
              dueDate: newChildDate,
            }
          }
          return t
        })
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
    mutationFn: async (id: string) => {
      // 1. Sync with taskStore (Zustand)
      useTaskStore.getState().deleteTask(id)

      // 2. Inspect if task belongs to a Recall group
      let target: Task | null = null
      const cached = queryClient.getQueryData<Task[]>(TASKS_QUERY_KEY)
      if (cached) {
        target = cached.find((t) => t.id === id) || null
      }
      if (!target) {
        target = await repos.tasks.get(id)
      }

      const groupId = target?.recallGroupId || target?.srsGroupId
      // 3. Cascade Delete: If it has recallGroupId, delete ALL tasks sharing that recallGroupId
      if (groupId) {
        const allTasks = await repos.tasks.list()
        const recallTasks = allTasks.filter(
          (t) => (t.recallGroupId || t.srsGroupId) === groupId
        )
        if (recallTasks.length > 0) {
          await Promise.all(recallTasks.map((t) => repos.tasks.remove(t.id)))
          return
        }
      }

      // Otherwise delete single task
      await repos.tasks.remove(id)
    },
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: TASKS_QUERY_KEY })
      const previous = queryClient.getQueryData<Task[]>(TASKS_QUERY_KEY) || []
      const target = previous.find((t) => t.id === id)
      const groupId = target?.recallGroupId || target?.srsGroupId

      if (groupId) {
        queryClient.setQueryData<Task[]>(
          TASKS_QUERY_KEY,
          previous.filter((t) => (t.recallGroupId || t.srsGroupId) !== groupId)
        )
      } else {
        queryClient.setQueryData<Task[]>(
          TASKS_QUERY_KEY,
          previous.filter((t) => t.id !== id)
        )
      }
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
