import React from 'react'
import { Link } from 'react-router-dom'
import {
  CheckSquare,
  TrendingUp,
  Coins,
  BookOpen,
  ArrowRight,
  Shield,
  Zap,
  Activity,
  Sparkles,
  Lock,
} from 'lucide-react'

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-canvas text-text selection:bg-gray-700 selection:text-white flex flex-col">
      {/* Navigation Header */}
      <header className="border-b border-border bg-surface sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="font-mono text-base font-bold tracking-wider text-text">
              OBOiFY
            </span>
          </div>

          <div className="flex items-center space-x-3 text-xs font-mono">
            <Link
              to="/login"
              className="px-3 py-1.5 rounded-lg text-text-muted hover:text-text hover:bg-surface-2 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/app"
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all shadow-sm hover:shadow"
            >
              Launch App
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="py-20 px-4 text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-surface-2 border border-border text-xs font-mono text-emerald-400 mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>The Personal Operating System for Solo Builders</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-text leading-tight sm:leading-tight">
            One Dashboard. Four Hubs.{' '}
            <span className="text-emerald-400">Zero Context Switching.</span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-text-muted max-w-2xl mx-auto leading-relaxed">
            Replace 5 fragmented productivity apps. Unify GTD task execution, habit routines,
            capital runway, and your second brain in a flat, minimalist Dark Gray workbench.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 text-xs font-mono">
            <Link
              to="/app"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center justify-center space-x-2 shadow-md hover:shadow-lg transition-all"
            >
              <span>Launch Command Deck (Guest Mode)</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/login"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-surface border border-border hover:bg-surface-2 text-text font-semibold flex items-center justify-center space-x-2 shadow-sm transition-all"
            >
              <span>Sign in with Google Cloud Sync</span>
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-[11px] font-mono text-text-faint">
            <span className="flex items-center space-x-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Local-First & Offline Capable</span>
            </span>
            <span>•</span>
            <span className="flex items-center space-x-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Zero-Telemetry Privacy</span>
            </span>
            <span>•</span>
            <span className="flex items-center space-x-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sub-50ms Interaction Speed</span>
            </span>
          </div>
        </section>

        {/* The 4 Hubs Architecture Grid */}
        <section className="py-16 px-4 max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-text">
              Engineered on Proven Knowledge Frameworks
            </h2>
            <p className="mt-2 text-xs text-text-muted">
              Native implementations of GTD, Eisenhower, P.A.R.A., and Zettelkasten.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Action Hub */}
            <div className="card p-6 border-t-2 border-t-sky-400 flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2.5 mb-3">
                  <span className="p-2 rounded-lg bg-surface-2 text-sky-400 border border-border">
                    <CheckSquare className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-text">Action Hub</h3>
                    <p className="text-[11px] font-mono text-text-muted">Getting Things Done & Eisenhower</p>
                  </div>
                </div>
                <p className="text-xs text-text-muted leading-relaxed">
                  Frictionless thought capture with single-key <kbd className="px-1.5 py-0.5 rounded bg-surface-2 border border-border font-mono text-[10px] text-text">Q</kbd>,
                  drag-and-drop Kanban execution, 2x2 Eisenhower matrix prioritization, and 15-minute time-blocking with Google Calendar two-way sync.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs font-mono text-sky-400">
                <span>Inbox • Kanban • Timeline</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            {/* 2. Personal Growth Hub */}
            <div className="card p-6 border-t-2 border-t-emerald-400 flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2.5 mb-3">
                  <span className="p-2 rounded-lg bg-surface-2 text-emerald-400 border border-border">
                    <TrendingUp className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-text">Personal Growth Hub</h3>
                    <p className="text-[11px] font-mono text-text-muted">Habits & Daily Condition</p>
                  </div>
                </div>
                <p className="text-xs text-text-muted leading-relaxed">
                  Daily non-negotiable habit check-offs with streak mathematics, 30-second daily energy audits (sleep, mood, focus),
                  weekly AI-generated vitality insights, and one-click workout/meal-prep routine presets.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs font-mono text-emerald-400">
                <span>Habits • Energy Audits • Radar</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            {/* 3. Capital Hub */}
            <div className="card p-6 border-t-2 border-t-amber-400 flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2.5 mb-3">
                  <span className="p-2 rounded-lg bg-surface-2 text-amber-400 border border-border">
                    <Coins className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-text">Capital Hub</h3>
                    <p className="text-[11px] font-mono text-text-muted">Cashflow, Subscriptions & MAD Currency</p>
                  </div>
                </div>
                <p className="text-xs text-text-muted leading-relaxed">
                  Dual-ledger business and personal cashflow tracking, subscription renewal radar (surfacing alerts $\le 7$ days before renewal),
                  and savings milestone ETA calculators with native Moroccan Dirham (MAD) & USD/EUR support.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs font-mono text-amber-400">
                <span>Runway • Subscriptions • Milestones</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            {/* 4. Knowledge Vault */}
            <div className="card p-6 border-t-2 border-t-violet-400 flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2.5 mb-3">
                  <span className="p-2 rounded-lg bg-surface-2 text-violet-400 border border-border">
                    <BookOpen className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-text">Knowledge Vault</h3>
                    <p className="text-[11px] font-mono text-text-muted">P.A.R.A. & Zettelkasten Second Brain</p>
                  </div>
                </div>
                <p className="text-xs text-text-muted leading-relaxed">
                  Project workspaces organizing notes, deadlines, and child tasks. Atomic notes with bidirectional
                  <code className="px-1.5 py-0.5 rounded bg-surface-2 border border-border font-mono text-[10px] text-text">[[wiki-links]]</code>,
                  automatic backlink resolution, and copyable snippet library.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs font-mono text-violet-400">
                <span>Projects • Atomic Notes • Snippets</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </section>

        {/* 365-Day Contribution Feature Spotlight */}
        <section className="py-12 px-4 max-w-4xl mx-auto text-center">
          <div className="card p-8 border border-border bg-surface text-left">
            <div className="flex items-center space-x-3 mb-4">
              <span className="p-2 rounded-lg bg-surface-2 text-emerald-400 border border-border">
                <Activity className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-lg font-bold text-text">365-Day Execution Visibility</h3>
                <p className="text-xs text-text-muted">Visual proof of work, every single day</p>
              </div>
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              Every completed task, logged habit, and deep-work interval is synthesized onto an annual
              contribution matrix directly on your home deck. No vanity metrics — just an authentic,
              emerald-intensity heatmap of your real output.
            </p>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-20 px-4 text-center max-w-2xl mx-auto border-t border-border">
          <h2 className="text-3xl font-bold text-text">
            Ready to Take Command?
          </h2>
          <p className="mt-2 text-xs text-text-muted">
            Start immediately in guest mode or sign in to sync with Firebase Firestore.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 text-xs font-mono">
            <Link
              to="/app"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all shadow-md"
            >
              Enter OBOiFY
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-surface border border-border hover:bg-surface-2 text-text font-semibold transition-all"
            >
              Sign In with Google
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 text-center text-xs font-mono text-text-faint">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>OBOiFY • The Solo Builder Operating System</span>
          <span>Offline-First PWA • Flat Dark Gray Architecture</span>
        </div>
      </footer>
    </div>
  )
}
