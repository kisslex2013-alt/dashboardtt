import { useEffect, useState } from 'react'

export function useVersionCheck(currentVersion) {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [countdown, setCountdown] = useState(10)
  const [dismiss, setDismiss] = useState(false)
  const [changelog, setChangelog] = useState([])

  const [progress, setProgress] = useState(0)

  // Разрешение уведомлений
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // Проверка версии
  useEffect(() => {
    if (dismiss) return // Если пользователь отклонил обновление, не проверяем

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/version.json?ts=${Date.now()}`)
        const data = await res.json()

        if (data.version !== currentVersion && !dismiss) {
          setUpdateAvailable(true)
          setChangelog(data.changelog || [])

          if (Notification.permission === 'granted') {
            new Notification('Новая версия доступна', {
              body: 'Страница будет обновлена автоматически.',
              icon: '/icon-192.png',
            })
          }
        }
      } catch {}
    }, 10000)

    return () => clearInterval(interval)
  }, [currentVersion, dismiss])

  // Таймер
  useEffect(() => {
    if (!updateAvailable || dismiss) return

    const t = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(t)
          window.location.reload(true)
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(t)
  }, [updateAvailable, dismiss])

  // Прогресс-бар
  useEffect(() => {
    const completed = ((10 - countdown) / 10) * 100
    setProgress(completed)
  }, [countdown])

  return {
    updateAvailable,
    countdown,
    dismiss,
    setDismiss,
    progress,
    changelog,
  }
}

