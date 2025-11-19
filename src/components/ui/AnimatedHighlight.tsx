import { motion, useSpring, useTransform } from 'framer-motion'
import { useRef, useEffect, useMemo } from 'react'

/**
 * 🎨 Компонент для анимированного выделения чисел в тексте
 *
 * Анимирует выделенные цветом числа (например, "3 866 ₽", "Пн", "19:00")
 *
 * @param {string|number} value - Значение для анимации (может быть строкой с числом или числом)
 * @param {string} className - CSS классы
 * @param {boolean} shouldAnimate - Запускать ли анимацию
 * @param {number} delay - Задержка анимации в секундах
 */
export function AnimatedHighlight({ value, className = '', shouldAnimate = true, delay = 0 }) {
  const isFirstMountRef = useRef(true)
  const previousShouldAnimateRef = useRef(shouldAnimate)
  const isDateAnimationRef = useRef(true)
  const previousDateShouldAnimateRef = useRef(shouldAnimate)

  // Проверяем, есть ли в значении число для анимации
  const hasNumber = useMemo(() => {
    if (typeof value === 'number') return true
    if (typeof value === 'string') {
      return /\d/.test(value)
    }
    return false
  }, [value])

  // Определяем тип значения (время, деньги, число, дата)
  const valueType = useMemo(() => {
    if (typeof value === 'number') return 'number'
    if (typeof value === 'string') {
      // Формат времени HH:MM или H:MM
      if (/^\d{1,2}:\d{2}$/.test(value.trim())) return 'time'
      // Формат даты DD.MM.YYYY
      if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(value.trim())) return 'date'
      // Формат с валютой
      if (value.includes('₽')) return 'money'
      // Формат с часами
      if (value.includes('ч')) return 'duration'
      // Обычное число
      if (/\d/.test(value)) return 'number'
    }
    return 'text'
  }, [value])

  // Парсим числовое значение из текста
  const numericValue = useMemo(() => {
    if (typeof value === 'number') return value
    if (typeof value === 'string' && hasNumber) {
      // Для времени: "19:00" -> 19 (часы)
      if (valueType === 'time') {
        const timeMatch = value.match(/^(\d{1,2}):/)
        if (timeMatch) return parseInt(timeMatch[1], 10)
      }

      // Для даты: возвращаем 0, так как дату не анимируем как число
      if (valueType === 'date') {
        return 0
      }

      // Для остальных: извлекаем число из строки (например, "3 866 ₽" -> 3866)
      const cleaned = value.replace(/[^\d.,-]/g, '')
      if (!cleaned) return 0
      const parsed = parseFloat(cleaned.replace(',', '.'))
      return isNaN(parsed) ? 0 : parsed
    }
    return 0
  }, [value, hasNumber, valueType])

  const springValue = useSpring(hasNumber ? 0 : typeof value === 'number' ? value : 0, {
    stiffness: 100,
    damping: 30,
    duration: 0.8,
  })

  // Запускаем анимацию при первом монтировании или изменении shouldAnimate
  useEffect(() => {
    // Если нет числа, просто показываем оригинальное значение без анимации
    if (!hasNumber) {
      isFirstMountRef.current = false
      previousShouldAnimateRef.current = shouldAnimate
      return
    }

    // Для даты используем простую анимацию появления (не числовую)
    // Это обрабатывается в условии ниже, где возвращается motion.span с анимацией
    if (valueType === 'date') {
      // Устанавливаем флаги, чтобы компонент использовал простую анимацию
      isFirstMountRef.current = false
      previousShouldAnimateRef.current = shouldAnimate
      return
    }

    const shouldReset =
      isFirstMountRef.current ||
      (shouldAnimate && String(shouldAnimate) !== String(previousShouldAnimateRef.current))

    if (shouldReset) {
      springValue.set(0)
      const timer = setTimeout(
        () => {
          springValue.set(numericValue)
          isFirstMountRef.current = false
          previousShouldAnimateRef.current = shouldAnimate
        },
        100 + delay * 1000
      )
      return () => clearTimeout(timer)
    } else if (!isFirstMountRef.current) {
      springValue.set(numericValue)
    }
  }, [numericValue, springValue, shouldAnimate, delay, hasNumber, valueType])

  // Форматируем значение для отображения
  const displayValue = useTransform(springValue, latest => {
    // Если value это число - форматируем как число
    if (typeof value === 'number') {
      return Math.round(latest).toLocaleString('ru-RU')
    }
    // Если value это строка - сохраняем оригинальный формат
    if (typeof value === 'string') {
      // Если в строке нет числа (например, "Пн"), возвращаем оригинал
      if (!hasNumber) {
        return value
      }

      // Для времени: "19:00" -> форматируем как "19:00" (не "1 900:")
      if (valueType === 'time') {
        const timeMatch = value.match(/^(\d{1,2}):(\d{2})$/)
        if (timeMatch) {
          const hours = Math.round(latest)
          const minutes = timeMatch[2]
          return `${hours.toString().padStart(2, '0')}:${minutes}`
        }
      }

      // Для даты: возвращаем оригинал (дату не анимируем)
      if (valueType === 'date') {
        return value
      }

      // Сохраняем суффиксы и форматирование
      const suffixMatch = value.match(/[^\d.,\s]+/g)
      const suffix = suffixMatch ? suffixMatch.join('') : ''
      const prefixMatch = value.match(/^[^\d.,\s]+/)
      const prefix = prefixMatch ? prefixMatch[0] : ''

      const num = Math.round(latest)
      const formatted = num.toLocaleString('ru-RU')

      // Восстанавливаем оригинальный формат
      return `${prefix}${formatted}${suffix}`.trim()
    }
    return value
  })

  // Определяем, нужно ли запустить анимацию для дат/текста
  const shouldResetDate =
    isDateAnimationRef.current ||
    (shouldAnimate && String(shouldAnimate) !== String(previousDateShouldAnimateRef.current))

  // Обновляем refs для дат/текста
  useEffect(() => {
    if (shouldResetDate && (!hasNumber || valueType === 'date')) {
      isDateAnimationRef.current = false
      previousDateShouldAnimateRef.current = shouldAnimate
    }
  }, [shouldResetDate, shouldAnimate, hasNumber, valueType])

  // Если нет числа или это дата, используем простую анимацию появления
  if (!hasNumber || valueType === 'date') {
    return (
      <motion.span
        className={className}
        style={{ display: 'inline-block' }}
        initial={shouldResetDate && shouldAnimate ? { opacity: 0, y: 10 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.5,
          delay,
          ease: 'easeOut',
        }}
      >
        {value}
      </motion.span>
    )
  }

  return (
    <motion.span className={className} style={{ display: 'inline-block' }}>
      {displayValue}
    </motion.span>
  )
}
