import { memo, useMemo, useRef, useState } from 'react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from '../../utils/icons'
import { MonthPicker } from '../ui/MonthPicker'
import { CalendarDay } from './CalendarHeatmap' // We will export interfaces from Heatmap or move to types
import { DayData } from './CalendarHeatmap' // same

// Move interfaces to a shared file or export them?
// For now, I'll assume they are exported from CalendarHeatmap or re-define if simple
// Better to move types to types/index.ts or keep in Heatmap and export.
// I will assume I can import them. If not, I'll redefine locally for this file creation and then fix imports.

interface CalendarMonthProps {
  date: Date
  title: string
  onDateChange: (date: Date) => void
  days: CalendarDay[]
  highlightedIndex: number | null
  focusedDayIndex: number | null
  onHover: (day: CalendarDay | null) => void
  onFocus: (index: number) => void
  onClick: (day: CalendarDay, index: number) => void
  onKeyDown: (e: React.KeyboardEvent, days: CalendarDay[]) => void
  theme: 'dark' | 'light'
}

export const CalendarMonth = memo<CalendarMonthProps>(({
  date,
  title,
  onDateChange,
  days,
  highlightedIndex,
  focusedDayIndex,
  onHover,
  onFocus,
  onClick,
  onKeyDown,
  theme
}) => {
  const [showMonthPicker, setShowMonthPicker] = useState(false)
  const monthInputRef = useRef<HTMLButtonElement>(null)
  const calendarRef = useRef<HTMLDivElement>(null)

  const handleMonthChange = (value: string) => {
    const [year, month] = value.split('-').map(Number)
    onDateChange(new Date(year, month - 1, 1))
    setShowMonthPicker(false)
  }

  const navigateMonth = (amount: number) => () => {
    const newDate = new Date(date)
    newDate.setMonth(date.getMonth() + amount)
    onDateChange(newDate)
  }

  const getColor = (data: DayData | undefined, monthDays: CalendarDay[]) => {
      // Logic copied from CalendarHeatmap.tsx - ideally passed as prop or util?
      // Passing "getColor" function as prop might be cleaner to keep logic central.
      // But for now let's reuse logic if simple.
      // Actually, logic depends on Min/Max of BOTH calendars.
      // So logic MUST be passed from parent or calculated based on props.
      // Let's assume parent passes a `getColor` function? 
      // Or parent passes the "color" string directly in `days`?
      // Changing `days` to include `color` property is cleanest.
      return undefined // Will use color from day object
  }

  return (
    <div className="flex flex-col">
      {/* Заголовок с навигацией */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={navigateMonth(-1)}
            className="p-1 rounded-full hover:bg-gray-500/10 transition-colors"
            aria-label="Предыдущий месяц"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            ref={monthInputRef}
            onClick={() => setShowMonthPicker(true)}
            className="glass-effect font-bold text-lg px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white transition-normal hover-lift-scale click-shrink"
          >
            {format(date, 'MMMM yyyy', { locale: ru })}
          </button>
          {showMonthPicker && (
            <MonthPicker
              value={format(date, 'yyyy-MM')}
              onChange={handleMonthChange}
              onClose={() => setShowMonthPicker(false)}
              inputRef={monthInputRef as React.RefObject<HTMLElement>}
            />
          )}
          <button
            onClick={navigateMonth(1)}
            className="p-1 rounded-full hover:bg-gray-500/10 transition-colors"
            aria-label="Следующий месяц"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <h4 className="font-bold text-lg text-gray-800 dark:text-white">{title}</h4>
      </div>

      {/* Дни недели */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 dark:text-gray-400 mb-2">
        {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
          <div key={day}>{day}</div>
        ))}
      </div>

      {/* Календарная сетка */}
      <div
        ref={calendarRef}
        className="grid grid-cols-7 gap-1 focus:outline-none"
        tabIndex={0}
        onKeyDown={e => onKeyDown(e, days)}
      >
        {days.map((day, index) => {
          const hasEntries = day.data && !day.isNonWorking
          const isEmpty = !day.data && !day.isNonWorking

          // Определяем класс цвета на основе выполнения плана
          let statusClass = ''
          if (hasEntries && day.data?.status) {
            switch (day.data.status) {
              case 'success': // ≥ 100%
                statusClass = 'calendar-day-success'
                break
              case 'warning': // 50-99%
                statusClass = 'calendar-day-warning'
                break
              case 'danger': // < 50%
                statusClass = 'calendar-day-danger'
                break
            }
          }

          const isHighlighted =
            highlightedIndex !== null &&
            !day.isPlaceholder &&
            highlightedIndex === day.positionIndex

          // Color logic: Parent should provide `color` in day object ideally
          // If not, we need `getColor` passed.
          // Let's assume day.color is present or handled by statusClass/style
          const bgColor = day.data
            ? day.data.status
                ? undefined
                : day.color // NEW: Expect parent to calculate and pass color
            : day.isNonWorking
                ? 'transparent'
                : undefined

          return (
            <div
              key={day.key}
              data-day-index={day.positionIndex}
              tabIndex={day.isPlaceholder ? -1 : 0}
              className={`
                relative aspect-square flex items-center justify-center rounded-md transition-all duration-200 text-sm
                ${day.isPlaceholder ? 'opacity-0' : 'focus:ring-2 focus:ring-blue-500 hover:ring-2 hover:ring-blue-500'}
                ${day.isToday ? 'font-bold ring-2 ring-blue-500 dark:ring-blue-400' : ''}
                ${focusedDayIndex === index && !day.isPlaceholder ? 'ring-4 ring-blue-500' : ''}
                ${isHighlighted ? 'ring-2 ring-yellow-400 dark:ring-yellow-500 shadow-lg shadow-yellow-500/50' : ''}
                ${day.isNonWorking && !day.data ? 'border-2 border-dashed' : ''}
                ${statusClass}
                ${isEmpty ? 'calendar-day-empty' : ''}
                text-white
              `}
              style={{
                backgroundColor: bgColor,
                borderColor:
                  day.isNonWorking && !day.data
                    ? theme === 'dark'
                      ? '#374151'
                      : '#D1D5DB'
                    : 'transparent',
              }}
              onMouseEnter={() => {
                 if (!day.isPlaceholder) onHover(day)
              }}
              onMouseLeave={() => {
                 // onHover(null) - don't clear here, parent handles 'onMouseLeave' from container usually
                 // or we can allow bubbling?
                 // Original logic: parent sets hoveredDay on Enter. 
                 // Parent handles clearing on div mouseLeave.
              }}
              onClick={() => onClick(day, index)}
              onFocus={() => {
                  if (!day.isPlaceholder) {
                      onFocus(index) // Just tell parent we focused index
                      onHover(day) // And treat as hover
                  }
              }}
            >
              {!day.isPlaceholder && <span>{day.date?.getDate()}</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
})
