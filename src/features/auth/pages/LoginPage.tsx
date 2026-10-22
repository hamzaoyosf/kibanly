import React from 'react'
import { Link } from 'react-router-dom'
import { AuroraBackground } from '@/features/landing/AuroraBackground'
import { AuthModal } from '../components/AuthModal'

export const LoginPage: React.FC = () => {
  return (
    <div className="relative min-h-screen bg-[#090D16] text-white flex flex-col justify-between p-4 overflow-hidden selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Background Aurora Glow */}
      <AuroraBackground />

      {/* Top Header */}
      <header className="relative z-10 max-w-md w-full mx-auto py-6 flex items-center justify-between">
        <Link
          to="/"
          className="font-mono text-sm font-bold tracking-wider text-white hover:text-emerald-400 transition-colors"
        >
          OBOiFY
        </Link>
        <Link
          to="/"
          className="text-xs font-mono text-white/50 hover:text-white transition-colors"
        >
          ← Back to Home
        </Link>
      </header>

      {/* Main Centered AuthModal */}
      <main className="relative z-10 max-w-md w-full mx-auto my-auto flex items-center justify-center">
        <AuthModal isStandalone />
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-md w-full mx-auto py-6 text-center text-[11px] font-mono text-white/40">
        OBOiFY • Always Accessible • Total Privacy
      </footer>
    </div>
  )
}
