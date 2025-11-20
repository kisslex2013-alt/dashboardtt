import { useState, useCallback } from 'react'
import { getDaysInMonth, getFirstDayOfMonth } from '../utils/calendarHelpers'

/**
 * Хук для управления календарем
 * @param {number} initialYear - начальный год
 * @param {number} initialMonth - начальный месяц (0-11)
 * @returns {Object} объект с состоянием и методами календаря
 */
export function usePaymentCalendar(initialYear, initialMonth) {
  const [currentYear, setCurrentYear] = useState(initialYear)
  const [currentMonth, setCurrentMonth] = useState(initialMonth)

  /**
   * Изменяет месяц на указанное количество
   * @param {number} delta - изменение месяца (-1 для предыдущего, 1 для следующего)
   */
  const changeMonth = useCallback(
    delta => {
      setCurrentMonth(prev => {
        let newMonth = prev + delta
        if (newMonth > 11) {
          setCurrentYear(prev => prev + 1)
          return 0
        } else if (newMonth < 0) {
          setCurrentYear(prev => prev - 1)
          return 11
        }
        return newMonth
      })
    },
    []
  )

  /**
   * Получает количество дней в текущем месяце
   */
  const daysInMonth = getDaysInMonth(currentYear, currentMonth)

  /**
   * Получает день недели первого дня текущего месяца
   */
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth)

  return {
    currentYear,
    currentMonth,
    daysInMonth,
    firstDay,
    changeMonth,
    setCurrentYear,
    setCurrentMonth,
  }
}

