import { create } from 'zustand'
import { addDays, format, parseISO } from 'date-fns'
import { Task } from '@/data/ports/schemas'

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
 * Calculates a rescheduled date preserving original SRS intervals (+1d, +14d, +60d).
 */
export function calculateSRSChildDate(
  baseDateStr: string,
  intervalDays: number
): string {
  try {
    const base = baseDateStr.includes('T') ? parseISO(baseDateStr) : new Date(baseDateStr + 'T00:00:00')
    const calculated = addDays(base, intervalDays)
    return format(calculated, 'yyyy-MM-dd')
  } catch {
    return baseDateStr
  }
}

/**
 * Detects the review interval (1, 14, 60 days) from a child task's title or attributes.
 */
export function getSRSIntervalDays(childTask: Task): number {
  const title = childTask.title.toLowerCase()
  if (title.includes('2nd review') || title.includes('2 weeks') || title.includes('14d')) {
    return 14
  }
  if (title.includes('3rd review') || title.includes('2 months') || title.includes('60d')) {
    return 60
  }
  return 1 // Default 1st review (24h)
}

export const useTaskStore = create<TaskState>((set) => ({
  tasks: [],

  setTasks: (tasks) => set({ tasks }),

  addTask: (task) =>
    set((state) => ({
      tasks: [task, ...state.tasks],
    })),

  /**
   * Updates a task. If the task is an SRS parent whose date is modified,
   * automatically cascades and recalculates the scheduled/due date of all child tasks.
   */
  updateTask: (id, patch) =>
    set((state) => {
      const target = state.tasks.find((t) => t.id === id)
      if (!target) return state

      const newDate = patch.scheduledDate !== undefined ? patch.scheduledDate : patch.dueDate
      const dateChanged =
        newDate !== undefined &&
        newDate !== null &&
        newDate !== target.scheduledDate &&
        newDate !== target.dueDate

      // Cascade reschedule child tasks if parent task date is updated
      if (target.srsGroupId && target.srsRole === 'parent' && dateChanged && newDate) {
        return {
          tasks: state.tasks.map((t) => {
            if (t.id === id) {
              return {
                ...t,
                ...patch,
                scheduledDate: newDate,
                dueDate: newDate,
                updatedAt: new Date().toISOString(),
              }
            }
            if (t.srsGroupId === target.srsGroupId && t.srsRole === 'child') {
              const intervalDays = getSRSIntervalDays(t)
              const childNewDate = calculateSRSChildDate(newDate, intervalDays)
              return {
                ...t,
                scheduledDate: childNewDate,
                dueDate: childNewDate,
                updatedAt: new Date().toISOString(),
              }
            }
            return t
          }),
        }
      }

      return {
        tasks: state.tasks.map((t) =>
          t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t
        ),
      }
    }),

  /**
   * Deletes a task. If the task has an srsGroupId, cascades and deletes ALL other tasks
   * sharing that exact srsGroupId.
   */
  deleteTask: (id) =>
    set((state) => {
      const target = state.tasks.find((t) => t.id === id)
      if (target?.srsGroupId) {
        return {
          tasks: state.tasks.filter((t) => t.srsGroupId !== target.srsGroupId),
        }
      }
      return {
        tasks: state.tasks.filter((t) => t.id !== id),
      }
    }),

  /**
   * Explicit cascade delete for an entire SRS group.
   */
  cascadeDeleteSRS: (srsGroupId) =>
    set((state) => ({
      tasks: state.tasks.filter((t) => t.srsGroupId !== srsGroupId),
    })),

  /**
   * Explicit cascade reschedule for child tasks of an SRS parent.
   */
  cascadeRescheduleSRS: (parentId, newScheduledDate) =>
    set((state) => {
      const parent = state.tasks.find((t) => t.id === parentId)
      if (!parent?.srsGroupId) return state

      return {
        tasks: state.tasks.map((t) => {
          if (t.id === parentId) {
            return {
              ...t,
              scheduledDate: newScheduledDate,
              dueDate: newScheduledDate,
              updatedAt: new Date().toISOString(),
            }
          }
          if (t.srsGroupId === parent.srsGroupId && t.srsRole === 'child') {
            const intervalDays = getSRSIntervalDays(t)
            const childDate = calculateSRSChildDate(newScheduledDate, intervalDays)
            return {
              ...t,
              scheduledDate: childDate,
              dueDate: childDate,
              updatedAt: new Date().toISOString(),
            }
          }
          return t
        }),
      }
    }),
}))
