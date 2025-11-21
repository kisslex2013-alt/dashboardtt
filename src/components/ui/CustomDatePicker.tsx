import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Calendar, ChevronLeft, ChevronRight, X } from '../../utils/icons'
import { useIsMobile } from '../../hooks/useIsMobile'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
} from 'date-fns'
import type { CustomDatePickerProps } from '../../types'

const MONTH_NAMES = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
]
const WEEKDAY_NAMES = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

/**
 * Кастомный календарь в стиле проекта
 */
export function CustomDatePicker({
  value,
  onChange,
  onClose,
  placeholder = 'дд/мм/гггг',
  inputRef,
}: CustomDatePickerProps) {
  const isMobile = useIsMobile()
  const [selectedDate, setSelectedDate] = useState(value ? new Date(value) : null)
  const [currentMonth, setCurrentMonth] = useState(value ? new Date(value) : new Date())
  const [isOpen, setIsOpen] = useState(true)
  // Три состояния для контроля анимаций (Three-State Animation Control)
  const [shouldMount, setShouldMount] = useState(true)
  const [isAnimating, setIsAnimating] = useState(true)
  const [isExiting, setIsExiting] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const calendarRef = useRef(null)

  // Логика открытия
  useEffect(() => {
    if (isOpen) {
      setShouldMount(true)
      setIsExiting(false)
      // Для portal элементов используем один RAF - двойной вызывает задваивание
      const rafId = requestAnimationFrame(() => {
        setIsAnimating(true)
      })
      return () => cancelAnimationFrame(rafId)
    }
  }, [isOpen])

  // Логика закрытия
  useEffect(() => {
    if (!isOpen && shouldMount && !isExiting) {
      setIsAnimating(false)
      // RAF для синхронизации перед началом exit анимации
      const rafId = requestAnimationFrame(() => {
        setIsExiting(true)
      })
      return () => cancelAnimationFrame(rafId)
    }
  }, [isOpen, shouldMount, isExiting])

  // Слушатель окончания анимации исчезновения
  useEffect(() => {
    if (isExiting && calendarRef.current) {
      const handleAnimationEnd = e => {
        // Проверяем, что это именно наша exit анимация
        if (
          e.animationName === 'slideDownOut' ||
          e.animationName === 'slideUpOut' ||
          e.animationName.includes('slideOut')
        ) {
          setIsExiting(false)
          setShouldMount(false)
          onClose && onClose()
        }
      }

      // Fallback на случай, если событие не сработает
      const fallbackTimer = setTimeout(() => {
        setIsExiting(false)
        setShouldMount(false)
        onClose && onClose()
      }, 300) // Немного больше длительности анимации (200ms)

      calendarRef.current.addEventListener('animationend', handleAnimationEnd)

      return () => {
        clearTimeout(fallbackTimer)
        calendarRef.current?.removeEventListener('animationend', handleAnimationEnd)
      }
    }
  }, [isExiting, onClose])

  // Вычисление позиции календаря относительно input поля
  useEffect(() => {
    if (shouldMount && inputRef?.current) {
      const updatePosition = () => {
        const rect = inputRef.current.getBoundingClientRect()
        // Примерная высота календаря ~350px, ширина ~320px
        const calendarHeight = 350
        const calendarWidth = 320
        const offset = 8 // 8px отступ
        const viewportHeight = window.innerHeight
        const viewportWidth = window.innerWidth

        // Используем getBoundingClientRect напрямую без scrollY для правильного позиционирования в порталах
        let top = rect.bottom + offset
        let left = rect.left

        // Проверяем, помещается ли календарь снизу
        const spaceBelow = viewportHeight - rect.bottom
        const spaceAbove = rect.top

        // Если снизу не хватает места, открываем вверх
        if (spaceBelow < calendarHeight + offset && spaceAbove > calendarHeight + offset) {
          top = rect.top - calendarHeight - offset
        }

        // Корректируем по вертикали (если календарь выходит за экран)
        if (top + calendarHeight > viewportHeight) {
          top = Math.max(offset, viewportHeight - calendarHeight - offset)
        }
        if (top < 0) {
          top = offset
        }

        // Корректируем по горизонтали, чтобы не выходило за экран
        if (left + calendarWidth > viewportWidth) {
          left = Math.max(offset, viewportWidth - calendarWidth - offset)
        }
        if (left < 0) {
          left = offset
        }

        // Для порталов используем фиксированное позиционирование без scrollY/scrollX
        setPosition({
          top,
          left,
        })
      }

      updatePosition()
      // Используем requestAnimationFrame для более точного позиционирования
      const rafId = requestAnimationFrame(updatePosition)
      window.addEventListener('scroll', updatePosition, true)
      window.addEventListener('resize', updatePosition)

      return () => {
        cancelAnimationFrame(rafId)
        window.removeEventListener('scroll', updatePosition, true)
        window.removeEventListener('resize', updatePosition)
      }
    }
  }, [isOpen, inputRef])

  useEffect(() => {
    const handleClickOutside = event => {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target) &&
        inputRef?.current &&
        !inputRef.current.contains(event.target)
      ) {
        handleClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [inputRef])

  const handleClose = () => {
    setIsOpen(false)
    setTimeout(() => onClose?.(), 300)
  }

  const handleDateSelect = date => {
    setSelectedDate(date)
    onChange?.(format(date, 'yyyy-MM-dd'))
    handleClose()
  }

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Добавляем дни предыдущего месяца для заполнения первой недели
  const firstDayOfWeek = monthStart.getDay() === 0 ? 6 : monthStart.getDay() - 1 // Понедельник = 0
  const prevMonthDays = []
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(monthStart)
    date.setDate(date.getDate() - i - 1)
    prevMonthDays.push(date)
  }

  const allDays = [...prevMonthDays, ...daysInMonth]

  // Добавляем дни следующего месяца для заполнения до 42 дней (6 недель)
  const remainingDays = 42 - allDays.length
  const nextMonthDays = []
  for (let i = 1; i <= remainingDays; i++) {
    const date = new Date(monthEnd)
    date.setDate(date.getDate() + i)
    nextMonthDays.push(date)
  }
  allDays.push(...nextMonthDays)

  if (!shouldMount) return null

  const calendarContent = (
    <div
      ref={calendarRef}
      data-calendar-picker="true"
      onClick={(e) => {
        e.stopPropagation()
      }}
      onMouseDown={(e) => {
        e.stopPropagation()
      }}
      className={`fixed glass-effect rounded-xl border border-gray-300 dark:border-gray-600 shadow-xl z-[9999999] p-4 min-w-[320px] ${
        !isAnimating && !isExiting ? 'opacity-0 translate-y-4' : ''
      } ${isAnimating ? 'animate-slide-up' : ''} ${isExiting ? 'animate-slide-out' : ''}`}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      {/* Заголовок календаря */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-lg">
            {MONTH_NAMES[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h3>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            handleClose()
          }}
          className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors touch-manipulation"
          style={{ minWidth: isMobile ? '44px' : 'auto', minHeight: isMobile ? '44px' : 'auto' }}
          aria-label="Закрыть"
        >
          <X className={isMobile ? 'w-5 h-5' : 'w-4 h-4'} />
        </button>
      </div>

      {/* Навигация по месяцам */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            handlePrevMonth()
          }}
          className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors touch-manipulation"
          style={{ minWidth: isMobile ? '44px' : 'auto', minHeight: isMobile ? '44px' : 'auto' }}
          aria-label="Предыдущий месяц"
        >
          <ChevronLeft className={isMobile ? 'w-6 h-6' : 'w-5 h-5'} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            const today = new Date()
            setCurrentMonth(today)
            handleDateSelect(today)
          }}
          className={`glass-button px-3 py-1.5 rounded-lg touch-manipulation ${isMobile ? 'text-base' : 'text-sm'}`}
          style={{ minHeight: isMobile ? '44px' : 'auto' }}
        >
          Сегодня
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            handleNextMonth()
          }}
          className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors touch-manipulation"
          style={{ minWidth: isMobile ? '44px' : 'auto', minHeight: isMobile ? '44px' : 'auto' }}
          aria-label="Следующий месяц"
        >
          <ChevronRight className={isMobile ? 'w-6 h-6' : 'w-5 h-5'} />
        </button>
      </div>

      {/* Дни недели */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAY_NAMES.map(day => (
          <div
            key={day}
            className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Календарная сетка */}
      <div className="grid grid-cols-7 gap-1">
        {allDays.map((date, index) => {
          const isCurrentMonth = isSameMonth(date, currentMonth)
          const isSelected = selectedDate && isSameDay(date, selectedDate)
          const isCurrentDay = isToday(date)

          return (
            <button
              key={format(date, 'yyyy-MM-dd')}
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                if (isCurrentMonth) {
                  handleDateSelect(date)
                }
              }}
              disabled={!isCurrentMonth}
              className={`
                ${isMobile ? 'w-12 h-12' : 'w-10 h-10'} rounded-lg ${isMobile ? 'text-base' : 'text-sm'} transition-normal hover-lift-scale touch-manipulation
                ${
                  !isCurrentMonth
                    ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                    : 'hover:bg-blue-100 dark:hover:bg-blue-900/30'
                }
                ${
                  isSelected
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : isCurrentDay && isCurrentMonth
                      ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 font-semibold'
                      : 'text-gray-700 dark:text-gray-300'
                }
              `}
              style={{
                minWidth: isMobile ? '44px' : 'auto',
                minHeight: isMobile ? '44px' : 'auto',
              }}
            >
              {format(date, 'd')}
            </button>
          )
        })}
      </div>
    </div>
  )

  // Рендерим через портал, чтобы календарь был поверх всех элементов
  return createPortal(calendarContent, document.body)
}
