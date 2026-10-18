import { z } from 'zod'
import { Repo, QueryOpts, CreateInput } from '../ports/Repo'
import { generateId } from '@/lib/id'

export class LocalStorageRepo<T extends { id: string; createdAt: string; schemaVersion: number }>
  implements Repo<T>
{
  private storageKey: string
  private schema: z.ZodType<T, z.ZodTypeDef, unknown>
  private idPrefix: string
  private subscribers: Set<(items: T[]) => void> = new Set()

  constructor(
    storageKey: string,
    schema: z.ZodType<T, z.ZodTypeDef, unknown>,
    idPrefix: string,
    initialData: T[] = []
  ) {
    this.storageKey = storageKey
    this.schema = schema
    this.idPrefix = idPrefix

    // Initialize with seed data if key does not exist yet
    if (typeof window !== 'undefined' && window.localStorage) {
      const existing = window.localStorage.getItem(this.storageKey)
      if (!existing) {
        const legacyKey = this.storageKey.replace('OBOiFY:', 'KiBANLY:')
        const legacyData = window.localStorage.getItem(legacyKey)
        if (legacyData) {
          window.localStorage.setItem(this.storageKey, legacyData)
        } else if (initialData.length > 0) {
          window.localStorage.setItem(this.storageKey, JSON.stringify(initialData))
        }
      }

      // Listen for changes from other tabs
      window.addEventListener('storage', (e) => {
        if (e.key === this.storageKey) {
          this.notifySubscribers()
        }
      })
    }
  }

  private readAll(): T[] {
    if (typeof window === 'undefined' || !window.localStorage) {
      return []
    }
    const raw = window.localStorage.getItem(this.storageKey)
    if (!raw) return []

    try {
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed)) return []
      return parsed
        .map((item) => {
          const res = this.schema.safeParse(item)
          return res.success ? res.data : null
        })
        .filter((item): item is T => item !== null)
    } catch {
      return []
    }
  }

  private writeAll(items: T[]): void {
    if (typeof window === 'undefined' || !window.localStorage) return
    window.localStorage.setItem(this.storageKey, JSON.stringify(items))
    this.notifySubscribers()
  }

  private notifySubscribers(): void {
    const items = this.readAll()
    this.subscribers.forEach((cb) => {
      try {
        cb(items)
      } catch (err) {
        console.error('Error in repo subscriber callback:', err)
      }
    })
  }

  async list(query?: QueryOpts): Promise<T[]> {
    let items = this.readAll()

    if (query?.filter) {
      const filterEntries = Object.entries(query.filter)
      items = items.filter((item) =>
        filterEntries.every(([key, val]) => (item as Record<string, unknown>)[key] === val)
      )
    }

    if (query?.orderBy) {
      const key = query.orderBy as keyof T
      const direction = query.orderDirection === 'desc' ? -1 : 1
      items = [...items].sort((a, b) => {
        const valA = a[key]
        const valB = b[key]
        if (valA < valB) return -1 * direction
        if (valA > valB) return 1 * direction
        return 0
      })
    }

    if (query?.limit && query.limit > 0) {
      items = items.slice(0, query.limit)
    }

    return items
  }

  async get(id: string): Promise<T | null> {
    const items = this.readAll()
    const found = items.find((item) => item.id === id)
    return found || null
  }

  async create(input: CreateInput<T>): Promise<T> {
    const now = new Date().toISOString()
    const rawRecord: Record<string, unknown> = {
      ...input,
      id: input.id || generateId(this.idPrefix),
      createdAt: input.createdAt || now,
      schemaVersion: 1,
    }

    if (!rawRecord.updatedAt) {
      rawRecord.updatedAt = now
    }

    const validated = this.schema.parse(rawRecord)
    const items = this.readAll()
    const updatedList = [validated, ...items]
    this.writeAll(updatedList)
    return validated
  }

  async update(id: string, patch: Partial<T>): Promise<T> {
    const items = this.readAll()
    const index = items.findIndex((item) => item.id === id)
    if (index === -1) {
      throw new Error(`Record with id ${id} not found in ${this.storageKey}`)
    }

    const existing = items[index]
    const updatedRecord: Record<string, unknown> = {
      ...existing,
      ...patch,
      id, // Preserve immutable ID
    }

    if (this.storageKey.includes('tasks')) {
      updatedRecord.updatedAt = new Date().toISOString()
    }

    const validated = this.schema.parse(updatedRecord)
    items[index] = validated
    this.writeAll(items)
    return validated
  }

  async remove(id: string): Promise<void> {
    const items = this.readAll()
    const filtered = items.filter((item) => item.id !== id)
    this.writeAll(filtered)
  }

  subscribe(cb: (items: T[]) => void): () => void {
    this.subscribers.add(cb)
    // Send immediate snapshot
    cb(this.readAll())
    return () => {
      this.subscribers.delete(cb)
    }
  }
}
