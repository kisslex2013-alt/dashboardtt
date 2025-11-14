/**
 * 🍅 Хук для работы с Pomodoro таймером
 *
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 *
 * Этот хук управляет Pomodoro таймером - техникой управления временем,
 * где работа разбивается на интервалы по 25 минут (помодоро), разделенные перерывами.
 *
 * Основные функции:
 * - Автоматическое обновление времени каждую секунду
 * - Автоматическое переключение между режимами (работа/перерыв)
 * - Звуковые уведомления при завершении интервала
 * - Интеграция с основным таймером (опционально)
 *
 * @returns {Object} объект с методами и состоянием Pomodoro таймера
 */

import { useEffect, useCallback, useRef } from 'react'
import {
  usePomodoroMode,
  usePomodoroTimeLeft,
  usePomodoroIsRunning,
  usePomodoroCompleted,
  usePomodoroStart,
  usePomodoroPause,
  usePomodoroResume,
  usePomodoroReset,
  usePomodoroNextMode,
  usePomodoroStore,
} from '../store/usePomodoroStore'
import { useSoundManager } from './useSound'
import { useNotificationsSettings, usePomodoroSettings } from '../store/useSettingsStore'
import { useNotifications } from './useNotifications'
import { logger } from '../utils/logger'

/**
 * Хук для работы с Pomodoro таймером
 * @returns {Object} объект с методами и состоянием Pomodoro таймера
 */
export function usePomodoro() {
  const mode = usePomodoroMode()
  const timeLeft = usePomodoroTimeLeft()
  const isRunning = usePomodoroIsRunning()
  const pomodorosCompleted = usePomodoroCompleted()
  const start = usePomodoroStart()
  const pause = usePomodoroPause()
  const resume = usePomodoroResume()
  const reset = usePomodoroReset()
  const nextMode = usePomodoroNextMode()
  const { playSound } = useSoundManager()
  const notifications = useNotificationsSettings()
  const pomodoroSettings = usePomodoroSettings()
  const { showSuccess, showInfo } = useNotifications()

  // Автоматическое обновление времени каждую секунду
  useEffect(() => {
    if (!isRunning) return

    const interval = setInterval(() => {
      usePomodoroStore.getState().tick()
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning])

  // Обработка завершения интервала (обрабатывается в tick, но здесь добавляем звук и уведомления)
  const previousTimeLeftRef = useRef(timeLeft)
  const previousModeRef = useRef(mode)
  
  useEffect(() => {
    // Проверяем, только что ли завершился интервал (был > 0, стал 0)
    if (previousTimeLeftRef.current > 0 && timeLeft === 0 && !isRunning) {
      const previousMode = previousModeRef.current

      // Звуковое уведомление
      if (notifications.sound && pomodoroSettings?.soundOnComplete) {
        if (previousMode === 'work') {
          playSound('success') // Помодоро завершен
        } else {
          playSound('chime') // Перерыв завершен
        }
      }

      // Визуальное уведомление
      if (pomodoroSettings?.showNotifications) {
        if (previousMode === 'work') {
          showSuccess(`🍅 Pomodoro завершен! Пора сделать перерыв.`)
        } else {
          showInfo(`⏰ Перерыв завершен! Пора вернуться к работе.`)
        }
      }

      logger.log(`🍅 Pomodoro: ${previousMode === 'work' ? 'Работа завершена' : 'Перерыв завершен'}`)
    }
    
    previousTimeLeftRef.current = timeLeft
    previousModeRef.current = mode
  }, [timeLeft, isRunning, mode, playSound, notifications, pomodoroSettings, showSuccess, showInfo])
  
  // Автоматический запуск перерывов/работы (если включено в настройках)
  useEffect(() => {
    if (timeLeft === 0 && !isRunning) {
      // Проверяем настройки автозапуска
      if (mode === 'work' && pomodoroSettings?.autoStartBreaks) {
        // Автозапуск перерыва после работы
        setTimeout(() => {
          start()
        }, 1000)
      } else if (mode !== 'work' && pomodoroSettings?.autoStartWork) {
        // Автозапуск работы после перерыва
        setTimeout(() => {
          start()
        }, 1000)
      }
    }
  }, [timeLeft, isRunning, mode, pomodoroSettings, start])

  // Форматирование времени
  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }, [])

  // Процент выполнения
  const progress = useCallback(() => {
    const duration = usePomodoroStore.getState().getDurationForMode()
    const totalSeconds = duration * 60
    return ((totalSeconds - timeLeft) / totalSeconds) * 100
  }, [timeLeft, mode])

  return {
    mode,
    timeLeft,
    isRunning,
    pomodorosCompleted,
    formattedTime: formatTime(timeLeft),
    progress: progress(),
    start,
    pause,
    resume,
    reset,
    nextMode,
    formatTime,
  }
}

