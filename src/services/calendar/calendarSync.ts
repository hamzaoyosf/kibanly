import { repos } from '@/data'
import { TimeBlock } from '@/data/ports/schemas'
import { generateId } from '@/lib/id'
import {
  getCalendarToken,
  isCalendarTokenValid,
  isCalendarTokenExpired,
  requestCalendarToken,
} from './gisClient'
import {
  fetchCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from './calendarApi'
import { SyncResult } from './types'

function toIsoString(dateOrDateTime: { dateTime?: string; date?: string }, isEnd = false): string {
  if (dateOrDateTime.dateTime) {
    return new Date(dateOrDateTime.dateTime).toISOString()
  }
  if (dateOrDateTime.date) {
    // All-day event: normalize to local/UTC full day interval
    const timePart = isEnd ? '23:59:59' : '09:00:00'
    return new Date(`${dateOrDateTime.date}T${timePart}`).toISOString()
  }
  return new Date().toISOString()
}

/**
 * Inbound sync: Fetch Google Calendar events and project them into OBOiFY TimeBlocks.
 */
export async function syncInbound(
  timeMin: string,
  timeMax: string,
  tokenStr?: string
): Promise<{ importedCount: number; updatedCount: number; errors: string[] }> {
  const token = tokenStr || getCalendarToken()?.accessToken
  if (!token) {
    throw new Error('NO_TOKEN: Please connect your Google Calendar first.')
  }

  const events = await fetchCalendarEvents(token, timeMin, timeMax)
  const existingBlocks = await repos.timeBlocks.list()
  const blockMapByGCalId = new Map<string, TimeBlock>()

  for (const b of existingBlocks) {
    if (b.gcal?.eventId) {
      blockMapByGCalId.set(b.gcal.eventId, b)
    }
  }

  let importedCount = 0
  let updatedCount = 0
  const errors: string[] = []

  for (const event of events) {
    if (!event.id || event.status === 'cancelled') continue

    const startIso = toIsoString(event.start, false)
    const endIso = toIsoString(event.end, true)
    const existing = blockMapByGCalId.get(event.id)

    if (existing) {
      // If already in OBOiFY, update start/end/title if changed in Google Calendar
      if (
        existing.title !== (event.summary || '(Untitled Event)') ||
        existing.start !== startIso ||
        existing.end !== endIso
      ) {
        try {
          await repos.timeBlocks.update(existing.id, {
            title: event.summary || '(Untitled Event)',
            start: startIso,
            end: endIso,
            gcal: {
              eventId: event.id,
              etag: event.etag,
              calendarId: 'primary',
              lastSyncedAt: new Date().toISOString(),
            },
          })
          updatedCount++
        } catch (e) {
          errors.push(`Failed to update local block for event ${event.id}`)
        }
      }
    } else {
      // Completely new event from Google Calendar -> Create TimeBlock
      try {
        await repos.timeBlocks.create({
          id: generateId('tb_gcal'),
          title: event.summary || '(Untitled Event)',
          category: 'external',
          color: 'slate',
          start: startIso,
          end: endIso,
          source: 'gcal',
          gcal: {
            eventId: event.id,
            etag: event.etag,
            calendarId: 'primary',
            lastSyncedAt: new Date().toISOString(),
          },
          taskId: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          schemaVersion: 1,
        })
        importedCount++
      } catch (e) {
        errors.push(`Failed to import event ${event.id}: ${(e as Error).message}`)
      }
    }
  }

  return { importedCount, updatedCount, errors }
}

/**
 * Outbound sync: Push a single scheduled OBOiFY TimeBlock to Google Calendar.
 */
export async function pushBlockToGCal(block: TimeBlock): Promise<TimeBlock | null> {
  if (!isCalendarTokenValid()) return null

  // Loop prevention: do not re-push blocks originally imported from GCal
  if (block.source === 'gcal') return block

  const token = getCalendarToken()!

  try {
    if (block.gcal?.eventId) {
      // Update existing remote event
      const updated = await updateCalendarEvent(token.accessToken, block.gcal.eventId, {
        summary: block.title,
        start: { dateTime: block.start },
        end: { dateTime: block.end },
      })

      const updatedBlock = await repos.timeBlocks.update(block.id, {
        gcal: {
          eventId: updated.id,
          etag: updated.etag,
          calendarId: 'primary',
          lastSyncedAt: new Date().toISOString(),
        },
      })
      return updatedBlock
    } else {
      // Create new event on Google Calendar
      const created = await createCalendarEvent(token.accessToken, {
        summary: block.title,
        description: 'Scheduled in OBOiFY',
        start: { dateTime: block.start },
        end: { dateTime: block.end },
      })

      const updatedBlock = await repos.timeBlocks.update(block.id, {
        gcal: {
          eventId: created.id,
          etag: created.etag,
          calendarId: 'primary',
          lastSyncedAt: new Date().toISOString(),
        },
      })
      return updatedBlock
    }
  } catch (err) {
    console.warn('[GCal Sync] Failed to push block to Google Calendar:', err)
    return null
  }
}

/**
 * Delete a remote Google Calendar event when a synced TimeBlock is deleted in OBOiFY.
 */
export async function deleteRemoteGCalEvent(eventId: string): Promise<void> {
  if (!isCalendarTokenValid()) return
  const token = getCalendarToken()!
  try {
    await deleteCalendarEvent(token.accessToken, eventId)
  } catch (err) {
    console.warn('[GCal Sync] Failed to delete remote event:', err)
  }
}

/**
 * Full two-way reconciliation for a date window (e.g., active day or week).
 */
export async function syncTwoWay(
  dateStr: string, // YYYY-MM-DD
  endDateStr?: string
): Promise<SyncResult> {
  let token = getCalendarToken()

  // Handle expired token: prompt refresh
  if (!token || isCalendarTokenExpired()) {
    token = await requestCalendarToken()
  }

  const startIso = new Date(`${dateStr}T00:00:00`).toISOString()
  const endTarget = endDateStr || dateStr
  const endIso = new Date(`${endTarget}T23:59:59`).toISOString()

  // 1. Inbound: fetch Google Calendar events -> save to OBOiFY
  const inboundRes = await syncInbound(startIso, endIso, token.accessToken)

  // 2. Outbound: find OBOiFY blocks in this window that are not yet synced to GCal
  const blocks = await repos.timeBlocks.list()
  const localBlocksInWindow = blocks.filter(
    (b) => b.start >= startIso && b.start <= endIso && (b.source === 'OBOiFY' || b.source === 'KiBANLY') && !b.gcal?.eventId
  )

  let pushedCount = 0
  for (const block of localBlocksInWindow) {
    const pushed = await pushBlockToGCal(block)
    if (pushed) pushedCount++
  }

  return {
    importedCount: inboundRes.importedCount,
    updatedCount: inboundRes.updatedCount,
    pushedCount,
    errors: inboundRes.errors,
  }
}
