import { calculateDuration } from './calculations'

/**
 * 📊 Утилиты для расчета автоматических инсайтов
 *
 * Анализируют данные пользователя и находят закономерности:
 * - Лучший день недели
 * - Пик продуктивности по часам
 * - Тренд заработка
 * - Самая длинная сессия
 * - Аномалии текущего дня
 */

/**
 * 1️⃣ Определяет день недели с максимальным средним заработком
 * @param {Array} entries - массив записей
 * @returns {{ day: string, avg: number }} - короткое название дня и средний заработок
 */
export function calculateBestWeekday(entries) {
  if (!entries || entries.length === 0) {
    return { day: 'Пн', avg: 0 }
  }

  // Шаг 1: Суммируем заработок по каждой уникальной дате
  const dailyTotals = entries.reduce((acc, entry) => {
    if (!acc[entry.date]) {
      acc[entry.date] = 0
    }
    acc[entry.date] += parseFloat(entry.earned) || 0
    return acc
  }, {})

  // Шаг 2: Группируем дневные суммы по дням недели
  const weekdayEarnings = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] } // 0-Вс, 1-Пн...

  for (const date in dailyTotals) {
    const dayOfWeek = new Date(date).getDay()
    weekdayEarnings[dayOfWeek].push(dailyTotals[date])
  }

  // Шаг 3: Рассчитываем средний заработок для каждого дня недели
  let bestDayIndex = 0
  let bestAvg = 0

  for (const dayIndex in weekdayEarnings) {
    const earnings = weekdayEarnings[dayIndex]
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
 * 2️⃣ Находит час дня с максимальной средней ставкой
 * @param {Array} entries - массив записей
 * @returns {{ start: string, end: string, rate: number }} - диапазон времени и ставка
 */
export function calculatePeakProductivity(entries) {
  if (!entries || entries.length === 0) {
    return { start: '09', end: '10', rate: 0 }
  }

  // Создаем массив для 24 часов
  const hourlyStats = Array(24)
    .fill()
    .map(() => ({
      totalEarned: 0,
      totalHours: 0,
    }))

  // Распределяем заработок по часам
  entries.forEach(entry => {
    if (!entry.start || !entry.end) return

    const duration = parseFloat(calculateDuration(entry.start, entry.end))
    if (duration <= 0 || isNaN(duration)) return

    const earned = parseFloat(entry.earned) || 0
    const rate = earned / duration

    // Конвертируем время в минуты
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

  // Находим час с максимальной средней ставкой
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
 * 3️⃣ Анализирует тренд заработка за последний месяц
 * @param {Array} entries - массив записей
 * @returns {{ trend: string, change: number }} - направление тренда и процент изменения
 */
export function calculateEarningsTrend(entries) {
  if (!entries || entries.length < 7) {
    return { trend: 'недостаточно данных', change: 0 }
  }

  const now = new Date()
  const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())

  // Фильтруем записи за последний месяц
  const recentEntries = entries.filter(entry => {
    const entryDate = new Date(entry.date)
    return entryDate >= monthAgo
  })

  if (recentEntries.length < 7) {
    return { trend: 'недостаточно данных', change: 0 }
  }

  // Разбиваем на 4 недели
  const weeks = [[], [], [], []]

  recentEntries.forEach(entry => {
    const entryDate = new Date(entry.date)
    const daysDiff = Math.floor((now - entryDate) / (1000 * 60 * 60 * 24))

    // Обрабатываем только записи за последние 28 дней (4 недели)
    if (daysDiff < 0 || daysDiff > 28) {
      return // Пропускаем записи из будущего или слишком старые
    }

    const weekIndex = Math.min(3, Math.max(0, Math.floor(daysDiff / 7)))
    const arrayIndex = 3 - weekIndex

    // Проверяем, что индекс в допустимом диапазоне
    if (arrayIndex >= 0 && arrayIndex < weeks.length && Array.isArray(weeks[arrayIndex])) {
      weeks[arrayIndex].push(parseFloat(entry.earned) || 0)
    }
  })

  // Считаем средний заработок по неделям
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

  if (change > 0) {
    return { trend: 'растёт', change }
  }

  return { trend: 'падает', change }
}

/**
 * 4️⃣ Находит самую длительную рабочую сессию
 * @param {Array} entries - массив записей
 * @returns {{ date: string, start: string, end: string, duration: number, earned: number } | null}
 */
export function calculateLongestSession(entries) {
  if (!entries || entries.length === 0) {
    return null
  }

  // Находим запись с максимальной длительностью
  const longestEntry = entries.reduce((max, entry) => {
    if (!entry.start || !entry.end) return max
    if (!max.start || !max.end) return entry

    const duration = parseFloat(calculateDuration(entry.start, entry.end))
    const maxDuration = parseFloat(calculateDuration(max.start, max.end))

    return duration > maxDuration ? entry : max
  }, entries[0])

  if (!longestEntry || !longestEntry.start || !longestEntry.end) {
    return null
  }

  const duration = calculateDuration(longestEntry.start, longestEntry.end)

  return {
    date: longestEntry.date,
    start: longestEntry.start,
    end: longestEntry.end,
    duration: parseFloat(duration),
    earned: parseFloat(longestEntry.earned) || 0,
  }
}

/**
 * 5️⃣ Определяет аномалию текущего дня (значительное отклонение от среднего)
 * @param {Array} entries - массив записей
 * @returns {{ type: string, percent: number, total: number } | null}
 */
export function calculateTodayAnomaly(entries) {
  if (!entries || entries.length === 0) {
    return null
  }

  const today = new Date().toISOString().split('T')[0]

  // Ищем только завершенные сессии за сегодня (где есть время окончания)
  const todayCompletedEntries = entries.filter(entry => entry.date === today && entry.end)

  // Если завершенных сессий еще нет, аномалию не показываем
  if (todayCompletedEntries.length === 0) {
    return null
  }

  const historical = entries.filter(entry => entry.date !== today)

  // Требуем минимум 5 дней с записями для адекватного сравнения
  const uniqueDates = new Set(historical.map(entry => entry.date))
  if (uniqueDates.size < 5) {
    return null
  }

  // Средний дневной заработок
  const totalHistorical = historical.reduce(
    (sum, entry) => sum + (parseFloat(entry.earned) || 0),
    0
  )
  const avgDaily = totalHistorical / uniqueDates.size

  if (avgDaily === 0) {
    return null // Избегаем деления на ноль
  }

  // Считаем сумму только по завершенным сессиям
  const todayTotal = todayCompletedEntries.reduce(
    (sum, entry) => sum + (parseFloat(entry.earned) || 0),
    0
  )

  const diff = ((todayTotal - avgDaily) / avgDaily) * 100

  // Показываем аномалию только при значительной разнице (>20%)
  if (Math.abs(diff) < 20) {
    return null
  }

  return {
    type: diff > 0 ? 'выше' : 'ниже',
    percent: Math.abs(diff).toFixed(0),
    total: todayTotal,
  }
}
