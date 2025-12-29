/**
 * 💾 BackupsTab Component
 *
 * Вкладка управления резервными копиями данных.
 * Позволяет создавать, восстанавливать и удалять резервные копии.
 */

import { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react'
import { HardDrive, Upload, Trash2, Archive, Folder, Clock } from '../../../utils/icons'
import { Button } from '../../ui/Button'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'
import { backupManager } from '../../../utils/backupManager'
import { useCreateManualBackup, useRestoreFromBackup } from '../../../store/useEntriesStore'
import { useConfirmModal } from '../../../hooks/useConfirmModal'
import { ConfirmModal } from '../../modals/ConfirmModal'
import { handleError } from '../../../utils/errorHandler'
import { logger } from '../../../utils/logger'
import { useNotifications } from '../../../hooks/useNotifications'
import { useShowSuccess } from '../../../store/useUIStore'

interface BackupListItem {
  timestamp: number
  entriesCount: number
}

export function BackupsTab() {
  const createManualBackup = useCreateManualBackup()
  const restoreFromBackup = useRestoreFromBackup()
  const { showWarning, showError } = useNotifications()
  const showSuccess = useShowSuccess()

  const [backups, setBackups] = useState<BackupListItem[]>([])
  const [loadingBackups, setLoadingBackups] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)

  const deleteBackupConfirm = useConfirmModal()
  const restoreBackupConfirm = useConfirmModal()

  const formatBackupDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('ru-RU', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatBackupRelativeTime = (timestamp: number) => {
    return formatDistanceToNow(timestamp, { addSuffix: true, locale: ru })
  }

  const loadBackupsRef = useRef<(() => Promise<void>) | null>(null)

  const loadBackups = useCallback(async () => {
    setLoadingBackups(true)
    try {
      const backupList = await backupManager.listBackups()
      setBackups(backupList)
    } catch (error) {
      const errorMessage = handleError(error as any, { operation: 'Загрузка списка бэкапов' })
      logger.error('❌ Ошибка загрузки списка бэкапов:', error)
      // Using ref to avoid dependency on showError
    } finally {
      setLoadingBackups(false)
    }
  }, []) // No deps - stable function

  // Keep ref updated
  loadBackupsRef.current = loadBackups

  // Initial load - runs only once
  useEffect(() => {
    let mounted = true

    const doLoad = async () => {
      if (mounted) {
        await loadBackups()
      }
    }

    doLoad()

    // Subscribe to changes with debounce to prevent rapid re-fetches
    let debounceTimer: NodeJS.Timeout | null = null
    const unsubscribeBackupChanges = backupManager.onBackupChange(() => {
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        if (mounted && loadBackupsRef.current) {
          loadBackupsRef.current()
        }
      }, 500) // Debounce 500ms
    })

    return () => {
      mounted = false
      if (debounceTimer) clearTimeout(debounceTimer)
      if (unsubscribeBackupChanges) {
        unsubscribeBackupChanges()
      }
    }
  }, [loadBackups]) // loadBackups is stable now

  const handleCreateBackup = async () => {
    if (isCreating || loadingBackups) return
    setIsCreating(true)
    try {
      const result = await createManualBackup()
      if (result.success) {
        showSuccess('Резервная копия успешно создана')
        // Wait for IndexedDB transaction to complete
        await new Promise(resolve => setTimeout(resolve, 300))
        await loadBackups()
      } else {
        showError('Не удалось создать резервную копию')
      }
    } catch (error) {
      const errorMessage = handleError(error as any, { operation: 'Создание резервной копии' })
      logger.error('❌ Ошибка создания бэкапа:', error)
      showError(errorMessage)
    } finally {
      setIsCreating(false)
    }
  }

  const handleRestoreBackup = (timestamp: number) => {
    restoreBackupConfirm.openConfirm({
      title: 'Восстановить данные?',
      message: 'Вы уверены, что хотите восстановить данные из этого бэкапа? Текущие данные будут заменены.',
      confirmText: 'Восстановить',
      cancelText: 'Отмена',
      onConfirm: async () => {
        setIsRestoring(true)
        try {
          const success = await restoreFromBackup(timestamp)
          if (success) {
            showSuccess('Данные успешно восстановлены')
            // Optionally close modal or refresh app state
          } else {
            showError('Не удалось восстановить данные')
          }
        } catch (error) {
          const errorMessage = handleError(error as any, { operation: 'Восстановление из бэкапа', timestamp })
          logger.error('❌ Ошибка восстановления:', error)
          showError(errorMessage)
        } finally {
          setIsRestoring(false)
        }
      },
    })
  }

  const handleDeleteBackup = (timestamp: number) => {
    deleteBackupConfirm.openConfirm({
      title: 'Удалить резервную копию?',
      message: 'Вы уверены, что хотите удалить эту резервную копию? Это действие нельзя отменить.',
      confirmText: 'Удалить',
      cancelText: 'Отмена',
      onConfirm: async () => {
        try {
          await backupManager.deleteBackup(timestamp)
          showSuccess('Резервная копия удалена')
          loadBackups()
        } catch (error) {
          const errorMessage = handleError(error as any, { operation: 'Удаление бэкапа', timestamp })
          logger.error('❌ Ошибка удаления бэкапа:', error)
          showError(errorMessage)
        }
      },
    })
  }

  // Filter backups into manual and auto if needed, or just show all sorted
  const sortedBackups = [...backups].sort((a, b) => b.timestamp - a.timestamp)
  // For now, listing all backups together as the original modal did,
  // or grouped if we had a flag. The original modal showed a flat list.
  // We can stick to the flat list request logic.

  return (
    <>
      <div className="space-y-4 animate-fade-in">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Управление резервными копиями</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Создавайте, восстанавливайте и управляйте резервными копиями данных</p>
        </div>

        <div className="mb-4">
          <Button
            onClick={handleCreateBackup}
            disabled={isCreating}
            variant="primary"
            icon={Archive}
            className="w-full"
            iconId="backup-create"
          >
            {isCreating ? 'Создание...' : 'Создать резервную копию'}
          </Button>
        </div>

        <div className="space-y-2">
          {loadingBackups ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500 dark:text-gray-400">Загрузка...</div>
            </div>
          ) : sortedBackups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Archive className="w-12 h-12 text-gray-400 dark:text-gray-600 mb-2" />
              <p className="text-gray-500 dark:text-gray-400">Резервные копии отсутствуют</p>
              <p className="text-sm text-gray-400 dark:text-gray-300 mt-1">
                Создайте первую резервную копию, чтобы сохранить ваши данные
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedBackups.map(backup => (
                <div
                  key={backup.timestamp}
                  className="glass-effect rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatBackupDate(backup.timestamp)}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          ({formatBackupRelativeTime(backup.timestamp)})
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                        <span>Записей: {backup.entriesCount}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        onClick={() => handleRestoreBackup(backup.timestamp)}
                        disabled={isRestoring}
                        variant="secondary"
                        icon={Upload}
                        size="sm"

                        iconId="backup-restore"
                      >
                        Восстановить
                      </Button>
                      <Button
                        onClick={() => handleDeleteBackup(backup.timestamp)}
                        variant="danger"
                        icon={Trash2}
                        iconId="backup-delete"
                        size="sm"

                      >
                        Удалить
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Резервные копии автоматически создаются при изменениях данных. Хранится максимум 10 последних копий.
          </p>
        </div>
      </div>

      {/* Модальные окна подтверждения */}
      <ConfirmModal
        {...deleteBackupConfirm.confirmConfig}
        variant="danger"
      />

      <ConfirmModal
        {...restoreBackupConfirm.confirmConfig}
        variant="warning"
      />
    </>
  )
}
