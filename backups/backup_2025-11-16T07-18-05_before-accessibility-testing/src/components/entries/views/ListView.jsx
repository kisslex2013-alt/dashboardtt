import { memo, useMemo, useCallback, useState, useEffect } from 'react'
import {
  ChevronDown,
  Clock,
  AlertTriangle,
  DollarSign,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from '../../../utils/icons'
import { useCategories, useDailyGoal } from '../../../store/useSettingsStore'
import { getDayMetrics } from '../../../utils/dayMetrics'
import { getIcon } from '../../../utils/iconHelper'
import { formatHoursToTime } from '../../../utils/formatting'
import { useColumnResize } from '../../../hooks/useColumnResize'
import { GridColumnDivider, TableColumnDivider, ResizeModeIndicator } from '../../ui/ColumnResizers'

/**
 * 📋 ОПТИМИЗИРОВАННЫЙ Вид списком с точным визуалом фото 1
 */

// ОПТИМИЗАЦИЯ: Мемоизированный компонент дня
const DayAccordion = memo(
  ({
    date,
    dateEntries,
    metrics,
    dailyGoal,
    categories,
    getCategory,
    getCategoryName,
    getProgressBarColor,
    getStatusTextColor,
    getStatusIcon,
    calculateBreak,
    onEdit,
    selectionMode,
    selectedEntries,
    onToggleSelection,
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

    return (
      <details
        className="glass-effect entry-card rounded-lg overflow-hidden snap-start mb-2"
        style={{
          contain: 'layout style paint',
          contentVisibility: 'auto',
        }}
      >
        <summary className="cursor-pointer relative overflow-hidden list-none">
          {/* Фоновый прогресс-бар */}
          <div
            className={`absolute inset-0 opacity-10 ${getProgressBarColor(metrics.status)}`}
            style={{ width: `${Math.min(progressPercent, 100)}%` }}
          />

          {/* Содержимое summary */}
          <div
            className="relative px-3 py-2 grid grid-cols-[1fr_minmax(0,1fr)_minmax(100px,min-content)] md:grid-cols-[1fr_minmax(280px,1fr)_minmax(120px,min-content)] items-center hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
            style={{ columnGap: '8px' }}
          >
            {/* Левая часть: Дата и проценты - проценты максимально вправо к дате */}
            <div className="flex items-center gap-2 min-w-0 overflow-hidden">
              <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 details-chevron flex-shrink-0" />
              <span
                className="font-semibold text-gray-800 dark:text-white whitespace-nowrap truncate"
                title={formattedDate}
              >
                {formattedDate}
              </span>
              {/* Проценты - максимально вправо к дате */}
              <div
                className="flex items-center gap-1.5 justify-center relative flex-shrink-0 ml-auto"
                style={{ marginLeft: `${gridWidths?.percentMargin || 8}px` }}
              >
                {metrics.status && metrics.status.status && (
                  <>
                    {getStatusIcon(metrics.status)}
                    <span
                      className={`text-xs font-medium whitespace-nowrap ${getStatusTextColor(metrics.status)}`}
                    >
                      {progressPercent}%
                    </span>
                  </>
                )}
                {/* Разделитель столбцов (только в режиме изменения) */}
                {resizeMode && (
                  <GridColumnDivider
                    column="percentMargin"
                    onDragStart={onDragStart}
                    isDragging={dragging?.mode === 'grid' && dragging?.column === 'percentMargin'}
                    position="right"
                  />
                )}
              </div>
            </div>

            {/* Центр: Компактные инсайты - четко между процентами и часами */}
            <div
              className="hidden md:flex items-center gap-1.5 text-xs justify-center relative"
              style={{
                minWidth: '280px',
                marginLeft: `${gridWidths?.columnGap || 16}px`,
                marginRight: `${gridWidths?.columnGap || 16}px`,
              }}
            >
              <span
                title="Общее время работы"
                className="flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700"
              >
                <Clock className="w-3 h-3 flex-shrink-0" />
                <span className="font-medium">{formatHoursToTime(metrics.totalHours)}</span>
              </span>
              <span
                title="Всего перерывов"
                className="flex items-center gap-1 px-2 py-1 rounded-md bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-700"
              >
                <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                <span className="font-medium">{metrics.totalBreaks || '0:00'}</span>
              </span>
              <span
                title="Ср. ставка"
                className="flex items-center gap-1 px-2 py-1 rounded-md bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700"
              >
                <DollarSign className="w-3 h-3 flex-shrink-0" />
                <span className="font-medium">{metrics.averageRate || 0}₽</span>
              </span>
              {/* Разделитель столбцов (только в режиме изменения) */}
              {resizeMode && (
                <GridColumnDivider
                  column="insightsMargin"
                  onDragStart={onDragStart}
                  isDragging={dragging?.mode === 'grid' && dragging?.column === 'insightsMargin'}
                  position="right"
                />
              )}
            </div>

            {/* Правая часть: Итого - часы слева от дохода, выровнены по вертикали */}
            <div
              className="flex items-center gap-2 relative min-w-0 flex-shrink-0"
              style={{ marginLeft: `${gridWidths?.columnGap || 16}px` }}
            >
              <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap flex-shrink-0">
                {metrics.totalHours.toFixed(2)}ч
              </span>
              <span
                className={`text-lg font-bold whitespace-nowrap flex-shrink-0 ml-auto ${getStatusTextColor(metrics.status)}`}
              >
                {metrics.totalEarned}₽
              </span>
              {/* Разделитель столбцов (только в режиме изменения) */}
              {resizeMode && (
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
                  <th className="px-3 py-1.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 relative">
                    Время
                    {/* Разделитель столбцов (только в режиме изменения) */}
                    {resizeMode && (
                      <TableColumnDivider
                        column="time"
                        onDragStart={onDragStart}
                        isDragging={dragging?.mode === 'table' && dragging?.column === 'time'}
                        position="right"
                      />
                    )}
                  </th>
                  <th className="px-3 py-1.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 relative">
                    Категория
                    {/* Разделитель столбцов (только в режиме изменения) */}
                    {resizeMode && (
                      <TableColumnDivider
                        column="category"
                        onDragStart={onDragStart}
                        isDragging={dragging?.mode === 'table' && dragging?.column === 'category'}
                        position="right"
                      />
                    )}
                  </th>
                  <th className="px-3 py-1.5 text-right text-xs font-medium text-gray-500 dark:text-gray-400 relative">
                    Часы
                    {/* Разделитель столбцов (только в режиме изменения) */}
                    {resizeMode && (
                      <TableColumnDivider
                        column="hours"
                        onDragStart={onDragStart}
                        isDragging={dragging?.mode === 'table' && dragging?.column === 'hours'}
                        position="right"
                      />
                    )}
                  </th>
                  <th className="px-3 py-1.5 text-right text-xs font-medium text-gray-500 dark:text-gray-400 relative">
                    Доход
                    {/* Разделитель столбцов (только в режиме изменения) */}
                    {resizeMode && (
                      <TableColumnDivider
                        column="income"
                        onDragStart={onDragStart}
                        isDragging={dragging?.mode === 'table' && dragging?.column === 'income'}
                        position="right"
                      />
                    )}
                  </th>
                </tr>
              </thead>
            )}
            <tbody>
              {sortedEntries.map((entry, entryIdx) => {
                const duration = entry.duration
                  ? parseFloat(entry.duration).toFixed(2)
                  : (() => {
                      if (entry.start && entry.end) {
                        const [startH, startM] = entry.start.split(':').map(Number)
                        const [endH, endM] = entry.end.split(':').map(Number)
                        const minutes = endH * 60 + endM - (startH * 60 + startM)
                        return (minutes / 60).toFixed(2)
                      }
                      return '0.00'
                    })()

                const earned = Math.round(parseFloat(entry.earned) || 0)
                const timeRange = entry.start
                  ? entry.end
                    ? `${entry.start}—${entry.end}`
                    : `${entry.start} (в процессе)`
                  : ''

                // Получаем категорию для иконки и цвета
                const categoryValue = entry.category || entry.categoryId
                const category = getCategory(categoryValue)
                const CategoryIcon = category && category.icon ? getIcon(category.icon) : null
                const categoryColor = category && category.color ? category.color : '#6B7280'
                const categoryName = getCategoryName(categoryValue)

                // ИСПРАВЛЕНО: Правильный расчет перерыва
                // Ищем следующую запись по времени начала (ближайшую после окончания текущей)
                let nextEntryByTime = null
                if (entry.end) {
                  // Используем отсортированный список от старых к новым для правильного поиска
                  const currentIndex = sortedEntriesForBreaks.findIndex(e => e.id === entry.id)
                  if (currentIndex >= 0 && currentIndex < sortedEntriesForBreaks.length - 1) {
                    // Берем следующую запись в отсортированном списке
                    nextEntryByTime = sortedEntriesForBreaks[currentIndex + 1]
                    // Проверяем, что следующая запись действительно начинается после окончания текущей
                    if (nextEntryByTime.start && nextEntryByTime.start <= entry.end) {
                      nextEntryByTime = null
                    }
                  }
                }
                const breakTime = calculateBreak(entry.end, nextEntryByTime?.start)

                return (
                  <tr
                    key={entry.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-300 border-b border-gray-100 dark:border-gray-700 last:border-b-0 cursor-pointer group"
                    style={{
                      transform: 'translateY(0) translateZ(0)',
                      willChange: 'transform',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-3px) translateZ(0)'
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateY(0) translateZ(0)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                    onDoubleClick={() => onEdit && onEdit(entry)}
                    title="Двойной клик для редактирования"
                  >
                    {/* Чекбокс для выбора (если включен режим выбора) */}
                    {selectionMode && (
                      <td
                        className="px-3 py-1.5 align-middle"
                        style={{ verticalAlign: 'middle', width: '40px' }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedEntries.has(entry.id)}
                          onChange={() => onToggleSelection && onToggleSelection(entry.id)}
                          onClick={e => e.stopPropagation()}
                          className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                    )}

                    {/* Время БЕЗ иконки часов */}
                    <td
                      className="px-3 py-1.5 align-middle font-mono text-xs text-gray-600 dark:text-gray-400"
                      style={{ verticalAlign: 'middle' }}
                    >
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span>{timeRange}</span>
                        {breakTime && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400 font-medium">
                            {breakTime}
                          </span>
                        )}
                      </div>
                      {/* Разделитель столбцов (только в режиме изменения, только в первой строке) */}
                      {resizeMode && entryIdx === 0 && (
                        <TableColumnDivider
                          column="time"
                          onDragStart={onDragStart}
                          isDragging={dragging?.mode === 'table' && dragging?.column === 'time'}
                          position="right"
                        />
                      )}
                    </td>

                    {/* Категория с иконкой */}
                    <td
                      className="px-3 py-1.5 align-middle relative"
                      style={{ verticalAlign: 'middle' }}
                    >
                      <div className="flex items-center gap-1 text-xs">
                        {CategoryIcon && (
                          <CategoryIcon
                            className="w-3 h-3 flex-shrink-0"
                            style={{ color: categoryColor }}
                          />
                        )}
                        <span className="text-gray-700 dark:text-gray-300">{categoryName}</span>
                      </div>
                      {/* Разделитель столбцов (только в режиме изменения, только в первой строке) */}
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
                    <td
                      className="px-3 py-1.5 align-middle text-right text-xs text-gray-500 dark:text-gray-400 relative whitespace-nowrap"
                      style={{ verticalAlign: 'middle' }}
                    >
                      {duration}ч
                      {/* Разделитель столбцов (только в режиме изменения, только в первой строке) */}
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
                    <td
                      className="px-3 py-1.5 align-middle text-right font-semibold text-gray-800 dark:text-gray-200 relative whitespace-nowrap"
                      style={{ verticalAlign: 'middle' }}
                    >
                      {earned}₽
                      {/* Разделитель столбцов (только в режиме изменения, только в первой строке) */}
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

export function ListView({
  entries,
  onEdit,
  selectionMode = false,
  selectedEntries = new Set(),
  onToggleSelection,
}) {
  // ✅ ОПТИМИЗАЦИЯ: Используем атомарные селекторы для минимизации ре-рендеров
  const categories = useCategories()
  const dailyGoal = useDailyGoal()

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
    return Object.keys(groupedEntries).sort((a, b) => new Date(b) - new Date(a))
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

  const calculateBreak = useCallback((entryEnd, nextEntryStart) => {
    if (!entryEnd || !nextEntryStart) return null

    const [endH, endM] = entryEnd.split(':').map(Number)
    const [startH, startM] = nextEntryStart.split(':').map(Number)

    const endMinutes = endH * 60 + endM
    const startMinutes = startH * 60 + startM

    // ИСПРАВЛЕНО: Правильный расчет перерыва для записей в один день
    // Если следующая запись начинается раньше, чем заканчивается текущая,
    // это означает, что записи перекрываются или неправильно отсортированы
    const breakMinutes = startMinutes - endMinutes

    // Если перерыв отрицательный, значит записи перекрываются или неправильный порядок
    // В этом случае не показываем перерыв
    if (breakMinutes < 0) {
      return null
    }

    const hours = Math.floor(breakMinutes / 60)
    const minutes = breakMinutes % 60

    // ИСПРАВЛЕНО: Показываем все перерывы, даже маленькие (убрал фильтр 30 минут)
    // Перерыв 0:00 не показываем
    if (hours === 0 && minutes === 0) return null

    return `${hours}:${minutes.toString().padStart(2, '0')}`
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

      {visibleDates.map(date => (
        <DayAccordion
          key={date}
          date={date}
          dateEntries={groupedEntries[date]}
          metrics={dayMetrics[date]}
          dailyGoal={dailyGoal}
          categories={categories}
          getCategory={getCategory}
          getCategoryName={getCategoryName}
          getProgressBarColor={getProgressBarColor}
          getStatusTextColor={getStatusTextColor}
          getStatusIcon={getStatusIcon}
          calculateBreak={calculateBreak}
          onEdit={onEdit}
          selectionMode={selectionMode}
          selectedEntries={selectedEntries}
          onToggleSelection={onToggleSelection}
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
