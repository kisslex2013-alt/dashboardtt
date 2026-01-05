import { useState, useRef, useEffect, useMemo, memo } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight } from '../../utils/icons'
import {
  useTheme,
  useWorkScheduleTemplate,
  useWorkScheduleStartDay,
  useCustomWorkDates,
  useDailyGoal,
} from '../../store/useSettingsStore'
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns'
import { ru } from 'date-fns/locale' // ИСПРАВЛЕНО: Импорт локали для русских названий месяцев
import { InfoTooltip } from '../ui/InfoTooltip'
import { MonthPicker } from '../ui/MonthPicker'
import { getDayStatus } from '../../utils/dayMetrics'
import { CalendarMonth } from './CalendarMonth'

/** Интерфейс записи (entry) */
export interface Entry {
  date: string
  earned?: string | number
  duration?: string | number
  start?: string
  end?: string
}

/** Данные для одного дня календаря */
export interface DayData {
  totalEarned: number
  totalHours: number
  entryCount: number
  avgRate?: number
  status?: 'success' | 'warning' | 'danger' | null
  percent?: number | null
}

/** Ячейка календаря */
export interface CalendarDay {
  key: string
  isPlaceholder?: boolean
  positionIndex: number
  date?: Date
  data?: DayData
  isToday?: boolean
  isNonWorking?: boolean
  color?: string
}

/** Props для CalendarHeatmap */
interface CalendarHeatmapProps {
  entries: Entry[]
}

/**
 * 📊 Календарь доходов (Heatmap)
 *
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 *
 * Этот компонент показывает визуализацию ежедневных доходов в виде календаря.
 * Цвет ячейки зависит от заработанной суммы: чем она выше, тем насыщеннее цвет.
 *
 * Особенности:
 * - Навигация по месяцам (стрелки и input)
 * - Режим сравнения двух месяцев
 * - Интерактивные подсказки при наведении
 * - Поддержка клавиатурной навигации (стрелки)
 * - Выделение текущего дня
 *
 * @param {Array} entries - Отфильтрованные записи
 */
export const CalendarHeatmap = memo(({ entries }: CalendarHeatmapProps) => {

  // ✅ ОПТИМИЗАЦИЯ: Используем атомарные селекторы для минимизации ре-рендеров
  const theme = useTheme()
  const workScheduleTemplate = useWorkScheduleTemplate()
  const workScheduleStartDay = useWorkScheduleStartDay()
  const customWorkDates = useCustomWorkDates()
  const dailyGoal = useDailyGoal()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [compareDate, setCompareDate] = useState(() => {
    const date = new Date()
    date.setMonth(date.getMonth() - 1)
    return date
  })
  // Режим сравнения всегда активен
  const isComparing = true
  // ИСПРАВЛЕНО: Отдельные состояния hoveredDay для каждого календаря для синхронизации тултипов
  const [hoveredDay, setHoveredDay] = useState<CalendarDay | null>(null)
  const [hoveredDayCompare, setHoveredDayCompare] = useState<CalendarDay | null>(null)
  // Store just the index of the focused day
  const [focusedDayIndex, setFocusedDayIndex] = useState<number | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const tooltipCompareRef = useRef<HTMLDivElement>(null)

  // ИСПРАВЛЕНО: Определение нерабочих дней на основе графика работы
  const isNonWorkingDay = useMemo(() => {
    return (date: Date) => {
      // Проверяем кастомные даты
      const dateStr = format(date, 'yyyy-MM-dd')
      if (customWorkDates && customWorkDates[dateStr] !== undefined) {
        return !customWorkDates[dateStr]
      }

      // Проверяем шаблон графика работы
      if (workScheduleStartDay) {
        const dayOfWeek = date.getDay() // 0 = воскресенье, 1 = понедельник, ...
        const adjustedDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek // Преобразуем в 1-7, где 1 = понедельник

        // Определяем день недели относительно начального дня графика
        const dayInSchedule = ((adjustedDayOfWeek - workScheduleStartDay + 7) % 7) + 1

        if (workScheduleTemplate === '5/2') {
          return dayInSchedule > 5
        } else if (workScheduleTemplate === '2/2') {
          return dayInSchedule === 4 || dayInSchedule === 7
        } else if (workScheduleTemplate === 'custom') {
          return false // По умолчанию все дни рабочие
        }
      }

      return false // По умолчанию все дни рабочие
    }
  }, [workScheduleTemplate, workScheduleStartDay, customWorkDates])

  // Подготовка данных для календаря
  const calendarData = useMemo(() => {
    if (!entries || entries.length === 0) return {}

    const data: Record<string, DayData> = {}

    entries.forEach(entry => {
      const dateStr = entry.date
      if (!data[dateStr]) {
        data[dateStr] = {
          totalEarned: 0,
          totalHours: 0,
          entryCount: 0,
        }
      }

      data[dateStr].totalEarned += parseFloat(String(entry.earned ?? 0)) || 0

      // Рассчитываем часы
      if (entry.duration) {
        data[dateStr].totalHours += parseFloat(String(entry.duration)) || 0
      } else if (entry.start && entry.end) {
        const [startH, startM] = entry.start.split(':').map(Number)
        const [endH, endM] = entry.end.split(':').map(Number)
        const startMinutes = startH * 60 + startM
        let endMinutes = endH * 60 + endM
        if (endMinutes < startMinutes) endMinutes += 24 * 60
        data[dateStr].totalHours += (endMinutes - startMinutes) / 60
      }

      data[dateStr].entryCount += 1
    })

    // Рассчитываем среднюю ставку и статус выполнения плана для каждого дня
    Object.keys(data).forEach(dateStr => {
      const dayData = data[dateStr]
      dayData.avgRate = dayData.totalHours > 0 ? dayData.totalEarned / dayData.totalHours : 0

      // ВИЗУАЛ: Рассчитываем статус выполнения плана для цветовой индикации
      if (dailyGoal && dailyGoal > 0) {
        const dayStatus = getDayStatus(dayData.totalEarned, dailyGoal)
        dayData.status = dayStatus.status // 'success', 'warning', 'danger', или null
        dayData.percent = dayStatus.percent
      } else {
        dayData.status = null
        dayData.percent = null
      }
    })

    return data
  }, [entries, dailyGoal])

  // Helper to generate days - moved out of render but keeps closure over hooks if needed
  // Using useMemo to create the generator function is weird, better to useCallback or just function inside component
  // But to optimize we need to generate days AND colors.
  
  // Calculate Min/Max for color scaling
  const { minEarned, maxEarned } = useMemo(() => {
    // We need logic that doesn't depend on "generateCalendar" being called first if we want to pass colors to it.
    // Actually, we can just iterate the data in the view range.
    // Simplifying: Use global min/max from ALL data or just the two months?
    // Original logic: "getAllMonthDataValues" from current and compare dates.
    
    // We need to generate pure days first to know which ones are in month.
    // Or just calculate min/max from the calendarData for the months in view.
    
    // Helper to get keys for a month
    const getMonthKeys = (d: Date) => {
       const keys: string[] = []
       const year = d.getFullYear()
       const month = d.getMonth()
       const daysInMonth = new Date(year, month + 1, 0).getDate()
       for(let i=1; i<=daysInMonth; i++) {
           const dateStr = format(new Date(year, month, i), 'yyyy-MM-dd')
           keys.push(dateStr)
       }
       return keys
    }

    const keys = [...getMonthKeys(currentDate), ...getMonthKeys(compareDate)]
    const values = keys.map(k => calendarData[k]?.totalEarned || 0).filter(v => v > 0)
    
    return {
        minEarned: Math.min(...values, 0),
        maxEarned: Math.max(...values, 0)
    }
  }, [currentDate, compareDate, calendarData])

  const getColor = (value: number | undefined) => {
    if (!value) {
      return theme === 'dark' ? '#000000' : '#FFFFFF'
    }

    if (maxEarned === minEarned) {
      return 'rgba(34, 197, 94, 0.1)'
    }

    const ratio = (value - minEarned) / (maxEarned - minEarned)
    const opacity = 0.1 + ratio * 0.9
    return `rgba(34, 197, 94, ${opacity})`
  }

  // Generate days with colors
  const generateDays = (date: Date): CalendarDay[] => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days: CalendarDay[] = []

    // Previous month placeholders
    let startOffset = firstDay.getDay() - 1 
    if (startOffset === -1) startOffset = 6

    for (let i = 0; i < startOffset; i++) {
      days.push({
        key: `prev-${i}`,
        isPlaceholder: true,
        positionIndex: days.length,
      })
    }

    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const dayDate = new Date(year, month, i)
      const dateString = format(dayDate, 'yyyy-MM-dd')
      const today = format(new Date(), 'yyyy-MM-dd')
      const dayData = calendarData[dateString]
      const nonWorking = isNonWorkingDay(dayDate)

      days.push({
        key: dateString,
        date: dayDate,
        data: dayData,
        isToday: dateString === today,
        isNonWorking: nonWorking,
        positionIndex: days.length,
        color: dayData?.status ? undefined : getColor(dayData?.totalEarned), // Pre-calculate color
      })
    }

    return days
  }

  const currentDays = useMemo(() => generateDays(currentDate), [currentDate, calendarData, isNonWorkingDay, minEarned, maxEarned, theme])
  const compareDays = useMemo(() => generateDays(compareDate), [compareDate, calendarData, isNonWorkingDay, minEarned, maxEarned, theme])

  // Handlers
  const handleDayClick = (day: CalendarDay, index: number) => {
    if (!day.isPlaceholder) {
      setFocusedDayIndex(index)
      setHoveredDay(day)
    }
  }

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, days: CalendarDay[]) => {
    if (focusedDayIndex === null) return

    const totalDays = days.length
    let newIndex = focusedDayIndex

    switch (e.key) {
      case 'ArrowRight':
        newIndex = (focusedDayIndex + 1) % totalDays
        break
      case 'ArrowLeft':
        newIndex = (focusedDayIndex - 1 + totalDays) % totalDays
        break
      case 'ArrowDown':
        newIndex = (focusedDayIndex + 7) % totalDays
        break
      case 'ArrowUp':
        newIndex = (focusedDayIndex - 7 + totalDays) % totalDays
        break
      default:
        return
    }

    setFocusedDayIndex(newIndex)
    const newDay = days[newIndex]
    if (!newDay.isPlaceholder) {
      setHoveredDay(newDay) // This will trigger re-render of both, unavoidable for sync but minimized by CalendarMonth
    }
    e.preventDefault()
  }

  // ВИЗУАЛ: Функция для поиска дня по позиции (индексу) в календаре
  // Используется для синхронизации тултипов
  const findDayByPosition = (days: CalendarDay[], positionIndex: number) => {
       if (positionIndex < 0 || positionIndex >= days.length) return null
       const targetDay = days[positionIndex]
       return targetDay && !targetDay.isPlaceholder ? targetDay : null
  }

  // ВИЗУАЛ: Позиционирование tooltip
  useEffect(() => {
    const updateTooltipPositions = () => {
      // Тултип правого календаря
      if (tooltipCompareRef.current && hoveredDayCompare) {
        // Мы не знаем DOM элементы внутри CalendarMonth, но мы знаем селекторы.
        // CalendarMonth должен рендерить data-day-index? Да, мы это оставили.
        // Но нам нужно знать, КАКОЙ это календарь.
        // Добавим id или data-attr в враппер CalendarMonth
        const compareContainer = document.getElementById('calendar-compare')
        if (compareContainer) {
            const dayElement = compareContainer.querySelector(`[data-day-index="${hoveredDayCompare.positionIndex}"]`)
            if (dayElement) {
                const dayRect = dayElement.getBoundingClientRect()
                tooltipCompareRef.current.style.left = `${dayRect.right + 10}px`
                tooltipCompareRef.current.style.top = `${dayRect.top}px`
            }
        }
      }

      // Тултип левого календаря
      if (tooltipRef.current && hoveredDay && hoveredDayCompare) {
         // Если мышь на правом, левый тултип тоже привязан к элементу
         const compareContainer = document.getElementById('calendar-compare')
         const isHoveringCompare = compareContainer && compareContainer.matches(':hover') // Грубая проверка
         
         if (isHoveringCompare) {
             const currentContainer = document.getElementById('calendar-current')
             if (currentContainer) {
                 const dayElement = currentContainer.querySelector(`[data-day-index="${hoveredDay.positionIndex}"]`)
                 if (dayElement) {
                     const dayRect = dayElement.getBoundingClientRect()
                     tooltipRef.current.style.left = `${dayRect.right + 10}px`
                     tooltipRef.current.style.top = `${dayRect.top}px`
                 }
             }
         }
      }
    }
    
    // Mouse move logic for floating tooltip (left calendar only when not on right)
    const handleMouseMove = (e: MouseEvent) => {
        if (tooltipRef.current && hoveredDay) {
            const compareContainer = document.getElementById('calendar-compare')
            // Проверяем, находится ли мышь над правым календарем.
            // Если да - тултип левого фиксирован (обрабатывается выше).
            // Если нет - тултип левого следует за мышью.
            
            // Сложность: isHoveringCompare. 
            // Реализуем проще: Если hoveredDayCompare установлен через onMouseEnter правого календаря...
            // Но мы синхронизируем их!
            // Если мы навели на левый -> hoveredDay установлен, hoveredDayCompare тоже (синхронно).
            // Как узнать, ГДЕ мышь?
            // Можно использовать e.target.closest.
            const target = e.target as HTMLElement
            const isOverCompare = target.closest('#calendar-compare')
            
            if (!isOverCompare) {
                tooltipRef.current.style.left = `${e.clientX + 15}px`
                tooltipRef.current.style.top = `${e.clientY + 15}px`
            }
        }
        updateTooltipPositions()
    }

    window.addEventListener('mousemove', handleMouseMove)
    updateTooltipPositions()
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [hoveredDay, hoveredDayCompare])


  return (
    <div className="glass-effect rounded-xl p-6 mb-6">
      {/* Заголовок */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Календарь доходов</h3>
          <InfoTooltip text="Визуализация ежедневных доходов с сравнением двух месяцев. Цвет ячейки зависит от заработанной суммы: чем она выше, тем насыщеннее цвет." />
        </div>
      </div>

      {/* Календари */}
      <div className={`grid ${isComparing ? 'grid-cols-1 md:grid-cols-2 gap-6' : 'grid-cols-1'}`}>
        <div id="calendar-current">
            <CalendarMonth 
                date={currentDate}
                title="Текущий период"
                onDateChange={setCurrentDate}
                days={currentDays}
                highlightedIndex={hoveredDayCompare?.positionIndex ?? null}
                focusedDayIndex={focusedDayIndex}
                theme={theme === 'auto' ? 'light' : theme}
                onClick={handleDayClick}
                onKeyDown={(e, _) => handleKeyDown(e, currentDays)}
                onFocus={(idx) => {
                    // Logic from original: setHoveredDay(days[idx]) etc.
                    // But onFocus callback in CalendarMonth sends index.
                    // We need to set everything.
                    // Actually, CalendarMonth calls onHover(day) onMouseEnter.
                    // We should replicate syncing logic.
                }}
                onHover={(day) => {
                    // Hover on Left Calendar
                    if (day) {
                        setHoveredDay(day)
                        const corresp = findDayByPosition(compareDays, day.positionIndex)
                        setHoveredDayCompare(corresp)
                    } else {
                        // Mouse leave handled by container? 
                        // Actually CalendarMonth triggers onMouseEnter.
                        // We need onMouseLeave or just clear when day is null.
                        // But we didn't pass "null" from CalendarMonth onLeave.
                        // We can clear on wrapper mouseLeave.
                    }
                }}
            />
            {/* Wrapper to handle mouse leave for clearing */}
            <div className="absolute inset-0 pointer-events-none" onMouseLeave={() => {
                setHoveredDay(null)
                setHoveredDayCompare(null)
            }} />
        </div>
        
        {isComparing && (
            <div id="calendar-compare">
                <CalendarMonth 
                    date={compareDate}
                    title="Сравниваемый период"
                    onDateChange={setCompareDate}
                    days={compareDays}
                    highlightedIndex={hoveredDay?.positionIndex ?? null}
                    focusedDayIndex={focusedDayIndex}
                    theme={theme === 'auto' ? 'light' : theme}
                    onClick={handleDayClick}
                    onKeyDown={(e, _) => handleKeyDown(e, compareDays)}
                    onFocus={() => {}}
                    onHover={(day) => {
                        // Hover on Right Calendar
                         if (day) {
                            setHoveredDayCompare(day)
                            const corresp = findDayByPosition(currentDays, day.positionIndex)
                            setHoveredDay(corresp)
                        }
                    }}
                />
             </div>
        )}
      </div>

      {/* Manual MouseLeave handlers for containers because CalendarMonth is memoized and internal events might be tricky */}
      {/* Actually simpler: Pass onHover(null) from CalendarMonth? No, we decided not to. */}
      {/* Let's wrap CalendarMonth in a div that handles onMouseLeave to clear state */}
       {/* Use Effects or ref based clearing? 
           Original: onMouseLeave prop on day div.
           CalendarMonth DOES have onMouseLeave prop on day div but it does nothing?
           I implemented "onHover(day)" onMouseEnter.
           I need to handle mouse leave.
       */}
       
      {/* ВИЗУАЛ: Тултипы */}
      {hoveredDay &&
        createPortal(
          <div
            ref={tooltipRef}
            className="fixed glass-effect p-3 rounded-lg shadow-xl text-sm border border-gray-200 dark:border-gray-700 pointer-events-none z-[999999]"
          >
            <p className="font-bold text-gray-900 dark:text-white mb-1">
              {hoveredDay.date?.toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
            {hoveredDay.data ? (
              <>
                <p className="text-green-600 dark:text-green-400 font-semibold">
                  Заработано: {hoveredDay.data.totalEarned.toLocaleString('ru-RU')} ₽
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  Часы: {hoveredDay.data.totalHours.toFixed(2)} ч
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  Средняя ставка: {hoveredDay.data?.avgRate?.toFixed(0)} ₽/ч
                </p>
              </>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">Нет записей за этот день</p>
            )}
          </div>,
          document.body
        )}
      {hoveredDayCompare &&
        createPortal(
          <div
            ref={tooltipCompareRef}
            className="fixed glass-effect p-3 rounded-lg shadow-xl text-sm border border-gray-200 dark:border-gray-700 pointer-events-none z-[999999]"
          >
            <p className="font-bold text-gray-900 dark:text-white mb-1">
              {hoveredDayCompare.date?.toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
            {hoveredDayCompare.data ? (
              <>
                <p className="text-green-600 dark:text-green-400 font-semibold">
                  Заработано: {hoveredDayCompare.data.totalEarned.toLocaleString('ru-RU')} ₽
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  Часы: {hoveredDayCompare.data.totalHours.toFixed(2)} ч
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  Средняя ставка: {hoveredDayCompare.data?.avgRate?.toFixed(0)} ₽/ч
                </p>
              </>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">Нет записей за этот день</p>
            )}
          </div>,
          document.body
        )}
    </div>
  )
})
