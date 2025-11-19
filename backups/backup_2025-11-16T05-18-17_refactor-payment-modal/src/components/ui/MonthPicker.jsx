import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { format, parseISO, startOfMonth } from 'date-fns'

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

/**
 * Кастомный выбор месяца/года в стиле проекта
 * ИСПРАВЛЕНО: Заменяет нативный input type="month"
 */
export function MonthPicker({ value, onChange, onClose, inputRef }) {
  const [selectedDate, setSelectedDate] = useState(value ? parseISO(value + '-01') : new Date())
  const [currentYear, setCurrentYear] = useState(
    value ? parseISO(value + '-01').getFullYear() : new Date().getFullYear()
  )
  const [isOpen, setIsOpen] = useState(true)
  // Три состояния для контроля анимаций (Three-State Animation Control)
  const [shouldMount, setShouldMount] = useState(true)
  const [isAnimating, setIsAnimating] = useState(true)
  const [isExiting, setIsExiting] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const pickerRef = useRef(null)

  // Логика открытия
  useEffect(() => {
    if (isOpen) {
      setShouldMount(true)
      setIsExiting(false)
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
      const rafId = requestAnimationFrame(() => {
        setIsExiting(true)
      })
      return () => cancelAnimationFrame(rafId)
    }
  }, [isOpen, shouldMount, isExiting])

  // Слушатель окончания анимации исчезновения
  useEffect(() => {
    if (isExiting && pickerRef.current) {
      const handleAnimationEnd = e => {
        if (
          e.target === pickerRef.current &&
          (e.animationName === 'slideDownOut' ||
            e.animationName === 'slideUpOut' ||
            e.animationName.includes('slideOut'))
        ) {
          setIsExiting(false)
          setShouldMount(false)
          onClose && onClose()
        }
      }

      const fallbackTimer = setTimeout(() => {
        setIsExiting(false)
        setShouldMount(false)
        onClose && onClose()
      }, 300)

      pickerRef.current.addEventListener('animationend', handleAnimationEnd)

      return () => {
        clearTimeout(fallbackTimer)
        pickerRef.current?.removeEventListener('animationend', handleAnimationEnd)
      }
    }
  }, [isExiting, onClose])

  // Вычисление позиции относительно input поля
  useEffect(() => {
    if (shouldMount && inputRef?.current) {
      const updatePosition = () => {
        const rect = inputRef.current.getBoundingClientRect()
        const pickerHeight = 350
        const pickerWidth = 280
        const offset = 8
        const viewportHeight = window.innerHeight
        const viewportWidth = window.innerWidth

        let top = rect.bottom + offset
        let left = rect.left

        const spaceBelow = viewportHeight - rect.bottom
        const spaceAbove = rect.top

        if (spaceBelow < pickerHeight && spaceAbove > spaceBelow) {
          top = rect.top - pickerHeight - offset
        }

        if (left + pickerWidth > viewportWidth) {
          left = viewportWidth - pickerWidth - offset
        }

        if (left < 0) {
          left = offset
        }

        setPosition({ top, left })
      }

      updatePosition()
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
        pickerRef.current &&
        !pickerRef.current.contains(event.target) &&
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

  const handleMonthSelect = monthIndex => {
    const newDate = new Date(currentYear, monthIndex, 1)
    setSelectedDate(newDate)
    onChange?.(format(newDate, 'yyyy-MM'))
    handleClose()
  }

  const handlePrevYear = () => {
    setCurrentYear(currentYear - 1)
  }

  const handleNextYear = () => {
    setCurrentYear(currentYear + 1)
  }

  const handleToday = () => {
    const today = new Date()
    setCurrentYear(today.getFullYear())
    onChange?.(format(today, 'yyyy-MM'))
    handleClose()
  }

  if (!shouldMount) return null

  const pickerContent = (
    <div
      ref={pickerRef}
      className={`fixed glass-effect rounded-xl border border-gray-300 dark:border-gray-600 shadow-xl z-[999999] p-4 min-w-[280px] ${
        !isAnimating && !isExiting ? 'opacity-0 translate-y-4' : ''
      } ${isAnimating ? 'animate-slide-up' : ''} ${isExiting ? 'animate-slide-out' : ''}`}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-lg">{currentYear}</h3>
        </div>
        <button
          onClick={handleClose}
          className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label="Закрыть"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Навигация по годам */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={handlePrevYear}
          className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label="Предыдущий год"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button onClick={handleToday} className="glass-button px-3 py-1.5 text-sm rounded-lg">
          Сегодня
        </button>
        <button
          onClick={handleNextYear}
          className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label="Следующий год"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Сетка месяцев */}
      <div className="grid grid-cols-3 gap-2">
        {MONTH_NAMES.map((month, index) => {
          const isSelected =
            selectedDate &&
            selectedDate.getFullYear() === currentYear &&
            selectedDate.getMonth() === index
          const isCurrentMonth =
            new Date().getFullYear() === currentYear && new Date().getMonth() === index

          return (
            <button
              key={`${currentYear}-${index}-${month}`}
              onClick={() => handleMonthSelect(index)}
              className={`
                px-4 py-2 rounded-lg text-sm transition-normal hover-lift-scale click-shrink
                ${
                  isSelected
                    ? 'bg-blue-500 text-white hover:bg-blue-600 font-semibold'
                    : isCurrentMonth
                      ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 font-semibold'
                      : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }
              `}
            >
              {month.slice(0, 3)}
            </button>
          )
        })}
      </div>
    </div>
  )

  return createPortal(pickerContent, document.body)
}
