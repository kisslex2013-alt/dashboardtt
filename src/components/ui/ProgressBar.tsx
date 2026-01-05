import { memo } from 'react'

/**
 * 📊 ProgressBar — прогресс-бар с градиентом по статусу
 * 
 * Визуализирует прогресс выполнения цели с цветом по статусу:
 * - success (зелёный) — цель выполнена
 * - warning (жёлтый) — близко к цели  
 * - danger (красный) — ниже цели
 */

export type ProgressStatus = 'success' | 'warning' | 'danger' | null

export interface ProgressBarProps {
  /** Процент заполнения (0-100) */
  percent: number
  /** Статус для цветовой индикации */
  status?: ProgressStatus
  /** Показывать процент рядом */
  showLabel?: boolean
  /** Высота бара */
  height?: 'sm' | 'md' | 'lg'
  /** Дополнительные классы */
  className?: string
}

const statusGradients = {
  success: 'bg-gradient-to-r from-green-600 via-emerald-500 to-teal-500',
  warning: 'bg-gradient-to-r from-yellow-500 via-orange-500 to-amber-500',
  danger: 'bg-gradient-to-r from-red-600 via-rose-500 to-pink-500',
  null: 'bg-gradient-to-r from-gray-500 via-gray-600 to-gray-700',
}

const statusTextColors = {
  success: 'text-green-600 dark:text-green-400',
  warning: 'text-yellow-600 dark:text-yellow-400',
  danger: 'text-red-600 dark:text-red-400',
  null: 'text-gray-600 dark:text-gray-400',
}

const heightClasses = {
  sm: 'h-2',
  md: 'h-3',
  lg: 'h-4',
}

export const ProgressBar = memo(function ProgressBar({
  percent,
  status = null,
  showLabel = false,
  height = 'md',
  className = '',
}: ProgressBarProps) {
  // Ограничиваем процент для визуализации (0-100), но храним реальное значение для лейбла
  const clampedPercent = Math.min(Math.max(percent, 0), 100)
  const displayPercent = Math.round(percent) // Может быть > 100%

  const gradient = statusGradients[status ?? 'null']
  const textColor = statusTextColors[status ?? 'null']
  const barHeight = heightClasses[height]

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-gray-600 dark:text-gray-400">Прогресс дня</span>
          <span className={`font-bold ${textColor}`}>{displayPercent}%</span>
        </div>
      )}
      <div
        className={`
          w-full ${barHeight} rounded-full overflow-hidden
          bg-gray-200 dark:bg-gray-700
        `}
      >
        <div
          className={`
            h-full ${gradient}
            transition-all duration-300 ease-out
          `}
          style={{ width: `${clampedPercent}%` }}
        />
      </div>
    </div>
  )
})

// Утилита для расчёта процента прогресса
export function calculateProgress(earned: number, goal: number): number {
  if (!goal || goal <= 0) return 0
  return Math.round((earned / goal) * 100)
}

// Утилита для определения статуса по проценту
export function getStatusFromPercent(percent: number): ProgressStatus {
  if (percent >= 100) return 'success'
  if (percent >= 70) return 'warning'
  if (percent > 0) return 'danger'
  return null
}
