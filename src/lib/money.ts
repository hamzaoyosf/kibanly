import { Transaction, TransactionScope, SubscriptionCycle } from '@/data/ports/schemas'
import { usePreferencesStore } from '@/app/store/preferencesStore'
import { convertCurrency } from '@/features/capital/useExchangeRates'

export { convertCurrency }

/**
 * Formats integer minor units (e.g. cents) as a locale currency string.
 * Examples:
 *   formatMoney(4999) => "$49.99"
 *   formatMoney(450000) => "$4,500.00"
 *   formatMoney(-1500) => "-$15.00"
 */
export function formatMoney(amountMinor: number, currency?: string): string {
  const activeCurrency =
    currency ||
    (typeof window !== 'undefined'
      ? usePreferencesStore.getState?.()?.defaultCurrency
      : 'USD') ||
    'USD'
  const isNegative = amountMinor < 0
  const absAmount = Math.abs(amountMinor) / 100
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: activeCurrency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(absAmount)

  return isNegative ? `-${formatted}` : formatted
}

/**
 * Safely parses a user-entered monetary decimal string into integer minor units (cents).
 * Examples:
 *   "49.99" => 4999
 *   "$1,250.50" => 125050
 *   "10" => 1000
 */
export function parseMoneyToMinor(input: string): number {
  if (!input) return 0
  // Remove currency signs, commas, and spaces
  const cleaned = input.replace(/[^0-9.-]+/g, '')
  const parsed = parseFloat(cleaned)
  if (isNaN(parsed)) return 0
  return Math.round(parsed * 100)
}

/**
 * Calculates net cash metrics from transactions filtered by scope.
 * Optionally normalizes multi-currency transactions into a single target currency (e.g. user's defaultCurrency).
 */
export function calculateNetCash(
  transactions: Transaction[],
  scope: 'all' | TransactionScope | string = 'all',
  targetCurrency?: string,
  convertFn?: (amountMinor: number, fromCurrency: string, toCurrency: string) => number
) {
  const targetScope = (scope || 'all').toLowerCase()
  const filtered = targetScope === 'all'
    ? transactions
    : transactions.filter((t) => (t.scope || 'business').toLowerCase() === targetScope)

  const toTarget = (amountMinor: number, currency?: string) => {
    if (!targetCurrency || !currency || currency.toUpperCase() === targetCurrency.toUpperCase()) {
      return amountMinor
    }
    const converter = convertFn || convertCurrency
    return converter(amountMinor, currency, targetCurrency)
  }

  const totalIncomeMinor = filtered
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + toTarget(t.amountMinor, t.currency), 0)

  const totalExpenseMinor = filtered
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + toTarget(t.amountMinor, t.currency), 0)

  const netCashMinor = totalIncomeMinor - totalExpenseMinor
  const operatingMarginPercent = totalIncomeMinor > 0
    ? Math.round((netCashMinor / totalIncomeMinor) * 100)
    : 0

  return {
    totalIncomeMinor,
    totalExpenseMinor,
    netCashMinor,
    operatingMarginPercent,
    count: filtered.length,
  }
}

/**
 * Converts a subscription amount into its monthly equivalent minor units.
 */
export function calculateMonthlyEquivalent(
  amountMinor: number,
  cycle: SubscriptionCycle
): number {
  switch (cycle) {
    case 'weekly':
      return Math.round((amountMinor * 52) / 12)
    case 'monthly':
      return amountMinor
    case 'quarterly':
      return Math.round(amountMinor / 3)
    case 'yearly':
      return Math.round(amountMinor / 12)
    default:
      return amountMinor
  }
}

/**
 * Calculates months to complete a milestone goal per SRS §3.3 FR-CAP-02:
 * Milestone ETA = ceil((target - current) / monthlyContribution) months;
 * Returns null (show dash) if contribution is 0 or less, or if already achieved.
 */
export function calculateMilestoneEtaMonths(
  targetMinor: number,
  currentMinor: number,
  monthlyContributionMinor: number
): number | null {
  if (monthlyContributionMinor <= 0) return null
  const remaining = targetMinor - currentMinor
  if (remaining <= 0) return 0
  return Math.ceil(remaining / monthlyContributionMinor)
}
