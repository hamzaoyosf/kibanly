import { GCalEvent, GCalEventPayload } from './types'

const GCAL_BASE_URL = 'https://www.googleapis.com/calendar/v3/calendars/primary/events'

/**
 * Fetch events within a given time window from the primary Google Calendar.
 */
export async function fetchCalendarEvents(
  accessToken: string,
  timeMin: string,
  timeMax: string
): Promise<GCalEvent[]> {
  const url = new URL(GCAL_BASE_URL)
  url.searchParams.set('timeMin', timeMin)
  url.searchParams.set('timeMax', timeMax)
  url.searchParams.set('singleEvents', 'true')
  url.searchParams.set('orderBy', 'startTime')
  url.searchParams.set('maxResults', '250')

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  })

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('UNAUTHORIZED: Google Calendar token has expired.')
    }
    const errText = await res.text()
    throw new Error(`Google Calendar API error (${res.status}): ${errText}`)
  }

  const data = await res.json()
  return (data.items || []) as GCalEvent[]
}

/**
 * Create a new event on Google Calendar.
 */
export async function createCalendarEvent(
  accessToken: string,
  payload: GCalEventPayload
): Promise<GCalEvent> {
  const res = await fetch(GCAL_BASE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('UNAUTHORIZED: Google Calendar token has expired.')
    }
    const errText = await res.text()
    throw new Error(`Failed to create Google Calendar event (${res.status}): ${errText}`)
  }

  return (await res.json()) as GCalEvent
}

/**
 * Update an existing event on Google Calendar.
 */
export async function updateCalendarEvent(
  accessToken: string,
  eventId: string,
  payload: Partial<GCalEventPayload>
): Promise<GCalEvent> {
  const url = `${GCAL_BASE_URL}/${encodeURIComponent(eventId)}`
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('UNAUTHORIZED: Google Calendar token has expired.')
    }
    const errText = await res.text()
    throw new Error(`Failed to update Google Calendar event (${res.status}): ${errText}`)
  }

  return (await res.json()) as GCalEvent
}

/**
 * Delete an event from Google Calendar.
 */
export async function deleteCalendarEvent(
  accessToken: string,
  eventId: string
): Promise<void> {
  const url = `${GCAL_BASE_URL}/${encodeURIComponent(eventId)}`
  const res = await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!res.ok && res.status !== 404 && res.status !== 410) {
    if (res.status === 401) {
      throw new Error('UNAUTHORIZED: Google Calendar token has expired.')
    }
    const errText = await res.text()
    throw new Error(`Failed to delete Google Calendar event (${res.status}): ${errText}`)
  }
}
