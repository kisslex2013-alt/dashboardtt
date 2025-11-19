import { useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Repeat, CalendarX } from '../../../utils/icons'
import { monthNames, weekDays } from './utils/calendarHelpers'

/**
 * Компонент календаря для выбора дат выплат и периодов
 */
export function PaymentCalendar({
  currentYear,
  currentMonth,
  daysInMonth,
  firstDay,
  changeMonth,
  paymentDates,
  isPaymentDay,
  isInPeriod,
  selectionState,
  onDayClick,
  onMouseDown,
  onMouseEnter,
  onMouseUp,
}) {
  const calendarContainerRef = useRef(null)

  // Анимация календаря при смене месяца
  useEffect(() => {
    if (calendarContainerRef.current) {
      calendarContainerRef.current.classList.add('calendar-animate')
      const timer = setTimeout(() => {
        if (calendarContainerRef.current) {
          calendarContainerRef.current.classList.remove('calendar-animate')
        }
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [currentMonth, currentYear])

  const { selectingMode, selectingPaymentId, periodSelectionStart, selectionDays, hoveredDay } = selectionState

  // Рендер дней календаря
  const renderDays = () => {
    const days = []

    // Пустые дни в начале
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square"></div>)
    }

    // Дни месяца
    for (let day = 1; day <= daysInMonth; day++) {
      const payment = isPaymentDay(day)
      const inPeriod = isInPeriod(day)
      const isSelecting = selectionDays.has(day)
      const isStartOrEnd =
        periodSelectionStart === day ||
        (isSelecting &&
          selectionDays.size > 0 &&
          (day === Math.min(...Array.from(selectionDays)) || day === Math.max(...Array.from(selectionDays))))
      const isHoveredForPayment = selectingMode === 'payment' && selectingPaymentId && hoveredDay === day

      let dayClasses = 'calendar-day rounded-lg flex items-center justify-center text-sm relative cursor-pointer'
      let dayStyles = {}
      let content = day

      if (payment) {
        dayClasses += ' font-bold border-2 text-gray-900 dark:text-white'
        dayStyles = {
          backgroundColor: `${payment.color}15`,
          borderColor: `${payment.color}80`,
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
        }
        content = (
          <>
            {day}
            <div className="payment-marker" style={{ backgroundColor: payment.color }} />
            {payment.enabled ? (
              <Repeat className="w-3 h-3 absolute top-0.5 right-0.5" style={{ color: payment.color }} />
            ) : (
              <CalendarX className="w-3 h-3 absolute top-0.5 right-0.5" style={{ color: payment.color }} />
            )}
          </>
        )
      } else if (isSelecting && selectingMode === 'period') {
        if (isStartOrEnd) {
          dayClasses += ' selecting'
          dayStyles = {
            background: 'rgba(59, 130, 246, 0.3)',
            border: '2px solid #3B82F6',
          }
        } else {
          dayClasses += ' in-selection'
          dayStyles = {
            background: 'rgba(59, 130, 246, 0.2)',
          }
        }
      } else if (isHoveredForPayment) {
        dayClasses += ' font-medium border-2 text-gray-900 dark:text-white'
        dayStyles = {
          background: 'rgba(59, 130, 246, 0.15)',
          borderColor: 'rgba(59, 130, 246, 0.6)',
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
        }
      } else if (inPeriod) {
        dayClasses += ' text-gray-900 dark:text-white font-medium'
        dayStyles = {
          background: `${inPeriod.color}20`,
          border: `1px solid ${inPeriod.color}40`,
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
        }
      } else {
        dayClasses +=
          ' bg-gray-100 dark:bg-gray-700/30 text-gray-900 dark:text-gray-400 border border-gray-300 dark:border-transparent shadow-sm dark:shadow-none'
        dayStyles = {
          ...dayStyles,
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
        }
      }

      days.push(
        <div
          key={day}
          data-day={day}
          onMouseDown={e => {
            e.preventDefault()
            e.stopPropagation()
            onMouseDown(day, e)
          }}
          onMouseEnter={() => onMouseEnter(day)}
          onMouseUp={e => {
            e.stopPropagation()
            onMouseUp(day, e)
          }}
          onClick={e => {
            e.stopPropagation()
            onDayClick(day)
          }}
          className={dayClasses}
          style={dayStyles}
        >
          {content}
        </div>
      )
    }

    return days
  }

  return (
    <div>
      {/* Навигация по месяцам */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => changeMonth(-1)}
          className="glass-button p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-normal hover-lift-scale click-shrink"
          title="Предыдущий месяц"
        >
          <ChevronLeft className="w-5 h-5 text-gray-400" />
        </button>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white transition-all">
          {monthNames[currentMonth]} {currentYear}
        </h3>
        <button
          onClick={() => changeMonth(1)}
          className="glass-button p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-normal hover-lift-scale click-shrink"
          title="Следующий месяц"
        >
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Календарная сетка */}
      <div className="glass-effect rounded-xl p-4">
        {/* Заголовки дней недели */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {weekDays.map(day => (
            <div key={day} className="text-center text-xs font-medium text-gray-900 dark:text-gray-400">
              {day}
            </div>
          ))}
        </div>

        {/* Дни месяца */}
        <div ref={calendarContainerRef} className="grid grid-cols-7 gap-2">
          {renderDays()}
        </div>
      </div>

      {/* Легенда */}
      <div className="flex items-center gap-6 mt-4 text-sm flex-wrap">
        {paymentDates
          .filter(p => p.enabled)
          .map(payment => (
            <div key={payment.id} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: payment.color }} />
              <span className="text-gray-600 dark:text-gray-500">{payment.name}</span>
            </div>
          ))}
      </div>
    </div>
  )
}

