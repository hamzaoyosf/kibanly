import { CalendarToken } from './types'
import { clearCalendarReconnectAlert } from './calendarNotifications'

const TOKEN_STORAGE_KEY = 'oboify_gcal_token'
const LEGACY_TOKEN_STORAGE_KEY = 'kibanly_gcal_token'
const CLIENT_ID_STORAGE_KEY = 'oboify_google_client_id'
const LEGACY_CLIENT_ID_STORAGE_KEY = 'kibanly_google_client_id'
export const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events'

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string
            scope: string
            callback: (response: {
              access_token?: string
              expires_in?: number
              error?: string
              error_description?: string
              scope?: string
            }) => void
            error_callback?: (error: unknown) => void
          }) => {
            requestAccessToken: (overrideConfig?: { prompt?: string }) => void
          }
          revoke: (accessToken: string, callback?: () => void) => void
        }
      }
    }
  }
}

/**
 * Retrieve the active Google OAuth Client ID from env or local override.
 */
export function getGoogleClientId(): string | null {
  const envId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  if (
    envId &&
    typeof envId === 'string' &&
    envId.trim().length > 10 &&
    !envId.includes('YOUR_')
  ) {
    return envId.trim()
  }

  if (typeof window !== 'undefined') {
    const localId = localStorage.getItem(CLIENT_ID_STORAGE_KEY) || localStorage.getItem(LEGACY_CLIENT_ID_STORAGE_KEY)
    if (localId && localId.trim().length > 10) {
      return localId.trim()
    }
  }

  return null
}

/**
 * Store a custom Google OAuth Client ID locally in the browser.
 */
export function setCustomGoogleClientId(clientId: string | null): void {
  if (typeof window === 'undefined') return
  if (!clientId) {
    localStorage.removeItem(CLIENT_ID_STORAGE_KEY)
  } else {
    localStorage.setItem(CLIENT_ID_STORAGE_KEY, clientId.trim())
  }
}

/**
 * Check if a valid Google OAuth Client ID is available.
 */
export function isCalendarConfigured(): boolean {
  return !!getGoogleClientId()
}

/**
 * Get the currently stored Google Calendar access token.
 */
export function getCalendarToken(): CalendarToken | null {
  if (typeof window === 'undefined') return null
  const stored = localStorage.getItem(TOKEN_STORAGE_KEY) || localStorage.getItem(LEGACY_TOKEN_STORAGE_KEY)
  if (!stored) return null

  try {
    const token = JSON.parse(stored) as CalendarToken
    return token
  } catch {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    return null
  }
}

/**
 * Check if the active Google Calendar token is valid and unexpired.
 */
export function isCalendarTokenValid(): boolean {
  const token = getCalendarToken()
  if (!token || !token.accessToken) return false
  // 30-second buffer before true expiration
  return Date.now() < token.expiresAt - 30000
}

/**
 * Check if a token exists but has expired.
 */
export function isCalendarTokenExpired(): boolean {
  const token = getCalendarToken()
  if (!token || !token.accessToken) return false
  return Date.now() >= token.expiresAt - 30000
}

/**
 * Dynamically load the Google Identity Services client script.
 */
export function loadGisScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return resolve()
    if (window.google?.accounts?.oauth2) return resolve()

    const existing = document.getElementById('google-gis-script')
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', (e) => reject(e))
      return
    }

    const script = document.createElement('script')
    script.id = 'google-gis-script'
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google Identity Services SDK'))
    document.body.appendChild(script)
  })
}

/**
 * Request OAuth 2.0 access token via Google Identity Services (GIS) popup flow.
 */
export async function requestCalendarToken(): Promise<CalendarToken> {
  const clientId = getGoogleClientId()
  if (!clientId) {
    throw new Error('MISSING_GOOGLE_CLIENT_ID: Configure your Google Client ID first.')
  }

  await loadGisScript()

  if (!window.google?.accounts?.oauth2) {
    throw new Error('Google Identity Services SDK failed to initialize.')
  }

  return new Promise((resolve, reject) => {
    try {
      const tokenClient = window.google!.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: CALENDAR_SCOPE,
        callback: (resp) => {
          if (resp.error || !resp.access_token) {
            console.error('[GIS] OAuth Error:', resp.error, resp.error_description)
            reject(new Error(resp.error_description || resp.error || 'User cancelled authorization'))
            return
          }

          const expiresInSec = resp.expires_in ?? 3600
          const token: CalendarToken = {
            accessToken: resp.access_token,
            expiresAt: Date.now() + expiresInSec * 1000,
            scope: resp.scope || CALENDAR_SCOPE,
          }

          localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(token))
          clearCalendarReconnectAlert()
          resolve(token)
        },
        error_callback: (err) => {
          console.error('[GIS] Token Client Error:', err)
          reject(err instanceof Error ? err : new Error('GIS OAuth popup failed'))
        },
      })

      // Prompt consent / account picker
      tokenClient.requestAccessToken({ prompt: '' })
    } catch (err) {
      reject(err)
    }
  })
}

/**
 * Disconnect Google Calendar and clear all local tokens.
 */
export function disconnectCalendar(): void {
  const token = getCalendarToken()
  if (token && window.google?.accounts?.oauth2) {
    try {
      window.google.accounts.oauth2.revoke(token.accessToken, () => {
        console.log('[GIS] Google token revoked.')
      })
    } catch (e) {
      console.warn('[GIS] Error revoking token:', e)
    }
  }

  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    clearCalendarReconnectAlert()
  }
}
