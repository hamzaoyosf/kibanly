import React, { useState, useMemo } from 'react'
import {
  Brain,
  Link2,
  Pin,
  Layers,
} from 'lucide-react'
import { Note, NoteType } from '@/data/ports/schemas'
import {
  useNotes,
  useCreateNote,
  useUpdateNote,
  useDeleteNote,
} from './useNotes'
import { useResources } from './useResources'
import { useTags, useCreateTag } from './useTags'
import { filterNotes } from '@/lib/zettelkasten'
import { NoteCard } from './components/NoteCard'
import { NoteEditorModal } from './components/NoteEditorModal'
import { QuickCaptureCard } from './components/QuickCaptureCard'
import { ResourceShelf } from './components/ResourceShelf'
import { TagFilterBar } from './components/TagFilterBar'
import { cn } from '@/lib/utils'

export const KnowledgeHubPage: React.FC = () => {
  const { data: notes = [], isLoading: isNotesLoading } = useNotes()
  const { data: resources = [] } = useResources()
  const { data: tags = [] } = useTags()

  const createNoteMutation = useCreateNote()
  const updateNoteMutation = useUpdateNote()
  const deleteNoteMutation = useDeleteNote()
  const createTagMutation = useCreateTag()

  // State
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<'all' | NoteType>('all')
  const [selectedTag, setSelectedTag] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [isNewNoteModalOpen, setIsNewNoteModalOpen] = useState(false)

  // Filter notes
  const filteredNotes = useMemo(() => {
    return filterNotes(notes, searchQuery, selectedType, selectedTag)
  }, [notes, searchQuery, selectedType, selectedTag])

  // Split pinned vs normal notes
  const pinnedNotes = useMemo(() => {
    return filteredNotes.filter((n) => n.pinned)
  }, [filteredNotes])

  const regularNotes = useMemo(() => {
    return filteredNotes.filter((n) => !n.pinned)
  }, [filteredNotes])

  // Count tags across all notes
  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    notes.forEach((n) => {
      n.tags?.forEach((t) => {
        counts[t] = (counts[t] || 0) + 1
      })
    })
    return counts
  }, [notes])

  // Total bi-directional links count
  const totalLinksCount = useMemo(() => {
    return notes.reduce((sum, n) => sum + (n.linkedNoteIds?.length || 0), 0)
  }, [notes])

  // Counts by type
  const permanentCount = useMemo(
    () => notes.filter((n) => n.type === 'permanent').length,
    [notes]
  )
  const literatureCount = useMemo(
    () => notes.filter((n) => n.type === 'literature').length,
    [notes]
  )
  const fleetingCount = useMemo(
    () => notes.filter((n) => n.type === 'fleeting').length,
    [notes]
  )

  const handleTogglePin = (id: string, currentPinned: boolean) => {
    updateNoteMutation.mutate({ id, patch: { pinned: !currentPinned } })
  }

  const handleDeleteNote = (id: string) => {
    deleteNoteMutation.mutate(id)
  }

  const handleSaveNote = (payload: {
    title: string
    content: string
    type: NoteType
    tags: string[]
    linkedNoteIds: string[]
    resourceId: string | null
    pinned: boolean
  }) => {
    // Intercept new tags during note saving and call useCreateTag so they appear globally
    const existingTagNames = new Set(tags.map((t) => t.name.toLowerCase()))
    payload.tags.forEach((tagName) => {
      const clean = tagName.toLowerCase().replace(/[^a-z0-9_-]/g, '').trim()
      if (clean && !existingTagNames.has(clean)) {
        createTagMutation.mutate(clean)
        existingTagNames.add(clean)
      }
    })

    if (editingNote) {
      updateNoteMutation.mutate({ id: editingNote.id, patch: payload })
      setEditingNote(null)
    } else {
      createNoteMutation.mutate({
        ...payload,
        archived: false,
      })
      setIsNewNoteModalOpen(false)
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2" data-hub="knowledge">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[rgba(255,255,255,0.06)]">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="p-2 rounded-xl bg-knowledge/10 text-knowledge shadow-[0_0_12px_rgba(167,139,250,0.2)]">
              <Brain className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-text">
              Knowledge Hub
            </h1>
          </div>
          <p className="mt-1 text-sm text-text-muted">
            Zettelkasten knowledge engine & cognitive synthesis. Link mental models, curate deep sources, and compound ideas over time.
          </p>
        </div>

        {/* 3 Overview Micro-Stats */}
        <div className="flex items-center flex-wrap sm:flex-nowrap gap-2 sm:gap-3 text-xs font-mono shrink-0">
          {/* Notes Stat */}
          <div className="px-3 py-1.5 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.06)] flex items-center space-x-2 whitespace-nowrap shrink-0">
            <span className="text-text-faint text-[11px]">Notes:</span>
            <span className="font-bold text-knowledge">{notes.length}</span>
            <span className="text-[10px] text-text-faint whitespace-nowrap">
              ({permanentCount} perm · {literatureCount} lit · {fleetingCount} fleet)
            </span>
          </div>

          {/* Connected Links Stat */}
          <div className="px-3 py-1.5 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.06)] flex items-center space-x-2 whitespace-nowrap shrink-0">
            <span className="text-text-faint text-[11px]">Cross-Links:</span>
            <span className="font-bold text-growth flex items-center space-x-1">
              <Link2 className="w-3 h-3" />
              <span>{totalLinksCount}</span>
            </span>
          </div>

          {/* Sources Stat */}
          <div className="hidden sm:flex px-3 py-1.5 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.06)] items-center space-x-2 whitespace-nowrap shrink-0">
            <span className="text-text-faint text-[11px]">Sources:</span>
            <span className="font-bold text-sky-400">{resources.length}</span>
          </div>
        </div>
      </div>

      {/* Filter, Search & View Controls */}
      <TagFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedType={selectedType}
        onSelectType={setSelectedType}
        selectedTag={selectedTag}
        onSelectTag={setSelectedTag}
        tags={tags}
        tagCounts={tagCounts}
        totalNotesCount={notes.length}
        viewMode={viewMode}
        onToggleViewMode={setViewMode}
        onNewNote={() => setIsNewNoteModalOpen(true)}
      />

      {/* Main 12-Column Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (8 cols): Notes Grid & Lists */}
        <div className="lg:col-span-8 space-y-5">
          {/* Pinned Shelf */}
          {pinnedNotes.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center space-x-2 text-xs font-mono text-knowledge font-semibold">
                <Pin className="w-3.5 h-3.5 fill-current" />
                <span>PINNED CONCEPTS ({pinnedNotes.length})</span>
              </div>
              <div
                className={cn(
                  'gap-3.5',
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 md:grid-cols-2'
                    : 'space-y-2.5'
                )}
              >
                {pinnedNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onEdit={setEditingNote}
                    onDelete={handleDeleteNote}
                    onTogglePin={handleTogglePin}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Regular Notes Section */}
          <div className="space-y-2.5">
            {pinnedNotes.length > 0 && regularNotes.length > 0 && (
              <div className="flex items-center space-x-2 text-xs font-mono text-text-faint font-semibold pt-2 border-t border-[rgba(255,255,255,0.04)]">
                <Layers className="w-3.5 h-3.5" />
                <span>ALL NOTES ({regularNotes.length})</span>
              </div>
            )}

            {isNotesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-36 rounded-2xl bg-surface-2/40 animate-pulse" />
                ))}
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="card p-12 text-center text-xs text-text-faint border border-dashed border-[rgba(255,255,255,0.08)] rounded-tile space-y-2">
                <p className="font-semibold text-text">No notes found matching your criteria.</p>
                <p>Click &quot;New Note&quot; or use Quick Capture to log your first insight.</p>
              </div>
            ) : (
              <div
                className={cn(
                  'gap-3.5',
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 md:grid-cols-2'
                    : 'space-y-2.5'
                )}
              >
                {regularNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onEdit={setEditingNote}
                    onDelete={handleDeleteNote}
                    onTogglePin={handleTogglePin}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (4 cols): Quick Capture & Resource Shelf */}
        <div className="lg:col-span-4 space-y-5">
          <QuickCaptureCard />
          <ResourceShelf />
        </div>
      </div>

      {/* Note Editor Modal (Create / Edit) */}
      {(isNewNoteModalOpen || editingNote) && (
        <NoteEditorModal
          key={editingNote?.id || (isNewNoteModalOpen ? 'new-note' : 'closed')}
          note={editingNote}
          allNotes={notes}
          resources={resources}
          tags={tags}
          onClose={() => {
            setIsNewNoteModalOpen(false)
            setEditingNote(null)
          }}
          onSave={handleSaveNote}
          onJumpToNote={(target) => {
            setEditingNote(target)
          }}
        />
      )}
    </div>
  )
}
