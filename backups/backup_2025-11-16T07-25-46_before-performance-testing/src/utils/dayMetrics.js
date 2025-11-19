/**
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 *
 * Этот файл содержит утилиты для расчета метрик за день:
 * - Максимальная сессия (самая длинная непрерывная работа)
 * - Максимальный перерыв (самый длинный промежуток между сессиями)
 * - Средняя ставка за день
 * - Статус дня (выполнение плана)
 */

/**
 * Рассчитывает длительность в часах из времени начала и окончания
 * @param {string} start - Время начала в формате HH:MM
 * @param {string} end - Время окончания в формате HH:MM
 * @returns {number} Длительность в часах
 */
function getDurationInHours(start, end) {
  if (!start || !end) return 0

  const [startH, startM] = start.split(':').map(Number)
  const [endH, endM] = end.split(':').map(Number)

  const startMinutes = startH * 60 + startM
  const endMinutes = endH * 60 + endM

  // Если окончание раньше начала (работа через полночь), добавляем 24 часа
  const minutes =
    endMinutes >= startMinutes ? endMinutes - startMinutes : 24 * 60 - startMinutes + endMinutes

  return minutes / 60
}

/**
 * Форматирует часы в формат "H:MM"
 * @param {number} hours - количество часов (может быть дробным)
 * @returns {string} Форматированное время в формате "H:MM"
 */
export function formatHoursToTime(hours) {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return `${h}:${m.toString().padStart(2, '0')}`
}

/**
 * Рассчитывает максимальную сессию (самую длинную непрерывную работу) за день
 * @param {Array} entries - массив записей за день
 * @returns {string} Максимальная сессия в формате "H:MM" или "0:00"
 */
export function calculateLongestSession(entries) {
  if (!entries || entries.length === 0) return '0:00'

  let maxDuration = 0

  entries.forEach(entry => {
    let duration = 0

    // Если есть поле duration, используем его
    if (entry.duration) {
      duration = parseFloat(entry.duration)
    }
    // Иначе рассчитываем из start и end
    else if (entry.start && entry.end) {
      duration = getDurationInHours(entry.start, entry.end)
    }

    if (duration > maxDuration) {
      maxDuration = duration
    }
  })

  // Преобразуем часы в формат "H:MM"
  const hours = Math.floor(maxDuration)
  const minutes = Math.round((maxDuration - hours) * 60)

  return `${hours}:${minutes.toString().padStart(2, '0')}`
}

/**
 * Рассчитывает общее время перерывов за день (сумма всех перерывов между записями)
 * @param {Array} entries - массив записей за день, отсортированный по времени начала
 * @returns {string} Общее время перерывов в формате "H:MM" или "0:00"
 */
export function calculateTotalBreaks(entries) {
  if (!entries || entries.length <= 1) return '0:00'

  // Сортируем записи по времени начала
  const sortedEntries = [...entries].sort((a, b) => {
    if (!a.start || !b.start) return 0
    const [aH, aM] = a.start.split(':').map(Number)
    const [bH, bM] = b.start.split(':').map(Number)
    const aMinutes = aH * 60 + aM
    const bMinutes = bH * 60 + bM
    return aMinutes - bMinutes
  })

  let totalBreakMinutes = 0

  // Суммируем все промежутки между соседними записями
  for (let i = 0; i < sortedEntries.length - 1; i++) {
    const currentEnd = sortedEntries[i].end
    const nextStart = sortedEntries[i + 1].start

    if (currentEnd && nextStart) {
      const breakDuration = getDurationInHours(currentEnd, nextStart)
      // Переводим часы в минуты и суммируем
      totalBreakMinutes += breakDuration * 60
    }
  }

  // Преобразуем минуты в формат "H:MM"
  const hours = Math.floor(totalBreakMinutes / 60)
  const minutes = totalBreakMinutes % 60

  return `${hours}:${minutes.toString().padStart(2, '0')}`
}

/**
 * Рассчитывает максимальный перерыв (самый длинный промежуток между сессиями) за день
 * @param {Array} entries - массив записей за день, отсортированный по времени начала
 * @returns {string} Максимальный перерыв в формате "H:MM" или "0:00"
 */
export function calculateLongestBreak(entries) {
  if (!entries || entries.length <= 1) return '0:00'

  // Сортируем записи по времени начала
  const sortedEntries = [...entries].sort((a, b) => {
    if (!a.start || !b.start) return 0
    const [aH, aM] = a.start.split(':').map(Number)
    const [bH, bM] = b.start.split(':').map(Number)
    const aMinutes = aH * 60 + aM
    const bMinutes = bH * 60 + bM
    return aMinutes - bMinutes
  })

  let maxBreak = 0

  // Проверяем промежутки между соседними записями
  for (let i = 0; i < sortedEntries.length - 1; i++) {
    const currentEnd = sortedEntries[i].end
    const nextStart = sortedEntries[i + 1].start

    if (currentEnd && nextStart) {
      // Рассчитываем промежуток между окончанием текущей и началом следующей
      const breakDuration = getDurationInHours(currentEnd, nextStart)

      // Если перерыв больше текущего максимума
      if (breakDuration > maxBreak) {
        maxBreak = breakDuration
      }
    }
  }

  // Преобразуем часы в формат "H:MM"
  const hours = Math.floor(maxBreak)
  const minutes = Math.round((maxBreak - hours) * 60)

  return `${hours}:${minutes.toString().padStart(2, '0')}`
}

/**
 * Рассчитывает среднюю ставку за день
 * @param {Array} entries - массив записей за день
 * @returns {number} Средняя ставка в рублях в час (округлено до целого)
 */
export function calculateAverageRate(entries) {
  if (!entries || entries.length === 0) return 0

  let totalEarned = 0
  let totalHours = 0

  entries.forEach(entry => {
    const earned = parseFloat(entry.earned) || 0
    totalEarned += earned

    let duration = 0
    if (entry.duration) {
      duration = parseFloat(entry.duration)
    } else if (entry.start && entry.end) {
      duration = getDurationInHours(entry.start, entry.end)
    }
    totalHours += duration
  })

  // Если нет отработанных часов, возвращаем 0
  if (totalHours === 0) return 0

  // Рассчитываем среднюю ставку и округляем до целого
  const averageRate = totalEarned / totalHours
  return Math.round(averageRate)
}

/**
 * Определяет статус дня на основе выполнения плана
 * @param {number} earned - заработанная сумма за день
 * @param {number} plan - планируемая сумма за день (если нет плана, возвращает null)
 * @returns {Object} объект с статусом и цветом
 *
 * Статусы:
 * - 'success': ≥ 100% плана (зеленый)
 * - 'warning': 50-99% плана (желтый)
 * - 'danger': < 50% плана (красный)
 * - null: план не задан
 */
export function getDayStatus(earned, plan) {
  if (!plan || plan === 0) {
    return {
      status: null,
      color: null,
      percent: null,
      label: null,
    }
  }

  const percent = Math.round((earned / plan) * 100)

  if (percent >= 100) {
    return {
      status: 'success',
      color: 'green',
      percent,
      label: 'План выполнен',
    }
  } else if (percent >= 50) {
    return {
      status: 'warning',
      color: 'yellow',
      percent,
      label: 'План на пути',
    }
  } else {
    return {
      status: 'danger',
      color: 'red',
      percent,
      label: 'План не выполнен',
    }
  }
}

/**
 * Получает все метрики дня за один вызов
 * @param {Array} entries - массив записей за день
 * @param {number} plan - планируемая сумма за день (опционально)
 * @returns {Object} объект со всеми метриками
 */
export function getDayMetrics(entries, plan = null) {
  if (!entries || entries.length === 0) {
    return {
      longestSession: '0:00', // Для обратной совместимости
      totalWorkTime: '0:00', // Общее время работы
      longestBreak: '0:00', // Для обратной совместимости
      totalBreaks: '0:00', // Общее время перерывов
      averageRate: 0,
      totalEarned: 0,
      totalHours: 0,
      status: getDayStatus(0, plan),
    }
  }

  // Рассчитываем итоги
  let totalEarned = 0
  let totalHours = 0

  entries.forEach(entry => {
    const earned = parseFloat(entry.earned) || 0
    totalEarned += earned

    let duration = 0
    if (entry.duration) {
      duration = parseFloat(entry.duration)
    } else if (entry.start && entry.end) {
      duration = getDurationInHours(entry.start, entry.end)
    }
    totalHours += duration
  })

  totalEarned = Math.round(totalEarned)

  return {
    longestSession: calculateLongestSession(entries), // Для обратной совместимости
    totalWorkTime: formatHoursToTime(totalHours), // Общее время работы за день
    longestBreak: calculateLongestBreak(entries), // Для обратной совместимости
    totalBreaks: calculateTotalBreaks(entries), // Общее время перерывов
    averageRate: calculateAverageRate(entries),
    totalEarned,
    totalHours: parseFloat(totalHours.toFixed(2)),
    status: getDayStatus(totalEarned, plan),
  }
}
