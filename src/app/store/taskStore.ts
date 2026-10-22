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
  cascadeDeleteRecall: (recallGroupId: string) => void
  cascadeRescheduleRecall: (parentId: string, newScheduledDate: string) => void
  cascadeDeleteSRS: (srsGroupId: string) => void
  cascadeRescheduleSRS: (parentId: string, newScheduledDate: string) => void
}

/**
 * Calculates a rescheduled date preserving intervals (+1d, +14d, +60d or deltaDays)
 * using robust calendar date math that handles month/year rollovers accurately.
 */
export function calculateRecallChildDate(
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

// Backwards-compatible alias
export const calculateSRSChildDate = calculateRecallChildDate

/**
 * Computes difference in calendar days: d1 - d2.
 */
export function getCalendarDaysDiff(d1Str: string, d2Str: string): number {
  try {
    const clean1 = d1Str.trim().split('T')[0]
    const clean2 = d2Str.trim().split('T')[0]
    const [y1, m1, day1] = clean1.split('-').map(Number)
    const [y2, m2, day2] = clean2.split('-').map(Number)
    const utc1 = Date.UTC(y1, m1 - 1, day1)
    const utc2 = Date.UTC(y2, m2 - 1, day2)
    return Math.round((utc1 - utc2) / (1000 * 60 * 60 * 24))
  } catch {
    return 0
  }
}

/**
 * Strips review/recall prefixes to extract the base underlying task title.
 */
export function extractBaseRecallTitle(title: string): string {
  return title.replace(/^(1st|2nd|3rd)\s+(Recall|Review)[^:]*:\s*/i, '').trim()
}

/**
 * Returns the sequence step (1, 2, or 3) of a Recall card.
 */
export function getRecallCardStep(task: Task): 1 | 2 | 3 {
  const title = (task.title || '').toLowerCase()
  const tags = task.tags || []

  if (
    title.includes('3rd recall') ||
    title.includes('3rd review') ||
    title.includes('3rd') ||
    title.includes('2 month') ||
    title.includes('60d') ||
    tags.includes('2m') ||
    tags.includes('60d')
  ) {
    return 3
  }

  if (
    title.includes('2nd recall') ||
    title.includes('2nd review') ||
    title.includes('2nd') ||
    title.includes('2 week') ||
    title.includes('14d') ||
    tags.includes('2w') ||
    tags.includes('14d')
  ) {
    return 2
  }

  return 1
}

/**
 * Detects the review interval (1, 14, 60 days) from a child task:
 * - "1st Recall" child -> +1 day
 * - "2nd Recall" child -> +14 days
 * - "3rd Recall" child -> +60 days
 */
export function getRecallIntervalDays(childTask: Task): number {
  const step = getRecallCardStep(childTask)
  if (step === 3) return 60
  if (step === 2) return 14
  return 1
}

// Backwards-compatible alias
export const getSRSIntervalDays = getRecallIntervalDays

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],

  setTasks: (tasks) => set({ tasks }),

  addTask: (task) =>
    set((state) => ({
      tasks: [task, ...state.tasks],
    })),

  /**
   * Updates a task with integrated anti-procrastination cognitive science rules:
   * 1. Parent Date Update: Cascades and recalculates all child review intervals (+1d, +14d, +60d).
   * 2. Child Date Update:
   *    - Grace Period (deltaDays <= 2): Applies Forward Cascading Shift to this card and all subsequent child cards.
   *    - Reset Penalty (deltaDays > 2): Resets current card back to "1st Recall (24h)", purges subsequent child cards,
   *      and regenerates new "2nd Recall" (+14d) and "3rd Recall" (+60d) cards.
   */
  updateTask: (id, patch) => {
    const currentTasks = get().tasks
    const target = currentTasks.find((t) => t.id === id)
    if (!target) return

    const groupId = target.recallGroupId || target.srsGroupId
    const role = target.recallRole || target.srsRole

    const newScheduledDate =
      patch.scheduledDate !== undefined
        ? patch.scheduledDate
        : patch.dueDate !== undefined
        ? patch.dueDate
        : undefined

    const hasNewDate = Boolean(
      newScheduledDate && typeof newScheduledDate === 'string' && newScheduledDate.trim().length > 0
    )

    // CASE 1: PARENT TASK RESCHEDULE
    if (role === 'parent' && groupId && hasNewDate && newScheduledDate) {
      const parentNewDateStr = newScheduledDate.trim().split('T')[0]

      const updatedTasks = currentTasks.map((t) => {
        const tGroupId = t.recallGroupId || t.srsGroupId
        const tRole = t.recallRole || t.srsRole

        if (t.id === id) {
          return {
            ...t,
            ...patch,
            scheduledDate: parentNewDateStr,
            dueDate: parentNewDateStr,
            recallGroupId: groupId,
            recallRole: 'parent' as const,
            srsGroupId: groupId,
            srsRole: 'parent' as const,
            updatedAt: new Date().toISOString(),
          }
        }
        if (tGroupId === groupId && (tRole === 'child' || t.id !== id)) {
          const intervalDays = getRecallIntervalDays(t)
          const childNewDate = calculateRecallChildDate(parentNewDateStr, intervalDays)
          return {
            ...t,
            scheduledDate: childNewDate,
            dueDate: childNewDate,
            recallGroupId: groupId,
            recallRole: 'child' as const,
            srsGroupId: groupId,
            srsRole: 'child' as const,
            updatedAt: new Date().toISOString(),
          }
        }
        return t
      })

      set({ tasks: updatedTasks })

      try {
        repos.tasks.update(id, {
          ...patch,
          scheduledDate: parentNewDateStr,
          dueDate: parentNewDateStr,
          recallGroupId: groupId,
          recallRole: 'parent',
        }).catch(() => {})

        const children = updatedTasks.filter(
          (t) => (t.recallGroupId === groupId || t.srsGroupId === groupId) && t.id !== id
        )
        for (const child of children) {
          repos.tasks.update(child.id, {
            scheduledDate: child.scheduledDate,
            dueDate: child.dueDate,
          }).catch(() => {})
        }
      } catch {}
      return
    }

    // CASE 2: CHILD RECALL TASK RESCHEDULE (ANTI-PROCRASTINATION RULES)
    if (role === 'child' && groupId && hasNewDate && newScheduledDate) {
      const newDateStr = newScheduledDate.trim().split('T')[0]
      const oldDateStr = (target.scheduledDate || target.dueDate || newDateStr).trim().split('T')[0]
      const deltaDays = getCalendarDaysDiff(newDateStr, oldDateStr)

      // If no change in date, do normal field update
      if (deltaDays === 0) {
        const updatedTasks = currentTasks.map((t) =>
          t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t
        )
        set({ tasks: updatedTasks })
        try {
          repos.tasks.update(id, patch).catch(() => {})
        } catch {}
        return
      }

      const currentStep = getRecallCardStep(target)
      const baseTitle = extractBaseRecallTitle(target.title)

      // SUBCASE 2A: THE GRACE PERIOD (deltaDays <= 2)
      // Apply Forward Cascading Shift: shift this card and all subsequent child cards forward by exact deltaDays
      if (deltaDays <= 2) {
        const updatedTasks = currentTasks.map((t) => {
          const tGroupId = t.recallGroupId || t.srsGroupId
          const tRole = t.recallRole || t.srsRole

          if (t.id === id) {
            return {
              ...t,
              ...patch,
              scheduledDate: newDateStr,
              dueDate: newDateStr,
              recallGroupId: groupId,
              recallRole: 'child' as const,
              srsGroupId: groupId,
              srsRole: 'child' as const,
              updatedAt: new Date().toISOString(),
            }
          }

          // Subsequent child card in the sequence
          if (tGroupId === groupId && tRole === 'child' && getRecallCardStep(t) > currentStep) {
            const childCurrentDate = (t.scheduledDate || t.dueDate || newDateStr).trim().split('T')[0]
            const shiftedChildDate = calculateRecallChildDate(childCurrentDate, deltaDays)
            return {
              ...t,
              scheduledDate: shiftedChildDate,
              dueDate: shiftedChildDate,
              recallGroupId: groupId,
              recallRole: 'child' as const,
              srsGroupId: groupId,
              srsRole: 'child' as const,
              updatedAt: new Date().toISOString(),
            }
          }

          return t
        })

        set({ tasks: updatedTasks })

        try {
          repos.tasks.update(id, {
            ...patch,
            scheduledDate: newDateStr,
            dueDate: newDateStr,
          }).catch(() => {})

          const subsequent = updatedTasks.filter(
            (t) => (t.recallGroupId === groupId || t.srsGroupId === groupId) && (t.recallRole === 'child' || t.srsRole === 'child') && getRecallCardStep(t) > currentStep
          )
          for (const s of subsequent) {
            repos.tasks.update(s.id, {
              scheduledDate: s.scheduledDate,
              dueDate: s.dueDate,
            }).catch(() => {})
          }
        } catch {}
        return
      }

      // SUBCASE 2B: THE RESET PENALTY (deltaDays > 2)
      // Cognitive retention curve broken:
      // 1. Change current card title back to "1st Recall (24h)"
      // 2. Delete all subsequent child cards for this recallGroupId
      // 3. Regenerate new "2nd Recall" (+14d) and "3rd Recall" (+60d)
      const subsequentToDelete = currentTasks.filter(
        (t) => (t.recallGroupId === groupId || t.srsGroupId === groupId) && (t.recallRole === 'child' || t.srsRole === 'child') && t.id !== id && getRecallCardStep(t) > currentStep
      )
      const deleteIds = new Set(subsequentToDelete.map((t) => t.id))

      const updatedCurrentCard: Task = {
        ...target,
        ...patch,
        title: `1st Recall (24h): ${baseTitle}`,
        scheduledDate: newDateStr,
        dueDate: newDateStr,
        recallGroupId: groupId,
        recallRole: 'child',
        srsGroupId: groupId,
        srsRole: 'child',
        tags: ['recall-review', '24h'],
        notes: `1st Recall (24h - Reset Penalty): Delay of ${deltaDays}d broke the cognitive retention curve. Rebuilding foundational recall memory trace for "${baseTitle}".`,
        updatedAt: new Date().toISOString(),
      }

      const newDate2 = calculateRecallChildDate(newDateStr, 14)
      const newChild2: Task = {
        id: `rec_${Date.now()}_2_${Math.random().toString(36).slice(2, 6)}`,
        title: `2nd Recall (2 weeks): ${baseTitle}`,
        notes: `2nd Recall (2 weeks) for "${baseTitle}". Retention evaluation following Reset Penalty recovery.`,
        status: 'draft',
        gtdList: 'scheduled',
        quadrant: 'schedule',
        priority: target.priority || 'medium',
        dueDate: newDate2,
        scheduledDate: newDate2,
        recallGroupId: groupId,
        recallRole: 'child',
        srsGroupId: groupId,
        srsRole: 'child',
        estimateMin: 20,
        context: ['@computer'],
        tags: ['recall-review', '2w'],
        projectId: target.projectId || null,
        areaId: target.areaId || null,
        waitingFor: null,
        subtasks: [],
        calendarEventId: null,
        order: 1002,
        completedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        schemaVersion: 1,
      }

      const newDate3 = calculateRecallChildDate(newDateStr, 60)
      const newChild3: Task = {
        id: `rec_${Date.now()}_3_${Math.random().toString(36).slice(2, 6)}`,
        title: `3rd Recall (2 months): ${baseTitle}`,
        notes: `3rd Recall (2 months) for "${baseTitle}". Long-term mastery verification following Reset Penalty recovery.`,
        status: 'draft',
        gtdList: 'scheduled',
        quadrant: 'schedule',
        priority: target.priority || 'medium',
        dueDate: newDate3,
        scheduledDate: newDate3,
        recallGroupId: groupId,
        recallRole: 'child',
        srsGroupId: groupId,
        srsRole: 'child',
        estimateMin: 30,
        context: ['@computer'],
        tags: ['recall-review', '2m'],
        projectId: target.projectId || null,
        areaId: target.areaId || null,
        waitingFor: null,
        subtasks: [],
        calendarEventId: null,
        order: 1003,
        completedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        schemaVersion: 1,
      }

      const survivingTasks = currentTasks
        .filter((t) => !deleteIds.has(t.id))
        .map((t) => (t.id === id ? updatedCurrentCard : t))

      const finalTasks = [...survivingTasks, newChild2, newChild3]
      set({ tasks: finalTasks })

      try {
        repos.tasks.update(id, updatedCurrentCard).catch(() => {})
        subsequentToDelete.forEach((del) => repos.tasks.remove(del.id).catch(() => {}))
        repos.tasks.create(newChild2).catch(() => {})
        repos.tasks.create(newChild3).catch(() => {})
      } catch {}
      return
    }

    // STANDARD TASK UPDATE
    const updatedTasks = currentTasks.map((t) =>
      t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t
    )
    set({ tasks: updatedTasks })

    try {
      repos.tasks.update(id, patch).catch(() => {})
    } catch {}
  },

  /**
   * Deletes a task. If the task has a recallGroupId, cascades and deletes ALL other tasks
   * sharing that exact recallGroupId.
   */
  deleteTask: (id) => {
    const currentTasks = get().tasks
    const target = currentTasks.find((t) => t.id === id)
    const groupId = target?.recallGroupId || target?.srsGroupId

    if (groupId) {
      const remaining = currentTasks.filter(
        (t) => (t.recallGroupId || t.srsGroupId) !== groupId
      )
      set({ tasks: remaining })
      try {
        const toDelete = currentTasks.filter(
          (t) => (t.recallGroupId || t.srsGroupId) === groupId
        )
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
   * Explicit cascade delete for an entire Recall group.
   */
  cascadeDeleteRecall: (recallGroupId) => {
    const currentTasks = get().tasks
    set({
      tasks: currentTasks.filter(
        (t) => (t.recallGroupId || t.srsGroupId) !== recallGroupId
      ),
    })
    try {
      const toDelete = currentTasks.filter(
        (t) => (t.recallGroupId || t.srsGroupId) === recallGroupId
      )
      toDelete.forEach((t) => repos.tasks.remove(t.id).catch(() => {}))
    } catch {}
  },

  cascadeDeleteSRS: (srsGroupId) => {
    get().cascadeDeleteRecall(srsGroupId)
  },

  /**
   * Explicit cascade reschedule for child tasks of a Recall parent.
   */
  cascadeRescheduleRecall: (parentId, newScheduledDate) => {
    const currentTasks = get().tasks
    const parent = currentTasks.find((t) => t.id === parentId)
    const groupId = parent?.recallGroupId || parent?.srsGroupId
    if (!groupId) return

    const parentDate = String(newScheduledDate).trim().split('T')[0]
    const updatedTasks = currentTasks.map((t) => {
      const tGroupId = t.recallGroupId || t.srsGroupId
      const tRole = t.recallRole || t.srsRole

      if (t.id === parentId) {
        return {
          ...t,
          scheduledDate: parentDate,
          dueDate: parentDate,
          recallGroupId: groupId,
          recallRole: 'parent' as const,
          updatedAt: new Date().toISOString(),
        }
      }
      if (tGroupId === groupId && (tRole === 'child' || t.id !== parentId)) {
        const intervalDays = getRecallIntervalDays(t)
        const childDate = calculateRecallChildDate(parentDate, intervalDays)
        return {
          ...t,
          scheduledDate: childDate,
          dueDate: childDate,
          recallGroupId: groupId,
          recallRole: 'child' as const,
          updatedAt: new Date().toISOString(),
        }
      }
      return t
    })

    set({ tasks: updatedTasks })
    try {
      repos.tasks.update(parentId, { scheduledDate: parentDate, dueDate: parentDate }).catch(() => {})
      const children = updatedTasks.filter(
        (t) => (t.recallGroupId || t.srsGroupId) === groupId && t.id !== parentId
      )
      children.forEach((c) =>
        repos.tasks.update(c.id, { scheduledDate: c.scheduledDate, dueDate: c.dueDate }).catch(() => {})
      )
    } catch {}
  },

  cascadeRescheduleSRS: (parentId, newScheduledDate) => {
    get().cascadeRescheduleRecall(parentId, newScheduledDate)
  },
}))
