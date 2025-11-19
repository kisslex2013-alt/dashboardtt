import { useState, useEffect } from 'react'

/**
 * 🎯 Хук для определения типа устройства (мобильное/десктоп)
 *
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 *
 * Этот хук определяет, является ли устройство мобильным или десктопным.
 * Он использует размер экрана для определения типа устройства.
 *
 * Использует matchMedia API для эффективного отслеживания изменений размера экрана.
 * Автоматически обновляется при изменении размера окна браузера.
 *
 * @returns {boolean} true если мобильное устройство (ширина < 768px), false если десктоп
 *
 * @example
 * function MyComponent() {
 *   const isMobile = useIsMobile();
 *
 *   return (
 *     <div>
 *       {isMobile ? <MobileView /> : <DesktopView />}
 *     </div>
 *   );
 * }
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => {
    // SSR-safe: проверяем наличие window
    if (typeof window === 'undefined') return false
    return window.innerWidth < 768
  })

  useEffect(() => {
    // Используем matchMedia для более точного определения
    const mediaQuery = window.matchMedia('(max-width: 767px)')

    // Функция обновления состояния
    const updateIsMobile = e => {
      setIsMobile(e.matches)
    }

    // Устанавливаем начальное значение
    setIsMobile(mediaQuery.matches)

    // Подписываемся на изменения
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', updateIsMobile)
    } else {
      // Fallback для старых браузеров
      mediaQuery.addListener(updateIsMobile)
    }

    // Также слушаем resize для дополнительной надежности
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', updateIsMobile)
      } else {
        mediaQuery.removeListener(updateIsMobile)
      }
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return isMobile
}
