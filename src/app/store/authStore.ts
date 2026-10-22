import { create } from 'zustand'
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

const getCypressTestUser = (): User | null => {
  if (
    typeof window !== 'undefined' &&
    (window as any).Cypress &&
    sessionStorage.getItem('oboify_cypress_auth') === 'true'
  ) {
    return {
      uid: 'cypress-test-operator',
      displayName: 'Test Operator',
      email: 'operator@oboify.test',
      emailVerified: true,
      photoURL: null,
    } as unknown as User
  }
  return null
}

export interface AuthStoreState {
  user: User | null
  /**
   * Strict security loading blocker.
   * MUST be true initially until Firebase's onAuthStateChanged fires.
   */
  isAuthLoading: boolean
  error: string | null
  isConfigured: boolean

  // Actions
  setUser: (user: User | null) => void
  setIsAuthLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthStoreState>((set) => ({
  user: null,
  // STRICT REQUIREMENT: isAuthLoading must be TRUE initially
  isAuthLoading: true,
  error: null,
  isConfigured: isFirebaseConfigured,

  setUser: (user) => set({ user }),
  setIsAuthLoading: (isAuthLoading) => set({ isAuthLoading }),
  setError: (error) => set({ error }),

  signInWithGoogle: async () => {
    // Automated Cypress test mock support: simulate successful sign-in
    if (typeof window !== 'undefined' && (window as any).Cypress) {
      sessionStorage.setItem('oboify_cypress_auth', 'true')
      const mockUser = {
        uid: 'cypress-test-operator',
        displayName: 'Test Operator',
        email: 'operator@oboify.test',
        emailVerified: true,
        photoURL: null,
      } as unknown as User
      set({ user: mockUser, isAuthLoading: false, error: null })
      return
    }

    if (!auth || !googleAuthProvider || !isFirebaseConfigured) {
      set({ error: 'Firebase credentials are not configured in .env.local' })
      return
    }

    set({ isAuthLoading: true, error: null })
    try {
      await signInWithPopup(auth, googleAuthProvider)
    } catch (err: any) {
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/popup-closed-by-user') {
        try {
          await signInWithRedirect(auth, googleAuthProvider)
        } catch (redirectErr: any) {
          set({ error: redirectErr.message || 'Google Sign-In failed', isAuthLoading: false })
        }
      } else {
        set({ error: err.message || 'Google Sign-In failed', isAuthLoading: false })
      }
    }
  },

  signOut: async () => {
    set({ isAuthLoading: true })
    try {
      if (auth) {
        await firebaseSignOut(auth)
      }
    } catch (err: any) {
      console.warn('[OBOiFY Auth] Sign-out warning:', err)
    } finally {
      try {
        purgeLocalData()
        if (typeof window !== 'undefined') {
          localStorage.clear()
          sessionStorage.clear()
        }
      } catch {}
      set({ user: null, isAuthLoading: false, error: null })
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
  },
}))

// Singleton Firebase onAuthStateChanged listener
if (auth && isFirebaseConfigured) {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      useAuthStore.setState({
        user,
        isAuthLoading: false,
        error: null,
      })

      // Background local-to-cloud migration on first login
      try {
        await migrateLocalToCloud(user.uid)
      } catch (err) {
        console.error('[OBOiFY Cloud Migration] Background sync failed:', err)
      }
    } else {
      const cypressUser = getCypressTestUser()
      useAuthStore.setState({
        user: cypressUser,
        isAuthLoading: false,
      })
    }
  })
} else {
  const cypressUser = getCypressTestUser()
  useAuthStore.setState({
    user: cypressUser,
    isAuthLoading: false,
  })
}
