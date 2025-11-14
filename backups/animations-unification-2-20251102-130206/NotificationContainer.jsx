import { useUIStore } from '../../store/useUIStore'

/**
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 * 
 * Компонент для отображения уведомлений (toast сообщений).
 * Автоматически показывает все активные уведомления из UI хранилища.
 */

export function NotificationContainer() {
  const { notifications, removeNotification } = useUIStore()
  
  if (notifications.length === 0) return null
  
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
  )
}

function Notification({ notification, onClose }) {
  const getTypeStyles = (type) => {
    switch (type) {
      case 'success':
        return 'notification-success'
      case 'error':
        return 'notification-error'
      case 'warning':
        return 'notification-warning'
      case 'info':
        return 'notification-info'
      default:
        return 'notification-info'
    }
  }
  
  return (
    <div className={`
      rounded-lg shadow-lg p-4 min-w-[300px] max-w-[400px]
      animate-slide-in ${getTypeStyles(notification.type)}
    `}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-white">{notification.message}</p>
          {notification.action && (
            <button
              onClick={notification.action.onClick}
              className="mt-2 text-xs underline hover:no-underline text-white"
            >
              {notification.action.label}
            </button>
          )}
        </div>
        
        <button
          onClick={onClose}
          className="ml-4 text-white opacity-70 hover:opacity-100"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

