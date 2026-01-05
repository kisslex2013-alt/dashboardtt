import React, { useState, useEffect } from "react";
import { AnimatedList } from "@/components/ui/animated-list";
import { Bell, CheckCircle, AlertTriangle, Info, X } from "lucide-react";

/**
 * Демо-страница для компонента AnimatedList.
 * Показывает пример анимированного списка уведомлений.
 */

interface Notification {
  id: number;
  title: string;
  description: string;
  time: string;
  icon: React.ReactNode;
  color: string;
}

const initialNotifications: Notification[] = [
  {
    id: 1,
    title: "Задача завершена",
    description: "Запись времени успешно сохранена",
    time: "только что",
    icon: <CheckCircle className="w-5 h-5" />,
    color: "text-emerald-500",
  },
  {
    id: 2,
    title: "Новое сообщение",
    description: "У вас 3 непрочитанных уведомления",
    time: "2 мин назад",
    icon: <Bell className="w-5 h-5" />,
    color: "text-blue-500",
  },
  {
    id: 3,
    title: "Внимание",
    description: "Вы работаете уже 4 часа без перерыва",
    time: "5 мин назад",
    icon: <AlertTriangle className="w-5 h-5" />,
    color: "text-amber-500",
  },
];

const additionalNotifications: Notification[] = [
  {
    id: 4,
    title: "Цель достигнута!",
    description: "Вы выполнили дневной план на 100%",
    time: "только что",
    icon: <CheckCircle className="w-5 h-5" />,
    color: "text-emerald-500",
  },
  {
    id: 5,
    title: "Напоминание",
    description: "Не забудьте сделать перерыв",
    time: "только что",
    icon: <Info className="w-5 h-5" />,
    color: "text-purple-500",
  },
];

function NotificationItem({ notification, onRemove }: { notification: Notification; onRemove: (id: number) => void }) {
  return (
    <div className="flex items-start gap-4 p-4 bg-card rounded-xl border border-border-light hover:bg-card-hover transition-colors group">
      <div className={`flex-shrink-0 ${notification.color}`}>
        {notification.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-text-primary">{notification.title}</p>
        <p className="text-sm text-text-secondary truncate">{notification.description}</p>
        <p className="text-xs text-text-tertiary mt-1">{notification.time}</p>
      </div>
      <button
        onClick={() => onRemove(notification.id)}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/10 rounded-lg"
        aria-label="Удалить уведомление"
      >
        <X className="w-4 h-4 text-text-tertiary hover:text-red-500" />
      </button>
    </div>
  );
}

export default function AnimatedListDemo() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [nextId, setNextId] = useState(6);

  // Плавное добавление начальных уведомлений
  useEffect(() => {
    const timer = setTimeout(() => {
      setNotifications(initialNotifications);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const addNotification = () => {
    const randomNotif = additionalNotifications[Math.floor(Math.random() * additionalNotifications.length)];
    const newNotif = {
      ...randomNotif,
      id: nextId,
      time: "только что",
    };
    setNotifications((prev) => [newNotif, ...prev]);
    setNextId((prev) => prev + 1);
  };

  const removeNotification = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <div className="min-h-screen bg-main p-8">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            AnimatedList Demo
          </h1>
          <p className="text-text-secondary">
            Компонент в стиле Magic UI для анимированных списков
          </p>
        </div>

        {/* Controls */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={addNotification}
            className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            + Добавить
          </button>
          <button
            onClick={clearAll}
            className="px-4 py-2 bg-card border border-border-light rounded-lg hover:bg-card-hover transition-colors text-text-secondary"
          >
            Очистить
          </button>
        </div>

        {/* Animated List */}
        <AnimatedList delay={100} className="space-y-3">
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onRemove={removeNotification}
            />
          ))}
        </AnimatedList>

        {/* Empty State */}
        {notifications.length === 0 && (
          <div className="text-center py-12 text-text-tertiary">
            <Bell className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>Нет уведомлений</p>
            <p className="text-sm mt-1">Нажмите "Добавить" чтобы увидеть анимацию</p>
          </div>
        )}

        {/* Info */}
        <div className="mt-8 p-4 bg-card rounded-xl border border-border-light">
          <h2 className="font-medium text-text-primary mb-2">Как это работает:</h2>
          <ul className="text-sm text-text-secondary space-y-1">
            <li>• Элементы появляются с spring-анимацией</li>
            <li>• Удаление также анимировано</li>
            <li>• Задержка между элементами: 100ms</li>
            <li>• Наведите на карточку для удаления</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
