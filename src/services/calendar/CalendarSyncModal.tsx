import React, { useState } from 'react'
import {
  Calendar as CalendarIcon,
  Check,
  AlertCircle,
  X,
  ExternalLink,
  RotateCw,
  Trash2,
  Key,
  Shield,
  ArrowRightLeft,
} from 'lucide-react'
import {
  getGoogleClientId,
  setCustomGoogleClientId,
  isCalendarConfigured,
  getCalendarToken,
  isCalendarTokenValid,
  isCalendarTokenExpired,
  requestCalendarToken,
  disconnectCalendar,
} from './gisClient'
import { syncTwoWay } from './calendarSync'
import { SyncResult } from './types'
import { cn } from '@/lib/utils'

interface CalendarSyncModalProps {
  isOpen: boolean
  onClose: () => void
  selectedDate?: string // YYYY-MM-DD
  onSyncComplete?: (result: SyncResult) => void
}

export const CalendarSyncModal: React.FC<CalendarSyncModalProps> = ({
  isOpen,
  onClose,
  selectedDate = new Date().toISOString().slice(0, 10),
  onSyncComplete,
}) => {
  const currentClientId = getGoogleClientId() || ''
  const [clientIdInput, setClientIdInput] = useState(currentClientId)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  if (!isOpen) return null

  const isConfigured = isCalendarConfigured()
  const isTokenActive = isCalendarTokenValid()
  const isTokenDead = isCalendarTokenExpired()
  const token = getCalendarToken()

  const handleSaveClientId = (e: React.FormEvent) => {
    e.preventDefault()
    setCustomGoogleClientId(clientIdInput.trim() || null)
    setErrorMsg(null)
  }

  const handleClearClientId = () => {
    setCustomGoogleClientId(null)
    setClientIdInput('')
  }

  const handleConnect = async () => {
    setIsConnecting(true)
    setErrorMsg(null)
    setSyncFeedback(null)

    try {
      await requestCalendarToken()
      setSyncFeedback('Connected successfully!')
      setTimeout(() => setSyncFeedback(null), 3000)
    } catch (err) {
      setErrorMsg((err as Error).message || 'Failed to authenticate with Google')
    } finally {
      setIsConnecting(false)
    }
  }

  const handleSyncNow = async () => {
    setIsSyncing(true)
    setErrorMsg(null)
    setSyncFeedback(null)

    try {
      const res = await syncTwoWay(selectedDate)
      setSyncFeedback(
        `Sync completed: ${res.importedCount} imported, ${res.updatedCount} updated, ${res.pushedCount} pushed.`
      )
      onSyncComplete?.(res)
    } catch (err) {
      setErrorMsg((err as Error).message || 'Sync failed')
    } finally {
      setIsSyncing(false)
    }
  }

  const handleDisconnect = () => {
    disconnectCalendar()
    setSyncFeedback('Disconnected from Google Calendar.')
    setTimeout(() => setSyncFeedback(null), 3000)
  }

  // Calculate minutes remaining on 1-hour token
  const minutesRemaining =
    token && isTokenActive ? Math.max(Math.round((token.expiresAt - Date.now()) / 60000), 1) : 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={cn(
          'w-full max-w-lg card p-6 relative border border-[rgba(255,255,255,0.14)]',
          'bg-surface/95 shadow-2xl space-y-5'
        )}
        data-hub="action"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[rgba(255,255,255,0.08)]">
          <div className="flex items-center space-x-2.5">
            <span className="p-2 rounded-xl bg-action/15 text-action border border-action/30">
              <CalendarIcon className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-text">
                Google Calendar 2-Way Sync
              </h2>
              <p className="text-xs text-text-muted">
                Sync timeline blocks seamlessly with your primary Google Calendar
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-text-muted hover:text-text rounded-lg hover:bg-surface-2 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Card */}
        <div
          className={cn(
            'p-4 rounded-xl border flex items-start space-x-3 text-xs',
            isTokenActive
              ? 'bg-action/10 border-action/30 text-action'
              : isTokenDead
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              : 'bg-surface-2 border-[rgba(255,255,255,0.08)] text-text-muted'
          )}
        >
          {isTokenActive ? (
            <Check className="w-4 h-4 mt-0.5 shrink-0 text-action" />
          ) : isTokenDead ? (
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-amber-400" />
          ) : (
            <Shield className="w-4 h-4 mt-0.5 shrink-0" />
          )}

          <div className="space-y-1 flex-1">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-text">
                {isTokenActive
                  ? 'Active Google Calendar Connection'
                  : isTokenDead
                  ? 'Session Expired (1-Hour Limit)'
                  : 'Not Connected'}
              </p>
              {isTokenActive && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-chip bg-action/20 text-action">
                  {minutesRemaining}m remaining
                </span>
              )}
            </div>

            <p className="opacity-90 leading-relaxed text-[11px] text-text-muted">
              {isTokenActive
                ? `Authorized for scope: https://www.googleapis.com/auth/calendar.events. Bi-directional sync is live.`
                : isTokenDead
                ? 'Your Google OAuth 2.0 access token has expired. Click Reconnect below to renew synchronization without losing local data.'
                : 'Connect your Google account to import meetings into OBOiFY and automatically push scheduled focus blocks to your calendar.'}
            </p>
          </div>
        </div>

        {/* Error / Feedback banners */}
        {errorMsg && (
          <div className="p-3 rounded-lg bg-danger/10 border border-danger/30 text-danger text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {syncFeedback && (
          <div className="p-3 rounded-lg bg-action/10 border border-action/30 text-action text-xs flex items-center space-x-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{syncFeedback}</span>
          </div>
        )}

        {/* Client ID Configuration Form */}
        <form onSubmit={handleSaveClientId} className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-mono font-medium text-text-muted">
                GOOGLE OAUTH CLIENT ID
              </label>
              {clientIdInput && (
                <button
                  type="button"
                  onClick={handleClearClientId}
                  className="text-danger hover:underline text-[11px] flex items-center space-x-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              )}
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                <Key className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={clientIdInput}
                onChange={(e) => setClientIdInput(e.target.value)}
                placeholder="123456789-abcdef.apps.googleusercontent.com"
                className={cn(
                  'w-full pl-9 pr-3 py-2 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.1)]',
                  'text-text text-xs font-mono placeholder:text-text-faint',
                  'focus:outline-none focus:border-action/60 focus:ring-1 focus:ring-action/60 transition-colors'
                )}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-text-muted">
            <a
              href="https://console.cloud.google.com/apis/credentials"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 text-action hover:underline"
            >
              <span>Get Client ID from Google Cloud Console</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <button
              type="submit"
              className="px-3 py-1 rounded-chip text-xs bg-surface-2 border border-[rgba(255,255,255,0.08)] text-text hover:bg-surface transition-colors"
            >
              Save ID
            </button>
          </div>
        </form>

        {/* Sync Controls & Action Buttons */}
        <div className="pt-3 border-t border-[rgba(255,255,255,0.08)] flex flex-wrap items-center justify-between gap-2">
          {isTokenActive ? (
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleSyncNow}
                disabled={isSyncing}
                className={cn(
                  'flex items-center space-x-1.5 px-4 py-2 rounded-chip text-xs font-medium',
                  'bg-action text-black hover:brightness-110 active:scale-95 transition-all shadow-md'
                )}
              >
                <ArrowRightLeft
                  className={cn('w-3.5 h-3.5', isSyncing && 'animate-spin')}
                />
                <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
              </button>

              <button
                type="button"
                onClick={handleDisconnect}
                className="px-3 py-2 rounded-chip text-xs font-medium text-danger hover:bg-danger/10 transition-colors"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleConnect}
              disabled={isConnecting || !isConfigured}
              className={cn(
                'flex items-center space-x-2 px-4 py-2 rounded-chip text-xs font-medium',
                'bg-action text-black hover:brightness-110 active:scale-95 transition-all shadow-md',
                (!isConfigured || isConnecting) && 'opacity-50 cursor-not-allowed'
              )}
            >
              <RotateCw className={cn('w-3.5 h-3.5', isConnecting && 'animate-spin')} />
              <span>
                {isConnecting
                  ? 'Connecting...'
                  : isTokenDead
                  ? 'Renew Google Connection'
                  : 'Connect Google Calendar'}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-chip text-xs font-medium text-text-muted hover:text-text hover:bg-surface-2 transition-colors ml-auto"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
