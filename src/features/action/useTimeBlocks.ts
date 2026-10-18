import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { repos } from '@/data'
import { TimeBlock } from '@/data/ports/schemas'
import {
  pushBlockToGCal,
  deleteRemoteGCalEvent,
  syncTwoWay,
  isCalendarTokenValid,
} from '@/services/calendar'

export const TIMEBLOCKS_QUERY_KEY = ['timeBlocks']

export function useTimeBlocks(selectedDate?: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (repos.timeBlocks.subscribe) {
      const unsubscribe = repos.timeBlocks.subscribe(() => {
        queryClient.invalidateQueries({ queryKey: TIMEBLOCKS_QUERY_KEY })
      })
      return () => unsubscribe()
    }
  }, [queryClient])

  return useQuery({
    queryKey: selectedDate ? [...TIMEBLOCKS_QUERY_KEY, selectedDate] : TIMEBLOCKS_QUERY_KEY,
    queryFn: async () => {
      const allBlocks = await repos.timeBlocks.list({ orderBy: 'start', orderDirection: 'asc' })
      if (!selectedDate) return allBlocks
      return allBlocks.filter((b) => b.start.startsWith(selectedDate))
    },
  })
}

export function useCreateTimeBlock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (
      newBlock: Omit<TimeBlock, 'id' | 'createdAt' | 'updatedAt' | 'schemaVersion'> & {
        updatedAt?: string
      }
    ) => {
      const now = new Date().toISOString()
      const created = await repos.timeBlocks.create({
        ...newBlock,
        createdAt: now,
        updatedAt: now,
        schemaVersion: 1,
      })

      // Outbound sync to Google Calendar if connected
      if (isCalendarTokenValid() && created.source !== 'gcal') {
        pushBlockToGCal(created)
          .then(() => {
            queryClient.invalidateQueries({ queryKey: TIMEBLOCKS_QUERY_KEY })
          })
          .catch((err) => {
            console.debug('[TimeBlock] Google Calendar sync skipped/failed:', err)
          })
      }

      return created
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TIMEBLOCKS_QUERY_KEY })
    },
  })
}

export function useUpdateTimeBlock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<TimeBlock> }) => {
      const updated = await repos.timeBlocks.update(id, patch)

      // Outbound sync update to Google Calendar
      if (isCalendarTokenValid() && updated.gcal?.eventId) {
        pushBlockToGCal(updated).catch((err) => {
          console.debug('[TimeBlock] GCal update push failed:', err)
        })
      }

      return updated
    },
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: TIMEBLOCKS_QUERY_KEY })
      queryClient.setQueriesData<TimeBlock[]>({ queryKey: TIMEBLOCKS_QUERY_KEY }, (old) => {
        if (!old) return []
        return old.map((b) => (b.id === id ? { ...b, ...patch } : b))
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TIMEBLOCKS_QUERY_KEY })
    },
  })
}

export function useDeleteTimeBlock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const existing = await repos.timeBlocks.get(id)
      if (existing?.gcal?.eventId && isCalendarTokenValid()) {
        deleteRemoteGCalEvent(existing.gcal.eventId).catch((err) => {
          console.debug('[TimeBlock] Remote GCal deletion failed:', err)
        })
      }

      await repos.timeBlocks.remove(id)
      return id
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: TIMEBLOCKS_QUERY_KEY })
      queryClient.setQueriesData<TimeBlock[]>({ queryKey: TIMEBLOCKS_QUERY_KEY }, (old) => {
        if (!old) return []
        return old.filter((b) => b.id !== id)
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TIMEBLOCKS_QUERY_KEY })
    },
  })
}

export function useSyncGoogleCalendar() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (dateStr: string) => {
      return syncTwoWay(dateStr)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TIMEBLOCKS_QUERY_KEY })
    },
  })
}
