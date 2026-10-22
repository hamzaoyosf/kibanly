import React, { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, X, Shield, Loader2 } from 'lucide-react'
import { useAuth } from '../useAuth'

export interface AuthModalProps {
  isOpen?: boolean
  onClose?: () => void
  isStandalone?: boolean
}

/**
 * Modern Soft-UI Hybrid Auth Modal & Dedicated Login Card.
 * Adheres strictly to the glassmorphism, rounded-3xl aesthetic with pill-shaped Google button.
 * Preserves deep-linking redirect (location.state?.from).
 */
export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen = true,
  onClose,
  isStandalone = false,
}) => {
  const { user, loading, error, isConfigured, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Deep-linking target extraction
  const fromState = (location.state as any)?.from
  const targetPath =
    typeof fromState === 'string' && fromState !== '/login'
      ? fromState
      : fromState?.pathname && fromState.pathname !== '/login'
      ? `${fromState.pathname}${fromState.search || ''}${fromState.hash || ''}`
      : '/app'

  // If already authenticated, redirect to destination
  useEffect(() => {
    if (user && !loading) {
      if (onClose) onClose()
      navigate(targetPath, { replace: true })
    }
  }, [user, loading, navigate, targetPath, onClose])

  // ESC key to dismiss modal
  useEffect(() => {
    if (isStandalone || !isOpen || !onClose) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, isStandalone])

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle()
      if (onClose) onClose()
      navigate(targetPath, { replace: true })
    } catch (err) {
      console.error('Google Sign-In failed:', err)
    }
  }

  const modalContent = (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 15 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      onClick={(e) => e.stopPropagation()}
      className="relative w-full max-w-md p-8 sm:p-10 rounded-3xl bg-white/[0.05] backdrop-blur-2xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.6)] text-white text-center"
    >
      {/* Modal Dismiss Button */}
      {!isStandalone && onClose && (
        <button
          type="button"
          data-testid="close-auth-modal-btn"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Brand Icon */}
      <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-500/80 to-cyan-400/80 p-[1px] shadow-[0_0_25px_rgba(16,185,129,0.35)] mx-auto mb-5 flex items-center justify-center">
        <div className="w-full h-full rounded-full bg-[#090D16] flex items-center justify-center">
          <Zap className="w-6 h-6 text-emerald-400" />
        </div>
      </div>

      {/* Typography */}
      <h2 className="text-2xl font-bold tracking-tight text-white font-sans">
        Sign In to OBOiFY
      </h2>
      <p className="text-xs text-white/60 mt-2 max-w-xs mx-auto leading-relaxed font-sans">
        Synchronize your GTD tasks, focus logs, and knowledge vault across all devices.
      </p>

      {/* Error Notice */}
      {error && (
        <div className="mt-5 p-3 rounded-2xl bg-red-500/15 border border-red-500/30 text-xs text-red-300 font-mono text-left">
          {error}
        </div>
      )}

      {/* Cloud Sync Notice */}
      {!isConfigured && (
        <div className="mt-5 p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-xs text-amber-200 font-mono text-left">
          Notice: Cloud backup is unavailable until cloud sync credentials are configured.
        </div>
      )}

      {/* Pill-shaped Google Button (Soft UI) */}
      <div className="mt-8 space-y-4">
        <button
          type="button"
          data-testid="google-signin-btn"
          disabled={loading}
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center space-x-3 px-6 py-4 rounded-full bg-white hover:bg-gray-100 text-gray-900 font-semibold text-xs font-mono shadow-[0_0_30px_rgba(255,255,255,0.25)] hover:shadow-[0_0_40px_rgba(255,255,255,0.4)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-gray-900" />
          ) : (
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>{loading ? 'Authenticating...' : 'Sign in with Google'}</span>
        </button>
      </div>

      {/* Security Guarantee */}
      <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-center space-x-2 text-[11px] text-white/50 font-mono">
        <Shield className="w-3.5 h-3.5 text-emerald-400" />
        <span>Seamless Cloud Sync & Total Privacy</span>
      </div>
    </motion.div>
  )

  if (isStandalone) {
    return modalContent
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
        >
          {modalContent}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
