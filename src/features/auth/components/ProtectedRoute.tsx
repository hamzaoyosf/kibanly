import React, { useEffect } from 'react'
import { Navigate, useLocation, useNavigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/app/store/authStore'

interface ProtectedRouteProps {
  children?: React.ReactNode
}

/**
 * Gatekeeper component protecting the dashboard layout and all nested routes.
 * 
 * 1. While auth state is initializing (isAuthLoading === true):
 *    Returns a sleek full-screen security blocker. Never renders the layout or Outlet.
 * 2. If unauthenticated (!user):
 *    IMMEDIATELY redirects to /login via <Navigate to="/login" replace /> and unmounts the layout.
 * 3. Dynamic Ejection:
 *    If Firebase auth state changes to null while sitting on /app, immediately kicks out to /login.
 * 4. Only if an authenticated Firebase session is present:
 *    Renders the protected layout / Outlet.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const user = useAuthStore((s) => s.user)
  const isAuthLoading = useAuthStore((s) => s.isAuthLoading)
  const location = useLocation()
  const navigate = useNavigate()

  // Dynamic Ejection Sync: If session becomes null while mounted on protected route, redirect to /login
  useEffect(() => {
    if (!isAuthLoading && !user) {
      navigate('/login', { replace: true, state: { from: location } })
    }
  }, [isAuthLoading, user, navigate, location])

  // 1. Loading blocker
  if (isAuthLoading) {
    return (
      <div
        data-testid="auth-loading-screen"
        className="min-h-screen bg-[#090D16] flex flex-col items-center justify-center space-y-4"
      >
        <div className="w-9 h-9 rounded-full border-2 border-emerald-500/20 border-t-emerald-400 animate-spin" />
        <div className="flex items-center space-x-2 text-xs font-mono uppercase tracking-widest text-text-muted">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Verifying Security Clearance...</span>
        </div>
      </div>
    )
  }

  // 2. Strict Gatekeeper: If unauthenticated, NEVER render children/layout
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // 3. Authenticated: Render protected layout or nested Outlet
  return children ? <>{children}</> : <Outlet />
}

// Backwards-compatible alias
export const AuthGuard = ProtectedRoute
