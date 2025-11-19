/**
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 *
 * Этот хук подписывается на синхронизацию между вкладками.
 * ⚠️ ВАЖНО: Работает только с stores, не вызывает ре-рендеры UI компонентов.
 * Использует useRef для хранения функций, чтобы избежать лишних эффектов.
 */

import { useEffect, useRef } from 'react'
import { syncManager, SyncMessageType } from '../utils/syncManager'
import { useEntriesStore } from '../store/useEntriesStore'
import { logger } from '../utils/logger'

/**
 * Хук для синхронизации данных между вкладками
 * Оптимизирован для минимального влияния на производительность
 */
export function useSync() {
  // Используем useRef для хранения функций, чтобы не вызывать лишние эффекты
  const storeRef = useRef(null)

  useEffect(() => {
    // Получаем store один раз
    if (!storeRef.current) {
      storeRef.current = useEntriesStore.getState()
    }

    if (!syncManager.isAvailable()) {
      return
    }

    // Создаем sync-методы, которые не отправляют сообщения обратно
    const syncAddEntry = entry => {
      const state = useEntriesStore.getState()
      const exists = state.entries.some(e => String(e.id) === String(entry.id))
      if (!exists) {
        useEntriesStore.setState(prev => ({
          entries: [...prev.entries, entry],
        }))
      }
    }

    const syncUpdateEntry = ({ id, updates }) => {
      const idString = String(id)
      useEntriesStore.setState(prev => ({
        entries: prev.entries.map(entry => {
          const entryIdString = String(entry.id)
          return entryIdString === idString
            ? {
                ...entry,
                ...updates,
                earned:
                  typeof updates.earned === 'number'
                    ? updates.earned
                    : parseFloat(updates.earned) || entry.earned,
                updatedAt: new Date().toISOString(),
              }
            : entry
        }),
      }))
    }

    const syncDeleteEntry = ({ id }) => {
      const idString = String(id)
      useEntriesStore.setState(prev => ({
        entries: prev.entries.filter(entry => String(entry.id) !== idString),
      }))
    }

    const syncClearEntries = () => {
      useEntriesStore.setState({ entries: [] })
    }

    const syncBulkUpdate = data => {
      if (data.type === 'delete') {
        const entryIdsStrings = data.entryIds.map(id => String(id))
        useEntriesStore.setState(prev => ({
          entries: prev.entries.filter(entry => !entryIdsStrings.includes(String(entry.id))),
        }))
      } else {
        const entryIdsStrings = data.entryIds.map(id => String(id))
        useEntriesStore.setState(prev => ({
          entries: prev.entries.map(entry =>
            entryIdsStrings.includes(String(entry.id))
              ? {
                  ...entry,
                  category: data.categoryId,
                  categoryId: data.categoryId,
                  updatedAt: new Date().toISOString(),
                }
              : entry
          ),
        }))
      }
    }

    // Подписываемся на события
    const unsubscribeEntryAdded = syncManager.subscribe(SyncMessageType.ENTRY_ADDED, syncAddEntry)
    const unsubscribeEntryUpdated = syncManager.subscribe(
      SyncMessageType.ENTRY_UPDATED,
      syncUpdateEntry
    )
    const unsubscribeEntryDeleted = syncManager.subscribe(
      SyncMessageType.ENTRY_DELETED,
      syncDeleteEntry
    )
    const unsubscribeEntriesCleared = syncManager.subscribe(
      SyncMessageType.ENTRIES_CLEARED,
      syncClearEntries
    )
    const unsubscribeEntriesBulkUpdate = syncManager.subscribe(
      SyncMessageType.ENTRIES_BULK_UPDATE,
      syncBulkUpdate
    )

    // Cleanup
    return () => {
      unsubscribeEntryAdded()
      unsubscribeEntryUpdated()
      unsubscribeEntryDeleted()
      unsubscribeEntriesCleared()
      unsubscribeEntriesBulkUpdate()
    }
  }, []) // Пустой массив зависимостей - эффект выполняется только один раз
}
