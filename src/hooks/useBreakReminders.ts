/**
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 *
 * Этот хук отслеживает время работы таймера и показывает напоминания о перерывах.
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
 * через заданный интервал.
 */
export function useBreakReminders(): void {
  const activeTimer = useActiveTimer()
  const isPaused = useIsPaused()
  const getCurrentElapsed = useGetCurrentElapsed()
  const notifications = useNotificationsSettings()
  const { showWarning } = useNotifications()

  const lastBreakReminderRef = useRef<number>(0)

  useEffect(() => {
    if (!activeTimer || isPaused) {
      lastBreakReminderRef.current = 0
      return
    }

    if (!notifications.breakRemindersEnabled || !notifications.breakReminderInterval) {
      return
    }

    const checkInterval = setInterval(() => {
      const currentElapsed = getCurrentElapsed()
      const breakReminderIntervalSeconds = notifications.breakReminderInterval * 3600

      const timeSinceLastReminder = currentElapsed - lastBreakReminderRef.current

      if (timeSinceLastReminder >= breakReminderIntervalSeconds) {
        const hoursWorked = Math.floor(currentElapsed / 3600)
        const minutesWorked = Math.floor((currentElapsed % 3600) / 60)

        let message = `Пора сделать перерыв!`
        if (hoursWorked > 0) {
          message += ` Вы работаете уже ${hoursWorked} ${hoursWorked === 1 ? 'час' : hoursWorked < 5 ? 'часа' : 'часов'}`
          if (minutesWorked > 0) {
            message += ` ${minutesWorked} ${minutesWorked === 1 ? 'минуту' : minutesWorked < 5 ? 'минуты' : 'минут'}`
          }
        } else {
          message += ` Вы работаете уже ${minutesWorked} ${minutesWorked === 1 ? 'минуту' : minutesWorked < 5 ? 'минуты' : 'минут'}`
        }
        message += `. Рекомендуется сделать перерыв для поддержания продуктивности.`

        showWarning(message, 10000)
        lastBreakReminderRef.current = currentElapsed

        logger.log(`Напоминание о перерыве показано (работа: ${hoursWorked}ч ${minutesWorked}м)`)
      }
    }, 60000)

    return () => {
      clearInterval(checkInterval)
    }
  }, [activeTimer, isPaused, getCurrentElapsed, notifications.breakRemindersEnabled, notifications.breakReminderInterval, showWarning])
}
