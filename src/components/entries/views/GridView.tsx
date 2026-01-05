import { useMemo, memo, useCallback, useState } from 'react'
import { useDailyGoal } from '../../../store/useSettingsStore'
import { getDayMetrics } from '../../../utils/dayMetrics'
import { useIsMobile } from '../../../hooks/useIsMobile'
import { DayStatusBadge, DayMetricsBar, ProgressBar } from '../../ui'
import { EntryRow } from '../EntryRow'
import { TimeEntry } from '../../../types'

interface GridViewProps {
  entries: TimeEntry[]
  onEdit?: (entry: TimeEntry) => void
  selectionMode?: boolean
  selectedEntries?: Set<string>
  onToggleSelection?: (id: string) => void
}

/**
 * 📋 Вид сеткой - Dashboard Style
 * - Градиентные заголовки по статусу дня (через классы)
 * - Крупные метрики (через DayMetricsBar)
 * - Прогресс-бар (через ProgressBar)
 * - Компактные карточки записей (через EntryRow variant="card")
 *
 * ✅ ОПТИМИЗАЦИЯ: Обернут в React.memo для предотвращения лишних ре-рендеров
 */
const GridDayCard = memo(
  ({
    date,
    entries,
    dailyGoal,
    isMobile,
    onEdit,
  }: {
    date: string
    entries: TimeEntry[]
    dailyGoal: number
    isMobile: boolean
    onEdit?: (entry: TimeEntry) => void
  }) => {
    // Внутреннее состояние для сворачивания/разворачивания
    const [isExpanded, setIsExpanded] = useState(false)
    const metrics = useMemo(() => getDayMetrics(entries, dailyGoal), [entries, dailyGoal])

    const dateObj = new Date(date)
    const day = dateObj.getDate()
    const month = dateObj.toLocaleDateString('ru-RU', { month: 'long' })
    const formattedDate = `${day} ${month.charAt(0).toUpperCase() + month.slice(1)}`
    const weekday = dateObj.toLocaleDateString('ru-RU', { weekday: 'long' })
    const weekdayFormatted = weekday.charAt(0).toUpperCase() + weekday.slice(1)

    const progressPercent =
      dailyGoal > 0 ? Math.min(Math.round((metrics.totalEarned / dailyGoal) * 100), 100) : 0

    // Логика отображения записей
    const displayedEntries = isExpanded ? entries : entries.slice(0, 5)
    const hasMoreEntries = entries.length > 5
    const hiddenEntriesCount = entries.length - 5

    return (
      <div className="glass-effect entry-card rounded-2xl overflow-hidden hover:shadow-2xl hover:border-blue-300 dark:hover:border-blue-600 transition-normal shadow-xl snap-start hover-lift-scale flex flex-col h-full">
        {/* Заголовок */}
        <div
          className={`p-3 text-white ${
            metrics.status?.status === 'success'
              ? 'bg-gradient-to-r from-green-600 to-green-700'
              : metrics.status?.status === 'warning'
                ? 'bg-gradient-to-r from-yellow-600 to-yellow-700'
                : metrics.status?.status === 'danger'
                  ? 'bg-gradient-to-r from-red-600 to-red-700'
                  : 'bg-gradient-to-r from-gray-600 to-gray-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold">{formattedDate}</h3>
              <span className="text-sm opacity-90">{weekdayFormatted}</span>
            </div>
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <DayStatusBadge
                status={metrics.status?.status}
                size="md"
                showLabel={false}
                showIcon={true}
              />
            </div>
          </div>
        </div>

        {/* Статистика */}
        <div className="p-4 flex flex-col flex-1">
          {/* Статистические бейджи */}
          <div className="mb-4">
            <DayMetricsBar
              totalHours={metrics.totalHours}
              totalBreaks={metrics.totalBreaks}
              averageRate={metrics.averageRate || 0}
              layout="horizontal"
              compact={isMobile}
            />
          </div>

          {/* Прогресс-бар */}
          {dailyGoal > 0 && (
            <div className="mb-4">
              <ProgressBar
                percent={progressPercent}
                status={metrics.status?.status}
                showLabel={true}
                height="md"
                className="rounded-full"
              />
            </div>
          )}

          {/* Записи */}
          <div className="space-y-2">
            {displayedEntries.map(entry => (
              <EntryRow key={entry.id} entry={entry} variant="card" onEdit={onEdit} />
            ))}
            
            {/* Кнопка Показать еще */}
            {hasMoreEntries && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full py-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                {isExpanded ? (
                  'Свернуть'
                ) : (
                  <>
                    Показать еще {hiddenEntriesCount} записи
                  </>
                )}
              </button>
            )}
          </div>

          {/* Итого */}
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700/50 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Итого за день
            </span>
            <span className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">
              {Math.round(metrics.totalEarned).toLocaleString('ru-RU')} ₽
            </span>
          </div>
        </div>
      </div>
    )
  }
)

export const GridView = memo(
  ({
    entries,
    onEdit,
    selectionMode = false,
    selectedEntries = new Set(),
    onToggleSelection,
  }: GridViewProps) => {
    const dailyGoal = useDailyGoal()
    const isMobile = useIsMobile()

    // ✅ ОПТИМИЗАЦИЯ: Инкрементальная загрузка - показываем по 30 дней
    const [visibleCount, setVisibleCount] = useState(30)

    // Группировка записей по датам (мемоизировано для оптимизации)
    const groupedEntries = useMemo(
      () =>
        entries.reduce((acc, entry) => {
          if (!acc[entry.date]) {
            acc[entry.date] = []
          }
          acc[entry.date].push(entry)
          return acc
        }, {} as Record<string, TimeEntry[]>),
      [entries]
    )

    // ✅ ОПТИМИЗАЦИЯ: Мемоизация сортированных дат
    const sortedDates = useMemo(() => {
      return Object.keys(groupedEntries).sort(
        (a, b) => new Date(b).getTime() - new Date(a).getTime()
      )
    }, [groupedEntries])

    // ✅ ОПТИМИЗАЦИЯ: Ограничиваем отображаемые даты
    const visibleDates = useMemo(() => {
      return sortedDates.slice(0, visibleCount)
    }, [sortedDates, visibleCount])

    // ✅ ОПТИМИЗАЦИЯ: Кнопка "Показать еще" с плавной загрузкой
    const handleLoadMore = useCallback(() => {
      requestAnimationFrame(() => {
        setVisibleCount(prev => Math.min(prev + 30, sortedDates.length))
      })
    }, [sortedDates.length])

    const hasMore = visibleCount < sortedDates.length
    const remainingCount = sortedDates.length - visibleCount

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleDates.map(date => (
            <GridDayCard
              key={date}
              date={date}
              entries={groupedEntries[date]}
              dailyGoal={dailyGoal}
              isMobile={isMobile}
              onEdit={onEdit}
            />
          ))}
        </div>

        {/* ✅ ОПТИМИЗАЦИЯ: Кнопка "Показать еще" */}
        {hasMore && (
          <div className="flex justify-center py-4">
            <button
              onClick={handleLoadMore}
              className="glass-button px-6 py-3 rounded-lg font-semibold text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300 hover:scale-105 active:scale-95"
            >
              Показать еще {Math.min(30, remainingCount)} дней (осталось {remainingCount})
            </button>
          </div>
        )}
      </div>
    )
  }
)
