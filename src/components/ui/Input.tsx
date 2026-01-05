import React, { useRef, useEffect } from 'react'
import PropTypes from 'prop-types'

/**
 * 🎯 Компонент поля ввода с поддержкой иконок и валидации
 * ИСПРАВЛЕНО: Добавлена поддержка forwardRef и удаление "0" при focus для number полей
 * @param {string} label - подпись поля
 * @param {string} type - тип поля (text, email, password, etc.)
 * @param {string} value - значение поля
 * @param {function} onChange - обработчик изменения значения
 * @param {string} error - текст ошибки
 * @param {boolean} required - обязательное ли поле
 * @param {string} placeholder - текст-подсказка
 * @param {React.Component} icon - иконка для поля
 */
interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string
  error?: string
  icon?: React.ElementType
  onChange: (value: string) => void
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, type = 'text', value, onChange, error, required, placeholder, icon: Icon, className = '' }, ref) => {
    const inputRef = useRef(null)

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

    // ИСПРАВЛЕНО: Удаление "0" при focus для number полей
    const handleFocus = e => {
      if (type === 'number') {
        // Проверяем как строку и как число
        const numValue = Number(value)
        if (numValue === 0 || value === '0' || value === 0) {
          e.target.value = ''
          onChange('')
          // Убеждаемся, что значение действительно очистилось
          setTimeout(() => {
            if (e.target.value === '0') {
              e.target.value = ''
            }
          }, 0)
        }
      }
    }

    return (
      <div className="mb-4">
        {label && (
          <label className="block text-sm font-medium mb-2">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <Icon className="w-5 h-5 text-gray-400" aria-hidden="true" />
            </div>
          )}
          <input
            ref={inputRef}
            type={type}
            value={value}
            onChange={e => onChange(e.target.value)}
            onFocus={handleFocus}
            placeholder={placeholder}
            lang={type === 'time' ? 'ru' : undefined}
            className={`
            w-full px-4 ${Icon ? 'pl-11' : ''} py-2
            ${error ? 'test-red-background' : 'bg-white/80 dark:bg-gray-800/80'}
            backdrop-blur-lg
            rounded-lg
            border-2 ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            transition-normal
            placeholder-gray-500 dark:placeholder-gray-400
            text-gray-900 dark:text-gray-100
            ${type === 'time' ? '[&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-inner-spin-button]:hidden [&::-webkit-outer-spin-button]:hidden [&::-webkit-datetime-edit-ampm-field]:hidden' : ''}
            ${className}
          `}
            style={
              type === 'time'
                ? {
                    // Принудительно используем 24-часовой формат, скрываем AM/PM элементы
                    fontVariantNumeric: 'tabular-nums',
                  }
                : undefined
            }
            aria-required={required}
            aria-invalid={!!error}
            aria-describedby={
              error
                ? `${label ? label.toLowerCase().replace(/\s+/g, '-') : 'input'}-error`
                : undefined
            }
            id={label ? `${label.toLowerCase().replace(/\s+/g, '-')}-input` : undefined}
          />
        </div>
        {error && (
          <p
            id={label ? `${label.toLowerCase().replace(/\s+/g, '-')}-error` : 'input-error'}
            className="text-red-500 text-sm mt-1"
            role="alert"
            aria-live="polite"
          >
            {error}
          </p>
        )}
      </div>
    )
  }
)

Input.propTypes = {
  label: PropTypes.string,
  type: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  error: PropTypes.string,
  required: PropTypes.bool,
  placeholder: PropTypes.string,
  icon: PropTypes.elementType,
}
