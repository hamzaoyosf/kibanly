/**
 * Local unique ID generator with domain-specific prefixes.
 * Format: {prefix}_{base36Timestamp}_{randomSlice}
 * Example: inb_m2k1s9a_a1b2c3d4
 */
export function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36)
  const randomPart = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID().replace(/-/g, '').slice(0, 8)
    : Math.random().toString(36).substring(2, 10)

  return `${prefix}_${timestamp}_${randomPart}`
}
