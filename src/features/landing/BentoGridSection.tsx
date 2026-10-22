import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Inbox,
  RefreshCw,
  CheckSquare,
  Sparkles,
  ArrowRight,
  Clock,
  Calendar,
  Layers,
  TrendingUp,
  Brain,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { Link } from 'react-router-dom'

export const BentoGridSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'kanban' | 'eisenhower' | 'timeline'>('timeline')

  return (
    <section id="bento" className="py-24 sm:py-32 px-4 max-w-6xl mx-auto relative z-10">
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="text-center max-w-3xl mx-auto mb-16 sm:mb-20"
      >
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-white/[0.05] border border-white/10 backdrop-blur-md text-xs font-mono text-emerald-400 mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>The Three Cognitive Engines</span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
          Engineered for Zero Mental Friction
        </h2>

        <p className="mt-4 text-sm sm:text-base text-white/60 leading-relaxed font-sans">
          A seamless trinity of capture, learning retention, and flawless execution.
          Designed for deep focus, hyper-fluid interactions, and zero clutter.
        </p>
      </motion.div>

      {/* Bento Grid Container */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
        
        {/* CARD 1: Large Span-2 Card -> RECALL LOOP */}
        <motion.div
          id="recall"
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="md:col-span-2 rounded-[2rem] sm:rounded-[2.5rem] bg-white/[0.04] hover:bg-white/[0.06] backdrop-blur-xl border border-white/10 hover:border-white/20 p-6 sm:p-10 flex flex-col justify-between transition-all duration-300 shadow-[0_16px_40px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.45)] group relative overflow-hidden"
        >
          {/* Ambient Glow in Card */}
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-emerald-500/15 blur-[80px] pointer-events-none group-hover:bg-emerald-500/25 transition-colors duration-500" />

          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                  <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-700" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    Recall Loop
                  </h3>
                  <span className="text-xs font-mono text-emerald-400">
                    Spaced Learning Engine
                  </span>
                </div>
              </div>

              <span className="px-3.5 py-1 rounded-full bg-white/[0.06] border border-white/10 text-[11px] font-mono text-white/70">
                Cognitive Science
              </span>
            </div>

            <p className="text-sm sm:text-base text-white/70 font-sans leading-relaxed max-w-xl">
              <strong className="text-white font-semibold">Never forget again with automated spaced repetition.</strong>{' '}
              Converts raw thoughts into 3 spaced review milestones. Built-in Grace Period (≤ 2d shift) and Reset Penalty (&gt; 2d broken curve recovery) ensure your long-term memory trace never decays.
            </p>

            {/* Interactive Retention Curve Simulation */}
            <div className="mt-8 p-4 sm:p-6 rounded-[1.5rem] bg-[#0C1220]/70 border border-white/10 space-y-4">
              <div className="flex items-center justify-between text-xs font-mono text-white/60">
                <span className="flex items-center space-x-1.5 text-emerald-400">
                  <Brain className="w-3.5 h-3.5" />
                  <span>Retention Curve Schedule</span>
                </span>
                <span className="text-[11px] text-white/40">Automated Interval Milestones</span>
              </div>

              {/* 3 Steps Visualizer */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Step 1 */}
                <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-emerald-500/30 flex flex-col justify-between space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
                      Step 1 • 24 Hours
                    </span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <p className="text-xs font-medium text-white/90">Immediate Retrieval</p>
                  <p className="text-[11px] text-white/50">Halts initial forgetting decay</p>
                </div>

                {/* Step 2 */}
                <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-col justify-between space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                      Step 2 • 2 Weeks
                    </span>
                    <Clock className="w-3.5 h-3.5 text-white/40" />
                  </div>
                  <p className="text-xs font-medium text-white/90">Synaptic Consolidation</p>
                  <p className="text-[11px] text-white/50">Reinforces active recall</p>
                </div>

                {/* Step 3 */}
                <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-col justify-between space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                      Step 3 • 2 Months
                    </span>
                    <Clock className="w-3.5 h-3.5 text-white/40" />
                  </div>
                  <p className="text-xs font-medium text-white/90">Mastery Trace</p>
                  <p className="text-[11px] text-white/50">Locks into permanent memory</p>
                </div>
              </div>

              {/* Anti-Procrastination Badges */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/[0.06] text-[11px] font-mono">
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Grace Period (≤ 2d shift)
                </span>
                <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Reset Penalty (&gt; 2d restart)
                </span>
                <span className="px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center space-x-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>Visual Guilt Overdue Alerts</span>
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
            <span className="text-xs font-mono text-white/50">
              Integrated with GTD Task Model
            </span>
            <Link
              to="/app"
              className="inline-flex items-center space-x-2 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <span>Explore Recall Loop</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>

        {/* CARD 2: Span 1 -> GLOBAL INBOX */}
        <motion.div
          id="inbox"
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-[2rem] sm:rounded-[2.5rem] bg-white/[0.04] hover:bg-white/[0.06] backdrop-blur-xl border border-white/10 hover:border-white/20 p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 shadow-[0_16px_40px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.45)] group relative overflow-hidden"
        >
          {/* Ambient Glow */}
          <div className="absolute -top-16 -right-16 w-60 h-60 rounded-full bg-sky-500/15 blur-[60px] pointer-events-none group-hover:bg-sky-500/25 transition-colors" />

          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="w-10 h-10 rounded-full bg-sky-500/15 border border-sky-400/30 flex items-center justify-center text-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.3)]">
                <Inbox className="w-5 h-5" />
              </div>
              <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 text-xs font-mono text-white">
                <span>Press</span>
                <kbd className="px-1.5 py-0.5 rounded-full bg-white/15 text-sky-400 font-bold">Q</kbd>
              </div>
            </div>

            <h3 className="text-xl font-bold text-white tracking-tight mb-2">
              Global Inbox
            </h3>

            <p className="text-xs sm:text-sm text-white/70 leading-relaxed font-sans mb-6">
              <strong className="text-white font-semibold">Capture instantly.</strong>{' '}
              Empty your mind without breaking focus. Sub-50ms capture modal triggers from any screen, with instant local speed.
            </p>

            {/* Simulated Capture Card */}
            <div className="p-4 rounded-2xl bg-[#0C1220]/80 border border-white/10 space-y-3">
              <div className="flex items-center justify-between text-[11px] font-mono text-white/50">
                <span>Quick Thought</span>
                <span className="text-sky-400">AI Analyzed</span>
              </div>
              <p className="text-xs text-white/90 font-medium font-sans">
                "Review architectural blueprint for multi-region replication"
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1 text-[10px] font-mono">
                <span className="px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/25">
                  @deep_work
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                  25m
                </span>
                <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                  Action Hub
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-between">
            <span className="text-xs font-mono text-white/50">Sub-50ms Input</span>
            <Link
              to="/app"
              className="inline-flex items-center space-x-1.5 text-xs font-semibold text-sky-400 hover:text-sky-300 transition-colors"
            >
              <span>Try Capture</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </motion.div>

        {/* CARD 3: Span 1 -> ACTION HUB */}
        <motion.div
          id="action"
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-[2rem] sm:rounded-[2.5rem] bg-white/[0.04] hover:bg-white/[0.06] backdrop-blur-xl border border-white/10 hover:border-white/20 p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 shadow-[0_16px_40px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.45)] group relative overflow-hidden"
        >
          {/* Ambient Glow */}
          <div className="absolute -top-16 -right-16 w-60 h-60 rounded-full bg-amber-500/15 blur-[60px] pointer-events-none group-hover:bg-amber-500/25 transition-colors" />

          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="w-10 h-10 rounded-full bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)]">
                <CheckSquare className="w-5 h-5" />
              </div>
              <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-mono text-amber-400">
                Execution
              </span>
            </div>

            <h3 className="text-xl font-bold text-white tracking-tight mb-2">
              Action Hub
            </h3>

            <p className="text-xs sm:text-sm text-white/70 leading-relaxed font-sans mb-6">
              <strong className="text-white font-semibold">Execute with precision.</strong>{' '}
              Organize into Kanban columns, prioritize in the 2x2 Eisenhower matrix, and block daily time with 15-minute slot snapping.
            </p>

            {/* Mini View Mode Selector Switcher */}
            <div className="p-3.5 rounded-2xl bg-[#0C1220]/80 border border-white/10 space-y-3">
              <div className="flex items-center justify-between p-1 rounded-full bg-white/[0.06] text-[11px] font-mono">
                {(['kanban', 'eisenhower', 'timeline'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setActiveTab(mode)}
                    className={`px-3 py-1 rounded-full transition-all capitalize ${
                      activeTab === mode
                        ? 'bg-amber-500 text-black font-semibold shadow-sm'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>

              <div className="text-[11px] font-mono text-white/70 px-1">
                {activeTab === 'timeline' && (
                  <p className="flex items-center space-x-1.5 text-amber-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>15-min Time Blocking with Google Sync</span>
                  </p>
                )}
                {activeTab === 'kanban' && (
                  <p className="flex items-center space-x-1.5 text-sky-400">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Next Actions & In Progress Workflows</span>
                  </p>
                )}
                {activeTab === 'eisenhower' && (
                  <p className="flex items-center space-x-1.5 text-emerald-400">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Urgent vs Important 2x2 Prioritization</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-between">
            <span className="text-xs font-mono text-white/50">3 View Modes</span>
            <Link
              to="/app"
              className="inline-flex items-center space-x-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors"
            >
              <span>Open Action Hub</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </motion.div>

        {/* CARD 4: Large Span-2 Card -> 365-DAY RADAR & RUNWAY */}
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="md:col-span-2 rounded-[2rem] sm:rounded-[2.5rem] bg-white/[0.04] hover:bg-white/[0.06] backdrop-blur-xl border border-white/10 hover:border-white/20 p-6 sm:p-10 flex flex-col justify-between transition-all duration-300 shadow-[0_16px_40px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.45)] group relative overflow-hidden"
        >
          {/* Ambient Glow */}
          <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-purple-500/15 blur-[80px] pointer-events-none group-hover:bg-purple-500/25 transition-colors duration-500" />

          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-purple-500/15 border border-purple-400/30 flex items-center justify-center text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    Equilibrium & Runway
                  </h3>
                  <span className="text-xs font-mono text-purple-400">
                    Growth Hub & Capital Engine
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 text-xs font-mono text-white/70">
                  MAD & USD Support
                </span>
              </div>
            </div>

            <p className="text-sm sm:text-base text-white/70 font-sans leading-relaxed max-w-xl">
              <strong className="text-white font-semibold">Total life visibility without spreadsheet fatigue.</strong>{' '}
              Track daily non-negotiable habit streaks, 30-second energy audits, and subscription runway with automated 7-day renewal alerts and real-time currency conversion.
            </p>

            {/* Mini Heatmap Strip & Financial Pill Showcase */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-[#0C1220]/70 border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-mono text-white/60">
                  <span>365-Day Output Heatmap</span>
                  <span className="text-emerald-400">Consistent</span>
                </div>
                <div className="grid grid-cols-12 gap-1.5 pt-1">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-4 rounded-[4px] ${
                        i % 5 === 0
                          ? 'bg-emerald-400'
                          : i % 3 === 0
                          ? 'bg-emerald-600'
                          : i % 2 === 0
                          ? 'bg-emerald-800'
                          : 'bg-white/10'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[10px] font-mono text-white/40 block">
                  GitHub-style output matrix across tasks, habits & deep work
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#0C1220]/70 border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-mono text-white/60">
                  <span>Subscription Radar</span>
                  <span className="text-amber-400">in 3 days</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                  <span className="text-xs font-semibold text-white">Vercel Pro</span>
                  <span className="text-xs font-mono text-emerald-400">$20.00 (200 MAD)</span>
                </div>
                <span className="text-[10px] font-mono text-white/40 block">
                  Proactive billing alerts prevent unwanted recurring charges
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
            <span className="text-xs font-mono text-white/50">
              Works Anywhere • Your Data, Your Control
            </span>
            <Link
              to="/app"
              className="inline-flex items-center space-x-2 text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors"
            >
              <span>Explore All Features</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
