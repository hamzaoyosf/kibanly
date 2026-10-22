import React, { useState, useRef } from 'react'
import {
  Settings,
  Database,
  Cloud,
  Calendar,
  Sparkles,
  DollarSign,
  Download,
  Upload,
  Check,
  AlertCircle,
  Loader2,
  RefreshCw,
  LogOut,
  LogIn,
  ShieldCheck,
  Cpu,
  Layers,
  AlertTriangle,
  Trash2,
} from 'lucide-react'
import { collection, getDocs, writeBatch } from 'firebase/firestore'
import { signOut as firebaseSignOut } from 'firebase/auth'
import { db, auth } from '@/lib/firebase'
import { purgeLocalData } from '@/data'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/useAuth'
import { migrateLocalToCloud } from '@/data/firebase/migrateLocalToCloud'
import { exportData, importData, ImportResult } from '@/data/backup/backupService'
import { usePreferencesStore } from '@/app/store/preferencesStore'
import { useExchangeRates } from '@/features/capital/useExchangeRates'
import { formatMoney } from '@/lib/money'
import {
  CalendarSyncModal,
  isCalendarTokenValid,
  isCalendarTokenExpired,
  isCalendarConfigured,
  getCalendarToken,
  disconnectCalendar,
  requestCalendarToken,
} from '@/services/calendar'
import {
  GeminiConfigModal,
  isGeminiConfigured,
} from '@/services/ai'
import { cn } from '@/lib/utils'

export const SettingsPage: React.FC = () => {
  const queryClient = useQueryClient()
  const { user, loading: authLoading, signInWithGoogle, signOut, isConfigured: isFirebaseSetup } = useAuth()

  // Preferences Store
  const {
    aiAutoCategorize,
    setAiAutoCategorize,
    defaultCurrency,
    setDefaultCurrency,
    dailyGoalTasks,
    setDailyGoalTasks,
  } = usePreferencesStore()

  const { getRate, isFetching: isRatesFetching, refreshRates } = useExchangeRates()

  // State
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false)
  const [isGeminiModalOpen, setIsGeminiModalOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [isMigrating, setIsMigrating] = useState(false)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Status checks
  const isGCalActive = isCalendarTokenValid()
  const isGCalExpired = isCalendarTokenExpired()
  const isGCalSetup = isCalendarConfigured()
  const gcalToken = getCalendarToken()
  const isAIActive = isGeminiConfigured()

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 4500)
  }

  // Handle Export
  const handleExport = async () => {
    setIsExporting(true)
    try {
      const backup = await exportData()
      const totalItems = Object.values(backup.itemCounts).reduce((a, b) => a + b, 0)
      showNotification('success', `Exported ${totalItems} items to JSON backup file!`)
    } catch (err: any) {
      showNotification('error', `Export failed: ${err.message || 'Unknown error'}`)
    } finally {
      setIsExporting(false)
    }
  }

  // Handle Import
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    try {
      const text = await file.text()
      const result: ImportResult = await importData(text, queryClient)

      if (result.success) {
        showNotification(
          'success',
          `Successfully restored ${result.totalImported} items across all hubs!`
        )
      } else {
        showNotification('error', `Import failed: ${result.error || 'Invalid file format'}`)
      }
    } catch (err: any) {
      showNotification('error', `Failed reading file: ${err.message || 'Error parsing file'}`)
    } finally {
      setIsImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Handle Manual Local to Cloud Sync
  const handleManualCloudSync = async () => {
    if (!user) return
    setIsMigrating(true)
    try {
      const result = await migrateLocalToCloud(user.uid, true)
      if (result.status === 'completed') {
        showNotification('success', `Cloud sync complete! Synced ${result.migratedCount} records to cloud backup.`)
        await queryClient.invalidateQueries()
      } else if (result.status === 'skipped') {
        showNotification('success', 'Cloud data is already in sync with local storage.')
      } else {
        showNotification('error', `Migration failed: ${result.error || 'Unknown error'}`)
      }
    } catch (err: any) {
      showNotification('error', `Cloud sync failed: ${err.message}`)
    } finally {
      setIsMigrating(false)
    }
  }

  const handleConnectCalendar = async () => {
    try {
      await requestCalendarToken()
      showNotification('success', 'Google Calendar connected successfully!')
    } catch (err: any) {
      if (err.message?.includes('MISSING_GOOGLE_CLIENT_ID')) {
        setIsCalendarModalOpen(true)
      } else {
        showNotification('error', err.message || 'Failed to connect Google Calendar')
      }
    }
  }

  const handleDisconnectCalendar = () => {
    disconnectCalendar()
    showNotification('success', 'Google Calendar disconnected.')
  }

  const [isWipingData, setIsWipingData] = useState(false)

  const handleFactoryReset = async () => {
    const confirmed = window.confirm(
      '⚠️ FACTORY RESET DANGER ZONE:\n\n' +
      'This will permanently delete ALL data in both cloud backup (if logged in) and local browser storage (tasks, habits, transactions, notes, settings).\n\n' +
      'Are you absolutely sure you want to completely wipe all data and return to a clean slate?'
    )
    if (!confirmed) return

    setIsWipingData(true)
    try {
      // 1. Wipe Cloud Firestore if authenticated
      if (db && user?.uid) {
        const collectionsToWipe = [
          'inbox',
          'tasks',
          'timeBlocks',
          'habits',
          'habitLogs',
          'energyLogs',
          'transactions',
          'subscriptions',
          'milestones',
          'notes',
          'resources',
          'tags',
        ]
        for (const colName of collectionsToWipe) {
          try {
            const colRef = collection(db, 'users', user.uid, colName)
            const snap = await getDocs(colRef)
            if (!snap.empty) {
              const docs = snap.docs
              const CHUNK_SIZE = 400
              for (let i = 0; i < docs.length; i += CHUNK_SIZE) {
                const chunk = docs.slice(i, i + CHUNK_SIZE)
                const batch = writeBatch(db)
                chunk.forEach((d) => batch.delete(d.ref))
                await batch.commit()
              }
            }
          } catch (e) {
            console.warn(`[Factory Reset] Error deleting collection ${colName}:`, e)
          }
        }
      }

      // 2. Wipe Local Storage, Session Storage, and Repositories
      purgeLocalData()
      localStorage.clear()
      sessionStorage.clear()

      // 3. Clear Query Client Cache
      queryClient.clear()

      // 4. Sign out Firebase session if active
      if (auth) {
        try {
          await firebaseSignOut(auth)
        } catch (e) {
          console.warn('[Factory Reset] Signout error:', e)
        }
      }

      // 5. Force redirect to /login with zero memory state
      window.location.href = '/login'
    } catch (err: any) {
      console.error('[Factory Reset] Failed:', err)
      showNotification('error', `Factory Reset failed: ${err?.message || 'Unknown error'}`)
      setIsWipingData(false)
    }
  }

  const CURRENCY_OPTIONS = [
    { code: 'USD', symbol: '$', label: 'USD ($) - US Dollar' },
    { code: 'EUR', symbol: '€', label: 'EUR (€) - Euro' },
    { code: 'MAD', symbol: 'DH', label: 'MAD (DH) - Moroccan Dirham' },
    { code: 'GBP', symbol: '£', label: 'GBP (£) - British Pound' },
    { code: 'JPY', symbol: '¥', label: 'JPY (¥) - Japanese Yen' },
    { code: 'CAD', symbol: '$', label: 'CAD ($) - Canadian Dollar' },
    { code: 'AUD', symbol: '$', label: 'AUD ($) - Australian Dollar' },
    { code: 'CHF', symbol: 'Fr', label: 'CHF (Fr) - Swiss Franc' },
    { code: 'SGD', symbol: '$', label: 'SGD ($) - Singapore Dollar' },
    { code: 'INR', symbol: '₹', label: 'INR (₹) - Indian Rupee' },
  ]

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-2 animate-fadeIn pb-16">
      {/* Page Header */}
      <div className="pb-4 border-b border-[rgba(255,255,255,0.06)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="p-2 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.08)] text-text">
              <Settings className="w-5 h-5 text-action" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-text">
              Settings & Preferences
            </h1>
          </div>
          <p className="mt-1 text-sm text-text-muted">
            Manage data backups, cloud authentication, calendar sync, and AI engine preferences.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono text-text-muted bg-surface-2 px-3 py-1.5 rounded-xl border border-[rgba(255,255,255,0.06)] self-start sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-growth shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
          <span>Workspace Online</span>
        </div>
      </div>

      {/* Global Notification Banner */}
      {notification && (
        <div
          className={cn(
            'p-4 rounded-xl border flex items-center space-x-3 text-sm animate-fadeIn shadow-lg',
            notification.type === 'success'
              ? 'bg-growth/15 border-growth/40 text-growth'
              : 'bg-red-500/15 border-red-500/40 text-red-400'
          )}
        >
          {notification.type === 'success' ? (
            <Check className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Grid of Settings Bento Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION 1: DATA & BACKUP */}
        <div className="p-6 rounded-2xl bg-surface border border-[rgba(255,255,255,0.08)] space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="p-2 rounded-xl bg-action/10 text-action border border-action/20">
                <Database className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-base font-semibold text-text">Data & Backup</h2>
                <p className="text-xs text-text-muted">Export and restore all personal OS records</p>
              </div>
            </div>

            <p className="text-xs text-text-muted leading-relaxed mt-3">
              Your Tasks, Habits, Energy Audits, Ledger Transactions,
              and Notes can be exported as a single portable JSON backup anytime.
            </p>

            <div className="mt-4 p-3.5 rounded-xl bg-surface-2/60 border border-[rgba(255,255,255,0.06)] space-y-2 text-xs">
              <div className="flex items-center justify-between text-text">
                <span className="text-text-muted">Export format:</span>
                <span className="font-mono">JSON (Full OS Dump)</span>
              </div>
              <div className="flex items-center justify-between text-text">
                <span className="text-text-muted">Coverage:</span>
                <span className="font-mono text-growth">12 Domain Repositories</span>
              </div>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              disabled={isExporting}
              onClick={handleExport}
              className={cn(
                'w-full sm:w-auto flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl font-mono text-xs font-semibold',
                'bg-action text-black hover:brightness-110 active:scale-95 transition-all shadow-md',
                isExporting && 'opacity-60 cursor-not-allowed'
              )}
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>{isExporting ? 'Exporting...' : 'Export Backup (JSON)'}</span>
            </button>

            <button
              type="button"
              disabled={isImporting}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'w-full sm:w-auto flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl font-mono text-xs font-semibold',
                'bg-surface-2 border border-[rgba(255,255,255,0.12)] text-text hover:bg-white/10 active:scale-95 transition-all',
                isImporting && 'opacity-60 cursor-not-allowed'
              )}
            >
              {isImporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              <span>{isImporting ? 'Restoring...' : 'Import Backup'}</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </div>

        {/* SECTION 2: ACCOUNT & SYNC (FIREBASE AUTH) */}
        <div className="p-6 rounded-2xl bg-surface border border-[rgba(255,255,255,0.08)] space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Cloud className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-base font-semibold text-text">Account & Cloud Sync</h2>
                <p className="text-xs text-text-muted">Google Sign-In & Seamless Cloud Backup</p>
              </div>
            </div>

            {user ? (
              <div className="mt-4 p-4 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.08)] space-y-3">
                <div className="flex items-center space-x-3">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="w-10 h-10 rounded-full border border-[rgba(255,255,255,0.14)]"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold">
                      {user.displayName?.[0] || user.email?.[0] || 'U'}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-text truncate">
                      {user.displayName || 'OBOiFY User'}
                    </p>
                    <p className="text-xs text-text-muted truncate font-mono">{user.email}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-growth/20 text-growth border border-growth/40">
                    Synced
                  </span>
                </div>

                <div className="pt-2 border-t border-border flex items-center justify-end text-[11px] font-mono">
                  <span className="text-emerald-400 flex items-center space-x-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                    <span>Cloud Backup Active</span>
                  </span>
                </div>
              </div>
            ) : (
              <div className="mt-4 p-4 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.08)] space-y-2">
                <div className="flex items-center space-x-2 text-xs font-semibold text-text">
                  <ShieldCheck className="w-4 h-4 text-action" />
                  <span>Works Anywhere • Total Privacy</span>
                </div>
                <p className="text-xs text-text-muted">
                  Sign in with Google to synchronize your workspace across devices with seamless cloud backup.
                </p>
                {!isFirebaseSetup && (
                  <p className="text-[11px] font-mono text-amber-400 pt-1">
                    Notice: Cloud sync is unavailable until cloud settings are configured.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            {user ? (
              <>
                <button
                  type="button"
                  disabled={isMigrating}
                  onClick={handleManualCloudSync}
                  className="w-full sm:w-auto flex-1 flex items-center justify-center space-x-1.5 px-3.5 py-2.5 rounded-xl font-mono text-xs font-semibold bg-surface-2 hover:bg-white/10 border border-[rgba(255,255,255,0.12)] text-text transition-all"
                >
                  <RefreshCw className={cn('w-3.5 h-3.5', isMigrating && 'animate-spin')} />
                  <span>{isMigrating ? 'Syncing...' : 'Sync Local to Cloud'}</span>
                </button>

                <button
                  type="button"
                  disabled={authLoading}
                  onClick={signOut}
                  className="w-full sm:w-auto flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-xl font-mono text-xs font-semibold bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                disabled={authLoading}
                onClick={signInWithGoogle}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl font-mono text-xs font-semibold bg-white text-black hover:bg-white/90 active:scale-95 transition-all shadow-md"
              >
                {authLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LogIn className="w-4 h-4" />
                )}
                <span>Sign in with Google</span>
              </button>
            )}
          </div>
        </div>

        {/* SECTION 3: GOOGLE CALENDAR 2-WAY SYNC */}
        <div className="p-6 rounded-2xl bg-surface border border-[rgba(255,255,255,0.08)] space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Calendar className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-base font-semibold text-text">Google Calendar Sync</h2>
                <p className="text-xs text-text-muted">Bi-directional timeline scheduling integration</p>
              </div>
            </div>

            <p className="text-xs text-text-muted leading-relaxed mt-3">
              Google Calendar 2-Way Sync pulls primary calendar meetings directly into your Action Hub Timeline
              and pushes scheduled OBOiFY TimeBlocks directly to your Google account.
            </p>

            <div className="mt-4 p-3.5 rounded-xl bg-surface-2/60 border border-[rgba(255,255,255,0.06)] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-text-muted">OAuth Status:</span>
                {isGCalActive ? (
                  <span className="font-mono text-growth font-semibold flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-growth" />
                    <span>Connected & Active</span>
                  </span>
                ) : isGCalExpired ? (
                  <span className="font-mono text-amber-400 font-semibold">Token Expired</span>
                ) : (
                  <span className="font-mono text-text-muted">Disconnected</span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-text-muted">Client ID:</span>
                <span className="font-mono text-text">
                  {isGCalSetup ? 'Configured' : 'Needs Client ID'}
                </span>
              </div>

              {gcalToken && (
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Session:</span>
                  <span className="font-mono text-[11px] text-text-faint">
                    Expires at {new Date(gcalToken.expiresAt).toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            {isGCalActive ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsCalendarModalOpen(true)}
                  className="w-full sm:w-auto flex-1 flex items-center justify-center space-x-1.5 px-3.5 py-2.5 rounded-xl font-mono text-xs font-semibold bg-surface-2 hover:bg-white/10 border border-[rgba(255,255,255,0.12)] text-text transition-all"
                >
                  <span>Sync Settings</span>
                </button>
                <button
                  type="button"
                  onClick={handleDisconnectCalendar}
                  className="w-full sm:w-auto flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-xl font-mono text-xs font-semibold bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all"
                >
                  <span>Disconnect</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleConnectCalendar}
                  className="w-full sm:w-auto flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl font-mono text-xs font-semibold bg-blue-500 text-white hover:bg-blue-600 transition-all shadow-md"
                >
                  <span>Connect Google Calendar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsCalendarModalOpen(true)}
                  className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl font-mono text-xs font-semibold bg-surface-2 hover:bg-white/10 border border-[rgba(255,255,255,0.12)] text-text transition-all"
                >
                  <span>Configure</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* SECTION 4: PREFERENCES & AI AUTONOMY */}
        <div className="p-6 rounded-2xl bg-surface border border-[rgba(255,255,255,0.08)] space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="p-2 rounded-xl bg-growth/10 text-growth border border-growth/20">
                <Sparkles className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-base font-semibold text-text">Preferences & AI Autonomy</h2>
                <p className="text-xs text-text-muted">Smart Auto-Sorting and Currency Localization</p>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              {/* AI Auto-Categorization Toggle */}
              <div className="p-3.5 rounded-xl bg-surface-2/60 border border-[rgba(255,255,255,0.06)] flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold text-text">AI Auto-Categorization</span>
                    {isAIActive ? (
                      <span className="text-[10px] font-mono text-growth bg-growth/20 px-1.5 py-0.2 rounded border border-growth/30">
                        AI Assistant Active
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-amber-400 bg-amber-500/20 px-1.5 py-0.2 rounded border border-amber-500/30">
                        Needs Key
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    Automatically sorts Inbox thought captures into GTD contexts and tags.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={aiAutoCategorize}
                    onChange={(e) => setAiAutoCategorize(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-surface-2 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-black after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-text after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-action" />
                </label>
              </div>

              {/* Currency Selector */}
              <div className="p-3.5 rounded-xl bg-surface-2/60 border border-[rgba(255,255,255,0.06)] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-capital" />
                    <span className="text-xs font-semibold text-text">Capital Hub Currency</span>
                  </div>
                  <span className="text-xs font-mono text-capital font-bold">
                    {formatMoney(125000, defaultCurrency)}
                  </span>
                </div>
                <select
                  value={defaultCurrency}
                  onChange={(e) => setDefaultCurrency(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface border border-[rgba(255,255,255,0.08)] text-text text-xs font-mono focus:outline-none focus:border-capital"
                >
                  {CURRENCY_OPTIONS.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>

                {defaultCurrency !== 'USD' && (
                  <div className="flex items-center justify-between text-[11px] font-mono text-text-muted pt-1">
                    <span>1 USD ≈ {getRate('USD', defaultCurrency).toFixed(2)} {defaultCurrency}</span>
                    <button
                      type="button"
                      onClick={() => refreshRates(true)}
                      disabled={isRatesFetching}
                      className="flex items-center space-x-1 text-capital hover:underline disabled:opacity-50"
                      title="Sync live currency exchange rates"
                    >
                      <RefreshCw className={cn('w-3 h-3', isRatesFetching && 'animate-spin')} />
                      <span>{isRatesFetching ? 'Syncing...' : 'Sync Live Rates'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Daily Tasks Target */}
              <div className="p-3.5 rounded-xl bg-surface-2/60 border border-[rgba(255,255,255,0.06)] flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-text">Daily Task Goal</span>
                  <p className="text-[11px] text-text-muted">Target tasks to complete per day</p>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={dailyGoalTasks}
                    onChange={(e) => setDailyGoalTasks(Number(e.target.value) || 1)}
                    className="w-16 px-2.5 py-1 text-center rounded-lg bg-surface border border-[rgba(255,255,255,0.08)] text-text text-xs font-mono focus:outline-none focus:border-action"
                  />
                  <span className="text-xs font-mono text-text-muted">tasks</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsGeminiModalOpen(true)}
              className="w-full flex items-center justify-center space-x-1.5 px-3.5 py-2.5 rounded-xl font-mono text-xs font-semibold bg-surface-2 hover:bg-white/10 border border-[rgba(255,255,255,0.12)] text-text transition-all"
            >
              <Cpu className="w-3.5 h-3.5 text-growth" />
              <span>Configure AI Assistant Settings</span>
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone: Factory Reset */}
      <div className="p-5 rounded-2xl bg-red-950/20 border border-red-500/30 space-y-4">
        <div className="flex items-center space-x-2 text-xs font-mono text-red-400 font-bold uppercase tracking-wider">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <span>Danger Zone • Factory Reset</span>
        </div>
        <p className="text-xs text-text-muted leading-relaxed font-mono">
          Permanently erase all workspace data (tasks, habits, notes, transactions, and calendar caches) from both cloud backup and local browser storage. This guarantees an absolute clean slate.
        </p>
        <div className="pt-1">
          <button
            type="button"
            disabled={isWipingData}
            onClick={handleFactoryReset}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl font-mono text-xs font-bold bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isWipingData ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            <span>{isWipingData ? 'Wiping All Data...' : 'Factory Reset (Wipe All Data)'}</span>
          </button>
        </div>
      </div>

      {/* Core Capabilities */}
      <div className="p-5 rounded-2xl bg-surface-2/30 border border-[rgba(255,255,255,0.06)] space-y-3">
        <div className="flex items-center space-x-2 text-xs font-mono text-text font-semibold uppercase tracking-wider">
          <Layers className="w-4 h-4 text-action" />
          <span>Core Capabilities</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-3 rounded-xl bg-surface border border-[rgba(255,255,255,0.06)]">
            <div className="text-text-muted text-[10px]">AVAILABILITY</div>
            <div className="text-text font-bold mt-1">Always Accessible</div>
          </div>
          <div className="p-3 rounded-xl bg-surface border border-[rgba(255,255,255,0.06)]">
            <div className="text-text-muted text-[10px]">DATA & SYNC</div>
            <div className="text-text font-bold mt-1">
              {user ? 'Seamless Sync' : 'Your Data, Your Control'}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-surface border border-[rgba(255,255,255,0.06)]">
            <div className="text-text-muted text-[10px]">APPEARANCE</div>
            <div className="text-text font-bold mt-1">Focus Mode</div>
          </div>
          <div className="p-3 rounded-xl bg-surface border border-[rgba(255,255,255,0.06)]">
            <div className="text-text-muted text-[10px]">INTELLIGENCE</div>
            <div className="text-text font-bold mt-1">
              {isAIActive ? 'AI Assistant' : 'Smart Brain (Local)'}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CalendarSyncModal
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
      />

      <GeminiConfigModal
        isOpen={isGeminiModalOpen}
        onClose={() => setIsGeminiModalOpen(false)}
      />
    </div>
  )
}
