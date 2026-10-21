import { create } from 'zustand'
import { addDays, format, parseISO } from 'date-fns'
import { Task } from '@/data/ports/schemas'
import { repos } from '@/data'

interface TaskState {
  tasks: Task[]
  setTasks: (tasks: Task[]) => void
  addTask: (task: Task) => void
  updateTask: (id: string, patch: Partial<Task>) => void
  deleteTask: (id: string) => void
  cascadeDeleteSRS: (srsGroupId: string) => void
  cascadeRescheduleSRS: (parentId: string, newScheduledDate: string) => void
}

/**
 * Calculates a rescheduled date preserving original SRS intervals (+1d, +14d, +60d)
 * using robust calendar date math that handles month/year rollovers accurately.
 */
export function calculateSRSChildDate(
  baseDateStr: string,
  intervalDays: number
): string {
  try {
    const dateOnly = baseDateStr.trim().split('T')[0]
    const [yearStr, monthStr, dayStr] = dateOnly.split('-')
    const year = parseInt(yearStr, 10)
    const month = parseInt(monthStr, 10) - 1
    const day = parseInt(dayStr, 10)
    const base = new Date(year, month, day)
    const calculated = addDays(base, intervalDays)
    return format(calculated, 'yyyy-MM-dd')
  } catch {
    try {
      const parsed = parseISO(baseDateStr)
      return format(addDays(parsed, intervalDays), 'yyyy-MM-dd')
    } catch {
      return baseDateStr
    }
  }
}

/**
 * Detects the review interval (1, 14, 60 days) from a child task:
 * - "1st Review" child -> +1 day
 * - "2nd Review" child -> +14 days
 * - "3rd Review" child -> +60 days
 */
export function getSRSIntervalDays(childTask: Task): number {
  const title = (childTask.title || '').toLowerCase()
  const tags = childTask.tags || []

  if (
    title.includes('3rd review') ||
    title.includes('3rd') ||
    title.includes('2 month') ||
    title.includes('60d') ||
    title.includes('60 days') ||
    tags.includes('2m') ||
    tags.includes('60d')
  ) {
    return 60
  }

  if (
    title.includes('2nd review') ||
    title.includes('2nd') ||
    title.includes('2 week') ||
    title.includes('14d') ||
    title.includes('14 days') ||
    tags.includes('2w') ||
    tags.includes('14d')
  ) {
    return 14
  }

  if (
    title.includes('1st review') ||
    title.includes('1st') ||
    title.includes('24h') ||
    title.includes('1 day') ||
    title.includes('1d') ||
    tags.includes('24h') ||
    tags.includes('1d')
  ) {
    return 1
  }

  return 1
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],

  setTasks: (tasks) => set({ tasks }),

  addTask: (task) =>
    set((state) => ({
      tasks: [task, ...state.tasks],
    })),

  /**
   * Updates a task. If a task with srsRole === 'parent' has its scheduledDate changed:
   * 1. Extract the NEW scheduledDate of the parent.
   * 2. Query the store for all child tasks with the matching srsGroupId.
   * 3. Recalculate and update their scheduledDate strictly based on the parent's new date:
   *    - "1st Review" child -> Parent New Date + 1 day
   *    - "2nd Review" child -> Parent New Date + 14 days
   *    - "3rd Review" child -> Parent New Date + 60 days
   */
  updateTask: (id, patch) => {
    const currentTasks = get().tasks
    const target = currentTasks.find((t) => t.id === id)
    if (!target) return

    // 1. Extract the NEW scheduledDate of the parent
    const newScheduledDate =
      patch.scheduledDate !== undefined
        ? patch.scheduledDate
        : patch.dueDate !== undefined
        ? patch.dueDate
        : undefined

    const isParent = (target.srsRole === 'parent' || (!target.srsRole && !!target.srsGroupId)) && !!target.srsGroupId
    const hasNewDate = Boolean(
      newScheduledDate && typeof newScheduledDate === 'string' && newScheduledDate.trim().length > 0
    )

    if (isParent && target.srsGroupId && hasNewDate && newScheduledDate) {
      const parentNewDateStr = newScheduledDate.trim().split('T')[0]

      // 2. Query the store for all child tasks with matching srsGroupId
      // 3. Recalculate and update their scheduledDate strictly based on the parent's new date
      const updatedTasks = currentTasks.map((t) => {
        if (t.id === id) {
          return {
            ...t,
            ...patch,
            scheduledDate: parentNewDateStr,
            dueDate: parentNewDateStr,
            updatedAt: new Date().toISOString(),
          }
        }
        if (t.srsGroupId === target.srsGroupId && (t.srsRole === 'child' || t.id !== id)) {
          const intervalDays = getSRSIntervalDays(t)
          const childNewDate = calculateSRSChildDate(parentNewDateStr, intervalDays)
          return {
            ...t,
            scheduledDate: childNewDate,
            dueDate: childNewDate,
            updatedAt: new Date().toISOString(),
          }
        }
        return t
      })

      set({ tasks: updatedTasks })

      // Persist to repository if available
      try {
        repos.tasks.update(id, {
          ...patch,
          scheduledDate: parentNewDateStr,
          dueDate: parentNewDateStr,
        }).catch(() => {})

        const children = updatedTasks.filter(
          (t) => t.srsGroupId === target.srsGroupId && (t.srsRole === 'child' || t.id !== id)
        )
        for (const child of children) {
          repos.tasks.update(child.id, {
            scheduledDate: child.scheduledDate,
            dueDate: child.dueDate,
          }).catch(() => {})
        }
      } catch {
        // Safe for standalone unit tests
      }
      return
    }

    // Standard task update
    const updatedTasks = currentTasks.map((t) =>
      t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t
    )
    set({ tasks: updatedTasks })

    try {
      repos.tasks.update(id, patch).catch(() => {})
    } catch {
      // Safe for standalone unit tests
    }
  },

  /**
   * Deletes a task. If the task has an srsGroupId, cascades and deletes ALL other tasks
   * sharing that exact srsGroupId.
   */
  deleteTask: (id) => {
    const currentTasks = get().tasks
    const target = currentTasks.find((t) => t.id === id)
    if (target?.srsGroupId) {
      const remaining = currentTasks.filter((t) => t.srsGroupId !== target.srsGroupId)
      set({ tasks: remaining })
      try {
        const toDelete = currentTasks.filter((t) => t.srsGroupId === target.srsGroupId)
        toDelete.forEach((t) => repos.tasks.remove(t.id).catch(() => {}))
      } catch {}
      return
    }

    set({ tasks: currentTasks.filter((t) => t.id !== id) })
    try {
      repos.tasks.remove(id).catch(() => {})
    } catch {}
  },

  /**
   * Explicit cascade delete for an entire SRS group.
   */
  cascadeDeleteSRS: (srsGroupId) => {
    const currentTasks = get().tasks
    set({ tasks: currentTasks.filter((t) => t.srsGroupId !== srsGroupId) })
    try {
      const toDelete = currentTasks.filter((t) => t.srsGroupId === srsGroupId)
      toDelete.forEach((t) => repos.tasks.remove(t.id).catch(() => {}))
    } catch {}
  },

  /**
   * Explicit cascade reschedule for child tasks of an SRS parent.
   */
  cascadeRescheduleSRS: (parentId, newScheduledDate) => {
    const currentTasks = get().tasks
    const parent = currentTasks.find((t) => t.id === parentId)
    if (!parent?.srsGroupId) return

    const parentDate = String(newScheduledDate).trim().split('T')[0]
    const updatedTasks = currentTasks.map((t) => {
      if (t.id === parentId) {
        return {
          ...t,
          scheduledDate: parentDate,
          dueDate: parentDate,
          updatedAt: new Date().toISOString(),
        }
      }
      if (t.srsGroupId === parent.srsGroupId && (t.srsRole === 'child' || t.id !== parentId)) {
        const intervalDays = getSRSIntervalDays(t)
        const childDate = calculateSRSChildDate(parentDate, intervalDays)
        return {
          ...t,
          scheduledDate: childDate,
          dueDate: childDate,
          updatedAt: new Date().toISOString(),
        }
      }
      return t
    })

    set({ tasks: updatedTasks })
    try {
      repos.tasks.update(parentId, { scheduledDate: parentDate, dueDate: parentDate }).catch(() => {})
      const children = updatedTasks.filter(
        (t) => t.srsGroupId === parent.srsGroupId && (t.srsRole === 'child' || t.id !== parentId)
      )
      children.forEach((c) =>
        repos.tasks.update(c.id, { scheduledDate: c.scheduledDate, dueDate: c.dueDate }).catch(() => {})
      )
    } catch {}
  },
}))
