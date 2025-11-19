import { useMemo } from 'react'

/**
 * 🗓️ Утилиты для работы с календарем рабочего графика
 */

/**
 * Получает дни недели с учетом начала недели
 */
export function getWeekDays(weekStart = 1) {
  const days = ['П', 'В', 'С', 'Ч', 'П', 'С', 'В']
  return [...days.slice(weekStart - 1), ...days.slice(0, weekStart - 1)]
}

/**
 * Генерирует календарь месяца с рабочими днями по шаблону
 */
export function generateMonthCalendar(template, workStartDay = 1) {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const calendar = []

  // Добавляем пустые ячейки в начале для правильного выравнивания
  const firstDayOfMonth = new Date(year, month, 1)
  let firstDayWeekday = firstDayOfMonth.getDay() // 0 = Sunday, 1 = Monday
  firstDayWeekday = firstDayWeekday === 0 ? 7 : firstDayWeekday // Конвертируем: 1 = Monday, 7 = Sunday

  // Добавляем пустые ячейки (с понедельника)
  for (let i = 1; i < firstDayWeekday; i++) {
    calendar.push({ day: null, isWorkDay: false })
  }

  if (template === '5/2') {
    // Стандартный график: учитываем начало рабочей недели
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      let dayOfWeek = date.getDay() // 0 = Sunday, 1 = Monday

      // Конвертируем в систему где Monday = 1
      dayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek

      // Сдвигаем относительно начального дня недели
      const adjustedDay = (dayOfWeek - workStartDay + 7) % 7

      // Первые 5 дней недели - рабочие
      const isWorkDay = adjustedDay < 5
      calendar.push({ day, isWorkDay })
    }
  } else if (template === '2/2' || template === '3/3' || template === '5/5') {
    // Сменные графики: начинаются с выбранного дня недели
    const patterns = {
      '2/2': { work: 2, total: 4 },
      '3/3': { work: 3, total: 6 },
      '5/5': { work: 5, total: 10 },
    }

    const pattern = patterns[template]

    // Находим первый день месяца, который соответствует началу рабочей недели
    let firstWorkDay = 1
    for (let day = 1; day <= 7; day++) {
      const date = new Date(year, month, day)
      let dayOfWeek = date.getDay()
      dayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek

      if (dayOfWeek === workStartDay) {
        firstWorkDay = day
        break
      }
    }

    // Рассчитываем рабочие дни относительно первого рабочего дня
    for (let day = 1; day <= daysInMonth; day++) {
      const daysSinceFirstWorkDay = day - firstWorkDay
      const cyclePosition =
        ((daysSinceFirstWorkDay % pattern.total) + pattern.total) % pattern.total
      const isWorkDay = cyclePosition < pattern.work
      calendar.push({ day, isWorkDay })
    }
  }

  return calendar
}

/**
 * Генерирует кастомный календарь с индивидуальным выбором дней
 */
export function generateCustomCalendar(customWorkDates = {}) {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const calendar = []

  // Добавляем пустые ячейки в начале
  const firstDayOfMonth = new Date(year, month, 1)
  let firstDayWeekday = firstDayOfMonth.getDay()
  firstDayWeekday = firstDayWeekday === 0 ? 7 : firstDayWeekday

  for (let i = 1; i < firstDayWeekday; i++) {
    calendar.push({ day: null, isWorkDay: false })
  }

  // Используем customWorkDates для индивидуального выбора дней
  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    // Если день не выбран явно, по умолчанию рабочий (true)
    const isWorkDay = customWorkDates[dateKey] !== false
    calendar.push({ day, isWorkDay, dateKey })
  }

  return calendar
}

/**
 * Подсчитывает количество рабочих дней в календаре
 */
export function countWorkDays(calendar) {
  return calendar.filter(d => d.day !== null && d.isWorkDay).length
}
