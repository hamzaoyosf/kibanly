import { useMemo } from 'react'
import { useSubscriptions } from './useSubscriptions'
import { Subscription } from '@/data/ports/schemas'
import { repos } from '@/data'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export interface RenewalAlertItem {
  subscription: Subscription
  daysUntilRenewal: number
  isOverdue: boolean
  isToday: boolean
  formattedAmount: string
}

export function useRenewalAlerts(horizonDays: number = 7) {
  const { data: subscriptions = [], isLoading } = useSubscriptions('all')
  const queryClient = useQueryClient()

  const alerts = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const activeSubs = subscriptions.filter(
      (s) => s.status === 'active' && s.nextRenewal
    )

    const items: RenewalAlertItem[] = []

    for (const sub of activeSubs) {
      const parts = sub.nextRenewal.split('-').map(Number)
      if (parts.length !== 3) continue
      const [year, month, day] = parts
      const renewalDate = new Date(year, month - 1, day)
      renewalDate.setHours(0, 0, 0, 0)

      const diffDays = Math.round(
        (renewalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      )

      // Alert if due within horizonDays or overdue up to 3 days
      if (diffDays >= -3 && diffDays <= horizonDays) {
        items.push({
          subscription: sub,
          daysUntilRenewal: diffDays,
          isOverdue: diffDays < 0,
          isToday: diffDays === 0,
          formattedAmount: `$${(sub.amountMinor / 100).toFixed(2)}`,
        })
      }
    }

    // Sort: overdue first, then today, then nearest upcoming
    items.sort((a, b) => a.daysUntilRenewal - b.daysUntilRenewal)

    const totalMinor = items.reduce((acc, item) => acc + item.subscription.amountMinor, 0)

    return {
      items,
      totalAmountMinor: totalMinor,
      formattedTotalAmount: `$${(totalMinor / 100).toFixed(2)}`,
      hasRenewals: items.length > 0,
      todayCount: items.filter((i) => i.isToday).length,
      overdueCount: items.filter((i) => i.isOverdue).length,
    }
  }, [subscriptions, horizonDays])

  // Mutation to convert a renewal alert into an actionable GTD Task in Action Hub
  const createTaskReminder = useMutation({
    mutationFn: async (alert: RenewalAlertItem) => {
      const now = new Date().toISOString()
      const task = await repos.tasks.create({
        id: `task_sub_${alert.subscription.id}_${Date.now()}`,
        title: `Renew/Review ${alert.subscription.name} (${alert.formattedAmount})`,
        notes: `Automatic subscription renewal scheduled for ${alert.subscription.nextRenewal}. Billing cycle: ${alert.subscription.cycle}.`,
        status: 'draft',
        gtdList: 'next',
        quadrant: null,
        priority: alert.isToday || alert.isOverdue ? 'high' : 'medium',
        dueDate: alert.subscription.nextRenewal,
        estimateMin: 5,
        context: ['@online', '@finance'],
        tags: ['capital', 'subscription', 'finance'],
        order: 100,
        subtasks: [],
        createdAt: now,
        updatedAt: now,
        schemaVersion: 1,
      })
      return task
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  return {
    ...alerts,
    isLoading,
    createTaskReminder,
  }
}
