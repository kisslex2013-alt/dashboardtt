import { useState, useEffect } from 'react'
import { BREAKPOINTS, MEDIA_QUERIES } from '../styles/breakpoints'

/**
 * 🎯 Хук для определения типа устройства (мобильное/десктоп)
 *
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 *
 * Этот хук определяет, является ли устройство мобильным или десктопным.
 * Использует централизованные breakpoints из styles/breakpoints.ts
 *
 * Использует matchMedia API для эффективного отслеживания изменений размера экрана.
 * Автоматически обновляется при изменении размера окна браузера.
 *
 * @returns true если мобильное устройство (ширина < 768px), false если десктоп
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const isMobile = useIsMobile()
 *
 *   return (
 *     <div className={isMobile ? 'mobile-layout' : 'desktop-layout'}>
 *       {isMobile ? <MobileView /> : <DesktopView />}
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * ```tsx
 * function ResponsiveChart() {
 *   const isMobile = useIsMobile()
 *   const chartHeight = isMobile ? 200 : 400
 *
 *   return <Chart height={chartHeight} />
 * }
 * ```
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    // SSR-safe: проверяем наличие window
    if (typeof window === 'undefined') return false
    return window.innerWidth < BREAKPOINTS.md
  })

  useEffect(() => {
    // Используем matchMedia для более точного определения
    const mediaQuery = window.matchMedia(MEDIA_QUERIES.isTabletOrSmaller)

    // Функция обновления состояния
    const updateIsMobile = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches)
    }

    // Устанавливаем начальное значение
    setIsMobile(mediaQuery.matches)

    // Подписываемся на изменения
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', updateIsMobile)
    } else {
      // Fallback для старых браузеров
      // @ts-ignore - addListener deprecated but needed for old browsers
      mediaQuery.addListener(updateIsMobile)
    }

    const handleResize = () => {
      setIsMobile(window.innerWidth < BREAKPOINTS.md)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', updateIsMobile)
      } else {
        // @ts-ignore - removeListener deprecated but needed for old browsers
        mediaQuery.removeListener(updateIsMobile)
      }
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return isMobile
}

