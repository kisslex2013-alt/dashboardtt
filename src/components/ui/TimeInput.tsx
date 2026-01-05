import React, { useState, useRef, useEffect } from 'react'
import PropTypes from 'prop-types'
import { useIsMobile } from '../../hooks/useIsMobile'

interface TimeInputProps {
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  error?: string
  onComplete?: () => void
  hideErrorText?: boolean
}

/**
 * 🕐 Кастомный компонент ввода времени с 24-часовым форматом
 * - Поддержка 24-часового формата (00:00 - 23:59)
 * - Валидация ввода
 * - Форматирование автоматическое
 *
 * АДАПТИВНОСТЬ: На мобильных устройствах использует type="time" для нативного выбора времени
 */
// ИСПРАВЛЕНО: Добавлена поддержка forwardRef для доступа к input элементу
export const TimeInput = React.forwardRef<HTMLInputElement, TimeInputProps>(
  (
    {
      value,
      onChange,
      placeholder = 'чч:мм',
      className = '',
      error,
      onComplete, // ИСПРАВЛЕНО: Добавлен callback для автофокуса
      hideErrorText = false,
    },
    ref
  ) => {
    const isMobile = useIsMobile()
    const [displayValue, setDisplayValue] = useState(value || '')
    const inputRef = useRef<HTMLInputElement>(null)

    // ИСПРАВЛЕНО: Поддержка внешнего ref
    useEffect(() => {
      if (ref) {
        if (typeof ref === 'function') {
          ref(inputRef.current)
        } else {
          ref.current = inputRef.current
        }
      }
    }, [ref])

    useEffect(() => {
      setDisplayValue(value || '')
    }, [value])

    const formatTime = input => {
      // Если пользователь явно ввел двоеточие, уважаем его выбор
      if (input.includes(':')) {
        const parts = input.split(':')
        let hours = parts[0].replace(/\D/g, '').slice(0, 2)
        let minutes = parts[1] ? parts[1].replace(/\D/g, '').slice(0, 2) : ''

        // Если часы пусты, но есть минуты, или введен разделитель - оставляем как есть
        if (input.endsWith(':')) {
           return `${hours}:`
        }
        
        // Если есть минуты, возвращаем с разделителем
        if (minutes) {
           return `${hours}:${minutes}`
        }
        
        // Если есть только часы
        return `${hours}:${minutes}`
      }

      // Старая логика для ввода только цифр (fallback)
      const digits = input.replace(/\D/g, '')

      if (digits.length === 0) return ''
      if (digits.length <= 2) return digits
      
      // Если больше 2 цифр, предполагаем HHMM
      return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`
    }

    const validateTime = timeString => {
      if (!timeString) return true

      const [hours, minutes] = timeString.split(':').map(Number)

      // Проверяем валидность
      if (isNaN(hours)) return false
      // Минуты могут быть пустыми при вводе
      if (minutes === undefined || isNaN(minutes)) return false
      
      if (hours < 0 || hours > 23) return false
      if (minutes < 0 || minutes > 59) return false

      return true
    }

    const handleChange = e => {
      const input = e.target.value
      // Используем умное форматирование
      let formatted = formatTime(input)

      // Фикс удаление двоеточия: если пользователь удаляет двоеточие, объединяем части
      // (Это упрощенно, полное управление курсором требует больше логики)
      
      setDisplayValue(formatted)

      // Если время валидно и полное (HH:MM), вызываем onChange
      // Проверяем длину (формат H:MM, HH:MM, H:M и т.д.)
      // Для строгости требуем 5 символов или валидные HH:MM
      if (validateTime(formatted) && (formatted.length === 5 || (formatted.length === 4 && formatted.indexOf(':') === 1))) {
        // Нормализуем HH:MM перед отправкой
        const [h, m] = formatted.split(':')
        const normalized = `${h.padStart(2, '0')}:${m.padStart(2, '0')}`
        
        onChange(normalized)
        
        // ИСПРАВЛЕНО: Автоматический переход на следующее поле
        if (onComplete && normalized.length === 5) {
          setTimeout(() => {
            onComplete()
          }, 200)
        }
      } else if (formatted.length === 0) {
        onChange('')
      }
    }

    const handleBlur = () => {
      // При потере фокуса форматируем красиво
      if (displayValue) {
        const [h, m] = displayValue.split(':')
        // Если есть хоть что-то
        if (h !== undefined) {
           const hours = Math.min(parseInt(h || '0', 10), 23)
           const minutes = m ? Math.min(parseInt(m, 10), 59) : 0
           
           const corrected = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
           setDisplayValue(corrected)
           onChange(corrected)
        }
      }
    }

    // На мобильных устройствах используем нативный input type="time"
    if (isMobile) {
      // Конвертируем значение из HH:MM в формат для type="time"
      const timeValue = displayValue && displayValue.length === 5 ? displayValue : ''

      return (
        <>
          <input
            ref={inputRef}
            type="time"
            value={timeValue}
            onChange={e => {
              const newValue = e.target.value
              setDisplayValue(newValue)
              onChange(newValue)
              if (onComplete && newValue) {
                // UX: Задержка 200ms, чтобы пользователь успел увидеть ввод перед сменой фокуса
                setTimeout(() => {
                  onComplete()
                }, 200)
              }
            }}
            onBlur={handleBlur}
            className={`
            w-full px-4 py-3
            ${error ? 'test-red-background' : 'bg-white/80 dark:bg-gray-800/80'}
            backdrop-blur-lg
            rounded-lg
            border-2 ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            transition-normal
            text-gray-900 dark:text-gray-100
            text-base
            touch-manipulation
            ${className}
          `}
            style={{ minHeight: '44px' }}
            aria-label={placeholder || 'Время'}
            aria-invalid={!!error}
            aria-describedby={error ? 'time-input-error' : undefined}
            id="time-input-mobile"
            aria-required="true"
          />
          {error && !hideErrorText && (
            <p
              id="time-input-error"
              className="text-red-500 text-sm mt-1"
              role="alert"
              aria-live="polite"
            >
              {error}
            </p>
          )}
        </>
      )
    }

    // Десктопная версия: кастомный ввод с форматированием
    return (
      <>
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          maxLength={5}
          className={`
          w-full px-4 py-2
          ${error ? 'test-red-background' : 'bg-white/80 dark:bg-gray-800/80'}
          backdrop-blur-lg
          rounded-lg
          border-2 ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          transition-normal
          placeholder-gray-500 dark:placeholder-gray-400
          text-gray-900 dark:text-gray-100
          font-mono
          ${className}
        `}
          aria-label={placeholder || 'Время'}
          aria-invalid={!!error}
          aria-describedby={error ? 'time-input-error' : undefined}
          id="time-input-desktop"
          aria-required="true"
        />
        {error && !hideErrorText && (
          <p
            id="time-input-error"
            className="text-red-500 text-sm mt-1"
            role="alert"
            aria-live="polite"
          >
            {error}
          </p>
        )}
      </>
    )
  }
)

TimeInput.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
      className: PropTypes.string,
  error: PropTypes.string,
  onComplete: PropTypes.func, // ИСПРАВЛЕНО: Добавлен prop для автофокуса
  hideErrorText: PropTypes.bool,
}
