import { useEffect, useState, useRef } from 'react'
import { logger } from '../utils/logger'

/**
 * Хук для проверки обновлений версии приложения
 * 
 * Механизм работы:
 * 1. Проверяет версию из /version.json каждые 60 минут
 * 2. Первая проверка через 60 секунд после загрузки
 * 3. При обнаружении новой версии показывает модальное окно
 * 4. Автоматическая перезагрузка через 10 секунд (если не отложено)
 * 
 * @param {string|null} currentVersion - Текущая версия приложения
 * @returns {Object} Объект с состоянием обновления
 */
export function useVersionCheck(currentVersion) {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [countdown, setCountdown] = useState(10)
  const [dismiss, setDismiss] = useState(true) // По умолчанию отключено, если версия не определена
  const [changelog, setChangelog] = useState([])
  const [progress, setProgress] = useState(0)
  const [newVersion, setNewVersion] = useState(null)
  // ✅ ИСПРАВЛЕНО: Ref для отслеживания уже показанной версии (чтобы не показывать циклически)
  const shownVersionRef = useRef(null)

  // КРИТИЧНО: Если версия не определена или пустая, автоматически отключаем проверку
  const isVersionValid = currentVersion && typeof currentVersion === 'string' && currentVersion.trim() !== ''

  // Ref для хранения интервала проверки (для очистки)
  const checkIntervalRef = useRef(null)
  const countdownIntervalRef = useRef(null)
  // Ref для хранения последнего ETag/Last-Modified
  const lastVersionETagRef = useRef(null)
  const lastVersionModifiedRef = useRef(null)

  // Активируем проверку, если версия валидна
  useEffect(() => {
    if (isVersionValid) {
      setDismiss(false) // Активируем проверку, если версия валидна
    } else {
      setDismiss(true) // Отключаем проверку, если версия не валидна
      setUpdateAvailable(false) // Сбрасываем флаг обновления
      shownVersionRef.current = null // ✅ ИСПРАВЛЕНО: Сбрасываем показанную версию
    }
  }, [isVersionValid])

  // ✅ ИСПРАВЛЕНО: Сбрасываем updateAvailable когда пользователь закрывает модальное окно
  useEffect(() => {
    if (dismiss && updateAvailable) {
      setUpdateAvailable(false)
      // Не сбрасываем shownVersionRef здесь, чтобы не показывать ту же версию снова при следующей проверке
    }
  }, [dismiss, updateAvailable])

  // Разрешение уведомлений
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission().catch(err => {
        logger.warn('Не удалось запросить разрешение на уведомления:', err)
      })
    }
  }, [])

  // ✅ ОТКЛЮЧЕНО: Проверка версии работает нестабильно
  // Проверка версии
  useEffect(() => {
    // КРИТИЧНО: Полностью отключаем проверку версии
    // Очищаем интервал, если он был установлен
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current)
      checkIntervalRef.current = null
    }
    return
    
    // КРИТИЧНО: Если версия не валидна или пользователь отклонил обновление - полностью отключаем проверку
    // if (!isVersionValid || dismiss) {
    //   // Очищаем интервал, если он был установлен
    //   if (checkIntervalRef.current) {
    //     clearInterval(checkIntervalRef.current)
    //     checkIntervalRef.current = null
    //   }
    //   return
    // }

    let intervalId = null

    // Функция проверки версии (использует ETag/Last-Modified для определения изменений)
    const checkVersion = async () => {
      try {
        // Используем HEAD запрос для проверки изменений без загрузки всего файла
        const headRes = await fetch(`/version.json?ts=${Date.now()}`, {
          method: 'HEAD',
          cache: 'no-store',
        })

        if (!headRes.ok) {
          // Если HEAD не поддерживается, используем обычный GET
          const res = await fetch(`/version.json?ts=${Date.now()}`, {
            cache: 'no-store',
          })

          if (!res.ok) {
            logger.warn(`Ошибка проверки версии: ${res.status}`)
            return
          }

          const etag = res.headers.get('ETag')
          const lastModified = res.headers.get('Last-Modified')

          // Если ETag/Last-Modified не изменились, файл не обновлялся
          if (
            (etag && etag === lastVersionETagRef.current) ||
            (lastModified && lastModified === lastVersionModifiedRef.current)
          ) {
            // Файл не изменился, пропускаем проверку
            return
          }

          const data = await res.json()

          // Обновляем ETag/Last-Modified
          if (etag) lastVersionETagRef.current = etag
          if (lastModified) lastVersionModifiedRef.current = lastModified

        // ✅ ИСПРАВЛЕНО: Проверяем, что версия действительно отличается и не пустая
        // И что эта версия еще не была показана (чтобы избежать циклического появления)
        if (
          data.version &&
          isVersionValid &&
          currentVersion &&
          data.version !== currentVersion &&
          !dismiss &&
          shownVersionRef.current !== data.version // ✅ Проверяем, что эта версия еще не была показана
        ) {
          logger.log('✅ Обнаружена новая версия:', data.version, 'Текущая:', currentVersion)
          shownVersionRef.current = data.version // ✅ Сохраняем показанную версию
          setUpdateAvailable(true)
          setNewVersion(data.version)
          setChangelog(data.changelog || [])

            // Показываем браузерное уведомление (если разрешено)
            if (Notification.permission === 'granted') {
              try {
                new Notification('Новая версия доступна', {
                  body: `Версия ${data.version} готова к установке. Страница будет обновлена автоматически.`,
                  icon: '/icon-192.png',
                  tag: 'version-update', // Тег для группировки уведомлений
                })
              } catch (err) {
                logger.warn('Не удалось показать уведомление:', err)
              }
            }
          }
          return
        }

        // Получаем ETag и Last-Modified из заголовков
        const etag = headRes.headers.get('ETag')
        const lastModified = headRes.headers.get('Last-Modified')

        // Если ETag/Last-Modified не изменились, файл не обновлялся
        if (
          (etag && etag === lastVersionETagRef.current) ||
          (lastModified && lastModified === lastVersionModifiedRef.current)
        ) {
          // Файл не изменился, пропускаем проверку
          return
        }

        // Файл изменился - загружаем его содержимое
        const res = await fetch(`/version.json?ts=${Date.now()}`, {
          cache: 'no-store',
        })

        if (!res.ok) {
          logger.warn(`Ошибка проверки версии: ${res.status}`)
          return
        }

        const data = await res.json()

        // Обновляем ETag/Last-Modified
        if (etag) lastVersionETagRef.current = etag
        if (lastModified) lastVersionModifiedRef.current = lastModified

        // ✅ ИСПРАВЛЕНО: Проверяем, что версия действительно отличается и не пустая
        // И что эта версия еще не была показана (чтобы избежать циклического появления)
        if (
          data.version &&
          isVersionValid &&
          currentVersion &&
          data.version !== currentVersion &&
          !dismiss &&
          shownVersionRef.current !== data.version // ✅ Проверяем, что эта версия еще не была показана
        ) {
          logger.log('✅ Обнаружена новая версия:', data.version, 'Текущая:', currentVersion)
          shownVersionRef.current = data.version // ✅ Сохраняем показанную версию
          setUpdateAvailable(true)
          setNewVersion(data.version)
          setChangelog(data.changelog || [])

          // Показываем браузерное уведомление (если разрешено)
          if (Notification.permission === 'granted') {
            try {
              new Notification('Новая версия доступна', {
                body: `Версия ${data.version} готова к установке. Страница будет обновлена автоматически.`,
                icon: '/icon-192.png',
                tag: 'version-update', // Тег для группировки уведомлений
              })
            } catch (err) {
              logger.warn('Не удалось показать уведомление:', err)
            }
          }
        }
      } catch (error) {
        // Тихая обработка ошибок - не логируем каждую ошибку сети
        if (error.name !== 'TypeError' || !error.message.includes('Failed to fetch')) {
          logger.warn('Ошибка при проверке версии:', error)
        }
      }
    }

    // Задержка перед первой проверкой (чтобы дать время загрузиться приложению)
    const initialDelay = setTimeout(() => {
      // Первая проверка сразу после задержки
      checkVersion()

      // Затем проверяем каждые 60 минут
      intervalId = setInterval(checkVersion, 60 * 60 * 1000)
      checkIntervalRef.current = intervalId
    }, 60 * 1000) // Первая проверка через 60 секунд после загрузки

    return () => {
      clearTimeout(initialDelay)
      if (intervalId) {
        clearInterval(intervalId)
      }
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current)
        checkIntervalRef.current = null
      }
    }
  }, [currentVersion, dismiss, isVersionValid])

  // Состояние паузы таймера
  const [isPaused, setIsPaused] = useState(false)
  // Ref для отслеживания, был ли таймер уже инициализирован
  const timerInitializedRef = useRef(false)
  // Ref для хранения актуального значения isPaused (чтобы избежать пересоздания интервала)
  const isPausedRef = useRef(false)
  
  // Обновляем ref при изменении isPaused
  useEffect(() => {
    isPausedRef.current = isPaused
  }, [isPaused])
  
  // Таймер обратного отсчета
  useEffect(() => {
    // КРИТИЧНО: Отключаем таймер, если версия не валидна или обновление отложено
    if (!updateAvailable || dismiss || !isVersionValid) {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
        countdownIntervalRef.current = null
      }
      timerInitializedRef.current = false
      return
    }

    // ✅ ИСПРАВЛЕНО: Сбрасываем countdown ТОЛЬКО при первом показе модального окна
    if (!timerInitializedRef.current) {
      setCountdown(10)
      timerInitializedRef.current = true
    }

    // Очищаем предыдущий интервал, если он существует
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }

    const t = setInterval(() => {
      // ✅ ИСПРАВЛЕНО: Используем ref для проверки паузы, чтобы не пересоздавать интервал
      if (isPausedRef.current) {
        return
      }
      
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(t)
          countdownIntervalRef.current = null
          timerInitializedRef.current = false
          // Добавляем небольшую задержку перед перезагрузкой
          setTimeout(() => {
            if (window.safeReload) {
              window.safeReload(true)
            } else {
              window.location.reload(true)
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
  }, [updateAvailable, dismiss, isVersionValid]) // ✅ ИСПРАВЛЕНО: Убрали isPaused из зависимостей

  // Прогресс-бар
  useEffect(() => {
    if (!updateAvailable || dismiss) {
      setProgress(0)
      return
    }
    const completed = ((10 - countdown) / 10) * 100
    setProgress(Math.max(0, Math.min(100, completed)))
  }, [countdown, updateAvailable, dismiss])

  // ✅ ИСПРАВЛЕНО: Сбрасываем shownVersionRef когда текущая версия обновляется
  // Это позволяет показывать следующую новую версию после обновления
  useEffect(() => {
    if (currentVersion && shownVersionRef.current === currentVersion) {
      // Если текущая версия совпадает с показанной, значит пользователь обновился
      // Сбрасываем ref, чтобы можно было показать следующую новую версию
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
