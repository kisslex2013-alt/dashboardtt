/**
 * 🍅 Хук для работы с Pomodoro таймером
 *
 * 🎓 НОВЫЙ ПОДХОД:
 *
 * Pomodoro работает как ОБЕРТКА над стандартным таймером.
 * Он просто управляет стандартным таймером с автоматической остановкой через 25 минут.
 *
 * Преимущества:
 * - Вся логика создания/обновления записей в стандартном таймере
 * - Модальное окно открывается автоматически (как обычно)
 * - Нет дублирования кода
 * - Простота и надежность
 *
 * @returns {Object} объект с методами и состоянием Pomodoro таймера
 */

import React, { useEffect, useCallback, useRef, useMemo } from 'react'
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
import { useNotificationsSettings, usePomodoroSettings, useDefaultCategory } from '../store/useSettingsStore'
import { useNotifications } from './useNotifications'
import { useTimer } from './useTimer'
import { useShowConfirmModal, useOpenModal } from '../store/useUIStore'
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
  const pomodoroStart = usePomodoroStart()
  const pomodoroPause = usePomodoroPause()
  const pomodoroResume = usePomodoroResume()
  const pomodoroReset = usePomodoroReset()
  const nextMode = usePomodoroNextMode()
  const { playSound } = useSoundManager()
  const notifications = useNotificationsSettings()
  const pomodoroSettings = usePomodoroSettings()
  const { showSuccess, showInfo, showWarning } = useNotifications()
  const timer = useTimer()
  const showConfirmModal = useShowConfirmModal()
  const openModal = useOpenModal()
  const defaultCategory = useDefaultCategory()

  // ✅ НОВЫЙ ПОДХОД: Pomodoro управляет стандартным таймером
  // Форматирование времени
  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }, [])

  // Автоматическое обновление времени каждую секунду
  useEffect(() => {
    if (!isRunning) return

    const interval = setInterval(() => {
      usePomodoroStore.getState().tick()
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning])

  // ✅ НОВЫЙ ПОДХОД: Обновление заголовка вкладки с приоритетом Pomodoro
  useEffect(() => {
    if (isRunning) {
      const updateTitle = () => {
        const formattedTime = formatTime(timeLeft)
        const modeLabel = mode === 'work' ? 'Работа' : mode === 'shortBreak' ? 'Короткий перерыв' : 'Длинный перерыв'
        document.title = `🍅 ${formattedTime} - ${modeLabel}`
      }

      updateTitle()
      const interval = setInterval(updateTitle, 1000)

      return () => clearInterval(interval)
    } else if (!timer.isRunning) {
      document.title = 'Time Tracker Dashboard'
    }
  }, [isRunning, timeLeft, mode, formatTime, timer])

  // ✅ НОВЫЙ ПОДХОД: Обработка завершения интервала
  const previousTimeLeftRef = useRef(timeLeft)
  const previousModeRef = useRef(mode)
  
  useEffect(() => {
    // Проверяем, только что ли завершился интервал (был > 0, стал 0)
    if (previousTimeLeftRef.current > 0 && timeLeft === 0 && !isRunning) {
      const previousMode = previousModeRef.current
      
      logger.log(`🍅 [DEBUG] Интервал завершен! previousMode: ${previousMode}, timer.isRunning: ${timer.isRunning}`)

      // ✅ НОВЫЙ ПОДХОД: Останавливаем стандартный таймер (он сам откроет модальное окно!)
      if (previousMode === 'work' && timer.isRunning) {
        logger.log('🍅 [DEBUG] Останавливаем стандартный таймер...')
        
        // Используем handleTimerToggle логику - вызываем stop() который откроет модальное окно
        const entryData = timer.stop()
        
        logger.log('🍅 [DEBUG] timer.stop() вызван, entryData:', entryData)
        
        if (entryData) {
          // Открываем модальное окно редактирования
          logger.log('🍅 [DEBUG] Открываем модальное окно с данными:', entryData)
          openModal('editEntry', { entry: entryData })
          showSuccess('Pomodoro завершен! Проверьте и сохраните запись.')
        } else {
          logger.log('🍅 [DEBUG] НЕТ entryData! Запись не создана!')
        }
        
        logger.log('🍅 Pomodoro завершен: стандартный таймер остановлен, модальное окно открыто')
      } else {
        logger.log(`🍅 [DEBUG] НЕ останавливаем таймер. Причина: previousMode=${previousMode}, timer.isRunning=${timer.isRunning}`)
      }

      // Звуковое уведомление
      if (notifications.sound && pomodoroSettings?.soundOnComplete) {
        if (previousMode === 'work') {
          playSound('success')
        } else {
          playSound('chime')
        }
      }

      logger.log(`🍅 Pomodoro: ${previousMode === 'work' ? 'Работа завершена' : 'Перерыв завершен'}`)
    }
    
    previousTimeLeftRef.current = timeLeft
    previousModeRef.current = mode
  }, [timeLeft, isRunning, mode, timer, openModal, showSuccess, playSound, notifications, pomodoroSettings])
  
  // Автоматический запуск перерывов/работы
  useEffect(() => {
    if (timeLeft === 0 && !isRunning) {
      if (mode === 'work' && pomodoroSettings?.autoStartBreaks) {
        setTimeout(() => {
          pomodoroStart()
          logger.log('🍅 Автозапуск перерыва')
        }, 1000)
      } else if (mode !== 'work' && pomodoroSettings?.autoStartWork) {
        setTimeout(() => {
          pomodoroStart()
          logger.log('🍅 Автозапуск работы')
        }, 1000)
      }
    }
  }, [timeLeft, isRunning, mode, pomodoroSettings, pomodoroStart])

  // Процент выполнения
  // ✅ ИСПРАВЛЕНИЕ: useMemo вместо useCallback + вызова
  // Вычисляем прогресс один раз при изменении timeLeft или mode
  const progress = useMemo(() => {
    const duration = usePomodoroStore.getState().getDurationForMode()
    const totalSeconds = duration * 60
    return ((totalSeconds - timeLeft) / totalSeconds) * 100
  }, [timeLeft, mode])

  /**
   * ✅ НОВЫЙ ПОДХОД: Запуск Pomodoro = запуск стандартного таймера + Pomodoro счетчика
   */
  const start = useCallback(() => {
    logger.log('🍅 [DEBUG] start вызван, timer.isRunning:', timer.isRunning)
    
    // Если стандартный таймер УЖЕ запущен, просто запускаем Pomodoro счетчик
    if (timer.isRunning) {
      logger.log('🍅 [DEBUG] Таймер уже запущен, запускаем только Pomodoro счетчик')
      pomodoroStart()
      showSuccess('Pomodoro запущен поверх текущего таймера')
      return
    }

    logger.log('🍅 [DEBUG] Запускаем стандартный таймер + Pomodoro')
    logger.log('🍅 [DEBUG] Используем категорию по умолчанию:', defaultCategory)
    
    // Запускаем стандартный таймер с категорией по умолчанию
    timer.start(defaultCategory)
    
    // Запускаем Pomodoro счетчик
    pomodoroStart()
    
    showSuccess('Pomodoro запущен (25 мин)')
    logger.log('🍅 [DEBUG] Оба таймера запущены')
  }, [timer, pomodoroStart, showSuccess, defaultCategory])

  /**
   * ✅ НОВЫЙ ПОДХОД: Пауза = пауза обоих таймеров
   */
  const pause = useCallback(() => {
    pomodoroPause()
    
    if (timer.isRunning) {
      timer.pause()
      logger.log('🍅 Оба таймера на паузе')
    }
  }, [pomodoroPause, timer])

  /**
   * ✅ НОВЫЙ ПОДХОД: Возобновление = возобновление обоих таймеров
   */
  const resume = useCallback(() => {
    pomodoroResume()
    
    if (timer.isPaused) {
      timer.resume()
      logger.log('🍅 Оба таймера возобновлены')
    }
  }, [pomodoroResume, timer])

  /**
   * ✅ НОВЫЙ ПОДХОД: Остановка = остановка стандартного таймера + Pomodoro (откроет модалку)
   */
  const stop = useCallback(() => {
    logger.log('🍅 [DEBUG] stop вызван')
    
    // Останавливаем Pomodoro счетчик
    pomodoroReset()
    
    // Останавливаем стандартный таймер (откроет модальное окно)
    if (timer.isRunning || timer.isPaused) {
      logger.log('🍅 [DEBUG] Останавливаем стандартный таймер')
      const entryData = timer.stop()
      logger.log('🍅 [DEBUG] entryData:', entryData)
      
      if (entryData) {
        logger.log('🍅 [DEBUG] Открываем модальное окно')
        openModal('editEntry', { entry: entryData })
        showSuccess('Pomodoro остановлен. Запись сохранена.')
      } else {
        logger.log('🍅 [DEBUG] НЕТ entryData!')
      }
    } else {
      logger.log('🍅 [DEBUG] Таймер не запущен')
    }
  }, [pomodoroReset, timer, openModal, showSuccess])

  /**
   * ✅ НОВЫЙ ПОДХОД: Сброс = сброс Pomodoro без остановки стандартного таймера
   */
  const reset = useCallback(() => {
    pomodoroReset()
    logger.log('🍅 Pomodoro сброшен')
  }, [pomodoroReset])

  return {
    mode,
    timeLeft,
    isRunning,
    pomodorosCompleted,
    formattedTime: formatTime(timeLeft),
    progress, // Используем значение напрямую, не вызываем функцию
    start,
    pause,
    resume,
    stop,
    reset,
    nextMode,
    formatTime,
  }
}

