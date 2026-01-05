import { useNotifications, useRemoveNotification } from '../../store/useUIStore'
import { Notification } from './Notification'

/**
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 *
 * Компонент для отображения уведомлений (toast сообщений).
 * Автоматически показывает все активные уведомления из UI хранилища.
 * Поддерживает 5 визуальных вариантов в стиле проекта.
 */

/**
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 *
 * z-index управляет порядком наложения элементов:
 * - z-[9999999] - ОЧЕНЬ высокое значение, больше чем у модальных окон (z-[999999])
 * - Это гарантирует, что уведомления всегда будут видны поверх всего
 *
 * pointer-events-auto - важно! Без этого клики по кнопкам не работают
 */
export function NotificationContainer() {
  const notifications = useNotifications()
  const removeNotification = useRemoveNotification()

  if (notifications.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[2147483647] space-y-2 pointer-events-auto">
      {notifications.map(notification => (
        <Notification
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  )
}
