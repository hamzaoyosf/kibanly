import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { repos } from '@/data'
import { InboxItem } from '@/data/ports/schemas'
import { classifyInboxItemSync } from './mockAiCategorizer'
import {
  classifyInboxItemWithAI,
  batchClassifyInboxItems,
  isGeminiConfigured,
} from '@/services/ai'
import { usePreferencesStore } from '@/app/store/preferencesStore'
import { generateId } from '@/lib/id'

export const INBOX_QUERY_KEY = ['inbox']

export function useInbox() {
  const queryClient = useQueryClient()

  // Subscribe to live repository updates (multi-tab and intra-app mutations)
  useEffect(() => {
    if (repos.inbox.subscribe) {
      const unsubscribe = repos.inbox.subscribe((items) => {
        queryClient.setQueryData(INBOX_QUERY_KEY, items)
      })
      return () => unsubscribe()
    }
  }, [queryClient])

  return useQuery({
    queryKey: INBOX_QUERY_KEY,
    queryFn: () => repos.inbox.list(),
  })
}

export function useCreateInboxItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ text, source = 'quick_capture' }: { text: string; source?: string }) => {
      // 1. Instant local heuristic classification for zero-latency write
      const initialAi = classifyInboxItemSync(text)
      const createdItem = await repos.inbox.create({
        text,
        source,
        status: 'unprocessed',
        ai: initialAi,
        processedAt: null,
        convertedTo: null,
        schemaVersion: 1,
      })

      // 2. If Gemini is configured and AI auto-categorization is enabled, upgrade with live AI inference in the background
      const isAutoCategorizeEnabled = usePreferencesStore.getState?.()?.aiAutoCategorize ?? true
      if (isGeminiConfigured() && isAutoCategorizeEnabled) {
        classifyInboxItemWithAI(text, { fallbackToHeuristic: false })
          .then(async (aiResult) => {
            await repos.inbox.update(createdItem.id, {
              ai: {
                category: aiResult.category,
                priority: aiResult.priority,
                suggestedDue: aiResult.suggestedDue || null,
                confidence: aiResult.confidence,
                model: aiResult.model,
                accepted: null,
                reasoning: aiResult.reasoning,
                tags: aiResult.tags,
                suggestedQuadrant: aiResult.suggestedQuadrant,
                estimateMin: aiResult.estimateMin,
              },
            })
            queryClient.invalidateQueries({ queryKey: INBOX_QUERY_KEY })
          })
          .catch((err) => {
            console.debug('[Inbox] Background Gemini classification skipped/failed:', err)
          })
      }

      return createdItem
    },
    // Sub-100ms optimistic cache update (SRS FR-INB-02)
    onMutate: async (newCapture) => {
      await queryClient.cancelQueries({ queryKey: INBOX_QUERY_KEY })
      const previousItems = queryClient.getQueryData<InboxItem[]>(INBOX_QUERY_KEY) || []

      const optimisticItem: InboxItem = {
        id: generateId('inb_opt'),
        text: newCapture.text,
        source: newCapture.source || 'quick_capture',
        status: 'unprocessed',
        ai: classifyInboxItemSync(newCapture.text),
        createdAt: new Date().toISOString(),
        processedAt: null,
        convertedTo: null,
        schemaVersion: 1,
      }

      queryClient.setQueryData<InboxItem[]>(INBOX_QUERY_KEY, [optimisticItem, ...previousItems])

      return { previousItems }
    },
    onError: (_err, _newCapture, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(INBOX_QUERY_KEY, context.previousItems)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: INBOX_QUERY_KEY })
    },
  })
}

export function useAICategorizeInboxItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ itemId, text }: { itemId: string; text: string }) => {
      const result = await classifyInboxItemWithAI(text, { fallbackToHeuristic: false })
      await repos.inbox.update(itemId, {
        ai: {
          category: result.category,
          priority: result.priority,
          suggestedDue: result.suggestedDue || null,
          confidence: result.confidence,
          model: result.model,
          accepted: true,
          reasoning: result.reasoning,
          tags: result.tags,
          suggestedQuadrant: result.suggestedQuadrant,
          estimateMin: result.estimateMin,
        },
      })
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INBOX_QUERY_KEY })
    },
  })
}

export function useBatchAICategorizeInbox() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (items: Array<{ id: string; text: string }>) => {
      const results = await batchClassifyInboxItems(items)
      for (const [id, result] of results.entries()) {
        await repos.inbox.update(id, {
          ai: {
            category: result.category,
            priority: result.priority,
            suggestedDue: result.suggestedDue || null,
            confidence: result.confidence,
            model: result.model,
            accepted: true,
            reasoning: result.reasoning,
            tags: result.tags,
            suggestedQuadrant: result.suggestedQuadrant,
            estimateMin: result.estimateMin,
          },
        })
      }
      return results
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INBOX_QUERY_KEY })
    },
  })
}

export function useConvertToTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (inboxItem: InboxItem) => {
      const ai = inboxItem.ai

      // 1. Create GTD Task with rich AI context
      const task = await repos.tasks.create({
        title: inboxItem.text,
        notes: ai?.reasoning
          ? `[AI Context]: ${ai.reasoning}\nConverted from Inbox capture (${inboxItem.id})`
          : `Converted from Inbox capture (${inboxItem.id})`,
        status: 'draft',
        gtdList: 'next',
        quadrant: ai?.suggestedQuadrant || (ai?.priority === 'high' ? 'do' : null),
        priority: ai?.priority || 'medium',
        dueDate: ai?.suggestedDue || null,
        estimateMin: ai?.estimateMin || 15,
        context: ['@computer'],
        tags: ai?.tags && ai.tags.length > 0 ? ai.tags : ['inbox-capture'],
        projectId: null,
        areaId: null,
        waitingFor: null,
        subtasks: [],
        calendarEventId: null,
        order: 1000,
        completedAt: null,
        schemaVersion: 1,
      })

      // 2. Mark Inbox Item as processed
      const updatedInbox = await repos.inbox.update(inboxItem.id, {
        status: 'processed',
        processedAt: new Date().toISOString(),
        convertedTo: { type: 'task', id: task.id },
      })

      return { task, updatedInbox }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INBOX_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export function useDeleteInboxItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      return repos.inbox.update(id, { status: 'trashed' })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INBOX_QUERY_KEY })
    },
  })
}
