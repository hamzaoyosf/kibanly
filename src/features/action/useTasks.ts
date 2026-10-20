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
      // 1. Fetch current task to inspect SRS metadata
      let target: Task | null = null
      const cached = queryClient.getQueryData<Task[]>(TASKS_QUERY_KEY)
      if (cached) {
        target = cached.find((t) => t.id === id) || null
      }
      if (!target) {
        target = await repos.tasks.get(id)
      }

      // If scheduledDate is updated, ensure dueDate matches and vice-versa
      const effectiveScheduledDate =
        patch.scheduledDate !== undefined
          ? patch.scheduledDate
          : patch.dueDate !== undefined
          ? patch.dueDate
          : undefined

      const effectivePatch: Partial<Task> = { ...patch }
      if (effectiveScheduledDate !== undefined) {
        effectivePatch.scheduledDate = effectiveScheduledDate
        effectivePatch.dueDate = effectiveScheduledDate
      }

      // Update the target task
      const updated = await repos.tasks.update(id, effectivePatch)

      // 2. Cascade Reschedule: If a 'parent' task's date is updated, recalculate child tasks (+1d, +14d, +60d)
      const dateChanged =
        target?.srsGroupId &&
        target.srsRole === 'parent' &&
        effectiveScheduledDate !== undefined &&
        effectiveScheduledDate !== null &&
        effectiveScheduledDate !== (target.scheduledDate || target.dueDate)

      if (dateChanged && target?.srsGroupId && effectiveScheduledDate) {
        const allRepoTasks = await repos.tasks.list()
        const childTasks = allRepoTasks.filter(
          (t) => t.srsGroupId === target.srsGroupId && t.srsRole === 'child'
        )

        for (const child of childTasks) {
          const intervalDays = getSRSIntervalDays(child)
          const newChildDate = calculateSRSChildDate(effectiveScheduledDate, intervalDays)
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

      const dateChanged =
        target?.srsGroupId &&
        target.srsRole === 'parent' &&
        effectiveScheduledDate !== undefined &&
        effectiveScheduledDate !== null &&
        effectiveScheduledDate !== (target.scheduledDate || target.dueDate)

      queryClient.setQueryData<Task[]>(
        TASKS_QUERY_KEY,
        previous.map((t) => {
          if (t.id === id) {
            return {
              ...t,
              ...patch,
              ...(effectiveScheduledDate !== undefined && {
                scheduledDate: effectiveScheduledDate,
                dueDate: effectiveScheduledDate,
              }),
            }
          }
          if (dateChanged && t.srsGroupId === target.srsGroupId && t.srsRole === 'child' && effectiveScheduledDate) {
            const intervalDays = getSRSIntervalDays(t)
            const newChildDate = calculateSRSChildDate(effectiveScheduledDate, intervalDays)
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
      // 1. Inspect if task belongs to an SRS group
      let target: Task | null = null
      const cached = queryClient.getQueryData<Task[]>(TASKS_QUERY_KEY)
      if (cached) {
        target = cached.find((t) => t.id === id) || null
      }
      if (!target) {
        target = await repos.tasks.get(id)
      }

      // 2. Cascade Delete: If it has srsGroupId, delete ALL tasks sharing that srsGroupId
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
