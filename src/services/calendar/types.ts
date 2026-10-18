export interface CalendarToken {
  accessToken: string
  expiresAt: number // Timestamp in milliseconds
  scope: string
}

export interface GCalEventDateTime {
  dateTime?: string // ISO 8601
  date?: string // YYYY-MM-DD for all-day events
  timeZone?: string
}

export interface GCalEvent {
  id: string
  etag: string
  status: string
  summary?: string
  description?: string
  start: GCalEventDateTime
  end: GCalEventDateTime
  updated: string
  htmlLink?: string
}

export interface GCalEventPayload {
  summary: string
  description?: string
  start: GCalEventDateTime
  end: GCalEventDateTime
}

export interface SyncResult {
  importedCount: number
  updatedCount: number
  pushedCount: number
  errors: string[]
}
