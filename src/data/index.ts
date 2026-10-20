import { LocalStorageRepo } from './local/LocalStorageRepo'
import { FirestoreRepo } from './firebase/FirestoreRepo'
import {
  InboxItem,
  InboxItemSchema,
  Task,
  TaskSchema,
  TimeBlock,
  TimeBlockSchema,
  Habit,
  HabitSchema,
  HabitLog,
  HabitLogSchema,
  EnergyLog,
  EnergyLogSchema,
  Transaction,
  TransactionSchema,
  Subscription,
  SubscriptionSchema,
  Milestone,
  MilestoneSchema,
  Note,
  NoteSchema,
  Resource,
  ResourceSchema,
  Tag,
  TagSchema,
} from './ports/schemas'
import { Repo } from './ports/Repo'
import { InboxRepo } from './ports/InboxRepo'
import { TaskRepo } from './ports/TaskRepo'
import { TimeBlockRepo } from './ports/TimeBlockRepo'
import { HabitRepo, HabitLogRepo } from './ports/HabitRepo'
import { EnergyLogRepo } from './ports/EnergyLogRepo'
import { TransactionRepo } from './ports/TransactionRepo'
import { SubscriptionRepo } from './ports/SubscriptionRepo'
import { MilestoneRepo } from './ports/MilestoneRepo'
import { NoteRepo } from './ports/NoteRepo'
import { ResourceRepo } from './ports/ResourceRepo'
import { TagRepo } from './ports/TagRepo'
import { auth, isFirebaseConfigured } from '@/lib/firebase'

export interface AppRepos {
  inbox: InboxRepo
  tasks: TaskRepo
  timeBlocks: TimeBlockRepo
  habits: HabitRepo
  habitLogs: HabitLogRepo
  energyLogs: EnergyLogRepo
  transactions: TransactionRepo
  subscriptions: SubscriptionRepo
  milestones: MilestoneRepo
  notes: NoteRepo
  resources: ResourceRepo
  tags: TagRepo
}

/**
 * Creates pure LocalStorage repositories (Phase 1 MVP) - Strictly empty initial data for clean slate
 */
export function createLocalRepos(): AppRepos {
  return {
    inbox: new LocalStorageRepo<InboxItem>('OBOiFY:v1:inbox', InboxItemSchema, 'inb', []),
    tasks: new LocalStorageRepo<Task>('OBOiFY:v1:tasks', TaskSchema, 'tsk', []),
    timeBlocks: new LocalStorageRepo<TimeBlock>('OBOiFY:v1:timeBlocks', TimeBlockSchema, 'blk', []),
    habits: new LocalStorageRepo<Habit>('OBOiFY:v1:habits', HabitSchema, 'hab', []),
    habitLogs: new LocalStorageRepo<HabitLog>('OBOiFY:v1:habitLogs', HabitLogSchema, 'hlog', []),
    energyLogs: new LocalStorageRepo<EnergyLog>('OBOiFY:v1:energyLogs', EnergyLogSchema, 'elog', []),
    transactions: new LocalStorageRepo<Transaction>('OBOiFY:v1:transactions', TransactionSchema, 'txn', []),
    subscriptions: new LocalStorageRepo<Subscription>('OBOiFY:v1:subscriptions', SubscriptionSchema, 'sub', []),
    milestones: new LocalStorageRepo<Milestone>('OBOiFY:v1:milestones', MilestoneSchema, 'ms', []),
    notes: new LocalStorageRepo<Note>('OBOiFY:v1:notes', NoteSchema, 'not', []),
    resources: new LocalStorageRepo<Resource>('OBOiFY:v1:resources', ResourceSchema, 'res', []),
    tags: new LocalStorageRepo<Tag>('OBOiFY:v1:tags', TagSchema, 'tag', []),
  }
}

/**
 * Creates Cloud Firestore repositories (Phase 2 Cloud Integration)
 */
export function createFirestoreRepos(): AppRepos {
  return {
    inbox: new FirestoreRepo<InboxItem>('inbox', InboxItemSchema, 'inb'),
    tasks: new FirestoreRepo<Task>('tasks', TaskSchema, 'tsk'),
    timeBlocks: new FirestoreRepo<TimeBlock>('timeBlocks', TimeBlockSchema, 'blk'),
    habits: new FirestoreRepo<Habit>('habits', HabitSchema, 'hab'),
    habitLogs: new FirestoreRepo<HabitLog>('habitLogs', HabitLogSchema, 'hlog'),
    energyLogs: new FirestoreRepo<EnergyLog>('energyLogs', EnergyLogSchema, 'elog'),
    transactions: new FirestoreRepo<Transaction>('transactions', TransactionSchema, 'txn'),
    subscriptions: new FirestoreRepo<Subscription>('subscriptions', SubscriptionSchema, 'sub'),
    milestones: new FirestoreRepo<Milestone>('milestones', MilestoneSchema, 'ms'),
    notes: new FirestoreRepo<Note>('notes', NoteSchema, 'not'),
    resources: new FirestoreRepo<Resource>('resources', ResourceSchema, 'res'),
    tags: new FirestoreRepo<Tag>('tags', TagSchema, 'tag'),
  }
}

/**
 * Helper to wrap local and cloud repos in a seamless delegator that
 * routes to Firestore when an authenticated cloud session is active,
 * or falls back to LocalStorage when unauthenticated, in Guest Mode, or offline.
 */
function createDelegatingRepo<T extends { id: string }>(
  localRepo: Repo<T>,
  firestoreRepo: Repo<T>
): Repo<T> {
  const getActive = () => {
    // Guest mode strictly enforces local storage only and bypasses Firestore
    if (typeof window !== 'undefined' && localStorage.getItem('oboify_guest_mode') === 'true') {
      return localRepo
    }
    const isCloudRequested = import.meta.env.VITE_DATA_PROVIDER === 'firebase'
    if (isCloudRequested && isFirebaseConfigured && auth?.currentUser?.uid) {
      return firestoreRepo
    }
    return localRepo
  }

  return {
    list: (query) => getActive().list(query),
    get: (id) => getActive().get(id),
    create: (input) => getActive().create(input),
    update: (id, patch) => getActive().update(id, patch),
    remove: (id) => getActive().remove(id),
    subscribe: (cb) => {
      const active = getActive()
      return active.subscribe ? active.subscribe(cb) : () => {}
    },
  }
}

/**
 * Completely purges all local repository records and cache keys from browser storage
 */
export function purgeLocalData(): void {
  if (typeof window === 'undefined' || !window.localStorage) return
  const keysToRemove: string[] = []
  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i)
    if (
      k &&
      (k.startsWith('OBOiFY:') ||
        k.startsWith('oboify_') ||
        k.startsWith('kibanly_') ||
        k.startsWith('KiBANLY:'))
    ) {
      keysToRemove.push(k)
    }
  }
  keysToRemove.forEach((k) => window.localStorage.removeItem(k))
}

/**
 * Builds the active repository layer based on environment swap configuration
 */
function createActiveRepos(): AppRepos {
  const local = createLocalRepos()
  const cloud = createFirestoreRepos()

  return {
    inbox: createDelegatingRepo(local.inbox, cloud.inbox) as InboxRepo,
    tasks: createDelegatingRepo(local.tasks, cloud.tasks) as TaskRepo,
    timeBlocks: createDelegatingRepo(local.timeBlocks, cloud.timeBlocks) as TimeBlockRepo,
    habits: createDelegatingRepo(local.habits, cloud.habits) as HabitRepo,
    habitLogs: createDelegatingRepo(local.habitLogs, cloud.habitLogs) as HabitLogRepo,
    energyLogs: createDelegatingRepo(local.energyLogs, cloud.energyLogs) as EnergyLogRepo,
    transactions: createDelegatingRepo(local.transactions, cloud.transactions) as TransactionRepo,
    subscriptions: createDelegatingRepo(local.subscriptions, cloud.subscriptions) as SubscriptionRepo,
    milestones: createDelegatingRepo(local.milestones, cloud.milestones) as MilestoneRepo,
    notes: createDelegatingRepo(local.notes, cloud.notes) as NoteRepo,
    resources: createDelegatingRepo(local.resources, cloud.resources) as ResourceRepo,
    tags: createDelegatingRepo(local.tags, cloud.tags) as TagRepo,
  }
}

export const repos: AppRepos = createActiveRepos()
