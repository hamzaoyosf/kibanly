import { InboxAI, InboxCategory, Priority, InboxContext, Hub } from '@/data/ports/schemas'

/**
 * Heuristic/Offline AI categorizer (PRD §2.5 / SRS §3.6.3).
 * Classifies raw thoughts into GTD Context, Hub, and Estimated Duration with zero network latency.
 */
export function classifyInboxItemSync(text: string): InboxAI {
  const lower = text.toLowerCase()

  let category: InboxCategory = 'task'
  let priority: Priority = 'medium'
  let confidence = 0.88
  let hub: Hub = 'Action'
  let context: InboxContext = 'Next Action'
  let estimatedTime = '15m'
  let estimateMin = 15

  // 1. Determine Hub & Category
  if (/\b(pay|cost|bill|subscription|\$|dollar|euro|invoice|fee|price|budget|spend|wallet)\b/.test(lower)) {
    category = 'expense'
    priority = 'medium'
    confidence = 0.91
    hub = 'Capital'
    context = 'Next Action'
    estimatedTime = '10m'
    estimateMin = 10
  } else if (/\b(income|revenue|salary|paid to me|dividend|deposit)\b/.test(lower)) {
    category = 'income'
    priority = 'high'
    confidence = 0.93
    hub = 'Capital'
    context = 'Next Action'
    estimatedTime = '15m'
    estimateMin = 15
  } else if (/\b(habit|gym|workout|sleep|water|meditate|stretch|walk|run|vitality|routine)\b/.test(lower)) {
    category = 'habit'
    priority = 'medium'
    confidence = 0.89
    hub = 'Growth'
    context = 'Scheduled'
    estimatedTime = '30m'
    estimateMin = 30
  } else if (/\b(meeting|call with|sync|flight|appointment|dinner with|interview)\b/.test(lower)) {
    category = 'event'
    priority = 'medium'
    confidence = 0.87
    hub = 'Action'
    context = 'Scheduled'
    estimatedTime = '30m'
    estimateMin = 30
  } else if (/\b(idea|note|remember to consider|reading list|article|book|quote|insight|learn)\b/.test(lower)) {
    category = 'note'
    priority = 'low'
    confidence = 0.85
    hub = 'Knowledge'
    context = 'Someday'
    estimatedTime = '20m'
    estimateMin = 20
  } else if (/\b(urgent|asap|critical|due today|tomorrow|renew|deadline)\b/.test(lower)) {
    category = 'task'
    priority = 'high'
    confidence = 0.94
    hub = 'Action'
    context = 'Next Action'
  } else if (/\b(maybe|someday|check out|look into|wishlist|eventually)\b/.test(lower)) {
    category = 'task'
    priority = 'low'
    confidence = 0.82
    hub = 'Action'
    context = 'Someday'
  }

  // 2. Refine GTD Context
  if (/\b(waiting|waiting for|waiting on|pending from|blocked by|delegated)\b/.test(lower)) {
    context = 'Waiting For'
  } else if (/\b(schedule|at \d|tomorrow|friday|monday|tuesday|wednesday|thursday|saturday|sunday|next week|\d{1,2}:\d{2})\b/.test(lower)) {
    context = 'Scheduled'
  } else if (/\b(someday|maybe|later|future|wishlist|eventually)\b/.test(lower)) {
    context = 'Someday'
  }

  // 3. Refine Estimated Duration
  if (/\b(quick|5m|10m|15m|call|email|ping|check|text|reply)\b/.test(lower)) {
    estimatedTime = '15m'
    estimateMin = 15
  } else if (/\b(review|30m|sync|walk|workout|prep)\b/.test(lower)) {
    estimatedTime = '30m'
    estimateMin = 30
  } else if (/\b(draft|write|read|research|study|1h|hour)\b/.test(lower)) {
    estimatedTime = '1h'
    estimateMin = 60
  } else if (/\b(build|code|design|refactor|deep work|project|2h)\b/.test(lower)) {
    estimatedTime = '2h'
    estimateMin = 120
  }

  // Clean, human-readable actionable description with NO brackets or robotic tags
  const cleanSummary = text.trim()
  const cat = category as string
  let reasoning = `Complete action item: ${cleanSummary}.`
  if (cat === 'expense' || cat === 'income') {
    reasoning = `Process financial transaction for ${cleanSummary}.`
  } else if (cat === 'habit') {
    reasoning = `Maintain daily routine and track progress for ${cleanSummary}.`
  } else if (cat === 'event') {
    reasoning = `Attend scheduled event: ${cleanSummary}.`
  } else if (cat === 'note' || cat === 'reference') {
    reasoning = `Review and organize reference material for ${cleanSummary}.`
  }

  return {
    category,
    priority,
    suggestedDue: null,
    confidence,
    model: 'heuristic-engine',
    accepted: null,
    context,
    hub,
    estimatedTime,
    estimateMin,
    reasoning,
  }
}
