import { memo, useCallback } from 'react'
import { CategoryBadge } from '../ui/CategoryBadge'
import { TimeEntry } from '../../types'

/**
 * 📝 EntryRow — универсальный компонент строки записи
 * 
 * Используется в ListView, GridView, TimelineView для единообразного
 * отображения записей времени.
 * 
 * Варианты отображения:
 * - table: для таблиц (используется в ListView, TimelineView)
 * - card: для карточек (используется в GridView)
 * - compact: минимальный вариант
 */

export interface EntryRowProps {
  /** Данные записи */
  entry: TimeEntry
  /** Время перерыва после этой записи */
  breakTime?: string | null
  /** Обработчик редактирования */
  onEdit?: (entry: TimeEntry) => void
  /** Режим выбора (чекбокс) */
  selectionMode?: boolean
  /** Выбрана ли запись */
  isSelected?: boolean
  /** Обработчик выбора */
  onToggleSelection?: (id: string) => void
  /** Вариант отображения */
  variant?: 'table' | 'card' | 'compact'
  /** Дополнительные классы */
  className?: string
}

/**
 * Парсит длительность записи
 */
function parseDuration(entry: TimeEntry): string {
  if (entry.duration) {
    return parseFloat(String(entry.duration)).toFixed(2)
  }

  if (entry.start && entry.end) {
    const [startH, startM] = entry.start.split(':').map(Number)
    const [endH, endM] = entry.end.split(':').map(Number)
    const minutes = endH * 60 + endM - (startH * 60 + startM)
    return (minutes / 60).toFixed(2)
  }

  return '0.00'
}

/**
 * Форматирует временной диапазон
 */
function formatTimeRange(entry: TimeEntry): string {
  if (!entry.start) return ''
  if (!entry.end) return `${entry.start} (в процессе)`
  return `${entry.start}—${entry.end}`
}

// ============ Вариант TABLE ============
const TableRow = memo(function TableRow({
  entry,
  breakTime,
  onEdit,
  selectionMode,
  isSelected,
  onToggleSelection,
}: EntryRowProps) {
  const duration = parseDuration(entry)
  const earned = Math.round(parseFloat(String(entry.earned)) || 0)
  const timeRange = formatTimeRange(entry)
  const categoryValue = entry.category || entry.categoryId

  const handleDoubleClick = useCallback(() => {
    onEdit?.(entry)
  }, [onEdit, entry])

  const handleCheckboxChange = useCallback(() => {
    onToggleSelection?.(String(entry.id))
  }, [onToggleSelection, entry.id])

  return (
    <tr
      className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-300 border-b border-gray-100 dark:border-gray-700 last:border-b-0 group"
      onDoubleClick={handleDoubleClick}
      title="Двойной клик для редактирования"
    >
      {/* Чекбокс */}
      {selectionMode && (
        <td className="px-3 py-1.5 align-middle" style={{ width: '40px' }}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleCheckboxChange}
            onClick={(e) => e.stopPropagation()}
            className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
          />
        </td>
      )}

      {/* Время */}
      <td className="px-3 py-1.5 align-middle font-mono text-xs text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span>{timeRange}</span>
          {breakTime && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400 font-medium">
              {breakTime}
            </span>
          )}
        </div>
      </td>

      {/* Категория */}
      <td className="px-3 py-1.5 align-middle">
        <CategoryBadge categoryId={categoryValue} size="sm" />
      </td>

      {/* Часы */}
      <td className="px-3 py-1.5 align-middle text-right text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
        {duration}ч
      </td>

      {/* Доход */}
      <td className="px-3 py-1.5 align-middle text-right font-semibold text-gray-800 dark:text-gray-200 whitespace-nowrap">
        {earned}₽
      </td>
    </tr>
  )
})

// ============ Вариант CARD ============
const CardRow = memo(function CardRow({
  entry,
  onEdit,
  selectionMode,
  isSelected,
  onToggleSelection,
}: EntryRowProps) {
  const duration = parseDuration(entry)
  const earned = Math.round(parseFloat(String(entry.earned)) || 0)
  const timeRange = entry.start && entry.end ? `${entry.start} - ${entry.end}` : ''
  const categoryValue = entry.category || entry.categoryId
  const rate = parseFloat(duration) > 0 ? Math.round(earned / parseFloat(duration)) : 0

  const handleClick = useCallback(() => {
    onEdit?.(entry)
  }, [onEdit, entry])

  const handleCheckboxClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onToggleSelection?.(String(entry.id))
    },
    [onToggleSelection, entry.id]
  )

  return (
    <div
      onClick={handleClick}
      className={`
        bg-white/50 dark:bg-gray-700/50 rounded-lg p-2 
        hover:bg-white/80 dark:hover:bg-gray-600/50 
        transition-colors cursor-pointer
        ${selectionMode ? 'relative' : ''}
      `}
    >
      {/* Чекбокс */}
      {selectionMode && (
        <div className="absolute top-2 left-2 z-10" onClick={handleCheckboxClick}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => {}}
            className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
          />
        </div>
      )}

      <div className="flex items-center justify-between mb-1">
        <div className={`flex items-center gap-1.5 min-w-0 flex-1 mr-2 ${selectionMode ? 'ml-6' : ''}`}>
          <CategoryBadge categoryId={categoryValue} size="sm" truncate />
        </div>
        <span className="text-sm font-bold text-gray-800 dark:text-gray-100 flex-shrink-0">
          {earned} ₽
        </span>
      </div>

      {timeRange && (
        <div className="flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-400">
          <span>{timeRange}</span>
          <span>
            {parseFloat(duration).toFixed(1)} часа • {rate} ₽/ч
          </span>
        </div>
      )}
    </div>
  )
})

// ============ Вариант COMPACT ============
const CompactRow = memo(function CompactRow({
  entry,
  onEdit,
}: EntryRowProps) {
  const duration = parseDuration(entry)
  const earned = Math.round(parseFloat(String(entry.earned)) || 0)
  const categoryValue = entry.category || entry.categoryId

  const handleClick = useCallback(() => {
    onEdit?.(entry)
  }, [onEdit, entry])

  return (
    <div
      onClick={handleClick}
      className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded cursor-pointer"
    >
      <CategoryBadge categoryId={categoryValue} size="sm" truncate />
      <div className="flex items-center gap-2 text-xs">
        <span className="text-gray-500 dark:text-gray-400">{duration}ч</span>
        <span className="font-medium text-gray-700 dark:text-gray-300">{earned}₽</span>
      </div>
    </div>
  )
})

// ============ Главный компонент ============
export const EntryRow = memo(function EntryRow(props: EntryRowProps) {
  const { variant = 'table' } = props

  switch (variant) {
    case 'card':
      return <CardRow {...props} />
    case 'compact':
      return <CompactRow {...props} />
    case 'table':
    default:
      return <TableRow {...props} />
  }
})

// Экспортируем утилиты
export { parseDuration, formatTimeRange }
