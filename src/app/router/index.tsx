import { lazy } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { BentoShell } from '../layout/BentoShell'
import { ErrorPage } from '../layout/ErrorPage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute'

// Public Pages (Lazy Loaded)
const LandingPage = lazy(() =>
  import('@/features/landing/LandingPage').then((m) => ({ default: m.LandingPage }))
)
const LoginPage = lazy(() =>
  import('@/features/auth/pages/LoginPage').then((m) => ({ default: m.LoginPage }))
)

// Protected Hub Pages (Lazy Loaded)
const InboxPage = lazy(() =>
  import('@/features/inbox/InboxPage').then((m) => ({ default: m.InboxPage }))
)
const ActionHubPage = lazy(() =>
  import('@/features/action/ActionHubPage').then((m) => ({ default: m.ActionHubPage }))
)
const GrowthHubPage = lazy(() =>
  import('@/features/growth/GrowthHubPage').then((m) => ({ default: m.GrowthHubPage }))
)
const CapitalHubPage = lazy(() =>
  import('@/features/capital/CapitalHubPage').then((m) => ({ default: m.CapitalHubPage }))
)
const KnowledgeHubPage = lazy(() =>
  import('@/features/knowledge/KnowledgeHubPage').then((m) => ({ default: m.KnowledgeHubPage }))
)
const SettingsPage = lazy(() =>
  import('@/features/settings/SettingsPage').then((m) => ({ default: m.SettingsPage }))
)

export const router = createBrowserRouter([
  // Public Landing Page
  {
    path: '/',
    element: <LandingPage />,
    errorElement: <ErrorPage />,
  },
  {
    path: 'index.html',
    element: <Navigate to="/" replace />,
  },

  // Dedicated Login Gateway
  {
    path: '/login',
    element: <LoginPage />,
    errorElement: <ErrorPage />,
  },

  // Protected Operating System Workspace (/app)
  {
    path: '/app',
    element: (
      <ProtectedRoute>
        <BentoShell />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'inbox',
        element: <InboxPage />,
      },
      {
        path: 'action',
        element: <ActionHubPage />,
      },
      {
        path: 'growth',
        element: <GrowthHubPage />,
      },
      {
        path: 'capital',
        element: <CapitalHubPage />,
      },
      {
        path: 'knowledge',
        element: <KnowledgeHubPage />,
      },
      {
        path: 'vault',
        element: <KnowledgeHubPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
      {
        path: '*',
        element: <ErrorPage isNotFound />,
      },
    ],
  },

  // Seamless Legacy Route Aliases
  {
    path: '/dashboard',
    element: <Navigate to="/app" replace />,
  },
  {
    path: '/inbox',
    element: <Navigate to="/app/inbox" replace />,
  },
  {
    path: '/action',
    element: <Navigate to="/app/action" replace />,
  },
  {
    path: '/growth',
    element: <Navigate to="/app/growth" replace />,
  },
  {
    path: '/capital',
    element: <Navigate to="/app/capital" replace />,
  },
  {
    path: '/knowledge',
    element: <Navigate to="/app/knowledge" replace />,
  },
  {
    path: '/vault',
    element: <Navigate to="/app/knowledge" replace />,
  },
  {
    path: '/settings',
    element: <Navigate to="/app/settings" replace />,
  },

  // Global Fallback
  {
    path: '*',
    element: <ErrorPage isNotFound />,
  },
])
