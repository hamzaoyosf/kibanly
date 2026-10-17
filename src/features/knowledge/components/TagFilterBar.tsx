import React, { useState, useRef, useEffect } from 'react'
import {
  Search,
  X,
  Plus,
  LayoutGrid,
  List,
  Hash,
  ChevronDown,
  Check,
  Trash2,
} from 'lucide-react'
import { NoteType, Tag } from '@/data/ports/schemas'
import { useDeleteTag } from '../useTags'
import { cn } from '@/lib/utils'

interface TagFilterBarProps {
  searchQuery: string
  onSearchChange: (q: string) => void
  selectedType: 'all' | NoteType
  onSelectType: (t: 'all' | NoteType) => void
  selectedTag: string
  onSelectTag: (tag: string) => void
  tags: Tag[]
  tagCounts: Record<string, number>
  totalNotesCount: number
  viewMode: 'grid' | 'list'
  onToggleViewMode: (mode: 'grid' | 'list') => void
  onNewNote: () => void
}

export const TagFilterBar: React.FC<TagFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedType,
  onSelectType,
  selectedTag,
  onSelectTag,
  tags,
  tagCounts,
  totalNotesCount,
  viewMode,
  onToggleViewMode,
  onNewNote,
}) => {
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false)
  const [tagSearchQuery, setTagSearchQuery] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const deleteTagMutation = useDeleteTag()

  const handleDeleteTag = (tag: Tag) => {
    if (selectedTag === tag.name) {
      onSelectTag('all')
    }
    deleteTagMutation.mutate(tag.id)
  }

  // Close dropdown on outside click or escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsTagDropdownOpen(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsTagDropdownOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const filteredTags = tags.filter((t) =>
    t.name.toLowerCase().includes(tagSearchQuery.toLowerCase().trim())
  )

  return (
    <div className="space-y-3">
      {/* Top Search & Actions Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Instant Search Bar */}
        <div className="relative flex-1 max-w-lg">
          <Search className="w-4 h-4 text-text-faint absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search notes, thesis, tags, or [[links]]..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-9 py-2 rounded-xl bg-[#16161A] border border-[rgba(255,255,255,0.12)] text-xs text-text placeholder:text-text-faint focus:outline-none focus:border-knowledge/80 focus:ring-1 focus:ring-knowledge/40 transition-all font-sans"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-2.5 text-text-faint hover:text-text transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Right CTA & View Switcher */}
        <div className="flex items-center space-x-2.5 self-end sm:self-auto">
          {/* Grid / List View Switcher */}
          <div className="p-1 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.06)] flex items-center space-x-1">
            <button
              type="button"
              onClick={() => onToggleViewMode('grid')}
              className={cn(
                'p-1.5 rounded-lg transition-all',
                viewMode === 'grid'
                  ? 'bg-knowledge text-black'
                  : 'text-text-muted hover:text-text hover:bg-surface'
              )}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onToggleViewMode('list')}
              className={cn(
                'p-1.5 rounded-lg transition-all',
                viewMode === 'list'
                  ? 'bg-knowledge text-black'
                  : 'text-text-muted hover:text-text hover:bg-surface'
              )}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* New Note Button */}
          <button
            type="button"
            onClick={onNewNote}
            className={cn(
              'flex items-center space-x-1.5 px-3.5 py-2 rounded-xl font-semibold text-xs',
              'bg-knowledge text-black hover:brightness-110 active:scale-95 transition-all shadow-[0_0_12px_rgba(167,139,250,0.25)]'
            )}
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Note</span>
          </button>
        </div>
      </div>

      {/* Filter Row: Primary Tags & Custom Tags Dropdown */}
      <div className="flex flex-wrap items-center gap-2.5 pt-1">
        {/* Primary Type Pills */}
        <div className="flex items-center space-x-1.5 p-1 rounded-xl bg-surface-2/70 border border-[rgba(255,255,255,0.06)] text-xs font-mono shrink-0">
          {[
            { id: 'all', label: 'All' },
            { id: 'permanent', label: 'Permanent' },
            { id: 'literature', label: 'Literature' },
            { id: 'fleeting', label: 'Fleeting' },
          ].map((item) => {
            const isSelected = selectedType === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectType(item.id as 'all' | NoteType)}
                className={cn(
                  'px-3 py-1 rounded-lg transition-all text-xs font-sans font-medium',
                  isSelected
                    ? 'bg-knowledge/20 text-knowledge border border-knowledge/40 shadow-[0_0_8px_rgba(167,139,250,0.15)] font-semibold'
                    : 'text-text-muted hover:text-text hover:bg-surface'
                )}
              >
                {item.label}
              </button>
            )
          })}
        </div>

        {/* Custom Tags Dropdown Menu */}
        <div className="relative shrink-0" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsTagDropdownOpen(!isTagDropdownOpen)}
            className={cn(
              'flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-mono transition-all border',
              selectedTag !== 'all'
                ? 'bg-knowledge/20 text-knowledge border-knowledge/40 shadow-[0_0_8px_rgba(167,139,250,0.18)] font-semibold'
                : 'bg-surface-2/80 text-text-muted hover:text-text hover:bg-surface border-[rgba(255,255,255,0.06)]'
            )}
            title="Filter by custom tags"
          >
            <Hash className={cn('w-3.5 h-3.5', selectedTag !== 'all' ? 'text-knowledge' : 'text-text-faint')} />
            <span>
              {selectedTag !== 'all' ? `#${selectedTag}` : 'Filter by Tag'}
            </span>
            {selectedTag !== 'all' ? (
              <span
                onClick={(e) => {
                  e.stopPropagation()
                  onSelectTag('all')
                }}
                className="hover:text-danger ml-0.5 p-0.5 rounded-full hover:bg-white/10"
                title="Clear tag filter"
              >
                <X className="w-3 h-3" />
              </span>
            ) : (
              <ChevronDown
                className={cn(
                  'w-3.5 h-3.5 text-text-faint transition-transform duration-200',
                  isTagDropdownOpen && 'rotate-180 text-knowledge'
                )}
              />
            )}
          </button>

          {/* Clean Dropdown Popover */}
          {isTagDropdownOpen && (
            <div className="absolute left-0 mt-2 z-50 w-60 rounded-xl bg-surface border border-[rgba(255,255,255,0.12)] shadow-2xl p-2 space-y-1.5 animate-in fade-in zoom-in-95 font-mono text-xs">
              {/* Optional Search if more than 4 tags */}
              {tags.length > 4 && (
                <div className="relative pb-1 border-b border-[rgba(255,255,255,0.06)]">
                  <Search className="w-3 h-3 text-text-faint absolute left-2 top-2" />
                  <input
                    type="text"
                    autoFocus
                    placeholder="Search tags..."
                    value={tagSearchQuery}
                    onChange={(e) => setTagSearchQuery(e.target.value)}
                    className="w-full pl-6 pr-2 py-1 rounded-lg bg-[#16161A] border border-[rgba(255,255,255,0.08)] text-[11px] text-text placeholder:text-text-faint focus:outline-none focus:border-knowledge/60"
                  />
                </div>
              )}

              <div className="max-h-48 overflow-y-auto space-y-0.5 pr-0.5 scrollbar-none">
                {/* All Tags Option */}
                <button
                  type="button"
                  onClick={() => {
                    onSelectTag('all')
                    setIsTagDropdownOpen(false)
                  }}
                  className={cn(
                    'w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors',
                    selectedTag === 'all'
                      ? 'bg-knowledge/15 text-knowledge font-semibold'
                      : 'text-text hover:bg-surface-2 hover:text-knowledge'
                  )}
                >
                  <span>#all tags</span>
                  <span className="text-[10px] text-text-faint">({totalNotesCount})</span>
                </button>

                {/* Custom Tags */}
                {filteredTags.length === 0 ? (
                  <p className="px-2 py-2 text-[10px] text-text-faint text-center">
                    No matching tags
                  </p>
                ) : (
                  filteredTags.map((tag) => {
                    const count = tagCounts[tag.name] || 0
                    const isSelected = selectedTag === tag.name
                    return (
                      <div
                        key={tag.id}
                        className={cn(
                          'w-full flex items-center justify-between px-2 py-1 rounded-lg transition-colors group',
                          isSelected
                            ? 'bg-knowledge/15 text-knowledge font-semibold'
                            : 'text-text-muted hover:bg-surface-2 hover:text-text'
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            onSelectTag(tag.name)
                            setIsTagDropdownOpen(false)
                          }}
                          className="flex items-center space-x-1.5 truncate flex-1 text-left min-w-0 py-0.5"
                        >
                          <span className="text-knowledge">#</span>
                          <span className="truncate">{tag.name}</span>
                          <span className="text-[10px] text-text-faint ml-1">({count})</span>
                        </button>

                        <div className="flex items-center space-x-1 shrink-0 ml-1">
                          {isSelected && <Check className="w-3 h-3 text-knowledge" />}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteTag(tag)
                            }}
                            className="p-1 rounded text-text-faint hover:text-danger hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"
                            title={`Delete #${tag.name} permanently`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
