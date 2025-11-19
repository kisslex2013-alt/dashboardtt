/**
 * 🎯 Утилита для расчета Productivity Score (Оценка продуктивности)
 *
 * Productivity Score - это единая метрика продуктивности от 0 до 100,
 * рассчитываемая на основе 4 факторов:
 * - Goal Completion (40%) - выполнение целей
 * - Consistency (25%) - регулярность работы
 * - Focus Time (20%) - время фокуса (длинные сессии)
 * - Break Balance (15%) - баланс перерывов
 *
 * @example
 * const score = calculateProductivityScore(entries, dailyGoal, dailyHours)
 * // { score: 85, factors: { goalCompletion: 0.9, consistency: 0.8, ... } }
 */

import { timeToMinutes } from './dateHelpers'

/**
 * Рассчитывает длительность записи в часах
 */
function getEntryDuration(entry) {
  if (entry.duration) {
    return parseFloat(entry.duration)
  }
  if (entry.start && entry.end) {
    const [startH, startM] = entry.start.split(':').map(Number)
    const [endH, endM] = entry.end.split(':').map(Number)
    const startMinutes = startH * 60 + startM
    let endMinutes = endH * 60 + endM
    if (endMinutes < startMinutes) endMinutes += 24 * 60
    return (endMinutes - startMinutes) / 60
  }
  return 0
}

/**
 * Рассчитывает фактор Goal Completion (40% веса)
 * Оценивает выполнение дневных целей по заработку
 */
function calculateGoalCompletion(entries, dailyGoal) {
  if (!dailyGoal || dailyGoal <= 0) return 1.0 // Если цель не установлена, считаем 100%

  // Группируем записи по дням
  const entriesByDay = {}
  entries.forEach(entry => {
    const date = entry.date
    if (!entriesByDay[date]) {
      entriesByDay[date] = []
    }
    entriesByDay[date].push(entry)
  })

  // Рассчитываем выполнение цели для каждого дня
  const dayScores = Object.keys(entriesByDay).map(date => {
    const dayEntries = entriesByDay[date]
    const dayEarned = dayEntries.reduce((sum, e) => sum + (parseFloat(e.earned) || 0), 0)
    // Ограничиваем до 150% (если перевыполнили, все равно максимум 1.0)
    return Math.min(dayEarned / dailyGoal, 1.5) / 1.5
  })

  // Средний процент выполнения цели
  if (dayScores.length === 0) return 0
  const avgScore = dayScores.reduce((sum, score) => sum + score, 0) / dayScores.length
  return Math.min(avgScore, 1.0)
}

/**
 * Рассчитывает фактор Consistency (25% веса)
 * Оценивает регулярность работы (сколько дней работал из возможных)
 */
function calculateConsistency(entries, periodDays = 30) {
  if (entries.length === 0) return 0

  // Получаем уникальные даты с записями
  const workedDays = new Set(entries.map(e => e.date))
  const daysWorked = workedDays.size

  // Рассчитываем процент дней с работой
  // Если работали больше дней, чем период, считаем 100%
  const consistency = Math.min(daysWorked / periodDays, 1.0)
  return consistency
}

/**
 * Рассчитывает фактор Focus Time (20% веса)
 * Оценивает время фокуса (длинные непрерывные сессии без перерывов)
 */
function calculateFocusTime(entries) {
  if (entries.length === 0) return 0

  // Группируем записи по дням
  const entriesByDay = {}
  entries.forEach(entry => {
    const date = entry.date
    if (!entriesByDay[date]) {
      entriesByDay[date] = []
    }
    entriesByDay[date].push(entry)
  })

  let totalFocusTime = 0
  let totalTime = 0

  // Для каждого дня находим самую длинную непрерывную сессию
  Object.keys(entriesByDay).forEach(date => {
    const dayEntries = entriesByDay[date]
      .filter(e => e.start && e.end)
      .sort((a, b) => {
        const aMinutes = timeToMinutes(a.start)
        const bMinutes = timeToMinutes(b.start)
        return aMinutes - bMinutes
      })

    if (dayEntries.length === 0) return

    // Находим самую длинную сессию
    let maxSessionDuration = 0
    dayEntries.forEach(entry => {
      const duration = getEntryDuration(entry)
      if (duration > maxSessionDuration) {
        maxSessionDuration = duration
      }
    })

    // Рассчитываем общее время за день
    const dayTotalTime = dayEntries.reduce((sum, e) => sum + getEntryDuration(e), 0)

    // Focus Time = доля самой длинной сессии от общего времени
    // Идеал: одна длинная сессия (100% focus time)
    const focusRatio = dayTotalTime > 0 ? maxSessionDuration / dayTotalTime : 0
    totalFocusTime += focusRatio
    totalTime += 1
  })

  if (totalTime === 0) return 0
  return totalFocusTime / totalTime
}

/**
 * Рассчитывает фактор Break Balance (15% веса)
 * Оценивает баланс перерывов (оптимальные перерывы между сессиями)
 */
function calculateBreakBalance(entries) {
  if (entries.length <= 1) return 1.0 // Если одна запись или нет записей, идеальный баланс

  // Группируем записи по дням
  const entriesByDay = {}
  entries.forEach(entry => {
    const date = entry.date
    if (!entriesByDay[date]) {
      entriesByDay[date] = []
    }
    entriesByDay[date].push(entry)
  })

  let totalBreakScore = 0
  let daysWithBreaks = 0

  Object.keys(entriesByDay).forEach(date => {
    const dayEntries = entriesByDay[date]
      .filter(e => e.start && e.end)
      .sort((a, b) => {
        const aMinutes = timeToMinutes(a.start)
        const bMinutes = timeToMinutes(b.start)
        return aMinutes - bMinutes
      })

    if (dayEntries.length <= 1) {
      totalBreakScore += 1.0 // Одна запись = идеальный баланс
      daysWithBreaks += 1
      return
    }

    // Рассчитываем перерывы между сессиями
    let optimalBreaks = 0
    let totalBreaks = 0

    for (let i = 1; i < dayEntries.length; i++) {
      const prevEnd = timeToMinutes(dayEntries[i - 1].end)
      const currentStart = timeToMinutes(dayEntries[i].start)
      let breakMinutes = currentStart - prevEnd

      // Если перерыв через полночь
      if (breakMinutes < 0) {
        breakMinutes = 24 * 60 - prevEnd + currentStart
      }

      // Игнорируем перерывы больше 12 часов (это не перерывы, а другой день)
      if (breakMinutes > 0 && breakMinutes < 12 * 60) {
        totalBreaks += 1

        // Оптимальный перерыв: 5-30 минут (короткий отдых)
        // Хороший перерыв: 30-90 минут (обед)
        // Приемлемый: 1-3 часа (длинный перерыв)
        if (breakMinutes >= 5 && breakMinutes <= 30) {
          optimalBreaks += 1.0 // Идеальный перерыв
        } else if (breakMinutes > 30 && breakMinutes <= 90) {
          optimalBreaks += 0.8 // Хороший перерыв
        } else if (breakMinutes > 90 && breakMinutes <= 180) {
          optimalBreaks += 0.5 // Приемлемый перерыв
        } else {
          optimalBreaks += 0.2 // Слишком короткий или длинный перерыв
        }
      }
    }

    // Рассчитываем средний балл перерывов за день
    const dayBreakScore = totalBreaks > 0 ? optimalBreaks / totalBreaks : 1.0
    totalBreakScore += dayBreakScore
    daysWithBreaks += 1
  })

  if (daysWithBreaks === 0) return 1.0
  return totalBreakScore / daysWithBreaks
}

/**
 * Основная функция расчета Productivity Score
 * @param {Array} entries - массив записей времени
 * @param {number} dailyGoal - дневная цель по заработку (₽)
 * @param {number} dailyHours - дневная норма часов
 * @param {number} periodDays - период для расчета консистентности (по умолчанию 30 дней)
 * @returns {Object} объект с общим score и разбивкой по факторам
 */
export function calculateProductivityScore(entries, dailyGoal, dailyHours = 8, periodDays = 30) {
  // Рассчитываем каждый фактор
  const goalCompletion = calculateGoalCompletion(entries, dailyGoal)
  const consistency = calculateConsistency(entries, periodDays)
  const focusTime = calculateFocusTime(entries)
  const breakBalance = calculateBreakBalance(entries)

  // Взвешенная сумма факторов
  const score =
    goalCompletion * 0.4 + consistency * 0.25 + focusTime * 0.2 + breakBalance * 0.15

  // Преобразуем в проценты (0-100)
  const scorePercent = Math.round(score * 100)

  return {
    score: scorePercent,
    factors: {
      goalCompletion: {
        value: Math.round(goalCompletion * 40), // Максимум 40 баллов
        max: 40,
        percentage: Math.round(goalCompletion * 100),
      },
      consistency: {
        value: Math.round(consistency * 25), // Максимум 25 баллов
        max: 25,
        percentage: Math.round(consistency * 100),
      },
      focusTime: {
        value: Math.round(focusTime * 20), // Максимум 20 баллов
        max: 20,
        percentage: Math.round(focusTime * 100),
      },
      breakBalance: {
        value: Math.round(breakBalance * 15), // Максимум 15 баллов
        max: 15,
        percentage: Math.round(breakBalance * 100),
      },
    },
  }
}

/**
 * Получает цвет для отображения score
 * @param {number} score - значение score (0-100)
 * @returns {string} цвет в формате Tailwind класса
 */
export function getScoreColor(score) {
  if (score >= 80) return 'text-green-500'
  if (score >= 60) return 'text-blue-500'
  if (score >= 40) return 'text-yellow-500'
  // ✅ A11Y: Улучшаем контраст для темной темы
  return 'text-red-500 dark:text-red-400'
}

/**
 * Получает цвет фона для кругового индикатора
 * @param {number} score - значение score (0-100)
 * @returns {string} цвет в формате Tailwind класса
 */
export function getScoreBgColor(score) {
  if (score >= 80) return 'bg-green-500'
  if (score >= 60) return 'bg-blue-500'
  if (score >= 40) return 'bg-yellow-500'
  return 'bg-red-500'
}

/**
 * Получает цвет прогресс-бара для фактора в зависимости от процента выполнения
 * @param {number} percentage - процент выполнения (0-100)
 * @returns {string} цвет в формате Tailwind класса
 */
export function getFactorProgressColor(percentage) {
  if (percentage >= 80) return 'bg-green-500'
  if (percentage >= 50) return 'bg-yellow-500'
  return 'bg-red-500'
}

/**
 * Получает цвет текста для значения фактора в зависимости от процента выполнения
 * @param {number} percentage - процент выполнения (0-100)
 * @returns {string} цвет в формате Tailwind класса
 */
export function getFactorTextColor(percentage) {
  if (percentage >= 80) return 'text-green-500'
  if (percentage >= 50) return 'text-yellow-500'
  // ✅ A11Y: Улучшаем контраст для темной темы
  return 'text-red-500 dark:text-red-400'
}

