import { useState, useCallback } from 'react'
import { getDaysInMonth, getFirstDayOfMonth } from '../utils/calendarHelpers'

interface UsePaymentCalendarReturn {
  currentYear: number
  currentMonth: number
  daysInMonth: number
  firstDay: number
  changeMonth: (delta: number) => void
  setCurrentYear: (year: number) => void
  setCurrentMonth: (month: number) => void
}

export function usePaymentCalendar(initialYear: number, initialMonth: number): UsePaymentCalendarReturn {
  const [currentYear, setCurrentYear] = useState(initialYear)
  const [currentMonth, setCurrentMonth] = useState(initialMonth)

  const changeMonth = useCallback((delta: number) => {
    setCurrentMonth(prev => {
      const newMonth = prev + delta
      if (newMonth > 11) {
        setCurrentYear(p => p + 1)
        return 0
      } else if (newMonth < 0) {
        setCurrentYear(p => p - 1)
        return 11
      }
      return newMonth
    })
  }, [])

  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
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
