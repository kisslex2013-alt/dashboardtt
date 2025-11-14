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
    // Если версия не определена или пользователь отклонил обновление, не проверяем
    if (!currentVersion || dismiss) return

    let intervalId = null

    // Задержка перед первой проверкой (чтобы дать время загрузиться приложению)
    const initialDelay = setTimeout(() => {
      intervalId = setInterval(async () => {
        try {
          const res = await fetch(`/version.json?ts=${Date.now()}`)
          const data = await res.json()

          // Проверяем, что версия действительно отличается и не пустая
          if (
            data.version &&
            currentVersion &&
            data.version !== currentVersion &&
            !dismiss
          ) {
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
      }, 60 * 60 * 1000) // Проверка раз в 60 минут
    }, 60 * 1000) // Первая проверка через 60 секунд после загрузки

    return () => {
      clearTimeout(initialDelay)
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
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

