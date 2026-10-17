import React from 'react'
import { Pin, Pencil, Trash2, Link2, BookOpen } from 'lucide-react'
import { Note } from '@/data/ports/schemas'
import { getNoteTypeMeta, formatNoteDate } from '@/lib/zettelkasten'
import { cn } from '@/lib/utils'

interface NoteCardProps {
  note: Note
  onEdit: (note: Note) => void
  onDelete: (id: string) => void
  onTogglePin: (id: string, currentPinned: boolean) => void
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  onEdit,
  onDelete,
  onTogglePin,
}) => {
  const typeMeta = getNoteTypeMeta(note.type)

  // Clean excerpt for preview: remove markdown heading hashes and raw wiki brackets
  const excerpt = note.content
    ? note.content
        .replace(/^#+\s+/gm, '')
        .replace(/\[\[(.*?)(?:\|.*?)?\]\]/g, '$1')
        .replace(/[*_`>~-]/g, '')
        .trim()
    : 'Empty note...'

  return (
    <div
      onClick={() => onEdit(note)}
      className={cn(
        'group card p-4 bg-surface/60 border border-[rgba(255,255,255,0.06)] hover:border-knowledge/40',
        'transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3 relative',
        note.pinned && 'border-knowledge/25 bg-surface/80 shadow-[0_0_14px_rgba(167,139,250,0.08)]'
      )}
    >
      <div>
        {/* Header: Note Type Badge & Action Controls */}
        <div className="flex items-center justify-between pb-2">
          <div className="flex items-center space-x-1.5">
            <span
              className={cn(
                'px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border',
                typeMeta.badgeClass
              )}
            >
              {typeMeta.label}
            </span>

            {note.resourceId && (
              <span
                className="flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-mono text-sky-400 bg-sky-500/10 border border-sky-500/20"
                title="Linked to external resource"
              >
                <BookOpen className="w-2.5 h-2.5" />
                <span>Ref</span>
              </span>
            )}
          </div>

          <div
            className="flex items-center space-x-1"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Pin Toggle */}
            <button
              type="button"
              onClick={() => onTogglePin(note.id, note.pinned)}
              className={cn(
                'p-1 rounded-lg transition-colors',
                note.pinned
                  ? 'text-knowledge bg-knowledge/15'
                  : 'text-text-faint hover:text-text hover:bg-surface-2 opacity-0 group-hover:opacity-100'
              )}
              title={note.pinned ? 'Unpin note' : 'Pin note to top'}
            >
              <Pin className={cn('w-3.5 h-3.5', note.pinned && 'fill-current')} />
            </button>

            {/* Quick Edit */}
            <button
              type="button"
              onClick={() => onEdit(note)}
              className="p-1 rounded-lg text-text-faint hover:text-knowledge hover:bg-surface-2 transition-colors opacity-0 group-hover:opacity-100"
              title="Edit note"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>

            {/* Delete */}
            <button
              type="button"
              onClick={() => {
                if (confirm(`Delete note "${note.title}"?`)) {
                  onDelete(note.id)
                }
              }}
              className="p-1 rounded-lg text-text-faint hover:text-danger hover:bg-danger/10 transition-colors opacity-0 group-hover:opacity-100"
              title="Delete note"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Note Title */}
        <h3 className="text-sm font-semibold text-text group-hover:text-knowledge transition-colors line-clamp-1">
          {note.title}
        </h3>

        {/* Excerpt */}
        <p className="mt-1 text-xs text-text-muted line-clamp-3 leading-relaxed">
          {excerpt}
        </p>
      </div>

      {/* Footer: Tags, Links & Date */}
      <div className="pt-2.5 border-t border-[rgba(255,255,255,0.04)] flex items-center justify-between gap-2">
        {/* Tags */}
        <div className="flex items-center space-x-1 overflow-hidden min-w-0 flex-1">
          {note.tags && note.tags.length > 0 ? (
            note.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-surface-2 border border-[rgba(255,255,255,0.06)] text-text-muted truncate"
              >
                #{tag}
              </span>
            ))
          ) : (
            <span className="text-[10px] font-mono text-text-faint">no tags</span>
          )}
          {note.tags && note.tags.length > 3 && (
            <span className="text-[10px] font-mono text-text-faint">
              +{note.tags.length - 3}
            </span>
          )}
        </div>

        {/* Link counts and date */}
        <div className="flex items-center space-x-2 shrink-0 text-[10px] font-mono text-text-faint">
          {note.linkedNoteIds && note.linkedNoteIds.length > 0 && (
            <span
              className="flex items-center space-x-1 text-knowledge font-semibold"
              title={`${note.linkedNoteIds.length} connected note(s)`}
            >
              <Link2 className="w-3 h-3" />
              <span>{note.linkedNoteIds.length}</span>
            </span>
          )}
          <span>{formatNoteDate(note.updatedAt)}</span>
        </div>
      </div>
    </div>
  )
}
