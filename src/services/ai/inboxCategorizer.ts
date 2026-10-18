import { getGeminiClient, isGeminiConfigured, DEFAULT_GEMINI_MODEL } from './geminiClient'
import { AICategorizedItem } from './types'
import { classifyInboxItemSync } from '@/features/inbox/mockAiCategorizer'
import { InboxCategory, Priority, EisenhowerQuadrant } from '@/data/ports/schemas'

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
 * Falls back to offline heuristic classifier if no API key is set or on network failure
 * when fallbackToHeuristic is true.
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
        reasoning: 'Classified via offline rule engine. Add Gemini API key for deep reasoning.',
        tags: [fallback.category],
        suggestedQuadrant: fallback.category === 'task' ? (fallback.priority === 'high' ? 'do' : 'schedule') : null,
        estimateMin: fallback.category === 'task' ? 15 : undefined,
      }
    }
    throw new Error('MISSING_GEMINI_API_KEY: Please provide a Gemini API key in .env.local or settings.')
  }

  const prompt = `You are the OBOiFY Personal Intelligence Assistant.
Analyze this raw user capture and determine its optimal personal productivity classification:
"${text}"

Categories:
- "task": Actionable todo or GTD action.
- "note": An insight, thought, reflection, quote, or fleeting knowledge idea.
- "expense": Money spent, invoice, bill, subscription renewal, price paid.
- "income": Money received, salary, payment, dividend.
- "event": Fixed calendar meeting, appointment, flight, call with someone at a specific time.
- "habit": A recurring routine, wellness practice, daily discipline (e.g. workout, water, meditation, journal).
- "reference": Bookmark, book title, article link, technical doc.

Priorities:
- "high": Critical, immediate deadline, high stakes.
- "medium": Standard next action.
- "low": Someday/maybe, leisurely, optional.

Eisenhower Quadrant (if category is task):
- "do": Urgent and important (Q1)
- "schedule": Important but not urgent (Q2)
- "delegate": Urgent but not important (Q3)
- "delete": Neither urgent nor important (Q4)

Estimated minutes: duration (e.g. 15, 30, 45, 60). Default 15.
Suggested due date: ISO 8601 (YYYY-MM-DD) if temporal clues exist (e.g. "tomorrow", "Friday"), otherwise null.

Respond ONLY with valid JSON:
{
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

    return {
      category,
      priority,
      suggestedDue: typeof parsed.suggestedDue === 'string' ? parsed.suggestedDue : null,
      confidence: typeof parsed.confidence === 'number' ? Math.min(Math.max(parsed.confidence, 0), 1) : 0.92,
      model: DEFAULT_GEMINI_MODEL,
      reasoning: parsed.reasoning || 'Categorized by Gemini AI',
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 4).map(String) : [category],
      suggestedQuadrant: quadrant,
      estimateMin: typeof parsed.estimateMin === 'number' ? parsed.estimateMin : 15,
    }
  } catch (err: unknown) {
    console.warn('[Gemini AI] Classification error, falling back:', err)
    if (options.fallbackToHeuristic) {
      const fallback = classifyInboxItemSync(text)
      return {
        category: fallback.category,
        priority: fallback.priority,
        suggestedDue: fallback.suggestedDue || null,
        confidence: fallback.confidence,
        model: 'heuristic-fallback',
        reasoning: 'AI inference fallback due to network or rate limit.',
        tags: [fallback.category],
        suggestedQuadrant: fallback.category === 'task' ? 'schedule' : null,
        estimateMin: 15,
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
Classify each of the following inbox items. Return a JSON array of objects with fields:
- id: matches the input id
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
        result.set(item.id, {
          category: VALID_CATEGORIES.includes(item.category) ? item.category : 'task',
          priority: VALID_PRIORITIES.includes(item.priority) ? item.priority : 'medium',
          suggestedDue: item.suggestedDue || null,
          confidence: item.confidence ?? 0.9,
          model: DEFAULT_GEMINI_MODEL,
          reasoning: item.reasoning,
          suggestedQuadrant: item.suggestedQuadrant && VALID_QUADRANTS.includes(item.suggestedQuadrant) ? item.suggestedQuadrant : null,
          estimateMin: item.estimateMin ?? 15,
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
