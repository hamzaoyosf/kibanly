import { useState, useEffect } from 'react'

const GCAL_RECONNECT_ALERT_KEY = 'oboify_gcal_reconnect_alert'

export interface CalendarReconnectState {
  needed: boolean
  reason: string
  timestamp: number
}

/**
 * Mark that Google Calendar requires user re-authentication / reconnection
 */
export function markCalendarNeedsReconnect(reason: string = 'Session expired'): void {
  if (typeof window === 'undefined') return
  try {
    const payload: CalendarReconnectState = {
      needed: true,
      reason,
      timestamp: Date.now(),
    }
    localStorage.setItem(GCAL_RECONNECT_ALERT_KEY, JSON.stringify(payload))
    window.dispatchEvent(new CustomEvent('oboify:gcal_auth_state_change', { detail: payload }))
  } catch (e) {
    console.error('Failed to store calendar reconnect alert:', e)
  }
}

/**
 * Clear the Google Calendar reconnect requirement once successfully reconnected
 */
export function clearCalendarReconnectAlert(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(GCAL_RECONNECT_ALERT_KEY)
    window.dispatchEvent(
      new CustomEvent('oboify:gcal_auth_state_change', {
        detail: { needed: false, reason: '', timestamp: Date.now() },
      })
    )
  } catch (e) {
    console.error('Failed to clear calendar reconnect alert:', e)
  }
}

/**
 * Synchronously read current calendar reconnect alert status
 */
export function getCalendarReconnectAlert(): CalendarReconnectState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(GCAL_RECONNECT_ALERT_KEY)
    if (!raw) return null
    return JSON.parse(raw) as CalendarReconnectState
  } catch {
    return null
  }
}

/**
 * React hook for reactive calendar reconnect status in notifications
 */
export function useCalendarReconnectAlert() {
  const [alert, setAlert] = useState<CalendarReconnectState | null>(() => getCalendarReconnectAlert())

  useEffect(() => {
    const update = () => {
      setAlert(getCalendarReconnectAlert())
    }

    window.addEventListener('oboify:gcal_auth_state_change', update)
    window.addEventListener('storage', update)
    return () => {
      window.removeEventListener('oboify:gcal_auth_state_change', update)
      window.removeEventListener('storage', update)
    }
  }, [])

  return {
    needsReconnect: !!alert?.needed,
    reason: alert?.reason || 'Authentication required',
    alert,
    clearAlert: clearCalendarReconnectAlert,
  }
}
