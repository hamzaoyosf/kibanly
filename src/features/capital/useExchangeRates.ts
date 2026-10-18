import { useState, useEffect, useCallback } from 'react'

/**
 * Free open exchange rates API endpoint (no API key required).
 * Base currency is USD.
 */
const EXCHANGE_RATE_API_URL = 'https://open.er-api.com/v6/latest/USD'

/**
 * LocalStorage cache key and 24-hour Time-To-Live.
 */
export const EXCHANGE_RATES_CACHE_KEY = 'oboify_exchange_rates_v1'
export const EXCHANGE_RATES_CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Sensible offline fallback exchange rates (Base: USD).
 * Used when user is offline and no cached rates exist.
 */
export const DEFAULT_EXCHANGE_RATES: Record<string, number> = {
  USD: 1.0,
  MAD: 10.0, // 1 USD = 10.00 MAD sensible default
  EUR: 0.92,
  GBP: 0.79,
  CAD: 1.36,
  AUD: 1.52,
  JPY: 155.0,
  CHF: 0.90,
  AED: 3.67,
  SAR: 3.75,
  CNY: 7.25,
}

export interface CachedRatesPayload {
  timestamp: number
  baseCode: string
  rates: Record<string, number>
}

/**
 * Synchronously retrieves stored exchange rates from localStorage if available,
 * otherwise returns DEFAULT_EXCHANGE_RATES.
 */
export function getStoredExchangeRates(): {
  rates: Record<string, number>
  timestamp: number | null
  isExpired: boolean
} {
  if (typeof window === 'undefined') {
    return { rates: DEFAULT_EXCHANGE_RATES, timestamp: null, isExpired: true }
  }

  try {
    const raw = localStorage.getItem(EXCHANGE_RATES_CACHE_KEY)
    if (!raw) {
      return { rates: DEFAULT_EXCHANGE_RATES, timestamp: null, isExpired: true }
    }

    const parsed = JSON.parse(raw) as CachedRatesPayload
    if (parsed && typeof parsed.rates === 'object' && typeof parsed.timestamp === 'number') {
      const isExpired = Date.now() - parsed.timestamp > EXCHANGE_RATES_CACHE_TTL_MS
      return {
        rates: { ...DEFAULT_EXCHANGE_RATES, ...parsed.rates },
        timestamp: parsed.timestamp,
        isExpired,
      }
    }
  } catch (e) {
    console.warn('[useExchangeRates] Failed to parse cached rates from localStorage', e)
  }

  return { rates: DEFAULT_EXCHANGE_RATES, timestamp: null, isExpired: true }
}

/**
 * In-flight promise to deduplicate simultaneous fetch requests across components.
 */
let inFlightFetch: Promise<CachedRatesPayload | null> | null = null

/**
 * Global rate update subscribers to notify all active hook instances when fresh rates arrive.
 */
const subscribers = new Set<(payload: CachedRatesPayload) => void>()

/**
 * Fetches latest exchange rates from open.er-api.com and persists to localStorage.
 */
export async function fetchLiveExchangeRates(force: boolean = false): Promise<CachedRatesPayload | null> {
  const current = getStoredExchangeRates()
  if (!force && !current.isExpired && current.timestamp) {
    return {
      timestamp: current.timestamp,
      baseCode: 'USD',
      rates: current.rates,
    }
  }

  if (inFlightFetch) {
    return inFlightFetch
  }

  inFlightFetch = (async () => {
    try {
      const response = await fetch(EXCHANGE_RATE_API_URL, {
        headers: { Accept: 'application/json' },
      })
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`)
      }

      const data = await response.json()
      if (data && data.result === 'success' && data.rates && typeof data.rates === 'object') {
        const payload: CachedRatesPayload = {
          timestamp: Date.now(),
          baseCode: data.base_code || 'USD',
          rates: { ...DEFAULT_EXCHANGE_RATES, ...data.rates },
        }

        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(EXCHANGE_RATES_CACHE_KEY, JSON.stringify(payload))
          } catch (storageErr) {
            console.warn('[useExchangeRates] Could not save rates to localStorage', storageErr)
          }
        }

        // Notify all active hook subscribers
        subscribers.forEach((callback) => callback(payload))
        return payload
      }
      throw new Error('Invalid rate data received from API')
    } catch (err) {
      console.warn('[useExchangeRates] Network fetch failed, retaining cached/default rates:', err)
      return null
    } finally {
      inFlightFetch = null
    }
  })()

  return inFlightFetch
}

/**
 * Calculates exchange rate multiplier between two currency codes.
 */
export function getExchangeRate(
  fromCurrency: string = 'USD',
  toCurrency: string = 'USD',
  rates: Record<string, number> = DEFAULT_EXCHANGE_RATES
): number {
  const from = fromCurrency.toUpperCase().trim()
  const to = toCurrency.toUpperCase().trim()
  if (from === to) return 1

  const fromRate = rates[from] ?? DEFAULT_EXCHANGE_RATES[from] ?? 1
  const toRate = rates[to] ?? DEFAULT_EXCHANGE_RATES[to] ?? 1

  if (fromRate <= 0) return 1
  return toRate / fromRate
}

/**
 * Converts integer minor units (cents) between two currencies.
 * Returns integer minor units rounded to nearest whole number.
 */
export function convertCurrency(
  amountMinor: number,
  fromCurrency: string = 'USD',
  toCurrency: string = 'USD',
  rates?: Record<string, number>
): number {
  if (!amountMinor || amountMinor === 0) return 0
  const from = fromCurrency.toUpperCase().trim()
  const to = toCurrency.toUpperCase().trim()
  if (from === to) return amountMinor

  const activeRates = rates || getStoredExchangeRates().rates
  const rate = getExchangeRate(from, to, activeRates)
  return Math.round(amountMinor * rate)
}

/**
 * Hook for dynamic currency exchange rates with local caching & offline resilience.
 * - Instantly returns cached or default rates on mount (0ms blocking).
 * - Checks cache freshness and silently updates in background if >24 hours old.
 */
export function useExchangeRates() {
  const [ratesState, setRatesState] = useState(() => {
    const initial = getStoredExchangeRates()
    return {
      rates: initial.rates,
      lastUpdated: initial.timestamp,
      isExpired: initial.isExpired,
      isFetching: false,
      error: null as string | null,
    }
  })

  // Subscribe to background updates from any hook instance
  useEffect(() => {
    const handleUpdate = (payload: CachedRatesPayload) => {
      setRatesState((prev) => ({
        ...prev,
        rates: payload.rates,
        lastUpdated: payload.timestamp,
        isExpired: false,
        isFetching: false,
        error: null,
      }))
    }

    subscribers.add(handleUpdate)
    return () => {
      subscribers.delete(handleUpdate)
    }
  }, [])

  // Check if cache needs background refresh on mount
  useEffect(() => {
    const checkFreshness = async () => {
      const current = getStoredExchangeRates()
      if (current.isExpired) {
        setRatesState((prev) => ({ ...prev, isFetching: true }))
        const updated = await fetchLiveExchangeRates()
        if (updated) {
          setRatesState({
            rates: updated.rates,
            lastUpdated: updated.timestamp,
            isExpired: false,
            isFetching: false,
            error: null,
          })
        } else {
          setRatesState((prev) => ({
            ...prev,
            isFetching: false,
            error: 'Offline - using cached or default rates',
          }))
        }
      }
    }

    checkFreshness()
  }, [])

  const refreshRates = useCallback(async (force: boolean = true) => {
    setRatesState((prev) => ({ ...prev, isFetching: true, error: null }))
    const result = await fetchLiveExchangeRates(force)
    if (!result) {
      setRatesState((prev) => ({
        ...prev,
        isFetching: false,
        error: 'Unable to refresh rates right now',
      }))
    }
  }, [])

  const convert = useCallback(
    (amountMinor: number, fromCurrency: string = 'USD', toCurrency: string = 'USD'): number => {
      return convertCurrency(amountMinor, fromCurrency, toCurrency, ratesState.rates)
    },
    [ratesState.rates]
  )

  const getRate = useCallback(
    (fromCurrency: string = 'USD', toCurrency: string = 'USD'): number => {
      return getExchangeRate(fromCurrency, toCurrency, ratesState.rates)
    },
    [ratesState.rates]
  )

  return {
    rates: ratesState.rates,
    lastUpdated: ratesState.lastUpdated,
    isFetching: ratesState.isFetching,
    error: ratesState.error,
    refreshRates,
    convert,
    getRate,
  }
}
