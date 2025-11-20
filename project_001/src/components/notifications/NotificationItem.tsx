/**
 * 🔔 Элемент уведомления в списке
 *
 * Компактное отображение уведомления с:
 * - Иконкой и приоритетом
 * - Заголовком и превью
 * - Временем создания
 * - Быстрыми действиями (по hover)
 */

import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Eye, X, Clock } from '../../utils/icons'
import type { AINotification } from '../../types/aiNotifications'
import { useNotificationActions } from '../../store/useAINotificationsStore'

interface NotificationItemProps {
  notification: AINotification
  onClick: () => void
  compact?: boolean
}

export function NotificationItem({
  notification,
  onClick,
  compact = false,
}: NotificationItemProps) {
  const { markAsRead, removeNotification, snoozeNotification } =
    useNotificationActions()

  // Цвет границы в зависимости от приоритета
  const getBorderColor = () => {
    switch (notification.priority) {
      case 'critical':
        return 'border-l-red-500'
      case 'high':
        return 'border-l-yellow-500'
      default:
        return 'border-l-blue-500'
    }
  }

  // Цвет фона для непрочитанных
  const getBgColor = () => {
    if (notification.isRead) {
      return 'bg-gray-50 dark:bg-gray-800/50'
    }
    return 'bg-blue-50 dark:bg-blue-900/10'
  }

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

  // Обработчики быстрых действий
  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation()
    markAsRead(notification.id)
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    removeNotification(notification.id)
  }

  const handleSnooze = (e: React.MouseEvent) => {
    e.stopPropagation()
    // Отложить на 1 час
    const snoozeUntil = new Date(Date.now() + 60 * 60 * 1000).toISOString()
    snoozeNotification(notification.id, snoozeUntil)
  }

  return (
    <div
      onClick={onClick}
      className={`
        ${getBgColor()}
        ${getBorderColor()}
        border-l-4 rounded-lg p-3
        transition-all duration-200
        hover:shadow-md hover:scale-[1.02]
        group relative
        ${compact ? 'mb-2' : 'mb-3'}
      `}
    >
      {/* Основной контент */}
      <div className="flex items-start gap-3">
        {/* Иконка */}
        <div
          className={`
          flex-shrink-0 p-2 rounded-lg
          ${
            notification.priority === 'critical'
              ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
              : notification.priority === 'high'
                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
          }
        `}
        >
          {notification.icon}
        </div>

        {/* Текст */}
        <div className="flex-1 min-w-0">
          <h4
            className={`
            text-sm font-semibold mb-1
            ${notification.isRead ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-white'}
          `}
          >
            {notification.title}
          </h4>
          <p
            className={`
            text-xs line-clamp-2
            ${notification.isRead ? 'text-gray-500 dark:text-gray-400' : 'text-gray-700 dark:text-gray-300'}
          `}
          >
            {notification.preview}
          </p>

          {/* Время и тестовая метка */}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {getTimeAgo()}
            </span>
            {notification.isTest && (
              <span className="text-xs px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded">
                Тест
              </span>
            )}
            {!notification.isRead && (
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            )}
          </div>
        </div>
      </div>

      {/* Быстрые действия (показываются по hover) */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
        {!notification.isRead && (
          <button
            onClick={handleMarkAsRead}
            className="p-1.5 rounded bg-white dark:bg-gray-700 shadow-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            title="Отметить как прочитанное"
            aria-label="Отметить как прочитанное"
          >
            <Eye className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300" />
          </button>
        )}

        {!notification.isRead && (
          <button
            onClick={handleSnooze}
            className="p-1.5 rounded bg-white dark:bg-gray-700 shadow-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            title="Отложить на 1 час"
            aria-label="Отложить на 1 час"
          >
            <Clock className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300" />
          </button>
        )}

        <button
          onClick={handleRemove}
          className="p-1.5 rounded bg-white dark:bg-gray-700 shadow-md hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
          title="Удалить"
          aria-label="Удалить уведомление"
        >
          <X className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400" />
        </button>
      </div>
    </div>
  )
}
