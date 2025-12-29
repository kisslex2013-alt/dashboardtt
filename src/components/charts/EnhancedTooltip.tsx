import { useMemo } from 'react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { useTheme } from '../../store/useSettingsStore'
import { TrendingUp, TrendingDown, Target, Clock, DollarSign } from '../../utils/icons'

/**
 * 🎨 Улучшенный Tooltip для графиков
 *
 * Показывает:
 * - Основные данные с цветовым кодированием
 * - Сравнение с предыдущим значением (если доступно)
 * - Достижение цели (если доступно)
 * - Дополнительный контекст
 *
 * Phase 1: Quick Wins
 */
export function EnhancedTooltip({
  active,
  payload,
  label,
  formatters = {},
  showComparison = false,
  showGoal = false,
  goalValue = null,
  previousValue = null,
  additionalInfo = null,
}) {
  const theme = useTheme()

  const tooltipData = useMemo(() => {
    if (!active || !payload || payload.length === 0) return null

    const data = payload[0]?.payload || {}
    const formattedLabel = formatters.label
      ? formatters.label(label, data)
      : label

    // Форматируем значения из payload
    const formattedValues = payload.map(item => {
      const dataKey = item.dataKey || item.name
      const formatter = formatters[dataKey] || formatters[item.name]

      return {
        name: item.name || dataKey || 'Значение',
        value: item.value,
        color: item.color || item.fill || item.stroke || '#6366F1',
        formatted: formatter
          ? formatter(item.value, data)
          : typeof item.value === 'number'
            ? item.value.toLocaleString('ru-RU')
            : item.value,
        unit: item.unit || unit || '',
      }
    })

    // Вычисляем изменение по сравнению с предыдущим значением
    let comparison = null
    if (showComparison && previousValue !== null && formattedValues[0]?.value) {
      const currentValue = formattedValues[0].value
      const diff = currentValue - previousValue
      const percentChange = previousValue !== 0
        ? ((diff / previousValue) * 100).toFixed(1)
        : null

      comparison = {
        value: diff,
        percent: percentChange,
        isPositive: diff >= 0,
      }
    }

    // Проверяем достижение цели
    let goalStatus = null
    if (showGoal && goalValue !== null && formattedValues[0]?.value) {
      const currentValue = formattedValues[0].value
      const isAchieved = currentValue >= goalValue
      const remaining = Math.max(0, goalValue - currentValue)
      const progress = goalValue > 0
        ? ((currentValue / goalValue) * 100).toFixed(1)
        : 0

      goalStatus = {
        isAchieved,
        remaining,
        progress: parseFloat(progress),
      }
    }

    return {
      label: formattedLabel,
      values: formattedValues,
      comparison,
      goalStatus,
      additionalInfo,
    }
  }, [active, payload, label, formatters, showComparison, showGoal, goalValue, previousValue, additionalInfo])

  if (!tooltipData) return null

  return (
    <div className="glass-effect rounded-xl p-4 shadow-2xl border border-gray-200 dark:border-gray-700 backdrop-blur-lg bg-white/95 dark:bg-gray-800/95 min-w-[200px]">
      {/* Заголовок (дата/время) */}
      <div className="mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
        <p className="font-semibold text-sm text-gray-900 dark:text-white">
          {tooltipData.label}
        </p>
      </div>

      {/* Основные значения */}
      <div className="space-y-2 mb-3">
        {tooltipData.values.map((item, index) => (
          <div key={`tooltip-value-${item.name || item.dataKey || index}-${index}`} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {item.name}:
              </span>
            </div>
            <span
              className="text-sm font-semibold"
              style={{ color: item.color }}
            >
              {item.formatted} {item.unit}
            </span>
          </div>
        ))}
      </div>

      {/* Сравнение с предыдущим значением */}
      {tooltipData.comparison && (
        <div className={`mb-3 p-2 rounded-lg ${
          tooltipData.comparison.isPositive
            ? 'bg-green-50 dark:bg-green-900/20'
            : 'bg-red-50 dark:bg-red-900/20'
        }`}>
          <div className="flex items-center gap-2">
            {tooltipData.comparison.isPositive ? (
              <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
            )}
            <span className={`text-xs font-medium ${
              tooltipData.comparison.isPositive
                ? 'text-green-700 dark:text-green-300'
                : 'text-red-700 dark:text-red-300'
            }`}>
              {tooltipData.comparison.isPositive ? '+' : ''}
              {tooltipData.comparison.value.toFixed(2)}
              {tooltipData.comparison.percent && ` (${tooltipData.comparison.percent}%)`}
            </span>
          </div>
        </div>
      )}

      {/* Статус достижения цели */}
      {tooltipData.goalStatus && (
        <div className={`mb-3 p-2 rounded-lg ${
          tooltipData.goalStatus.isAchieved
            ? 'bg-blue-50 dark:bg-blue-900/20'
            : 'bg-yellow-50 dark:bg-yellow-900/20'
        }`}>
          <div className="flex items-center gap-2 mb-1">
            <Target className={`w-4 h-4 ${
              tooltipData.goalStatus.isAchieved
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-yellow-600 dark:text-yellow-400'
            }`} />
            <span className={`text-xs font-medium ${
              tooltipData.goalStatus.isAchieved
                ? 'text-blue-700 dark:text-blue-300'
                : 'text-yellow-700 dark:text-yellow-300'
            }`}>
              {tooltipData.goalStatus.isAchieved ? '🎉 Цель достигнута!' : `Осталось: ${tooltipData.goalStatus.remaining.toFixed(2)}`}
            </span>
          </div>
          {!tooltipData.goalStatus.isAchieved && (
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
              <div
                className="bg-yellow-500 h-1.5 rounded-full transition-all"
                style={{ width: `${Math.min(tooltipData.goalStatus.progress, 100)}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Дополнительная информация */}
      {tooltipData.additionalInfo && (
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {tooltipData.additionalInfo}
          </p>
        </div>
      )}
    </div>
  )
}

