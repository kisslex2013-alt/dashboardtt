import { useMemo, memo } from 'react'
import { useDailyGoal } from '../../../store/useSettingsStore'
import { getDayMetrics } from '../../../utils/dayMetrics'
import { TimeEntry } from '../../../types'
import { Clock, DollarSign, TrendingUp, ChevronRight } from '../../../utils/icons'
import { useCategory } from '../../../hooks/useCategory'

interface MobileCardsViewProps {
  entries: TimeEntry[]
  onEdit?: (entry: TimeEntry) => void
}

/**
 * 🃏 Mobile Cards View — компактные карточки для мобильных
 * С прогресс-баром и метриками
 */
export const MobileCardsView = memo(({ entries, onEdit }: MobileCardsViewProps) => {
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
      month: 'short',
      weekday: 'short'
    })
  }

  // Вычисление прогресса записи относительно дня
  const getTimeProgress = (entry: TimeEntry, allEntries: TimeEntry[]) => {
    if (!entry.start || !entry.end) return 0
    
    // Находим границы дня
    const starts = allEntries.filter(e => e.start).map(e => e.start!)
    const ends = allEntries.filter(e => e.end).map(e => e.end!)
    if (starts.length === 0 || ends.length === 0) return 0

    const dayStart = starts.sort()[0]
    const dayEnd = ends.sort().reverse()[0]

    const toMins = (t: string) => {
      const [h, m] = t.split(':').map(Number)
      return h * 60 + m
    }

    const dayStartMins = toMins(dayStart)
    const dayEndMins = toMins(dayEnd)
    const entryStartMins = toMins(entry.start)
    const entryEndMins = toMins(entry.end)
    
    const dayDuration = dayEndMins - dayStartMins
    if (dayDuration <= 0) return 0

    const entryDuration = entryEndMins - entryStartMins
    return Math.round((entryDuration / dayDuration) * 100)
  }

  // Вычисление продолжительности в минутах
  const getDuration = (entry: TimeEntry): number => {
    if (!entry.start || !entry.end) return 0
    const [sh, sm] = entry.start.split(':').map(Number)
    const [eh, em] = entry.end.split(':').map(Number)
    return (eh * 60 + em) - (sh * 60 + sm)
  }

  // Форматирование продолжительности
  const formatDuration = (mins: number): string => {
    if (mins < 60) return `${mins}м`
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return m > 0 ? `${h}ч ${m}м` : `${h}ч`
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
        const progressPercent = dailyGoal > 0 
          ? Math.min(Math.round((metrics.totalEarned / dailyGoal) * 100), 100) 
          : 0

        return (
          <div key={date} className="space-y-3">
            {/* Заголовок дня с прогресс-баром */}
            <div className="glass-effect rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  {formatDate(date)}
                </h3>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-500">{dayEntries.length} записей</span>
                  {dailyGoal > 0 && (
                    <span className={`font-medium ${
                      progressPercent >= 100 ? 'text-emerald-500' : 
                      progressPercent >= 50 ? 'text-yellow-500' : 'text-rose-500'
                    }`}>
                      {progressPercent}%
                    </span>
                  )}
                </div>
              </div>

              {/* Мини прогресс-бар дня */}
              {dailyGoal > 0 && (
                <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      progressPercent >= 100 ? 'bg-emerald-500' : 
                      progressPercent >= 50 ? 'bg-yellow-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              )}

              {/* Метрики дня */}
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                  <Clock className="w-3.5 h-3.5" />
                  {metrics.totalHours.toFixed(1)}ч
                </span>
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <DollarSign className="w-3.5 h-3.5" />
                  {metrics.totalEarned}₽
                </span>
                <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                  <TrendingUp className="w-3.5 h-3.5" />
                  {Math.round(metrics.averageRate || 0)}₽/ч
                </span>
              </div>
            </div>

            {/* Карточки записей */}
            <div className="grid grid-cols-1 gap-2">
              {dayEntries.map(entry => {
                const categoryName = getCategoryNameById(entry.category || entry.categoryId, 'Работа')
                const duration = getDuration(entry)
                const progress = getTimeProgress(entry, dayEntries)

                return (
                  <button
                    key={entry.id}
                    onClick={() => onEdit?.(entry)}
                    className="w-full text-left bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 active:scale-[0.98] transition-all shadow-sm touch-manipulation"
                  >
                    {/* Прогресс-бар записи */}
                    <div className="h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
                      <div 
                        className="h-full bg-gradient-to-r from-rose-500 to-rose-400 rounded-full"
                        style={{ width: `${Math.max(progress, 10)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        {/* Время */}
                        <div className="flex items-center gap-2 text-xs text-gray-400 mb-0.5">
                          <span>{entry.start || '—'} – {entry.end || '—'}</span>
                          <span className="text-gray-300 dark:text-gray-600">•</span>
                          <span>{formatDuration(duration)}</span>
                        </div>

                        {/* Название */}
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {entry.description || categoryName}
                        </div>

                        {/* Категория */}
                        {entry.description && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {categoryName}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Заработок */}
                        {entry.earned && Number(entry.earned) > 0 && (
                          <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                            {entry.earned}₽
                          </div>
                        )}
                        <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
})
