import { ReactNode } from 'react'
import { InfoTooltip } from '../ui/InfoTooltip'
import { EmptyState } from '../ui/EmptyState'
import { ChartIllustration } from '../ui/illustrations'
import { LoadingSpinner } from '../ui/LoadingSpinner'

interface ChartContainerProps {
  title: string
  subtitle?: string
  tooltip?: string
  rightControls?: ReactNode
  children: ReactNode
  className?: string
  loading?: boolean
  empty?: boolean
  emptyTitle?: string
  emptyDescription?: string
}

/**
 * 📊 Универсальный контейнер для графиков
 *
 * Стандартизирует внешний вид всех графиков в приложении:
 * - Стеклянная подложка (glass-effect)
 * - Заголовок и тултип
 * - Элементы управления справа (переключатели)
 * - Состояния загрузки и отсутствия данных
 */
export function ChartContainer({
  title,
  subtitle,
  tooltip,
  rightControls,
  children,
  className = '',
  loading = false,
  empty = false,
  emptyTitle = 'Нет данных',
  emptyDescription = 'Нет данных для отображения за выбранный период',
}: ChartContainerProps) {
  if (empty && !loading) {
    return (
      <div className={`glass-effect rounded-xl p-6 mb-6 ${className}`}>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <div className="flex flex-col">
              <h2 className="text-xl font-bold">{title}</h2>
              {subtitle && <span className="text-sm text-gray-500">{subtitle}</span>}
            </div>
            {tooltip && <InfoTooltip text={tooltip} />}
          </div>
          {rightControls}
        </div>
        <EmptyState
          illustration={ChartIllustration}
          title={emptyTitle}
          description={emptyDescription}
          variant="compact"
        />
      </div>
    )
  }

  return (
    <div className={`glass-effect rounded-xl p-6 mb-6 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold">{title}</h2>
            {subtitle && <span className="text-sm text-gray-500">{subtitle}</span>}
          </div>
          {tooltip && <InfoTooltip text={tooltip} />}
        </div>
        {rightControls}
      </div>

      <div className="relative min-h-[300px]">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-900/50 z-10 rounded-lg backdrop-blur-sm">
            <LoadingSpinner />
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
