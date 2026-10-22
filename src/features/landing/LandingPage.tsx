import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Shield,
  Zap,
  Lock,
  Sparkles,
  Command,
  HeartHandshake
} from 'lucide-react'
import { AuroraBackground } from './AuroraBackground'
import { FloatingNavbar } from './FloatingNavbar'
import { InteractiveCore } from './InteractiveCore'
import { BentoGridSection } from './BentoGridSection'
import { AuthModal } from '@/features/auth/components/AuthModal'
import { useAuth } from '@/features/auth/useAuth'

export const LandingPage: React.FC = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleLaunchClick = () => {
    if (user) {
      navigate('/app')
    } else {
      setIsAuthModalOpen(true)
    }
  }

  return (
    <div className="min-h-screen bg-[#090D16] text-white selection:bg-emerald-500/30 selection:text-white flex flex-col relative overflow-x-hidden font-sans">
      {/* 1. Subtle Animated Aurora Gradients Background */}
      <AuroraBackground />

      {/* 2. Floating Glassmorphic Pill Navbar */}
      <FloatingNavbar onOpenAuthModal={() => setIsAuthModalOpen(true)} />

      {/* Main Content */}
      <main className="flex-1 relative z-10 pt-20 sm:pt-24 md:pt-24">
        {/* HERO SECTION (Split-Screen Desktop-First Above-The-Fold) */}
        <section id="core" className="max-w-7xl mx-auto px-6 pt-6 sm:pt-10 md:pt-14 pb-16 md:pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            {/* Left Column: Typography, Copy, and CTAs */}
            <motion.div
              initial={{ opacity: 0, x: -25 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="text-left flex flex-col items-start"
            >
              {/* Minimal Section Tag */}
              <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-white/[0.05] border border-white/10 backdrop-blur-md text-xs font-mono text-emerald-400 mb-6 shadow-sm">
                <Sparkles className="w-3.5 h-3.5" />
                <span>The Personal Operating System</span>
              </div>

              {/* Punchy Headline */}
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.06] text-transparent bg-clip-text bg-gradient-to-b from-white via-white/95 to-white/60">
                Your Mind, <br />
                <span className="text-emerald-400">Systematized.</span>
              </h1>

              {/* Subheadline Copy */}
              <p className="mt-6 text-base sm:text-lg text-white/65 leading-relaxed font-sans max-w-xl">
                An all-in-one cognitive command deck unifying <span className="text-white font-medium">GTD thought capture</span>, automated <span className="text-emerald-400 font-medium">Recall Loop</span> spaced learning, and deep-work <span className="text-amber-400 font-medium">Focus routines</span>. Zero clutter. Pure velocity.
              </p>

              {/* Action Buttons (Pill-shaped) */}
              <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center gap-3.5 text-xs font-mono w-full sm:w-auto">
                <button
                  type="button"
                  data-testid="hero-launch-btn"
                  onClick={handleLaunchClick}
                  className="w-full sm:w-auto px-8 py-4 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold flex items-center justify-center space-x-2.5 shadow-[0_0_25px_rgba(16,185,129,0.35)] hover:shadow-[0_0_35px_rgba(16,185,129,0.5)] active:scale-95 transition-all duration-200 cursor-pointer"
                >
                  <span>Launch Command Deck</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  data-testid="hero-signin-btn"
                  onClick={() => setIsAuthModalOpen(true)}
                  className="w-full sm:w-auto px-7 py-4 rounded-full bg-white/[0.05] hover:bg-white/[0.09] border border-white/10 hover:border-white/20 backdrop-blur-md text-white font-medium flex items-center justify-center space-x-2 transition-all duration-200 active:scale-95 cursor-pointer"
                >
                  <span>Sign in with Google</span>
                </button>
              </div>

              {/* Trust & Specification Badges */}
              <div className="mt-10 flex flex-wrap items-center gap-4 sm:gap-6 text-[11px] font-mono text-white/50">
                <span className="flex items-center space-x-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Works Anywhere</span>
                </span>
                <span className="text-white/20">•</span>
                <span className="flex items-center space-x-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Total Privacy</span>
                </span>
                <span className="text-white/20">•</span>
                <span className="flex items-center space-x-1.5">
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Sub-50ms Speed</span>
                </span>
              </div>
            </motion.div>

            {/* Right Column: Interactive 3D Orbit System */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center justify-center relative w-full"
            >
              <InteractiveCore />
            </motion.div>
          </div>
        </section>

        {/* BENTO GRID SECTION (Scroll Triggered) */}
        <BentoGridSection />

        {/* PHILOSOPHY SPOTLIGHT CARD */}
        <section className="py-12 sm:py-16 px-4 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-[2.5rem] bg-white/[0.03] backdrop-blur-xl border border-white/10 p-8 sm:p-12 text-center relative overflow-hidden shadow-2xl"
          >
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6 text-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.3)]">
              <Command className="w-6 h-6" />
            </div>

            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight max-w-xl mx-auto">
              "Quiet software for high-output minds."
            </h3>

            <p className="mt-4 text-xs sm:text-sm text-white/60 leading-relaxed font-sans max-w-lg mx-auto">
              Most productivity apps distract you with vanity animations and constant context switching. OBOiFY removes the noise so you can stay in flow state for hours.
            </p>

            <div className="mt-8 flex items-center justify-center space-x-3">
              <span className="px-3.5 py-1.5 rounded-full bg-white/[0.06] border border-white/10 text-xs font-mono text-emerald-400">
                100% Free & Open Ecosystem
              </span>
            </div>
          </motion.div>
        </section>

        {/* BOTTOM CALL TO ACTION */}
        <section className="py-20 sm:py-28 px-4 text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-[2.5rem] sm:rounded-[3rem] bg-gradient-to-b from-white/[0.06] to-white/[0.02] backdrop-blur-2xl border border-white/10 p-10 sm:p-16 relative overflow-hidden shadow-[0_20px_70px_rgba(0,0,0,0.5)]"
          >
            {/* Ambient Center Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-emerald-500/15 blur-[90px] pointer-events-none" />

            <div className="relative z-10 max-w-xl mx-auto">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono text-emerald-400 mb-6">
                <HeartHandshake className="w-3.5 h-3.5" />
                <span>Zero Onboarding Friction</span>
              </div>

              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
                Ready to Take Command?
              </h2>

              <p className="mt-4 text-xs sm:text-sm text-white/60 leading-relaxed font-sans">
                Sign in with Google to synchronize your tasks, focus logs, and knowledge vault across all devices with real-time cloud backups.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 text-xs font-mono">
                <button
                  type="button"
                  data-testid="cta-launch-btn"
                  onClick={handleLaunchClick}
                  className="w-full sm:w-auto px-8 py-4 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold flex items-center justify-center space-x-2 shadow-[0_0_25px_rgba(16,185,129,0.35)] active:scale-95 transition-all cursor-pointer"
                >
                  <span>Enter OBOiFY</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  data-testid="cta-signin-btn"
                  onClick={() => setIsAuthModalOpen(true)}
                  className="w-full sm:w-auto px-7 py-4 rounded-full bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-white font-medium flex items-center justify-center space-x-2 transition-all active:scale-95 cursor-pointer"
                >
                  <span>Sign In with Google</span>
                </button>
              </div>
            </div>
          </motion.div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-white/[0.06] py-10 px-4 text-center text-xs font-mono text-white/40">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-white/80">OBOiFY</span>
            <span>•</span>
            <span>The Solo Builder Personal OS</span>
          </div>

          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={handleLaunchClick}
              className="hover:text-white transition-colors cursor-pointer"
            >
              App
            </button>
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Login
            </button>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition-colors"
            >
              GitHub
            </a>
          </div>

          <span>Works Anywhere • Total Privacy</span>
        </div>
      </footer>

      {/* Modern Soft-UI Hybrid Auth Modal Overlay */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  )
}
