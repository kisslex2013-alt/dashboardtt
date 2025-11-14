/**
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 *
 * Этот хук обеспечивает автосинхронизацию данных:
 * - Автоматически сохраняет изменения в localStorage
 * - Создает резервные копии данных
 * - Синхронизирует данные между вкладками
 * - Восстанавливает данные при загрузке
 */

import { useEffect, useCallback, useRef } from 'react'
import {
  useEntries,
  useAddEntry,
  useUpdateEntry,
  useDeleteEntry,
  useClearEntries,
  useImportEntries,
} from '../store/useEntriesStore'
import {
  useTheme,
  useCategories,
  useSetTheme,
  useUpdateSettings,
} from '../store/useSettingsStore'
import { useUIStore } from '../store/useUIStore'
import { logger } from '../utils/logger'

/**
 * Хук для автосинхронизации данных
 * @param {Object} options - опции синхронизации
 * @returns {Object} объект с методами управления синхронизацией
 */
export function useAutoSync(options = {}) {
  const {
    enabled = true,
    interval = 30000, // 30 секунд
    backupInterval = 300000, // 5 минут
    maxBackups = 10,
    syncBetweenTabs = true,
  } = options

  // ✅ ОПТИМИЗАЦИЯ: Используем атомарные селекторы для минимизации ре-рендеров
  const entries = useEntries()
  const addEntry = useAddEntry()
  const updateEntry = useUpdateEntry()
  const deleteEntry = useDeleteEntry()
  const clearEntries = useClearEntries()
  const importEntries = useImportEntries()
  
  const theme = useTheme()
  const categories = useCategories()
  const setTheme = useSetTheme()
  const updateSettings = useUpdateSettings()
  const { notifications, addNotification, removeNotification } = useUIStore()

  const lastSyncRef = useRef(Date.now())
  const lastBackupRef = useRef(Date.now())
  const isSyncingRef = useRef(false)

  /**
   * Создает резервную копию данных
   * @param {string} type - тип резервной копии
   * @returns {Object} данные для резервной копии
   */
  const createBackup = useCallback(
    (type = 'auto') => {
      const backup = {
        id: Date.now(),
        type,
        timestamp: new Date().toISOString(),
        data: {
          entries: [...entries],
          categories: [...categories],
          settings: { theme, notifications },
          version: '1.0',
        },
      }

      return backup
    },
    [entries, categories, theme, notifications]
  )

  /**
   * Сохраняет резервную копию в localStorage
   * @param {Object} backup - данные резервной копии
   */
  const saveBackup = useCallback(
    backup => {
      try {
        const backups = JSON.parse(localStorage.getItem('time-tracker-backups') || '[]')

        // Добавляем новую резервную копию
        backups.push(backup)

        // Удаляем старые резервные копии если превышен лимит
        if (backups.length > maxBackups) {
          backups.splice(0, backups.length - maxBackups)
        }

        localStorage.setItem('time-tracker-backups', JSON.stringify(backups))
        logger.log(`💾 Резервная копия сохранена: ${backup.type}`)
      } catch (error) {
        logger.error('Ошибка сохранения резервной копии:', error)
      }
    },
    [maxBackups]
  )

  /**
   * Загружает резервную копию из localStorage
   * @param {number} backupId - ID резервной копии
   * @returns {Object|null} данные резервной копии
   */
  const loadBackup = useCallback(backupId => {
    try {
      const backups = JSON.parse(localStorage.getItem('time-tracker-backups') || '[]')
      const backup = backups.find(b => b.id === backupId)

      if (backup) {
        logger.log(`💾 Резервная копия загружена: ${backup.type}`)
        return backup
      }

      return null
    } catch (error) {
      logger.error('Ошибка загрузки резервной копии:', error)
      return null
    }
  }, [])

  /**
   * Получает список всех резервных копий
   * @returns {Array} массив резервных копий
   */
  const getBackups = useCallback(() => {
    try {
      const backups = JSON.parse(localStorage.getItem('time-tracker-backups') || '[]')
      return backups.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    } catch (error) {
      logger.error('Ошибка получения резервных копий:', error)
      return []
    }
  }, [])

  /**
   * Восстанавливает данные из резервной копии
   * @param {number} backupId - ID резервной копии
   * @returns {boolean} true если восстановление успешно
   */
  const restoreFromBackup = useCallback(
    backupId => {
      try {
        const backup = loadBackup(backupId)

        if (!backup) {
          logger.error('Резервная копия не найдена')
          return false
        }

        const { data } = backup

        // Восстанавливаем данные
        if (data.entries) {
          importEntries(data.entries)
        }

        if (data.categories) {
          updateSettings({ categories: data.categories })
        }

        if (data.settings) {
          if (data.settings.theme) {
            setTheme(data.settings.theme)
          }
          if (data.settings.notifications) {
            updateSettings({ notifications: data.settings.notifications })
          }
        }

        logger.log(`💾 Данные восстановлены из резервной копии: ${backup.type}`)
        return true
      } catch (error) {
        logger.error('Ошибка восстановления из резервной копии:', error)
        return false
      }
    },
    [importEntries, updateSettings, setTheme, loadBackup]
  )

  /**
   * Синхронизирует данные между вкладками
   */
  const setupTabSync = useCallback(() => {
    if (!syncBetweenTabs) return

    const handleStorageChange = event => {
      if (event.key?.startsWith('time-tracker-')) {
        logger.log('🔄 Обнаружены изменения в другой вкладке')

        // Перезагружаем данные из localStorage
        window.location.reload()
      }
    }

    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [syncBetweenTabs])

  /**
   * Выполняет синхронизацию данных
   */
  const performSync = useCallback(() => {
    if (isSyncingRef.current) return

    isSyncingRef.current = true

    try {
      // Создаем резервную копию если прошло достаточно времени
      const now = Date.now()
      if (now - lastBackupRef.current > backupInterval) {
        const backup = createBackup('auto')
        saveBackup(backup)
        lastBackupRef.current = now
      }

      lastSyncRef.current = now
      logger.log('🔄 Синхронизация выполнена')
    } catch (error) {
      logger.error('Ошибка синхронизации:', error)
    } finally {
      isSyncingRef.current = false
    }
  }, [backupInterval, createBackup, saveBackup])

  /**
   * Принудительно создает резервную копию
   * @param {string} type - тип резервной копии
   */
  const createManualBackup = useCallback(
    (type = 'manual') => {
      const backup = createBackup(type)
      saveBackup(backup)
      lastBackupRef.current = Date.now()

      addNotification({
        message: `Резервная копия создана: ${type}`,
        type: 'success',
        duration: 3000,
      })
    },
    [createBackup, saveBackup, addNotification]
  )

  /**
   * Очищает старые резервные копии
   * @param {number} olderThan - удалить копии старше этого времени (в миллисекундах)
   */
  const cleanupOldBackups = useCallback(
    (olderThan = 7 * 24 * 60 * 60 * 1000) => {
      // 7 дней
      try {
        const backups = getBackups()
        const cutoffTime = Date.now() - olderThan

        const filteredBackups = backups.filter(backup => {
          return new Date(backup.timestamp).getTime() > cutoffTime
        })

        localStorage.setItem('time-tracker-backups', JSON.stringify(filteredBackups))

        const removedCount = backups.length - filteredBackups.length
        if (removedCount > 0) {
          logger.log(`🗑️ Удалено ${removedCount} старых резервных копий`)
        }
      } catch (error) {
        logger.error('Ошибка очистки резервных копий:', error)
      }
    },
    [getBackups]
  )

  /**
   * Экспортирует все резервные копии
   * @returns {string} JSON строка с резервными копиями
   */
  const exportBackups = useCallback(() => {
    try {
      const backups = getBackups()
      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        backups,
      }

      return JSON.stringify(exportData, null, 2)
    } catch (error) {
      logger.error('Ошибка экспорта резервных копий:', error)
      return null
    }
  }, [getBackups])

  /**
   * Импортирует резервные копии
   * @param {string} jsonData - JSON строка с резервными копиями
   * @returns {boolean} true если импорт успешен
   */
  const importBackups = useCallback(
    jsonData => {
      try {
        const importData = JSON.parse(jsonData)

        if (!importData.backups || !Array.isArray(importData.backups)) {
          throw new Error('Неверный формат данных')
        }

        const existingBackups = getBackups()
        const mergedBackups = [...existingBackups, ...importData.backups]

        // Сортируем по времени и ограничиваем количество
        const sortedBackups = mergedBackups
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, maxBackups)

        localStorage.setItem('time-tracker-backups', JSON.stringify(sortedBackups))

        logger.log(`📥 Импортировано ${importData.backups.length} резервных копий`)
        return true
      } catch (error) {
        logger.error('Ошибка импорта резервных копий:', error)
        return false
      }
    },
    [getBackups, maxBackups]
  )

  // Автоматическая синхронизация
  useEffect(() => {
    if (!enabled) return

    const intervalId = setInterval(performSync, interval)

    return () => {
      clearInterval(intervalId)
    }
  }, [enabled, interval, performSync])

  // Синхронизация между вкладками
  useEffect(() => {
    return setupTabSync()
  }, [setupTabSync])

  // Синхронизация при изменении данных
  useEffect(() => {
    if (enabled) {
      performSync()
    }
  }, [entries.length, categories.length, theme, enabled, performSync])

  return {
    // Основные методы
    performSync,
    createManualBackup,

    // Резервные копии
    getBackups,
    loadBackup,
    restoreFromBackup,
    cleanupOldBackups,

    // Экспорт/Импорт
    exportBackups,
    importBackups,

    // Информация
    lastSync: lastSyncRef.current,
    lastBackup: lastBackupRef.current,
    isSyncing: isSyncingRef.current,
  }
}
