/**
 * 🔧 Web Worker для тяжелых вычислений
 *
 * Выполняет статистические расчеты в отдельном потоке,
 * чтобы не блокировать UI при работе с большими массивами данных
 */

// Импортируем функции расчетов (они должны быть чистыми функциями без зависимостей от DOM/React)
// В Web Worker нельзя использовать React, DOM API, но можно использовать чистые функции

/**
 * Рассчитывает длительность работы в часах
 */
function calculateDuration(startTime, endTime) {
  const [startHours, startMinutes] = startTime.split(':').map(Number)
  const [endHours, endMinutes] = endTime.split(':').map(Number)

  const startTotalMinutes = startHours * 60 + startMinutes
  const endTotalMinutes = endHours * 60 + endMinutes

  const durationMinutes = endTotalMinutes - startTotalMinutes
  return durationMinutes / 60
}

/**
 * Рассчитывает статистику за период
 */
function calculateDetailedStats(data, filter) {
  if (!data || data.length === 0) {
    return {
      totalHours: 0,
      totalEarned: 0,
      avgRate: 0,
      daysWorked: 0,
      totalBreaks: 0,
      daysOff: 0,
    }
  }

  let totalHours = 0
  let totalEarned = 0
  const workedDays = new Set()
  let totalBreakMinutes = 0

  // Сортируем записи по дате и времени для правильного расчета перерывов
  const sortedEntries = [...data].sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date)
    if (dateCompare !== 0) return dateCompare
    return (a.start || '').localeCompare(b.start || '')
  })

  // Обрабатываем записи
  sortedEntries.forEach((entry, index) => {
    // Добавляем дату в множество рабочих дней
    workedDays.add(entry.date)

    // Рассчитываем длительность
    let duration = 0
    if (entry.duration) {
      duration = parseFloat(entry.duration) || 0
    } else if (entry.start && entry.end) {
      duration = calculateDuration(entry.start, entry.end)
    }
    totalHours += duration

    // Добавляем заработок
    totalEarned += parseFloat(entry.earned) || 0

    // Рассчитываем перерывы между записями в один день
    if (index < sortedEntries.length - 1) {
      const nextEntry = sortedEntries[index + 1]
      if (nextEntry.date === entry.date && entry.end && nextEntry.start) {
        const breakDuration = calculateDuration(entry.end, nextEntry.start)
        if (breakDuration > 0 && breakDuration < 24) {
          // Игнорируем перерывы больше суток
          totalBreakMinutes += breakDuration * 60
        }
      }
    }
  })

  // Рассчитываем выходные дни
  let daysOff = 0
  const now = new Date()

  if (filter === 'today') {
    // Для сегодня выходных нет
    daysOff = 0
  } else if (filter === 'week') {
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay() + 1)
    startOfWeek.setHours(0, 0, 0, 0)
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    endOfWeek.setHours(23, 59, 59, 999)

    for (let d = new Date(startOfWeek); d <= endOfWeek; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0]
      if (!workedDays.has(dateStr) && d <= now) {
        daysOff++
      }
    }
  } else if (filter === 'month') {
    const year = now.getFullYear()
    const month = now.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      if (date > now) break
      const dateStr = date.toISOString().split('T')[0]
      if (!workedDays.has(dateStr)) {
        daysOff++
      }
    }
  } else if (filter === 'year') {
    const year = now.getFullYear()
    const startOfYear = new Date(year, 0, 1)
    const endOfYear = new Date(year, 11, 31)

    for (let d = new Date(startOfYear); d <= endOfYear && d <= now; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0]
      if (!workedDays.has(dateStr)) {
        daysOff++
      }
    }
  } else if (filter === 'all') {
    if (data.length > 0) {
      const firstDate = new Date(Math.min(...data.map(e => new Date(e.date))))
      const today = new Date()

      for (let d = new Date(firstDate); d <= today; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0]
        if (!workedDays.has(dateStr)) {
          daysOff++
        }
      }
    }
  }

  return {
    totalHours,
    totalEarned: Math.round(totalEarned),
    avgRate: totalHours > 0 ? Math.round(totalEarned / totalHours) : 0,
    daysWorked: workedDays.size,
    totalBreaks: totalBreakMinutes / 60,
    daysOff,
  }
}

/**
 * Рассчитывает лучший день недели по среднему заработку
 */
function calculateBestWeekday(entries) {
  if (!entries || entries.length === 0) {
    return { day: 'Пн', avg: 0 }
  }

  const dailyTotals = entries.reduce((acc, entry) => {
    if (!acc[entry.date]) {
      acc[entry.date] = 0
    }
    acc[entry.date] += parseFloat(entry.earned) || 0
    return acc
  }, {})

  const weekdayEarnings = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] }

  for (const date in dailyTotals) {
    const dayOfWeek = new Date(date).getDay()
    weekdayEarnings[dayOfWeek].push(dailyTotals[date])
  }

  let bestDayIndex = 0
  let bestAvg = 0

  for (const dayIndex in weekdayEarnings) {
    const earnings = weekdayEarnings[dayIndex]
    if (earnings.length > 0) {
      const total = earnings.reduce((sum, val) => sum + val, 0)
      const avg = total / earnings.length
      if (avg > bestAvg) {
        bestAvg = avg
        bestDayIndex = parseInt(dayIndex)
      }
    }
  }

  const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
  return {
    day: dayNames[bestDayIndex],
    avg: Math.round(bestAvg),
  }
}

/**
 * Рассчитывает пик продуктивности по часам
 * Возвращает формат как в insightsCalculations.js: { start, end, rate }
 */
function calculatePeakProductivity(entries) {
  if (!entries || entries.length === 0) {
    return { start: 9, end: 10, rate: 0 }
  }

  const hourlyData = {}
  for (let hour = 0; hour < 24; hour++) {
    hourlyData[hour] = {
      totalHours: 0,
      totalEarned: 0,
      entriesCount: 0,
    }
  }

  entries.forEach(entry => {
    if (entry.start) {
      const startHour = parseInt(entry.start.split(':')[0])
      const duration = entry.duration
        ? parseFloat(entry.duration)
        : entry.start && entry.end
          ? calculateDuration(entry.start, entry.end)
          : 0

      hourlyData[startHour].totalHours += duration
      hourlyData[startHour].totalEarned += parseFloat(entry.earned) || 0
      hourlyData[startHour].entriesCount += 1
    }
  })

  // Находим диапазон часов с максимальной эффективностью
  let bestStartHour = 9
  let bestEndHour = 10
  let bestRate = 0

  // Ищем диапазон из 2 часов с максимальной средней ставкой
  for (let start = 0; start < 23; start++) {
    let totalHours = 0
    let totalEarned = 0

    // Суммируем данные за 2 часа (start и start+1)
    for (let h = start; h <= Math.min(start + 1, 23); h++) {
      totalHours += hourlyData[h].totalHours
      totalEarned += hourlyData[h].totalEarned
    }

    if (totalHours > 0) {
      const rate = totalEarned / totalHours
      if (rate > bestRate) {
        bestRate = rate
        bestStartHour = start
        bestEndHour = Math.min(start + 1, 23)
      }
    }
  }

  return {
    start: String(bestStartHour).padStart(2, '0'),
    end: String(bestEndHour).padStart(2, '0'),
    rate: Math.round(bestRate),
  }
}

// Обработчик сообщений от основного потока
self.onmessage = function (e) {
  const { type, data, filter } = e.data

  try {
    let result

    switch (type) {
      case 'statistics':
        result = calculateDetailedStats(data, filter)
        break

      case 'bestWeekday':
        result = calculateBestWeekday(data)
        break

      case 'peakProductivity':
        result = calculatePeakProductivity(data)
        break

      case 'batch':
        // Пакетная обработка нескольких типов расчетов
        result = {
          statistics: calculateDetailedStats(data, filter),
          bestWeekday: calculateBestWeekday(data),
          peakProductivity: calculatePeakProductivity(data),
        }
        break

      default:
        throw new Error(`Unknown calculation type: ${type}`)
    }

    // Отправляем результат обратно в основной поток
    self.postMessage({
      success: true,
      type,
      result,
    })
  } catch (error) {
    // Отправляем ошибку обратно
    self.postMessage({
      success: false,
      type,
      error: error.message,
    })
  }
}
