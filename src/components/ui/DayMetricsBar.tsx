import { memo } from 'react'
import { Clock, AlertTriangle, DollarSign, Zap } from '../../utils/icons'
import { formatHoursToTime } from '../../utils/formatting'

/**
 * 📊 DayMetricsBar — компактные метрики дня
 * 
 * Отображает ключевые показатели дня:
 * - Общее время работы
 * - Время перерывов
 * - Средняя ставка
 * - Максимальная сессия (опционально)
 * - Максимальный перерыв (опционально)
 */

// Кастомная иконка символа рубля
const RubleIcon = ({ className }: { className?: string }) => (
  <span className={`inline-flex items-center justify-center font-bold text-sm ${className}`}>₽</span>
)

export interface DayMetricsBarProps {
  /** Общее время работы в часах */
  totalHours: number
  /** Общее время перерывов (строка "H:MM") */
  totalBreaks: string
  /** Средняя ставка ₽/час */
  averageRate: number
  /** Максимальная сессия (опционально) */
  longestSession?: string
  /** Максимальный перерыв (опционально) */
  longestBreak?: string
  /** Layout: horizontal (в строку), vertical (в столбец), grid (сетка) */
  layout?: 'horizontal' | 'vertical' | 'grid'
  /** Компактный режим (меньше отступы) */
  compact?: boolean
  /** Дополнительные классы */
  className?: string
}

interface MetricItemProps {
  icon: React.ElementType
  label: string
  value: string | number
  iconColor: string
  textColor: string
  bgColor: string
  borderColor: string
  compact?: boolean
}

const MetricItem = memo(function MetricItem({
  icon: Icon,
  label,
  value,
  iconColor,
  textColor,
  bgColor,
  borderColor,
  compact = false,
}: MetricItemProps) {
  return (
    <div
      title={label}
      className={`
        flex items-center gap-1 rounded-md border
        ${bgColor} ${borderColor}
        ${compact ? 'px-1.5 py-0.5' : 'px-2 py-1'}
      `}
    >
      <Icon className={`w-3 h-3 flex-shrink-0 ${iconColor}`} />
      <span className={`text-xs font-medium whitespace-nowrap ${textColor}`}>
        {value}
      </span>
    </div>
  )
})

export const DayMetricsBar = memo(function DayMetricsBar({
  totalHours,
  totalBreaks,
  averageRate,
  longestSession,
  longestBreak,
  layout = 'horizontal',
  compact = false,
  className = '',
}: DayMetricsBarProps) {
  const metrics = [
    {
      key: 'hours',
      icon: Clock,
      label: 'Общее время работы',
      value: formatHoursToTime(totalHours),
      iconColor: 'text-blue-500 dark:text-blue-400',
      textColor: 'text-blue-700 dark:text-blue-300',
      bgColor: 'bg-blue-50 dark:bg-blue-900/30',
      borderColor: 'border-blue-200 dark:border-blue-700',
    },
    {
      key: 'breaks',
      icon: AlertTriangle,
      label: 'Всего перерывов',
      value: totalBreaks || '0:00',
      iconColor: 'text-orange-500 dark:text-orange-400',
      textColor: 'text-orange-700 dark:text-orange-300',
      bgColor: 'bg-orange-50 dark:bg-orange-900/30',
      borderColor: 'border-orange-200 dark:border-orange-700',
    },
    {
      key: 'rate',
      icon: RubleIcon,
      label: 'Средняя ставка',
      value: averageRate,
      iconColor: 'text-green-500 dark:text-green-400',
      textColor: 'text-green-700 dark:text-green-300',
      bgColor: 'bg-green-50 dark:bg-green-900/30',
      borderColor: 'border-green-200 dark:border-green-700',
    },
  ]

  // Добавляем максимальную сессию если передана
  if (longestSession) {
    metrics.push({
      key: 'session',
      icon: Zap,
      label: 'Максимальная сессия',
      value: longestSession,
      iconColor: 'text-purple-500 dark:text-purple-400',
      textColor: 'text-purple-700 dark:text-purple-300',
      bgColor: 'bg-purple-50 dark:bg-purple-900/30',
      borderColor: 'border-purple-200 dark:border-purple-700',
    })
  }

  // Добавляем максимальный перерыв если передан
  if (longestBreak) {
    metrics.push({
      key: 'long-break',
      icon: AlertTriangle,
      label: 'Максимальный перерыв',
      value: longestBreak,
      iconColor: 'text-red-500 dark:text-red-400',
      textColor: 'text-red-700 dark:text-red-300',
      bgColor: 'bg-red-50 dark:bg-red-900/30',
      borderColor: 'border-red-200 dark:border-red-700',
    })
  }

  const layoutClasses = {
    horizontal: 'flex flex-wrap items-center gap-1.5',
    vertical: 'flex flex-col gap-1',
    grid: 'grid grid-cols-2 gap-1.5',
  }

  return (
    <div className={`${layoutClasses[layout]} ${className}`}>
      {metrics.map((metric) => (
        <MetricItem
          key={metric.key}
          icon={metric.icon}
          label={metric.label}
          value={metric.value}
          iconColor={metric.iconColor}
          textColor={metric.textColor}
          bgColor={metric.bgColor}
          borderColor={metric.borderColor}
          compact={compact}
        />
      ))}
    </div>
  )
})
