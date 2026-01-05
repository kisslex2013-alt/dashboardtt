import { Database, Upload, RefreshCw, Download, AlertTriangle, Lightbulb } from '../../utils/icons'
import { Button } from '../ui/Button'
import { BaseModal } from '../ui/BaseModal'
import type { SyncConfirmationData } from '../../utils/syncUtils'

interface SyncConflictModalProps {
  isOpen: boolean
  onClose: () => void
  syncData: SyncConfirmationData
  onUseCloud: () => void
  onKeepLocal: () => void
  onMerge: () => void
  onDownloadLocalBackup?: () => void
}

/**
 * Модальное окно для выбора при обнаружении конфликта синхронизации
 * Показывает краткую информацию и даёт пользователю выбор
 */
export function SyncConflictModal({
  isOpen,
  onClose,
  syncData,
  onUseCloud,
  onKeepLocal,
  onMerge,
  onDownloadLocalBackup,
}: SyncConflictModalProps) {
  
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleAction = (action: () => void) => {
    action()
    onClose()
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Обнаружен конфликт данных"
      titleIcon={AlertTriangle}
      size="medium"
      closeOnOverlayClick={false}
      nested={true}
    >
      {/* Предупреждение */}
      <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
        <p className="text-amber-800 dark:text-amber-200 text-sm">
          {syncData.reason}
        </p>
      </div>

      {/* Сравнение данных */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Локальные данные */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="font-medium text-blue-900 dark:text-blue-100">Локальные данные</span>
          </div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
            {syncData.localCount} записей
          </div>
          {syncData.localLastSync && (
            <div className="text-xs text-blue-600/70 dark:text-blue-400/70">
              Синхронизировано: {formatDate(syncData.localLastSync)}
            </div>
          )}
        </div>

        {/* Облачные данные */}
        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Upload className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span className="font-medium text-purple-900 dark:text-purple-100">Облачные данные</span>
          </div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
            {syncData.cloudCount} записей
          </div>
          <div className="text-xs text-purple-600/70 dark:text-purple-400/70">
            Бэкап от: {formatDate(syncData.cloudTimestamp)}
          </div>
        </div>
      </div>

      {/* Рекомендация */}
      {syncData.recommendation && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-green-800 dark:text-green-200 text-sm flex items-start gap-2">
            <Lightbulb className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600 dark:text-green-400" />
            <span>
              <strong>Рекомендация:</strong>{' '}
              {syncData.recommendation === 'merge' && 'Объединить данные — сохранит всё лучшее из обоих источников'}
              {syncData.recommendation === 'use-cloud' && 'Использовать облако — ваши локальные данные пусты'}
              {syncData.recommendation === 'keep-local' && 'Сохранить локальные — они новее облачных'}
            </span>
          </p>
        </div>
      )}

      {/* Кнопка скачивания бэкапа */}
      {onDownloadLocalBackup && syncData.localCount > 0 && (
        <div className="mb-4">
          <button
            onClick={onDownloadLocalBackup}
            className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            <Download className="w-4 h-4" />
            Скачать локальный бэкап на всякий случай
          </button>
        </div>
      )}

      {/* Кнопки действий */}
      <div className="flex flex-col gap-3">
        {/* Рекомендуемое действие */}
        <Button
          variant="default"
          onClick={() => handleAction(onMerge)}
          className="w-full justify-center h-11"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Объединить данные (безопасно)
        </Button>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => handleAction(onKeepLocal)}
            className="flex-1 justify-center h-10 border-2 border-blue-500 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-900/30"
          >
            <Database className="w-4 h-4 mr-2" />
            Оставить локальные
          </Button>

          <Button
            variant="outline"
            onClick={() => handleAction(onUseCloud)}
            className="flex-1 justify-center h-10 border-2 border-purple-500 text-purple-600 hover:bg-purple-50 dark:border-purple-400 dark:text-purple-400 dark:hover:bg-purple-900/30"
          >
            <Upload className="w-4 h-4 mr-2" />
            Использовать облако
          </Button>
        </div>
      </div>
    </BaseModal>
  )
}
