import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { repos } from '@/data'
import { InboxItem } from '@/data/ports/schemas'
import { classifyInboxItemSync } from './mockAiCategorizer'
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
      const ai = classifyInboxItemSync(text)
      return repos.inbox.create({
        text,
        source,
        status: 'unprocessed',
        ai,
        processedAt: null,
        convertedTo: null,
        schemaVersion: 1,
      })
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

export function useConvertToTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (inboxItem: InboxItem) => {
      // 1. Create GTD Task
      const task = await repos.tasks.create({
        title: inboxItem.text,
        notes: `Converted from Inbox capture (${inboxItem.id})`,
        status: 'draft',
        gtdList: 'next',
        quadrant: null,
        priority: inboxItem.ai?.priority || 'medium',
        dueDate: inboxItem.ai?.suggestedDue || null,
        estimateMin: 15,
        context: ['@computer'],
        tags: ['inbox-capture'],
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
