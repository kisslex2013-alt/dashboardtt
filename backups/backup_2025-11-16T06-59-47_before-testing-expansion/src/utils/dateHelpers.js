import { logger } from './logger'

/**
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 *
 * Этот файл содержит утилиты для работы с датами и временем:
 * - Форматирование дат и времени
 * - Получение диапазонов дат (сегодня, вчера, неделя, месяц, год)
 * - Работа с периодами
 * - Конвертация между форматами
 */

import {
  format,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subDays,
  subWeeks,
  subMonths,
  subYears,
  addDays,
  isToday,
  isYesterday,
  isThisWeek,
  isThisMonth,
  isThisYear,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  parseISO,
  isValid,
  formatDistanceToNow,
} from 'date-fns'

/**
 * Форматирует дату в стандартный формат YYYY-MM-DD
 * @param {Date|string} date - дата для форматирования
 * @returns {string} отформатированная дата
 */
export function formatDate(date) {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    return isValid(dateObj) ? format(dateObj, 'yyyy-MM-dd') : ''
  } catch (error) {
    logger.error('Ошибка форматирования даты:', error)
    return ''
  }
}

/**
 * Форматирует время в формат HH:MM
 * @param {Date|string} date - дата/время для форматирования
 * @returns {string} отформатированное время
 */
export function formatTime(date) {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    return isValid(dateObj) ? format(dateObj, 'HH:mm') : ''
  } catch (error) {
    logger.error('Ошибка форматирования времени:', error)
    return ''
  }
}

/**
 * Форматирует дату и время в читаемый формат
 * @param {Date|string} date - дата для форматирования
 * @param {string} formatStr - строка формата (по умолчанию 'dd.MM.yyyy HH:mm')
 * @returns {string} отформатированная дата и время
 */
export function formatDateTime(date, formatStr = 'dd.MM.yyyy HH:mm') {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    return isValid(dateObj) ? format(dateObj, formatStr) : ''
  } catch (error) {
    logger.error('Ошибка форматирования даты и времени:', error)
    return ''
  }
}

/**
 * Форматирует дату в относительный формат (например, "2 дня назад")
 * @param {Date|string} date - дата для форматирования
 * @returns {string} относительное время
 */
export function formatRelativeDate(date) {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(dateObj)) return ''

    // Используем простую логику вместо formatDistanceToNow
    const now = new Date()
    const diffInDays = Math.floor((now - dateObj) / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) return 'сегодня'
    if (diffInDays === 1) return 'вчера'
    if (diffInDays === -1) return 'завтра'
    if (diffInDays > 0) return `${diffInDays} дней назад`
    if (diffInDays < 0) return `через ${Math.abs(diffInDays)} дней`

    return formatDistanceToNow(dateObj, { addSuffix: true })
  } catch (error) {
    logger.error('Ошибка форматирования относительной даты:', error)
    return ''
  }
}

/**
 * Получает диапазон дат для сегодняшнего дня
 * @returns {Object} объект с началом и концом дня
 */
export function getTodayRange() {
  const today = new Date()
  return {
    start: startOfDay(today),
    end: endOfDay(today),
    label: 'Сегодня',
  }
}

/**
 * Получает диапазон дат для вчерашнего дня
 * @returns {Object} объект с началом и концом дня
 */
export function getYesterdayRange() {
  const yesterday = subDays(new Date(), 1)
  return {
    start: startOfDay(yesterday),
    end: endOfDay(yesterday),
    label: 'Вчера',
  }
}

/**
 * Получает диапазон дат для текущей недели
 * @param {Object} options - опции для настройки недели
 * @returns {Object} объект с началом и концом недели
 */
export function getCurrentWeekRange(options = { weekStartsOn: 1 }) {
  const today = new Date()
  return {
    start: startOfWeek(today, options),
    end: endOfWeek(today, options),
    label: 'Текущая неделя',
  }
}

/**
 * Получает диапазон дат для предыдущей недели
 * @param {Object} options - опции для настройки недели
 * @returns {Object} объект с началом и концом недели
 */
export function getPreviousWeekRange(options = { weekStartsOn: 1 }) {
  const lastWeek = subWeeks(new Date(), 1)
  return {
    start: startOfWeek(lastWeek, options),
    end: endOfWeek(lastWeek, options),
    label: 'Предыдущая неделя',
  }
}

/**
 * Получает диапазон дат для текущего месяца
 * @returns {Object} объект с началом и концом месяца
 */
export function getCurrentMonthRange() {
  const today = new Date()
  return {
    start: startOfMonth(today),
    end: endOfMonth(today),
    label: 'Текущий месяц',
  }
}

/**
 * Получает диапазон дат для предыдущего месяца
 * @returns {Object} объект с началом и концом месяца
 */
export function getPreviousMonthRange() {
  const lastMonth = subMonths(new Date(), 1)
  return {
    start: startOfMonth(lastMonth),
    end: endOfMonth(lastMonth),
    label: 'Предыдущий месяц',
  }
}

/**
 * Получает диапазон дат для текущего года
 * @returns {Object} объект с началом и концом года
 */
export function getCurrentYearRange() {
  const today = new Date()
  return {
    start: startOfYear(today),
    end: endOfYear(today),
    label: 'Текущий год',
  }
}

/**
 * Получает диапазон дат для предыдущего года
 * @returns {Object} объект с началом и концом года
 */
export function getPreviousYearRange() {
  const lastYear = subYears(new Date(), 1)
  return {
    start: startOfYear(lastYear),
    end: endOfYear(lastYear),
    label: 'Предыдущий год',
  }
}

/**
 * Получает диапазон дат для последних N дней
 * @param {number} days - количество дней
 * @returns {Object} объект с началом и концом периода
 */
export function getLastDaysRange(days) {
  const endDate = new Date()
  const startDate = subDays(endDate, days - 1)

  return {
    start: startOfDay(startDate),
    end: endOfDay(endDate),
    label: `Последние ${days} дней`,
  }
}

/**
 * Получает диапазон дат для последних N недель
 * @param {number} weeks - количество недель
 * @returns {Object} объект с началом и концом периода
 */
export function getLastWeeksRange(weeks) {
  const endDate = new Date()
  const startDate = subWeeks(endDate, weeks - 1)

  return {
    start: startOfWeek(startDate, { weekStartsOn: 1 }),
    end: endOfWeek(endDate, { weekStartsOn: 1 }),
    label: `Последние ${weeks} недель`,
  }
}

/**
 * Получает диапазон дат для последних N месяцев
 * @param {number} months - количество месяцев
 * @returns {Object} объект с началом и концом периода
 */
export function getLastMonthsRange(months) {
  const endDate = new Date()
  const startDate = subMonths(endDate, months - 1)

  return {
    start: startOfMonth(startDate),
    end: endOfMonth(endDate),
    label: `Последние ${months} месяцев`,
  }
}

/**
 * Проверяет, является ли дата сегодняшней
 * @param {Date|string} date - дата для проверки
 * @returns {boolean} true если дата сегодняшняя
 */
export function isDateToday(date) {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    return isValid(dateObj) ? isToday(dateObj) : false
  } catch (error) {
    logger.error('Ошибка проверки даты:', error)
    return false
  }
}

/**
 * Проверяет, является ли дата вчерашней
 * @param {Date|string} date - дата для проверки
 * @returns {boolean} true если дата вчерашняя
 */
export function isDateYesterday(date) {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    return isValid(dateObj) ? isYesterday(dateObj) : false
  } catch (error) {
    logger.error('Ошибка проверки даты:', error)
    return false
  }
}

/**
 * Проверяет, относится ли дата к текущей неделе
 * @param {Date|string} date - дата для проверки
 * @returns {boolean} true если дата в текущей неделе
 */
export function isDateThisWeek(date) {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    return isValid(dateObj) ? isThisWeek(dateObj) : false
  } catch (error) {
    logger.error('Ошибка проверки даты:', error)
    return false
  }
}

/**
 * Проверяет, относится ли дата к текущему месяцу
 * @param {Date|string} date - дата для проверки
 * @returns {boolean} true если дата в текущем месяце
 */
export function isDateThisMonth(date) {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    return isValid(dateObj) ? isThisMonth(dateObj) : false
  } catch (error) {
    logger.error('Ошибка проверки даты:', error)
    return false
  }
}

/**
 * Проверяет, относится ли дата к текущему году
 * @param {Date|string} date - дата для проверки
 * @returns {boolean} true если дата в текущем году
 */
export function isDateThisYear(date) {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    return isValid(dateObj) ? isThisYear(dateObj) : false
  } catch (error) {
    logger.error('Ошибка проверки даты:', error)
    return false
  }
}

/**
 * Рассчитывает разность в днях между двумя датами
 * @param {Date|string} date1 - первая дата
 * @param {Date|string} date2 - вторая дата
 * @returns {number} разность в днях
 */
export function getDaysDifference(date1, date2) {
  try {
    const dateObj1 = typeof date1 === 'string' ? parseISO(date1) : date1
    const dateObj2 = typeof date2 === 'string' ? parseISO(date2) : date2

    if (!isValid(dateObj1) || !isValid(dateObj2)) return 0

    return differenceInDays(dateObj1, dateObj2)
  } catch (error) {
    logger.error('Ошибка расчета разности дней:', error)
    return 0
  }
}

/**
 * Рассчитывает разность в часах между двумя датами
 * @param {Date|string} date1 - первая дата
 * @param {Date|string} date2 - вторая дата
 * @returns {number} разность в часах
 */
export function getHoursDifference(date1, date2) {
  try {
    const dateObj1 = typeof date1 === 'string' ? parseISO(date1) : date1
    const dateObj2 = typeof date2 === 'string' ? parseISO(date2) : date2

    if (!isValid(dateObj1) || !isValid(dateObj2)) return 0

    return differenceInHours(dateObj1, dateObj2)
  } catch (error) {
    logger.error('Ошибка расчета разности часов:', error)
    return 0
  }
}

/**
 * Рассчитывает разность в минутах между двумя датами
 * @param {Date|string} date1 - первая дата
 * @param {Date|string} date2 - вторая дата
 * @returns {number} разность в минутах
 */
export function getMinutesDifference(date1, date2) {
  try {
    const dateObj1 = typeof date1 === 'string' ? parseISO(date1) : date1
    const dateObj2 = typeof date2 === 'string' ? parseISO(date2) : date2

    if (!isValid(dateObj1) || !isValid(dateObj2)) return 0

    return differenceInMinutes(dateObj1, dateObj2)
  } catch (error) {
    logger.error('Ошибка расчета разности минут:', error)
    return 0
  }
}

/**
 * Получает все предустановленные диапазоны дат
 * @returns {Array} массив объектов с диапазонами дат
 */
export function getPredefinedRanges() {
  return [
    getTodayRange(),
    getYesterdayRange(),
    getCurrentWeekRange(),
    getPreviousWeekRange(),
    getCurrentMonthRange(),
    getPreviousMonthRange(),
    getCurrentYearRange(),
    getPreviousYearRange(),
    getLastDaysRange(7),
    getLastDaysRange(30),
    getLastWeeksRange(4),
    getLastMonthsRange(3),
    getLastMonthsRange(6),
    getLastMonthsRange(12),
  ]
}

/**
 * Получает диапазон дат по названию
 * @param {string} rangeName - название диапазона
 * @returns {Object|null} объект с диапазоном дат или null
 */
export function getRangeByName(rangeName) {
  const ranges = {
    today: getTodayRange(),
    yesterday: getYesterdayRange(),
    'current-week': getCurrentWeekRange(),
    'previous-week': getPreviousWeekRange(),
    'current-month': getCurrentMonthRange(),
    'previous-month': getPreviousMonthRange(),
    'current-year': getCurrentYearRange(),
    'previous-year': getPreviousYearRange(),
    'last-7-days': getLastDaysRange(7),
    'last-30-days': getLastDaysRange(30),
    'last-4-weeks': getLastWeeksRange(4),
    'last-3-months': getLastMonthsRange(3),
    'last-6-months': getLastMonthsRange(6),
    'last-12-months': getLastMonthsRange(12),
  }

  return ranges[rangeName] || null
}

/**
 * Генерирует массив дат в диапазоне
 * @param {Date} startDate - начальная дата
 * @param {Date} endDate - конечная дата
 * @returns {Array} массив дат
 */
export function generateDateRange(startDate, endDate) {
  const dates = []
  let currentDate = startOfDay(startDate)
  const end = endOfDay(endDate)

  while (currentDate <= end) {
    dates.push(new Date(currentDate))
    currentDate = addDays(currentDate, 1)
  }

  return dates
}

/**
 * Получает название дня недели на русском языке
 * @param {Date|string} date - дата
 * @returns {string} название дня недели
 */
export function getDayOfWeekName(date) {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(dateObj)) return ''

    const dayNames = [
      'Воскресенье',
      'Понедельник',
      'Вторник',
      'Среда',
      'Четверг',
      'Пятница',
      'Суббота',
    ]
    return dayNames[dateObj.getDay()]
  } catch (error) {
    logger.error('Ошибка получения названия дня недели:', error)
    return ''
  }
}

/**
 * Получает название месяца на русском языке
 * @param {Date|string} date - дата
 * @returns {string} название месяца
 */
export function getMonthName(date) {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(dateObj)) return ''

    const monthNames = [
      'Январь',
      'Февраль',
      'Март',
      'Апрель',
      'Май',
      'Июнь',
      'Июль',
      'Август',
      'Сентябрь',
      'Октябрь',
      'Ноябрь',
      'Декабрь',
    ]
    return monthNames[dateObj.getMonth()]
  } catch (error) {
    logger.error('Ошибка получения названия месяца:', error)
    return ''
  }
}

/**
 * Проверяет валидность даты
 * @param {Date|string} date - дата для проверки
 * @returns {boolean} true если дата валидна
 */
export function isValidDate(date) {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    return isValid(dateObj)
  } catch (error) {
    return false
  }
}

/**
 * Конвертирует строку даты в объект Date
 * @param {string} dateString - строка даты
 * @returns {Date|null} объект Date или null
 */
export function parseDateString(dateString) {
  try {
    const dateObj = parseISO(dateString)
    return isValid(dateObj) ? dateObj : null
  } catch (error) {
    logger.error('Ошибка парсинга даты:', error)
    return null
  }
}

/**
 * Конвертирует время из формата HH:MM в минуты
 * @param {string} timeStr - время в формате HH:MM
 * @returns {number} количество минут от начала дня
 */
export function timeToMinutes(timeStr) {
  if (!timeStr || !timeStr.includes(':')) return 0
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Получает текущую дату в формате YYYY-MM-DD
 * @returns {string} текущая дата в формате YYYY-MM-DD
 */
export function getTodayString() {
  return formatDate(new Date())
}

/**
 * Форматирует дату в короткий формат DD.MM
 * @param {Date|string} date - дата для форматирования
 * @returns {string} отформатированная дата в формате DD.MM
 */
export function formatDateShort(date) {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    return isValid(dateObj) ? format(dateObj, 'dd.MM') : ''
  } catch (error) {
    logger.error('Ошибка форматирования короткой даты:', error)
    return ''
  }
}

/**
 * Безопасно парсит дату из строки или Date объекта
 * @param {Date|string} dateInput - дата для парсинга
 * @returns {Date|null} объект Date или null если невалидна
 */
export function safeParseDate(dateInput) {
  if (!dateInput) return null

  // Если уже Date объект, проверяем валидность
  if (dateInput instanceof Date) {
    return isValid(dateInput) ? dateInput : null
  }

  // Если строка, используем parseDateString
  if (typeof dateInput === 'string') {
    return parseDateString(dateInput)
  }

  return null
}
