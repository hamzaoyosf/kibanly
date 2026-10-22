import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Zap } from 'lucide-react'
import { useAuth } from '@/features/auth/useAuth'

export interface FloatingNavbarProps {
  onOpenAuthModal?: () => void
}

export const FloatingNavbar: React.FC<FloatingNavbarProps> = ({ onOpenAuthModal }) => {
  const { user } = useAuth()

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 left-0 right-0 z-50 px-4 pt-4 sm:pt-6 pointer-events-none"
    >
      <nav className="pointer-events-auto max-w-3xl mx-auto rounded-full px-4 sm:px-6 py-2.5 sm:py-3 bg-white/[0.05] backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex items-center justify-between transition-all hover:border-white/20 hover:bg-white/[0.07]">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center space-x-2.5 group select-none"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500/80 to-cyan-400/80 p-[1px] shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-transform group-hover:scale-105">
            <div className="w-full h-full rounded-full bg-[#090D16] flex items-center justify-center">
              <Zap className="w-4 h-4 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
            </div>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="font-mono text-sm sm:text-base font-bold tracking-wider text-white">
              OBOiFY
            </span>
          </div>
        </Link>

        {/* Center Navigation Links (Hidden on small screens) */}
        <div className="hidden md:flex items-center space-x-1 text-xs font-mono text-white/70">
          <a
            href="#core"
            className="px-3.5 py-1.5 rounded-full hover:text-white hover:bg-white/5 transition-colors"
          >
            The Core
          </a>
          <a
            href="#bento"
            className="px-3.5 py-1.5 rounded-full hover:text-white hover:bg-white/5 transition-colors"
          >
            Engines
          </a>
          <a
            href="#recall"
            className="px-3.5 py-1.5 rounded-full hover:text-white hover:bg-white/5 transition-colors"
          >
            Recall Loop
          </a>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center space-x-2">
          {user ? (
            <Link
              to="/app"
              className="px-3.5 py-1.5 rounded-full text-xs font-medium text-emerald-400 hover:text-emerald-300 hover:bg-white/10 transition-colors"
            >
              Command Deck
            </Link>
          ) : (
            <button
              type="button"
              data-testid="navbar-signin-btn"
              onClick={onOpenAuthModal}
              className="px-3.5 py-1.5 rounded-full text-xs font-medium text-white/75 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              Sign In
            </button>
          )}

          {user ? (
            <Link
              to="/app"
              className="group relative inline-flex items-center space-x-1.5 px-4 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all active:scale-95"
            >
              <span>Go to App</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          ) : (
            <button
              type="button"
              data-testid="navbar-launch-btn"
              onClick={onOpenAuthModal}
              className="group relative inline-flex items-center space-x-1.5 px-4 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all active:scale-95 cursor-pointer"
            >
              <span>Go to App</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          )}
        </div>
      </nav>
    </motion.header>
  )
}
