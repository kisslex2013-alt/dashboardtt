/**
 * 🎯 Модальное окно для настройки отображения уведомлений
 * 
 * Используется для разработки и тестирования.
 * Вызывается по CTRL+ALT+N
 */

import { BaseModal } from '../ui/BaseModal'
import { NotificationsDisplaySettingsPanel } from '../settings/NotificationsDisplaySettingsPanel'
import { Settings, CheckCircle, XCircle, AlertTriangle, Info, Play } from '../../utils/icons'
import { useNotifications } from '../../hooks/useNotifications'
import type { BaseModalProps } from '../../types'

interface NotificationsDisplayModalProps extends Omit<BaseModalProps, 'title' | 'titleIcon'> {
  isOpen: boolean
  onClose: () => void
}

export function NotificationsDisplayModal({ isOpen, onClose }: NotificationsDisplayModalProps) {
  const { showSuccess, showError, showWarning, showInfo } = useNotifications()

  // Тестовые сообщения для каждого типа уведомления
  const testMessages = {
    success: 'Тестовое уведомление об успехе',
    error: 'Тестовое уведомление об ошибке',
    warning: 'Тестовое предупреждение',
    info: 'Тестовое информационное уведомление',
  }

  const handleTestNotification = (type: 'success' | 'error' | 'warning' | 'info') => {
    const message = testMessages[type]
    switch (type) {
      case 'success':
        showSuccess(message, 3000)
        break
      case 'error':
        showError(message, 5000)
        break
      case 'warning':
        showWarning(message, 4000)
        break
      case 'info':
        showInfo(message, 3000)
        break
    }
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Настройки отображения уведомлений"
      titleIcon={Settings}
      size="large"
      closeOnOverlayClick={true}
    >
      <div className="p-6">
        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Настройте, какие уведомления показывать по категориям и типам.
            <br />
            <span className="text-xs text-gray-500 dark:text-gray-500">
              Это инструмент для разработки и тестирования. Вызывается по CTRL+ALT+N.
            </span>
          </p>
        </div>

        {/* Предпросмотр уведомлений */}
        <div className="mb-6 glass-effect rounded-xl p-4 border-2 border-gray-300 dark:border-gray-600">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Play className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Предпросмотр уведомлений</h3>
            </div>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
            Нажмите на кнопку, чтобы увидеть, как выглядит уведомление каждого типа
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <button
              onClick={() => handleTestNotification('success')}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-green-500/50 bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-400 transition-colors text-sm font-medium"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Успех</span>
            </button>
            <button
              onClick={() => handleTestNotification('error')}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-red-500/50 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 transition-colors text-sm font-medium"
            >
              <XCircle className="w-4 h-4" />
              <span>Ошибка</span>
            </button>
            <button
              onClick={() => handleTestNotification('warning')}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-orange-500/50 bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 transition-colors text-sm font-medium"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Предупреждение</span>
            </button>
            <button
              onClick={() => handleTestNotification('info')}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-blue-500/50 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 transition-colors text-sm font-medium"
            >
              <Info className="w-4 h-4" />
              <span>Информация</span>
            </button>
          </div>
        </div>

        <NotificationsDisplaySettingsPanel />
      </div>
    </BaseModal>
  )
}

