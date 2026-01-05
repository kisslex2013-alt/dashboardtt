import { memo } from 'react'
import { CheckCircle2, AlertCircle, XCircle, Clock } from '../../utils/icons'

/**
 * 🎯 DayStatusBadge — индикатор статуса дня
 * 
 * Показывает статус выполнения дневной цели:
 * - success (зелёный) — цель выполнена
 * - warning (жёлтый) — близко к цели
 * - danger (красный) — ниже цели
 */

export type DayStatusType = 'success' | 'warning' | 'danger' | null

export interface DayStatusBadgeProps {
  /** Статус дня */
  status: DayStatusType
  /** Показывать иконку */
  showIcon?: boolean
  /** Показывать текстовую метку */
  showLabel?: boolean
  /** Размер */
  size?: 'sm' | 'md' | 'lg'
  /** Дополнительные классы */
  className?: string
}

const statusConfig = {
  success: {
    icon: CheckCircle2,
    label: 'Цель выполнена',
    bgClass: 'bg-green-100 dark:bg-green-900/40',
    textClass: 'text-green-700 dark:text-green-400',
    iconClass: 'text-green-500',
    borderClass: 'border-green-200 dark:border-green-700',
    dotClass: 'bg-green-500',
  },
  warning: {
    icon: AlertCircle,
    label: 'Близко к цели',
    bgClass: 'bg-yellow-100 dark:bg-yellow-900/40',
    textClass: 'text-yellow-700 dark:text-yellow-400',
    iconClass: 'text-yellow-500',
    borderClass: 'border-yellow-200 dark:border-yellow-700',
    dotClass: 'bg-yellow-500',
  },
  danger: {
    icon: XCircle,
    label: 'Ниже цели',
    bgClass: 'bg-red-100 dark:bg-red-900/40',
    textClass: 'text-red-700 dark:text-red-400',
    iconClass: 'text-red-500',
    borderClass: 'border-red-200 dark:border-red-700',
    dotClass: 'bg-red-500',
  },
  null: {
    icon: Clock,
    label: 'Нет цели',
    bgClass: 'bg-gray-100 dark:bg-gray-700/50',
    textClass: 'text-gray-600 dark:text-gray-400',
    iconClass: 'text-gray-500',
    borderClass: 'border-gray-200 dark:border-gray-600',
    dotClass: 'bg-gray-400',
  },
}

const sizeConfig = {
  sm: {
    icon: 'w-3 h-3',
    text: 'text-xs',
    padding: 'px-1.5 py-0.5',
    dot: 'w-1.5 h-1.5',
  },
  md: {
    icon: 'w-3.5 h-3.5',
    text: 'text-xs',
    padding: 'px-2 py-1',
    dot: 'w-2 h-2',
  },
  lg: {
    icon: 'w-4 h-4',
    text: 'text-sm',
    padding: 'px-2.5 py-1.5',
    dot: 'w-2.5 h-2.5',
  },
}

export const DayStatusBadge = memo(function DayStatusBadge({
  status,
  showIcon = true,
  showLabel = true,
  size = 'sm',
  className = '',
}: DayStatusBadgeProps) {
  const config = statusConfig[status ?? 'null']
  const sizeClasses = sizeConfig[size]
  const IconComponent = config.icon

  // Только точка (минимальный вариант)
  if (!showIcon && !showLabel) {
    return (
      <span
        className={`${sizeClasses.dot} rounded-full ${config.dotClass} ${className}`}
        title={config.label}
      />
    )
  }

  // Только иконка
  if (showIcon && !showLabel) {
    return (
      <span title={config.label} className={className}>
        <IconComponent className={`${sizeClasses.icon} ${config.iconClass}`} />
      </span>
    )
  }

  // Полный бейдж с иконкой и текстом
  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-full font-medium
        ${sizeClasses.padding} ${sizeClasses.text}
        ${config.bgClass} ${config.textClass} ${config.borderClass} border
        ${className}
      `}
    >
      {showIcon && <IconComponent className={`${sizeClasses.icon} flex-shrink-0`} />}
      {showLabel && <span>{config.label}</span>}
    </span>
  )
})

// Экспортируем конфигурацию для использования в других компонентах
export { statusConfig, sizeConfig }
