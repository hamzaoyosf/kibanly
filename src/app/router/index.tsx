import { lazy } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { BentoShell } from '../layout/BentoShell'
import { ErrorPage } from '../layout/ErrorPage'
import { PlaceholderView } from '@/components/ui/PlaceholderView'
import { DashboardPage } from '@/features/dashboard/DashboardPage'

// Secondary Hub pages remain code-split for on-demand modular loading
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

export const router = createBrowserRouter([
  {
    path: '/',
    element: <BentoShell />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'index.html',
        element: <Navigate to="/" replace />,
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
        element: <PlaceholderView title="Settings" subtitle="Preferences & Sync coming soon" />,
      },
      {
        path: '*',
        element: <ErrorPage isNotFound />,
      },
    ],
  },
  {
    path: '*',
    element: <ErrorPage isNotFound />,
  },
])
