import { useMemo, memo, useCallback, useState, useEffect } from 'react'
import { useDailyGoal } from '../../../store/useSettingsStore'
import { getDayMetrics } from '../../../utils/dayMetrics'
import { TimeEntry } from '../../../types'
import { ChevronLeft, ChevronRight, Clock, Coffee, DollarSign, TrendingUp, List } from '../../../utils/icons'
import { useCategory } from '../../../hooks/useCategory'

interface TimelineViewProps {
  entries: TimeEntry[]
  onEdit?: (entry: TimeEntry) => void
  selectionMode?: boolean
  selectedEntries?: Set<string>
  onToggleSelection?: (id: string) => void
}

// Тип сегмента времени
type SegmentType = 'before' | 'work' | 'break' | 'after'

interface TimeSegment {
  start: number
  end: number
  type: SegmentType
  entry?: TimeEntry
  breakDuration?: number
}

// Цвета сегментов для линии
const lineColors: Record<SegmentType, string> = {
  before: 'bg-slate-300 dark:bg-slate-600',
  work: 'bg-rose-500',
  break: 'bg-emerald-400',
  after: 'bg-slate-300 dark:bg-slate-600',
}

// Преобразование времени HH:MM в минуты
const timeToMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

// Преобразование минут в HH:MM
const minutesToTime = (minutes: number): string => {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

/**
 * 📋 Timeline с адаптивным масштабированием
 */
export const TimelineView = memo(
  ({
    entries,
    onEdit,
  }: TimelineViewProps) => {
    const dailyGoal = useDailyGoal()
    const { getCategoryNameById } = useCategory({ defaultName: 'Без категории' })

    // Группировка записей по датам
    const groupedEntries = useMemo(
      () =>
        entries.reduce((acc, entry) => {
          if (!acc[entry.date]) acc[entry.date] = []
          acc[entry.date].push(entry)
          return acc
        }, {} as Record<string, TimeEntry[]>),
      [entries]
    )

    // Сортировка дат
    const sortedDates = useMemo(() => {
      return Object.keys(groupedEntries).sort(
        (a, b) => new Date(b).getTime() - new Date(a).getTime()
      )
    }, [groupedEntries])

    // Текущий индекс даты
    const [currentDateIndex, setCurrentDateIndex] = useState(0)

    // Навигация по дням
    const goToPrevDay = useCallback(() => {
      setCurrentDateIndex(prev => Math.min(prev + 1, sortedDates.length - 1))
    }, [sortedDates.length])

    const goToNextDay = useCallback(() => {
      setCurrentDateIndex(prev => Math.max(prev - 1, 0))
    }, [])

    // Навигация по месяцам
    // sortedDates отсортирован по УБЫВАНИЮ: index 0 = самая новая дата
    // ↓ = к более старому месяцу (увеличиваем индекс)
    // ↑ = к более новому месяцу (уменьшаем индекс)
    
    const goToPrevMonth = useCallback(() => {
      if (!sortedDates[currentDateIndex]) return
      
      const currentDateObj = new Date(sortedDates[currentDateIndex])
      const currentMonth = currentDateObj.getMonth()
      const currentYear = currentDateObj.getFullYear()
      
      // Ищем первую запись в БОЛЕЕ СТАРОМ месяце (индекс больше текущего)
      for (let i = currentDateIndex + 1; i < sortedDates.length; i++) {
        const d = new Date(sortedDates[i])
        if (d.getMonth() !== currentMonth || d.getFullYear() !== currentYear) {
          setCurrentDateIndex(i)
          return
        }
      }
    }, [sortedDates, currentDateIndex])

    const goToNextMonth = useCallback(() => {
      if (!sortedDates[currentDateIndex]) return
      
      const currentDateObj = new Date(sortedDates[currentDateIndex])
      const currentMonth = currentDateObj.getMonth()
      const currentYear = currentDateObj.getFullYear()
      
      // Ищем первую запись в БОЛЕЕ НОВОМ месяце (индекс меньше текущего)
      for (let i = currentDateIndex - 1; i >= 0; i--) {
        const d = new Date(sortedDates[i])
        if (d.getMonth() !== currentMonth || d.getFullYear() !== currentYear) {
          setCurrentDateIndex(i)
          return
        }
      }
    }, [sortedDates, currentDateIndex])

    // Клавиатурная навигация
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'ArrowLeft') {
          e.preventDefault()
          goToPrevDay()
        } else if (e.key === 'ArrowRight') {
          e.preventDefault()
          goToNextDay()
        } else if (e.key === 'ArrowUp') {
          e.preventDefault()
          goToNextMonth()
        } else if (e.key === 'ArrowDown') {
          e.preventDefault()
          goToPrevMonth()
        }
      }

      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }, [goToPrevDay, goToNextDay, goToPrevMonth, goToNextMonth])

    // Текущая дата и записи
    const currentDate = sortedDates[currentDateIndex]
    const currentEntries = currentDate ? groupedEntries[currentDate] || [] : []

    // Сортировка записей по времени начала
    const sortedEntries = useMemo(() => {
      return [...currentEntries].sort((a, b) => {
        if (!a.start || !b.start) return 0
        return a.start.localeCompare(b.start)
      })
    }, [currentEntries])

    // Вычисление сегментов дня
    const segments = useMemo((): TimeSegment[] => {
      if (sortedEntries.length === 0) {
        return [{ start: 0, end: 1440, type: 'before' }]
      }

      const result: TimeSegment[] = []
      const firstEntry = sortedEntries[0]
      const firstStart = firstEntry.start ? timeToMinutes(firstEntry.start) : 0
      const lastEntry = sortedEntries[sortedEntries.length - 1]
      const lastEnd = lastEntry.end ? timeToMinutes(lastEntry.end) : 1440

      if (firstStart > 0) {
        result.push({ start: 0, end: firstStart, type: 'before' })
      }

      sortedEntries.forEach((entry, idx) => {
        const entryStart = entry.start ? timeToMinutes(entry.start) : 0
        const entryEnd = entry.end ? timeToMinutes(entry.end) : entryStart + 60

        result.push({ start: entryStart, end: entryEnd, type: 'work', entry })

        if (idx < sortedEntries.length - 1) {
          const nextEntry = sortedEntries[idx + 1]
          const nextStart = nextEntry.start ? timeToMinutes(nextEntry.start) : 0
          if (entryEnd < nextStart) {
            result.push({ start: entryEnd, end: nextStart, type: 'break', breakDuration: nextStart - entryEnd })
          }
        }
      })

      if (lastEnd < 1440) {
        result.push({ start: lastEnd, end: 1440, type: 'after' })
      }

      return result
    }, [sortedEntries])

    // Метрики дня
    const metrics = useMemo(() => getDayMetrics(currentEntries, dailyGoal), [currentEntries, dailyGoal])

    // Форматирование даты
    const formattedDate = useMemo(() => {
      if (!currentDate) return 'Нет данных'
      const dateObj = new Date(currentDate)
      const day = dateObj.getDate()
      const month = dateObj.toLocaleDateString('ru-RU', { month: 'long' })
      const year = dateObj.getFullYear()
      const weekday = dateObj.toLocaleDateString('ru-RU', { weekday: 'long' })
      return `${day} ${month} ${year}, ${weekday}`
    }, [currentDate])

    // Рабочий диапазон
    const workRange = useMemo(() => {
      const workSegs = segments.filter(s => s.type === 'work' || s.type === 'break')
      if (workSegs.length === 0) return { start: 480, end: 1080 }
      const start = Math.max(0, Math.min(...workSegs.map(s => s.start)) - 30)
      const end = Math.min(1440, Math.max(...workSegs.map(s => s.end)) + 30)
      return { start, end }
    }, [segments])

    // Сегменты рабочего времени
    const workTimeSegments = useMemo(() => {
      return segments.filter(s => s.start >= workRange.start && s.end <= workRange.end)
    }, [segments, workRange])

    // Адаптивные позиции
    const adaptivePositions = useMemo(() => {
      const BASE_CARD_WIDTH = 12
      
      const segmentWeights = workTimeSegments.map(seg => {
        const duration = seg.end - seg.start
        
        if (seg.type === 'work') {
          return Math.max(BASE_CARD_WIDTH, duration / 10)
        } else if (seg.type === 'break') {
          if (duration > 60) return 5
          if (duration > 30) return 6
          return 8
        } else {
          return 3
        }
      })

      const totalWeight = segmentWeights.reduce((a, b) => a + b, 0)
      const normalizedWidths = segmentWeights.map(w => (w / totalWeight) * 100)

      const positions: { left: number; width: number }[] = []
      let currentLeft = 0
      
      normalizedWidths.forEach(width => {
        positions.push({ left: currentLeft, width })
        currentLeft += width
      })

      return positions
    }, [workTimeSegments])

    // Карточки с позициями
    const cardData = useMemo(() => {
      const cards: {
        seg: TimeSegment
        left: number
        width: number
        isTop: boolean
        categoryName: string
      }[] = []

      let cardIndex = 0
      workTimeSegments.forEach((seg, idx) => {
        if (seg.type !== 'work' && seg.type !== 'break') return
        
        const pos = adaptivePositions[idx]
        const isTop = cardIndex % 2 === 0
        const categoryName = seg.entry 
          ? getCategoryNameById(seg.entry.category || seg.entry.categoryId, 'Работа')
          : 'Перерыв'

        cards.push({
          seg,
          left: pos.left,
          width: pos.width,
          isTop,
          categoryName,
        })
        cardIndex++
      })

      return cards
    }, [workTimeSegments, adaptivePositions, getCategoryNameById])

    if (!currentDate) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          Нет записей для отображения
        </div>
      )
    }

    const progressPercent = dailyGoal > 0 
      ? Math.min(Math.round((metrics.totalEarned / dailyGoal) * 100), 100) 
      : 0

    const LINE_Y = 140
    const CARD_TOP_Y = 20
    const CARD_BOTTOM_Y = 190
    const PADDING = 64 // px

    return (
      <div className="space-y-4">
        {/* Навигация */}
        <div className="flex items-center justify-between px-2">
          <button
            onClick={goToPrevDay}
            disabled={currentDateIndex >= sortedDates.length - 1}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 transition-all"
            title="← Предыдущий день (или стрелка влево)"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white capitalize">{formattedDate}</h2>
            <p className="text-[10px] text-gray-400">← → дни · ↑ ↓ месяцы</p>
          </div>
          <button
            onClick={goToNextDay}
            disabled={currentDateIndex <= 0}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 transition-all"
            title="Следующий день → (или стрелка вправо)"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* РАБОЧИЙ ДЕНЬ */}
        <div className="glass-effect rounded-xl p-4">
          {/* Заголовок */}
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              РАБОЧИЙ ДЕНЬ ({minutesToTime(workRange.start)} — {minutesToTime(workRange.end)})
            </h3>
            
            {/* Статистика */}
            <div className="flex items-center gap-4 text-xs">
              {/* Прогресс СНАЧАЛА */}
              {dailyGoal > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        progressPercent >= 100 ? 'bg-emerald-500' : 
                        progressPercent >= 50 ? 'bg-yellow-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <span className="text-gray-500">{progressPercent}%</span>
                </div>
              )}
              
              {/* Записи ПОСЛЕ прогресса с цветом */}
              <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                <List className="w-3.5 h-3.5" />
                {currentEntries.length}
              </span>
              
              <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                <Clock className="w-3.5 h-3.5" />
                {metrics.totalHours.toFixed(1)}ч
              </span>
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <Coffee className="w-3.5 h-3.5" />
                {metrics.totalBreaks || '0:00'}
              </span>
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <DollarSign className="w-3.5 h-3.5" />
                {metrics.totalEarned}₽
              </span>
              <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                <TrendingUp className="w-3.5 h-3.5" />
                {Math.round(metrics.averageRate || 0)}₽/ч
              </span>
            </div>
          </div>

          {/* Шкала времени */}
          <div className="relative" style={{ height: '280px', paddingLeft: `${PADDING}px`, paddingRight: `${PADDING}px` }}>
            
            {/* Цветная линия */}
            <div className="absolute h-2 rounded-full overflow-hidden flex" style={{ top: `${LINE_Y}px`, left: `${PADDING}px`, right: `${PADDING}px` }}>
              {workTimeSegments.map((seg, idx) => {
                const pos = adaptivePositions[idx]
                const color = lineColors[seg.type]
                
                return (
                  <div
                    key={`line-${idx}`}
                    className={`h-full ${color}`}
                    style={{ width: `${pos.width}%` }}
                  />
                )
              })}
            </div>

            {/* Карточки — используем простые проценты */}
            {cardData.map(({ seg, left, width, isTop, categoryName }, idx) => {
              const centerPercent = left + width / 2
              const cardY = isTop ? CARD_TOP_Y : CARD_BOTTOM_Y

              const threadTop = isTop ? cardY + 60 : LINE_Y + 10
              const threadHeight = isTop ? LINE_Y - cardY - 60 : cardY - LINE_Y - 10

              return (
                <div key={`card-${idx}`} style={{ position: 'absolute', left: `${PADDING}px`, right: `${PADDING}px`, top: 0, bottom: 0, pointerEvents: 'none' }}>
                  {/* Нить */}
                  <div 
                    className={`absolute w-px ${seg.type === 'work' ? 'bg-rose-400' : 'bg-emerald-400'}`}
                    style={{ 
                      left: `${centerPercent}%`,
                      top: `${threadTop}px`,
                      height: `${Math.max(threadHeight, 5)}px`,
                      pointerEvents: 'none'
                    }}
                  />
                  
                  {/* Точка на линии */}
                  <div 
                    className={`absolute w-3 h-3 rounded-full ${seg.type === 'work' ? 'bg-rose-500' : 'bg-emerald-400'} border-2 border-white dark:border-gray-900 shadow-sm z-10`}
                    style={{ 
                      left: `${centerPercent}%`,
                      top: `${LINE_Y}px`,
                      transform: 'translate(-50%, -25%)',
                      pointerEvents: 'none'
                    }}
                  />

                  {/* Карточка */}
                  <div 
                    className={`absolute ${seg.type === 'work' 
                      ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-rose-400' 
                      : 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700'
                    } border rounded-lg px-2 py-1.5 shadow-sm cursor-pointer hover:shadow-md transition-all z-20`}
                    style={{ 
                      left: `${centerPercent}%`,
                      top: `${cardY}px`,
                      transform: 'translateX(-50%)',
                      maxWidth: '140px',
                      pointerEvents: 'auto'
                    }}
                    onClick={() => seg.entry && onEdit?.(seg.entry)}
                  >
                    <div className="text-[9px] text-gray-400 text-center whitespace-nowrap">
                      {minutesToTime(seg.start)} – {minutesToTime(seg.end)}
                    </div>
                    <div className={`text-[11px] font-medium text-center ${seg.type === 'work' ? 'text-gray-900 dark:text-white' : 'text-emerald-700 dark:text-emerald-300'}`}>
                      {categoryName}
                    </div>
                    {seg.type === 'work' && seg.entry?.earned && (
                      <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 text-center">
                        {seg.entry.earned}₽
                      </div>
                    )}
                    {seg.type === 'break' && seg.breakDuration && (
                      <div className="text-[10px] font-medium text-emerald-600 text-center">
                        {seg.breakDuration} мин
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Метки времени под линией */}
            <div className="absolute flex justify-between text-[10px] text-gray-400" style={{ top: `${LINE_Y + 16}px`, left: `${PADDING}px`, right: `${PADDING}px` }}>
              <span>{minutesToTime(workRange.start)}</span>
              <span className="text-gray-300 dark:text-gray-600">масштаб адаптивный</span>
              <span>{minutesToTime(workRange.end)}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }
)
