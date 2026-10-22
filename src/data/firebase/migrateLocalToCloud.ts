import { doc, writeBatch } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface MigrationResult {
  migratedCount: number
  status: 'completed' | 'skipped' | 'error'
  error?: string
}

interface DomainMapping {
  storageKey: string
  collectionName: string
}

const DOMAIN_MAPPINGS: DomainMapping[] = [
  { storageKey: 'OBOiFY:v1:inbox', collectionName: 'inbox' },
  { storageKey: 'OBOiFY:v1:tasks', collectionName: 'tasks' },
  { storageKey: 'OBOiFY:v1:timeBlocks', collectionName: 'timeBlocks' },
  { storageKey: 'OBOiFY:v1:habits', collectionName: 'habits' },
  { storageKey: 'OBOiFY:v1:habitLogs', collectionName: 'habitLogs' },
  { storageKey: 'OBOiFY:v1:energyLogs', collectionName: 'energyLogs' },
  { storageKey: 'OBOiFY:v1:transactions', collectionName: 'transactions' },
  { storageKey: 'OBOiFY:v1:subscriptions', collectionName: 'subscriptions' },
  { storageKey: 'OBOiFY:v1:milestones', collectionName: 'milestones' },
  { storageKey: 'OBOiFY:v1:notes', collectionName: 'notes' },
  { storageKey: 'OBOiFY:v1:resources', collectionName: 'resources' },
  { storageKey: 'OBOiFY:v1:tags', collectionName: 'tags' },
  // Legacy KiBANLY keys fallback
  { storageKey: 'KiBANLY:v1:inbox', collectionName: 'inbox' },
  { storageKey: 'KiBANLY:v1:tasks', collectionName: 'tasks' },
  { storageKey: 'KiBANLY:v1:timeBlocks', collectionName: 'timeBlocks' },
  { storageKey: 'KiBANLY:v1:habits', collectionName: 'habits' },
  { storageKey: 'KiBANLY:v1:habitLogs', collectionName: 'habitLogs' },
  { storageKey: 'KiBANLY:v1:energyLogs', collectionName: 'energyLogs' },
  { storageKey: 'KiBANLY:v1:transactions', collectionName: 'transactions' },
  { storageKey: 'KiBANLY:v1:subscriptions', collectionName: 'subscriptions' },
  { storageKey: 'KiBANLY:v1:milestones', collectionName: 'milestones' },
  { storageKey: 'KiBANLY:v1:notes', collectionName: 'notes' },
  { storageKey: 'KiBANLY:v1:resources', collectionName: 'resources' },
  { storageKey: 'KiBANLY:v1:tags', collectionName: 'tags' },
]

/**
 * Safely migrates all local data from localStorage into the user's isolated Firestore collection.
 * Chunks writes into batches of 400 (below Firestore's 500-operation limit).
 * Idempotent with merge: true — does not erase LocalStorage.
 */
export async function migrateLocalToCloud(
  uid: string,
  force = false
): Promise<MigrationResult> {
  if (!db || !uid) {
    return { migratedCount: 0, status: 'skipped' }
  }

  const migrationKey = `oboify:cloud_migrated_${uid}`
  const legacyMigrationKey = `kibanly:cloud_migrated_${uid}`
  if (!force && typeof window !== 'undefined' && window.localStorage) {
    const alreadyMigrated = window.localStorage.getItem(migrationKey) || window.localStorage.getItem(legacyMigrationKey)
    if (alreadyMigrated) {
      return { migratedCount: 0, status: 'skipped' }
    }
  }

  try {
    const queue: Array<{ collectionName: string; item: { id: string } & Record<string, unknown> }> = []

    // 1. Gather all local data
    for (const mapping of DOMAIN_MAPPINGS) {
      const raw = window.localStorage.getItem(mapping.storageKey)
      if (!raw) continue

      try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          parsed.forEach((item) => {
            if (item && item.id) {
              queue.push({
                collectionName: mapping.collectionName,
                item,
              })
            }
          })
        }
      } catch (e) {
        console.warn(`[OBOiFY Migration] Error parsing ${mapping.storageKey}:`, e)
      }
    }

    if (queue.length === 0) {
      window.localStorage.setItem(migrationKey, new Date().toISOString())
      return { migratedCount: 0, status: 'completed' }
    }

    // 2. Chunk into batches of 400 operations to strictly adhere to Firestore limits
    const CHUNK_SIZE = 400
    for (let i = 0; i < queue.length; i += CHUNK_SIZE) {
      const chunk = queue.slice(i, i + CHUNK_SIZE)
      const batch = writeBatch(db)

      for (const entry of chunk) {
        const docRef = doc(db, 'users', uid, entry.collectionName, entry.item.id)
        batch.set(docRef, entry.item, { merge: true })
      }

      await batch.commit()
    }

    // 3. Set completion flag
    window.localStorage.setItem(migrationKey, new Date().toISOString())
    console.info(
      `[OBOiFY Migration] Successfully migrated ${queue.length} items to Cloud Firestore for user ${uid}`
    )

    return { migratedCount: queue.length, status: 'completed' }
  } catch (err: any) {
    console.error('[OBOiFY Migration] Cloud migration failed:', err)
    return {
      migratedCount: 0,
      status: 'error',
      error: err?.message || 'Unknown migration error',
    }
  }
}
