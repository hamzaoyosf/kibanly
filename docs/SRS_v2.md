# OBOiFY: Software Requirements Specification (SRS)

**Version:** 2.0 | **Date:** October 18, 2026 | **Status:** Active Technical Specification (Single Source of Truth)  
**Supersedes:** KiBANLY SRS v1.0 (October 11, 2026)

---

## 1.0 Technology Stack & Architecture Overview

| Layer | Technology Choice | Version / Package | Architectural Rationale in v2.0 |
|---|---|---|---|
| **Build & Core** | **Vite** + **React** + **TypeScript** | Vite 5.4+, React 18.3, TS 5.5+ | High-speed ESM bundling, strict type safety for repository contracts |
| **Styling & Theme** | **Tailwind CSS** | Tailwind 3.4+ | Flat Dark Gray (`gray-900`/`gray-800`/`gray-700`) system; zero glassmorphism |
| **Icons** | **lucide-react** | v0.447+ | Clean, consistent vector iconography |
| **Data Viz** | **Recharts** | v3.10+ | Used for cash flow areas, wellness radars, category donuts |
| **Activity Graph** | **Custom ActivityHeatmap** | Native SVG/CSS Grid | 365-day GitHub-style contribution matrix (53x7 cells) with mono tooltips |
| **Routing** | **React Router DOM** | v6.26+ | Split public landing (`/`), dedicated login (`/login`), and protected deck (`/app`) |
| **State Management** | **Zustand** + **TanStack Query** | Zustand 4.5+, Query 5.56+ | Client UI preferences (Zustand) + async server/local repository caching (Query) |
| **Drag & Drop** | **dnd-kit** | Core 6.3+, Sortable 10.0+ | Keyboard-accessible Kanban, Eisenhower, and Timeline reordering |
| **Date Utility** | **date-fns** | v3.6+ | Lightweight date calculations, streak algorithms, and week ranges |
| **Schema Validation** | **Zod** | v3.23+ | Strict runtime schema parsing across LocalStorage and Firestore boundaries |
| **Cloud Database** | **Firebase Firestore** | Firebase 13.0+ | Serverless document storage on Google Cloud Spark free tier |
| **Authentication** | **Firebase Auth** | Firebase 13.0+ | Google OAuth sign-in with client-side credential persistence |
| **Calendar Sync** | **Google Identity Services (GIS)** | GIS SDK + GCal REST v3 | Token client with proactive silent background refresh |
| **AI Engine** | **Google GenAI SDK** | `@google/genai` v2.30+ | Gemini 1.5 Flash structured JSON inferences |
| **E2E QA Suite** | **Cypress** | **Cypress 13+** | **Migrated 100% from Playwright for deterministic browser test automation** |
| **PWA Runtime** | **vite-plugin-pwa** | v2.0+ | Service worker caching, offline capability, standalone manifest |

---

## 2.0 System Architecture & Directory Topology

```
+-----------------------------------------------------------------------------------+
|                                 React 18 SPA                                      |
|                                                                                   |
|  Public Layer: LandingPage (/) . LoginPage (/login)                               |
|        |                                                                          |
|  Protected Shell (BentoShell / HubRail / CommandPalette / AppDeck)                |
|        |                                                                          |
|  Feature Hubs: action/  growth/  capital/  vault/  inbox/  settings/              |
|        |                                                                          |
|  Domain Hooks (useTasks, useHabits, useTransactions, useRenewalAlerts, ...)       |
|        |                   (TanStack Query + Zod Schemas)                         |
|  +-----v--------------------------------------------------------------------+     |
|  |                       Repository Abstraction Ports                       |     |
|  |     TaskRepo . HabitRepo . NoteRepo . TransactionRepo . SubscriptionRepo |     |
|  +-----+---------------------------------------------+----------------------+     |
|        | VITE_DATA_PROVIDER=local                    | =firebase                  |
|  +-----v---------------------+                +------v----------------------+     |
|  | LocalStorageRepo (MVP)    |                | FirestoreRepo (Cloud)       |     |
|  | - Direct browser storage  |                | - User-scoped subcollection |     |
|  +---------------------------+                +------+----------------------+     |
|                                                      |                            |
|  Services Layer:                                     |                            |
|    - AIService (Gemini 1.5 Flash via AI Studio)      |                            |
|    - CalendarService (GIS Silent Token Engine)       |                            |
|    - AuthService (Firebase Google Auth)              |                            |
|    - BackupService (Full JSON Export/Import)         |                            |
+------------------------------------------------------+----------------------------+
```

### 2.1 The Repository Pattern (Data Provider Swap)

All features query domain interfaces (`Repo<T>`). No UI feature touches `localStorage` or `firebase/firestore` directly.

```ts
// src/data/ports/Repo.ts
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

export interface Repo<T extends { id: string }> {
  list(query?: QueryOpts): Promise<T[]>
  get(id: string): Promise<T | null>
  create(input: CreateInput<T>): Promise<T>
  update(id: string, patch: Partial<T>): Promise<T>
  remove(id: string): Promise<void>
  subscribe?(cb: (items: T[]) => void): () => void
}
```

---

## 3.0 Data Models & Schemas (v2.0 Updates)

### 3.1 Currency & Capital Models (Moroccan Dirham Support)

In v2.0, the currency system natively supports **Moroccan Dirham (MAD)** alongside existing international currencies. Financial calculations strictly preserve integer minor units:
* For `USD`, `EUR`, `GBP`, `MAD`: 1 major unit = 100 minor units (cents / centimes / santimat).
* For `JPY`: 1 major unit = 1 minor unit.

```ts
// src/data/ports/schemas.ts
export const SupportedCurrencyEnum = z.enum([
  'USD',
  'EUR',
  'GBP',
  'MAD', // Moroccan Dirham (Morocco)
  'JPY',
  'CAD',
  'AUD',
  'CHF',
  'SGD',
  'INR',
])
export type SupportedCurrency = z.infer<typeof SupportedCurrencyEnum>

export const TransactionSchema = z.object({
  id: z.string(), // txn_...
  type: z.enum(['income', 'expense']),
  scope: z.enum(['business', 'personal']).default('business'),
  amountMinor: z.number().int().min(0), // Integer minor units (e.g. santimat for MAD)
  currency: SupportedCurrencyEnum.default('USD'),
  category: z.string().default('general'),
  description: z.string().min(1),
  date: z.string(), // YYYY-MM-DD
  subscriptionId: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  schemaVersion: z.number().default(2),
})

export const SubscriptionSchema = z.object({
  id: z.string(), // sub_...
  name: z.string().min(1),
  amountMinor: z.number().int().min(0),
  currency: SupportedCurrencyEnum.default('USD'),
  cycle: z.enum(['weekly', 'monthly', 'quarterly', 'yearly']).default('monthly'),
  nextRenewal: z.string(), // YYYY-MM-DD
  scope: z.enum(['business', 'personal']).default('business'),
  category: z.string().default('dev_tools'),
  status: z.enum(['active', 'paused', 'canceled']).default('active'),
  remindDaysBefore: z.number().default(3),
  url: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  schemaVersion: z.number().default(2),
})
```

### 3.2 Growth Hub Models & Data Wipe Strategy (Schema v2)

To eliminate corrupted habit streaks or unvalidated logs from earlier test versions, Growth Hub entities are versioned to `schemaVersion: 2`.

```ts
export const HabitSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  icon: z.string().default('sparkles'),
  category: z.enum(['movement', 'nutrition', 'mindfulness', 'learning', 'other']).default('other'),
  frequency: z.object({
    type: z.enum(['daily', 'weekdays', 'x_per_week', 'custom']).default('daily'),
    daysOfWeek: z.array(z.number()).optional(),
    targetPerWeek: z.number().optional(),
  }).default({ type: 'daily' }),
  targetPerWeek: z.number().default(7),
  archived: z.boolean().default(false),
  order: z.number().default(1000),
  createdAt: z.string(),
  updatedAt: z.string(),
  schemaVersion: z.number().default(2),
})

export const HabitLogSchema = z.object({
  id: z.string(), // Deterministic: ${habitId}_${YYYY-MM-DD}
  habitId: z.string(),
  date: z.string(), // YYYY-MM-DD
  done: z.boolean(),
  note: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  schemaVersion: z.number().default(2),
})

export const EnergyLogSchema = z.object({
  id: z.string(), // Deterministic: YYYY-MM-DD
  date: z.string(),
  energy: z.number().min(1).max(5),
  focus: z.number().min(1).max(5),
  mood: z.number().min(1).max(5),
  sleepHours: z.number().min(0).max(24),
  workoutDone: z.boolean().default(false),
  tasksCompleted: z.number().default(0),
  deepWorkMin: z.number().default(0),
  note: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  schemaVersion: z.number().default(2),
})
```

#### Growth Hub Wipe & Migration Protocol
* **Trigger Condition:** User updates to v2.0 or clicks "Reset Growth History" in Settings.
* **Mechanism:**
  ```ts
  export async function resetGrowthData(): Promise<void> {
    const habitLogs = await repos.habitLogs.list()
    const energyLogs = await repos.energyLogs.list()
    for (const log of habitLogs) await repos.habitLogs.remove(log.id)
    for (const log of energyLogs) await repos.energyLogs.remove(log.id)
    localStorage.removeItem('OBOiFY:v1:habitLogs')
    localStorage.removeItem('OBOiFY:v1:energyLogs')
  }
  ```
* Preserves Habit definitions (`HabitSchema`), but wipes stale daily logs to rebuild an accurate 365-day streak trajectory.

### 3.3 User & Settings Privacy Model (Hidden UID)

The user document stores system metadata, but UI views mask technical identifiers:

```ts
export const UserMetaSettingsSchema = z.object({
  timezone: z.string().default('Africa/Casablanca'),
  currency: SupportedCurrencyEnum.default('USD'),
  aiEnabled: z.boolean().default(true),
  dailyTaskGoal: z.number().default(5),
  calendar: z.object({
    connected: z.boolean().default(false),
    calendarId: z.string().default('primary'),
    lastSyncAt: z.string().nullable().default(null),
    autoRefresh: z.boolean().default(true),
  }),
})
```

* **UI Privacy Rule:** The raw Firestore UID (`user.uid`) is never rendered in plain text in any user-facing view. Settings renders an anonymized badge: `Cloud Account Connected (Google Auth)` with a copy-to-clipboard button labeled "Copy Account ID" (obscured with `••••••••`).

---

## 4.0 UI/UX Design System Specification (Flat Dark Gray)

### 4.1 Tailwind Color Tokens & CSS Variables

```css
:root {
  /* Canvas & Surfaces (Flat Dark Gray) */
  --bg-app:        #111827; /* gray-900 */
  --surface-card:  #1F2937; /* gray-800 */
  --surface-hover: #374151; /* gray-700 */
  --surface-inset: #0F172A; /* slate-900 / gray-950 */

  /* Borders & Dividers */
  --border-card:   #374151; /* gray-700 */
  --border-focus:  #4B5563; /* gray-600 */

  /* Text & Labels */
  --text-primary:  #F9FAFB; /* gray-50 */
  --text-muted:    #9CA3AF; /* gray-400 */
  --text-faint:    #6B7280; /* gray-500 */

  /* Strict Semantic Colors */
  --semantic-green:      #10B981; /* emerald-500 */
  --semantic-green-dark: #059669; /* emerald-600 */
  --semantic-green-bg:   rgba(16, 185, 129, 0.12);
  --semantic-red:        #EF4444; /* red-500 */
  --semantic-red-dark:   #DC2626; /* red-600 */
  --semantic-red-bg:     rgba(239, 68, 68, 0.12);

  /* Whisper-Quiet Hub Accents (Subtle top borders / hover-only) */
  --accent-action:       #38BDF8; /* sky-400 */
  --accent-growth:       #34D399; /* emerald-400 */
  --accent-capital:      #FBBF24; /* amber-400 */
  --accent-knowledge:    #A78BFA; /* violet-400 */

  /* Elevation */
  --shadow-flat:   0 1px 3px 0 rgba(0, 0, 0, 0.2), 0 1px 2px -1px rgba(0, 0, 0, 0.2);
  --shadow-hover:  0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.3);
}
```

### 4.2 Tailwind Theme Extension (`tailwind.config.js`)

```js
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: '#111827',
        surface: {
          DEFAULT: '#1F2937',
          hover: '#374151',
          inset: '#0F172A',
        },
        border: {
          DEFAULT: '#374151',
          focus: '#4B5563',
        },
        semantic: {
          done: '#10B981',
          overdue: '#EF4444',
        },
        hub: {
          action: '#38BDF8',
          growth: '#34D399',
          capital: '#FBBF24',
          knowledge: '#A78BFA',
        },
      },
      borderRadius: {
        card: '12px',
        chip: '6px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"IBM Plex Mono"', 'monospace'],
      },
    },
  },
}
```

### 4.3 Uniform Dashboard & 365-Day Activity Heatmap

The v2.0 dashboard eliminates chaotic asymmetric sizing in favor of a **balanced 12-column modular grid**.

```
+-----------------------------------------------------------------------------------+
| Top Metric Strip: 4 Uniform Cards (3 cols each: Tasks, Inbox, Habits, Net Cash)   |
+-----------------------------------------------------------------------------------+
| 365-Day Output Matrix: Full width (12 cols) GitHub-style contribution matrix      |
| [ Jan | Feb | Mar | Apr | May | Jun | Jul | Aug | Sep | Oct | Nov | Dec ]        |
+-------------------------------------------------+---------------------------------+
| Today's Action Timeline (6 cols)                | GTD Priority Tasks (6 cols)     |
+-------------------------------------------------+---------------------------------+
```

#### Heatmap Algorithm Specification
* Matrix Dimensions: 53 columns (weeks) $\times$ 7 rows (days = Sunday to Saturday).
* Output Metric per Day ($O_d$):
  $$O_d = (T_{\text{done}} \times 2) + H_{\text{completed}} + E_{\text{logged}} + \lfloor M_{\text{deep}} / 30 \rfloor$$
* Intensity Shading:
  * `0`: `#1F2937` (`bg-surface`)
  * `1` ($O_d \in [1, 2]$): `#064E3B` (`emerald-900`)
  * `2` ($O_d \in [3, 5]$): `#047857` (`emerald-700`)
  * `3` ($O_d \in [6, 9]$): `#059669` (`emerald-600`)
  * `4` ($O_d \ge 10$): `#10B981` (`emerald-500`)
* Interactive Popover: Displays exact date, tasks completed, habit completions, and deep work minutes with zero lag.

---

## 5.0 Routing & Authentication Architecture

### 5.1 Route Hierarchy

```ts
// src/app/router/index.tsx
export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />, // Public Marketing & Methodology Landing
    errorElement: <ErrorPage />,
  },
  {
    path: '/login',
    element: <LoginPage />, // Dedicated Google Auth & Soft-UI AuthModal
  },
  {
    path: '/app',
    element: <AuthGuard><BentoShell /></AuthGuard>, // Protected OS Shell
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'inbox', element: <InboxPage /> },
      { path: 'action', element: <ActionHubPage /> },
      { path: 'growth', element: <GrowthHubPage /> },
      { path: 'capital', element: <CapitalHubPage /> },
      { path: 'vault', element: <KnowledgeHubPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
  { path: '*', element: <ErrorPage isNotFound /> },
])
```

### 5.2 Clean Slate Initializer

```ts
// When a user logs in for the first time:
export async function initializeUserWorkspace(uid: string): Promise<void> {
  const metaDoc = await getDoc(doc(db, 'users', uid, 'meta', 'settings'))
  if (!metaDoc.exists()) {
    // Write empty settings record ONLY. Do NOT seed dummy tasks or habits!
    await setDoc(doc(db, 'users', uid, 'meta', 'settings'), {
      currency: 'USD',
      aiEnabled: true,
      dailyTaskGoal: 5,
      createdAt: new Date().toISOString(),
      schemaVersion: 2,
    })
  }
}
```

---

## 6.0 Calendar Sync Optimization Architecture

### 6.1 The 60-Minute Token Constraint & Silent Re-Authentication

Under client-side Google Identity Services (GIS), OAuth 2.0 access tokens expire in 3,600 seconds (1 hour). Without a paid backend server to hold refresh tokens, users in v1.0 faced repetitive auth popups.

#### v2.0 Silent Background Handshake Protocol
1. **Automated Token Expiration Watcher:**
   * An interval runs every 60 seconds checking `token.expiresAt - Date.now()`.
   * When remaining validity is $< 10$ minutes, the client proactively initiates silent re-authorization.
2. **Silent Handshake via `prompt: 'none'` / Hidden Frame:**
   ```ts
   export async function refreshCalendarTokenSilently(): Promise<boolean> {
     const clientId = getGoogleClientId()
     if (!clientId || !window.google?.accounts?.oauth2) return false

     return new Promise((resolve) => {
       const client = window.google!.accounts.oauth2.initTokenClient({
         client_id: clientId,
         scope: CALENDAR_SCOPE,
         prompt: '', // Silent prompt: no consent modal if active session exists
         callback: (response) => {
           if (response.access_token) {
             storeCalendarToken(response.access_token, response.expires_in ?? 3600)
             resolve(true)
           } else {
             resolve(false)
           }
         },
         error_callback: () => resolve(false),
       })
       client.requestAccessToken({ prompt: '' })
     })
   }
   ```
3. **Automated Handshake on Login:**
   * When signing in with Google on `/login`, if user opts in to Calendar Sync, the GIS token request is triggered immediately following the Firebase Auth popup, linking both accounts seamlessly.
4. **Degraded Offline Notice:**
   * If silent renewal fails (e.g. cookie block), the UI displays a flat, non-intrusive warning pill: `GCal Session Paused • Reconnect` rather than a blocking error modal.

---

## 7.0 QA & Testing Framework: Cypress Migration

### 7.1 Playwright Removal & Cypress Architecture
In OBOiFY, the testing framework is **100% migrated from Playwright to Cypress v13+**.
* Eliminates Playwright dependencies (`@playwright/test`, `playwright.config.ts`, `tests/`).
* Provides real-browser time-travel debugging and component testing within the Vite pipeline.

### 7.2 Cypress Directory Structure & Test Suites

```
cypress/
  e2e/
    01_landing_and_auth.cy.ts     # Tests landing page CTAs, Google Auth, and Soft-UI AuthModal
    02_clean_slate.cy.ts          # Validates zero mock data on fresh account creation
    03_quick_capture.cy.ts        # Verifies 'Q' shortcut, capture latency, and inbox listing
    04_gtd_workflow.cy.ts         # Tests Inbox -> Next Actions -> Timeline drag-and-drop
    05_growth_habits.cy.ts        # Tests habit check-offs, streak calculation, energy audit
    06_capital_and_mad.cy.ts      # Tests MAD currency selection, formatting, and subscription alerts
    07_activity_heatmap.cy.ts     # Verifies 365-day graph rendering and tooltip accuracy
    08_backup_roundtrip.cy.ts     # Tests full JSON export and restore integrity
  support/
    commands.ts                   # Custom Cypress commands (cy.loginGoogle, cy.cleanSlate)
    e2e.ts
cypress.config.ts
```

### 7.3 Cypress Configuration (`cypress.config.ts`)

```ts
import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    viewportWidth: 1440,
    viewportHeight: 900,
    video: false,
    screenshotOnRunFailure: true,
    supportFile: 'cypress/support/e2e.ts',
  },
})
```

---

## 8.0 Deployment & PWA Configuration

* **Hosting:** Cloudflare Pages with `_redirects` single-page fallback:
  ```
  /*    /index.html   200
  ```
* **PWA Service Worker:** `vite-plugin-pwa` configured in `registerType: 'autoUpdate'`, precaching HTML, CSS, JS, and font assets.
* **Theme Color:** Updated to `#111827` (Dark Gray canvas) in `manifest.webmanifest`.

---

## 9.0 Recall Loop Engine & Anti-Procrastination Architecture

### 9.1 Data Model Extensions (`TaskSchema`)

Recall Loop tasks integrate directly into the GTD flow without requiring separate data tables. Tasks carry two relational attributes:
* `recallGroupId`: `string | null` — Deterministic group identifier linking parent and review cards (e.g., `rec_grp_1729548000_abc1`).
* `recallRole`: `'parent' | 'child' | null` — Denotes whether the task is the root learning milestone or a subsequent spaced review card.

### 9.2 The Spaced Interval Curve

When converting an Inbox thought with **Enable Recall Loop**, the system creates 4 linked tasks:
1. **Parent Milestone:** Scheduled for target learning date $D_0$ (e.g. today).
2. **1st Recall (24h):** Scheduled for $D_0 + 1$ day. Focus: Immediate retrieval practice.
3. **2nd Recall (2 weeks):** Scheduled for $D_0 + 14$ days. Focus: Synaptic consolidation.
4. **3rd Recall (2 months):** Scheduled for $D_0 + 60$ days. Focus: Long-term semantic mastery.

### 9.3 Cascade Invariants

* **Cascade Delete:** Deleting any task containing `recallGroupId` executes a cascading delete across all tasks matching that `recallGroupId` in both Zustand memory and the underlying repository.
* **Cascade Reschedule (Parent):** Updating the `scheduledDate` of a parent task recalculates and updates the scheduled dates of all child review cards relative to the parent's new target date:
  $$D_{\text{child}} = \text{addDays}(D_{\text{parent\_new}}, \Delta_{\text{interval}})$$

### 9.4 Anti-Procrastination Logic: Grace Period vs. Reset Penalty

When a child Recall task is rescheduled to a later date, the system evaluates the latency $\Delta_{\text{days}} = D_{\text{new}} - D_{\text{old}}$:

```
                          Reschedule Child Recall Card
                                      |
                     +----------------+----------------+
                     |                                 |
              deltaDays <= 2                     deltaDays > 2
                     |                                 |
                     v                                 v
            [THE GRACE PERIOD]                 [THE RESET PENALTY]
         Forward Cascading Shift             Retention Curve Broken
        --------------------------          --------------------------
        Shift current card and all          - Reset card to "1st Recall (24h)"
        subsequent child cards forward      - Delete subsequent child cards
        by exact deltaDays.                 - Regenerate fresh +14d & +60d cards
```

1. **The Grace Period ($\Delta_{\text{days}} \le 2$):**
   * Minimal synaptic decay.
   * Applies **Forward Cascading Shift**: The target review card and all subsequent review cards in the sequence (`step > currentStep`) are shifted forward by $\Delta_{\text{days}}$, maintaining the downstream intervals.
2. **The Reset Penalty ($\Delta_{\text{days}} > 2$):**
   * Cognitive retention curve is broken due to excessive delay.
   * Target card title is reset to `"1st Recall (24h): [Base Title]"`.
   * All subsequent review cards (`step > currentStep`) are permanently purged.
   * Fresh `"2nd Recall (2 weeks)"` ($D_{\text{new}} + 14$d) and `"3rd Recall (2 months)"` ($D_{\text{new}} + 60$d) child cards are created to re-establish the forgetting curve foundation.

### 9.5 "Visual Guilt" Overdue UI Protocol

If a task with `recallRole` (or `recallGroupId`) satisfies:
$$D_{\text{scheduled}} < D_{\text{today}} \quad \land \quad \text{status} \ne \text{'done'}$$
The card applies an urgent visual cue in `TaskCard.tsx`:
* **Card Border & Glow:** `border-danger/70 bg-danger/[0.04] shadow-[0_0_12px_rgba(244,63,94,0.18)]`
* **Pulsing Indicator:** Red rotating icon with pulsing animation (`text-danger animate-pulse`).
* **Warning Badge:** Red badge displaying `Overdue (YYYY-MM-DD)`.
