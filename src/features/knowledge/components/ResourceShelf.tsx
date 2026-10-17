import React, { useState } from 'react'
import {
  BookOpen,
  Plus,
  ExternalLink,
  Star,
  Trash2,
  Pencil,
  X,
  FileText,
  Headphones,
  Video,
  Globe,
} from 'lucide-react'
import { Resource, ResourceStatus, ResourceType } from '@/data/ports/schemas'
import {
  useResources,
  useCreateResource,
  useUpdateResource,
  useDeleteResource,
} from '../useResources'
import { cn } from '@/lib/utils'

export const ResourceShelf: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<'all' | ResourceStatus>('all')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingResource, setEditingResource] = useState<Resource | null>(null)

  const { data: resources = [], isLoading } = useResources(statusFilter)
  const deleteMutation = useDeleteResource()
  const updateMutation = useUpdateResource()

  const handleDelete = (id: string, title: string) => {
    if (confirm(`Remove resource "${title}"?`)) {
      deleteMutation.mutate(id)
    }
  }

  const getTypeIcon = (type: ResourceType) => {
    switch (type) {
      case 'book':
        return <BookOpen className="w-3.5 h-3.5 text-knowledge" />
      case 'paper':
        return <FileText className="w-3.5 h-3.5 text-sky-400" />
      case 'podcast':
        return <Headphones className="w-3.5 h-3.5 text-growth" />
      case 'video':
        return <Video className="w-3.5 h-3.5 text-rose-400" />
      case 'article':
      default:
        return <Globe className="w-3.5 h-3.5 text-capital" />
    }
  }

  return (
    <div className="card p-4 bg-surface/50 border border-[rgba(255,255,255,0.06)] flex flex-col space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[rgba(255,255,255,0.06)]">
        <div>
          <div className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-knowledge" />
            <h2 className="text-xs font-semibold text-text uppercase tracking-wider font-mono">
              Curated Sources & Reading
            </h2>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono text-knowledge bg-knowledge/10 border border-knowledge/20">
              {resources.length}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-surface-2 hover:bg-surface text-[11px] font-mono text-knowledge border border-knowledge/30 transition-colors"
        >
          <Plus className="w-3 h-3" />
          <span>Add Source</span>
        </button>
      </div>

      {/* Status Filter Pills */}
      <div className="flex items-center space-x-1 overflow-x-auto pb-1 text-[11px] font-mono">
        {[
          { id: 'all', label: 'All' },
          { id: 'reading', label: 'Reading' },
          { id: 'to_read', label: 'To Read' },
          { id: 'completed', label: 'Completed' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setStatusFilter(tab.id as 'all' | ResourceStatus)}
            className={cn(
              'px-2.5 py-0.5 rounded-lg transition-all',
              statusFilter === tab.id
                ? 'bg-knowledge/20 text-knowledge border border-knowledge/40 font-semibold'
                : 'text-text-muted hover:text-text'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Resources List */}
      <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
        {isLoading ? (
          <div className="h-28 rounded-xl bg-surface-2/40 animate-pulse" />
        ) : resources.length === 0 ? (
          <div className="p-6 text-center text-xs text-text-faint border border-dashed border-[rgba(255,255,255,0.08)] rounded-xl">
            No resources match this status.
          </div>
        ) : (
          resources.map((res) => (
            <div
              key={res.id}
              className="p-2.5 rounded-xl bg-surface border border-[rgba(255,255,255,0.06)] hover:border-border-strong transition-all flex items-start justify-between gap-2.5 group"
            >
              <div className="flex items-start space-x-2.5 min-w-0 flex-1">
                <div className="p-1.5 rounded-lg bg-surface-2 border border-[rgba(255,255,255,0.06)] shrink-0 mt-0.5">
                  {getTypeIcon(res.type)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-1.5">
                    <p className="text-xs font-semibold text-text truncate">
                      {res.title}
                    </p>
                    {res.url && (
                      <a
                        href={res.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-text-faint hover:text-knowledge transition-colors shrink-0"
                        title="Open external source"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  {res.author && (
                    <p className="text-[10px] font-mono text-text-faint truncate">
                      by {res.author}
                    </p>
                  )}

                  {/* Rating & Status */}
                  <div className="flex items-center space-x-2 mt-1 text-[10px] font-mono">
                    <span
                      className={cn(
                        'px-1.5 py-0.2 rounded capitalize',
                        res.status === 'completed'
                          ? 'bg-growth/10 text-growth border border-growth/20'
                          : res.status === 'reading'
                          ? 'bg-knowledge/10 text-knowledge border border-knowledge/20'
                          : 'bg-surface-2 text-text-muted border border-[rgba(255,255,255,0.06)]'
                      )}
                    >
                      {res.status.replace('_', ' ')}
                    </span>

                    {res.rating && (
                      <div className="flex items-center space-x-0.5 text-amber-400">
                        {Array.from({ length: res.rating }).map((_, i) => (
                          <Star key={i} className="w-2.5 h-2.5 fill-current" />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => setEditingResource(res)}
                  className="p-1 rounded text-text-faint hover:text-knowledge transition-colors"
                  title="Edit source"
                >
                  <Pencil className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(res.id, res.title)}
                  className="p-1 rounded text-text-faint hover:text-danger transition-colors"
                  title="Delete source"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Resource Modal */}
      {(isAddModalOpen || editingResource) && (
        <ResourceModal
          resource={editingResource}
          onClose={() => {
            setIsAddModalOpen(false)
            setEditingResource(null)
          }}
          onSave={(payload) => {
            if (editingResource) {
              updateMutation.mutate({ id: editingResource.id, patch: payload })
            } else {
              // Creating new
              // createMutation handled inside or passed
            }
            setIsAddModalOpen(false)
            setEditingResource(null)
          }}
        />
      )}
    </div>
  )
}

interface ResourceModalProps {
  resource: Resource | null
  onClose: () => void
  onSave: (payload: Partial<Resource>) => void
}

const ResourceModal: React.FC<ResourceModalProps> = ({
  resource,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState(resource?.title || '')
  const [url, setUrl] = useState(resource?.url || '')
  const [author, setAuthor] = useState(resource?.author || '')
  const [type, setType] = useState<ResourceType>(resource?.type || 'article')
  const [status, setStatus] = useState<ResourceStatus>(
    resource?.status || 'to_read'
  )
  const [rating, setRating] = useState<number>(resource?.rating || 5)
  const [summary, setSummary] = useState(resource?.summary || '')
  const createMutation = useCreateResource()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    const payload = {
      title: title.trim(),
      url: url.trim() || null,
      author: author.trim() || null,
      type,
      status,
      rating,
      summary: summary.trim() || null,
      tags: [],
    }

    if (resource) {
      onSave(payload)
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => onClose(),
      })
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="w-full max-w-md card p-5 bg-surface border border-[rgba(255,255,255,0.12)] shadow-2xl space-y-4"
        data-hub="knowledge"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[rgba(255,255,255,0.06)]">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-knowledge" />
            <h2 className="text-sm font-semibold text-text">
              {resource ? 'Edit Source' : 'New Knowledge Source'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-text-muted hover:text-text hover:bg-surface-2 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-[11px] font-mono text-text-muted mb-1">
              Title / Document Name
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Deep Work, Designing Data-Intensive Apps..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.08)] text-xs text-text focus:outline-none focus:border-knowledge/60"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-mono text-text-muted mb-1">
                Author / Creator
              </label>
              <input
                type="text"
                placeholder="e.g. Cal Newport"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.08)] text-xs text-text focus:outline-none focus:border-knowledge/60"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-text-muted mb-1">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ResourceType)}
                className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.08)] text-xs text-text focus:outline-none focus:border-knowledge/60"
              >
                <option value="article">Article</option>
                <option value="book">Book</option>
                <option value="paper">Paper</option>
                <option value="podcast">Podcast</option>
                <option value="video">Video</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-mono text-text-muted mb-1">
                Reading Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ResourceStatus)}
                className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.08)] text-xs text-text focus:outline-none focus:border-knowledge/60"
              >
                <option value="to_read">To Read</option>
                <option value="reading">Reading</option>
                <option value="completed">Completed</option>
                <option value="abandoned">Abandoned</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-text-muted mb-1">
                Rating (1-5 Stars)
              </label>
              <select
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.08)] text-xs text-text focus:outline-none focus:border-knowledge/60"
              >
                <option value={5}>★★★★★ (5 - Exceptional)</option>
                <option value={4}>★★★★☆ (4 - Strong)</option>
                <option value={3}>★★★☆☆ (3 - Good)</option>
                <option value={2}>★★☆☆☆ (2 - Fair)</option>
                <option value={1}>★☆☆☆☆ (1 - Weak)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-text-muted mb-1">
              External Link URL (Optional)
            </label>
            <input
              type="url"
              placeholder="https://..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.08)] text-xs text-text focus:outline-none focus:border-knowledge/60"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-text-muted mb-1">
              Key Takeaway / Summary
            </label>
            <textarea
              rows={2}
              placeholder="Core thesis or why this source matters..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.08)] text-xs text-text focus:outline-none focus:border-knowledge/60 resize-none"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[rgba(255,255,255,0.06)]">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-chip text-text-muted hover:text-text hover:bg-surface-2 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-chip bg-knowledge text-black font-semibold hover:brightness-110 active:scale-95 transition-all shadow-sm"
            >
              Save Source
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
