/**
 * Хук для автосинхронизации данных
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
import { useNotifications, useAddNotification, useRemoveNotification } from '../store/useUIStore'
import { logger } from '../utils/logger'
import type { TimeEntry, Category } from '../types'

declare global {
  interface Window {
    safeReload?: () => void
  }
}

interface BackupData {
  entries: TimeEntry[]
  categories: Category[]
  settings: {
    theme: string
    notifications: unknown
  }
  version: string
}

interface Backup {
  id: number
  type: string
  timestamp: string
  data: BackupData
}

interface UseAutoSyncOptions {
  enabled?: boolean
  interval?: number
  backupInterval?: number
  maxBackups?: number
  syncBetweenTabs?: boolean
}

interface UseAutoSyncReturn {
  performSync: () => void
  createManualBackup: (type?: string) => void
  getBackups: () => Backup[]
  loadBackup: (backupId: number) => Backup | null
  restoreFromBackup: (backupId: number) => boolean
  cleanupOldBackups: (olderThan?: number) => void
  exportBackups: () => string | null
  importBackups: (jsonData: string) => boolean
  lastSync: number
  lastBackup: number
  isSyncing: boolean
}

export function useAutoSync(options: UseAutoSyncOptions = {}): UseAutoSyncReturn {
  const {
    enabled = true,
    interval = 30000,
    backupInterval = 300000,
    maxBackups = 10,
    syncBetweenTabs = true,
  } = options

  const entries = useEntries() as TimeEntry[]
  const importEntries = useImportEntries()

  const theme = useTheme()
  const categories = useCategories() as Category[]
  const setTheme = useSetTheme()
  const updateSettings = useUpdateSettings()
  const notifications = useNotifications()
  const addNotification = useAddNotification()

  const lastSyncRef = useRef<number>(Date.now())
  const lastBackupRef = useRef<number>(Date.now())
  const isSyncingRef = useRef<boolean>(false)

  const createBackup = useCallback(
    (type: string = 'auto'): Backup => {
      const backup: Backup = {
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

  const saveBackup = useCallback(
    (backup: Backup): void => {
      try {
        const backups: Backup[] = JSON.parse(localStorage.getItem('time-tracker-backups') || '[]')

        backups.push(backup)

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

  const loadBackup = useCallback((backupId: number): Backup | null => {
    try {
      const backups: Backup[] = JSON.parse(localStorage.getItem('time-tracker-backups') || '[]')
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

  const getBackups = useCallback((): Backup[] => {
    try {
      const backups: Backup[] = JSON.parse(localStorage.getItem('time-tracker-backups') || '[]')
      return backups.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    } catch (error) {
      logger.error('Ошибка получения резервных копий:', error)
      return []
    }
  }, [])

  const restoreFromBackup = useCallback(
    (backupId: number): boolean => {
      try {
        const backup = loadBackup(backupId)

        if (!backup) {
          logger.error('Резервная копия не найдена')
          return false
        }

        const { data } = backup

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

  const setupTabSync = useCallback((): (() => void) | undefined => {
    const isPromoPage = window.location.pathname.includes('/promo/')
    const hasVersion = import.meta.env.VITE_BUILD_VERSION && String(import.meta.env.VITE_BUILD_VERSION).trim() !== ''

    if (!syncBetweenTabs || isPromoPage || !hasVersion) {
      return
    }

    const RELOAD_COOLDOWN = 10000
    const MAX_RELOADS_PER_MINUTE = 2
    const INITIAL_BLOCK_TIME = 10000

    const getReloadHistory = (): number[] => {
      try {
        const history = sessionStorage.getItem('reload-history')
        return history ? JSON.parse(history) : []
      } catch {
        return []
      }
    }

    const addReloadToHistory = (): void => {
      try {
        const history = getReloadHistory()
        const now = Date.now()
        const recentHistory = history.filter(time => now - time < 60000)
        recentHistory.push(now)
        sessionStorage.setItem('reload-history', JSON.stringify(recentHistory))
      } catch {
        // Ignore
      }
    }

    const pageLoadTime = Date.now()

    const handleStorageChange = (event: StorageEvent): void => {
      if (event.key?.startsWith('time-tracker-')) {
        const now = Date.now()

        if (now - pageLoadTime < INITIAL_BLOCK_TIME) {
          return
        }

        if (event.newValue === null || event.oldValue === null) {
          return
        }

        if (event.newValue === event.oldValue) {
          return
        }

        if (event.storageArea === window.localStorage) {
          return
        }

        const history = getReloadHistory()

        if (history.length > 0) {
          const lastReload = history[history.length - 1]
          if (now - lastReload < RELOAD_COOLDOWN) {
            return
          }
        }

        if (history.length >= MAX_RELOADS_PER_MINUTE) {
          return
        }

        logger.log('🔄 Обнаружены изменения в другой вкладке')

        addReloadToHistory()
        if (window.safeReload) {
          window.safeReload()
        } else {
          window.location.reload()
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [syncBetweenTabs])

  const performSync = useCallback((): void => {
    if (isSyncingRef.current) return

    isSyncingRef.current = true

    try {
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

  const createManualBackup = useCallback(
    (type: string = 'manual'): void => {
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

  const cleanupOldBackups = useCallback(
    (olderThan: number = 7 * 24 * 60 * 60 * 1000): void => {
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

  const exportBackups = useCallback((): string | null => {
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

  const importBackups = useCallback(
    (jsonData: string): boolean => {
      try {
        const importData = JSON.parse(jsonData)

        if (!importData.backups || !Array.isArray(importData.backups)) {
          throw new Error('Неверный формат данных')
        }

        const existingBackups = getBackups()
        const mergedBackups = [...existingBackups, ...importData.backups]

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

  useEffect(() => {
    if (!enabled) return

    const intervalId = setInterval(performSync, interval)

    return () => {
      clearInterval(intervalId)
    }
  }, [enabled, interval, performSync])

  useEffect(() => {
    let cleanup: (() => void) | undefined
    const delay = setTimeout(() => {
      cleanup = setupTabSync()
    }, 3000)

    return () => {
      clearTimeout(delay)
      if (cleanup) {
        cleanup()
      }
    }
  }, [setupTabSync])

  useEffect(() => {
    if (enabled) {
      performSync()
    }
  }, [entries.length, categories.length, theme, enabled, performSync])

  return {
    performSync,
    createManualBackup,
    getBackups,
    loadBackup,
    restoreFromBackup,
    cleanupOldBackups,
    exportBackups,
    importBackups,
    lastSync: lastSyncRef.current,
    lastBackup: lastBackupRef.current,
    isSyncing: isSyncingRef.current,
  }
}
