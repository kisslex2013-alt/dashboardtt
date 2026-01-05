import { memo, useMemo, useCallback, useState, useEffect } from 'react'
import { ChevronDown, CheckCircle2, AlertCircle, XCircle } from '../../../utils/icons'
import { useCategories, useDailyGoal } from '../../../store/useSettingsStore'
import { getDayMetrics } from '../../../utils/dayMetrics'
import { formatHoursToTime } from '../../../utils/formatting'
import { useColumnResize } from '../../../hooks/useColumnResize'
import { useIsMobile } from '../../../hooks/useIsMobile'
import { calculateBreak } from '../../../utils/timeUtils'
import { GridColumnDivider, TableColumnDivider, ResizeModeIndicator } from '../../ui/ColumnResizers'
import { CategoryBadge, DayStatusBadge, DayMetricsBar, ProgressBar } from '../../ui'
import { EntryRow, parseDuration, formatTimeRange } from '../EntryRow'
import { TimeEntry } from '../../../types'

/**
 * 📋 ОПТИМИЗИРОВАННЫЙ Вид списком с точным визуалом фото 1
 */

// ОПТИМИЗАЦИЯ: Мемоизированный компонент дня
interface DayAccordionProps {
  date: string
  dateEntries: TimeEntry[]
  metrics: any
  dailyGoal: number
  isMobile: boolean
  onEdit: (entry: TimeEntry) => void
  selectionMode: boolean
  selectedEntries: Set<string>
  onToggleSelection: (entryId: string) => void
  /** Первый (самый новый) день — будет открыт по умолчанию */
  isFirstDay: boolean
  // Пропсы для изменения ширины столбцов
  resizeMode: boolean
  gridWidths: any
  tableWidths: any
  dragging: any
  onDragStart: any
  onDrag: any
  onDragEnd: any
}

const DayAccordion = memo<DayAccordionProps>(
  ({
    date,
    dateEntries,
    metrics,
    dailyGoal,
    isMobile,
    onEdit,
    selectionMode,
    selectedEntries,
    onToggleSelection,
    isFirstDay,
    // Пропсы для изменения ширины столбцов
    resizeMode,
    gridWidths,
    tableWidths,
    dragging,
    onDragStart,
    onDrag,
    onDragEnd,
  }) => {
    const dateObj = new Date(date)
    const day = dateObj.getDate()
    const month = dateObj.toLocaleDateString('ru-RU', { month: 'long' })
    const year = dateObj.getFullYear()
    const weekday = dateObj.toLocaleDateString('ru-RU', { weekday: 'short' }).toUpperCase()
    const formattedDate = `${day} ${month} ${year} ${weekday}`

    const progressPercent =
      dailyGoal > 0 ? Math.min(Math.round((metrics.totalEarned / dailyGoal) * 100), 100) : 0

    // Сортировка записей для отображения (от новых к старым)
    const sortedEntries = useMemo(() => {
      return [...dateEntries].sort((a, b) => {
        if (!a.start || !b.start) return 0
        return b.start.localeCompare(a.start)
      })
    }, [dateEntries])

    // Сортировка записей для расчета перерывов (от старых к новым)
    const sortedEntriesForBreaks = useMemo(() => {
      return [...dateEntries].sort((a, b) => {
        if (!a.start || !b.start) return 0
        return a.start.localeCompare(b.start)
      })
    }, [dateEntries])

    const [isOpen, setIsOpen] = useState(isFirstDay)

    const handleToggle = useCallback((e: React.SyntheticEvent<HTMLDetailsElement>) => {
      setIsOpen(e.currentTarget.open)
    }, [])

    return (
      <details
        className="glass-effect entry-card rounded-lg overflow-hidden snap-start mb-2"
        style={{
          contain: 'layout style paint',
          contentVisibility: 'auto',
        }}
        open={isOpen}
        onToggle={handleToggle}
      >
        <summary className="relative overflow-hidden list-none cursor-pointer group">
          {/* Фоновый прогресс-бар - видимость 30% */}
          <div className="absolute inset-0 opacity-30 pointer-events-none">
            <ProgressBar
              percent={progressPercent}
              status={metrics.status?.status}
              showLabel={false}
              className="h-full rounded-none"
            />
          </div>

          {/* Содержимое summary */}
          <div
            className="relative px-3 py-2 grid grid-cols-[1fr_minmax(0,1fr)_minmax(100px,min-content)] md:grid-cols-[1fr_minmax(280px,1fr)_minmax(120px,min-content)] items-center hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
            style={{ columnGap: '8px' }}
          >
            {/* Левая часть: Дата */}
            <div className="flex items-center gap-2 min-w-0 overflow-hidden">
              <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 details-chevron flex-shrink-0 group-open:rotate-180" />
              <div className="flex flex-col min-w-0">
                <span
                  className="font-semibold text-gray-800 dark:text-white whitespace-nowrap truncate text-sm"
                  title={formattedDate}
                >
                  {day} {month} <span className="text-gray-400 font-normal">{weekday}</span>
                </span>
                {/* Мобильные метрики */}
                {isMobile && (
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-500 mt-0.5">
                    <span>{formatHoursToTime(metrics.totalHours)}</span>
                    <span>•</span>
                    <span>{metrics.totalEarned}₽</span>
                  </div>
                )}
              </div>
            </div>

            {/* Центр: Компактные инсайты (Desktop) */}
            {!isMobile && (
              <div
                className="hidden md:flex items-center justify-center relative"
                style={{
                  minWidth: '280px',
                  marginLeft: `${gridWidths?.columnGap || 16}px`,
                  marginRight: `${gridWidths?.columnGap || 16}px`,
                }}
              >
                <div className="flex gap-2">
                  <DayMetricsBar
                    totalHours={metrics.totalHours}
                    totalBreaks={metrics.totalBreaks}
                    averageRate={metrics.averageRate || 0}
                    compact
                  />
                </div>
                
                {/* Разделитель столбцов */}
                {resizeMode && (
                  <GridColumnDivider
                    column="insightsMargin"
                    onDragStart={onDragStart}
                    isDragging={dragging?.mode === 'grid' && dragging?.column === 'insightsMargin'}
                    position="right"
                  />
                )}
              </div>
            )}

            {/* Правая часть: Статус и Прогресс */}
            <div
              className="flex items-center justify-end gap-2 relative min-w-0 flex-shrink-0"
              style={{ marginLeft: !isMobile ? `${gridWidths?.columnGap || 16}px` : 0 }}
            >
              {!isMobile && (
                <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap flex-shrink-0">
                  {metrics.totalHours.toFixed(2)}ч
                </span>
              )}
              
              <div className="flex items-center gap-2">
                 {!isMobile && (
                   <span className="text-sm font-bold text-gray-800 dark:text-white whitespace-nowrap">
                     {metrics.totalEarned}₽
                   </span>
                 )}
                 
                 <DayStatusBadge
                   status={metrics.status?.status}
                   size="sm"
                   showLabel={false}
                   showIcon={true}
                 />
              </div>

              {/* Разделитель столбцов */}
              {!isMobile && resizeMode && (
                <GridColumnDivider
                  column="totalMargin"
                  onDragStart={onDragStart}
                  isDragging={dragging?.mode === 'grid' && dragging?.column === 'totalMargin'}
                  position="right"
                />
              )}
            </div>
          </div>
        </summary>

        {/* Содержимое аккордеона */}
        <div className="border-t border-gray-200 dark:border-gray-700 overflow-x-auto">
          {isMobile ? (
            <div className="p-2 space-y-2">
              {sortedEntries.map(entry => {
                 let nextEntryByTime: TimeEntry | null = null
                 if (entry.end) {
                   const currentIndex = sortedEntriesForBreaks.findIndex(e => e.id === entry.id)
                   if (currentIndex >= 0 && currentIndex < sortedEntriesForBreaks.length - 1) {
                     nextEntryByTime = sortedEntriesForBreaks[currentIndex + 1]
                     if (nextEntryByTime?.start && nextEntryByTime.start <= entry.end) {
                       nextEntryByTime = null
                     }
                   }
                 }
                 const breakTime = calculateBreak(entry.end, nextEntryByTime?.start)

                 return (
                   <EntryRow
                     key={entry.id}
                     entry={entry}
                     breakTime={breakTime}
                     variant="compact"
                     onEdit={onEdit}
                   />
                 )
              })}
            </div>
          ) : (
            <table className="w-full text-sm min-w-full" style={{ tableLayout: 'auto' }}>
              {/* ✅ colgroup для управления шириной столбцов */}
              <colgroup>
                {selectionMode && (
                  <col style={{ width: `${tableWidths?.checkbox || 40}px`, minWidth: '40px' }} />
                )}
                <col style={{ width: `${tableWidths?.time || 150}px`, minWidth: '120px' }} />
                <col style={{ width: `${tableWidths?.category || 200}px`, minWidth: '100px' }} />
                <col style={{ width: `${tableWidths?.hours || 80}px`, minWidth: '60px' }} />
                <col style={{ width: `${tableWidths?.income || 100}px`, minWidth: '70px' }} />
              </colgroup>
  
              {selectionMode && (
                <thead>
                  <tr>
                    <th className="px-3 py-1.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 relative">
                      {/* Разделитель столбцов (только в режиме изменения) */}
                      {resizeMode && (
                        <TableColumnDivider
                          column="checkbox"
                          onDragStart={onDragStart}
                          isDragging={dragging?.mode === 'table' && dragging?.column === 'checkbox'}
                          position="right"
                        />
                      )}
                    </th>
                    {/* Остальные заголовки скрыты, так как они дублируются логически, или можно оставить пустыми если дизайн требует */}
                    <th colSpan={4} />
                  </tr>
                </thead>
              )}
  
              <tbody>
                {sortedEntries.map((entry, entryIdx) => {
                  const duration = parseDuration(entry)
                  const earned = Math.round(parseFloat(String(entry.earned)) || 0)
                  const timeRange = formatTimeRange(entry)
                  const categoryValue = entry.category || entry.categoryId
  
                  const isSelected = selectedEntries.has(String(entry.id))
  
                  let nextEntryByTime: TimeEntry | null = null
                  if (entry.end) {
                    const currentIndex = sortedEntriesForBreaks.findIndex(e => e.id === entry.id)
                    if (currentIndex >= 0 && currentIndex < sortedEntriesForBreaks.length - 1) {
                      nextEntryByTime = sortedEntriesForBreaks[currentIndex + 1]
                      if (nextEntryByTime?.start && nextEntryByTime.start <= entry.end) {
                        nextEntryByTime = null
                      }
                    }
                  }
                  const breakTime = calculateBreak(entry.end, nextEntryByTime?.start)
  
                  return (
                    <tr
                      key={entry.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-300 border-b border-gray-100 dark:border-gray-700 last:border-b-0 group"
                      onDoubleClick={() => onEdit && onEdit(entry)}
                      title="Двойной клик для редактирования"
                    >
                      {/* Чекбокс для выбора */}
                      {selectionMode && (
                        <td className="px-3 py-1.5 align-middle" style={{ width: '40px' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => onToggleSelection?.(String(entry.id))}
                            onClick={e => e.stopPropagation()}
                            className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                          />
                          {resizeMode && entryIdx === 0 && (
                            <TableColumnDivider
                              column="checkbox"
                              onDragStart={onDragStart}
                              isDragging={dragging?.mode === 'table' && dragging?.column === 'checkbox'}
                              position="right"
                            />
                          )}
                        </td>
                      )}
  
                      {/* Время БЕЗ иконки часов */}
                      <td className="px-3 py-1.5 align-middle font-mono text-xs text-gray-600 dark:text-gray-400 relative">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span>{timeRange}</span>
                          {breakTime && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400 font-medium">
                              {breakTime}
                            </span>
                          )}
                        </div>
                        {resizeMode && entryIdx === 0 && (
                          <TableColumnDivider
                            column="time"
                            onDragStart={onDragStart}
                            isDragging={dragging?.mode === 'table' && dragging?.column === 'time'}
                            position="right"
                          />
                        )}
                      </td>
  
                      {/* Категория */}
                      <td className="px-3 py-1.5 align-middle relative">
                        <CategoryBadge categoryId={categoryValue} size="sm" />
                        {resizeMode && entryIdx === 0 && (
                           <TableColumnDivider
                             column="category"
                             onDragStart={onDragStart}
                             isDragging={dragging?.mode === 'table' && dragging?.column === 'category'}
                             position="right"
                           />
                         )}
                      </td>
  
                      {/* Часы (длительность) */}
                      <td className="px-3 py-1.5 align-middle text-right text-xs text-gray-500 dark:text-gray-400 relative whitespace-nowrap">
                        {duration}ч
                        {resizeMode && entryIdx === 0 && (
                          <TableColumnDivider
                            column="hours"
                            onDragStart={onDragStart}
                            isDragging={dragging?.mode === 'table' && dragging?.column === 'hours'}
                            position="right"
                          />
                        )}
                      </td>
  
                      {/* Доход */}
                      <td className="px-3 py-1.5 align-middle text-right font-semibold text-gray-800 dark:text-gray-200 relative whitespace-nowrap">
                        {earned}₽
                        {resizeMode && entryIdx === 0 && (
                          <TableColumnDivider
                            column="income"
                            onDragStart={onDragStart}
                            isDragging={dragging?.mode === 'table' && dragging?.column === 'income'}
                            position="right"
                          />
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </details>
    )
  },
  (prevProps, nextProps) => {
    return (
      prevProps.date === nextProps.date &&
      prevProps.dateEntries === nextProps.dateEntries &&
      prevProps.dailyGoal === nextProps.dailyGoal &&
      prevProps.selectionMode === nextProps.selectionMode &&
      prevProps.selectedEntries === nextProps.selectedEntries &&
      prevProps.resizeMode === nextProps.resizeMode &&
      prevProps.gridWidths === nextProps.gridWidths &&
      prevProps.tableWidths === nextProps.tableWidths &&
      prevProps.dragging === nextProps.dragging
    )
  }
)


interface ListViewProps {
  entries: TimeEntry[]
  onEdit: (entry: TimeEntry) => void
  selectionMode: boolean
  selectedEntries: Set<string>
  onToggleSelection: (entryId: string) => void
}

export function ListView({
  entries,
  onEdit,
  selectionMode = false,
  selectedEntries = new Set(),
  onToggleSelection,
}: ListViewProps) {
  // ✅ ОПТИМИЗАЦИЯ: Используем атомарные селекторы для минимизации ре-рендеров
  const categories = useCategories()
  const dailyGoal = useDailyGoal()
  const isMobile = useIsMobile()

  // ✅ Хук для изменения размеров столбцов
  const {
    resizeMode,
    gridWidths,
    tableWidths,
    dragging,
    handleDragStart,
    handleDrag,
    handleDragEnd,
    resetAllWidths,
    saveAsDefaults,
  } = useColumnResize({
    gridStorageKey: 'listview-grid-column-widths',
    tableStorageKey: 'listview-table-column-widths',
    defaultGridStorageKey: 'default-grid-column-widths',
    defaultTableStorageKey: 'default-table-column-widths',
  })

  // ✅ Обработчики перетаскивания на документе
  useEffect(() => {
    if (dragging) {
      const handleMouseMove = e => {
        handleDrag(e)
      }
      const handleMouseUp = () => {
        handleDragEnd()
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [dragging, handleDrag, handleDragEnd])

  // ОПТИМИЗАЦИЯ: Инкрементальная загрузка - показываем по 50 дней
  const [visibleCount, setVisibleCount] = useState(50)

  // ОПТИМИЗАЦИЯ: Мемоизация группировки записей
  const groupedEntries = useMemo(() => {
    return entries.reduce((acc, entry) => {
      if (!acc[entry.date]) {
        acc[entry.date] = []
      }
      acc[entry.date].push(entry)
      return acc
    }, {})
  }, [entries])

  // ОПТИМИЗАЦИЯ: Мемоизация сортировки дат
  const sortedDates = useMemo(() => {
    return Object.keys(groupedEntries).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
  }, [groupedEntries])

  // ОПТИМИЗАЦИЯ: Ограничиваем отображаемые даты
  const visibleDates = useMemo(() => {
    return sortedDates.slice(0, visibleCount)
  }, [sortedDates, visibleCount])

  // ОПТИМИЗАЦИЯ: Кэшируем метрики для каждого дня
  const dayMetrics = useMemo(() => {
    const metrics = {}
    visibleDates.forEach(date => {
      metrics[date] = getDayMetrics(groupedEntries[date], dailyGoal)
    })
    return metrics
  }, [visibleDates, groupedEntries, dailyGoal])

  // ОПТИМИЗАЦИЯ: useCallback для всех функций
  const getCategory = useCallback(
    categoryIdOrName => {
      if (typeof categoryIdOrName === 'string') {
        // ✅ СТАНДАРТИЗАЦИЯ ID: Конвертируем в строку для корректного сравнения
        return (
          categories.find(c => c.name === categoryIdOrName || String(c.id) === categoryIdOrName) ||
          null
        )
      }
      // ✅ СТАНДАРТИЗАЦИЯ ID: Конвертируем в строку для корректного сравнения
      const categoryIdString = String(categoryIdOrName)
      return categories.find(c => String(c.id) === categoryIdString) || null
    },
    [categories]
  )

  const getCategoryName = useCallback(
    categoryIdOrName => {
      if (typeof categoryIdOrName === 'string') {
        // ✅ СТАНДАРТИЗАЦИЯ ID: Конвертируем в строку для корректного сравнения
        const categoryById = categories.find(c => String(c.id) === categoryIdOrName)
        if (categoryById) {
          return categoryById.name
        }
        return categoryIdOrName
      }
      return 'remix'
    },
    [categories]
  )

  const getProgressBarColor = useCallback(status => {
    if (!status || !status.status) return 'bg-gray-400'

    switch (status.status) {
      case 'success':
        return 'bg-green-500'
      case 'warning':
        return 'bg-yellow-500'
      case 'danger':
        return 'bg-red-500'
      default:
        return 'bg-gray-400'
    }
  }, [])

  const getStatusTextColor = useCallback(status => {
    if (!status || !status.status) return 'text-gray-600'

    switch (status.status) {
      case 'success':
        return 'text-green-600 dark:text-green-400'
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400'
      case 'danger':
        return 'text-red-600 dark:text-red-400'
      default:
        return 'text-gray-600'
    }
  }, [])

  const getStatusIcon = useCallback(status => {
    if (!status || !status.status) return null

    switch (status.status) {
      case 'success':
        return <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
      case 'warning':
        return <AlertCircle className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
      case 'danger':
        return <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
      default:
        return null
    }
  }, [])



  // ОПТИМИЗАЦИЯ: Кнопка "Показать еще" с плавной загрузкой
  const handleLoadMore = useCallback(() => {
    requestAnimationFrame(() => {
      setVisibleCount(prev => Math.min(prev + 50, sortedDates.length))
    })
  }, [sortedDates.length])

  const hasMore = visibleCount < sortedDates.length
  const remainingCount = sortedDates.length - visibleCount

  return (
    <div className="space-y-2">
      {/* Индикатор режима изменения столбцов */}
      <ResizeModeIndicator
        isVisible={resizeMode}
        onReset={resetAllWidths}
        onSaveAsDefaults={saveAsDefaults}
      />

      {visibleDates.map((date, index) => (
        <DayAccordion
          key={date}
          date={date}
          dateEntries={groupedEntries[date]}
          metrics={dayMetrics[date]}
          dailyGoal={dailyGoal}
          isMobile={isMobile}
          onEdit={onEdit}
          selectionMode={selectionMode}
          selectedEntries={selectedEntries}
          onToggleSelection={onToggleSelection}
          isFirstDay={index === 0}
          resizeMode={resizeMode}
          gridWidths={gridWidths}
          tableWidths={tableWidths}
          dragging={dragging}
          onDragStart={handleDragStart}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
        />
      ))}

      {/* Кнопка "Показать еще" */}
      {hasMore && (
        <div className="flex justify-center py-4">
          <button
            onClick={handleLoadMore}
            className="glass-button px-6 py-3 rounded-lg font-semibold text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300 hover:scale-105 active:scale-95"
          >
            Показать еще {Math.min(50, remainingCount)} дней (осталось {remainingCount})
          </button>
        </div>
      )}
    </div>
  )
}
