/**
 * 🗓️ Утилиты для работы с календарем рабочего графика
 */

export interface CalendarDay {
  day: number | null
  isWorkDay: boolean
  dateKey?: string
}

type TemplateType = '5/2' | '2/2' | '3/3' | '5/5'

export function getWeekDays(weekStart: number = 1): string[] {
  const days = ['П', 'В', 'С', 'Ч', 'П', 'С', 'В']
  return [...days.slice(weekStart - 1), ...days.slice(0, weekStart - 1)]
}

export function generateMonthCalendar(template: TemplateType, workStartDay: number = 1): CalendarDay[] {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const calendar: CalendarDay[] = []

  const firstDayOfMonth = new Date(year, month, 1)
  let firstDayWeekday = firstDayOfMonth.getDay()
  firstDayWeekday = firstDayWeekday === 0 ? 7 : firstDayWeekday

  for (let i = 1; i < firstDayWeekday; i++) {
    calendar.push({ day: null, isWorkDay: false })
  }

  if (template === '5/2') {
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      let dayOfWeek = date.getDay()
      dayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek
      const adjustedDay = (dayOfWeek - workStartDay + 7) % 7
      const isWorkDay = adjustedDay < 5
      calendar.push({ day, isWorkDay })
    }
  } else if (template === '2/2' || template === '3/3' || template === '5/5') {
    const patterns: Record<string, { work: number; total: number }> = {
      '2/2': { work: 2, total: 4 },
      '3/3': { work: 3, total: 6 },
      '5/5': { work: 5, total: 10 },
    }

    const pattern = patterns[template]!
    let firstWorkDay = 1

    for (let day = 1; day <= 7; day++) {
      const date = new Date(year, month, day)
      let dayOfWeek = date.getDay()
      dayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek
      if (dayOfWeek === workStartDay) {
        firstWorkDay = day
        break
      }
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const daysSinceFirstWorkDay = day - firstWorkDay
      const cyclePosition = ((daysSinceFirstWorkDay % pattern.total) + pattern.total) % pattern.total
      const isWorkDay = cyclePosition < pattern.work
      calendar.push({ day, isWorkDay })
    }
  }

  return calendar
}

export function generateCustomCalendar(customWorkDates: Record<string, boolean> = {}): CalendarDay[] {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const calendar: CalendarDay[] = []

  const firstDayOfMonth = new Date(year, month, 1)
  let firstDayWeekday = firstDayOfMonth.getDay()
  firstDayWeekday = firstDayWeekday === 0 ? 7 : firstDayWeekday

  for (let i = 1; i < firstDayWeekday; i++) {
    calendar.push({ day: null, isWorkDay: false })
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const isWorkDay = customWorkDates[dateKey] !== false
    calendar.push({ day, isWorkDay, dateKey })
  }

  return calendar
}

export function countWorkDays(calendar: CalendarDay[]): number {
  return calendar.filter(d => d.day !== null && d.isWorkDay).length
}
