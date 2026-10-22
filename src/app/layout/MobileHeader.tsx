import React from 'react'
import { Link } from 'react-router-dom'
import { Settings } from 'lucide-react'
import { AuthPill } from '@/features/auth/components/AuthPill'
import { NotificationBell } from '@/features/notifications/NotificationBell'

export const MobileHeader: React.FC = () => {
  return (
    <header className="md:hidden sticky top-0 z-30 bg-surface border-b border-border h-14 px-4 flex items-center justify-between">
      {/* OBOiFY Logo */}
      <Link to="/app" className="flex items-center" aria-label="OBOiFY Dashboard">
        <span className="font-mono text-sm font-bold tracking-wider text-text">
          OBOiFY
        </span>
      </Link>

      {/* Right Action Bar: Notifications, Settings, User Avatar */}
      <div className="flex items-center space-x-1 sm:space-x-1.5">
        <NotificationBell placement="header" align="right" />

        <Link
          to="/app/settings"
          className="p-2 rounded-lg text-text-muted hover:text-text hover:bg-surface-2 transition-colors"
          aria-label="Settings"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </Link>

        <AuthPill placement="header" />
      </div>
    </header>
  )
}
