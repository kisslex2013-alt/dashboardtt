/**
 * Хук для работы с таймером
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
import type { TimeEntry, Category } from '../types'

interface TimerInfo {
  activeTimer: string | null
  startTime: string | null
  elapsedTime: number
  formattedTime: string
  isRunning: boolean
  isPaused: boolean
  hours: number
  minutes: number
  seconds: number
}

interface UseTimerReturn {
  start: (category: string) => void
  stop: () => TimeEntry | null
  pause: () => void
  resume: () => void
  reset: () => void
  getTime: () => string
  getSeconds: () => number
  getHours: () => number
  getMinutes: () => number
  getSecondsOnly: () => number
  activeTimer: string | null
  elapsedTime: number
  isRunning: boolean
  isPaused: boolean
  getInfo: () => TimerInfo
}

/**
 * Хук для работы с таймером
 */
export function useTimer(): UseTimerReturn {
  const activeTimer = useActiveTimer()
  const startTime = useStartTime()
  const isPaused = useIsPaused()
  const timerEntryId = useTimerEntryId()
  const pomodoroIsRunning = usePomodoroIsRunning()

  const startTimer = useStartTimer()
  const stopTimer = useStopTimer()
  const pauseTimer = usePauseTimer()
  const resumeTimer = useResumeTimer()
  const updateElapsed = useUpdateElapsed()
  const resetTimer = useResetTimer()
  const setTimerEntryId = useSetTimerEntryId()

  const getCurrentElapsed = useCallback((): number => {
    return useTimerStore.getState().getCurrentElapsed()
  }, [])

  const getFormattedTime = useCallback((): string => {
    return useTimerStore.getState().getFormattedTime()
  }, [])

  const isTimerRunning = useCallback((): boolean => {
    return useTimerStore.getState().isRunning()
  }, [])

  const addEntry = useAddEntry()
  const updateEntry = useUpdateEntry()
  const categories = useCategories() as Category[]
  const notifications = useNotificationsSettings()
  const { playSound } = useSoundManager()
  const lastNotificationTimeRef = useRef<number>(0)

  useFavicon(!!activeTimer, isPaused)
  useBreakReminders()

  const formatElapsedTime = useCallback((ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }, [])

  useEffect(() => {
    const updateTitle = (): void => {
      if (pomodoroIsRunning) {
        return
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

      const handleVisibilityChange = (): void => {
        if (document.visibilityState === 'visible') {
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

  useEffect(() => {
    if (!activeTimer || isPaused) {
      lastNotificationTimeRef.current = 0
      return
    }

    const interval = setInterval(() => {
      updateElapsed()

      const currentElapsed = getCurrentElapsed()

      const hours = Math.floor(currentElapsed / 3600)
      const prevHours = Math.floor((currentElapsed - 1) / 3600)

      if (hours > prevHours && hours > 0) {
        playSound('hourlyAlert')
        if (document.visibilityState === 'visible') {
          logger.log(`🔔 Прошел ${hours} час(ов) работы`)
        }
      }

      if (notifications.soundNotificationsEnabled && notifications.notificationInterval > 0) {
        const notificationIntervalSeconds = notifications.notificationInterval * 60
        const nextNotificationTarget = lastNotificationTimeRef.current + notificationIntervalSeconds

        if (currentElapsed >= nextNotificationTarget) {
          const soundType = notifications.notificationSound || 'chime'
          playSound(soundType)
          if (document.visibilityState === 'visible') {
            logger.log(`🔔 Звуковое уведомление (${notifications.notificationInterval} минут)`)
          }
          lastNotificationTimeRef.current =
            Math.floor(currentElapsed / notificationIntervalSeconds) * notificationIntervalSeconds
        }
      }
    }, 1000)

    const handleVisibilityChange = (): void => {
      if (document.visibilityState === 'visible') {
        updateElapsed()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [activeTimer, isPaused, updateElapsed, getCurrentElapsed, playSound, notifications])

  const start = (category: string): void => {
    try {
      const now = new Date()
      const startDate = formatDate(now)
      const startTimeStr = formatTime(now)

      const categoryObj = categories.find((cat: Category) => cat.name === category)
      const rate = categoryObj?.rate || 1000

      const newEntry = {
        date: startDate,
        start: startTimeStr,
        end: '',
        category,
        categoryId: categoryObj?.id || null,
        description: 'Работа по таймеру',
        rate,
        earned: 0,
        duration: 0,
        isManual: false,
      }

      const entryId = generateUUID()

      const entryWithId = {
        ...newEntry,
        id: entryId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      setTimerEntryId(entryId)
      addEntry(entryWithId)
      startTimer(category)

      logger.log(`⏱️ Таймер запущен для категории: ${category}`)
      lastNotificationTimeRef.current = 0
      playSound('timerStart')
    } catch (error) {
      logger.error('Ошибка запуска таймера:', error)
    }
  }

  const stop = (): TimeEntry | null => {
    try {
      if (!activeTimer || !startTime) {
        logger.error('Таймер не запущен')
        return null
      }

      const elapsed = stopTimer()
      playSound('timerStop')

      const now = new Date()
      const startDate = new Date(startTime)
      const durationHours = (elapsed / 3600).toFixed(2)

      const categoryObj = categories.find((cat: Category) => cat.name === activeTimer)
      const rate = categoryObj?.rate || 1000
      const earned = parseFloat(calculateEarned(durationHours, rate))

      if (timerEntryId) {
        const updates = {
          end: formatTime(now),
          duration: parseFloat(durationHours),
          earned,
        }

        updateEntry(timerEntryId, updates)
        logger.log(`⏹️ Таймер остановлен. Запись обновлена (ID: ${timerEntryId})`)

        const entries = useEntriesStore.getState().entries as TimeEntry[]
        const timerEntryIdString = timerEntryId ? String(timerEntryId) : null
        const updatedEntry = timerEntryIdString
          ? entries.find((e: TimeEntry) => String(e.id) === timerEntryIdString)
          : null

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
            isManual: false,
          }
        ) as TimeEntry
      }

      const entryData: TimeEntry = {
        id: generateUUID(),
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

      logger.log(`⏹️ Таймер остановлен.`)
      return entryData
    } catch (error) {
      logger.error('Ошибка остановки таймера:', error)
      return null
    }
  }

  const pause = (): void => {
    try {
      pauseTimer()
      playSound('pause')
      logger.log('⏸️ Таймер поставлен на паузу')
    } catch (error) {
      logger.error('Ошибка паузы таймера:', error)
    }
  }

  const resume = (): void => {
    try {
      resumeTimer()
      playSound('resume')
      logger.log('▶️ Таймер возобновлен')
    } catch (error) {
      logger.error('Ошибка возобновления таймера:', error)
    }
  }

  const reset = (): void => {
    try {
      resetTimer()
      playSound('reset')
      logger.log('🔄 Таймер сброшен')
    } catch (error) {
      logger.error('Ошибка сброса таймера:', error)
    }
  }

  const getTime = (): string => getFormattedTime()
  const getSeconds = (): number => getCurrentElapsed()
  const getHours = (): number => Math.floor(getCurrentElapsed() / 3600)
  const getMinutes = (): number => Math.floor((getCurrentElapsed() % 3600) / 60)
  const getSecondsOnly = (): number => Math.floor(getCurrentElapsed() % 60)
  const isPausedTimer = (): boolean => isPaused

  const getInfo = (): TimerInfo => ({
    activeTimer,
    startTime,
    elapsedTime: getCurrentElapsed(),
    formattedTime: getFormattedTime(),
    isRunning: isTimerRunning(),
    isPaused: isPausedTimer(),
    hours: getHours(),
    minutes: getMinutes(),
    seconds: getSecondsOnly(),
  })

  return {
    start,
    stop,
    pause,
    resume,
    reset,
    getTime,
    getSeconds,
    getHours,
    getMinutes,
    getSecondsOnly,
    activeTimer,
    elapsedTime: getCurrentElapsed(),
    isRunning: isTimerRunning(),
    isPaused: isPausedTimer(),
    getInfo,
  }
}
