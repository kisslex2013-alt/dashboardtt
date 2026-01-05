/**
 * 📊 Утилиты для расчета автоматических инсайтов
 */

import { calculateDuration } from './calculations'
import type { TimeEntry } from '../types'

interface BestWeekday {
  day: string
  avg: number
}

interface PeakProductivity {
  start: string
  end: string
  rate: number
}

interface EarningsTrend {
  trend: string
  change: number
}

interface LongestSessionResult {
  date: string
  start: string
  end: string
  duration: number
  earned: number
}

interface TodayAnomaly {
  type: 'выше' | 'ниже'
  percent: string
  total: number
}

/**
 * Определяет день недели с максимальным средним заработком
 */
export function calculateBestWeekday(entries: TimeEntry[]): BestWeekday {
  if (!entries || entries.length === 0) {
    return { day: 'Пн', avg: 0 }
  }

  const dailyTotals: Record<string, number> = entries.reduce((acc, entry) => {
    if (!acc[entry.date]) {
      acc[entry.date] = 0
    }
    acc[entry.date] += parseFloat(String(entry.earned)) || 0
    return acc
  }, {} as Record<string, number>)

  const weekdayEarnings: Record<number, number[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] }

  for (const date in dailyTotals) {
    const dayOfWeek = new Date(date).getDay()
    weekdayEarnings[dayOfWeek].push(dailyTotals[date])
  }

  let bestDayIndex = 0
  let bestAvg = 0

  for (const dayIndex in weekdayEarnings) {
    const earnings = weekdayEarnings[Number(dayIndex)]
    if (earnings.length > 0) {
      const total = earnings.reduce((sum, val) => sum + val, 0)
      const avg = total / earnings.length
      if (avg > bestAvg) {
        bestAvg = avg
        bestDayIndex = Number(dayIndex)
      }
    }
  }

  const shortDayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']

  return { day: shortDayNames[bestDayIndex], avg: bestAvg }
}

/**
 * Находит час дня с максимальной средней ставкой
 */
export function calculatePeakProductivity(entries: TimeEntry[]): PeakProductivity {
  if (!entries || entries.length === 0) {
    return { start: '09', end: '10', rate: 0 }
  }

  const hourlyStats = Array(24).fill(null).map(() => ({ totalEarned: 0, totalHours: 0 }))

  entries.forEach(entry => {
    if (!entry.start || !entry.end) return

    const duration = parseFloat(calculateDuration(entry.start, entry.end))
    if (duration <= 0 || isNaN(duration)) return

    const earned = parseFloat(String(entry.earned)) || 0
    const rate = earned / duration

    const [startH, startM] = entry.start.split(':').map(Number)
    const startMin = startH * 60 + startM
    const endMin = startMin + duration * 60

    let current = startMin
    while (current < endMin) {
      const hour = Math.floor((current / 60) % 24)
      const minInHour = 60 - (current % 60)
      const toProcess = Math.min(minInHour, endMin - current)

      hourlyStats[hour].totalEarned += (toProcess / 60) * rate
      hourlyStats[hour].totalHours += toProcess / 60

      current += toProcess
    }
  })

  let bestHour = 9
  let bestRate = 0

  hourlyStats.forEach((stat, i) => {
    const rate = stat.totalHours > 0 ? stat.totalEarned / stat.totalHours : 0
    if (rate > bestRate) {
      bestRate = rate
      bestHour = i
    }
  })

  const nextHour = (bestHour + 1) % 24

  return {
    start: String(bestHour).padStart(2, '0'),
    end: String(nextHour).padStart(2, '0'),
    rate: bestRate,
  }
}

/**
 * Анализирует тренд заработка за последний месяц
 */
export function calculateEarningsTrend(entries: TimeEntry[]): EarningsTrend {
  if (!entries || entries.length < 7) {
    return { trend: 'недостаточно данных', change: 0 }
  }

  const now = new Date()
  const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())

  const recentEntries = entries.filter(entry => {
    const entryDate = new Date(entry.date)
    return entryDate >= monthAgo
  })

  if (recentEntries.length < 7) {
    return { trend: 'недостаточно данных', change: 0 }
  }

  const weeks: number[][] = [[], [], [], []]

  recentEntries.forEach(entry => {
    const entryDate = new Date(entry.date)
    const daysDiff = Math.floor((now.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24))

    if (daysDiff < 0 || daysDiff > 28) return

    const weekIndex = Math.min(3, Math.max(0, Math.floor(daysDiff / 7)))
    const arrayIndex = 3 - weekIndex

    if (arrayIndex >= 0 && arrayIndex < weeks.length) {
      weeks[arrayIndex].push(parseFloat(String(entry.earned)) || 0)
    }
  })

  const weeklyAvg = weeks.map(week =>
    week.length > 0 ? week.reduce((a, b) => a + b, 0) / week.length : 0
  )

  const validWeeks = weeklyAvg.filter(v => v > 0)

  if (validWeeks.length < 2) {
    return { trend: 'недостаточно данных', change: 0 }
  }

  const first = validWeeks[0]
  const last = validWeeks[validWeeks.length - 1]
  const change = ((last - first) / first) * 100

  if (Math.abs(change) < 5) {
    return { trend: 'стабилен', change }
  }

  return { trend: change > 0 ? 'растёт' : 'падает', change }
}

/**
 * Находит самую длительную рабочую сессию
 */
export function calculateLongestSession(entries: TimeEntry[]): LongestSessionResult | null {
  if (!entries || entries.length === 0) return null

  const longestEntry = entries.reduce((max, entry) => {
    if (!entry.start || !entry.end) return max
    if (!max.start || !max.end) return entry

    const duration = parseFloat(calculateDuration(entry.start, entry.end))
    const maxDuration = parseFloat(calculateDuration(max.start, max.end))

    return duration > maxDuration ? entry : max
  }, entries[0])

  if (!longestEntry || !longestEntry.start || !longestEntry.end) return null

  const duration = calculateDuration(longestEntry.start, longestEntry.end)

  return {
    date: longestEntry.date,
    start: longestEntry.start,
    end: longestEntry.end,
    duration: parseFloat(duration),
    earned: parseFloat(String(longestEntry.earned)) || 0,
  }
}

/**
 * Определяет аномалию текущего дня
 */
export function calculateTodayAnomaly(entries: TimeEntry[]): TodayAnomaly | null {
  if (!entries || entries.length === 0) return null

  const today = new Date().toISOString().split('T')[0]

  const todayCompletedEntries = entries.filter(entry => entry.date === today && entry.end)

  if (todayCompletedEntries.length === 0) return null

  const historical = entries.filter(entry => entry.date !== today)

  const uniqueDates = new Set(historical.map(entry => entry.date))
  if (uniqueDates.size < 5) return null

  const totalHistorical = historical.reduce(
    (sum, entry) => sum + (parseFloat(String(entry.earned)) || 0),
    0
  )
  const avgDaily = totalHistorical / uniqueDates.size

  if (avgDaily === 0) return null

  const todayTotal = todayCompletedEntries.reduce(
    (sum, entry) => sum + (parseFloat(String(entry.earned)) || 0),
    0
  )

  const diff = ((todayTotal - avgDaily) / avgDaily) * 100

  if (Math.abs(diff) < 20) return null

  return {
    type: diff > 0 ? 'выше' : 'ниже',
    percent: Math.abs(diff).toFixed(0),
    total: todayTotal,
  }
}

interface BurnoutRisk {
  level: 'low' | 'medium' | 'high'
  score: number // 0-100
  factors: {
    overwork: boolean // Переработки
    noDaysOff: boolean // Работа без выходных
    longSessions: boolean // Длинные сессии без перерывов
    nightWork: boolean // Работа в ночное время
  }
  factorDetails: {
    overwork: string
    noDaysOff: string
    longSessions: string
    nightWork: string
  }
  message: string
}

/**
 * Рассчитывает риск выгорания
 */
export function calculateBurnoutRisk(entries: TimeEntry[], dailyHoursLimit: number = 8): BurnoutRisk {
  const defaultDetails = {
    overwork: 'Средняя нагрузка в норме',
    noDaysOff: 'Регулярные выходные',
    longSessions: 'Сессии оптимальной длины',
    nightWork: 'Работа в дневное время',
  }

  if (!entries || entries.length < 5) {
    return {
      level: 'low',
      score: 0,
      factors: { overwork: false, noDaysOff: false, longSessions: false, nightWork: false },
      factorDetails: defaultDetails,
      message: 'Недостаточно данных для анализа',
    }
  }

  const now = new Date()
  const monthAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30)

  // Фильтруем записи за последние 30 дней
  const recentEntries = entries.filter(entry => {
    const d = new Date(entry.date)
    return d >= monthAgo
  })

  if (recentEntries.length === 0) {
    return {
      level: 'low',
      score: 0,
      factors: { overwork: false, noDaysOff: false, longSessions: false, nightWork: false },
      factorDetails: defaultDetails,
      message: 'Нет записей за последние 30 дней',
    }
  }

  let score = 0
  const factors = {
    overwork: false,
    noDaysOff: false,
    longSessions: false,
    nightWork: false,
  }
  const factorDetails = { ...defaultDetails }

  // 1. Анализ переработок (средние часы в рабочий день)
  const dailyHours: Record<string, number> = {}
  recentEntries.forEach(entry => {
    if (!entry.start || !entry.end) return
    const duration = parseFloat(calculateDuration(entry.start, entry.end))
    if (!dailyHours[entry.date]) dailyHours[entry.date] = 0
    dailyHours[entry.date] += duration
  })

  const workDays = Object.keys(dailyHours).length
  const totalHours = Object.values(dailyHours).reduce((a, b) => a + b, 0)
  const avgHours = workDays > 0 ? totalHours / workDays : 0

  if (avgHours > dailyHoursLimit * 1.2) { // +20% к норме
    score += 40
    factors.overwork = true
    factorDetails.overwork = `В среднем ${avgHours.toFixed(1)}ч/день (норма ${dailyHoursLimit}ч) за ${workDays} рабочих дней`
  } else if (avgHours > dailyHoursLimit) {
    score += 20
    factorDetails.overwork = `В среднем ${avgHours.toFixed(1)}ч/день — близко к лимиту`
  }

  // 2. Анализ работы без выходных
  const sortedDates = Object.keys(dailyHours).sort()
  let maxConsecutiveDays = 0
  let currentConsecutive = 0
  let consecutiveStart = sortedDates[0]
  let consecutiveEnd = sortedDates[0]
  let maxStart = sortedDates[0]
  let maxEnd = sortedDates[0]
  
  for (let i = 0; i < sortedDates.length; i++) {
    if (i === 0) {
      currentConsecutive = 1
      consecutiveStart = sortedDates[i]
      consecutiveEnd = sortedDates[i]
      continue
    }
    const prev = new Date(sortedDates[i - 1])
    const curr = new Date(sortedDates[i])
    const diffTime = Math.abs(curr.getTime() - prev.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      currentConsecutive++
      consecutiveEnd = sortedDates[i]
    } else {
      if (currentConsecutive > maxConsecutiveDays) {
        maxConsecutiveDays = currentConsecutive
        maxStart = consecutiveStart
        maxEnd = consecutiveEnd
      }
      currentConsecutive = 1
      consecutiveStart = sortedDates[i]
      consecutiveEnd = sortedDates[i]
    }
  }
  if (currentConsecutive > maxConsecutiveDays) {
    maxConsecutiveDays = currentConsecutive
    maxStart = consecutiveStart
    maxEnd = consecutiveEnd
  }

  const formatShortDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, '0')}`
  }

  if (maxConsecutiveDays >= 7) {
    score += 30
    factors.noDaysOff = true
    factorDetails.noDaysOff = `${maxConsecutiveDays} рабочих дней подряд (${formatShortDate(maxStart)} – ${formatShortDate(maxEnd)})`
  } else if (maxConsecutiveDays >= 5) {
    score += 15
    factorDetails.noDaysOff = `${maxConsecutiveDays} дней подряд — почти без отдыха`
  }

  // 3. Анализ длинных сессий (> 4 часов без перерыва)
  let longSessionsCount = 0
  let maxSessionDuration = 0
  recentEntries.forEach(entry => {
    if (!entry.start || !entry.end) return
    const duration = parseFloat(calculateDuration(entry.start, entry.end))
    if (duration > 4) {
      longSessionsCount++
      maxSessionDuration = Math.max(maxSessionDuration, duration)
    }
  })

  const longSessionsPercent = recentEntries.length > 0 ? Math.round((longSessionsCount / recentEntries.length) * 100) : 0

  if (longSessionsCount > recentEntries.length * 0.3) { // Более 30% сессий длинные
    score += 20
    factors.longSessions = true
    factorDetails.longSessions = `${longSessionsCount} сессий >4ч (${longSessionsPercent}%), макс. ${maxSessionDuration.toFixed(1)}ч`
  }

  // 4. Ночная работа (23:00 - 06:00)
  let nightWorkCount = 0
  recentEntries.forEach(entry => {
    if (!entry.start) return
    const hour = parseInt(entry.start.split(':')[0], 10)
    if (hour >= 23 || hour < 6) nightWorkCount++
  })

  const nightPercent = recentEntries.length > 0 ? Math.round((nightWorkCount / recentEntries.length) * 100) : 0

  if (nightWorkCount > recentEntries.length * 0.1) { // Более 10% записей ночью
    score += 10
    factors.nightWork = true
    factorDetails.nightWork = `${nightWorkCount} сессий ночью (${nightPercent}% от всех)`
  }

  // Определяем уровень и сообщение
  let level: 'low' | 'medium' | 'high' = 'low'
  let message = 'Вы работаете в комфортном ритме'

  if (score >= 70) {
    level = 'high'
    message = 'Высокий риск выгорания! Срочно нужен отдых'
  } else if (score >= 40) {
    level = 'medium'
    message = 'Замечены признаки переутомления'
  }

  return { level, score, factors, factorDetails, message }
}
