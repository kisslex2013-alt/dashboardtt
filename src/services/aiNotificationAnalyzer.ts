/**
 * 🔍 Анализатор данных для AI-уведомлений
 *
 * Этот модуль анализирует данные пользователя (записи времени, категории, цели)
 * и определяет условия для генерации умных уведомлений.
 */

import { format, startOfMonth, endOfMonth, subDays, differenceInDays } from 'date-fns'
import type { TimeEntry, Category } from '../types'

/**
 * Результат анализа риска выгорания
 */
export interface BurnoutAnalysis {
  avgHoursPerDay: number
  consecutiveDays: number
  totalHours: number
  productivityDrop?: number
}

/**
 * Результат анализа прогресса цели
 */
export interface GoalAnalysis {
  currentEarned: number
  goalAmount: number
  forecast: number
  gap: number
  daysRemaining: number
  requiredDailyIncrease: number
}

/**
 * Результат анализа паттернов продуктивности
 */
export interface ProductivityAnalysis {
  peakHour: number
  peakEfficiency: number
  worstHour: number
  worstEfficiency: number
}

/**
 * Результат анализа эффективности категорий
 */
export interface EfficiencyAnalysis {
  category: string
  categoryId: string
  timePercent: number
  incomePercent: number
  hours: number
  earned: number
  avgRate: number
  belowAverage: number
}

/**
 * Результат обнаружения аномалий
 */
export interface AnomalyAnalysis {
  date: string
  earned: number
  normalEarned: number
  rate: number
  normalRate: number
  deviation: number
}

/**
 * Данные о достижении
 */
export interface AchievementData {
  type: 'early-goal' | 'record-day' | 'streak'
  goalAmount: number
  earnedAmount: number
  daysUsed: number
  daysRemaining: number
}

/**
 * Данные прогноза
 */
export interface ForecastData {
  forecast: number
  goalAmount: number
  overachievement: number
  daysAnalyzed: number
}

/**
 * Данные итогов месяца (для последних дней)
 */
export interface MonthSummaryData {
  currentEarned: number
  goalAmount: number
  percentComplete: number
  daysRemaining: number
  status: 'exceeded' | 'on-track' | 'behind' | 'failed'
}

/**
 * Парсит duration в минуты
 */
const parseToMinutes = (duration: string | number): number => {
  if (typeof duration === 'number') return duration

  const parts = duration.split(':')
  if (parts.length === 2) {
    const [hours, minutes] = parts.map(Number)
    return hours * 60 + minutes
  }
  return 0
}

/**
 * Парсит earned в число
 */
const parseToNumber = (value: string | number): number => {
  if (typeof value === 'number') return value
  return parseFloat(value) || 0
}

/**
 * Анализирует риск выгорания
 *
 * Проверяет последние 7 дней:
 * - Работа >10 часов в день
 * - Количество дней подряд без перерывов
 *
 * @param entries - массив записей времени
 * @returns данные анализа или null, если риска нет
 */
export const analyzeBurnoutRisk = (entries: TimeEntry[]): BurnoutAnalysis | null => {
  const today = new Date()
  const sevenDaysAgo = subDays(today, 7)

  // Фильтруем записи за последние 7 дней
  const recentEntries = entries.filter((entry) => {
    const entryDate = new Date(entry.date)
    return entryDate >= sevenDaysAgo && entryDate <= today
  })

  if (recentEntries.length === 0) return null

  // Группируем по дням
  const dayStats = new Map<string, number>()

  recentEntries.forEach((entry) => {
    const day = entry.date
    const minutes = parseToMinutes(entry.duration)
    dayStats.set(day, (dayStats.get(day) || 0) + minutes)
  })

  // Вычисляем средние часы в день
  const totalMinutes = Array.from(dayStats.values()).reduce((sum, min) => sum + min, 0)
  const avgHoursPerDay = totalMinutes / 60 / dayStats.size

  // Считаем дни с переработкой (>10 часов)
  let consecutiveDays = 0
  const sortedDays = Array.from(dayStats.entries()).sort((a, b) =>
    new Date(b[0]).getTime() - new Date(a[0]).getTime()
  )

  for (const [, minutes] of sortedDays) {
    if (minutes > 10 * 60) {
      consecutiveDays++
    } else {
      break
    }
  }

  // Риск выгорания: >10ч/день в среднем ИЛИ 5+ дней подряд >10ч
  if (avgHoursPerDay > 10 || consecutiveDays >= 5) {
    return {
      avgHoursPerDay: Math.round(avgHoursPerDay * 10) / 10,
      consecutiveDays,
      totalHours: Math.round(totalMinutes / 60),
    }
  }

  return null
}

/**
 * Анализирует прогресс достижения цели месяца
 *
 * Вычисляет прогноз на конец месяца и определяет риск недостижения
 *
 * @param entries - массив записей времени
 * @param monthlyGoal - цель месяца в рублях
 * @returns данные анализа или null
 */
export const analyzeGoalProgress = (
  entries: TimeEntry[],
  monthlyGoal: number
): GoalAnalysis | null => {
  const today = new Date()
  const monthStart = startOfMonth(today)
  const monthEnd = endOfMonth(today)

  const daysInMonth = differenceInDays(monthEnd, monthStart) + 1
  const daysPassed = differenceInDays(today, monthStart) + 1
  const daysRemaining = differenceInDays(monthEnd, today)

  console.log('[analyzeGoalProgress] daysRemaining:', daysRemaining, 'monthlyGoal:', monthlyGoal)

  // Если осталось меньше 5 дней, не показываем уведомление
  if (daysRemaining < 5) {
    console.log('[analyzeGoalProgress] SKIP: daysRemaining < 5')
    return null
  }

  // Фильтруем записи текущего месяца
  const monthEntries = entries.filter((entry) => {
    const entryDate = new Date(entry.date)
    return entryDate >= monthStart && entryDate <= today
  })

  console.log('[analyzeGoalProgress] monthEntries:', monthEntries.length)

  if (monthEntries.length === 0) {
    console.log('[analyzeGoalProgress] SKIP: no entries this month')
    return null
  }

  // Вычисляем текущий заработок
  const currentEarned = monthEntries.reduce(
    (sum, entry) => sum + parseToNumber(entry.earned),
    0
  )

  // Прогноз на конец месяца
  const dailyAvg = currentEarned / daysPassed
  const forecast = Math.round(dailyAvg * daysInMonth)

  // Разрыв с целью
  const gap = monthlyGoal - forecast

  console.log('[analyzeGoalProgress] currentEarned:', currentEarned, 'forecast:', forecast, 'goal:', monthlyGoal, 'ratio:', (forecast/monthlyGoal*100).toFixed(1) + '%')

  // Риск недостижения: прогноз <90% от цели
  if (forecast < monthlyGoal * 0.9) {
    console.log('[analyzeGoalProgress] ✅ RISK: forecast < 90% of goal')
    const requiredDailyIncrease = Math.round(
      ((monthlyGoal - currentEarned) / daysRemaining - dailyAvg) * 100 / dailyAvg
    )

    return {
      currentEarned: Math.round(currentEarned),
      goalAmount: monthlyGoal,
      forecast,
      gap: Math.round(gap),
      daysRemaining,
      requiredDailyIncrease,
    }
  }

  console.log('[analyzeGoalProgress] NO RISK: forecast >= 90% of goal')
  return null
}

/**
 * Генерирует данные прогноза месяца (позитивный сценарий)
 *
 * @param entries - массив записей времени
 * @param monthlyGoal - цель месяца в рублях
 * @returns данные прогноза или null
 */
export const generateMonthlyForecast = (
  entries: TimeEntry[],
  monthlyGoal: number
): ForecastData | null => {
  const today = new Date()
  const monthStart = startOfMonth(today)
  const monthEnd = endOfMonth(today)

  const daysInMonth = differenceInDays(monthEnd, monthStart) + 1
  const daysPassed = differenceInDays(today, monthStart) + 1

  // Фильтруем записи текущего месяца
  const monthEntries = entries.filter((entry) => {
    const entryDate = new Date(entry.date)
    return entryDate >= monthStart && entryDate <= today
  })

  console.log('[generateMonthlyForecast] monthEntries:', monthEntries.length, 'daysPassed:', daysPassed)

  if (monthEntries.length === 0 || daysPassed < 10) {
    console.log('[generateMonthlyForecast] SKIP: entries=', monthEntries.length, 'daysPassed=', daysPassed)
    return null
  }

  const currentEarned = monthEntries.reduce(
    (sum, entry) => sum + parseToNumber(entry.earned),
    0
  )

  const dailyAvg = currentEarned / daysPassed
  const forecast = Math.round(dailyAvg * daysInMonth)

  console.log('[generateMonthlyForecast] forecast:', forecast, 'goal:', monthlyGoal, 'ratio:', (forecast/monthlyGoal*100).toFixed(1) + '%')

  // Показываем только если прогноз >110% от цели (позитивный инсайт)
  if (forecast > monthlyGoal * 1.1) {
    console.log('[generateMonthlyForecast] ✅ OVERACHIEVEMENT: forecast > 110% of goal')
    return {
      forecast,
      goalAmount: monthlyGoal,
      overachievement: Math.round(forecast - monthlyGoal),
      daysAnalyzed: daysPassed,
    }
  }

  console.log('[generateMonthlyForecast] NO OVERACHIEVEMENT: forecast <= 110% of goal')
  return null
}

/**
 * Анализирует паттерны продуктивности по часам дня
 *
 * Требует минимум 20 дней данных за последние 30 дней
 *
 * @param entries - массив записей времени
 * @returns данные анализа или null
 */
export const analyzeProductivityPatterns = (
  entries: TimeEntry[]
): ProductivityAnalysis | null => {
  const thirtyDaysAgo = subDays(new Date(), 30)

  const recentEntries = entries.filter((entry) => {
    const entryDate = new Date(entry.date)
    return entryDate >= thirtyDaysAgo
  })

  // Требуем минимум 20 дней данных
  const uniqueDays = new Set(recentEntries.map((e) => e.date))
  if (uniqueDays.size < 20) return null

  // Группируем по часам (извлекаем час из start)
  const hourlyStats = new Map<number, { minutes: number; earned: number }>()

  recentEntries.forEach((entry) => {
    const hour = parseInt(entry.start.split(':')[0], 10)
    const minutes = parseToMinutes(entry.duration)
    const earned = parseToNumber(entry.earned)

    const current = hourlyStats.get(hour) || { minutes: 0, earned: 0 }
    hourlyStats.set(hour, {
      minutes: current.minutes + minutes,
      earned: current.earned + earned,
    })
  })

  if (hourlyStats.size < 3) return null

  // Вычисляем эффективность (руб/час) для каждого часа
  const hourlyEfficiency = new Map<number, number>()
  hourlyStats.forEach((stats, hour) => {
    const efficiency = (stats.earned / (stats.minutes / 60))
    hourlyEfficiency.set(hour, efficiency)
  })

  // Находим пик и худшее время
  let peakHour = 0
  let peakEfficiency = 0
  let worstHour = 0
  let worstEfficiency = Infinity

  hourlyEfficiency.forEach((efficiency, hour) => {
    if (efficiency > peakEfficiency) {
      peakEfficiency = efficiency
      peakHour = hour
    }
    if (efficiency < worstEfficiency) {
      worstEfficiency = efficiency
      worstHour = hour
    }
  })

  // Вычисляем среднюю эффективность
  const avgEfficiency =
    Array.from(hourlyEfficiency.values()).reduce((a, b) => a + b, 0) /
    hourlyEfficiency.size

  // Показываем только если разница значительная (>30%)
  const peakDiff = ((peakEfficiency - avgEfficiency) / avgEfficiency) * 100
  const worstDiff = ((avgEfficiency - worstEfficiency) / avgEfficiency) * 100

  if (peakDiff > 30 && worstDiff > 30) {
    return {
      peakHour,
      peakEfficiency: Math.round(peakDiff),
      worstHour,
      worstEfficiency: Math.round(worstDiff),
    }
  }

  return null
}

/**
 * Анализирует эффективность категорий
 *
 * Ищет категории, где % времени значительно больше % дохода
 *
 * @param entries - массив записей времени
 * @param categories - массив категорий
 * @returns данные анализа или null
 */
export const analyzeEfficiency = (
  entries: TimeEntry[],
  categories: Category[]
): EfficiencyAnalysis | null => {
  const thirtyDaysAgo = subDays(new Date(), 30)

  const recentEntries = entries.filter((entry) => {
    const entryDate = new Date(entry.date)
    return entryDate >= thirtyDaysAgo
  })

  if (recentEntries.length < 10) return null

  // Группируем по категориям
  const categoryStats = new Map<
    string,
    { minutes: number; earned: number; categoryId: string }
  >()

  recentEntries.forEach((entry) => {
    const categoryName = entry.category || 'Без категории'
    const minutes = parseToMinutes(entry.duration)
    const earned = parseToNumber(entry.earned)

    const current = categoryStats.get(categoryName) || {
      minutes: 0,
      earned: 0,
      categoryId: entry.categoryId,
    }

    categoryStats.set(categoryName, {
      minutes: current.minutes + minutes,
      earned: current.earned + earned,
      categoryId: entry.categoryId,
    })
  })

  // Вычисляем общие показатели
  const totalMinutes = Array.from(categoryStats.values()).reduce(
    (sum, s) => sum + s.minutes,
    0
  )
  const totalEarned = Array.from(categoryStats.values()).reduce(
    (sum, s) => sum + s.earned,
    0
  )

  const avgRate = totalEarned / (totalMinutes / 60)

  // Ищем неэффективные категории
  for (const [categoryName, stats] of categoryStats.entries()) {
    const timePercent = (stats.minutes / totalMinutes) * 100
    const incomePercent = (stats.earned / totalEarned) * 100
    const categoryRate = stats.earned / (stats.minutes / 60)

    // Неэффективная: время >20% И доход <10% И ставка <70% средней
    if (
      timePercent > 20 &&
      incomePercent < 10 &&
      categoryRate < avgRate * 0.7
    ) {
      return {
        category: categoryName,
        categoryId: stats.categoryId,
        timePercent: Math.round(timePercent),
        incomePercent: Math.round(incomePercent),
        hours: Math.round(stats.minutes / 60),
        earned: Math.round(stats.earned),
        avgRate: Math.round(categoryRate),
        belowAverage: Math.round(((avgRate - categoryRate) / avgRate) * 100),
      }
    }
  }

  return null
}

/**
 * Обнаруживает аномалии в данных
 *
 * Ищет дни с заработком >3x среднего
 *
 * @param entries - массив записей времени
 * @returns данные аномалии или null
 */
export const detectAnomalies = (entries: TimeEntry[]): AnomalyAnalysis | null => {
  const thirtyDaysAgo = subDays(new Date(), 30)

  const recentEntries = entries.filter((entry) => {
    const entryDate = new Date(entry.date)
    return entryDate >= thirtyDaysAgo
  })

  if (recentEntries.length < 10) return null

  // Группируем по дням
  const dailyStats = new Map<string, { earned: number; minutes: number }>()

  recentEntries.forEach((entry) => {
    const current = dailyStats.get(entry.date) || { earned: 0, minutes: 0 }
    dailyStats.set(entry.date, {
      earned: current.earned + parseToNumber(entry.earned),
      minutes: current.minutes + parseToMinutes(entry.duration),
    })
  })

  // Вычисляем средний заработок в день
  const totalEarned = Array.from(dailyStats.values()).reduce(
    (sum, s) => sum + s.earned,
    0
  )
  const avgEarnedPerDay = totalEarned / dailyStats.size

  // Ищем аномалии (>3x среднего)
  for (const [date, stats] of dailyStats.entries()) {
    const deviation = stats.earned / avgEarnedPerDay

    if (deviation > 3) {
      const rate = stats.earned / (stats.minutes / 60)
      const avgRate = totalEarned / (Array.from(dailyStats.values()).reduce((sum, s) => sum + s.minutes, 0) / 60)

      return {
        date: format(new Date(date), 'dd.MM'),
        earned: Math.round(stats.earned),
        normalEarned: Math.round(avgEarnedPerDay),
        rate: Math.round(rate),
        normalRate: Math.round(avgRate),
        deviation: Math.round(deviation * 10) / 10,
      }
    }
  }

  return null
}

/**
 * Обнаруживает достижения
 *
 * Проверяет раннее достижение цели месяца
 *
 * @param entries - массив записей времени
 * @param monthlyGoal - цель месяца в рублях
 * @returns данные достижения или null
 */
export const detectAchievements = (
  entries: TimeEntry[],
  monthlyGoal: number
): AchievementData | null => {
  const today = new Date()
  const monthStart = startOfMonth(today)
  const monthEnd = endOfMonth(today)

  const daysInMonth = differenceInDays(monthEnd, monthStart) + 1
  const daysPassed = differenceInDays(today, monthStart) + 1
  const daysRemaining = differenceInDays(monthEnd, today)

  // Фильтруем записи текущего месяца
  const monthEntries = entries.filter((entry) => {
    const entryDate = new Date(entry.date)
    return entryDate >= monthStart && entryDate <= today
  })

  if (monthEntries.length === 0) return null

  const currentEarned = monthEntries.reduce(
    (sum, entry) => sum + parseToNumber(entry.earned),
    0
  )

  // Достижение: цель достигнута за ≤70% месяца
  if (currentEarned >= monthlyGoal && daysPassed <= daysInMonth * 0.7) {
    return {
      type: 'early-goal',
      goalAmount: monthlyGoal,
      earnedAmount: Math.round(currentEarned),
      daysUsed: daysPassed,
      daysRemaining,
    }
  }

  return null
}

/**
 * Генерирует итоги месяца (для последних 5 дней)
 *
 * Показывает статус выполнения цели в конце месяца
 *
 * @param entries - массив записей времени
 * @param monthlyGoal - цель месяца в рублях
 * @returns данные итогов или null
 */
export const analyzeMonthSummary = (
  entries: TimeEntry[],
  monthlyGoal: number
): MonthSummaryData | null => {
  const today = new Date()
  const monthStart = startOfMonth(today)
  const monthEnd = endOfMonth(today)

  const daysRemaining = differenceInDays(monthEnd, today)

  // Показываем только в последние 5 дней месяца
  if (daysRemaining >= 5) {
    console.log('[analyzeMonthSummary] SKIP: daysRemaining >= 5, still', daysRemaining, 'days left')
    return null
  }

  // Фильтруем записи текущего месяца
  const monthEntries = entries.filter((entry) => {
    const entryDate = new Date(entry.date)
    return entryDate >= monthStart && entryDate <= today
  })

  if (monthEntries.length === 0) {
    console.log('[analyzeMonthSummary] SKIP: no entries this month')
    return null
  }

  const currentEarned = monthEntries.reduce(
    (sum, entry) => sum + parseToNumber(entry.earned),
    0
  )

  const percentComplete = Math.round((currentEarned / monthlyGoal) * 100)

  // Определяем статус
  let status: 'exceeded' | 'on-track' | 'behind' | 'failed'
  if (percentComplete >= 110) {
    status = 'exceeded'
  } else if (percentComplete >= 90) {
    status = 'on-track'
  } else if (percentComplete >= 70) {
    status = 'behind'
  } else {
    status = 'failed'
  }

  console.log('[analyzeMonthSummary] ✅ Generated:', {
    currentEarned: Math.round(currentEarned),
    goalAmount: monthlyGoal,
    percentComplete,
    daysRemaining,
    status
  })

  return {
    currentEarned: Math.round(currentEarned),
    goalAmount: monthlyGoal,
    percentComplete,
    daysRemaining,
    status,
  }
}
