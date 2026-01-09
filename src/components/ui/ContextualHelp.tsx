/**
 * 🎓 ContextualHelp Component
 *
 * Компонент для показа контекстных подсказок новичкам.
 * Показывает иконку "?" с tooltip при hover.
 *
 * Использование:
 * <ContextualHelp text="Это подсказка о том, что делает эта кнопка" />
 * <ContextualHelp text="Описание" learnMoreUrl="/docs/feature" />
 */

import React, { useState, useRef, useEffect } from 'react'
import { Icon } from '@iconify/react'

interface ContextualHelpProps {
  /** Текст подсказки */
  text: string
  /** URL для "Подробнее" (опционально) */
  learnMoreUrl?: string
  /** Текст ссылки "Подробнее" */
  learnMoreText?: string
  /** Позиция tooltip */
  position?: 'top' | 'bottom' | 'left' | 'right'
  /** Размер иконки */
  size?: 'sm' | 'md' | 'lg'
  /** Цвет иконки */
  color?: 'muted' | 'primary' | 'warning'
  /** Дополнительные классы */
  className?: string
}

const sizeClasses = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
}

const colorClasses = {
  muted: 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300',
  primary: 'text-blue-400 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300',
  warning: 'text-amber-400 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300',
}

const positionClasses = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
}

const arrowClasses = {
  top: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-slate-800 dark:border-t-slate-700',
  bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-slate-800 dark:border-b-slate-700',
  left: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-slate-800 dark:border-l-slate-700',
  right: 'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-slate-800 dark:border-r-slate-700',
}

export function ContextualHelp({
  text,
  learnMoreUrl,
  learnMoreText = 'Подробнее',
  position = 'top',
  size = 'sm',
  color = 'muted',
  className = '',
}: ContextualHelpProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [adjustedPosition, setAdjustedPosition] = useState(position)
  const containerRef = useRef<HTMLSpanElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  // Автоматическая корректировка позиции если tooltip выходит за границы экрана
  useEffect(() => {
    if (isVisible && tooltipRef.current && containerRef.current) {
      const tooltipRect = tooltipRef.current.getBoundingClientRect()
      const containerRect = containerRef.current.getBoundingClientRect()

      let newPosition = position

      // Проверяем выход за границы
      if (position === 'top' && tooltipRect.top < 0) {
        newPosition = 'bottom'
      } else if (position === 'bottom' && tooltipRect.bottom > window.innerHeight) {
        newPosition = 'top'
      } else if (position === 'left' && tooltipRect.left < 0) {
        newPosition = 'right'
      } else if (position === 'right' && tooltipRect.right > window.innerWidth) {
        newPosition = 'left'
      }

      if (newPosition !== adjustedPosition) {
        setAdjustedPosition(newPosition)
      }
    }
  }, [isVisible, position, adjustedPosition])

  return (
    <span
      ref={containerRef}
      className={`relative inline-flex items-center cursor-help ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
      tabIndex={0}
      role="button"
      aria-label="Справка"
      aria-describedby={isVisible ? 'contextual-help-tooltip' : undefined}
    >
      {/* Иконка вопроса */}
      <Icon
        icon="solar:question-circle-linear"
        className={`${sizeClasses[size]} ${colorClasses[color]} transition-colors`}
      />

      {/* Tooltip */}
      {isVisible && (
        <div
          ref={tooltipRef}
          id="contextual-help-tooltip"
          role="tooltip"
          className={`
            absolute z-50 
            ${positionClasses[adjustedPosition]}
            px-3 py-2 
            max-w-xs min-w-[180px]
            bg-slate-800 dark:bg-slate-700 
            text-white text-sm 
            rounded-lg shadow-lg
            animate-in fade-in zoom-in-95 duration-150
          `}
        >
          {/* Стрелка tooltip */}
          <span
            className={`
              absolute w-0 h-0 
              border-4 
              ${arrowClasses[adjustedPosition]}
            `}
          />

          {/* Текст подсказки */}
          <p className="leading-relaxed">{text}</p>

          {/* Ссылка "Подробнее" */}
          {learnMoreUrl && (
            <a
              href={learnMoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="
                inline-flex items-center gap-1 mt-2
                text-blue-300 hover:text-blue-200
                text-xs font-medium
                transition-colors
              "
              onClick={(e) => e.stopPropagation()}
            >
              {learnMoreText}
              <Icon icon="solar:arrow-right-up-linear" className="w-3 h-3" />
            </a>
          )}
        </div>
      )}
    </span>
  )
}

/**
 * Обёртка для элемента с контекстной подсказкой
 * Показывает подсказку рядом с дочерним элементом
 */
interface ContextualHelpWrapperProps extends ContextualHelpProps {
  children: React.ReactNode
  /** Позиция иконки относительно children */
  iconPosition?: 'before' | 'after'
  /** Gap между children и иконкой */
  gap?: 'none' | 'sm' | 'md'
}

const gapClasses = {
  none: 'gap-0',
  sm: 'gap-1',
  md: 'gap-2',
}

export function ContextualHelpWrapper({
  children,
  iconPosition = 'after',
  gap = 'sm',
  ...helpProps
}: ContextualHelpWrapperProps) {
  return (
    <span className={`inline-flex items-center ${gapClasses[gap]}`}>
      {iconPosition === 'before' && <ContextualHelp {...helpProps} />}
      {children}
      {iconPosition === 'after' && <ContextualHelp {...helpProps} />}
    </span>
  )
}

export default ContextualHelp
