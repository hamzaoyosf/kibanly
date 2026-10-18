import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Compass,
  Zap,
  TrendingUp,
  DollarSign,
  BookOpen,
  Inbox,
  Plus,
  CalendarCheck,
  CheckCircle2,
  FileText,
  Bookmark,
  Sparkles,
  Settings,
} from 'lucide-react'
import { CommandItem } from './types'
import { useTasks } from '@/features/action/useTasks'
import { useNotes } from '@/features/knowledge/useNotes'
import { useResources } from '@/features/knowledge/useResources'
import { useUIStore } from '@/app/store/uiStore'

export function useCommandSearch(query: string): CommandItem[] {
  const navigate = useNavigate()
  const { data: allTasks = [] } = useTasks()
  const { data: allNotes = [] } = useNotes()
  const { data: allResources = [] } = useResources()

  const { openQuickCapture, openWeeklyReview, closeCommandPalette } = useUIStore()

  const trimmed = query.trim().toLowerCase()

  return useMemo(() => {
    const items: CommandItem[] = []

    // 1. Navigation Hubs
    const hubs = [
      {
        id: 'nav_deck',
        title: 'Command Deck (Home)',
        subtitle: 'Central operations dashboard',
        path: '/',
        icon: <Compass className="w-4 h-4 text-action" />,
        badge: 'Hub',
      },
      {
        id: 'nav_action',
        title: 'Action Hub',
        subtitle: 'Kanban, Eisenhower matrix, daily schedule timeline',
        path: '/action',
        icon: <Zap className="w-4 h-4 text-action" />,
        badge: 'Hub',
      },
      {
        id: 'nav_growth',
        title: 'Personal Growth Hub',
        subtitle: 'Habit streaks, energy audits, wellness equilibrium',
        path: '/growth',
        icon: <TrendingUp className="w-4 h-4 text-growth" />,
        badge: 'Hub',
      },
      {
        id: 'nav_capital',
        title: 'Capital Hub',
        subtitle: 'Cashflow, recurring subscriptions, wealth milestones',
        path: '/capital',
        icon: <DollarSign className="w-4 h-4 text-capital" />,
        badge: 'Hub',
      },
      {
        id: 'nav_knowledge',
        title: 'Knowledge Hub',
        subtitle: 'Zettelkasten second brain, bi-directional notes',
        path: '/knowledge',
        icon: <BookOpen className="w-4 h-4 text-knowledge" />,
        badge: 'Hub',
      },
      {
        id: 'nav_inbox',
        title: 'Global Inbox',
        subtitle: 'Frictionless capture stream and AI categorization',
        path: '/inbox',
        icon: <Inbox className="w-4 h-4 text-action" />,
        badge: 'Hub',
      },
      {
        id: 'nav_settings',
        title: 'Settings & Preferences',
        subtitle: 'Data backups, cloud auth, calendar sync, preferences',
        path: '/settings',
        icon: <Settings className="w-4 h-4 text-text" />,
        badge: 'System',
      },
    ]

    for (const hub of hubs) {
      if (
        !trimmed ||
        hub.title.toLowerCase().includes(trimmed) ||
        hub.subtitle.toLowerCase().includes(trimmed)
      ) {
        items.push({
          id: hub.id,
          title: hub.title,
          subtitle: hub.subtitle,
          category: 'navigation',
          icon: hub.icon,
          badge: hub.badge,
          onSelect: () => {
            closeCommandPalette()
            navigate(hub.path)
          },
        })
      }
    }

    // 2. Quick Actions
    const actions = [
      {
        id: 'act_quick_capture',
        title: 'Quick Capture Thought',
        subtitle: 'Instantly capture a thought, task, or fleeting note',
        icon: <Plus className="w-4 h-4 text-action" />,
        shortcut: 'Q',
        onSelect: () => {
          closeCommandPalette()
          openQuickCapture()
        },
      },
      {
        id: 'act_weekly_review',
        title: 'Start GTD Weekly Review',
        subtitle: 'Clear the inbox, inspect GTD lists, and plan the upcoming week',
        icon: <CalendarCheck className="w-4 h-4 text-growth" />,
        shortcut: 'W',
        onSelect: () => {
          closeCommandPalette()
          openWeeklyReview()
        },
      },
      {
        id: 'act_view_inbox',
        title: 'Triage Unprocessed Inbox',
        subtitle: 'Convert captured ideas to actionable GTD tasks',
        icon: <Sparkles className="w-4 h-4 text-action" />,
        onSelect: () => {
          closeCommandPalette()
          navigate('/inbox')
        },
      },
    ]

    for (const act of actions) {
      if (
        !trimmed ||
        act.title.toLowerCase().includes(trimmed) ||
        act.subtitle.toLowerCase().includes(trimmed)
      ) {
        items.push({
          id: act.id,
          title: act.title,
          subtitle: act.subtitle,
          category: 'actions',
          icon: act.icon,
          shortcut: act.shortcut,
          onSelect: act.onSelect,
        })
      }
    }

    // 3. Tasks Search
    const matchingTasks = allTasks.filter((t) => {
      if (!trimmed) return false
      return (
        t.title.toLowerCase().includes(trimmed) ||
        (t.notes && t.notes.toLowerCase().includes(trimmed)) ||
        (t.tags && t.tags.some((tag) => tag.toLowerCase().includes(trimmed)))
      )
    })

    for (const task of matchingTasks.slice(0, 8)) {
      items.push({
        id: `task_${task.id}`,
        title: task.title,
        subtitle: `GTD ${task.gtdList.toUpperCase()} • Priority ${task.priority}`,
        category: 'tasks',
        icon: <CheckCircle2 className="w-4 h-4 text-action" />,
        badge: task.status,
        onSelect: () => {
          closeCommandPalette()
          navigate('/action')
        },
      })
    }

    // 4. Notes Search
    const matchingNotes = allNotes.filter((n) => {
      if (!trimmed) return false
      return (
        n.title.toLowerCase().includes(trimmed) ||
        n.content.toLowerCase().includes(trimmed) ||
        (n.tags && n.tags.some((tag) => tag.toLowerCase().includes(trimmed)))
      )
    })

    for (const note of matchingNotes.slice(0, 8)) {
      items.push({
        id: `note_${note.id}`,
        title: note.title,
        subtitle: note.content.slice(0, 60).replace(/[#*`]/g, '') + '...',
        category: 'notes',
        icon: <FileText className="w-4 h-4 text-knowledge" />,
        badge: note.pinned ? 'Pinned' : undefined,
        onSelect: () => {
          closeCommandPalette()
          navigate('/knowledge')
        },
      })
    }

    // 5. Resources Search
    const matchingResources = allResources.filter((r) => {
      if (!trimmed) return false
      return (
        r.title.toLowerCase().includes(trimmed) ||
        (r.url ? r.url.toLowerCase().includes(trimmed) : false) ||
        (r.tags && r.tags.some((tag) => tag.toLowerCase().includes(trimmed)))
      )
    })

    for (const res of matchingResources.slice(0, 8)) {
      items.push({
        id: `res_${res.id}`,
        title: res.title,
        subtitle: res.url || undefined,
        category: 'resources',
        icon: <Bookmark className="w-4 h-4 text-knowledge" />,
        badge: res.status,
        onSelect: () => {
          closeCommandPalette()
          if (res.url) {
            window.open(res.url, '_blank')
          } else {
            navigate('/knowledge')
          }
        },
      })
    }

    return items
  }, [
    trimmed,
    allTasks,
    allNotes,
    allResources,
    navigate,
    closeCommandPalette,
    openQuickCapture,
    openWeeklyReview,
  ])
}
