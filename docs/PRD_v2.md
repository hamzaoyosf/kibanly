# OBOiFY: Product Requirements Document (PRD)

**Version:** 2.0 | **Date:** October 18, 2026 | **Status:** Active Master Specification (Single Source of Truth)  
**Supersedes:** KiBANLY PRD v1.0 (October 11, 2026)

---

## 1.0 Executive Summary & The v2.0 Pivot Manifesto

**OBOiFY** is an integrated personal operating system built for technical creators, solo founders, and knowledge professionals. It unifies high-tempo task execution (GTD & Eisenhower), lifestyle equilibrium (habits & energy auditing), personal/business financial runway (cash flow, subscriptions, and milestones), and second-brain knowledge synthesis (PARA & Zettelkasten) into a single, cohesive command deck.

### 1.1 The v2.0 Pivot Rationale

While KiBANLY v1.0 successfully proved the multi-hub architecture, local-first repository swap, and cloud synchronization, user testing and product evolution revealed key frictions:
1. **Visual Fatigue from Cyberpunk Aesthetics:** Neon glows, vibrant cyan/mint/violet borders, and OLED glassmorphism look impressive in mockups but induce cognitive distraction and visual fatigue during multi-hour deep work sessions.
2. **Dashboard Inconsistency:** Asymmetric, disparate bento tile sizing caused visual imbalance and cluttered scanning.
3. **Missing Public Funnel & Auth Separation:** The absence of a dedicated public landing page and a distinct login page made the platform feel like a raw internal tool rather than a consumer-grade Personal OS.
4. **Mock Data Pollution:** Forcing pre-seeded dummy tasks and habit logs onto new accounts created friction for users wanting an immediate, clean workspace.
5. **Session Friction in Calendar Sync:** Google Identity Services (GIS) access tokens expire after 60 minutes, leading to disruptive re-authentication modals if not proactively refreshed.

### 1.2 The v2.0 Core Tenets

> **"Quiet software for high-output minds."**

* **Utilitarian Minimalism:** Deep black OLED gradients and neon backlights are replaced by a disciplined, industrial Dark Gray canvas (`#111827`, Tailwind `gray-900`) and flat elevated cards (`#1F2937`, `gray-800`).
* **Strict Semantic Color Discipline:** Color carries functional meaning, not decorative flash. **Green** means done, verified, positive, or active. **Red** means overdue, blocked, negative, or warning. Hub accents are demoted to whisper-quiet indicators (1px top borders or hover-only hints).
* **Uniform Grid Architecture:** Irregular bento tiles are replaced by evenly sized, balanced modular cards.
* **Global Output Visibility:** The home deck features a prominent, GitHub-style 365-day activity heatmap tracking daily tasks, habit execution, and deep-work velocity.
* **True Clean Slate Protocol:** First-time user onboarding begins in a pristine, empty workspace with guided empty states rather than dummy mock data.
* **Frictionless Google Calendar Continuity:** Automated background token refresh minimizes the 60-minute re-auth prompts without requiring a paid server backend.

---

## 2.0 Target Audience & The Solo Builder Persona

### 2.1 Primary Persona: "The Solo Builder"
* **Demographics:** Freelance software engineers, indie hackers, technical consultants, boutique agency founders (ages 22–45).
* **Workflow Reality:** Simultaneously juggling client billables, product development, side-project infrastructure, personal fitness, and personal/business cashflow.
* **Tool Fatigue:** Exhausted by maintaining Notion boards, Obsidian graphs, Todoist lists, Toggl timers, and Google Sheets simultaneously.
* **Aesthetic Standard:** Appreciates the technical restraint of Linear, GitHub, and Raycast. Prefers keyboard shortcuts (`Cmd+K`, `Q`) over mouse navigation.

### 2.2 Secondary Personas
* **The Technical Researcher / Graduate Student:** Heavy user of Zettelkasten atomic notes, markdown backlinks, and daily habit streaks.
* **The Bootstrapped Operator:** Focuses heavily on the Capital Hub for subscription burn rates, MRR runway, and project milestone countdowns.

---

## 3.0 UI/UX Philosophy & Visual Design Architecture

### 3.1 The Flat Dark Gray Design System
* **Canvas:** Uniform `bg-gray-900` (`#111827`).
* **Surfaces:** Flat `bg-gray-800` (`#1F2937`) with 1px border `border-gray-700` (`#374151`).
* **Active / Hover State:** `hover:bg-gray-750` / `hover:border-gray-600` paired with crisp, flat drop-shadows (`shadow-md`). **Zero glowing neon borders, zero backdrop blur.**
* **Typography:** Clean sans-serif for interface UI (`Inter`), paired with tabular monospaced numbers (`JetBrains Mono`) for all financial sums, dates, timers, and metrics.

### 3.2 Color Semantics

| Semantic State | Color Code | Application |
|---|---|---|
| **Success / Done / Positive** | Emerald/Green (`#10B981`) | Completed tasks, logged habits, positive net cashflow, streak active, connected status |
| **Danger / Overdue / Negative** | Rose/Red (`#EF4444`) | Overdue tasks, missed habits, net cash outflow, expired tokens, errors, delete actions |
| **Neutral Text (Primary)** | `#F9FAFB` (`gray-50`) | Primary headlines, task titles, active metrics |
| **Neutral Text (Muted)** | `#9CA3AF` (`gray-400`) | Secondary descriptions, timestamps, subheaders |
| **Neutral Text (Faint)** | `#6B7280` (`gray-500`) | Keyboard shortcut badges, non-essential captions |
| **Subtle Hub Indicators** | 1px top border or hover outline | Extremely faint categorization (e.g., `#38BDF8` Action, `#34D399` Growth, `#FBBF24` Capital, `#A78BFA` Knowledge) |

### 3.3 Dashboard Redesign & The 365-Day Contribution Graph
* **Uniform Card Dimensions:** The dashboard adopts a structured 12-column grid where cards snap into standardized, balanced modules (e.g., 3-col stat tiles, 4-col charts, 6-col execution panels).
* **GitHub-Style 365-Day Activity Graph:**
  * Spans 53 weeks x 7 days (365/366 days) across the main command deck.
  * Calculates daily aggregate output score:
    $$\text{Score} = (\text{Tasks Done} \times 2) + (\text{Habits Completed}) + (\text{Energy Logged ? } 1 : 0) + \lfloor\text{Deep Work Min} / 30\rfloor$$
  * Rendered in 5 distinct green intensity levels:
    * `Level 0`: `bg-gray-800` (zero activity)
    * `Level 1`: `bg-emerald-950` / `text-emerald-300` (low output)
    * `Level 2`: `bg-emerald-800` (moderate output)
    * `Level 3`: `bg-emerald-600` (high output)
    * `Level 4`: `bg-emerald-400` (exceptional output)
  * Rich interactive hover popover: shows formatted date, tasks completed, habits logged, and deep work minutes.

---

## 4.0 Routing, Navigation & Onboarding Flow

```
                      +-----------------------------+
                      |   Public Landing Page (/)   |
                      |   - Features overview       |
                      |   - "Enter OBOiFY" CTA      |
                      +--------------+--------------+
                                     |
                                     v
                      +-----------------------------+
                      |      Login Page (/login)    |
                      |   - Google OAuth Button     |
                      |   - Continue Offline / Demo |
                      +--------------+--------------+
                                     |
               +---------------------+---------------------+
               | (First-time user)                         | (Returning user)
               v                                           v
+-------------------------------+           +-------------------------------+
| Clean Slate Onboarding Deck   |           | Active Command Deck (/app)    |
| - 0 Tasks, 0 Habits, 0 Notes  |           | - 365-day activity graph      |
| - Inline "Capture First" card |           | - Daily agenda & active tasks |
+-------------------------------+           +-------------------------------+
```

### 4.1 Public Landing Page (`/`)
* Accessible to unauthenticated visitors.
* Clean, fast, dark-gray presentation highlighting:
  * The 4 Hubs (Action, Growth, Capital, Knowledge).
  * Framework integration (GTD, Eisenhower, PARA, Zettelkasten).
  * Offline-first, client-side privacy architecture.
* Direct action pills: "Launch Web App", "Sign In with Google", "Explore Interactive Demo".

### 4.2 Dedicated Login Page (`/login`)
* Minimalist, distraction-free authentication gateway.
* Sign in with Google (Firebase Auth).
* Local-first fallback: "Continue as Local Guest (No Cloud Sync)".
* Redirect memory: restores user directly to their previously attempted deep-link route upon authentication.

### 4.3 Clean Slate Protocol
* When a user signs in for the first time, the database initializes with **zero dummy records**.
* Every Hub renders an ergonomic, helpful empty state:
  * **Global Inbox:** "Your inbox is clear. Press `Q` anywhere to capture your first thought."
  * **Action Hub:** "No tasks scheduled for today. Drag a task from Next Actions or create a new block."
  * **Growth Hub:** "No active habits tracked. Set up your first non-negotiable daily routine."
  * **Capital Hub:** "No transactions recorded. Log your starting account balance or active subscriptions."
  * **Knowledge Vault:** "Second Brain empty. Create your first atomic note or PARA project space."
* An optional "Load Demo Data" toggle is accessible in Settings for users wishing to test the platform with dummy data.

---

## 5.0 Framework-to-Feature Mapping (v2.0)

| Framework | Implementation in OBOiFY |
|---|---|
| **Getting Things Done (GTD)** | Global Inbox with instant capture (`Q`), Clarify flow, Next Actions, Scheduled, Waiting For, and Someday lists; 3-stage Weekly Review Wizard |
| **Eisenhower Matrix** | Action Hub 2x2 flat grid; instant drag-and-drop prioritization (Do / Schedule / Delegate / Delete) |
| **Time Blocking** | Action Hub Timeline with 15-minute snapping, Google Calendar two-way synchronization, and conflict alerts |
| **P.A.R.A.** | Knowledge Vault structured containers: Projects (active), Areas (standards), Resources (references), Archives (completed) |
| **Zettelkasten** | Knowledge Vault atomic notes with `[[wiki-links]]`, bidirectional backlink graph, tags, and markdown preview |
| **TIERS Operating Review** | Home dashboard unified modules: Tasks, Inbox, Energy/Events, Resources, Systems |

---

## 6.0 User Stories (v2.0 Refactor)

### 6.1 Landing, Authentication & Onboarding
* **US-AUTH-01:** As a visitor, I want to view a fast, elegant landing page explaining OBOiFY so that I understand its methodology before signing up.
* **US-AUTH-02:** As a user, I want a dedicated login screen where I can sign in with one click using Google.
* **US-AUTH-03:** As a first-time user, I want an empty, pristine workspace (Clean Slate) without fake tasks or dummy habits cluttering my dashboard.
* **US-AUTH-04:** As an offline user, I want to use the full OS without logging in, storing data locally in my browser.

### 6.2 Command Deck & 365-Day Graph
* **US-DASH-01:** As a user, I want a uniform, clutter-free dashboard where cards are aligned and consistently sized.
* **US-DASH-02:** As a user, I want to view a GitHub-style 365-day activity heatmap on my home dashboard so that I can visually verify my consistency and productivity velocity over the entire year.
* **US-DASH-03:** As a user, I want to hover over any day in the 365-day graph to see exact counts of tasks completed, habits logged, and deep work time.

### 6.3 Action Hub
* **US-ACT-01:** As a user, I want to press `Q` anywhere to open Quick Capture in under 100ms.
* **US-ACT-02:** As a user, I want Kanban columns (Draft, In Progress, Done) with flat card styling and drag-and-drop.
* **US-ACT-03:** As a user, I want to drag tasks between Eisenhower quadrants to establish priority.
* **US-ACT-04:** As a user, I want to drag tasks onto the Timeline to schedule 15-minute time blocks synchronized with Google Calendar.
* **US-ACT-05:** As a user, I want to launch the GTD Weekly Review Wizard to clear my inbox and plan the upcoming week.

### 6.4 Personal Growth Hub
* **US-GRO-01:** As a user, I want daily habit check-offs with green confirmation states and accurate streak calculation.
* **US-GRO-02:** As a user, I want a 30-second daily Energy Audit (Energy 1-5, Focus 1-5, Mood 1-5, Sleep hours, Workout flag) to monitor burnout risks.
* **US-GRO-03:** As a user, I want a weekly AI Vitality Insight correlating my sleep and workouts with completed task volume.
* **US-GRO-04:** As a user, I want to apply workout and meal-prep routine presets to any day in one click.

### 6.5 Capital Hub (with MAD Currency)
* **US-CAP-01:** As a user, I want to select **Moroccan Dirham (MAD)** as my default currency in addition to USD, EUR, GBP, etc.
* **US-CAP-02:** As a user, I want all financial sums formatted accurately in my selected currency (e.g. `2,500.00 MAD` or `2 500,00 DH`).
* **US-CAP-03:** As a user, I want a subscription ledger showing billing cycle, next renewal date, and upcoming renewal alerts $\le 7$ days away.
* **US-CAP-04:** As a user, I want to log business and personal income/expenses and view a cash flow chart.
* **US-CAP-05:** As a user, I want milestone savings calculators with ETA projections based on monthly contributions.

### 6.6 Knowledge Vault
* **US-VLT-01:** As a user, I want PARA project spaces that group notes, external links, deadlines, and associated tasks.
* **US-VLT-02:** As a user, I want atomic notes with `[[wiki-linking]]` and automated bidirectional backlinks.
* **US-VLT-03:** As a user, I want a resource library for cheatsheets, code snippets, and bookmarks with instant copy-to-clipboard.

### 6.7 Data, Settings & Privacy
* **US-SET-01:** As a user, I want my raw Firestore UID hidden from the Settings UI to protect my privacy.
* **US-SET-02:** As a user, I want to export all my OS data as a JSON file and restore it on demand.
* **US-SET-03:** As a user transitioning to v2.0, I want a safe wipe/migration protocol for corrupted or legacy Growth Hub data.
* **US-SET-04:** As a user, I want Google Calendar sync to remain connected without asking me to re-authenticate every 60 minutes.

---

## 7.0 Feature Breakdown & Priority Matrix (v2.0)

| Module | Feature | Scope / Change in v2.0 | Priority |
|---|---|---|---|
| **Public** | Landing Page | Clean, minimalist public marketing page with feature overview & CTAs | **P0** |
| **Auth** | Dedicated Login Page | Dedicated `/login` route with Google Auth and Guest Mode | **P0** |
| **Onboarding** | Clean Slate Protocol | Zero mock data for new users; clean empty states with instant CTAs | **P0** |
| **Theme** | Flat Dark Gray System | Removal of OLED glassmorphism, neon glows, and radial hot-spots; strict Green/Red semantics | **P0** |
| **Dashboard** | 365-Day Activity Heatmap | Full year contribution grid (53x7) tracking tasks, habits, energy, deep work | **P0** |
| **Dashboard** | Uniform Bento Layout | Standardized modular card sizes across the command deck | **P0** |
| **Capital** | Moroccan Dirham (MAD) | Native MAD formatting and minor-unit storage | **P0** |
| **Settings** | Privacy UID Masking | Hide raw Firestore UID from interface | **P1** |
| **Growth** | Data Wipe / Reset Tool | Admin/user tool to safely clear or migrate legacy habit/energy logs | **P1** |
| **Calendar** | GIS Silent Re-Auth | Background token renewal protocol minimizing 60-min interruptions | **P1** |
| **Testing** | Cypress E2E Migration | Complete replacement of Playwright with Cypress v13+ suite | **P0** |

---

## 8.0 Non-Functional Requirements & Success Metrics (v2.0)

### 8.1 Performance & Reliability
* **Initial Page Load:** Largest Contentful Paint (LCP) under **1.5s** on standard 4G connections.
* **Local Latency:** Task capture, checkbox toggles, and navigation transitions under **50ms**.
* **Zero Cost Infrastructure:** Operates 100% within Firebase Spark free tier, Gemini free tier, and Cloudflare Pages free tier.
* **Offline Continuity:** PWA service worker precaches all application assets; local mode functions without network connection.

### 8.2 Security & Data Privacy
* **Client-Side Encryption of Secrets:** API keys (Gemini, Google Client ID) stored strictly in browser `localStorage`.
* **Firestore Security:** User-scoped subcollections (`users/{uid}/**`) enforcing strict `request.auth.uid == uid` rules.
* **Zero Analytics Telemetry:** No third-party behavioral trackers or privacy-invasive telemetry scripts.

### 8.3 v2.0 Success Metrics (KPIs)
* **First-Day Friction:** $> 75\%$ of new users successfully capture their first real task within 3 minutes of signup.
* **Calendar Retention:** Reduction of calendar re-auth bounce rate from $28\%$ to $< 3\%$.
* **Visual Ergonomics:** Zero reported issues regarding neon eye strain; positive feedback on dark gray technical clarity.
* **Test Reliability:** 100% green Cypress E2E test runs across Chrome and Firefox on CI.

---

## 9.0 Phase Roadmap for v2.0 Refactor

* **Phase 1: Foundations & Theme Pivot:**
  * Clean out OLED CSS tokens, install flat Dark Gray tokens (`gray-900`, `gray-800`, `gray-700`).
  * Enforce strict Green/Red color semantics across UI components.
  * Setup Cypress E2E framework and remove Playwright scaffolding.
* **Phase 2: Routing, Auth & Clean Slate:**
  * Build public Landing Page (`/`) and dedicated Login Page (`/login`).
  * Implement Clean Slate protocol (disable auto-seeding on fresh accounts).
  * Hide raw Firestore UID in Settings.
* **Phase 3: Uniform Dashboard & 365-Day Activity Graph:**
  * Rebuild Home Dashboard with standardized uniform modules.
  * Implement full 365-day GitHub-style SVG/CSS activity heatmap with activity aggregation.
* **Phase 4: Data, Currency & Calendar Optimization:**
  * Implement Moroccan Dirham (MAD) currency support in `money.ts` and schemas.
  * Implement Growth Hub wipe/reset utility for v2.0 migration.
  * Implement silent background token refresh for Google Calendar GIS.
* **Phase 5: Full Cypress QA & Verification:**
  * Comprehensive E2E test coverage across all Hubs, flows, and responsive viewports.
