/**
 * 📳 Haptic Feedback Hook
 *
 * Хук для вибрационной обратной связи на мобильных устройствах.
 * Best practice: тактильная обратная связь улучшает UX на мобильных.
 *
 * Использует Vibration API (поддерживается в Chrome, Firefox, Edge на Android)
 */

type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning' | number | number[]

interface UseHapticOptions {
  /** Отключить haptic feedback */
  disabled?: boolean
}

interface UseHapticResult {
  /** Запустить вибрацию */
  trigger: (pattern?: HapticPattern) => void
  /** Проверка поддержки */
  isSupported: boolean
  /** Вибрация при успехе */
  success: () => void
  /** Вибрация при ошибке */
  error: () => void
  /** Вибрация при предупреждении */
  warning: () => void
  /** Легкая вибрация (для кнопок) */
  light: () => void
  /** Средняя вибрация */
  medium: () => void
  /** Сильная вибрация */
  heavy: () => void
}

// Паттерны вибрации (мс)
const HAPTIC_PATTERNS: Record<string, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [10, 50, 10], // Короткий-пауза-короткий
  error: [50, 100, 50, 100, 50], // Три длинных
  warning: [25, 50, 25], // Два средних
}

/**
 * useHaptic — хук для вибрационной обратной связи
 *
 * @example
 * const { trigger, success, error, isSupported } = useHaptic()
 *
 * const handleClick = () => {
 *   trigger('light')
 *   // или success(), error(), warning()
 * }
 */
export function useHaptic({ disabled = false }: UseHapticOptions = {}): UseHapticResult {
  // Проверяем поддержку Vibration API
  const isSupported = typeof navigator !== 'undefined' && 'vibrate' in navigator

  const trigger = (pattern: HapticPattern = 'light') => {
    if (disabled || !isSupported) return

    try {
      let vibrationPattern: number | number[]

      if (typeof pattern === 'string') {
        vibrationPattern = HAPTIC_PATTERNS[pattern] || HAPTIC_PATTERNS.light
      } else {
        vibrationPattern = pattern
      }

      navigator.vibrate(vibrationPattern)
    } catch (e) {
      // Игнорируем ошибки — не критично
      console.debug('Haptic feedback failed:', e)
    }
  }

  return {
    trigger,
    isSupported,
    success: () => trigger('success'),
    error: () => trigger('error'),
    warning: () => trigger('warning'),
    light: () => trigger('light'),
    medium: () => trigger('medium'),
    heavy: () => trigger('heavy'),
  }
}

/**
 * withHaptic — HOC для добавления haptic feedback к обработчикам
 *
 * @example
 * const handleClick = withHaptic(() => {
 *   console.log('Button clicked!')
 * }, 'light')
 */
export function withHaptic<T extends (...args: unknown[]) => void>(
  handler: T,
  pattern: HapticPattern = 'light'
): T {
  return ((...args: unknown[]) => {
    // Trigger haptic
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      const vibrationPattern = typeof pattern === 'string'
        ? HAPTIC_PATTERNS[pattern] || 10
        : pattern
      navigator.vibrate(vibrationPattern)
    }

    // Call original handler
    return handler(...args)
  }) as T
}

/**
 * HapticButton — кнопка с автоматическим haptic feedback
 */
interface HapticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Паттерн вибрации */
  hapticPattern?: HapticPattern
  /** Отключить haptic */
  disableHaptic?: boolean
  /** Дочерние элементы */
  children: React.ReactNode
}

export function HapticButton({
  hapticPattern = 'light',
  disableHaptic = false,
  children,
  onClick,
  ...props
}: HapticButtonProps) {
  const { trigger } = useHaptic({ disabled: disableHaptic })

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    trigger(hapticPattern)
    onClick?.(e)
  }

  return (
    <button onClick={handleClick} {...props}>
      {children}
    </button>
  )
}
