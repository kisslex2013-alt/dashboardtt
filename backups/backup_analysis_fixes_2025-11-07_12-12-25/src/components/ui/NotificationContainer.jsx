import { useUIStore } from '../../store/useUIStore';
import { Notification } from './Notification';

/**
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 * 
 * Компонент для отображения уведомлений (toast сообщений).
 * Автоматически показывает все активные уведомления из UI хранилища.
 * Поддерживает 5 визуальных вариантов в стиле проекта.
 */

export function NotificationContainer() {
  const { notifications, removeNotification } = useUIStore();
  
  if (notifications.length === 0) return null;
  
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map(notification => (
        <Notification
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
}
