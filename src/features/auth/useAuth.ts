import { useState, useEffect, useCallback } from 'react'
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import { auth, googleAuthProvider, isFirebaseConfigured } from '@/lib/firebase'
import { migrateLocalToCloud } from '@/data/firebase/migrateLocalToCloud'
import { purgeLocalData } from '@/data'

export interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
  isConfigured: boolean
  isGuest: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

let currentUserState: User | null = null
let isInitialized = false
const listeners = new Set<(user: User | null) => void>()

// Global Auth Subscriber
if (auth) {
  onAuthStateChanged(auth, async (user) => {
    currentUserState = user
    isInitialized = true
    listeners.forEach((listener) => listener(user))

    if (user) {
      // Trigger background local-to-cloud migration on first login
      try {
        await migrateLocalToCloud(user.uid)
      } catch (err) {
        console.error('[OBOiFY Cloud Migration] Background sync failed:', err)
      }
    }
  })
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(currentUserState)
  const [loading, setLoading] = useState<boolean>(!isInitialized && isFirebaseConfigured)
  const [error, setError] = useState<string | null>(null)
  const [isGuest, setIsGuest] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('oboify_guest_mode') === 'true'
  })

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false)
      return
    }

    const handler = (u: User | null) => {
      setUser(u)
      if (u) {
        setIsGuest(false)
        localStorage.removeItem('oboify_guest_mode')
      }
      setLoading(false)
    }

    listeners.add(handler)
    if (isInitialized) {
      setUser(currentUserState)
      setLoading(false)
    }

    return () => {
      listeners.delete(handler)
    }
  }, [])

  const signInWithGoogle = useCallback(async () => {
    if (!auth || !googleAuthProvider || !isFirebaseConfigured) {
      setError('Firebase credentials are not configured in .env.local')
      return
    }

    setLoading(true)
    setError(null)
    try {
      localStorage.removeItem('oboify_guest_mode')
      setIsGuest(false)
      await signInWithPopup(auth, googleAuthProvider)
    } catch (err: any) {
      // Fallback to redirect if popup was blocked by mobile browser
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/popup-closed-by-user') {
        try {
          await signInWithRedirect(auth, googleAuthProvider)
        } catch (redirectErr: any) {
          setError(redirectErr.message || 'Google Sign-In failed')
        }
      } else {
        setError(err.message || 'Google Sign-In failed')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const signOut = useCallback(async () => {
    setLoading(true)
    try {
      if (auth) {
        await firebaseSignOut(auth)
      }
    } catch (err: any) {
      console.warn('[OBOiFY Auth] Sign-out warning:', err)
    } finally {
      // Complete state & storage purge for clean slate
      try {
        purgeLocalData()
        localStorage.clear()
        sessionStorage.clear()
      } catch (e) {
        console.error('Storage clear error:', e)
      }
      currentUserState = null
      setUser(null)
      setIsGuest(false)
      setLoading(false)
      // Redirect to login page with an empty memory state
      window.location.href = '/login'
    }
  }, [])

  return {
    user,
    loading,
    error,
    isConfigured: isFirebaseConfigured,
    isGuest,
    signInWithGoogle,
    signOut,
  }
}
