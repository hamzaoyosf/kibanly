import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../useAuth'
import { Cloud, CloudOff, LogIn, LogOut, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AuthPillProps {
  placement?: 'sidebar' | 'header'
}

export const AuthPill: React.FC<AuthPillProps> = ({ placement = 'header' }) => {
  const { user, loading, error, isConfigured, signInWithGoogle, signOut } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    if (!isMenuOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMenuOpen])

  if (!isConfigured) {
    return (
      <div
        className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-surface-2/60 border border-[rgba(255,255,255,0.06)] text-[11px] font-mono text-text-faint"
        title="Running in Local-first offline mode. Set Firebase credentials in .env.local to enable Cloud Sync."
      >
        <CloudOff className="w-3.5 h-3.5 text-text-muted" />
        <span className="hidden md:inline">Local Mode</span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.06)] text-xs text-text-muted font-mono animate-pulse">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-action" />
        <span className="hidden md:inline text-[11px]">Syncing...</span>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="relative" ref={containerRef}>
        <button
          type="button"
          onClick={signInWithGoogle}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-action/10 hover:bg-action/20 text-action border border-action/30 hover:border-action/50 transition-all text-xs font-semibold font-mono shadow-sm group"
          title="Sign in with Google to enable real-time Cloud Sync across your devices"
        >
          <LogIn className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
          <span className="hidden md:inline">Sign In</span>
        </button>
        {error && (
          <div
            className={cn(
              'absolute z-50 p-2 rounded-lg bg-danger/20 border border-danger/40 text-[10px] text-danger font-mono whitespace-nowrap shadow-lg',
              placement === 'sidebar'
                ? 'bottom-full left-0 mb-1.5 md:bottom-0 md:left-full md:mb-0 md:ml-2'
                : 'top-full right-0 mt-1.5'
            )}
          >
            {error}
          </div>
        )}
      </div>
    )
  }

  const initials = (user.displayName || user.email || 'U')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="flex items-center space-x-2 p-1 md:px-2.5 md:py-1.5 rounded-xl bg-surface-2 hover:bg-surface-3 border border-[rgba(255,255,255,0.08)] hover:border-growth/40 transition-all text-left text-xs"
        title={`Signed in as ${user.displayName || user.email}`}
      >
        {/* Avatar */}
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || 'User'}
            className="w-6 h-6 rounded-full border border-growth/40 object-cover"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-growth/20 border border-growth/40 flex items-center justify-center text-[10px] font-bold text-growth font-mono">
            {initials}
          </div>
        )}

        {/* User Info (Desktop) */}
        <div className="hidden md:block max-w-[100px] truncate">
          <p className="text-[11px] font-medium text-text truncate leading-tight">
            {user.displayName?.split(' ')[0] || 'User'}
          </p>
          <div className="flex items-center space-x-1 text-[9px] font-mono text-growth">
            <span className="w-1.5 h-1.5 rounded-full bg-growth animate-pulse" />
            <span>Synced</span>
          </div>
        </div>
      </button>

      {/* Dropdown Menu — Positioned cleanly according to container placement */}
      {isMenuOpen && (
        <div
          className={cn(
            'absolute z-50 w-60 p-3 rounded-2xl bg-surface/95 border border-[rgba(255,255,255,0.12)] shadow-[0_10px_40px_rgba(0,0,0,0.85)] backdrop-blur-2xl animate-fade-in space-y-2.5',
            placement === 'sidebar'
              ? 'bottom-full left-0 mb-2 md:bottom-0 md:left-full md:mb-0 md:ml-3.5'
              : 'top-full right-0 mt-2'
          )}
        >
          <div className="px-1 pb-2 border-b border-[rgba(255,255,255,0.06)]">
            <p className="text-xs font-semibold text-text truncate">
              {user.displayName || 'KiBANLY Operator'}
            </p>
            <p className="text-[10px] font-mono text-text-faint truncate">
              {user.email}
            </p>
            <div className="mt-1.5 flex items-center space-x-1.5 text-[10px] font-mono text-growth">
              <Cloud className="w-3.5 h-3.5 text-growth" />
              <span>Cloud Firestore Active</span>
            </div>
          </div>

          <button
            type="button"
            onClick={signOut}
            className="w-full flex items-center space-x-2 px-2.5 py-2 rounded-xl text-danger hover:bg-danger/10 border border-transparent hover:border-danger/20 transition-colors text-xs font-mono font-medium"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  )
}
