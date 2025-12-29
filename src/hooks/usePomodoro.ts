/**
 * 🍅 Хук для работы с Pomodoro таймером
 */

import { useEffect, useCallback, useRef, useMemo } from 'react'
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

type PomodoroMode = 'work' | 'shortBreak' | 'longBreak'

interface UsePomodoroReturn {
  mode: PomodoroMode
  timeLeft: number
  isRunning: boolean
  pomodorosCompleted: number
  formattedTime: string
  progress: number
  start: () => void
  pause: () => void
  resume: () => void
  stop: () => void
  reset: () => void
  nextMode: () => void
  formatTime: (seconds: number) => string
}

/**
 * Хук для работы с Pomodoro таймером
 */
export function usePomodoro(): UsePomodoroReturn {
  const mode = usePomodoroMode() as PomodoroMode
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
  const { showSuccess } = useNotifications()
  const timer = useTimer()
  const openModal = useOpenModal()
  const defaultCategory = useDefaultCategory()

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }, [])

  useEffect(() => {
    if (!isRunning) return

    const interval = setInterval(() => {
      usePomodoroStore.getState().tick()
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning])

  useEffect(() => {
    if (isRunning) {
      const updateTitle = (): void => {
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

  const previousTimeLeftRef = useRef<number>(timeLeft)
  const previousModeRef = useRef<PomodoroMode>(mode)

  useEffect(() => {
    if (previousTimeLeftRef.current > 0 && timeLeft === 0 && !isRunning) {
      const previousMode = previousModeRef.current

      if (previousMode === 'work' && timer.isRunning) {
        const entryData = timer.stop()

        if (entryData) {
          openModal('editEntry', { entry: entryData })
          showSuccess('Pomodoro завершен! Проверьте и сохраните запись.')
        }
      }

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

  const progress = useMemo(() => {
    const duration = usePomodoroStore.getState().getDurationForMode()
    const totalSeconds = duration * 60
    return ((totalSeconds - timeLeft) / totalSeconds) * 100
  }, [timeLeft, mode])

  const start = useCallback((): void => {
    if (timer.isRunning) {
      pomodoroStart()
      showSuccess('Pomodoro запущен поверх текущего таймера')
      return
    }

    timer.start(defaultCategory)
    pomodoroStart()
    showSuccess('Pomodoro запущен (25 мин)')
  }, [timer, pomodoroStart, showSuccess, defaultCategory])

  const pause = useCallback((): void => {
    pomodoroPause()

    if (timer.isRunning) {
      timer.pause()
      logger.log('🍅 Оба таймера на паузе')
    }
  }, [pomodoroPause, timer])

  const resume = useCallback((): void => {
    pomodoroResume()

    if (timer.isPaused) {
      timer.resume()
      logger.log('🍅 Оба таймера возобновлены')
    }
  }, [pomodoroResume, timer])

  const stop = useCallback((): void => {
    pomodoroReset()

    if (timer.isRunning || timer.isPaused) {
      const entryData = timer.stop()

      if (entryData) {
        openModal('editEntry', { entry: entryData })
        showSuccess('Pomodoro остановлен. Запись сохранена.')
      }
    }
  }, [pomodoroReset, timer, openModal, showSuccess])

  const reset = useCallback((): void => {
    pomodoroReset()
    logger.log('🍅 Pomodoro сброшен')
  }, [pomodoroReset])

  return {
    mode,
    timeLeft,
    isRunning,
    pomodorosCompleted,
    formattedTime: formatTime(timeLeft),
    progress,
    start,
    pause,
    resume,
    stop,
    reset,
    nextMode,
    formatTime,
  }
}
