/**
 * 💀 Skeleton Loading Component
 *
 * Универсальный компонент для отображения скелетонов загрузки.
 * Best practice: показывает структуру контента до загрузки данных.
 *
 * Варианты:
 * - text: строка текста
 * - circle: круглый аватар
 * - rect: прямоугольник
 * - card: карточка с несколькими элементами
 */

import { useMemo } from 'react'

interface SkeletonProps {
  /** Тип скелетона */
  variant?: 'text' | 'circle' | 'rect' | 'card' | 'list-item'
  /** Ширина (можно указать px, %, rem) */
  width?: string | number
  /** Высота (можно указать px, %, rem) */
  height?: string | number
  /** Количество строк для text варианта */
  lines?: number
  /** Количество элементов (для списка) */
  count?: number
  /** Дополнительные классы */
  className?: string
  /** Анимация пульсации */
  animate?: boolean
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  lines = 1,
  count = 1,
  className = '',
  animate = true,
}: SkeletonProps) {

  const baseClasses = useMemo(() => {
    return `bg-gray-200 dark:bg-gray-700 ${
      animate ? 'animate-pulse' : ''
    } rounded`
  }, [animate])

  const getSize = (size: string | number | undefined) => {
    if (size === undefined) return undefined
    if (typeof size === 'number') return `${size}px`
    return size
  }

  // Рендер одного скелетона
  const renderSkeleton = (index: number) => {
    switch (variant) {
      case 'circle':
        return (
          <div
            key={index}
            className={`${baseClasses} rounded-full ${className}`}
            style={{
              width: getSize(width) || '40px',
              height: getSize(height) || '40px',
            }}
          />
        )

      case 'rect':
        return (
          <div
            key={index}
            className={`${baseClasses} rounded-lg ${className}`}
            style={{
              width: getSize(width) || '100%',
              height: getSize(height) || '100px',
            }}
          />
        )

      case 'card':
        return (
          <div
            key={index}
            className={`${baseClasses} rounded-xl p-4 space-y-3 ${className}`}
            style={{
              width: getSize(width) || '100%',
              height: getSize(height) || 'auto',
            }}
          >
            {/* Заголовок карточки */}
            <div className={`${baseClasses} h-5 w-3/4`} />
            {/* Подзаголовок */}
            <div className={`${baseClasses} h-4 w-1/2`} />
            {/* Контент */}
            <div className="space-y-2 pt-2">
              <div className={`${baseClasses} h-3 w-full`} />
              <div className={`${baseClasses} h-3 w-5/6`} />
            </div>
          </div>
        )

      case 'list-item':
        return (
          <div
            key={index}
            className={`flex items-center gap-3 p-3 ${className}`}
          >
            {/* Аватар/иконка */}
            <div className={`${baseClasses} rounded-full w-10 h-10 flex-shrink-0`} />
            {/* Текст */}
            <div className="flex-1 space-y-2">
              <div className={`${baseClasses} h-4 w-3/4`} />
              <div className={`${baseClasses} h-3 w-1/2`} />
            </div>
          </div>
        )

      case 'text':
      default:
        return (
          <div key={index} className={`space-y-2 ${className}`}>
            {Array.from({ length: lines }).map((_, lineIndex) => (
              <div
                key={lineIndex}
                className={`${baseClasses} h-4 ${
                  lineIndex === lines - 1 ? 'w-3/4' : 'w-full'
                }`}
                style={{
                  width: lineIndex === lines - 1 ? undefined : getSize(width),
                  height: getSize(height),
                }}
              />
            ))}
          </div>
        )
    }
  }

  // Если count > 1, рендерим несколько скелетонов
  if (count > 1) {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, index) => renderSkeleton(index))}
      </div>
    )
  }

  return renderSkeleton(0)
}

/**
 * SkeletonList — готовый компонент для списков
 */
export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} variant="list-item" />
      ))}
    </div>
  )
}

/**
 * SkeletonTable — скелетон для таблицы
 */
export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3">
      {/* Заголовок таблицы */}
      <div className="flex gap-4 pb-2 border-b border-gray-200 dark:border-gray-700">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} variant="text" width="100%" height={16} />
        ))}
      </div>
      {/* Строки таблицы */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 py-2">
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Skeleton key={colIndex} variant="text" width="100%" height={14} />
          ))}
        </div>
      ))}
    </div>
  )
}
