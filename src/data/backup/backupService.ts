import { repos } from '@/data'
import {
  InboxItem,
  Task,
  TimeBlock,
  Habit,
  HabitLog,
  EnergyLog,
  Transaction,
  Subscription,
  Milestone,
  Note,
  Resource,
  Tag,
} from '@/data/ports/schemas'
import { QueryClient } from '@tanstack/react-query'

export interface KiBANLYBackupDomains {
  inbox: InboxItem[]
  tasks: Task[]
  timeBlocks: TimeBlock[]
  habits: Habit[]
  habitLogs: HabitLog[]
  energyLogs: EnergyLog[]
  transactions: Transaction[]
  subscriptions: Subscription[]
  milestones: Milestone[]
  notes: Note[]
  resources: Resource[]
  tags: Tag[]
}

export interface KiBANLYBackupPayload {
  version: 1
  exportedAt: string
  app: 'KiBANLY OS'
  itemCounts: Record<keyof KiBANLYBackupDomains, number>
  domains: KiBANLYBackupDomains
}

export interface ImportResult {
  success: boolean
  totalImported: number
  itemCounts: Partial<Record<keyof KiBANLYBackupDomains, number>>
  error?: string
}

/**
 * Exports all KiBANLY domain data to a downloadable JSON file.
 */
export async function exportData(): Promise<KiBANLYBackupPayload> {
  const [
    inbox,
    tasks,
    timeBlocks,
    habits,
    habitLogs,
    energyLogs,
    transactions,
    subscriptions,
    milestones,
    notes,
    resources,
    tags,
  ] = await Promise.all([
    repos.inbox.list(),
    repos.tasks.list(),
    repos.timeBlocks.list(),
    repos.habits.list(),
    repos.habitLogs.list(),
    repos.energyLogs.list(),
    repos.transactions.list(),
    repos.subscriptions.list(),
    repos.milestones.list(),
    repos.notes.list(),
    repos.resources.list(),
    repos.tags.list(),
  ])

  const domains: KiBANLYBackupDomains = {
    inbox,
    tasks,
    timeBlocks,
    habits,
    habitLogs,
    energyLogs,
    transactions,
    subscriptions,
    milestones,
    notes,
    resources,
    tags,
  }

  const itemCounts: Record<keyof KiBANLYBackupDomains, number> = {
    inbox: inbox.length,
    tasks: tasks.length,
    timeBlocks: timeBlocks.length,
    habits: habits.length,
    habitLogs: habitLogs.length,
    energyLogs: energyLogs.length,
    transactions: transactions.length,
    subscriptions: subscriptions.length,
    milestones: milestones.length,
    notes: notes.length,
    resources: resources.length,
    tags: tags.length,
  }

  const payload: KiBANLYBackupPayload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    app: 'KiBANLY OS',
    itemCounts,
    domains,
  }

  // Trigger browser download
  if (typeof window !== 'undefined') {
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const dateStamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    a.href = url
    a.download = `kibanly-backup-${dateStamp}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return payload
}

/**
 * Imports and merges a KiBANLY JSON backup into the active repositories.
 */
export async function importData(
  jsonContent: string,
  queryClient?: QueryClient
): Promise<ImportResult> {
  try {
    const parsed = JSON.parse(jsonContent)

    const domains: Partial<KiBANLYBackupDomains> =
      parsed.domains && typeof parsed.domains === 'object' ? parsed.domains : parsed

    const counts: Partial<Record<keyof KiBANLYBackupDomains, number>> = {}
    let total = 0

    // Import helper per domain
    const importDomain = async <T extends { id: string }>(
      domainKey: keyof KiBANLYBackupDomains,
      items: T[] | undefined,
      repo: any
    ) => {
      if (!Array.isArray(items) || items.length === 0) return
      let importedDomainCount = 0

      for (const item of items) {
        if (!item || !item.id) continue
        try {
          const existing = await repo.get(item.id)
          if (existing) {
            await repo.update(item.id, item)
          } else {
            await repo.create(item)
          }
          importedDomainCount++
          total++
        } catch (err) {
          console.warn(`[Import] Failed to upsert ${domainKey} item ${item.id}:`, err)
        }
      }

      counts[domainKey] = importedDomainCount
    }

    await Promise.all([
      importDomain('inbox', domains.inbox, repos.inbox),
      importDomain('tasks', domains.tasks, repos.tasks),
      importDomain('timeBlocks', domains.timeBlocks, repos.timeBlocks),
      importDomain('habits', domains.habits, repos.habits),
      importDomain('habitLogs', domains.habitLogs, repos.habitLogs),
      importDomain('energyLogs', domains.energyLogs, repos.energyLogs),
      importDomain('transactions', domains.transactions, repos.transactions),
      importDomain('subscriptions', domains.subscriptions, repos.subscriptions),
      importDomain('milestones', domains.milestones, repos.milestones),
      importDomain('notes', domains.notes, repos.notes),
      importDomain('resources', domains.resources, repos.resources),
      importDomain('tags', domains.tags, repos.tags),
    ])

    // Invalidate all query caches if queryClient is provided
    if (queryClient) {
      await queryClient.invalidateQueries()
    }

    return {
      success: true,
      totalImported: total,
      itemCounts: counts,
    }
  } catch (err: any) {
    return {
      success: false,
      totalImported: 0,
      itemCounts: {},
      error: err.message || 'Invalid JSON file format',
    }
  }
}
