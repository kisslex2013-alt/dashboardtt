/**
 * 🔍 Модалка деталей AI-уведомления
 *
 * Показывает:
 * - Полное содержимое уведомления
 * - Рекомендации
 * - Действия (кнопки с иконками)
 * - Данные для анализа
 */

import { useEffect } from 'react'
import { BaseModal } from '../ui/BaseModal'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'
import type { AINotification } from '../../types/aiNotifications'
import { useNotificationActions } from '../../store/useAINotificationsStore'
import { CheckCircle } from '../../utils/icons'

interface NotificationDetailModalProps {
  isOpen: boolean
  onClose: () => void
  notification: AINotification | null
}

export function NotificationDetailModal({
  isOpen,
  onClose,
  notification,
}: NotificationDetailModalProps) {
  const { markAsRead } = useNotificationActions()

  // Отмечаем как прочитанное только при открытии модалки
  useEffect(() => {
    if (isOpen && notification && !notification.isRead) {
      markAsRead(notification.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, notification?.id])

  if (!notification) return null

  // Форматирование времени
  const getTimeAgo = () => {
    try {
      return formatDistanceToNow(new Date(notification.createdAt), {
        addSuffix: true,
        locale: ru,
      })
    } catch {
      return 'недавно'
    }
  }

  // Цвет заголовка в зависимости от приоритета
  const getTitleColor = () => {
    switch (notification.priority) {
      case 'critical':
        return 'text-red-600 dark:text-red-400'
      case 'high':
        return 'text-yellow-600 dark:text-yellow-400'
      default:
        return 'text-blue-600 dark:text-blue-400'
    }
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={notification.title}
      titleIcon={notification.icon}
      size="large"
      footer={
        notification.actions && notification.actions.length > 0 ? (
          <div className="flex gap-2 flex-wrap">
            {notification.actions.map((action, index) => (
              <button
                key={index}
                onClick={() => {
                  action.onClick()
                  onClose()
                }}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium
                  ${
                    action.primary
                      ? 'bg-blue-500 hover:bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                  }
                `}
              >
                {action.icon}
                {action.label}
              </button>
            ))}
          </div>
        ) : undefined
      }
    >
      <div className="space-y-4">
        {/* Метаданные */}
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span className={getTitleColor()}>{getTypeLabel(notification.type)}</span>
          <span>•</span>
          <span>{getTimeAgo()}</span>
          {notification.isTest && (
            <>
              <span>•</span>
              <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded text-xs font-medium">
                Тестовое
              </span>
            </>
          )}
        </div>

        {/* Приоритет */}
        <div
          className={`
          inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
          ${
            notification.priority === 'critical'
              ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
              : notification.priority === 'high'
                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
          }
        `}
        >
          {notification.priority === 'critical' && '🔥 Критический'}
          {notification.priority === 'high' && '⚠️ Высокий'}
          {notification.priority === 'normal' && 'ℹ️ Обычный'}
        </div>

        {/* Основное содержимое */}
        <div className="text-gray-700 dark:text-gray-300 leading-relaxed">
          {notification.content}
        </div>

        {/* Рекомендации */}
        {notification.recommendations && notification.recommendations.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Рекомендации
            </h4>
            <ul className="space-y-2">
              {notification.recommendations.map((recommendation, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                >
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>{recommendation}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Дополнительные данные (если есть) */}
        {notification.data && Object.keys(notification.data).length > 0 && (
          <details className="mt-6">
            <summary className="text-sm font-semibold text-gray-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Подробные данные
            </summary>
            <div className="mt-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
              <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-auto">
                {JSON.stringify(notification.data, null, 2)}
              </pre>
            </div>
          </details>
        )}
      </div>
    </BaseModal>
  )
}

/**
 * Получить название типа на русском
 */
function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'burnout-warning': 'Предупреждение о выгорании',
    'goal-risk': 'Риск недостижения цели',
    'monthly-forecast': 'Прогноз месяца',
    'productivity-pattern': 'Паттерн продуктивности',
    'inefficient-category': 'Неэффективная категория',
    'achievement': 'Достижение',
    'weekly-insight': 'Еженедельный инсайт',
    'anomaly': 'Аномалия',
  }
  return labels[type] || type
}
