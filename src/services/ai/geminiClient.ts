import { GoogleGenAI } from '@google/genai'

const LOCAL_STORAGE_KEY = 'kibanly_gemini_api_key'
export const DEFAULT_GEMINI_MODEL = 'gemini-1.5-flash'

/**
 * Retrieve the active Gemini API key from environment variables
 * or local storage user overrides.
 */
export function getGeminiApiKey(): string | null {
  const envKey = import.meta.env.VITE_GEMINI_API_KEY
  if (envKey && typeof envKey === 'string' && envKey.trim().length > 10 && !envKey.includes('YOUR_')) {
    return envKey.trim()
  }

  const storedKey = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_STORAGE_KEY) : null
  if (storedKey && storedKey.trim().length > 10) {
    return storedKey.trim()
  }

  return null
}

/**
 * Check if the Gemini AI service has a valid API key configured.
 */
export function isGeminiConfigured(): boolean {
  return !!getGeminiApiKey()
}

/**
 * Optional override to store a custom Gemini API key locally in the browser.
 */
export function setCustomGeminiApiKey(key: string | null): void {
  if (typeof window === 'undefined') return
  if (!key) {
    localStorage.removeItem(LOCAL_STORAGE_KEY)
  } else {
    localStorage.setItem(LOCAL_STORAGE_KEY, key.trim())
  }
}

let cachedClient: GoogleGenAI | null = null
let cachedKey: string | null = null

/**
 * Get an initialized GoogleGenAI instance.
 * Re-uses cached client unless the active key has changed.
 */
export function getGeminiClient(): GoogleGenAI | null {
  const activeKey = getGeminiApiKey()
  if (!activeKey) {
    cachedClient = null
    cachedKey = null
    return null
  }

  if (cachedClient && cachedKey === activeKey) {
    return cachedClient
  }

  try {
    cachedClient = new GoogleGenAI({ apiKey: activeKey })
    cachedKey = activeKey
    return cachedClient
  } catch (err) {
    console.error('[GeminiClient] Initialization failed:', err)
    return null
  }
}
