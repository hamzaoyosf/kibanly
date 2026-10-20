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
} from '../ports/schemas'

/**
 * Clean Slate Policy:
 * Default seed datasets are strictly empty to guarantee zero mock data pollution.
 */
export const seedInboxItems: InboxItem[] = []
export const seedTasks: Task[] = []
export const seedTimeBlocks: TimeBlock[] = []
export const seedHabits: Habit[] = []
export const seedHabitLogs: HabitLog[] = []
export const seedEnergyLogs: EnergyLog[] = []
export const seedTransactions: Transaction[] = []
export const seedSubscriptions: Subscription[] = []
export const seedMilestones: Milestone[] = []
export const seedNotes: Note[] = []
export const seedResources: Resource[] = []
export const seedTags: Tag[] = []
