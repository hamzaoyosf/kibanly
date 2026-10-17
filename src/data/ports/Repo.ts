export interface QueryOpts {
  filter?: Record<string, unknown>
  orderBy?: string
  orderDirection?: 'asc' | 'desc'
  limit?: number
}

export type CreateInput<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: string
  createdAt?: string
  updatedAt?: string
}

/**
 * Generic repository interface (port) matching SRS §3.2.1.
 * Allows transparent swapping between LocalStorage (MVP) and Firestore (Phase 2).
 */
export interface Repo<T extends { id: string }> {
  list(query?: QueryOpts): Promise<T[]>
  get(id: string): Promise<T | null>
  create(input: CreateInput<T>): Promise<T>
  update(id: string, patch: Partial<T>): Promise<T>
  remove(id: string): Promise<void>
  subscribe?(cb: (items: T[]) => void): () => void
}
