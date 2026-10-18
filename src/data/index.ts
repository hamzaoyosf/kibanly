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
import {
  seedInboxItems,
  seedTasks,
  seedTimeBlocks,
  seedHabits,
  seedHabitLogs,
  seedEnergyLogs,
  seedTransactions,
  seedSubscriptions,
  seedMilestones,
  seedNotes,
  seedResources,
  seedTags,
} from './local/seed'
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
 * Creates pure LocalStorage repositories (Phase 1 MVP)
 */
export function createLocalRepos(): AppRepos {
  return {
    inbox: new LocalStorageRepo<InboxItem>('KiBANLY:v1:inbox', InboxItemSchema, 'inb', seedInboxItems),
    tasks: new LocalStorageRepo<Task>('KiBANLY:v1:tasks', TaskSchema, 'tsk', seedTasks),
    timeBlocks: new LocalStorageRepo<TimeBlock>('KiBANLY:v1:timeBlocks', TimeBlockSchema, 'blk', seedTimeBlocks),
    habits: new LocalStorageRepo<Habit>('KiBANLY:v1:habits', HabitSchema, 'hab', seedHabits),
    habitLogs: new LocalStorageRepo<HabitLog>('KiBANLY:v1:habitLogs', HabitLogSchema, 'hlog', seedHabitLogs),
    energyLogs: new LocalStorageRepo<EnergyLog>('KiBANLY:v1:energyLogs', EnergyLogSchema, 'elog', seedEnergyLogs),
    transactions: new LocalStorageRepo<Transaction>('KiBANLY:v1:transactions', TransactionSchema, 'txn', seedTransactions),
    subscriptions: new LocalStorageRepo<Subscription>('KiBANLY:v1:subscriptions', SubscriptionSchema, 'sub', seedSubscriptions),
    milestones: new LocalStorageRepo<Milestone>('KiBANLY:v1:milestones', MilestoneSchema, 'ms', seedMilestones),
    notes: new LocalStorageRepo<Note>('KiBANLY:v1:notes', NoteSchema, 'not', seedNotes),
    resources: new LocalStorageRepo<Resource>('KiBANLY:v1:resources', ResourceSchema, 'res', seedResources),
    tags: new LocalStorageRepo<Tag>('KiBANLY:v1:tags', TagSchema, 'tag', seedTags),
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
 * or falls back to LocalStorage when unauthenticated or offline.
 */
function createDelegatingRepo<T extends { id: string }>(
  localRepo: Repo<T>,
  firestoreRepo: Repo<T>
): Repo<T> {
  const getActive = () => {
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
