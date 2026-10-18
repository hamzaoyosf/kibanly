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

function getOffsetDate(daysOffset: number): string {
  const d = new Date()
  d.setDate(d.getDate() + daysOffset)
  return d.toISOString().slice(0, 10)
}

export const seedInboxItems: InboxItem[] = [
  {
    id: 'inb_seed_01',
    text: 'Renew domain before the 20th',
    source: 'quick_capture',
    status: 'unprocessed',
    ai: {
      category: 'task',
      priority: 'high',
      suggestedDue: '2026-10-20',
      confidence: 0.89,
      model: 'mock-gemini',
      accepted: null,
    },
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    processedAt: null,
    convertedTo: null,
    schemaVersion: 1,
  },
  {
    id: 'inb_seed_02',
    text: 'Review quarterly SaaS subscriptions and cancel unused seats',
    source: 'quick_capture',
    status: 'unprocessed',
    ai: {
      category: 'expense',
      priority: 'medium',
      suggestedDue: null,
      confidence: 0.82,
      model: 'mock-gemini',
      accepted: null,
    },
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    processedAt: null,
    convertedTo: null,
    schemaVersion: 1,
  },
]

export const seedTasks: Task[] = [
  {
    id: 'tsk_seed_01',
    title: 'Deploy KiBANLY Phase 0 Foundations',
    notes: 'Verify design tokens and dark OLED theme',
    status: 'done',
    gtdList: 'next',
    quadrant: null,
    priority: 'high',
    dueDate: null,
    estimateMin: 30,
    context: ['@computer'],
    tags: ['engineering', 'release'],
    projectId: null,
    areaId: null,
    waitingFor: null,
    subtasks: [
      { id: 'st_01', title: 'Install React 18 & Tailwind', done: true },
      { id: 'st_02', title: 'Configure Glassmorphism tokens', done: true },
    ],
    calendarEventId: null,
    order: 1000,
    completedAt: new Date().toISOString(),
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  },
]

const todayStr = new Date().toISOString().slice(0, 10)

export const seedTimeBlocks: TimeBlock[] = [
  {
    id: 'blk_seed_01',
    title: 'Deep work: KiBANLY Kanban',
    category: 'deep_work',
    color: 'cyan',
    start: `${todayStr}T09:00:00.000Z`,
    end: `${todayStr}T10:30:00.000Z`,
    taskId: 'tsk_seed_01',
    source: 'KiBANLY',
    gcal: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  },
]

export const seedHabits: Habit[] = [
  {
    id: 'hab_sleep',
    name: 'Sleep before 23:00',
    icon: 'Moon',
    category: 'sleep',
    frequency: { type: 'daily' },
    targetPerWeek: 7,
    archived: false,
    order: 100,
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  },
  {
    id: 'hab_workout',
    name: '30m Mobility & Movement',
    icon: 'Dumbbell',
    category: 'movement',
    frequency: { type: 'daily' },
    targetPerWeek: 7,
    archived: false,
    order: 200,
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  },
  {
    id: 'hab_meditation',
    name: '10m Mindfulness Meditation',
    icon: 'Brain',
    category: 'mindfulness',
    frequency: { type: 'daily' },
    targetPerWeek: 7,
    archived: false,
    order: 300,
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  },
  {
    id: 'hab_water',
    name: 'Hydrate 2.5L Water',
    icon: 'Droplets',
    category: 'nutrition',
    frequency: { type: 'daily' },
    targetPerWeek: 7,
    archived: false,
    order: 400,
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  },
  {
    id: 'hab_deep_work',
    name: '90m Uninterrupted Focus',
    icon: 'Zap',
    category: 'focus',
    frequency: { type: 'weekdays' },
    targetPerWeek: 5,
    archived: false,
    order: 500,
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  },
]

export const seedHabitLogs: HabitLog[] = [
  // Sleep logs (5 days streak ending yesterday)
  { id: `hab_sleep_${getOffsetDate(0)}`, habitId: 'hab_sleep', date: getOffsetDate(0), done: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), schemaVersion: 1 },
  { id: `hab_sleep_${getOffsetDate(-1)}`, habitId: 'hab_sleep', date: getOffsetDate(-1), done: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), schemaVersion: 1 },
  { id: `hab_sleep_${getOffsetDate(-2)}`, habitId: 'hab_sleep', date: getOffsetDate(-2), done: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), schemaVersion: 1 },
  { id: `hab_sleep_${getOffsetDate(-3)}`, habitId: 'hab_sleep', date: getOffsetDate(-3), done: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), schemaVersion: 1 },
  { id: `hab_sleep_${getOffsetDate(-4)}`, habitId: 'hab_sleep', date: getOffsetDate(-4), done: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), schemaVersion: 1 },

  // Workout logs (4 days streak)
  { id: `hab_workout_${getOffsetDate(0)}`, habitId: 'hab_workout', date: getOffsetDate(0), done: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), schemaVersion: 1 },
  { id: `hab_workout_${getOffsetDate(-1)}`, habitId: 'hab_workout', date: getOffsetDate(-1), done: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), schemaVersion: 1 },
  { id: `hab_workout_${getOffsetDate(-2)}`, habitId: 'hab_workout', date: getOffsetDate(-2), done: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), schemaVersion: 1 },
  { id: `hab_workout_${getOffsetDate(-3)}`, habitId: 'hab_workout', date: getOffsetDate(-3), done: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), schemaVersion: 1 },

  // Meditation logs (6 days streak)
  { id: `hab_meditation_${getOffsetDate(0)}`, habitId: 'hab_meditation', date: getOffsetDate(0), done: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), schemaVersion: 1 },
  { id: `hab_meditation_${getOffsetDate(-1)}`, habitId: 'hab_meditation', date: getOffsetDate(-1), done: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), schemaVersion: 1 },
  { id: `hab_meditation_${getOffsetDate(-2)}`, habitId: 'hab_meditation', date: getOffsetDate(-2), done: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), schemaVersion: 1 },
  { id: `hab_meditation_${getOffsetDate(-3)}`, habitId: 'hab_meditation', date: getOffsetDate(-3), done: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), schemaVersion: 1 },
  { id: `hab_meditation_${getOffsetDate(-4)}`, habitId: 'hab_meditation', date: getOffsetDate(-4), done: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), schemaVersion: 1 },
  { id: `hab_meditation_${getOffsetDate(-5)}`, habitId: 'hab_meditation', date: getOffsetDate(-5), done: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), schemaVersion: 1 },

  // Hydration logs (7 days streak)
  { id: `hab_water_${getOffsetDate(0)}`, habitId: 'hab_water', date: getOffsetDate(0), done: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), schemaVersion: 1 },
  { id: `hab_water_${getOffsetDate(-1)}`, habitId: 'hab_water', date: getOffsetDate(-1), done: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), schemaVersion: 1 },
  { id: `hab_water_${getOffsetDate(-2)}`, habitId: 'hab_water', date: getOffsetDate(-2), done: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), schemaVersion: 1 },
  { id: `hab_water_${getOffsetDate(-3)}`, habitId: 'hab_water', date: getOffsetDate(-3), done: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), schemaVersion: 1 },
  { id: `hab_water_${getOffsetDate(-4)}`, habitId: 'hab_water', date: getOffsetDate(-4), done: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), schemaVersion: 1 },
  { id: `hab_water_${getOffsetDate(-5)}`, habitId: 'hab_water', date: getOffsetDate(-5), done: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), schemaVersion: 1 },
  { id: `hab_water_${getOffsetDate(-6)}`, habitId: 'hab_water', date: getOffsetDate(-6), done: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), schemaVersion: 1 },

  // Deep work logs
  { id: `hab_deep_work_${getOffsetDate(0)}`, habitId: 'hab_deep_work', date: getOffsetDate(0), done: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), schemaVersion: 1 },
  { id: `hab_deep_work_${getOffsetDate(-1)}`, habitId: 'hab_deep_work', date: getOffsetDate(-1), done: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), schemaVersion: 1 },
  { id: `hab_deep_work_${getOffsetDate(-2)}`, habitId: 'hab_deep_work', date: getOffsetDate(-2), done: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), schemaVersion: 1 },
]

export const seedEnergyLogs: EnergyLog[] = [
  {
    id: getOffsetDate(0),
    date: getOffsetDate(0),
    energy: 4,
    focus: 4,
    mood: 5,
    sleepHours: 7.5,
    workoutDone: true,
    tasksCompleted: 4,
    deepWorkMin: 120,
    note: 'Strong morning, sustained focus through evening sprint.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  },
  {
    id: getOffsetDate(-1),
    date: getOffsetDate(-1),
    energy: 5,
    focus: 4,
    mood: 4,
    sleepHours: 8.0,
    workoutDone: true,
    tasksCompleted: 5,
    deepWorkMin: 150,
    note: 'Excellent physical recovery and clean flow state.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  },
  {
    id: getOffsetDate(-2),
    date: getOffsetDate(-2),
    energy: 3,
    focus: 3,
    mood: 3,
    sleepHours: 6.5,
    workoutDone: false,
    tasksCompleted: 3,
    deepWorkMin: 80,
    note: 'Slight slump in afternoon, needed fresh air.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  },
  {
    id: getOffsetDate(-3),
    date: getOffsetDate(-3),
    energy: 4,
    focus: 5,
    mood: 4,
    sleepHours: 7.5,
    workoutDone: true,
    tasksCompleted: 6,
    deepWorkMin: 180,
    note: 'Deep work target exceeded. High clarity.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  },
  {
    id: getOffsetDate(-4),
    date: getOffsetDate(-4),
    energy: 4,
    focus: 4,
    mood: 4,
    sleepHours: 7.0,
    workoutDone: true,
    tasksCompleted: 4,
    deepWorkMin: 110,
    note: 'Balanced day, kept pace without rushing.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  },
  {
    id: getOffsetDate(-5),
    date: getOffsetDate(-5),
    energy: 3,
    focus: 4,
    mood: 3,
    sleepHours: 7.0,
    workoutDone: false,
    tasksCompleted: 3,
    deepWorkMin: 90,
    note: 'Quiet focus block before meetings.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  },
  {
    id: getOffsetDate(-6),
    date: getOffsetDate(-6),
    energy: 4,
    focus: 4,
    mood: 5,
    sleepHours: 8.0,
    workoutDone: true,
    tasksCompleted: 5,
    deepWorkMin: 135,
    note: 'Great start to the weekly cycle.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  },
]

export const seedTransactions: Transaction[] = [
  // Business Income
  {
    id: 'txn_seed_01',
    type: 'income',
    scope: 'business',
    amountMinor: 450000, // $4,500.00
    currency: 'USD',
    category: 'Consulting',
    description: 'Q4 Product Architecture Retainer - Acme Corp',
    date: getOffsetDate(-2),
    subscriptionId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  },
  {
    id: 'txn_seed_02',
    type: 'income',
    scope: 'business',
    amountMinor: 125000, // $1,250.00
    currency: 'USD',
    category: 'SaaS',
    description: 'Stripe Payout: Monthly Pro Subscriptions',
    date: getOffsetDate(-6),
    subscriptionId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  },
  // Business Expenses
  {
    id: 'txn_seed_03',
    type: 'expense',
    scope: 'business',
    amountMinor: 2000, // $20.00
    currency: 'USD',
    category: 'Software',
    description: 'Vercel Pro - Production Cluster',
    date: getOffsetDate(-1),
    subscriptionId: 'sub_seed_01',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  },
  {
    id: 'txn_seed_04',
    type: 'expense',
    scope: 'business',
    amountMinor: 4999, // $49.99
    currency: 'USD',
    category: 'Equipment',
    description: 'Anker USB-C Thunderbolt 4 Hub',
    date: getOffsetDate(-4),
    subscriptionId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  },
  {
    id: 'txn_seed_05',
    type: 'expense',
    scope: 'business',
    amountMinor: 19900, // $199.00
    currency: 'USD',
    category: 'Cloud',
    description: 'Google Cloud Platform - Dataproc & BigQuery',
    date: getOffsetDate(-8),
    subscriptionId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  },
  // Personal Income
  {
    id: 'txn_seed_06',
    type: 'income',
    scope: 'personal',
    amountMinor: 200000, // $2,000.00
    currency: 'USD',
    category: 'Dividends',
    description: 'Index Fund Quarterly Dividend Distribution',
    date: getOffsetDate(-5),
    subscriptionId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  },
  // Personal Expenses
  {
    id: 'txn_seed_07',
    type: 'expense',
    scope: 'personal',
    amountMinor: 8550, // $85.50
    currency: 'USD',
    category: 'Groceries',
    description: 'Whole Foods Market - Weekly Whole Nutrition',
    date: getOffsetDate(0),
    subscriptionId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  },
  {
    id: 'txn_seed_08',
    type: 'expense',
    scope: 'personal',
    amountMinor: 1499, // $14.99
    currency: 'USD',
    category: 'Fitness',
    description: 'Strava Summit Annual Membership',
    date: getOffsetDate(-3),
    subscriptionId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  },
]

export const seedSubscriptions: Subscription[] = [
  {
    id: 'sub_seed_01',
    name: 'Vercel Pro',
    amountMinor: 2000, // $20.00
    currency: 'USD',
    cycle: 'monthly',
    nextRenewal: getOffsetDate(5),
    scope: 'business',
    category: 'dev_tools',
    status: 'active',
    remindDaysBefore: 3,
    url: 'https://vercel.com',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  },
  {
    id: 'sub_seed_02',
    name: 'GitHub Copilot Business',
    amountMinor: 1900, // $19.00
    currency: 'USD',
    cycle: 'monthly',
    nextRenewal: getOffsetDate(12),
    scope: 'business',
    category: 'dev_tools',
    status: 'active',
    remindDaysBefore: 3,
    url: 'https://github.com',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  },
  {
    id: 'sub_seed_03',
    name: 'Google Workspace',
    amountMinor: 1440, // $14.40
    currency: 'USD',
    cycle: 'monthly',
    nextRenewal: getOffsetDate(18),
    scope: 'business',
    category: 'productivity',
    status: 'active',
    remindDaysBefore: 2,
    url: 'https://workspace.google.com',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  },
  {
    id: 'sub_seed_04',
    name: 'Spotify Premium Family',
    amountMinor: 1999, // $19.99
    currency: 'USD',
    cycle: 'monthly',
    nextRenewal: getOffsetDate(8),
    scope: 'personal',
    category: 'entertainment',
    status: 'active',
    remindDaysBefore: 2,
    url: 'https://spotify.com',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  },
]

export const seedMilestones: Milestone[] = [
  {
    id: 'ms_seed_01',
    name: 'Runway Fund (6 Months)',
    targetMinor: 3000000, // $30,000.00
    currentMinor: 2150000, // $21,500.00
    monthlyContributionMinor: 250000, // $2,500.00 / month
    currency: 'USD',
    targetDate: null,
    scope: 'business',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  },
  {
    id: 'ms_seed_02',
    name: 'MacBook Pro M4 Max Upgrade',
    targetMinor: 380000, // $3,800.00
    currentMinor: 240000, // $2,400.00
    monthlyContributionMinor: 70000, // $700.00 / month
    currency: 'USD',
    targetDate: null,
    scope: 'personal',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  },
]

export const seedResources: Resource[] = [
  {
    id: 'res_seed_01',
    title: 'Deep Work: Rules for Focused Success',
    url: 'https://calnewport.com/deep-work/',
    type: 'book',
    author: 'Cal Newport',
    status: 'completed',
    rating: 5,
    summary: 'The ability to perform deep work is becoming increasingly rare at exactly the same time it is becoming increasingly valuable in our economy.',
    tags: ['focus', 'productivity', 'systems'],
    createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  },
  {
    id: 'res_seed_02',
    title: 'The Architecture of High-Agency Operators',
    url: 'https://shreyasdoshi.com',
    type: 'article',
    author: 'Shreyas Doshi',
    status: 'reading',
    rating: 5,
    summary: 'High agency operators bend reality to their will through extreme ownership, clarity of intent, and relentless compounding loops.',
    tags: ['agency', 'execution', 'mindset'],
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  },
  {
    id: 'res_seed_03',
    title: 'Dynamic Hedging & Liquidity Protocols',
    url: null,
    type: 'paper',
    author: 'Nassim Nicholas Taleb',
    status: 'to_read',
    rating: 4,
    summary: 'Mathematical foundations of convex payoffs, non-linear risk, and operational antifragility in high-variance systems.',
    tags: ['finance', 'risk', 'antifragile'],
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  },
  {
    id: 'res_seed_04',
    title: 'Principles of Evolutionary Software Architecture',
    url: 'https://martinfowler.com',
    type: 'article',
    author: 'Martin Fowler',
    status: 'completed',
    rating: 5,
    summary: 'Designing modular systems with clear hexagonal boundaries that accommodate change gracefully without massive refactors.',
    tags: ['architecture', 'systems'],
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  },
]

export const seedNotes: Note[] = [
  {
    id: 'not_seed_01',
    title: 'Systems Over Goals',
    content: `# Systems Over Goals

You do not rise to the level of your goals; you fall to the level of your systems.

## Core Tenet
Goals are good for setting a direction, but **systems** are best for making progress. A goal is a singular milestone, whereas a system is a continuous mechanism of compounding loops.

## Key Relationships
- Complements [[Feedback Loops & Compounding]]
- Derived from deep focus practices in [[Deep Work Protocol & Cognitive Scaffolding]]

> "Fix the inputs, and the outputs will take care of themselves."`,
    type: 'permanent',
    tags: ['systems', 'productivity', 'antifragile'],
    linkedNoteIds: ['not_seed_02', 'not_seed_03'],
    resourceId: null,
    pinned: true,
    archived: false,
    createdAt: new Date(Date.now() - 86400000 * 18).toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  },
  {
    id: 'not_seed_02',
    title: 'Feedback Loops & Compounding',
    content: `# Feedback Loops & Compounding

Tight feedback loops accelerate compounding. The faster an operator observes output, measures variance, and refines execution, the steeper their trajectory.

### Characteristics of Tight Loops
1. **Low latency:** Daily energy audits and evening reflection.
2. **Objective signals:** Metrics over sentiment.
3. **Continuous refactoring:** Adapting systems as complexity scales.

Cross-reference: See foundational framework in [[Systems Over Goals]].`,
    type: 'permanent',
    tags: ['systems', 'execution', 'growth'],
    linkedNoteIds: ['not_seed_01'],
    resourceId: null,
    pinned: true,
    archived: false,
    createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  },
  {
    id: 'not_seed_03',
    title: 'Deep Work Protocol & Cognitive Scaffolding',
    content: `# Deep Work Protocol & Cognitive Scaffolding

Notes and synthesis from *Deep Work* by Cal Newport.

## Core Hypotheses
- High-value knowledge work requires non-fragmented attention blocks of 90+ minutes.
- Network tools (Slack, email, feeds) cultivate continuous partial attention, permanently degrading executive focus.

## Actionable Scaffolding
- Protect morning 09:00 - 12:00 slots on the TimeGrid.
- Eliminate visual noise with OLED ultra-dark theme.
- Link concepts back to foundational principles in [[Systems Over Goals]].`,
    type: 'literature',
    tags: ['focus', 'productivity'],
    linkedNoteIds: ['not_seed_01'],
    resourceId: 'res_seed_01',
    pinned: false,
    archived: false,
    createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  },
  {
    id: 'not_seed_04',
    title: 'High-Agency Operating Principles',
    content: `# High-Agency Operating Principles

Synthesized from Shreyas Doshi's operational heuristics.

- **Extreme Ownership:** Treat every block as a deterministic constraint that can be engineered around.
- **Velocity vs Speed:** Speed is scalar; velocity is directional. Alignment matters 10x more than raw motion.
- Connects directly with [[Feedback Loops & Compounding]].`,
    type: 'literature',
    tags: ['agency', 'execution', 'mindset'],
    linkedNoteIds: ['not_seed_02'],
    resourceId: 'res_seed_02',
    pinned: false,
    archived: false,
    createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  },
  {
    id: 'not_seed_05',
    title: 'Q4 Architecture Modernization Sprint',
    content: `# Q4 Architecture Modernization Sprint

- [x] Migrate Action Hub drag-and-drop to resilient slot calculations
- [x] Integrate Safe-to-Spend proactive liquidity formula in Capital Hub
- [x] Deploy Knowledge Hub with bi-directional Zettelkasten backlinks
- [ ] Connect global inbox parser with multi-hub routing`,
    type: 'fleeting',
    tags: ['planning', 'architecture'],
    linkedNoteIds: [],
    resourceId: null,
    pinned: false,
    archived: false,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  },
]

export const seedTags: Tag[] = [
  { id: 'tag_systems', name: 'systems', color: 'violet', createdAt: new Date().toISOString(), schemaVersion: 1 },
  { id: 'tag_productivity', name: 'productivity', color: 'indigo', createdAt: new Date().toISOString(), schemaVersion: 1 },
  { id: 'tag_focus', name: 'focus', color: 'emerald', createdAt: new Date().toISOString(), schemaVersion: 1 },
  { id: 'tag_agency', name: 'agency', color: 'amber', createdAt: new Date().toISOString(), schemaVersion: 1 },
  { id: 'tag_architecture', name: 'architecture', color: 'sky', createdAt: new Date().toISOString(), schemaVersion: 1 },
]

