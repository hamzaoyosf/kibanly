import React from 'react'
import { Link } from 'react-router-dom'
import { Brain, ArrowUpRight, Pin, BookOpen, Link2 } from 'lucide-react'
import { useNotes } from '@/features/knowledge/useNotes'
import { useResources } from '@/features/knowledge/useResources'
import { cn } from '@/lib/utils'

export const KnowledgeWidget: React.FC = () => {
  const { data: notes = [] } = useNotes()
  const { data: resources = [] } = useResources()

  // Pinned concepts first, then most recently updated
  const pinnedNotes = notes.filter((n) => n.pinned).slice(0, 3)
  const displayNotes = pinnedNotes.length > 0 ? pinnedNotes : notes.slice(0, 3)

  const activeReading = resources.find((r) => r.status === 'reading') || resources[0] || null
  const totalLinksCount = notes.reduce((sum, n) => sum + (n.linkedNoteIds?.length || 0), 0)

  return (
    <div
      className="card p-5 bg-surface border border-[rgba(255,255,255,0.06)] hover:border-knowledge/40 transition-all flex flex-col justify-between space-y-4"
      data-hub="knowledge"
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[rgba(255,255,255,0.06)]">
          <div className="flex items-center space-x-2.5">
            <span className="p-2 rounded-xl bg-knowledge/10 text-knowledge shadow-[0_0_12px_rgba(167,139,250,0.2)]">
              <Brain className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold text-text">Knowledge & Vault</h2>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-knowledge/15 text-knowledge font-mono font-medium">
                  {notes.length} notes
                </span>
              </div>
              <p className="text-[11px] text-text-faint font-mono">Knowledge Hub</p>
            </div>
          </div>
          <Link
            to="/knowledge"
            className="p-1.5 rounded-lg text-text-faint hover:text-knowledge hover:bg-surface-2 transition-colors"
            title="Open Knowledge Hub"
          >
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Pinned Mental Models */}
        <div className="mt-3.5 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono text-text-faint">
            <span className="flex items-center space-x-1">
              <Pin className="w-3.5 h-3.5 text-knowledge fill-current" />
              <span>PINNED CONCEPTS ({displayNotes.length})</span>
            </span>
            <span className="flex items-center space-x-1 text-growth">
              <Link2 className="w-3 h-3" />
              <span>{totalLinksCount} cross-links</span>
            </span>
          </div>

          {displayNotes.length === 0 ? (
            <p className="p-3 rounded-xl bg-surface-2/30 text-center text-xs text-text-faint font-mono">
              No notes in vault.{' '}
              <Link to="/knowledge" className="text-knowledge hover:underline">
                Create in Knowledge Hub →
              </Link>
            </p>
          ) : (
            <div className="space-y-1.5">
              {displayNotes.map((note) => (
                <Link
                  key={note.id}
                  to="/knowledge"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-surface-2/40 hover:bg-surface-2/80 border border-[rgba(255,255,255,0.04)] hover:border-knowledge/30 transition-all group"
                >
                  <div className="flex items-center space-x-2 truncate">
                    <span
                      className={cn(
                        'w-1.5 h-1.5 rounded-full shrink-0',
                        note.type === 'permanent'
                          ? 'bg-knowledge'
                          : note.type === 'literature'
                          ? 'bg-sky-400'
                          : 'bg-text-faint'
                      )}
                    />
                    <span className="text-xs text-text group-hover:text-knowledge transition-colors truncate font-medium">
                      {note.title}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0 font-mono text-[10px] text-text-faint">
                    {note.tags && note.tags.length > 0 && (
                      <span className="text-text-muted">#{note.tags[0]}</span>
                    )}
                    {note.linkedNoteIds && note.linkedNoteIds.length > 0 && (
                      <span className="flex items-center space-x-0.5 text-knowledge">
                        <Link2 className="w-2.5 h-2.5" />
                        <span>{note.linkedNoteIds.length}</span>
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Curated Source / Reading Shelf */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono text-text-faint">
            <span className="flex items-center space-x-1">
              <BookOpen className="w-3.5 h-3.5 text-sky-400" />
              <span>ACTIVE READING & SOURCES</span>
            </span>
            <span className="text-sky-400 font-mono text-[10px]">
              {resources.length} sources
            </span>
          </div>

          {activeReading ? (
            <div className="p-3 rounded-xl bg-surface-2/40 border border-[rgba(255,255,255,0.04)] space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text font-medium truncate">
                  {activeReading.title}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-sky-500/15 text-sky-400 border border-sky-500/20 shrink-0 ml-2 capitalize">
                  {activeReading.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-[11px] text-text-faint font-mono">
                {activeReading.author ? `By ${activeReading.author}` : activeReading.type}
                {activeReading.rating && ` · ${'★'.repeat(activeReading.rating)}`}
              </p>
            </div>
          ) : (
            <p className="p-3 rounded-xl bg-surface-2/30 text-center text-xs text-text-faint font-mono">
              No reading sources logged yet.
            </p>
          )}
        </div>
      </div>

      {/* Footer Deep-Link */}
      <div className="pt-3 border-t border-[rgba(255,255,255,0.04)] flex items-center justify-between text-xs">
        <span className="text-text-faint font-mono text-[11px]">Zettelkasten Synthesis</span>
        <Link
          to="/knowledge"
          className="text-knowledge hover:underline font-medium flex items-center space-x-1 text-xs font-mono"
        >
          <span>Open Hub</span>
          <span>→</span>
        </Link>
      </div>
    </div>
  )
}
