import { useEffect, useState, useRef, useCallback, memo } from 'react'
import { useRemoveNotification } from '../../store/useUIStore'
import { useNotificationsSettings } from '../../store/useSettingsStore'
import {
  NotificationVariant1,
  NotificationVariant2,
  NotificationVariant3,
  NotificationVariant4,
  NotificationVariant5,
} from './NotificationVariants'

/**
 * 🎯 Компонент отдельного уведомления
 * Поддерживает 5 визуальных вариантов в стиле проекта
 *
 * ✨ УЛУЧШЕНИЯ:
 * - Pause on hover: уведомление останавливается при наведении мыши
 * - Плавное исчезновение с анимацией
 * - React.memo для оптимизации производительности
 * - Автоматическое скрытие по истечении времени
 *
 * ✅ ОПТИМИЗАЦИЯ: Обернут в React.memo для предотвращения лишних ре-рендеров
 *
 * @param {Object} notification - объект уведомления
 * @param {function} onClose - функция закрытия уведомления
 */
export const Notification = memo(({ notification, onClose }) => {
  const [progress, setProgress] = useState(100)
  const [isPaused, setIsPaused] = useState(false) // Пауза при наведении
  const [isExiting, setIsExiting] = useState(false) // Анимация исчезновения
  // ✅ ОПТИМИЗАЦИЯ: Используем атомарный селектор для минимизации ре-рендеров
  const notificationSettings = useNotificationsSettings()
  const intervalRef = useRef(null)

  // ✨ КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Используем useRef для isPaused
  // Это позволяет проверять актуальное значение внутри интервала без пересоздания
  const isPausedRef = useRef(false)

  // Получаем вариант уведомления из настроек (по умолчанию вариант 1)
  const variant = notificationSettings?.variant || 1

  // ✨ УЛУЧШЕНИЕ: Обработчик закрытия с анимацией (используем useCallback)
  const handleClose = useCallback(() => {
    // Останавливаем таймер перед закрытием
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    setIsExiting(true)
    setTimeout(() => {
      onClose()
    }, 300) // Задержка для анимации
  }, [onClose])

  // ✨ КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Пауза при наведении мыши (мемоизируем!)
  const handleMouseEnter = useCallback(() => {
    isPausedRef.current = true
    setIsPaused(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    isPausedRef.current = false
    setIsPaused(false)
  }, [])

  // ✨ КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Управление таймером БЕЗ зависимости от isPaused
  useEffect(() => {
    if (notification.duration === 0 || isExiting) return

    // Запускаем интервал ОДИН РАЗ
    intervalRef.current = setInterval(() => {
      // Проверяем isPausedRef.current внутри интервала!
      if (!isPausedRef.current) {
        setProgress(prev => {
          const newProgress = prev - 100 / (notification.duration / 100)
          if (newProgress <= 0) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
            handleClose()
            return 0
          }
          return newProgress
        })
      }
      // Пауза активна - прогресс не обновляется
    }, 100)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [notification.duration, isExiting, handleClose]) // БЕЗ isPaused!

  // Выбираем компонент варианта
  const VariantComponent =
    {
      1: NotificationVariant1,
      2: NotificationVariant2,
      3: NotificationVariant3,
      4: NotificationVariant4,
      5: NotificationVariant5,
    }[variant] || NotificationVariant1

  return (
    <div className={isExiting ? 'animate-fade-out' : ''}>
      <VariantComponent
        notification={notification}
        onClose={handleClose}
        progress={progress}
        isPaused={isPaused}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />
    </div>
  )
})

/**
 * 🎯 Контейнер для всех уведомлений
 * Отображает уведомления в правом верхнем углу экрана
 *
 * ✨ УЛУЧШЕНИЕ: z-index увеличен до 9999999 чтобы быть поверх модальных окон (z-[999999])
 *
 * ПРИМЕЧАНИЕ: Этот компонент дублируется в NotificationContainer.tsx
 * Используйте NotificationContainer.tsx вместо этого компонента
 */
export function NotificationContainer() {
  const notifications = useNotifications()
  const removeNotification = useRemoveNotification()

  return (
    <div className="fixed top-4 right-4 z-[9999999] space-y-2 pointer-events-auto">
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
