import { startOfMonth, subMonths, startOfYear, subYears, isSameMonth, getYear, getMonth, format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { TimeEntry, Category } from '../types'

export interface MonthStats {
  income: number
  hours: number
  count: number
}

export interface ComparisonResult {
  current: MonthStats
  previous: MonthStats
  absoluteChange: {
    income: number
    hours: number
  }
  percentChange: {
    income: number
    hours: number
  }
}

/**
 * Рассчитывает статистику за определенный месяц и год
 */
export function getMonthStats(entries: TimeEntry[], date: Date): MonthStats {
  const targetYear = getYear(date)
  const targetMonth = getMonth(date)

  return entries.reduce(
    (acc, entry) => {
      if (!entry.date) return acc
      
      const entryDate = new Date(entry.date)
      if (getYear(entryDate) === targetYear && getMonth(entryDate) === targetMonth) {
        const income = typeof entry.earned === 'number' 
          ? entry.earned 
          : parseFloat((entry.earned || '0').toString().replace(/[^\d.-]/g, '')) || 0
        
        const duration = typeof entry.duration === 'number'
          ? entry.duration
          : parseFloat((entry.duration || '0').toString()) || 0

        acc.income += income
        acc.hours += duration
        acc.count += 1
      }
      return acc
    },
    { income: 0, hours: 0, count: 0 }
  )
}

/**
 * Рассчитывает Month-over-Month (MoM) метрики
 */
export function calculateMoM(entries: TimeEntry[], currentDate: Date = new Date()): ComparisonResult {
  const currentStats = getMonthStats(entries, currentDate)
  const prevDate = subMonths(currentDate, 1)
  const prevStats = getMonthStats(entries, prevDate)

  return calculateComparison(currentStats, prevStats)
}

/**
 * Рассчитывает Year-over-Year (YoY) метрики
 */
export function calculateYoY(entries: TimeEntry[], currentDate: Date = new Date()): ComparisonResult {
  const currentStats = getMonthStats(entries, currentDate)
  const prevDate = subYears(currentDate, 1)
  const prevStats = getMonthStats(entries, prevDate)

  return calculateComparison(currentStats, prevStats)
}

/**
 * Вспомогательная функция для расчета разницы
 */
function calculateComparison(current: MonthStats, previous: MonthStats): ComparisonResult {
  const incomeDiff = current.income - previous.income
  const hoursDiff = current.hours - previous.hours

  const incomePercent = previous.income !== 0 ? (incomeDiff / previous.income) * 100 : current.income > 0 ? 100 : 0
  const hoursPercent = previous.hours !== 0 ? (hoursDiff / previous.hours) * 100 : current.hours > 0 ? 100 : 0

  return {
    current,
    previous,
    absoluteChange: {
      income: incomeDiff,
      hours: hoursDiff
    },
    percentChange: {
      income: incomePercent,
      hours: hoursPercent
    }
  }
}

/**
 * Подготавливает данные для графика трендов за последние N месяцев
 */
export function calculateTrendData(entries: TimeEntry[], monthsCount: number = 6) {
  const today = new Date()
  const data: { date: string, monthName: string, fullDate: string, income: number, hours: number }[] = []

  for (let i = monthsCount - 1; i >= 0; i--) {
    const date = subMonths(today, i)
    const stats = getMonthStats(entries, date)
    
    // Capitalize first letter of month
    const monthName = format(date, 'MMM', { locale: ru })
    const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1)
    
    // Capitalize full date month
    const fullDate = format(date, 'MMMM yyyy', { locale: ru })
    const capitalizedFullDate = fullDate.charAt(0).toUpperCase() + fullDate.slice(1)

    data.push({
      date: format(date, 'yyyy-MM-dd'),
      monthName: capitalizedMonth,
      fullDate: capitalizedFullDate,
      income: stats.income,
      hours: stats.hours
    })
  }

  return data
}

/**
 * Подготавливает данные для сравнения YoY (этот месяц в разных годах)
 */
export function calculateYoYTrendData(entries: TimeEntry[], yearsCount: number = 3) {
  const today = new Date()
  const currentMonth = getMonth(today)
  const data: { year: number, income: number, hours: number }[] = []

  // Начинаем с текущего года и идем назад
  for (let i = yearsCount - 1; i >= 0; i--) {
    const date = subYears(today, i)
    const stats = getMonthStats(entries, date)
    
    data.push({
      year: getYear(date),
      income: stats.income,
      hours: stats.hours
    })
  }

  return data
}

export interface WeekStats {
  weekStart: string
  weekEnd: string // Add end date for clarity
  weekNumber: number
  year: number
  income: number
  hours: number
  mainCategory: string
}

export function calculateWeeklyStats(entries: TimeEntry[]): { bestWeeks: WeekStats[], worstWeeks: WeekStats[] } {
  const weeklyData: Record<string, { income: number; hours: number; categories: Record<string, number>; startDate: Date }> = {}

  entries.forEach(entry => {
    if (!entry.date) return
    const date = new Date(entry.date)
    // Get ISO week info
    // Simple approach: standard ISO week keys "YYYY-Www"
    // Using date-fns startOfWeek for grouping
    // Assuming week starts on Monday (ru locale default)
    const weekStart = startOfMonth(date) // Placeholder
    // Actually, let's use a simpler key: start of week timestamp
    const startOfWeekDate = new Date(date)
    const day = startOfWeekDate.getDay() || 7
    if (day !== 1) startOfWeekDate.setHours(-24 * (day - 1))
    else startOfWeekDate.setHours(0, 0, 0, 0)
    
    // Normalize to Midnight
    startOfWeekDate.setHours(0,0,0,0)
    const key = startOfWeekDate.getTime().toString()

    if (!weeklyData[key]) {
      weeklyData[key] = { income: 0, hours: 0, categories: {}, startDate: startOfWeekDate }
    }

    const income = typeof entry.earned === 'number' ? entry.earned : parseFloat((entry.earned || '0').toString().replace(/[^\d.-]/g, '')) || 0
    const duration = typeof entry.duration === 'number' ? entry.duration : parseFloat((entry.duration || '0').toString()) || 0

    weeklyData[key].income += income
    weeklyData[key].hours += duration

    const cat = entry.category || 'Uncategorized'
    weeklyData[key].categories[cat] = (weeklyData[key].categories[cat] || 0) + duration
  })

  // Convert to array
  const weeksArray: WeekStats[] = Object.values(weeklyData).map(w => {
    // Find main category
    let mainCategory = 'N/A'
    let maxDuration = 0
    Object.entries(w.categories).forEach(([cat, dur]) => {
      if (dur > maxDuration) {
        maxDuration = dur
        mainCategory = cat
      }
    })
    
    // Calculate weekEnd
    const weekEnd = new Date(w.startDate)
    weekEnd.setDate(weekEnd.getDate() + 6)

    return {
      weekStart: format(w.startDate, 'd MMM', { locale: ru }),
      weekEnd: format(weekEnd, 'd MMM yyyy', { locale: ru }),
      weekNumber: 0, // Not vital for display
      year: getYear(w.startDate),
      income: w.income,
      hours: w.hours,
      mainCategory
    }
  })

  // Filter out empty or zero income weeks for "Worst" calculation to avoid just showing holidays
  const activeWeeks = weeksArray.filter(w => w.income > 0 || w.hours > 0)

  const sortedByIncome = [...activeWeeks].sort((a, b) => b.income - a.income)
  
  return {
    bestWeeks: sortedByIncome.slice(0, 5),
    worstWeeks: [...activeWeeks].sort((a, b) => a.income - b.income).slice(0, 5)
  }
}

export interface CategoryTrendPoint {
  date: string
  fullDate: string
  [category: string]: number | string
}

export function calculateCategoryShareTrend(entries: TimeEntry[], categories: Category[] = [], monthsCount: number = 6): CategoryTrendPoint[] {
  const data: CategoryTrendPoint[] = []
  const today = new Date()

  // Create a lookup map for category names by ID
  const categoryMap = new Map<string, string>()
  categories.forEach(c => categoryMap.set(c.id, c.name))

  for (let i = monthsCount - 1; i >= 0; i--) {
    const date = subMonths(today, i)
    
    // We need breakdown. Let's do a mini-aggregation here.
    const monthEntries = entries.filter(e => isSameMonth(new Date(e.date), date))
    
    const categoryHours: Record<string, number> = {}
    let totalMonthHours = 0

    monthEntries.forEach(e => {
       const duration = typeof e.duration === 'number' ? e.duration : parseFloat((e.duration || '0').toString()) || 0
       
       // Try to resolve name by ID, fallback to stored name, fallback to 'Uncategorized'
       let catName = 'Без категории'
       if (e.categoryId && categoryMap.has(e.categoryId)) {
           catName = categoryMap.get(e.categoryId)!
       } else if (e.category) {
           catName = e.category
       }

       categoryHours[catName] = (categoryHours[catName] || 0) + duration
       totalMonthHours += duration
    })

    const point: CategoryTrendPoint = {
      date: format(date, 'MMM', { locale: ru }),
      fullDate: format(date, 'MMMM yyyy', { locale: ru })
    }

    if (totalMonthHours > 0) {
      Object.entries(categoryHours).forEach(([cat, hours]) => {
        point[cat] = parseFloat(hours.toFixed(2))
      })
    }
    
    data.push(point)
  }

  return data
}

/**
 * Метрики для радарного графика
 */
export interface RadarPeriodMetrics {
  income: number
  hours: number
  entries: number
  avgRate: number      // средняя ставка (доход/час)
  productivity: number // часов в день (по рабочим дням)
}

/**
 * Рассчитывает метрики для радарного графика сравнения периодов
 */
export function calculateRadarMetrics(entries: TimeEntry[], currentDate: Date = new Date()): {
  current: RadarPeriodMetrics
  previous: RadarPeriodMetrics
  currentLabel: string
  previousLabel: string
} {
  const prevDate = subMonths(currentDate, 1)
  
  // Получаем записи текущего месяца
  const currentMonthEntries = entries.filter(e => isSameMonth(new Date(e.date), currentDate))
  const prevMonthEntries = entries.filter(e => isSameMonth(new Date(e.date), prevDate))
  
  // Функция для расчёта метрик
  const calcMetrics = (monthEntries: TimeEntry[], workingDays: number = 20): RadarPeriodMetrics => {
    let totalIncome = 0
    let totalHours = 0
    let count = 0

    monthEntries.forEach(entry => {
      const income = typeof entry.earned === 'number' 
        ? entry.earned 
        : parseFloat((entry.earned || '0').toString().replace(/[^\d.-]/g, '')) || 0
      
      const duration = typeof entry.duration === 'number'
        ? entry.duration
        : parseFloat((entry.duration || '0').toString()) || 0

      totalIncome += income
      totalHours += duration
      count++
    })

    return {
      income: totalIncome,
      hours: totalHours,
      entries: count,
      avgRate: totalHours > 0 ? totalIncome / totalHours : 0,
      productivity: workingDays > 0 ? totalHours / workingDays : 0,
    }
  }
  
  // Форматирование названий периодов
  const currentLabel = format(currentDate, 'LLLL', { locale: ru })
  const previousLabel = format(prevDate, 'LLLL', { locale: ru })
  
  return {
    current: calcMetrics(currentMonthEntries),
    previous: calcMetrics(prevMonthEntries),
    currentLabel: currentLabel.charAt(0).toUpperCase() + currentLabel.slice(1),
    previousLabel: previousLabel.charAt(0).toUpperCase() + previousLabel.slice(1),
  }
}
