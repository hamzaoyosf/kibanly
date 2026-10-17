import { lazy } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { BentoShell } from '../layout/BentoShell'
import { PlaceholderView } from '@/components/ui/PlaceholderView'

// Route-level code splitting for rapid initial paint & modular chunks
const DashboardPage = lazy(() =>
  import('@/features/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage }))
)
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
        element: <PlaceholderView title="Settings" subtitle="Preferences & Sync coming soon" />,
      },
    ],
  },
])
