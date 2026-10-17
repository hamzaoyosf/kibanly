import { InboxAI, InboxCategory, Priority } from '@/data/ports/schemas'

/**
 * Heuristic/Mock AI categorizer for local MVP (PRD §2.5 / SRS §3.6.3).
 * Simulates Gemini classification locally until Phase 2 Cloud integration.
 */
export function classifyInboxItemSync(text: string): InboxAI {
  const lower = text.toLowerCase()

  let category: InboxCategory = 'task'
  let priority: Priority = 'medium'
  let confidence = 0.88

  if (/\b(pay|cost|bill|subscription|\$|dollar|euro|invoice|fee|price)\b/.test(lower)) {
    category = 'expense'
    priority = 'medium'
    confidence = 0.91
  } else if (/\b(income|revenue|salary|paid to me)\b/.test(lower)) {
    category = 'income'
    priority = 'high'
    confidence = 0.93
  } else if (/\b(habit|gym|workout|sleep|water|meditate|stretch|walk)\b/.test(lower)) {
    category = 'habit'
    priority = 'medium'
    confidence = 0.89
  } else if (/\b(meeting|call with|sync|flight|appointment|dinner with)\b/.test(lower)) {
    category = 'event'
    priority = 'medium'
    confidence = 0.87
  } else if (/\b(idea|note|remember to consider|reading list|article|book)\b/.test(lower)) {
    category = 'note'
    priority = 'low'
    confidence = 0.85
  } else if (/\b(urgent|asap|critical|due today|tomorrow|renew|deadline)\b/.test(lower)) {
    category = 'task'
    priority = 'high'
    confidence = 0.94
  } else if (/\b(maybe|someday|check out|look into)\b/.test(lower)) {
    category = 'task'
    priority = 'low'
    confidence = 0.82
  }

  return {
    category,
    priority,
    suggestedDue: null,
    confidence,
    model: 'mock-gemini-flash',
    accepted: null,
  }
}
