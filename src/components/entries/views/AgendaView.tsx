import { useMemo, memo } from 'react'
import { useDailyGoal } from '../../../store/useSettingsStore'
import { getDayMetrics } from '../../../utils/dayMetrics'
import { TimeEntry } from '../../../types'
import { ChevronLeft, ChevronRight, Clock, Coffee, DollarSign } from '../../../utils/icons'
import { useCategory } from '../../../hooks/useCategory'

interface AgendaViewProps {
  entries: TimeEntry[]
  onEdit?: (entry: TimeEntry) => void
}

/**
 * 📋 Agenda View — вертикальный список событий для мобильных
 * Простой и читабельный формат с разделителями
 */
export const AgendaView = memo(({ entries, onEdit }: AgendaViewProps) => {
  const dailyGoal = useDailyGoal()
  const { getCategoryNameById } = useCategory({ defaultName: 'Без категории' })

  // Группировка записей по датам
  const groupedEntries = useMemo(() => 
    entries.reduce((acc, entry) => {
      if (!acc[entry.date]) acc[entry.date] = []
      acc[entry.date].push(entry)
      return acc
    }, {} as Record<string, TimeEntry[]>),
    [entries]
  )

  // Сортировка дат (новые сверху)
  const sortedDates = useMemo(() => 
    Object.keys(groupedEntries).sort((a, b) => 
      new Date(b).getTime() - new Date(a).getTime()
    ),
    [groupedEntries]
  )

  // Форматирование даты
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) return 'Сегодня'
    if (date.toDateString() === yesterday.toDateString()) return 'Вчера'
    
    return date.toLocaleDateString('ru-RU', { 
      day: 'numeric', 
      month: 'long',
      weekday: 'short'
    })
  }

  // Вычисление перерывов между записями
  const getBreakBetween = (current: TimeEntry, next: TimeEntry): number | null => {
    if (!current.end || !next.start) return null
    const [ch, cm] = current.end.split(':').map(Number)
    const [nh, nm] = next.start.split(':').map(Number)
    const currentEndMins = ch * 60 + cm
    const nextStartMins = nh * 60 + nm
    const breakMins = nextStartMins - currentEndMins
    return breakMins > 0 ? breakMins : null
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
        <Clock className="w-12 h-12 mb-3 opacity-50" />
        <p className="text-sm">Нет записей для отображения</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {sortedDates.map(date => {
        const dayEntries = groupedEntries[date].sort((a, b) => 
          (a.start || '').localeCompare(b.start || '')
        )
        const metrics = getDayMetrics(dayEntries, dailyGoal)

        return (
          <div key={date} className="space-y-3">
            {/* Заголовок дня */}
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                {formatDate(date)}
              </h3>
              <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {metrics.totalHours.toFixed(1)}ч
                </span>
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <DollarSign className="w-3.5 h-3.5" />
                  {metrics.totalEarned}₽
                </span>
              </div>
            </div>

            {/* Список записей */}
            <div className="space-y-2">
              {dayEntries.map((entry, idx) => {
                const categoryName = getCategoryNameById(entry.category || entry.categoryId, 'Работа')
                const nextEntry = dayEntries[idx + 1]
                const breakMins = nextEntry ? getBreakBetween(entry, nextEntry) : null

                return (
                  <div key={entry.id}>
                    {/* Запись */}
                    <button
                      onClick={() => onEdit?.(entry)}
                      className="w-full text-left glass-effect rounded-xl p-4 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 active:scale-[0.98] transition-all touch-manipulation"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          {/* Время */}
                          <div className="text-xs text-gray-400 dark:text-gray-500 mb-1">
                            {entry.start || '—'} – {entry.end || '—'}
                          </div>
                          
                          {/* Категория/описание */}
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0" />
                            <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {entry.description || categoryName}
                            </span>
                          </div>
                          
                          {/* Категория если есть описание */}
                          {entry.description && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 ml-4">
                              {categoryName}
                            </div>
                          )}
                        </div>

                        {/* Заработок */}
                        {entry.earned && Number(entry.earned) > 0 && (
                          <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                            {entry.earned}₽
                          </div>
                        )}
                      </div>
                    </button>

                    {/* Перерыв между записями */}
                    {breakMins && breakMins >= 5 && (
                      <div className="flex items-center gap-2 py-2 px-4">
                        <div className="flex-1 h-px bg-emerald-300/30 dark:bg-emerald-700/30" />
                        <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                          <Coffee className="w-3 h-3" />
                          <span>{breakMins} мин</span>
                        </div>
                        <div className="flex-1 h-px bg-emerald-300/30 dark:bg-emerald-700/30" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
})
