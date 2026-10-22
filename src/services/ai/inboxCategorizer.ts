import { getGeminiClient, isGeminiConfigured, DEFAULT_GEMINI_MODEL } from './geminiClient'
import { AICategorizedItem } from './types'
import { classifyInboxItemSync } from '@/features/inbox/mockAiCategorizer'
import { InboxCategory, Priority, EisenhowerQuadrant, InboxContext, Hub } from '@/data/ports/schemas'

const VALID_CATEGORIES: InboxCategory[] = [
  'task',
  'note',
  'expense',
  'income',
  'event',
  'habit',
  'reference',
  'unknown',
]

const VALID_PRIORITIES: Priority[] = ['low', 'medium', 'high']
const VALID_QUADRANTS: EisenhowerQuadrant[] = ['do', 'schedule', 'delegate', 'delete', null]
const VALID_CONTEXTS: InboxContext[] = ['Next Action', 'Waiting For', 'Scheduled', 'Someday']
const VALID_HUBS: Hub[] = ['Action', 'Growth', 'Capital', 'Knowledge']

function cleanJsonResponse(rawText: string): string {
  let cleaned = rawText.trim()
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/```\s*$/, '')
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/```\s*$/, '')
  }
  return cleaned.trim()
}

/**
 * Classifies a single raw inbox text using Gemini AI Studio.
 * Analyzes the text and outputs structured JSON: context, hub, and estimatedTime.
 * Falls back to offline heuristic classifier if no API key is set, on rate-limit, or on network failure.
 */
export async function classifyInboxItemWithAI(
  text: string,
  options: { fallbackToHeuristic?: boolean } = { fallbackToHeuristic: true }
): Promise<AICategorizedItem> {
  const client = getGeminiClient()

  if (!client || !isGeminiConfigured()) {
    if (options.fallbackToHeuristic) {
      const fallback = classifyInboxItemSync(text)
      return {
        category: fallback.category,
        priority: fallback.priority,
        suggestedDue: fallback.suggestedDue || null,
        confidence: fallback.confidence,
        model: 'heuristic (API key not configured)',
        reasoning: fallback.reasoning || 'Classified via offline rule engine.',
        tags: [fallback.category, fallback.hub?.toLowerCase() || 'action'],
        suggestedQuadrant: fallback.category === 'task' ? (fallback.priority === 'high' ? 'do' : 'schedule') : null,
        estimateMin: fallback.estimateMin || 15,
        context: fallback.context,
        hub: fallback.hub,
        estimatedTime: fallback.estimatedTime,
      }
    }
    throw new Error('MISSING_GEMINI_API_KEY: Please provide a Gemini API key in .env.local or settings.')
  }

  const prompt = `You are the OBOiFY Personal Intelligence Assistant.
Analyze this raw user capture and determine its optimal personal productivity classification:
"${text}"

Structured Classification Targets:
1. "context": GTD Context:
   - "Next Action": Immediately actionable task or triage item with no blocker.
   - "Waiting For": Blocked on someone else, delegation, external shipment, response, or dependency.
   - "Scheduled": Tied to a specific calendar date, event, flight, meeting, or firm deadline.
   - "Someday": Backlog idea, leisurely aspiration, maybe later, reading list, non-urgent contemplation.

2. "hub": Target OBOiFY Operating System Hub:
   - "Action": Tasks, GTD workflows, projects, time-blocking, work execution.
   - "Growth": Habit tracking, workouts, health, sleep, nutrition, wellness, routine discipline.
   - "Capital": Invoices, bills, subscriptions, income, expenses, net cash, budgets.
   - "Knowledge": Notes, insights, Zettelkasten ideas, bookmarks, references, learning resources.

3. "estimatedTime": Estimated execution duration formatted as string (e.g. "15m", "30m", "45m", "1h", "2h"). Default "15m".

Additional Metadata:
- "category": "task" | "note" | "expense" | "income" | "event" | "habit" | "reference"
- "priority": "low" | "medium" | "high"
- "suggestedDue": ISO 8601 string (YYYY-MM-DD) if temporal context exists (e.g., "tomorrow", "Friday"), otherwise null.
- "confidence": Number between 0 and 1.
- "reasoning": Clean, human-readable 1-2 sentence actionable description of the task (e.g. "Prepare the quarterly pitch deck slides highlighting key revenue metrics."). Strictly avoid JSON-like brackets, robotic tags (such as [AI Context], [Next Action]), and meta-explanations about hubs or algorithms.
- "tags": Array of 1-3 keywords.
- "suggestedQuadrant": "do" | "schedule" | "delegate" | "delete" | null.
- "estimateMin": integer minutes matching estimatedTime (e.g. 15, 30, 60).

Respond ONLY with valid JSON:
{
  "context": "Next Action" | "Waiting For" | "Scheduled" | "Someday",
  "hub": "Action" | "Growth" | "Capital" | "Knowledge",
  "estimatedTime": "15m" | "30m" | "45m" | "1h" | "2h",
  "category": "task" | "note" | "expense" | "income" | "event" | "habit" | "reference",
  "priority": "low" | "medium" | "high",
  "suggestedDue": string | null,
  "confidence": number,
  "reasoning": string,
  "tags": string[],
  "suggestedQuadrant": "do" | "schedule" | "delegate" | "delete" | null,
  "estimateMin": number
}`

  try {
    const response = await client.models.generateContent({
      model: DEFAULT_GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    })

    const raw = response.text || ''
    const parsed = JSON.parse(cleanJsonResponse(raw))

    const category: InboxCategory = VALID_CATEGORIES.includes(parsed.category)
      ? parsed.category
      : 'task'

    const priority: Priority = VALID_PRIORITIES.includes(parsed.priority)
      ? parsed.priority
      : 'medium'

    const quadrant: EisenhowerQuadrant = VALID_QUADRANTS.includes(parsed.suggestedQuadrant)
      ? parsed.suggestedQuadrant
      : null

    const hub: Hub = VALID_HUBS.includes(parsed.hub)
      ? parsed.hub
      : category === 'expense' || category === 'income'
      ? 'Capital'
      : category === 'habit'
      ? 'Growth'
      : category === 'note' || category === 'reference'
      ? 'Knowledge'
      : 'Action'

    const context: InboxContext = VALID_CONTEXTS.includes(parsed.context)
      ? parsed.context
      : category === 'event' || parsed.suggestedDue
      ? 'Scheduled'
      : 'Next Action'

    const estimatedTime: string =
      typeof parsed.estimatedTime === 'string' && parsed.estimatedTime.trim()
        ? parsed.estimatedTime.trim()
        : '15m'

    // Ensure clean, human-readable description with zero brackets or robotic tags
    let cleanReasoning =
      typeof parsed.reasoning === 'string'
        ? parsed.reasoning.replace(/\[[^\]]*\]/g, '').replace(/\s+/g, ' ').trim()
        : ''
    if (!cleanReasoning) {
      cleanReasoning = `Actionable step: ${text.trim()}`
    }

    return {
      category,
      priority,
      suggestedDue: typeof parsed.suggestedDue === 'string' ? parsed.suggestedDue : null,
      confidence: typeof parsed.confidence === 'number' ? Math.min(Math.max(parsed.confidence, 0), 1) : 0.95,
      model: DEFAULT_GEMINI_MODEL,
      reasoning: cleanReasoning,
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 4).map(String) : [category, hub.toLowerCase()],
      suggestedQuadrant: quadrant,
      estimateMin: typeof parsed.estimateMin === 'number' ? parsed.estimateMin : 15,
      context,
      hub,
      estimatedTime,
    }
  } catch (err: unknown) {
    console.warn('[Gemini AI] Classification error/rate-limit, falling back to heuristic:', err)
    if (options.fallbackToHeuristic) {
      const fallback = classifyInboxItemSync(text)
      return {
        category: fallback.category,
        priority: fallback.priority,
        suggestedDue: fallback.suggestedDue || null,
        confidence: fallback.confidence,
        model: 'heuristic-fallback',
        reasoning: fallback.reasoning || 'AI inference fallback due to network or rate limit.',
        tags: [fallback.category, fallback.hub?.toLowerCase() || 'action'],
        suggestedQuadrant: fallback.category === 'task' ? 'schedule' : null,
        estimateMin: fallback.estimateMin || 15,
        context: fallback.context,
        hub: fallback.hub,
        estimatedTime: fallback.estimatedTime,
      }
    }
    throw err
  }
}

/**
 * Batch classifies multiple inbox items in a single API call to minimize Gemini rate limits.
 */
export async function batchClassifyInboxItems(
  items: Array<{ id: string; text: string }>
): Promise<Map<string, AICategorizedItem>> {
  const result = new Map<string, AICategorizedItem>()
  if (items.length === 0) return result

  const client = getGeminiClient()
  if (!client || !isGeminiConfigured()) {
    for (const item of items) {
      result.set(item.id, await classifyInboxItemWithAI(item.text, { fallbackToHeuristic: true }))
    }
    return result
  }

  const itemsPayload = items.map((i) => ({ id: i.id, text: i.text }))
  const prompt = `You are OBOiFY Personal Intelligence engine.
Classify each of the following inbox items into structured GTD context, hub, and estimated duration.
Return a JSON array of objects with fields:
- id: matches the input id
- context: "Next Action" | "Waiting For" | "Scheduled" | "Someday"
- hub: "Action" | "Growth" | "Capital" | "Knowledge"
- estimatedTime: "15m" | "30m" | "45m" | "1h" | "2h"
- category: "task" | "note" | "expense" | "income" | "event" | "habit" | "reference"
- priority: "low" | "medium" | "high"
- suggestedDue: string (YYYY-MM-DD) or null
- confidence: number between 0 and 1
- reasoning: short 1-sentence rationale
- tags: string array of 1-3 keywords
- suggestedQuadrant: "do" | "schedule" | "delegate" | "delete" | null
- estimateMin: number

Items:
${JSON.stringify(itemsPayload, null, 2)}`

  try {
    const response = await client.models.generateContent({
      model: DEFAULT_GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    })

    const raw = response.text || '[]'
    const list: Array<AICategorizedItem & { id: string }> = JSON.parse(cleanJsonResponse(raw))
    for (const item of list) {
      if (item && item.id) {
        const cat = VALID_CATEGORIES.includes(item.category) ? item.category : 'task'
        const hub = VALID_HUBS.includes(item.hub as any) ? item.hub : 'Action'
        const ctx = VALID_CONTEXTS.includes(item.context as any) ? item.context : 'Next Action'
        const est = item.estimatedTime || '15m'

        result.set(item.id, {
          category: cat,
          priority: VALID_PRIORITIES.includes(item.priority) ? item.priority : 'medium',
          suggestedDue: item.suggestedDue || null,
          confidence: item.confidence ?? 0.92,
          model: DEFAULT_GEMINI_MODEL,
          reasoning: item.reasoning || `Classified as ${hub} [${ctx}]`,
          suggestedQuadrant:
            item.suggestedQuadrant && VALID_QUADRANTS.includes(item.suggestedQuadrant)
              ? item.suggestedQuadrant
              : null,
          estimateMin: item.estimateMin ?? 15,
          context: ctx,
          hub,
          estimatedTime: est,
          tags: Array.isArray(item.tags) ? item.tags : [cat],
        })
      }
    }
  } catch (err) {
    console.warn('[Gemini AI] Batch classification failed, falling back item-by-item:', err)
    for (const item of items) {
      result.set(item.id, await classifyInboxItemWithAI(item.text, { fallbackToHeuristic: true }))
    }
  }

  return result
}
