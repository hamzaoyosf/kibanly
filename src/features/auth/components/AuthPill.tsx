import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../useAuth'
import { Cloud, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AuthPillProps {
  placement?: 'sidebar' | 'header'
}

/**
 * User Profile & Session Pill.
 * Under ProtectedRoute, an authenticated user is guaranteed to be present.
 * Renders the active user identity and a dropdown menu to Sign Out.
 */
export const AuthPill: React.FC<AuthPillProps> = ({ placement = 'header' }) => {
  const { user, signOut } = useAuth()
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

  // Under ProtectedRoute, user is guaranteed to be present.
  const displayName = user?.displayName || 'Operator'
  const email = user?.email || 'operator@oboify.local'
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        data-testid="user-profile-btn"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="flex items-center space-x-2 p-1 md:px-2.5 md:py-1.5 rounded-xl bg-surface-2 hover:bg-surface-3 border border-[rgba(255,255,255,0.08)] hover:border-growth/40 transition-all text-left text-xs cursor-pointer"
        title={`Signed in as ${displayName}`}
      >
        {/* Avatar */}
        {user?.photoURL ? (
          <img
            src={user.photoURL}
            alt={displayName}
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
            {displayName.split(' ')[0]}
          </p>
          <div className="flex items-center space-x-1 text-[9px] font-mono text-growth">
            <span className="w-1.5 h-1.5 rounded-full bg-growth animate-pulse" />
            <span>Active</span>
          </div>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isMenuOpen && (
        <div
          className={cn(
            'absolute z-50 w-60 p-3 rounded-xl bg-surface border border-border shadow-xl animate-in fade-in duration-150 space-y-2.5',
            placement === 'sidebar'
              ? 'bottom-full left-0 mb-2 md:bottom-0 md:left-full md:mb-0 md:ml-3.5'
              : 'top-full right-0 mt-2'
          )}
        >
          <div className="px-1 pb-2 border-b border-border">
            <p className="text-xs font-semibold text-text truncate">
              {displayName}
            </p>
            <p className="text-[10px] font-mono text-text-faint truncate">
              {email}
            </p>
            <div className="mt-1.5 flex items-center space-x-1.5 text-[10px] font-mono text-emerald-400">
              <Cloud className="w-3.5 h-3.5" />
              <span>Seamless Cloud Sync Active</span>
            </div>
          </div>

          <button
            type="button"
            data-testid="sign-out-btn"
            onClick={signOut}
            className="w-full flex items-center space-x-2 px-2.5 py-2 rounded-xl text-danger hover:bg-danger/10 border border-transparent hover:border-danger/20 transition-colors text-xs font-mono font-medium cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  )
}
