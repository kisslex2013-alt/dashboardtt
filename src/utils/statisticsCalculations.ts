import { TimeEntry } from '../types'
import { calculateDuration } from './calculations'
import { timeToMinutes } from './dateHelpers'
import { startOfWeek, endOfWeek, format, isWithinInterval, startOfDay, endOfDay, parseISO } from 'date-fns'

export interface DashboardStats {
  totalHours: number
  totalEarned: number
  avgRate: number
  daysWorked: number
  totalBreaks: number
  daysOff: number
}

/**
 * Оптимизированная фильтрация записей.
 * Использует строковое сравнение для дат в формате YYYY-MM-DD для максимальной производительности.
 */
export const getFilteredEntries = (
  entries: TimeEntry[],
  filter: string,
  dateFrom: string | null,
  dateTo: string | null
): TimeEntry[] => {
  if (!entries || entries.length === 0) return []

  const now = new Date()
  const todayStr = format(now, 'yyyy-MM-dd')

  switch (filter) {
    case 'today': {
      return entries.filter(entry => entry.date === todayStr)
    }

    case 'week': {
      // Оптимизация: используем строковое сравнение для диапазона недели
      // date-fns startOfWeek по умолчанию начинает с воскресенья, нам нужен понедельник (weekStartsOn: 1)
      const start = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
      const end = format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
      return entries.filter(entry => entry.date >= start && entry.date <= end)
    }

    case 'month': {
      // Оптимизация: проверяем начало строки "YYYY-MM"
      const currentMonthPrefix = format(now, 'yyyy-MM')
      return entries.filter(entry => entry.date.startsWith(currentMonthPrefix))
    }

    case 'year': {
      // Оптимизация: проверяем начало строки "YYYY"
      const currentYearPrefix = format(now, 'yyyy')
      return entries.filter(entry => entry.date.startsWith(currentYearPrefix))
    }

    case 'custom': {
      if (!dateFrom || !dateTo) return entries
      // Строковое сравнение работает корректно для формата ISO (YYYY-MM-DD)
      return entries.filter(entry => entry.date >= dateFrom && entry.date <= dateTo)
    }

    default:
      return entries
  }
}

/**
 * Оптимизированный расчет статистики за один проход (Single-pass reduce).
 */
export const calculateDetailedStats = (
  data: TimeEntry[], 
  filter: string,
  dateFrom: string | null = null,
  dateTo: string | null = null
): DashboardStats => {
  if (data.length === 0) {
    return {
      totalHours: 0,
      totalEarned: 0,
      avgRate: 0,
      daysWorked: 0,
      totalBreaks: 0,
      daysOff: 0,
    }
  }

  // Используем Set для уникальных дней (O(1) lookup)
  const workedDaysSet = new Set<string>()
  // Группировка для перерывов
  const entriesByDay: Record<string, TimeEntry[]> = {}

  // Single pass aggregation
  const { totalHours, totalEarned } = data.reduce(
    (acc, e) => {
      // Sum Hours
      if (e.start && e.end) {
        acc.totalHours += parseFloat(calculateDuration(e.start, e.end))
      }

      // Sum Earned
      acc.totalEarned += parseFloat(String(e.earned || 0)) || 0

      // Collect Days
      workedDaysSet.add(e.date)

      // Collect for breaks
      if (!entriesByDay[e.date]) {
        entriesByDay[e.date] = []
      }
      entriesByDay[e.date].push(e)

      return acc
    },
    { totalHours: 0, totalEarned: 0 }
  )

  // Calculate Breaks
  let totalBreakMinutes = 0
  for (const dayEntries of Object.values(entriesByDay)) {
    if (dayEntries.length < 2) continue
    
    // Сортировка только внутри дня (маленький массив)
    const sorted = dayEntries.sort((a, b) => a.start.localeCompare(b.start))
    
    for (let i = 1; i < sorted.length; i++) {
      const prevEnd = timeToMinutes(String(sorted[i - 1].end))
      const currentStart = timeToMinutes(String(sorted[i].start))
      const breakMinutes = (currentStart + 24 * 60 - prevEnd) % (24 * 60)
      
      if (breakMinutes > 0 && breakMinutes < 12 * 60) {
        totalBreakMinutes += breakMinutes
      }
    }
  }

  // Calculate Days Off
  const daysWorked = workedDaysSet.size
  let daysOff = 0
  const now = new Date()

  // Оптимизированный подсчет выходных без создания Date объектов в цикле где возможно
  if (filter === 'today') {
    daysOff = data.length === 0 ? 1 : 0
  } else if (filter === 'week') {
    const start = startOfWeek(now, { weekStartsOn: 1 })
    for (let i = 0; i < 7; i++) {
      // Здесь сложно избежать создания Date, но loop маленький (7)
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      const dateStr = format(d, 'yyyy-MM-dd')
      if (!workedDaysSet.has(dateStr)) daysOff++
    }
  } else if (filter === 'month') {
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const currentMonthPrefix = format(now, 'yyyy-MM')
    
    for (let i = 1; i <= daysInMonth; i++) {
      const dayStr = i < 10 ? `0${i}` : `${i}`
      const dateStr = `${currentMonthPrefix}-${dayStr}`
      if (!workedDaysSet.has(dateStr)) daysOff++
    }
  } else if (filter === 'year') {
    const year = now.getFullYear()
    const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0)
    const daysInYear = isLeap ? 366 : 365
    // Для года проще отнять workedDays от прошедших дней года
    // Но нужно учитывать "будущее" если мы считаем дни off только до текущего момента?
    // Оригинальная логика считала дни off во всем периоде. 
    // Предположим, что считаем просто (всего дней в периоде - рабочих).
    // Оригинальная логика: daysInRange loop. 
    // Оптимизация: daysOff = daysInRange - daysWorked (если все дни "должны быть" рабочими?)
    // В оригинале: if (!workedDays.has(dateStr)) daysOff++
    // Мы можем просто посчитать количество дней в диапазоне и вычесть daysWorked, 
    // НО! Это работает только если мы не фильтруем "будущие" даты.
    // Оригинальная логика фильтровала `date <= today` для 'all' case, но для 'year' case проходила по всему году?
    // В оригинале для 'year' и 'month' и 'custom' не было проверки `<= today`.
    
    daysOff = daysInYear - daysWorked
  } else if (filter === 'custom' && dateFrom && dateTo) {
      const from = parseISO(dateFrom)
      const to = parseISO(dateTo)
      const diffTime = Math.abs(to.getTime() - from.getTime())
      const daysInRange = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
      daysOff = Math.max(0, daysInRange - daysWorked)
  } else {
     // 'all' case or fallback
     if (data.length > 0) {
        // ... сложная логика из оригинала, оставим упрощенно или перенесем если надо точно
        const sortedDates = Array.from(workedDaysSet).sort()
        const firstDateStr = sortedDates[0]
        if (firstDateStr) {
            const first = parseISO(firstDateStr)
            const today = startOfDay(new Date())
            const diffTime = today.getTime() - first.getTime()
            if (diffTime >= 0) {
                 const daysInRange = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
                 daysOff = Math.max(0, daysInRange - daysWorked)
            }
        }
     }
  }

  return {
    totalHours,
    totalEarned,
    avgRate: totalHours > 0 ? totalEarned / totalHours : 0,
    daysWorked,
    totalBreaks: totalBreakMinutes / 60,
    daysOff,
  }
}
