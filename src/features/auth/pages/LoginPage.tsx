import React, { useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Shield, ArrowRight, Loader2, LogIn } from 'lucide-react'
import { useAuth } from '../useAuth'

export const LoginPage: React.FC = () => {
  const { user, loading, error, signInWithGoogle, isConfigured } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Extract redirect target if provided in location state
  const from = (location.state as any)?.from?.pathname || '/app'

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (user && !loading) {
      navigate(from, { replace: true })
    }
  }, [user, loading, navigate, from])

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle()
    } catch (err) {
      console.error('Login error:', err)
    }
  }

  return (
    <div className="min-h-screen bg-canvas text-text selection:bg-gray-700 selection:text-white flex flex-col justify-between p-4">
      {/* Top Header */}
      <header className="max-w-md w-full mx-auto py-6 flex items-center justify-between">
        <Link to="/" className="font-mono text-sm font-bold tracking-wider text-text hover:text-emerald-400 transition-colors">
          OBOiFY
        </Link>
        <Link to="/" className="text-xs font-mono text-text-muted hover:text-text">
          ← Back to Overview
        </Link>
      </header>

      {/* Main Login Card */}
      <main className="max-w-md w-full mx-auto my-auto">
        <div className="card p-8 bg-surface border border-border rounded-xl shadow-card">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-surface-2 border border-border text-emerald-400 mx-auto flex items-center justify-center mb-3">
              <LogIn className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-text">Sign In to OBOiFY</h1>
            <p className="text-xs text-text-muted mt-1">
              Synchronize your GTD tasks, habits, and knowledge vault across all devices
            </p>
          </div>

          {/* Error notice if present */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/15 border border-red-500/30 text-xs text-red-400 font-mono">
              {error}
            </div>
          )}

          {/* Firebase unconfigured notice */}
          {!isConfigured && (
            <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 font-mono">
              Notice: Firebase credentials are not yet configured in .env.local. You can continue in offline guest mode.
            </div>
          )}

          {/* Google Auth Button */}
          <div className="space-y-3">
            <button
              type="button"
              disabled={loading}
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center space-x-3 px-4 py-3 rounded-xl bg-white hover:bg-gray-100 text-gray-900 font-semibold text-xs font-mono shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
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
              <span>{loading ? 'Connecting...' : 'Sign in with Google'}</span>
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-mono">
                <span className="bg-surface px-2 text-text-faint">Or continue without account</span>
              </div>
            </div>

            {/* Offline Guest Mode Action */}
            <Link
              to="/app"
              className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-surface-2 hover:bg-gray-700/80 border border-border text-text font-medium text-xs font-mono transition-all"
            >
              <span>Continue as Local Guest</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Privacy & Clean Slate Guarantee */}
          <div className="mt-6 pt-5 border-t border-border space-y-2 text-[11px] text-text-muted">
            <div className="flex items-center space-x-1.5 text-emerald-400 font-semibold font-mono">
              <Shield className="w-3.5 h-3.5" />
              <span>Clean Slate & Local-First Guarantee</span>
            </div>
            <p className="leading-relaxed">
              New accounts initialize into a clean workspace with zero mock pollution. Data is saved
              locally in your browser first and mirrored to Firestore.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-md w-full mx-auto py-6 text-center text-[11px] font-mono text-text-faint">
        OBOiFY • Zero-Telemetry Client-Side Architecture
      </footer>
    </div>
  )
}
