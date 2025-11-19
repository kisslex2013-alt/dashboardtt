import { useState, useCallback } from 'react'
import { Eye, EyeOff } from '../../utils/icons'

/**
 * 🎯 Интерактивная легенда для графиков
 *
 * Позволяет кликать по элементам легенды для скрытия/показа серий данных
 *
 * Особенности:
 * - Toggle видимости серий
 * - Визуальная индикация скрытых серий
 * - Поддержка иконок видимости
 * - Адаптивная верстка
 *
 * Phase 2: UI/UX Improvements - Task 2.5.1
 */

interface LegendPayload {
  value: string
  color: string
  dataKey?: string
  payload?: {
    fill?: string
    stroke?: string
  }
}

interface InteractiveLegendProps {
  payload?: LegendPayload[]
  hiddenSeries: Set<string>
  onToggleSeries: (seriesName: string) => void
  className?: string
}

export function InteractiveLegend({
  payload = [],
  hiddenSeries,
  onToggleSeries,
  className = '',
}: InteractiveLegendProps) {
  if (!payload || payload.length === 0) {
    return null
  }

  return (
    <div className={`flex flex-wrap justify-center gap-4 mt-4 ${className}`}>
      {payload.map((entry, index) => {
        const isHidden = hiddenSeries.has(entry.value)
        const color = entry.color || entry.payload?.fill || entry.payload?.stroke || '#6366F1'

        return (
          <button
            key={`legend-${index}`}
            onClick={() => onToggleSeries(entry.value)}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-lg
              transition-all duration-200
              hover:bg-gray-100 dark:hover:bg-gray-700
              focus:outline-none focus:ring-2 focus:ring-blue-500
              ${isHidden ? 'opacity-40' : 'opacity-100'}
            `}
            aria-label={`${isHidden ? 'Показать' : 'Скрыть'} ${entry.value}`}
            aria-pressed={!isHidden}
          >
            {/* Цветовой индикатор */}
            <span
              className="w-3 h-3 rounded-full transition-all"
              style={{
                backgroundColor: isHidden ? 'transparent' : color,
                border: `2px solid ${color}`,
              }}
            />

            {/* Название серии */}
            <span
              className={`text-sm font-medium transition-all ${
                isHidden
                  ? 'text-gray-400 dark:text-gray-500 line-through'
                  : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              {entry.value}
            </span>

            {/* Иконка видимости */}
            {isHidden ? (
              <EyeOff className="w-3.5 h-3.5 text-gray-400" />
            ) : (
              <Eye className="w-3.5 h-3.5 text-gray-500" />
            )}
          </button>
        )
      })}
    </div>
  )
}

/**
 * 🎨 Компактная версия интерактивной легенды
 *
 * Для использования в маленьких графиках или мобильных устройствах
 */
export function CompactInteractiveLegend({
  payload = [],
  hiddenSeries,
  onToggleSeries,
  className = '',
}: InteractiveLegendProps) {
  if (!payload || payload.length === 0) {
    return null
  }

  return (
    <div className={`flex flex-wrap justify-center gap-2 mt-3 ${className}`}>
      {payload.map((entry, index) => {
        const isHidden = hiddenSeries.has(entry.value)
        const color = entry.color || entry.payload?.fill || entry.payload?.stroke || '#6366F1'

        return (
          <button
            key={`legend-compact-${index}`}
            onClick={() => onToggleSeries(entry.value)}
            className={`
              flex items-center gap-1.5 px-2 py-1 rounded-md text-xs
              transition-all duration-200
              hover:bg-gray-100 dark:hover:bg-gray-700
              focus:outline-none focus:ring-1 focus:ring-blue-500
              ${isHidden ? 'opacity-40' : 'opacity-100'}
            `}
            aria-label={`${isHidden ? 'Показать' : 'Скрыть'} ${entry.value}`}
            aria-pressed={!isHidden}
          >
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{
                backgroundColor: isHidden ? 'transparent' : color,
                border: `1.5px solid ${color}`,
              }}
            />
            <span
              className={`font-medium ${
                isHidden
                  ? 'text-gray-400 dark:text-gray-500 line-through'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              {entry.value}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/**
 * 🎣 Hook для управления видимостью серий
 *
 * @param initialHidden - Начальный набор скрытых серий
 * @returns {hiddenSeries, toggleSeries, showAll, hideAll}
 */
export function useSeriesVisibility(initialHidden: string[] = []) {
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set(initialHidden))

  const toggleSeries = useCallback((seriesName: string) => {
    setHiddenSeries(prev => {
      const next = new Set(prev)
      if (next.has(seriesName)) {
        next.delete(seriesName)
      } else {
        next.add(seriesName)
      }
      return next
    })
  }, [])

  const showAll = useCallback(() => {
    setHiddenSeries(new Set())
  }, [])

  const hideAll = useCallback((allSeries: string[]) => {
    setHiddenSeries(new Set(allSeries))
  }, [])

  return {
    hiddenSeries,
    toggleSeries,
    showAll,
    hideAll,
  }
}
