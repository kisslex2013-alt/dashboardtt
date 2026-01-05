import { ReactNode } from 'react'
import { InfoTooltip } from '../ui/InfoTooltip'
import { EmptyState } from '../ui/EmptyState'
import { ChartIllustration } from '../ui/illustrations'
import { Skeleton } from '../ui/Skeleton'

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
          <div className="absolute inset-0 flex flex-col gap-4 p-4 bg-white/50 dark:bg-gray-900/50 z-10 rounded-lg backdrop-blur-sm">
            {/* Skeleton легенды */}
            <div className="flex gap-4 justify-center">
              <Skeleton variant="text" width={60} height={16} />
              <Skeleton variant="text" width={60} height={16} />
              <Skeleton variant="text" width={60} height={16} />
            </div>
            {/* Skeleton области графика */}
            <div className="flex-1 flex items-end gap-2 px-4">
              <Skeleton variant="rect" width="12%" height="60%" />
              <Skeleton variant="rect" width="12%" height="80%" />
              <Skeleton variant="rect" width="12%" height="45%" />
              <Skeleton variant="rect" width="12%" height="90%" />
              <Skeleton variant="rect" width="12%" height="70%" />
              <Skeleton variant="rect" width="12%" height="55%" />
              <Skeleton variant="rect" width="12%" height="85%" />
            </div>
            {/* Skeleton оси X */}
            <div className="flex gap-4 justify-around px-4">
              <Skeleton variant="text" width={30} height={12} />
              <Skeleton variant="text" width={30} height={12} />
              <Skeleton variant="text" width={30} height={12} />
              <Skeleton variant="text" width={30} height={12} />
              <Skeleton variant="text" width={30} height={12} />
            </div>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
