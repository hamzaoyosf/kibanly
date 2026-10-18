import React from 'react'

export type CommandCategory = 'navigation' | 'actions' | 'tasks' | 'notes' | 'resources'

export interface CommandItem {
  id: string
  title: string
  subtitle?: string
  category: CommandCategory
  icon: React.ReactNode
  onSelect: () => void
  badge?: string
  shortcut?: string
}
