import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { repos } from '@/data'
import { Task } from '@/data/ports/schemas'
import { QueryOpts } from '@/data/ports/Repo'
import { calculateSRSChildDate, getSRSIntervalDays, useTaskStore } from '@/app/store/taskStore'

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

      // Update Zustand taskStore directly (which also updates state & triggers cascade)
      useTaskStore.getState().updateTask(id, effectivePatch)

      // Fetch target from repository or store
      const target =
        (await repos.tasks.get(id)) ||
        useTaskStore.getState().tasks.find((t) => t.id === id)

      // Update the target task in repository
      const updated = await repos.tasks.update(id, effectivePatch)

      // Cascade Reschedule: If a 'parent' task's date is updated, recalculate child tasks (+1d, +14d, +60d)
      if (
        target?.srsGroupId &&
        (target.srsRole === 'parent' || !target.srsRole) &&
        effectivePatch.scheduledDate
      ) {
        const parentDateStr = effectivePatch.scheduledDate
        const allRepoTasks = await repos.tasks.list()
        const childTasks = allRepoTasks.filter(
          (t) => t.srsGroupId === target.srsGroupId && (t.srsRole === 'child' || t.id !== id)
        )

        for (const child of childTasks) {
          const intervalDays = getSRSIntervalDays(child)
          const newChildDate = calculateSRSChildDate(parentDateStr, intervalDays)
          await repos.tasks.update(child.id, {
            scheduledDate: newChildDate,
            dueDate: newChildDate,
          })
        }
      }

      return updated
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

      const isParentSRS = Boolean(
        target?.srsGroupId &&
        (target.srsRole === 'parent' || !target.srsRole) &&
        effectiveScheduledDate
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
            isParentSRS &&
            t.srsGroupId === target?.srsGroupId &&
            (t.srsRole === 'child' || t.id !== id) &&
            parentDateStr
          ) {
            const intervalDays = getSRSIntervalDays(t)
            const newChildDate = calculateSRSChildDate(parentDateStr, intervalDays)
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

      // 2. Inspect if task belongs to an SRS group
      let target: Task | null = null
      const cached = queryClient.getQueryData<Task[]>(TASKS_QUERY_KEY)
      if (cached) {
        target = cached.find((t) => t.id === id) || null
      }
      if (!target) {
        target = await repos.tasks.get(id)
      }

      // 3. Cascade Delete: If it has srsGroupId, delete ALL tasks sharing that srsGroupId
      if (target?.srsGroupId) {
        const allTasks = await repos.tasks.list()
        const srsGroupTasks = allTasks.filter((t) => t.srsGroupId === target.srsGroupId)
        if (srsGroupTasks.length > 0) {
          await Promise.all(srsGroupTasks.map((t) => repos.tasks.remove(t.id)))
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

      if (target?.srsGroupId) {
        queryClient.setQueryData<Task[]>(
          TASKS_QUERY_KEY,
          previous.filter((t) => t.srsGroupId !== target.srsGroupId)
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
