/**
 * 📱 BREAKPOINTS SYSTEM
 * Централизованные константы для responsive дизайна.
 * Синхронизированы с Tailwind CSS и CSS media queries.
 *
 * Используй эти константы вместо hardcoded значений!
 */

// Tailwind CSS стандартные breakpoints
export const BREAKPOINTS = {
  /** Мобильные устройства (до 640px) */
  sm: 640,
  /** Планшеты (до 768px) */
  md: 768,
  /** Небольшие ноутбуки (до 1024px) */
  lg: 1024,
  /** Десктопы (до 1280px) */
  xl: 1280,
  /** Большие мониторы (до 1536px) */
  '2xl': 1536,
} as const

// Семантические алиасы для удобства
export const SCREENS = {
  /** Мобильный телефон (< 640px) */
  mobile: BREAKPOINTS.sm,
  /** Планшет (< 768px) */
  tablet: BREAKPOINTS.md,
  /** Ноутбук (< 1024px) */
  laptop: BREAKPOINTS.lg,
  /** Десктоп (< 1280px) */
  desktop: BREAKPOINTS.xl,
} as const

// CSS Media Query strings для использования в matchMedia
export const MEDIA_QUERIES = {
  /** max-width: 639px (мобильный) */
  isMobile: `(max-width: ${BREAKPOINTS.sm - 1}px)`,
  /** max-width: 767px (планшет и меньше) */
  isTabletOrSmaller: `(max-width: ${BREAKPOINTS.md - 1}px)`,
  /** min-width: 768px (планшет и больше) */
  isTabletOrLarger: `(min-width: ${BREAKPOINTS.md}px)`,
  /** min-width: 1024px (ноутбук и больше) */
  isLaptopOrLarger: `(min-width: ${BREAKPOINTS.lg}px)`,
  /** min-width: 1280px (десктоп) */
  isDesktop: `(min-width: ${BREAKPOINTS.xl}px)`,
} as const

// Хелпер для проверки ширины экрана
export const isScreenSmallerThan = (breakpoint: keyof typeof BREAKPOINTS): boolean => {
  if (typeof window === 'undefined') return false
  return window.innerWidth < BREAKPOINTS[breakpoint]
}

export const isScreenLargerThan = (breakpoint: keyof typeof BREAKPOINTS): boolean => {
  if (typeof window === 'undefined') return false
  return window.innerWidth >= BREAKPOINTS[breakpoint]
}

// Типы для TypeScript
export type BreakpointKey = keyof typeof BREAKPOINTS
export type ScreenKey = keyof typeof SCREENS
