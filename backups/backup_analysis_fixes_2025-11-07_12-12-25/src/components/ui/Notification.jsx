import { useEffect, useState } from 'react';
import { useUIStore } from '../../store/useUIStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import {
  NotificationVariant1,
  NotificationVariant2,
  NotificationVariant3,
  NotificationVariant4,
  NotificationVariant5,
} from './NotificationVariants';

/**
 * 🎯 Компонент отдельного уведомления
 * Поддерживает 5 визуальных вариантов в стиле проекта
 * @param {Object} notification - объект уведомления
 * @param {function} onClose - функция закрытия уведомления
 */
export function Notification({ notification, onClose }) {
  const [progress, setProgress] = useState(100);
  const { notifications: notificationSettings } = useSettingsStore();
  
  // Получаем вариант уведомления из настроек (по умолчанию вариант 1)
  const variant = notificationSettings?.variant || 1;
  
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
  
  // Выбираем компонент варианта
  const VariantComponent = {
    1: NotificationVariant1,
    2: NotificationVariant2,
    3: NotificationVariant3,
    4: NotificationVariant4,
    5: NotificationVariant5,
  }[variant] || NotificationVariant1;
  
  return (
    <VariantComponent 
      notification={notification} 
      onClose={onClose} 
      progress={progress} 
    />
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
