/**
 * 💾 useAutoBackup - Автоматическое резервное копирование при закрытии вкладки
 * 
 * Использует beforeunload event для сохранения данных в IndexedDB
 * перед закрытием браузера.
 */

import { useEffect, useCallback } from 'react'
import { backupManager } from '../utils/backupManager'
import { useEntriesStore } from '../store/useEntriesStore'
import { useSettingsStore } from '../store/useSettingsStore'

/**
 * Хук для автоматического бекапа при закрытии вкладки
 */
export function useAutoBackup() {
  const entries = useEntriesStore((state) => state.entries)
  const categories = useSettingsStore((state) => state.categories)

  const saveBackup = useCallback(async () => {
    if (entries.length === 0) {
      // Нет данных для сохранения
      return
    }

    try {
      await backupManager.saveBackup({
        entries,
        categories, // ✅ FIX: сохраняем категории вместе с записями
        timestamp: Date.now(),
        version: 1,
      })
      console.log('💾 Автобекап создан при закрытии вкладки (с категориями)')
    } catch (error) {
      console.error('❌ Ошибка создания автобекапа:', error)
    }
  }, [entries, categories])

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // Сохраняем бекап синхронно (через sendBeacon нельзя использовать IndexedDB)
      // Поэтому используем localStorage как fallback для быстрого сохранения
      try {
        const backupData = {
          entries,
          timestamp: Date.now(),
          version: 1,
        }
        localStorage.setItem('time-tracker-last-session-backup', JSON.stringify(backupData))
      } catch (e) {
        console.warn('Не удалось создать session backup:', e)
      }
    }

    const handleVisibilityChange = () => {
      // Создаём бекап когда вкладка становится скрытой
      if (document.visibilityState === 'hidden' && entries.length > 0) {
        saveBackup()
      }
    }

    // beforeunload для закрытия вкладки
    window.addEventListener('beforeunload', handleBeforeUnload)
    // visibilitychange для более надёжного бекапа
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [entries, saveBackup])

  return {
    saveBackup,
  }
}

/**
 * Восстанавливает последнюю сессию из localStorage (если нужно)
 */
export function getLastSessionBackup(): { entries: unknown[]; timestamp: number } | null {
  try {
    const stored = localStorage.getItem('time-tracker-last-session-backup')
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.warn('Ошибка чтения session backup:', e)
  }
  return null
}

/**
 * Очищает backup последней сессии
 */
export function clearLastSessionBackup(): void {
  try {
    localStorage.removeItem('time-tracker-last-session-backup')
  } catch (e) {
    console.warn('Ошибка удаления session backup:', e)
  }
}
