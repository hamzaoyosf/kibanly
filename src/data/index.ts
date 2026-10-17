import { LocalStorageRepo } from './local/LocalStorageRepo'
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

function createLocalRepos(): AppRepos {
  const inbox = new LocalStorageRepo<InboxItem>(
    'oyosf:v1:inbox',
    InboxItemSchema,
    'inb',
    seedInboxItems
  )

  const tasks = new LocalStorageRepo<Task>(
    'oyosf:v1:tasks',
    TaskSchema,
    'tsk',
    seedTasks
  )

  const timeBlocks = new LocalStorageRepo<TimeBlock>(
    'oyosf:v1:timeBlocks',
    TimeBlockSchema,
    'blk',
    seedTimeBlocks
  )

  const habits = new LocalStorageRepo<Habit>(
    'oyosf:v1:habits',
    HabitSchema,
    'hab',
    seedHabits
  )

  const habitLogs = new LocalStorageRepo<HabitLog>(
    'oyosf:v1:habitLogs',
    HabitLogSchema,
    'hlog',
    seedHabitLogs
  )

  const energyLogs = new LocalStorageRepo<EnergyLog>(
    'oyosf:v1:energyLogs',
    EnergyLogSchema,
    'elog',
    seedEnergyLogs
  )

  const transactions = new LocalStorageRepo<Transaction>(
    'oyosf:v1:transactions',
    TransactionSchema,
    'txn',
    seedTransactions
  )

  const subscriptions = new LocalStorageRepo<Subscription>(
    'oyosf:v1:subscriptions',
    SubscriptionSchema,
    'sub',
    seedSubscriptions
  )

  const milestones = new LocalStorageRepo<Milestone>(
    'oyosf:v1:milestones',
    MilestoneSchema,
    'ms',
    seedMilestones
  )

  const notes = new LocalStorageRepo<Note>(
    'oyosf:v1:notes',
    NoteSchema,
    'not',
    seedNotes
  )

  const resources = new LocalStorageRepo<Resource>(
    'oyosf:v1:resources',
    ResourceSchema,
    'res',
    seedResources
  )

  const tags = new LocalStorageRepo<Tag>(
    'oyosf:v1:tags',
    TagSchema,
    'tag',
    seedTags
  )

  return {
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
}

export const repos: AppRepos = createLocalRepos()
