import { memo } from 'react'
import { TrendingUp, TrendingDown, Minus } from '../../utils/icons'

/**
 * 📊 Компонент сравнения статистики с предыдущим периодом
 *
 * Показывает процентное изменение между текущим и предыдущим значением:
 * - Зеленый цвет и иконка TrendingUp для увеличения
 * - Красный цвет и иконка TrendingDown для уменьшения
 * - Серый цвет и иконка Minus для неизменного значения
 *
 * Оптимизирован с React.memo для предотвращения лишних ре-рендеров
 *
 * @param {number} current - Текущее значение
 * @param {number} previous - Предыдущее значение для сравнения
 */
interface ComparisonStatProps {
  current: number
  previous?: number | null
}

export const ComparisonStat = memo<ComparisonStatProps>(({ current, previous }) => {
  if (previous === null || previous === undefined) return null

  const diff = current - previous
  const percentDiff = previous !== 0 ? ((diff / previous) * 100).toFixed(1) : 0
  const isPositive = diff > 0
  const isNeutral = diff === 0

  return (
    <div
      className={`
        flex items-center justify-end gap-1 text-xs font-bold whitespace-nowrap
        px-2 py-1 rounded-md
        backdrop-blur-sm
        ${
          isNeutral
            ? 'text-gray-700 dark:text-gray-300 bg-gray-500/20 dark:bg-gray-500/30'
            : isPositive
              ? 'text-green-700 dark:text-green-200 bg-green-500/20 dark:bg-green-500/30'
              : 'text-red-700 dark:text-red-200 bg-red-500/20 dark:bg-red-500/30'
        }
      `}
      style={{
        textShadow: '0 1px 3px rgba(0,0,0,0.5), 0 0 8px rgba(0,0,0,0.3)',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1), inset 0 1px 1px rgba(255,255,255,0.1)',
      }}
    >
      {isNeutral ? (
        <Minus className="w-3.5 h-3.5 flex-shrink-0" />
      ) : isPositive ? (
        <TrendingUp className="w-3.5 h-3.5 flex-shrink-0" />
      ) : (
        <TrendingDown className="w-3.5 h-3.5 flex-shrink-0" />
      )}
      <span>
        {isPositive && '+'}
        {percentDiff}%
      </span>
    </div>
  )
})
