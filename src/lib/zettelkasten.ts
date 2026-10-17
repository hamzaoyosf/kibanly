import { Note, NoteType } from '@/data/ports/schemas'

/**
 * Extracts wiki-link targets from markdown content (e.g. `[[Note Title]]` or `[[Note Title|Display Alias]]`).
 * Returns the target string (title or id).
 */
export function extractWikiLinks(content: string): string[] {
  if (!content) return []
  const matches = content.matchAll(/\[\[(.*?)\]\]/g)
  const links: string[] = []
  for (const match of matches) {
    const raw = match[1]?.trim()
    if (raw) {
      // If there's an alias like [[Title|Alias]], extract the target Title/ID
      const target = raw.split('|')[0]?.trim()
      if (target && !links.includes(target)) {
        links.push(target)
      }
    }
  }
  return links
}

/**
 * Resolves all wiki-link titles and IDs in markdown content to actual Note IDs.
 */
export function extractWikiLinkNoteIds(content: string, allNotes: Note[]): string[] {
  if (!content || !allNotes) return []
  const rawLinks = extractWikiLinks(content)
  const resolvedIds: string[] = []

  for (const raw of rawLinks) {
    const lower = raw.toLowerCase()
    const found = allNotes.find(
      (n) => n.id === raw || n.title.toLowerCase() === lower
    )
    if (found && !resolvedIds.includes(found.id)) {
      resolvedIds.push(found.id)
    }
  }

  return resolvedIds
}

/**
 * Resolves all notes that point TO the given note (backlinks).
 * Supports bi-directional matching via explicit linkedNoteIds, title wiki-links (`[[Note Title]]`),
 * or raw ID wiki-links (`[[not_seed_01]]`).
 */
export function findBacklinks(targetNoteId: string, allNotes: Note[]): Note[] {
  if (!targetNoteId || !allNotes) return []
  const targetNote = allNotes.find((n) => n.id === targetNoteId)
  const targetTitleLower = targetNote?.title?.toLowerCase()
  const targetIdLower = targetNoteId.toLowerCase()

  return allNotes.filter((note) => {
    if (note.id === targetNoteId) return false

    // Explicit linkedNoteIds array
    if (note.linkedNoteIds && note.linkedNoteIds.includes(targetNoteId)) {
      return true
    }

    // Markdown inline [[links]] (matched by title or by id)
    const extracted = extractWikiLinks(note.content)
    return extracted.some((raw) => {
      const lower = raw.toLowerCase()
      return lower === targetIdLower || (targetTitleLower && lower === targetTitleLower)
    })
  })
}

/**
 * Returns color classes for note types in OLED glassmorphic theme.
 */
export function getNoteTypeMeta(type: NoteType) {
  switch (type) {
    case 'permanent':
      return {
        label: 'Permanent',
        badgeClass:
          'bg-knowledge/15 text-knowledge border-knowledge/30 shadow-[0_0_8px_rgba(167,139,250,0.15)]',
        description: 'Evergreen mental models & synthesized insights',
      }
    case 'literature':
      return {
        label: 'Literature',
        badgeClass: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
        description: 'Summaries & key takeaways from external sources',
      }
    case 'fleeting':
    default:
      return {
        label: 'Fleeting',
        badgeClass:
          'bg-surface-2 text-text-muted border-[rgba(255,255,255,0.08)]',
        description: 'Quick capture inbox thoughts & rough ideas',
      }
  }
}

/**
 * Formats ISO date string into readable short date.
 */
export function formatNoteDate(dateStr: string): string {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return dateStr.slice(0, 10)
  }
}

/**
 * Filters notes by search query, note type, and selected tag.
 */
export function filterNotes(
  notes: Note[],
  query: string,
  typeFilter: 'all' | NoteType,
  tagFilter: string
): Note[] {
  const cleanQuery = query.toLowerCase().trim()

  return notes.filter((n) => {
    // Type filter
    if (typeFilter !== 'all' && n.type !== typeFilter) {
      return false
    }

    // Tag filter
    if (tagFilter && tagFilter !== 'all') {
      const hasTag = n.tags.some(
        (t) => t.toLowerCase() === tagFilter.toLowerCase()
      )
      if (!hasTag) return false
    }

    // Search query
    if (cleanQuery) {
      const matchesTitle = n.title.toLowerCase().includes(cleanQuery)
      const matchesContent = n.content.toLowerCase().includes(cleanQuery)
      const matchesTag = n.tags.some((t) => t.toLowerCase().includes(cleanQuery))
      if (!matchesTitle && !matchesContent && !matchesTag) {
        return false
      }
    }

    return true
  })
}
