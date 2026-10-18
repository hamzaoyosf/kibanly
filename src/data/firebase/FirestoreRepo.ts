import { z } from 'zod'
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query as firestoreQuery,
  where,
  orderBy,
  limit as firestoreLimit,
  onSnapshot,
  CollectionReference,
  DocumentData,
  QueryConstraint,
} from 'firebase/firestore'
import { Repo, QueryOpts, CreateInput } from '../ports/Repo'
import { db, auth } from '@/lib/firebase'
import { generateId } from '@/lib/id'

export class FirestoreRepo<
  T extends { id: string; createdAt: string; schemaVersion: number }
> implements Repo<T> {
  private collectionName: string
  private schema: z.ZodType<T, z.ZodTypeDef, unknown>
  private idPrefix: string

  constructor(
    collectionName: string,
    schema: z.ZodType<T, z.ZodTypeDef, unknown>,
    idPrefix: string
  ) {
    this.collectionName = collectionName
    this.schema = schema
    this.idPrefix = idPrefix
  }

  /**
   * Resolves the user-isolated subcollection: users/{uid}/{collectionName}
   */
  private getCollectionRef(): CollectionReference<DocumentData> | null {
    if (!db || !auth?.currentUser?.uid) {
      return null
    }
    return collection(db, 'users', auth.currentUser.uid, this.collectionName)
  }

  async list(query?: QueryOpts): Promise<T[]> {
    const colRef = this.getCollectionRef()
    if (!colRef) {
      return []
    }

    try {
      const constraints: QueryConstraint[] = []

      if (query?.filter) {
        Object.entries(query.filter).forEach(([key, val]) => {
          if (val !== undefined) {
            constraints.push(where(key, '==', val))
          }
        })
      }

      if (query?.orderBy) {
        constraints.push(orderBy(query.orderBy, query.orderDirection || 'asc'))
      }

      if (query?.limit && query.limit > 0) {
        constraints.push(firestoreLimit(query.limit))
      }

      const q = firestoreQuery(colRef, ...constraints)
      const snap = await getDocs(q)

      return snap.docs
        .map((d) => {
          const res = this.schema.safeParse(d.data())
          return res.success ? res.data : null
        })
        .filter((item): item is T => item !== null)
    } catch (err: any) {
      // In-memory fallback if Firestore index is required or query constraint fails
      console.warn(
        `[KiBANLY FirestoreRepo] Query failed on ${this.collectionName}, falling back to client-side filter:`,
        err?.message || err
      )
      const snap = await getDocs(colRef)
      let items = snap.docs
        .map((d) => {
          const res = this.schema.safeParse(d.data())
          return res.success ? res.data : null
        })
        .filter((item): item is T => item !== null)

      if (query?.filter) {
        const filterEntries = Object.entries(query.filter)
        items = items.filter((item) =>
          filterEntries.every(([k, v]) => (item as Record<string, unknown>)[k] === v)
        )
      }

      if (query?.orderBy) {
        const key = query.orderBy as keyof T
        const dir = query.orderDirection === 'desc' ? -1 : 1
        items = items.sort((a, b) => {
          const valA = a[key]
          const valB = b[key]
          if (valA < valB) return -1 * dir
          if (valA > valB) return 1 * dir
          return 0
        })
      }

      if (query?.limit && query.limit > 0) {
        items = items.slice(0, query.limit)
      }

      return items
    }
  }

  async get(id: string): Promise<T | null> {
    const colRef = this.getCollectionRef()
    if (!colRef) return null

    try {
      const docRef = doc(colRef, id)
      const snap = await getDoc(docRef)
      if (!snap.exists()) return null

      const res = this.schema.safeParse(snap.data())
      return res.success ? res.data : null
    } catch (err) {
      console.error(`[KiBANLY FirestoreRepo] get(${id}) error:`, err)
      return null
    }
  }

  async create(input: CreateInput<T>): Promise<T> {
    const colRef = this.getCollectionRef()
    if (!colRef) {
      throw new Error(
        `[KiBANLY FirestoreRepo] Cannot create record in ${this.collectionName}: No active cloud session.`
      )
    }

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
    const docRef = doc(colRef, validated.id)
    await setDoc(docRef, validated)

    return validated
  }

  async update(id: string, patch: Partial<T>): Promise<T> {
    const colRef = this.getCollectionRef()
    if (!colRef) {
      throw new Error(
        `[KiBANLY FirestoreRepo] Cannot update record in ${this.collectionName}: No active cloud session.`
      )
    }

    const existing = await this.get(id)
    if (!existing) {
      throw new Error(`Record with id ${id} not found in ${this.collectionName}`)
    }

    const updatedRecord: Record<string, unknown> = {
      ...existing,
      ...patch,
      id, // Preserve immutable ID
      updatedAt: new Date().toISOString(),
    }

    const validated = this.schema.parse(updatedRecord)
    const docRef = doc(colRef, id)
    await setDoc(docRef, validated, { merge: true })

    return validated
  }

  async remove(id: string): Promise<void> {
    const colRef = this.getCollectionRef()
    if (!colRef) return

    const docRef = doc(colRef, id)
    await deleteDoc(docRef)
  }

  subscribe(cb: (items: T[]) => void): () => void {
    const colRef = this.getCollectionRef()
    if (!colRef) {
      cb([])
      return () => {}
    }

    return onSnapshot(
      colRef,
      (snap) => {
        const items = snap.docs
          .map((d) => {
            const res = this.schema.safeParse(d.data())
            return res.success ? res.data : null
          })
          .filter((item): item is T => item !== null)
        cb(items)
      },
      (err) => {
        console.error(`[KiBANLY FirestoreRepo] onSnapshot error on ${this.collectionName}:`, err)
      }
    )
  }
}
