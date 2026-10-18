import React, { useState, useEffect, useRef } from 'react'
import { Search, X, CornerDownLeft } from 'lucide-react'
import { useUIStore } from '@/app/store/uiStore'
import { useCommandSearch } from './useCommandSearch'
import { CommandCategory } from './types'
import { cn } from '@/lib/utils'

const CATEGORY_TITLES: Record<CommandCategory, string> = {
  navigation: 'Navigation & Hubs',
  actions: 'Quick Commands',
  tasks: 'Tasks (Action Hub)',
  notes: 'Notes (Knowledge Hub)',
  resources: 'Resources & Links',
}

export const CommandPalette: React.FC = () => {
  const { isCommandPaletteOpen, closeCommandPalette } = useUIStore()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const items = useCommandSearch(query)

  // Focus input and reset query on open
  useEffect(() => {
    if (isCommandPaletteOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
    }
  }, [isCommandPaletteOpen])

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  // Keyboard navigation inside Command Palette
  useEffect(() => {
    if (!isCommandPaletteOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        closeCommandPalette()
        return
      }

      if (items.length === 0) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % items.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + items.length) % items.length)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const selected = items[selectedIndex]
        if (selected) {
          selected.onSelect()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isCommandPaletteOpen, items, selectedIndex, closeCommandPalette])

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector('[data-active="true"]') as HTMLElement | null
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [selectedIndex])

  if (!isCommandPaletteOpen) return null

  // Group items by category for rendering
  const categoriesPresent = Array.from(new Set(items.map((i) => i.category))) as CommandCategory[]

  let globalIndexCounter = 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/70 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeCommandPalette()
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={cn(
          'w-full max-w-2xl card p-0 border border-border',
          'bg-surface shadow-2xl overflow-hidden flex flex-col max-h-[80vh]'
        )}
      >
        {/* Search Header */}
        <div className="flex items-center px-4 py-3.5 border-b border-border bg-surface-2/40">
          <Search className="w-5 h-5 text-emerald-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search commands, tasks, notes, resources, or jump to hub..."
            className="w-full bg-transparent text-sm sm:text-base text-text placeholder:text-text-muted focus:outline-none"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 rounded text-text-muted hover:text-text"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <span className="text-[10px] font-mono text-text-faint px-1.5 py-0.5 rounded bg-surface border border-[rgba(255,255,255,0.06)]">
              ESC
            </span>
          )}
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto p-2 divide-y divide-[rgba(255,255,255,0.03)] space-y-3"
        >
          {items.length === 0 ? (
            <div className="p-8 text-center text-text-muted text-sm space-y-1">
              <p>No results found for &ldquo;{query}&rdquo;</p>
              <p className="text-xs text-text-faint">
                Try searching for tasks, notes, resources, or hub names.
              </p>
            </div>
          ) : (
            categoriesPresent.map((category) => {
              const categoryItems = items.filter((i) => i.category === category)
              return (
                <div key={category} className="pt-2 first:pt-0">
                  <span className="px-3 py-1 block text-[10px] font-mono uppercase tracking-wider text-text-faint font-semibold">
                    {CATEGORY_TITLES[category]}
                  </span>

                  <div className="mt-1 space-y-1">
                    {categoryItems.map((item) => {
                      const itemIndex = globalIndexCounter++
                      const isSelected = itemIndex === selectedIndex

                      return (
                        <div
                          key={item.id}
                          data-active={isSelected}
                          onClick={() => item.onSelect()}
                          onMouseEnter={() => setSelectedIndex(itemIndex)}
                          className={cn(
                            'flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-100',
                            isSelected
                              ? 'bg-surface-2 text-text border-l-2 border-emerald-500 pl-2.5 shadow-sm'
                              : 'text-text hover:bg-surface-2/60'
                          )}
                        >
                          <div className="flex items-center space-x-3 min-w-0 flex-1">
                            <span
                              className={cn(
                                'p-1.5 rounded-md shrink-0',
                                isSelected ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/60' : 'bg-surface-2 text-text-muted'
                              )}
                            >
                              {item.icon}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium leading-tight truncate">
                                {item.title}
                              </p>
                              {item.subtitle && (
                                <p className="text-xs text-text-muted truncate mt-0.5">
                                  {item.subtitle}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 shrink-0 ml-3">
                            {item.badge && (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-chip bg-surface border border-[rgba(255,255,255,0.06)] text-text-muted capitalize">
                                {item.badge}
                              </span>
                            )}
                            {item.shortcut && (
                              <kbd className="px-1.5 py-0.5 rounded bg-surface-2 text-text font-mono text-[10px] border border-[rgba(255,255,255,0.08)]">
                                {item.shortcut}
                              </kbd>
                            )}
                            {isSelected && (
                              <CornerDownLeft className="w-3.5 h-3.5 text-action opacity-80" />
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-surface-2/60 border-t border-[rgba(255,255,255,0.06)] text-[11px] font-mono text-text-faint">
          <div className="flex items-center space-x-3">
            <span>
              <kbd className="px-1 py-0.5 rounded bg-surface border border-[rgba(255,255,255,0.08)]">
                ↑
              </kbd>{' '}
              <kbd className="px-1 py-0.5 rounded bg-surface border border-[rgba(255,255,255,0.08)]">
                ↓
              </kbd>{' '}
              Navigate
            </span>
            <span>
              <kbd className="px-1 py-0.5 rounded bg-surface border border-[rgba(255,255,255,0.08)]">
                ↵
              </kbd>{' '}
              Select
            </span>
          </div>

          <span>OBOiFY Search</span>
        </div>
      </div>
    </div>
  )
}
