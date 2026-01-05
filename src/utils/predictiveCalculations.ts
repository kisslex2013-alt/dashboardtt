import { TimeEntry } from '../types'
import { differenceInDays, isAfter, subMonths } from 'date-fns'

interface BaselineStats {
  avgHourlyRate: number
  avgDailyHours: number
  monthlyIncome: number
  totalDays: number
  activeDays: number
}

interface ProjectionResult {
  monthlyIncome: number
  yearlyIncome: number
  differenceMonthly: number
  differenceYearly: number
}

/**
 * Вычисляет базовые метрики на основе последних 3 месяцев (или всех данных, если их мало)
 * для более точного прогноза "текущей" ситуации.
 */
// calculateBaseline removed in favor of statisticsCalculations logic


// Переосмысление: calculateBaseline лучше делать внутри компонента или хука, где есть доступ к Проектам, 
// либо передавать уже скалькулированные данные (например, "средний рейт" из статистики).
// В StatisticsDashboard уже есть `detailedStats`.
// detailedStats содержит totalEarned, totalHours.
// Можно использовать их!

/**
 * Рассчитывает прогноз на основе базовых показателей и дельты
 * @param currentAvgRate Текущая средняя ставка (руб/час)
 * @param currentDailyHours Текущие средние часы в день
 * @param deltaHours Добавочные часы в день
 * @param deltaRatePercent Процент изменения ставки (например, 10 для +10%)
 */
export const calculateProjection = (
  currentAvgRate: number,
  currentDailyHours: number,
  deltaHours: number,
  deltaRatePercent: number,
  workingDaysPerMonth: number = 21
): ProjectionResult => {
  const newRate = currentAvgRate * (1 + deltaRatePercent / 100)
  const newDailyHours = Math.max(0, currentDailyHours + deltaHours) // Не может быть меньше 0
  
  const dailyIncome = newRate * newDailyHours
  const monthlyIncome = dailyIncome * workingDaysPerMonth
  const yearlyIncome = monthlyIncome * 12

  // Базовый доход (без изменений) для расчета разницы
  const baseDailyIncome = currentAvgRate * currentDailyHours
  const baseMonthlyIncome = baseDailyIncome * workingDaysPerMonth
  const baseYearlyIncome = baseMonthlyIncome * 12

  return {
    monthlyIncome,
    yearlyIncome,
    differenceMonthly: monthlyIncome - baseMonthlyIncome,
    differenceYearly: yearlyIncome - baseYearlyIncome
  }
}
