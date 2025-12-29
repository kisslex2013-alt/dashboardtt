/**
 * 📅 Вид "Календарь" для записей времени
 *
 * Отображает записи в виде месячного календаря с детальной информацией:
 * - Дата в правом верхнем углу
 * - Затраченное время с иконкой
 * - Время перерывов с иконкой
 * - Сумма заработка с иконкой
 *
 * Стиль: темный фон, зеленые/teal ячейки для рабочих дней
 */

import { useState, useMemo, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Clock, AlertTriangle, DollarSign } from '../../../utils/icons'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isWeekend } from 'date-fns'
import { ru } from 'date-fns/locale'
import { getDayMetrics } from '../../../utils/dayMetrics'
import { useDailyGoal } from '../../../store/useSettingsStore'

interface TimeEntry {
  id: string
  date: string
  start?: string
  end?: string
  duration?: number
  earned?: number
  description?: string
  categoryId?: string
  category?: string
}

interface EntriesCalendarViewProps {
  entries: TimeEntry[]
  onDaySelect: (date: Date | null) => void
  selectedDate: Date | null
  onEditEntry?: (entry: TimeEntry) => void
}

export function EntriesCalendarView({
  entries,
  onDaySelect,
  selectedDate,
  onEditEntry,
}: EntriesCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null)
  const dailyGoal = useDailyGoal()

  // Навигация по месяцам (упрощенные обработчики)
  const goToPreviousMonth = (e: React.MouseEvent) => {
    console.log('⬅️ Клик на стрелку ВЛЕВО')
    e.preventDefault()
    e.stopPropagation()
    setCurrentMonth(prev => {
      const newMonth = subMonths(prev, 1)
      console.log('Новый месяц:', newMonth)
      return newMonth
    })
  }

  const goToNextMonth = (e: React.MouseEvent) => {
    console.log('➡️ Клик на стрелку ВПРАВО')
    e.preventDefault()
    e.stopPropagation()
    setCurrentMonth(prev => {
      const newMonth = addMonths(prev, 1)
      console.log('Новый месяц:', newMonth)
      return newMonth
    })
  }

  // Keyboard navigation - клавиши ← и →
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      setSlideDirection('right')
      setTimeout(() => {
        setCurrentMonth(prev => subMonths(prev, 1))
        setSlideDirection(null)
      }, 150)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      setSlideDirection('left')
      setTimeout(() => {
        setCurrentMonth(prev => addMonths(prev, 1))
        setSlideDirection(null)
      }, 150)
    }
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Группировка записей по дням
  const entriesByDay = useMemo(() => {
    const map = new Map<string, TimeEntry[]>()
    entries.forEach(entry => {
      const dateKey = entry.date
      const existing = map.get(dateKey) || []
      existing.push(entry)
      map.set(dateKey, existing)
    })
    return map
  }, [entries])

  // Рассчитываем метрики для каждого дня используя getDayMetrics
  const dayMetricsMap = useMemo(() => {
    const map = new Map<string, {
      totalHours: number
      totalBreaks: string
      totalEarned: number
      count: number
    }>()

    entriesByDay.forEach((dayEntries, dateKey) => {
      const metrics = getDayMetrics(dayEntries, dailyGoal)
      map.set(dateKey, {
        totalHours: metrics.totalHours,
        totalBreaks: metrics.totalBreaks,
        totalEarned: metrics.totalEarned,
        count: dayEntries.length
      })
    })

    return map
  }, [entriesByDay, dailyGoal])

  // Генерация дней для отображения
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  }, [currentMonth])

  // Форматирование времени
  const formatHours = (hours: number) => {
    if (hours === 0) return '0ч'
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    return m > 0 ? `${h}ч ${m}м` : `${h}ч`
  }

  // Форматирование денег (полная сумма с разделителями)
  const formatMoney = (amount: number) => {
    return amount.toLocaleString('ru-RU')
  }

  // Склонение слова "запись"
  const formatEntriesWord = (count: number) => {
    if (count === 1) return 'запись'
    if (count >= 2 && count <= 4) return 'записи'
    return 'записей'
  }

  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

  return (
    <div className="rounded-xl overflow-hidden">
      {/* Навигация по месяцам - добавлен z-50 для фикса кликов */}
      <div className="flex items-center justify-between mb-6 px-2 relative z-50">
        <button
          type="button"
          style={{ pointerEvents: 'auto' }}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            console.log('⬅️ PREV clicked!')
            alert('Клик на стрелку ВЛЕВО')
            setCurrentMonth(subMonths(currentMonth, 1))
          }}
          className="group w-10 h-10 flex items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-800/50 hover:bg-gray-300 dark:hover:bg-gray-700/50 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer z-50"
          aria-label="Предыдущий месяц"
        >
          <ChevronLeft className="w-5 h-5 transition-transform duration-200 group-hover:scale-110 pointer-events-none" />
        </button>

        <h3 className="text-xl font-bold text-gray-900 dark:text-white capitalize">
          {format(currentMonth, 'LLLL yyyy', { locale: ru })}
        </h3>

        <button
          type="button"
          style={{ pointerEvents: 'auto' }}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            console.log('➡️ NEXT clicked!')
            alert('Клик на стрелку ВПРАВО')
            setCurrentMonth(addMonths(currentMonth, 1))
          }}
          className="group w-10 h-10 flex items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-800/50 hover:bg-gray-300 dark:hover:bg-gray-700/50 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer z-50"
          aria-label="Следующий месяц"
        >
          <ChevronRight className="w-5 h-5 transition-transform duration-200 group-hover:scale-110 pointer-events-none" />
        </button>
      </div>

      {/* Сетка календаря с анимацией */}
      <div
        className={`grid grid-cols-7 gap-2 transition-all duration-200 ${
          slideDirection === 'left' ? 'opacity-0 -translate-x-4' :
          slideDirection === 'right' ? 'opacity-0 translate-x-4' :
          'opacity-100 translate-x-0'
        }`}
      >
        {/* Заголовки дней недели */}
        {weekDays.map((day, index) => (
          <div
            key={day}
            className={`text-center text-sm font-medium py-3 ${
              index >= 5 ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            {day}
          </div>
        ))}

        {/* Дни месяца */}
        {calendarDays.map(day => {
          const dateKey = format(day, 'yyyy-MM-dd')
          const metrics = dayMetricsMap.get(dateKey)
          const isCurrentMonth = isSameMonth(day, currentMonth)
          const isSelected = selectedDate && isSameDay(day, selectedDate)
          const isToday = isSameDay(day, new Date())
          const isWeekendDay = isWeekend(day)
          const hasData = metrics && metrics.totalHours > 0

          // Определяем стиль ячейки - light/dark theme support
          let cellStyle = 'bg-gray-100 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700/50'

          if (hasData) {
            cellStyle = 'bg-emerald-100 dark:bg-emerald-900/40 border-emerald-300 dark:border-emerald-600/60 hover:bg-emerald-200 dark:hover:bg-emerald-800/50'
          } else if (isWeekendDay) {
            cellStyle = 'bg-gray-200 dark:bg-gray-900/50 border-gray-300 dark:border-gray-700/30'
          }

          if (isSelected) {
            cellStyle = 'bg-emerald-300 dark:bg-emerald-700/60 border-emerald-500 dark:border-emerald-400 ring-2 ring-emerald-400/50'
          }

          if (isToday && !isSelected) {
            cellStyle += ' ring-2 ring-emerald-500/70 ring-offset-1 ring-offset-white dark:ring-offset-gray-900'
          }

          return (
            <div
              key={dateKey}
              className={`
                relative min-h-[100px] p-2 rounded-xl border transition-all duration-200
                ${isCurrentMonth ? 'opacity-100 hover:scale-[1.03] cursor-pointer' : 'opacity-30'}
                ${cellStyle}
              `}
            >
              {/* Дата в правом верхнем углу */}
              <div className="absolute top-2 right-2">
                <span className={`
                  text-lg font-bold
                  ${isToday ? 'text-emerald-600 dark:text-emerald-400' : hasData ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}
                `}>
                  {format(day, 'd')}
                </span>
              </div>

              {/* Количество записей за день (без зеленой подложки) */}
              {hasData && (
                <div className="absolute top-2 left-2 flex items-center gap-1">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                    {metrics.count} {formatEntriesWord(metrics.count)}
                  </span>
                </div>
              )}

              {/* Детальная информация для дней с данными */}
              {hasData && (
                <div className="mt-7 space-y-1 text-left">
                  {/* Время работы */}
                  <div className="flex items-center gap-1 text-xs group/icon cursor-default">
                    <Clock className="w-3 h-3 text-blue-500 dark:text-blue-400 flex-shrink-0 transition-transform duration-200 group-hover/icon:scale-150" />
                    <span className="text-blue-600 dark:text-blue-300 font-medium truncate">
                      {formatHours(metrics.totalHours)}
                    </span>
                  </div>

                  {/* Перерывы (всегда показываем) */}
                  <div className="flex items-center gap-1 text-xs group/icon cursor-default">
                    <AlertTriangle className="w-3 h-3 text-orange-500 dark:text-orange-400 flex-shrink-0 transition-transform duration-200 group-hover/icon:scale-150" />
                    <span className="text-orange-600 dark:text-orange-300 font-medium truncate">
                      {metrics.totalBreaks || '0:00'}
                    </span>
                  </div>

                  {/* Заработок */}
                  <div className="flex items-center gap-1 text-xs group/icon cursor-default">
                    <DollarSign className="w-3 h-3 text-green-500 dark:text-green-400 flex-shrink-0 transition-transform duration-200 group-hover/icon:scale-150" />
                    <span className="text-green-600 dark:text-green-300 font-medium truncate">
                      {formatMoney(metrics.totalEarned)}₽
                    </span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Легенда */}
      <div className="flex flex-wrap items-center justify-center gap-4 mt-6 py-4 border-t border-gray-200 dark:border-gray-700/50">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <div className="w-4 h-4 rounded bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-300 dark:border-emerald-600/60" />
          <span>Рабочий день</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <div className="w-4 h-4 rounded bg-gray-200 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700/30" />
          <span>Выходной</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <div className="w-4 h-4 rounded border-2 border-emerald-500/70" />
          <span>Сегодня</span>
        </div>
      </div>
    </div>
  )
}
