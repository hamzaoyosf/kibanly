import { useAuthStore } from '@/app/store/authStore'
import { User } from 'firebase/auth'

export interface AuthState {
  user: User | null
  loading: boolean
  isAuthLoading: boolean
  error: string | null
  isConfigured: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

/**
 * Unified Auth hook backed by the centralized Zustand useAuthStore.
 * Strictly reflects Firebase authenticated state.
 */
export function useAuth(): AuthState {
  const user = useAuthStore((s) => s.user)
  const isAuthLoading = useAuthStore((s) => s.isAuthLoading)
  const error = useAuthStore((s) => s.error)
  const isConfigured = useAuthStore((s) => s.isConfigured)
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle)
  const signOut = useAuthStore((s) => s.signOut)

  return {
    user,
    loading: isAuthLoading,
    isAuthLoading,
    error,
    isConfigured,
    signInWithGoogle,
    signOut,
  }
}
