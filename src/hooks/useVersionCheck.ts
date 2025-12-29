/**
 * Хук для проверки обновлений версии приложения
 */

import { useEffect, useState, useRef } from 'react'
import { logger } from '../utils/logger'

declare global {
  interface Window {
    safeReload?: (force?: boolean) => void
  }
}

interface UseVersionCheckReturn {
  updateAvailable: boolean
  countdown: number
  dismiss: boolean
  setDismiss: React.Dispatch<React.SetStateAction<boolean>>
  progress: number
  changelog: string[]
  newVersion: string | null
  isPaused: boolean
  setIsPaused: React.Dispatch<React.SetStateAction<boolean>>
}

/**
 * Хук для проверки обновлений версии приложения
 */
export function useVersionCheck(currentVersion: string | null): UseVersionCheckReturn {
  const [updateAvailable, setUpdateAvailable] = useState<boolean>(false)
  const [countdown, setCountdown] = useState<number>(10)
  const [dismiss, setDismiss] = useState<boolean>(true)
  const [changelog, setChangelog] = useState<string[]>([])
  const [progress, setProgress] = useState<number>(0)
  const [newVersion, setNewVersion] = useState<string | null>(null)
  const shownVersionRef = useRef<string | null>(null)

  const isVersionValid = currentVersion && typeof currentVersion === 'string' && currentVersion.trim() !== ''

  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastVersionETagRef = useRef<string | null>(null)
  const lastVersionModifiedRef = useRef<string | null>(null)

  useEffect(() => {
    if (isVersionValid) {
      setDismiss(false)
    } else {
      setDismiss(true)
      setUpdateAvailable(false)
      shownVersionRef.current = null
    }
  }, [isVersionValid])

  useEffect(() => {
    if (dismiss && updateAvailable) {
      setUpdateAvailable(false)
    }
  }, [dismiss, updateAvailable])

  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission().catch(err => {
        logger.warn('Не удалось запросить разрешение на уведомления:', err)
      })
    }
  }, [])

  // КРИТИЧНО: Проверка версии отключена
  useEffect(() => {
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current)
      checkIntervalRef.current = null
    }
    return
  }, [currentVersion, dismiss, isVersionValid])

  const [isPaused, setIsPaused] = useState<boolean>(false)
  const timerInitializedRef = useRef<boolean>(false)
  const isPausedRef = useRef<boolean>(false)

  useEffect(() => {
    isPausedRef.current = isPaused
  }, [isPaused])

  useEffect(() => {
    if (!updateAvailable || dismiss || !isVersionValid) {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
        countdownIntervalRef.current = null
      }
      timerInitializedRef.current = false
      return
    }

    if (!timerInitializedRef.current) {
      setCountdown(10)
      timerInitializedRef.current = true
    }

    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }

    const t = setInterval(() => {
      if (isPausedRef.current) {
        return
      }

      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(t)
          countdownIntervalRef.current = null
          timerInitializedRef.current = false
          setTimeout(() => {
            if (window.safeReload) {
              window.safeReload(true)
            } else {
              window.location.reload()
            }
          }, 100)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    countdownIntervalRef.current = t

    return () => {
      if (t) {
        clearInterval(t)
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
        countdownIntervalRef.current = null
      }
    }
  }, [updateAvailable, dismiss, isVersionValid])

  useEffect(() => {
    if (!updateAvailable || dismiss) {
      setProgress(0)
      return
    }
    const completed = ((10 - countdown) / 10) * 100
    setProgress(Math.max(0, Math.min(100, completed)))
  }, [countdown, updateAvailable, dismiss])

  useEffect(() => {
    if (currentVersion && shownVersionRef.current === currentVersion) {
      shownVersionRef.current = null
      setUpdateAvailable(false)
    }
  }, [currentVersion])

  return {
    updateAvailable,
    countdown,
    dismiss,
    setDismiss,
    progress,
    changelog,
    newVersion,
    isPaused,
    setIsPaused,
  }
}
