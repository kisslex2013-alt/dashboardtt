import { useEffect, useState } from 'react'

export function useVersionCheck(currentVersion) {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [countdown, setCountdown] = useState(10)
  const [dismiss, setDismiss] = useState(true) // По умолчанию отключено, если версия не определена
  const [changelog, setChangelog] = useState([])

  const [progress, setProgress] = useState(0)

  // КРИТИЧНО: Если версия не определена или пустая, автоматически отключаем проверку
  const isVersionValid = currentVersion && typeof currentVersion === 'string' && currentVersion.trim() !== ''

  // Активируем проверку, если версия валидна
  useEffect(() => {
    if (isVersionValid) {
      setDismiss(false) // Активируем проверку, если версия валидна
    } else {
      setDismiss(true) // Отключаем проверку, если версия не валидна
      setUpdateAvailable(false) // Сбрасываем флаг обновления
    }
  }, [isVersionValid])

  // Разрешение уведомлений
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // Проверка версии
  useEffect(() => {
    // КРИТИЧНО: Если версия не валидна или пользователь отклонил обновление - полностью отключаем проверку
    if (!isVersionValid || dismiss) {
      return
    }

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
            isVersionValid &&
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
  }, [currentVersion, dismiss, isVersionValid])

  // Таймер
  useEffect(() => {
    // КРИТИЧНО: Отключаем таймер, если версия не валидна
    if (!updateAvailable || dismiss || !isVersionValid) return

    const t = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(t)
          // Добавляем небольшую задержку перед перезагрузкой
          setTimeout(() => {
            if (window.safeReload) {
              window.safeReload(true)
            } else {
              window.location.reload(true)
            }
          }, 100)
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(t)
  }, [updateAvailable, dismiss, isVersionValid])

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

