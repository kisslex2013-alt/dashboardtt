import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useUIStore } from '../../store/useUIStore';

/**
 * 🎯 Компонент отдельного уведомления
 * @param {Object} notification - объект уведомления
 * @param {function} onClose - функция закрытия уведомления
 */
export function Notification({ notification, onClose }) {
  const [progress, setProgress] = useState(100);
  
  useEffect(() => {
    if (notification.duration === 0) return;
    
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev - (100 / (notification.duration / 100));
        if (newProgress <= 0) {
          onClose();
          return 0;
        }
        return newProgress;
      });
    }, 100);
    
    return () => clearInterval(interval);
  }, [notification.duration, onClose]);
  
  const types = {
    success: 'notification-success',
    error: 'notification-error',
    warning: 'notification-warning',
    info: 'notification-info',
  };
  
  return (
    <div className={`rounded-lg shadow-lg p-4 mb-2 min-w-[300px] animate-slide-in ${types[notification.type]}`}>
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-white">{notification.message}</p>
        <button onClick={onClose} className="ml-4 text-white hover:text-gray-200">
          <X className="w-4 h-4" />
        </button>
      </div>
      {notification.duration > 0 && (
        <div className="mt-3 h-3 bg-white/30 rounded-full overflow-hidden">
          <div 
            className="h-full bg-white transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

/**
 * 🎯 Контейнер для всех уведомлений
 * Отображает уведомления в правом верхнем углу экрана
 */
export function NotificationContainer() {
  const { notifications, removeNotification } = useUIStore();
  
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

