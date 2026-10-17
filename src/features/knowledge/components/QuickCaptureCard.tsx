import React, { useState } from 'react'
import { Zap, Check, PlusCircle } from 'lucide-react'
import { useCreateNote } from '../useNotes'
import { useTags, useCreateTag } from '../useTags'
import { cn } from '@/lib/utils'

export const QuickCaptureCard: React.FC = () => {
  const [text, setText] = useState('')
  const [tagStr, setTagStr] = useState('')
  const [capturedSuccess, setCapturedSuccess] = useState(false)
  const createMutation = useCreateNote()
  const { data: globalTags = [] } = useTags()
  const createTagMutation = useCreateTag()

  const handleCapture = (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return

    const lines = text.trim().split('\n')
    // Title is the first line (up to 60 chars), rest is content
    const rawTitle = lines[0].replace(/^#+\s*/, '').trim()
    const title = rawTitle.length > 70 ? rawTitle.slice(0, 67) + '...' : rawTitle
    const content = lines.length > 1 ? lines.slice(1).join('\n').trim() : text.trim()

    const tags = tagStr
      .split(',')
      .map((t) => t.trim().toLowerCase().replace(/[^a-z0-9_-]/g, ''))
      .filter(Boolean)

    // Ensure new tags are registered globally
    const existingNames = new Set(globalTags.map((t) => t.name.toLowerCase()))
    tags.forEach((t) => {
      if (!existingNames.has(t)) {
        createTagMutation.mutate(t)
        existingNames.add(t)
      }
    })

    createMutation.mutate(
      {
        title,
        content: `# ${title}\n\n${content}`,
        type: 'fleeting',
        tags: tags.length > 0 ? tags : ['inbox'],
        linkedNoteIds: [],
        resourceId: null,
        pinned: false,
        archived: false,
      },
      {
        onSuccess: () => {
          setText('')
          setTagStr('')
          setCapturedSuccess(true)
          setTimeout(() => setCapturedSuccess(false), 2000)
        },
      }
    )
  }

  return (
    <div className="card p-4 bg-surface/50 border border-[rgba(255,255,255,0.06)] flex flex-col space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[rgba(255,255,255,0.06)]">
        <div className="flex items-center space-x-2">
          <Zap className="w-4 h-4 text-knowledge" />
          <h2 className="text-xs font-semibold text-text uppercase tracking-wider font-mono">
            Quick Fleeting Capture
          </h2>
        </div>
        {capturedSuccess && (
          <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-mono text-growth bg-growth/10 border border-growth/30 animate-in fade-in">
            <Check className="w-3 h-3" />
            <span>Captured</span>
          </span>
        )}
      </div>

      <form onSubmit={handleCapture} className="space-y-2.5 text-xs">
        <textarea
          rows={3}
          required
          placeholder="Jot down a fleeting thought or insight... (First line becomes title)"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.06)] text-xs text-text placeholder:text-text-faint focus:outline-none focus:border-knowledge/60 resize-none font-sans"
        />

        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Tags (comma-separated)..."
            value={tagStr}
            onChange={(e) => setTagStr(e.target.value)}
            className="flex-1 px-3 py-1.5 rounded-lg bg-surface-2 border border-[rgba(255,255,255,0.06)] text-[11px] font-mono text-text placeholder:text-text-faint focus:outline-none focus:border-knowledge/60"
          />

          <button
            type="submit"
            disabled={createMutation.isPending || !text.trim()}
            className={cn(
              'flex items-center space-x-1 px-3 py-1.5 rounded-lg font-semibold text-[11px] font-mono',
              'bg-knowledge text-black hover:brightness-110 active:scale-95 transition-all shadow-sm disabled:opacity-50'
            )}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Capture</span>
          </button>
        </div>
      </form>
    </div>
  )
}
