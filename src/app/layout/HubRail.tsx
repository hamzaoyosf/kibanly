import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Inbox,
  Zap,
  TrendingUp,
  Coins,
  BookOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react'
import { useUIStore } from '@/app/store/uiStore'
import { cn } from '@/lib/utils'

interface NavItem {
  name: string
  to: string
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  color?: string
  accentVar?: string
}

const mainNavItems: NavItem[] = [
  { name: 'Home', to: '/', icon: LayoutDashboard },
  { name: 'Inbox', to: '/inbox', icon: Inbox },
  { name: 'Action', to: '/action', icon: Zap, color: 'var(--action)' },
  { name: 'Growth', to: '/growth', icon: TrendingUp, color: 'var(--growth)' },
  { name: 'Capital', to: '/capital', icon: Coins, color: 'var(--capital)' },
  { name: 'Knowledge', to: '/knowledge', icon: BookOpen, color: 'var(--knowledge)' },
]

export const HubRail: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false)
  const { openQuickCapture } = useUIStore()

  return (
    <>
      {/* Desktop Left Rail (>= md) */}
      <aside
        className={cn(
          'hidden md:flex flex-col justify-between shrink-0 h-screen sticky top-0 z-30',
          'bg-bg-elevated border-r border-[rgba(255,255,255,0.06)] transition-all duration-200 ease-out',
          isExpanded ? 'w-[240px]' : 'w-[72px]'
        )}
        aria-label="Sidebar Navigation"
      >
        {/* Top Header / App Brand */}
        <div className="flex flex-col">
          <div
            className={cn(
              'h-16 flex items-center border-b border-[rgba(255,255,255,0.06)] px-4',
              isExpanded ? 'justify-between' : 'justify-center'
            )}
          >
            {isExpanded ? (
              <span className="font-mono text-sm font-semibold tracking-wider text-text">
                OYOSF
              </span>
            ) : (
              <span className="font-mono text-xs font-bold text-text">O</span>
            )}

            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-surface-2 transition-colors"
              aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
              title={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              {isExpanded ? (
                <ChevronLeft className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Quick Capture Button (Desktop) */}
          <div className="p-2 border-b border-[rgba(255,255,255,0.06)]">
            <button
              type="button"
              onClick={openQuickCapture}
              className={cn(
                'w-full flex items-center rounded-xl bg-action text-black font-semibold transition-all hover:brightness-110 active:scale-95 shadow-sm',
                isExpanded
                  ? 'h-10 px-3 justify-between text-xs'
                  : 'h-10 justify-center'
              )}
              title="Quick Capture (Q)"
            >
              <div className="flex items-center space-x-2">
                <Plus className="w-4 h-4 stroke-[2.5]" />
                {isExpanded && <span>Quick Capture</span>}
              </div>
              {isExpanded && (
                <kbd className="px-1.5 py-0.5 rounded bg-black/20 text-black font-mono text-[10px]">
                  Q
                </kbd>
              )}
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="p-2 space-y-1" aria-label="Main Navigation">
            {mainNavItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    cn(
                      'group flex items-center h-11 px-3 rounded-xl transition-all duration-150',
                      isActive
                        ? 'bg-surface-2 text-text font-medium'
                        : 'text-text-muted hover:text-text hover:bg-surface'
                    )
                  }
                  title={!isExpanded ? item.name : undefined}
                >
                  <span
                    className="flex items-center justify-center shrink-0 w-6 h-6"
                    style={{ color: item.color }}
                  >
                    <Icon className="w-5 h-5 transition-transform group-hover:scale-105" />
                  </span>

                  {isExpanded && (
                    <span className="ml-3 text-sm truncate">{item.name}</span>
                  )}
                </NavLink>
              )
            })}
          </nav>
        </div>

        {/* Footer / Settings */}
        <div className="p-2 border-t border-[rgba(255,255,255,0.06)]">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              cn(
                'group flex items-center h-11 px-3 rounded-xl transition-all duration-150',
                isActive
                  ? 'bg-surface-2 text-text font-medium'
                  : 'text-text-muted hover:text-text hover:bg-surface'
              )
            }
            title={!isExpanded ? 'Settings' : undefined}
          >
            <span className="flex items-center justify-center shrink-0 w-6 h-6 text-text-muted group-hover:text-text">
              <Settings className="w-5 h-5 transition-transform group-hover:rotate-45" />
            </span>
            {isExpanded && <span className="ml-3 text-sm truncate">Settings</span>}
          </NavLink>
        </div>
      </aside>

      {/* Mobile Bottom Tab Bar (< md) */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface/95 backdrop-blur-lg border-t border-[rgba(255,255,255,0.06)] z-40 px-2 flex items-center justify-around"
        aria-label="Mobile Navigation"
      >
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center justify-center p-1 transition-colors',
              isActive ? 'text-white' : 'text-text-muted hover:text-text'
            )
          }
          aria-label="Home"
          title="Home"
        >
          <LayoutDashboard className="w-4 h-4" />
          <span className="text-[9px] font-mono mt-0.5">Home</span>
        </NavLink>

        <NavLink
          to="/action"
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center justify-center p-1 transition-colors',
              isActive ? 'text-action' : 'text-text-muted hover:text-text'
            )
          }
          aria-label="Action"
          title="Action"
        >
          <Zap className="w-4 h-4" />
          <span className="text-[9px] font-mono mt-0.5">Action</span>
        </NavLink>

        <NavLink
          to="/growth"
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center justify-center p-1 transition-colors',
              isActive ? 'text-growth' : 'text-text-muted hover:text-text'
            )
          }
          aria-label="Growth"
          title="Growth"
        >
          <TrendingUp className="w-4 h-4" />
          <span className="text-[9px] font-mono mt-0.5">Growth</span>
        </NavLink>

        {/* Central Quick Capture FAB */}
        <div className="-mt-5 flex items-center justify-center">
          <button
            type="button"
            onClick={openQuickCapture}
            className="w-11 h-11 rounded-full bg-action text-black flex items-center justify-center shadow-lg hover:brightness-110 active:scale-95 transition-all"
            aria-label="Quick Capture"
            title="Quick Capture (Q)"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        <NavLink
          to="/capital"
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center justify-center p-1 transition-colors',
              isActive ? 'text-capital' : 'text-text-muted hover:text-text'
            )
          }
          aria-label="Capital"
          title="Capital"
        >
          <Coins className="w-4 h-4" />
          <span className="text-[9px] font-mono mt-0.5">Capital</span>
        </NavLink>

        <NavLink
          to="/knowledge"
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center justify-center p-1 transition-colors',
              isActive ? 'text-knowledge' : 'text-text-muted hover:text-text'
            )
          }
          aria-label="Knowledge"
          title="Knowledge"
        >
          <BookOpen className="w-4 h-4" />
          <span className="text-[9px] font-mono mt-0.5">Vault</span>
        </NavLink>

        <NavLink
          to="/inbox"
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center justify-center p-1 transition-colors',
              isActive ? 'text-white' : 'text-text-muted hover:text-text'
            )
          }
          aria-label="Inbox"
          title="Inbox"
        >
          <Inbox className="w-4 h-4" />
          <span className="text-[9px] font-mono mt-0.5">Inbox</span>
        </NavLink>
      </nav>
    </>
  )
}
