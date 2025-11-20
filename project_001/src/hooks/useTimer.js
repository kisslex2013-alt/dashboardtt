/**
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 *
 * Этот хук упрощает работу с таймером:
 * - Автоматически обновляет время каждую секунду
 * - Интегрирует звуковые уведомления
 * - Предоставляет простой API для запуска/остановки
 * - Отслеживает состояние таймера
 */

import { useEffect, useRef, useCallback } from 'react'
import {
  useActiveTimer,
  useIsPaused,
  useStartTime,
  useTimerEntryId,
  useStartTimer,
  useStopTimer,
  usePauseTimer,
  useResumeTimer,
  useUpdateElapsed,
  useResetTimer,
  useSetTimerEntryId,
  useTimerStore,
} from '../store/useTimerStore'
import { useAddEntry, useUpdateEntry, useEntriesStore } from '../store/useEntriesStore'
import { useCategories, useNotificationsSettings } from '../store/useSettingsStore'
import { usePomodoroIsRunning } from '../store/usePomodoroStore'
import { useSoundManager } from './useSound'
import { useFavicon } from './useFavicon'
import { useBreakReminders } from './useBreakReminders'
import { calculateDuration, calculateEarned } from '../utils/calculations'
import { formatDate, formatTime } from '../utils/dateHelpers'
import { generateUUID } from '../utils/uuid'
import { logger } from '../utils/logger'

/**
 * Хук для работы с таймером
 * @returns {Object} объект с методами и состоянием таймера
 */
export function useTimer() {
  // ✅ ОПТИМИЗАЦИЯ: Используем атомарные селекторы для минимизации ре-рендеров
  const activeTimer = useActiveTimer()
  const startTime = useStartTime()
  const isPaused = useIsPaused()
  const timerEntryId = useTimerEntryId()
  const pomodoroIsRunning = usePomodoroIsRunning()
  
  // Actions
  const startTimer = useStartTimer()
  const stopTimer = useStopTimer()
  const pauseTimer = usePauseTimer()
  const resumeTimer = useResumeTimer()
  const updateElapsed = useUpdateElapsed()
  const resetTimer = useResetTimer()
  const setTimerEntryId = useSetTimerEntryId()
  
  // Получаем функции для вычисления времени (используем getState для стабильности)
  // Эти методы вызываются как функции, поэтому используем getState для прямого доступа
  const getCurrentElapsed = useCallback(() => {
    return useTimerStore.getState().getCurrentElapsed()
  }, [])
  
  const getFormattedTime = useCallback(() => {
    return useTimerStore.getState().getFormattedTime()
  }, [])
  
  const isTimerRunning = useCallback(() => {
    return useTimerStore.getState().isRunning()
  }, [])

  const addEntry = useAddEntry()
  const updateEntry = useUpdateEntry()
  const categories = useCategories()
  const notifications = useNotificationsSettings()
  const { playSound } = useSoundManager()
  const lastNotificationTimeRef = useRef(0)

  // Интеграция анимации фавикона
  useFavicon(!!activeTimer, isPaused)
  useBreakReminders()

  // Форматирование времени для заголовка (мемоизировано)
  const formatElapsedTime = useCallback(ms => {
    const totalSeconds = Math.floor(ms / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }, [])

  // Обновление заголовка вкладки (работает даже когда вкладка в фоне)
  // ✅ ИНТЕГРАЦИЯ: Приоритет Pomodoro - если Pomodoro запущен, не обновляем title
  useEffect(() => {
    const updateTitle = () => {
      // ✅ ПРИОРИТЕТ POMODORO: Если Pomodoro запущен, пропускаем обновление title
      if (pomodoroIsRunning) {
        return // Pomodoro сам управляет title
      }

      if (activeTimer && !isPaused) {
        const currentElapsed = getCurrentElapsed() * 1000
        document.title = `${formatElapsedTime(currentElapsed)} - Работаем`
      } else if (activeTimer && isPaused) {
        const currentElapsed = getCurrentElapsed() * 1000
        document.title = `${formatElapsedTime(currentElapsed)} - Пауза`
      } else {
        document.title = 'Time Tracker Dashboard'
      }
    }

    updateTitle()

    if (activeTimer) {
      const interval = setInterval(updateTitle, 1000)

      // Обработка активации вкладки - сразу обновляем заголовок
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          // Сразу обновляем при активации вкладки
          updateTitle()
        }
      }

      document.addEventListener('visibilitychange', handleVisibilityChange)

      return () => {
        clearInterval(interval)
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
    }
  }, [activeTimer, isPaused, formatElapsedTime, getCurrentElapsed, pomodoroIsRunning])

  // Автоматическое обновление времени каждую секунду (работает даже когда вкладка в фоне)
  useEffect(() => {
    if (!activeTimer || isPaused) {
      lastNotificationTimeRef.current = 0
      return
    }

    const interval = setInterval(() => {
      // Обновляем время даже если вкладка в фоне (getCurrentElapsed использует Date.now())
      updateElapsed()

      const currentElapsed = getCurrentElapsed()

      // Проверка на каждый час для звукового уведомления
      const hours = Math.floor(currentElapsed / 3600)
      const prevHours = Math.floor((currentElapsed - 1) / 3600)

      if (hours > prevHours && hours > 0) {
        // Звук проигрываем всегда, независимо от видимости вкладки
        playSound('hourlyAlert')
        // Логируем только если вкладка видима (чтобы не засорять консоль)
        if (document.visibilityState === 'visible') {
          logger.log(`🔔 Прошел ${hours} час(ов) работы`)
        }
      }

      // Периодические звуковые уведомления во время работы таймера
      if (notifications.soundNotificationsEnabled && notifications.notificationInterval > 0) {
        const notificationIntervalSeconds = notifications.notificationInterval * 60
        const nextNotificationTarget = lastNotificationTimeRef.current + notificationIntervalSeconds

        if (currentElapsed >= nextNotificationTarget) {
          const soundType = notifications.notificationSound || 'chime'
          // Звук проигрываем всегда, независимо от видимости вкладки (это основная функция уведомлений!)
          playSound(soundType)
          // Логируем только если вкладка видима (чтобы не засорять консоль)
          if (document.visibilityState === 'visible') {
            logger.log(
              `🔔 Звуковое уведомление (${notifications.notificationInterval} минут) - ${soundType}`
            )
          }
          lastNotificationTimeRef.current =
            Math.floor(currentElapsed / notificationIntervalSeconds) * notificationIntervalSeconds
        }
      }
    }, 1000)

    // Обработка активации вкладки - обновляем время при возврате
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // При активации сразу обновляем время (на случай если интервал был замедлен)
        updateElapsed()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [activeTimer, isPaused, updateElapsed, getCurrentElapsed, playSound, notifications])

  /**
   * Запускает таймер для указанной категории и создает запись
   * @param {string} category - название категории работы
   */
  const start = category => {
    try {
      const now = new Date()
      const startDate = formatDate(now)
      const startTime = formatTime(now)

      // Находим категорию и ставку
      const categoryObj = categories.find(cat => cat.name === category)
      const rate = categoryObj?.rate || 1000

      // Создаем запись сразу при старте таймера
      const newEntry = {
        date: startDate,
        start: startTime,
        end: '', // Пока пустое, будет заполнено при остановке
        category,
        categoryId: categoryObj?.id || null,
        description: 'Работа по таймеру',
        rate,
        earned: 0, // Пока 0, будет рассчитано при остановке
        duration: 0, // Пока 0, будет рассчитано при остановке
        isManual: false, // Запись из таймера
      }

      // Генерируем ID заранее
      const entryId = generateUUID()

      // Добавляем запись с уже известным ID (чтобы она появилась в списке сразу)
      const entryWithId = {
        ...newEntry,
        id: entryId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // Сохраняем ID записи в store таймера ДО добавления
      setTimerEntryId(entryId)

      // Добавляем запись (id уже есть, generateUUID в addEntry не будет использован)
      addEntry(entryWithId)

      // Запускаем таймер
      startTimer(category)

      logger.log(`⏱️ Таймер запущен для категории: ${category}, запись создана с ID: ${entryId}`)
      lastNotificationTimeRef.current = 0 // Сброс времени последнего уведомления
      playSound('timerStart')
      logger.log(`⏱️ Таймер запущен для категории: ${category}`)
    } catch (error) {
      logger.error('Ошибка запуска таймера:', error)
    }
  }

  /**
   * Останавливает таймер и обновляет запись
   * @returns {Object|null} объект с данными записи или null если таймер не запущен
   */
  const stop = () => {
    try {
      if (!activeTimer || !startTime) {
        logger.error('Таймер не запущен')
        return null
      }

      const elapsed = stopTimer()
      playSound('timerStop')

      // Получаем данные записи
      const now = new Date()
      const startDate = new Date(startTime)
      const durationHours = (elapsed / 3600).toFixed(2)

      // Находим категорию и ставку
      const categoryObj = categories.find(cat => cat.name === activeTimer)
      const rate = categoryObj?.rate || 1000
      const earned = parseFloat(calculateEarned(durationHours, rate))

      // Обновляем запись, если она была создана
      if (timerEntryId) {
        const updates = {
          end: formatTime(now),
          duration: parseFloat(durationHours),
          // ✅ ИСПРАВЛЕНО: Не передаем earned - пользователь должен ввести его вручную
          // Ставка рассчитывается исходя из времени работы и заработанной суммы, а не наоборот
          // earned, // Убрано - поле должно быть пустым
        }

        updateEntry(timerEntryId, updates)
        logger.log(`⏹️ Таймер остановлен. Запись обновлена (ID: ${timerEntryId})`)
        logger.log(`   Время работы: ${durationHours} ч, Заработано: ${earned} ₽`)

        // Получаем обновленную запись
        // ✅ СТАНДАРТИЗАЦИЯ ID: Конвертируем в строку для корректного сравнения
        // ✅ ОПТИМИЗАЦИЯ: Используем getState для прямого доступа к entries без подписки
        const entries = useEntriesStore.getState().entries
        const timerEntryIdString = timerEntryId ? String(timerEntryId) : null
        const updatedEntry = timerEntryIdString
          ? entries.find(e => String(e.id) === timerEntryIdString)
          : null

        // Сбрасываем ID записи в store таймера
        setTimerEntryId(null)

        return (
          updatedEntry || {
            id: timerEntryId,
            date: formatDate(startDate),
            start: formatTime(startDate),
            end: formatTime(now),
            duration: parseFloat(durationHours),
            category: activeTimer,
            description: 'Работа по таймеру',
            rate,
            // ✅ ИСПРАВЛЕНО: Не передаем earned - пользователь должен ввести его вручную
            // earned, // Убрано - поле должно быть пустым
            isManual: false,
          }
        )
      }

      // Если записи нет (старый формат), возвращаем данные для создания
      const entryData = {
        date: formatDate(startDate),
        start: formatTime(startDate),
        end: formatTime(now),
        duration: parseFloat(durationHours),
        category: activeTimer,
        description: 'Работа по таймеру',
        rate,
        earned,
        isManual: false,
      }

      logger.log(`⏹️ Таймер остановлен. Данные для записи:`, entryData)
      logger.log(`   Время работы: ${durationHours} ч, Заработано: ${earned} ₽`)

      return entryData
    } catch (error) {
      logger.error('Ошибка остановки таймера:', error)
      return null
    }
  }

  /**
   * Ставит таймер на паузу
   */
  const pause = () => {
    try {
      pauseTimer()
      playSound('pause')
      logger.log('⏸️ Таймер поставлен на паузу')
    } catch (error) {
      logger.error('Ошибка паузы таймера:', error)
    }
  }

  /**
   * Возобновляет работу таймера
   */
  const resume = () => {
    try {
      resumeTimer()
      playSound('resume')
      logger.log('▶️ Таймер возобновлен')
    } catch (error) {
      logger.error('Ошибка возобновления таймера:', error)
    }
  }

  /**
   * Сбрасывает таймер
   */
  const reset = () => {
    try {
      resetTimer()
      playSound('reset')
      logger.log('🔄 Таймер сброшен')
    } catch (error) {
      logger.error('Ошибка сброса таймера:', error)
    }
  }

  /**
   * Получает текущее время в формате HH:MM:SS
   * @returns {string} отформатированное время
   */
  const getTime = () => {
    return getFormattedTime()
  }

  /**
   * Получает текущее время в секундах
   * @returns {number} время в секундах
   */
  const getSeconds = () => {
    return getCurrentElapsed()
  }

  /**
   * Получает количество полных часов
   * @returns {number} количество часов
   */
  const getHours = () => {
    return Math.floor(getCurrentElapsed() / 3600)
  }

  /**
   * Получает количество полных минут
   * @returns {number} количество минут
   */
  const getMinutes = () => {
    return Math.floor((getCurrentElapsed() % 3600) / 60)
  }

  /**
   * Получает количество секунд
   * @returns {number} количество секунд
   */
  const getSecondsOnly = () => {
    return Math.floor(getCurrentElapsed() % 60)
  }

  /**
   * Проверяет, работает ли таймер
   * @returns {boolean} true если таймер активен
   */
  const isRunning = () => {
    return isTimerRunning()
  }

  /**
   * Проверяет, на паузе ли таймер
   * @returns {boolean} true если таймер на паузе
   */
  const isPausedTimer = () => {
    return isPaused
  }

  /**
   * Получает информацию о таймере
   * @returns {Object} объект с информацией о таймере
   */
  const getInfo = () => {
    return {
      activeTimer,
      startTime,
      elapsedTime: getCurrentElapsed(),
      formattedTime: getFormattedTime(),
      isRunning: isTimerRunning(),
      isPaused: isPausedTimer(),
      hours: getHours(),
      minutes: getMinutes(),
      seconds: getSecondsOnly(),
    }
  }

  return {
    // Основные методы
    start,
    stop,
    pause,
    resume,
    reset,

    // Получение времени
    getTime,
    getSeconds,
    getHours,
    getMinutes,
    getSecondsOnly,

    // Состояние
    activeTimer,
    elapsedTime: getCurrentElapsed(),
    isRunning: isTimerRunning(),
    isPaused: isPausedTimer(),

    // Дополнительная информация
    getInfo,
  }
}
