/**
 * 🎯 Утилита для расчета Productivity Score (Оценка продуктивности)
 *
 * Productivity Score - это единая метрика продуктивности от 0 до 100,
 * рассчитываемая на основе 4 факторов:
 * - Goal Completion (40%) - выполнение целей
 * - Consistency (25%) - регулярность работы
 * - Focus Time (20%) - время фокуса (длинные сессии)
 * - Break Balance (15%) - баланс перерывов
 */

import { timeToMinutes } from './dateHelpers'
import type { TimeEntry } from '../types'

interface FactorResult {
  value: number
  max: number
  percentage: number
}

interface ProductivityScoreResult {
  score: number
  factors: {
    goalCompletion: FactorResult
    consistency: FactorResult
    focusTime: FactorResult
    breakBalance: FactorResult
  }
}

/**
 * Рассчитывает длительность записи в часах
 */
function getEntryDuration(entry: TimeEntry): number {
  if (entry.duration) {
    return parseFloat(String(entry.duration))
  }
  if (entry.start && entry.end) {
    const [startH, startM] = entry.start.split(':').map(Number)
    const [endH, endM] = entry.end.split(':').map(Number)
    const startMinutes = (startH || 0) * 60 + (startM || 0)
    let endMinutes = (endH || 0) * 60 + (endM || 0)
    if (endMinutes < startMinutes) endMinutes += 24 * 60
    return (endMinutes - startMinutes) / 60
  }
  return 0
}

/**
 * Рассчитывает фактор Goal Completion (40% веса)
 */
function calculateGoalCompletion(entries: TimeEntry[], dailyGoal: number): number {
  if (!dailyGoal || dailyGoal <= 0) return 1.0

  const entriesByDay: Record<string, TimeEntry[]> = {}
  entries.forEach(entry => {
    const {date} = entry
    if (!entriesByDay[date]) {
      entriesByDay[date] = []
    }
    entriesByDay[date].push(entry)
  })

  const dayScores = Object.keys(entriesByDay).map(date => {
    const dayEntries = entriesByDay[date] ?? []
    const dayEarned = dayEntries.reduce((sum, e) => sum + (parseFloat(String(e.earned)) || 0), 0)
    return Math.min(dayEarned / dailyGoal, 1.5) / 1.5
  })

  if (dayScores.length === 0) return 0
  const avgScore = dayScores.reduce((sum, score) => sum + score, 0) / dayScores.length
  return Math.min(avgScore, 1.0)
}

/**
 * Рассчитывает фактор Consistency (25% веса)
 */
function calculateConsistency(entries: TimeEntry[], periodDays: number = 30): number {
  if (entries.length === 0) return 0

  const workedDays = new Set(entries.map(e => e.date))
  const daysWorked = workedDays.size

  const consistency = Math.min(daysWorked / periodDays, 1.0)
  return consistency
}

/**
 * Рассчитывает фактор Focus Time (20% веса)
 */
function calculateFocusTime(entries: TimeEntry[]): number {
  if (entries.length === 0) return 0

  const entriesByDay: Record<string, TimeEntry[]> = {}
  entries.forEach(entry => {
    const {date} = entry
    if (!entriesByDay[date]) {
      entriesByDay[date] = []
    }
    entriesByDay[date].push(entry)
  })

  let totalFocusTime = 0
  let totalTime = 0

  Object.keys(entriesByDay).forEach(date => {
    const dayEntries = (entriesByDay[date] ?? [])
      .filter(e => e.start && e.end)
      .sort((a, b) => {
        const aMinutes = timeToMinutes(a.start!)
        const bMinutes = timeToMinutes(b.start!)
        return aMinutes - bMinutes
      })

    if (dayEntries.length === 0) return

    let maxSessionDuration = 0
    dayEntries.forEach(entry => {
      const duration = getEntryDuration(entry)
      if (duration > maxSessionDuration) {
        maxSessionDuration = duration
      }
    })

    const dayTotalTime = dayEntries.reduce((sum, e) => sum + getEntryDuration(e), 0)
    const focusRatio = dayTotalTime > 0 ? maxSessionDuration / dayTotalTime : 0
    totalFocusTime += focusRatio
    totalTime += 1
  })

  if (totalTime === 0) return 0
  return totalFocusTime / totalTime
}

/**
 * Рассчитывает фактор Break Balance (15% веса)
 */
function calculateBreakBalance(entries: TimeEntry[]): number {
  if (entries.length <= 1) return 1.0

  const entriesByDay: Record<string, TimeEntry[]> = {}
  entries.forEach(entry => {
    const {date} = entry
    if (!entriesByDay[date]) {
      entriesByDay[date] = []
    }
    entriesByDay[date].push(entry)
  })

  let totalBreakScore = 0
  let daysWithBreaks = 0

  Object.keys(entriesByDay).forEach(date => {
    const dayEntries = (entriesByDay[date] ?? [])
      .filter(e => e.start && e.end)
      .sort((a, b) => {
        const aMinutes = timeToMinutes(a.start!)
        const bMinutes = timeToMinutes(b.start!)
        return aMinutes - bMinutes
      })

    if (dayEntries.length <= 1) {
      totalBreakScore += 1.0
      daysWithBreaks += 1
      return
    }

    let optimalBreaks = 0
    let totalBreaks = 0

    for (let i = 1; i < dayEntries.length; i++) {
      const prevEnd = timeToMinutes(dayEntries[i - 1].end!)
      const currentStart = timeToMinutes(dayEntries[i].start!)
      let breakMinutes = currentStart - prevEnd

      if (breakMinutes < 0) {
        breakMinutes = 24 * 60 - prevEnd + currentStart
      }

      if (breakMinutes > 0 && breakMinutes < 12 * 60) {
        totalBreaks += 1

        if (breakMinutes >= 5 && breakMinutes <= 30) {
          optimalBreaks += 1.0
        } else if (breakMinutes > 30 && breakMinutes <= 90) {
          optimalBreaks += 0.8
        } else if (breakMinutes > 90 && breakMinutes <= 180) {
          optimalBreaks += 0.5
        } else {
          optimalBreaks += 0.2
        }
      }
    }

    const dayBreakScore = totalBreaks > 0 ? optimalBreaks / totalBreaks : 1.0
    totalBreakScore += dayBreakScore
    daysWithBreaks += 1
  })

  if (daysWithBreaks === 0) return 1.0
  return totalBreakScore / daysWithBreaks
}

/**
 * Основная функция расчета Productivity Score
 */
export function calculateProductivityScore(
  entries: TimeEntry[],
  dailyGoal: number,
  _dailyHours: number = 8,
  periodDays: number = 30
): ProductivityScoreResult {
  const goalCompletion = calculateGoalCompletion(entries, dailyGoal)
  const consistency = calculateConsistency(entries, periodDays)
  const focusTime = calculateFocusTime(entries)
  const breakBalance = calculateBreakBalance(entries)

  const score =
    goalCompletion * 0.4 + consistency * 0.25 + focusTime * 0.2 + breakBalance * 0.15

  const scorePercent = Math.round(score * 100)

  return {
    score: scorePercent,
    factors: {
      goalCompletion: {
        value: Math.round(goalCompletion * 40),
        max: 40,
        percentage: Math.round(goalCompletion * 100),
      },
      consistency: {
        value: Math.round(consistency * 25),
        max: 25,
        percentage: Math.round(consistency * 100),
      },
      focusTime: {
        value: Math.round(focusTime * 20),
        max: 20,
        percentage: Math.round(focusTime * 100),
      },
      breakBalance: {
        value: Math.round(breakBalance * 15),
        max: 15,
        percentage: Math.round(breakBalance * 100),
      },
    },
  }
}

/**
 * Получает цвет для отображения score
 */
export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-500'
  if (score >= 60) return 'text-blue-500'
  if (score >= 40) return 'text-yellow-500'
  return 'text-red-500 dark:text-red-400'
}

/**
 * Получает цвет фона для кругового индикатора
 */
export function getScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-green-500'
  if (score >= 60) return 'bg-blue-500'
  if (score >= 40) return 'bg-yellow-500'
  return 'bg-red-500'
}

/**
 * Получает цвет прогресс-бара для фактора
 */
export function getFactorProgressColor(percentage: number): string {
  if (percentage >= 80) return 'bg-green-500'
  if (percentage >= 50) return 'bg-yellow-500'
  return 'bg-red-500'
}

/**
 * Получает цвет текста для значения фактора
 */
export function getFactorTextColor(percentage: number): string {
  if (percentage >= 80) return 'text-green-500'
  if (percentage >= 50) return 'text-yellow-500'
  return 'text-red-500 dark:text-red-400'
}
