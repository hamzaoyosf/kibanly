import React, { useState, useMemo, useEffect } from 'react'
import {
  X,
  Pin,
  Eye,
  Edit3,
  Link2,
  BookOpen,
  Hash,
  ArrowRight,
} from 'lucide-react'
import { Note, NoteType, Resource, Tag } from '@/data/ports/schemas'
import {
  findBacklinks,
  extractWikiLinks,
  extractWikiLinkNoteIds,
  getNoteTypeMeta,
} from '@/lib/zettelkasten'
import { cn } from '@/lib/utils'

interface NoteEditorModalProps {
  note: Note | null // null = new note
  allNotes: Note[]
  resources: Resource[]
  tags: Tag[]
  onClose: () => void
  onSave: (payload: {
    title: string
    content: string
    type: NoteType
    tags: string[]
    linkedNoteIds: string[]
    resourceId: string | null
    pinned: boolean
  }) => void
  onJumpToNote?: (targetNote: Note) => void
}

export const NoteEditorModal: React.FC<NoteEditorModalProps> = ({
  note,
  allNotes,
  resources,
  tags: allTags,
  onClose,
  onSave,
  onJumpToNote,
}) => {
  const [title, setTitle] = useState(note?.title || '')
  const [content, setContent] = useState(note?.content || '')
  const [type, setType] = useState<NoteType>(note?.type || 'fleeting')
  const [selectedTags, setSelectedTags] = useState<string[]>(note?.tags || [])
  const [resourceId, setResourceId] = useState<string | null>(
    note?.resourceId || null
  )
  const [pinned, setPinned] = useState(note?.pinned || false)
  // Default to 'preview' for existing notes, 'write' for new notes
  const [viewMode, setViewMode] = useState<'write' | 'preview'>(
    note ? 'preview' : 'write'
  )
  const [newTagInput, setNewTagInput] = useState('')
  const [linkSearchQuery, setLinkSearchQuery] = useState('')
  const [isLinkPickerOpen, setIsLinkPickerOpen] = useState(false)

  // Synchronize modal state whenever the active note prop changes
  useEffect(() => {
    if (note) {
      setTitle(note.title)
      setContent(note.content)
      setType(note.type)
      setSelectedTags(note.tags || [])
      setResourceId(note.resourceId || null)
      setPinned(note.pinned || false)
      setViewMode('preview')
      setNewTagInput('')
    } else {
      setTitle('')
      setContent('')
      setType('fleeting')
      setSelectedTags([])
      setResourceId(null)
      setPinned(false)
      setViewMode('write')
      setNewTagInput('')
    }
  }, [note])

  // Swaps the active note context immediately inside the editor and informs parent
  const handleJumpToNote = (targetNote: Note) => {
    setTitle(targetNote.title)
    setContent(targetNote.content)
    setType(targetNote.type)
    setSelectedTags(targetNote.tags || [])
    setResourceId(targetNote.resourceId || null)
    setPinned(targetNote.pinned || false)
    setViewMode('preview')
    setNewTagInput('')
    if (onJumpToNote) {
      onJumpToNote(targetNote)
    }
  }

  // Compute backlinks (all notes referencing this note)
  const backlinks = useMemo(() => {
    if (!note) return []
    return findBacklinks(note.id, allNotes)
  }, [note, allNotes])

  // Compute forward links extracted from content (by Title or ID) and explicit array
  const forwardLinks = useMemo(() => {
    const rawTargets = extractWikiLinks(content)
    const resolvedIds = new Set<string>()

    rawTargets.forEach((target) => {
      const lower = target.toLowerCase()
      const match = allNotes.find(
        (n) => n.id === target || n.title.toLowerCase() === lower
      )
      if (match) resolvedIds.add(match.id)
    })

    ;(note?.linkedNoteIds || []).forEach((id) => resolvedIds.add(id))

    return allNotes.filter((n) => resolvedIds.has(n.id) && n.id !== note?.id)
  }, [content, note, allNotes])

  // Keyboard shortcut: Cmd/Ctrl + S to save, Esc to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      } else if (e.key === 'Escape' && !isLinkPickerOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  })

  const handleAddTag = (tagToAdd: string) => {
    const clean = tagToAdd.toLowerCase().replace(/[^a-z0-9_-]/g, '').trim()
    if (clean && !selectedTags.includes(clean)) {
      setSelectedTags([...selectedTags, clean])
    }
    setNewTagInput('')
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tagToRemove))
  }

  const handleInsertWikiLink = (targetNote: Note) => {
    const linkStr = `[[${targetNote.title}]]`
    setContent((prev) => prev + (prev.endsWith('\n') || !prev ? '' : ' ') + linkStr)
    setIsLinkPickerOpen(false)
  }

  const handleSave = () => {
    if (!title.trim()) return

    // Ensure pending tag from input is committed
    const finalTags = [...selectedTags]
    if (newTagInput.trim()) {
      const clean = newTagInput.toLowerCase().replace(/[^a-z0-9_-]/g, '').trim()
      if (clean && !finalTags.includes(clean)) {
        finalTags.push(clean)
      }
    }

    // Auto-sync forward links from content using Titles and IDs resolved to note IDs
    const extractedIds = extractWikiLinkNoteIds(content, allNotes)
    const combinedLinkedIds = Array.from(
      new Set([...extractedIds, ...(note?.linkedNoteIds || [])])
    ).filter((id) => id !== note?.id)

    onSave({
      title: title.trim(),
      content,
      type,
      tags: finalTags,
      linkedNoteIds: combinedLinkedIds,
      resourceId: resourceId || null,
      pinned,
    })
  }

  // Simple Markdown renderer with wiki-link pill resolution
  const renderMarkdown = (text: string) => {
    if (!text.trim()) {
      return (
        <p className="text-text-faint italic font-mono text-xs">
          No content written yet.
        </p>
      )
    }

    const lines = text.split('\n')
    return (
      <div className="space-y-2 text-xs leading-relaxed text-text">
        {lines.map((line, idx) => {
          // Headers
          if (line.startsWith('# ')) {
            return (
              <h1 key={idx} className="text-base font-bold text-text pt-2 border-b border-[rgba(255,255,255,0.06)] pb-1">
                {line.replace('# ', '')}
              </h1>
            )
          }
          if (line.startsWith('## ')) {
            return (
              <h2 key={idx} className="text-sm font-semibold text-knowledge pt-1.5">
                {line.replace('## ', '')}
              </h2>
            )
          }
          if (line.startsWith('### ')) {
            return (
              <h3 key={idx} className="text-xs font-semibold text-text pt-1">
                {line.replace('### ', '')}
              </h3>
            )
          }

          // Blockquotes
          if (line.startsWith('> ')) {
            return (
              <blockquote
                key={idx}
                className="pl-3 py-1 border-l-2 border-knowledge text-text-muted italic bg-surface-2/40 rounded-r"
              >
                {line.replace('> ', '')}
              </blockquote>
            )
          }

          // Lists & Checklists
          if (line.startsWith('- [ ] ')) {
            return (
              <div key={idx} className="flex items-center space-x-2">
                <span className="w-3.5 h-3.5 rounded border border-[rgba(255,255,255,0.2)] bg-surface-2" />
                <span>{line.replace('- [ ] ', '')}</span>
              </div>
            )
          }
          if (line.startsWith('- [x] ') || line.startsWith('- [X] ')) {
            return (
              <div key={idx} className="flex items-center space-x-2 text-text-muted line-through">
                <span className="w-3.5 h-3.5 rounded bg-growth/20 border border-growth/40 flex items-center justify-center text-[9px] text-growth font-bold">
                  ✓
                </span>
                <span>{line.replace(/- \[[xX]\] /, '')}</span>
              </div>
            )
          }
          if (line.startsWith('- ') || line.startsWith('* ')) {
            return (
              <li key={idx} className="ml-4 list-disc text-text-muted">
                {line.slice(2)}
              </li>
            )
          }

          // Regular paragraph with [[WikiLink]] highlight
          const parts = line.split(/(\[\[.*?\]\])/g)
          return (
            <p key={idx} className="min-h-[1.2rem]">
              {parts.map((part, pIdx) => {
                if (part.startsWith('[[') && part.endsWith(']]')) {
                  const inner = part.slice(2, -2).trim()
                  const [rawTarget, alias] = inner.split('|').map((s) => s.trim())
                  const lower = rawTarget.toLowerCase()
                  const matched = allNotes.find(
                    (n) => n.id === rawTarget || n.title.toLowerCase() === lower
                  )
                  const displayLabel = alias || (matched ? matched.title : rawTarget)

                  return (
                    <button
                      key={pIdx}
                      type="button"
                      onClick={() => matched && handleJumpToNote(matched)}
                      className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[11px] font-mono font-medium bg-knowledge/15 text-knowledge border border-knowledge/30 hover:bg-knowledge/25 transition-all mx-0.5"
                      title={matched ? `Jump to: ${matched.title}` : `Unlinked note: ${rawTarget}`}
                    >
                      <Link2 className="w-2.5 h-2.5" />
                      <span>{displayLabel}</span>
                    </button>
                  )
                }
                return <span key={pIdx}>{part}</span>
              })}
            </p>
          )
        })}
      </div>
    )
  }

  const typeMeta = getNoteTypeMeta(type)

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-lg animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="w-full max-w-4xl h-[90vh] card bg-surface border border-[rgba(255,255,255,0.12)] shadow-2xl flex flex-col overflow-hidden"
        data-hub="knowledge"
      >
        {/* Header Bar */}
        <div className="p-4 border-b border-[rgba(255,255,255,0.06)] flex flex-wrap items-center justify-between gap-3 bg-surface-2/40">
          <div className="flex items-center space-x-3 flex-1 min-w-[200px]">
            {/* Note Type Selector */}
            <div className="p-0.5 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.06)] flex text-xs">
              {(['fleeting', 'literature', 'permanent'] as NoteType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg capitalize font-mono text-[11px] font-medium transition-all',
                    type === t
                      ? 'bg-knowledge/20 text-knowledge border border-knowledge/40 font-semibold'
                      : 'text-text-muted hover:text-text'
                  )}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Pin Toggle */}
            <button
              type="button"
              onClick={() => setPinned(!pinned)}
              className={cn(
                'p-1.5 rounded-xl border transition-colors',
                pinned
                  ? 'bg-knowledge/15 text-knowledge border-knowledge/30'
                  : 'bg-surface-2 text-text-faint border-[rgba(255,255,255,0.06)] hover:text-text'
              )}
              title={pinned ? 'Unpin note' : 'Pin note to top'}
            >
              <Pin className={cn('w-4 h-4', pinned && 'fill-current')} />
            </button>
          </div>

          {/* Right Controls: View Toggle, Save & Close */}
          <div className="flex items-center space-x-2">
            {/* View Mode Toggle */}
            <div className="p-0.5 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.06)] flex text-xs font-mono">
              <button
                type="button"
                onClick={() => setViewMode('write')}
                className={cn(
                  'flex items-center space-x-1 px-2.5 py-1 rounded-lg transition-all',
                  viewMode === 'write'
                    ? 'bg-knowledge text-black font-semibold'
                    : 'text-text-muted hover:text-text'
                )}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Write</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('preview')}
                className={cn(
                  'flex items-center space-x-1 px-2.5 py-1 rounded-lg transition-all',
                  viewMode === 'preview'
                    ? 'bg-knowledge text-black font-semibold'
                    : 'text-text-muted hover:text-text'
                )}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 rounded-chip bg-knowledge text-black font-semibold text-xs hover:brightness-110 active:scale-95 transition-all shadow-[0_0_12px_rgba(167,139,250,0.3)]"
            >
              Save Note
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-surface-2 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Title Input */}
        <div className="px-5 pt-4 pb-2">
          <input
            type="text"
            required
            autoFocus={!note}
            placeholder="Note title / thesis statement..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-lg sm:text-xl font-bold bg-transparent text-text placeholder:text-text-faint focus:outline-none tracking-tight"
          />
        </div>

        {/* Metadata Strip: Tags & Associated Resource */}
        <div className="px-5 py-2 border-b border-[rgba(255,255,255,0.06)] flex flex-wrap items-center justify-between gap-3 text-xs bg-surface/30">
          {/* Tags */}
          <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
            <Hash className="w-3.5 h-3.5 text-text-faint" />
            {selectedTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-surface-2 border border-[rgba(255,255,255,0.08)] text-knowledge"
              >
                <span>#{tag}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-danger ml-0.5"
                >
                  ×
                </button>
              </span>
            ))}
            <input
              type="text"
              placeholder="+ add tag..."
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddTag(newTagInput)
                }
              }}
              onBlur={() => {
                if (newTagInput.trim()) {
                  handleAddTag(newTagInput)
                }
              }}
              className="bg-transparent border-none text-[11px] font-mono text-text focus:outline-none placeholder:text-text-faint w-20"
            />
            {allTags
              .filter((t) => !selectedTags.includes(t.name))
              .slice(0, 3)
              .map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleAddTag(t.name)}
                  className="px-1.5 py-0.2 rounded text-[10px] font-mono text-text-faint hover:text-knowledge bg-surface-2/60 transition-colors"
                  title="Quick-add tag"
                >
                  +{t.name}
                </button>
              ))}
          </div>

          {/* Associated Resource Dropdown (for Literature notes) */}
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-mono text-text-faint flex items-center space-x-1">
              <BookOpen className="w-3 h-3" />
              <span>Source Ref:</span>
            </span>
            <select
              value={resourceId || ''}
              onChange={(e) => setResourceId(e.target.value || null)}
              className="px-2 py-1 rounded-lg bg-surface-2 border border-[rgba(255,255,255,0.06)] text-[11px] font-mono text-text focus:outline-none focus:border-knowledge/60"
            >
              <option value="">None (Standalone)</option>
              {resources.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title}
                </option>
              ))}
            </select>

            {/* Insert Note Link Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsLinkPickerOpen(!isLinkPickerOpen)}
                className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-surface-2 hover:bg-surface text-[11px] font-mono text-knowledge border border-knowledge/30 transition-colors"
                title="Insert [[Link]] to another note"
              >
                <Link2 className="w-3 h-3" />
                <span>Link Note</span>
              </button>

              {/* Link Picker Popover */}
              {isLinkPickerOpen && (
                <div className="absolute right-0 top-8 z-30 w-64 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.12)] shadow-2xl p-2 space-y-2 animate-in fade-in zoom-in-95">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Search note to link..."
                    value={linkSearchQuery}
                    onChange={(e) => setLinkSearchQuery(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#16161A] border border-[rgba(255,255,255,0.12)] text-xs text-text placeholder:text-text-faint focus:outline-none focus:border-knowledge/60 font-sans"
                  />
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {allNotes
                      .filter(
                        (n) =>
                          n.id !== note?.id &&
                          n.title
                            .toLowerCase()
                            .includes(linkSearchQuery.toLowerCase())
                      )
                      .slice(0, 6)
                      .map((target) => (
                        <button
                          key={target.id}
                          type="button"
                          onClick={() => handleInsertWikiLink(target)}
                          className="w-full text-left px-2 py-1.5 rounded-lg text-xs hover:bg-knowledge/15 hover:text-knowledge transition-colors truncate font-sans"
                        >
                          <span className="font-medium text-text">{target.title}</span>
                          <span className="block text-[10px] font-mono text-text-faint">
                            {target.type}
                          </span>
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Workspace (Editor + Backlinks Drawer) */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0">
          {/* Editor / Preview Area (9 cols) */}
          <div className="md:col-span-9 p-5 overflow-y-auto min-h-0 flex flex-col">
            {viewMode === 'write' ? (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your note in Markdown. Use [[note_id]] to link other concepts..."
                className="w-full flex-1 bg-transparent font-mono text-xs sm:text-sm text-text placeholder:text-text-faint focus:outline-none resize-none leading-relaxed"
              />
            ) : (
              <div className="w-full flex-1 bg-surface-2/20 p-4 rounded-xl border border-[rgba(255,255,255,0.04)] overflow-y-auto">
                {renderMarkdown(content)}
              </div>
            )}
          </div>

          {/* Zettelkasten Inspector Drawer (3 cols) */}
          <div className="md:col-span-3 border-t md:border-t-0 md:border-l border-[rgba(255,255,255,0.06)] bg-surface-2/30 p-4 overflow-y-auto space-y-4 text-xs font-mono">
            {/* Outgoing References */}
            <div>
              <p className="font-semibold text-text flex items-center space-x-1.5 text-[11px] pb-1.5 border-b border-[rgba(255,255,255,0.04)]">
                <ArrowRight className="w-3.5 h-3.5 text-knowledge" />
                <span>Outgoing Links ({forwardLinks.length})</span>
              </p>
              <div className="mt-2 space-y-1.5">
                {forwardLinks.length === 0 ? (
                  <p className="text-[10px] text-text-faint">No links cited yet.</p>
                ) : (
                  forwardLinks.map((target) => (
                    <div
                      key={target.id}
                      onClick={() => handleJumpToNote(target)}
                      className="p-2 rounded-lg bg-surface border border-[rgba(255,255,255,0.06)] hover:border-knowledge/40 cursor-pointer transition-all group"
                    >
                      <p className="text-xs font-sans text-text group-hover:text-knowledge truncate">
                        {target.title}
                      </p>
                      <span className="text-[9px] text-text-faint capitalize">
                        {target.type} note
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Incoming Backlinks */}
            <div>
              <p className="font-semibold text-text flex items-center space-x-1.5 text-[11px] pb-1.5 border-b border-[rgba(255,255,255,0.04)]">
                <Link2 className="w-3.5 h-3.5 text-growth" />
                <span>Referenced By ({backlinks.length})</span>
              </p>
              <div className="mt-2 space-y-1.5">
                {backlinks.length === 0 ? (
                  <p className="text-[10px] text-text-faint">No incoming backlinks.</p>
                ) : (
                  backlinks.map((origin) => (
                    <div
                      key={origin.id}
                      onClick={() => handleJumpToNote(origin)}
                      className="p-2 rounded-lg bg-surface border border-[rgba(255,255,255,0.06)] hover:border-growth/40 cursor-pointer transition-all group"
                    >
                      <p className="text-xs font-sans text-text group-hover:text-growth truncate">
                        {origin.title}
                      </p>
                      <span className="text-[9px] text-text-faint capitalize">
                        {origin.type} note
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Note Metadata Helper */}
            <div className="pt-2 border-t border-[rgba(255,255,255,0.04)] text-[10px] text-text-faint space-y-1">
              <p>Type: <span className="text-text capitalize">{type}</span></p>
              <p className="leading-tight text-[9px] text-text-faint">
                {typeMeta.description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
