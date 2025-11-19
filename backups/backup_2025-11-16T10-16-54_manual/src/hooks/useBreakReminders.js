/**
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 *
 * Этот хук отслеживает время работы таймера и показывает напоминания о перерывах.
 * - Отслеживает непрерывное время работы
 * - Показывает уведомление через заданный интервал (например, каждые 2 часа)
 * - Позволяет отложить или пропустить напоминание
 * - Интегрируется с системой уведомлений приложения
 */

import { useEffect, useRef } from 'react'
import { useActiveTimer, useIsPaused, useGetCurrentElapsed } from '../store/useTimerStore'
import { useNotificationsSettings } from '../store/useSettingsStore'
import { useNotifications } from './useNotifications'
import { logger } from '../utils/logger'

/**
 * 🔔 Хук для напоминаний о перерывах
 *
 * Отслеживает время работы таймера и показывает напоминания о перерывах
 * через заданный интервал (например, каждые 2 часа непрерывной работы).
 *
 * @returns {void}
 *
 * @example
 * // Использование в компоненте:
 * function TimerComponent() {
 *   useBreakReminders()
 *   // ... остальной код
 * }
 */
export function useBreakReminders() {
  const activeTimer = useActiveTimer()
  const isPaused = useIsPaused()
  const getCurrentElapsed = useGetCurrentElapsed()
  const notifications = useNotificationsSettings()
  const { showWarning } = useNotifications()

  // Отслеживаем последнее показанное напоминание
  const lastBreakReminderRef = useRef(0)

  useEffect(() => {
    // Если таймер не активен или на паузе, сбрасываем отслеживание
    if (!activeTimer || isPaused) {
      lastBreakReminderRef.current = 0
      return
    }

    // Если напоминания о перерывах отключены, ничего не делаем
    if (!notifications.breakRemindersEnabled || !notifications.breakReminderInterval) {
      return
    }

    const checkInterval = setInterval(() => {
      const currentElapsed = getCurrentElapsed()
      const breakReminderIntervalSeconds = notifications.breakReminderInterval * 3600 // конвертируем часы в секунды

      // Проверяем, прошло ли достаточно времени с последнего напоминания
      const timeSinceLastReminder = currentElapsed - lastBreakReminderRef.current

      if (timeSinceLastReminder >= breakReminderIntervalSeconds) {
        // Показываем напоминание о перерыве
        const hoursWorked = Math.floor(currentElapsed / 3600)
        const minutesWorked = Math.floor((currentElapsed % 3600) / 60)

        let message = `⏸️ Пора сделать перерыв!`
        if (hoursWorked > 0) {
          message += ` Вы работаете уже ${hoursWorked} ${hoursWorked === 1 ? 'час' : hoursWorked < 5 ? 'часа' : 'часов'}`
          if (minutesWorked > 0) {
            message += ` ${minutesWorked} ${minutesWorked === 1 ? 'минуту' : minutesWorked < 5 ? 'минуты' : 'минут'}`
          }
        } else {
          message += ` Вы работаете уже ${minutesWorked} ${minutesWorked === 1 ? 'минуту' : minutesWorked < 5 ? 'минуты' : 'минут'}`
        }
        message += `. Рекомендуется сделать перерыв для поддержания продуктивности.`

        showWarning(message, 10000) // Показываем 10 секунд

        // Обновляем время последнего напоминания
        lastBreakReminderRef.current = currentElapsed

        logger.log(`🔔 Напоминание о перерыве показано (работа: ${hoursWorked}ч ${minutesWorked}м)`)
      }
    }, 60000) // Проверяем каждую минуту

    return () => {
      clearInterval(checkInterval)
    }
  }, [activeTimer, isPaused, getCurrentElapsed, notifications.breakRemindersEnabled, notifications.breakReminderInterval, showWarning])
}

