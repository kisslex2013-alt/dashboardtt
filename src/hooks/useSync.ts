/**
 * Хук для синхронизации данных между вкладками
 */

import { useEffect, useRef } from 'react'
import { syncManager, SyncMessageType } from '../utils/syncManager'
import { useEntriesStore } from '../store/useEntriesStore'
import type { TimeEntry } from '../types'

interface UpdateData {
  id: string | number
  updates: Partial<TimeEntry>
}

interface DeleteData {
  id: string | number
}

interface BulkUpdateData {
  type: 'delete' | 'update'
  entryIds: (string | number)[]
  categoryId?: string
}

/**
 * Хук для синхронизации данных между вкладками
 * Оптимизирован для минимального влияния на производительность
 */
export function useSync(): void {
  const storeRef = useRef<ReturnType<typeof useEntriesStore.getState> | null>(null)

  useEffect(() => {
    if (!storeRef.current) {
      storeRef.current = useEntriesStore.getState()
    }

    if (!syncManager.isAvailable()) {
      return
    }

    const syncAddEntry = (entry: TimeEntry): void => {
      const state = useEntriesStore.getState()
      const exists = state.entries.some((e: TimeEntry) => String(e.id) === String(entry.id))
      if (!exists) {
        useEntriesStore.setState((prev: { entries: TimeEntry[] }) => ({
          entries: [...prev.entries, entry],
        }))
      }
    }

    const syncUpdateEntry = ({ id, updates }: UpdateData): void => {
      const idString = String(id)
      useEntriesStore.setState((prev: { entries: TimeEntry[] }) => ({
        entries: prev.entries.map((entry: TimeEntry) => {
          const entryIdString = String(entry.id)
          return entryIdString === idString
            ? {
                ...entry,
                ...updates,
                earned:
                  typeof updates.earned === 'number'
                    ? updates.earned
                    : parseFloat(String(updates.earned)) || entry.earned,
                updatedAt: new Date().toISOString(),
              }
            : entry
        }),
      }))
    }

    const syncDeleteEntry = ({ id }: DeleteData): void => {
      const idString = String(id)
      useEntriesStore.setState((prev: { entries: TimeEntry[] }) => ({
        entries: prev.entries.filter((entry: TimeEntry) => String(entry.id) !== idString),
      }))
    }

    const syncClearEntries = (): void => {
      useEntriesStore.setState({ entries: [] })
    }

    const syncBulkUpdate = (data: BulkUpdateData): void => {
      if (data.type === 'delete') {
        const entryIdsStrings = data.entryIds.map(id => String(id))
        useEntriesStore.setState((prev: { entries: TimeEntry[] }) => ({
          entries: prev.entries.filter((entry: TimeEntry) => !entryIdsStrings.includes(String(entry.id))),
        }))
      } else {
        const entryIdsStrings = data.entryIds.map(id => String(id))
        useEntriesStore.setState((prev: { entries: TimeEntry[] }) => ({
          entries: prev.entries.map((entry: TimeEntry) =>
            entryIdsStrings.includes(String(entry.id))
              ? {
                  ...entry,
                  category: data.categoryId || entry.category,
                  categoryId: data.categoryId,
                  updatedAt: new Date().toISOString(),
                }
              : entry
          ),
        }))
      }
    }

    const unsubscribeEntryAdded = syncManager.subscribe(SyncMessageType.ENTRY_ADDED, syncAddEntry)
    const unsubscribeEntryUpdated = syncManager.subscribe(SyncMessageType.ENTRY_UPDATED, syncUpdateEntry)
    const unsubscribeEntryDeleted = syncManager.subscribe(SyncMessageType.ENTRY_DELETED, syncDeleteEntry)
    const unsubscribeEntriesCleared = syncManager.subscribe(SyncMessageType.ENTRIES_CLEARED, syncClearEntries)
    const unsubscribeEntriesBulkUpdate = syncManager.subscribe(SyncMessageType.ENTRIES_BULK_UPDATE, syncBulkUpdate)

    return () => {
      unsubscribeEntryAdded()
      unsubscribeEntryUpdated()
      unsubscribeEntryDeleted()
      unsubscribeEntriesCleared()
      unsubscribeEntriesBulkUpdate()
    }
  }, [])
}
