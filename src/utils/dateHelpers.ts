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
 * Интерфейс для диапазона дат
 */
export interface DateRange {
  start: Date
  end: Date
  label: string
}

/**
 * Опции для настройки недели
 */
export interface WeekOptions {
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6
}

/**
 * Форматирует дату в стандартный формат YYYY-MM-DD
 */
export function formatDate(date: Date | string): string {
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
 */
export function formatTime(date: Date | string): string {
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
 */
export function formatDateTime(date: Date | string, formatStr: string = 'dd.MM.yyyy HH:mm'): string {
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
 */
export function formatRelativeDate(date: Date | string): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(dateObj)) return ''

    // Используем простую логику вместо formatDistanceToNow
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24))

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
 */
export function getTodayRange(): DateRange {
  const today = new Date()
  return {
    start: startOfDay(today),
    end: endOfDay(today),
    label: 'Сегодня',
  }
}

/**
 * Получает диапазон дат для вчерашнего дня
 */
export function getYesterdayRange(): DateRange {
  const yesterday = subDays(new Date(), 1)
  return {
    start: startOfDay(yesterday),
    end: endOfDay(yesterday),
    label: 'Вчера',
  }
}

/**
 * Получает диапазон дат для текущей недели
 */
export function getCurrentWeekRange(options: WeekOptions = { weekStartsOn: 1 }): DateRange {
  const today = new Date()
  return {
    start: startOfWeek(today, options),
    end: endOfWeek(today, options),
    label: 'Текущая неделя',
  }
}

/**
 * Получает диапазон дат для предыдущей недели
 */
export function getPreviousWeekRange(options: WeekOptions = { weekStartsOn: 1 }): DateRange {
  const lastWeek = subWeeks(new Date(), 1)
  return {
    start: startOfWeek(lastWeek, options),
    end: endOfWeek(lastWeek, options),
    label: 'Предыдущая неделя',
  }
}

/**
 * Получает диапазон дат для текущего месяца
 */
export function getCurrentMonthRange(): DateRange {
  const today = new Date()
  return {
    start: startOfMonth(today),
    end: endOfMonth(today),
    label: 'Текущий месяц',
  }
}

/**
 * Получает диапазон дат для предыдущего месяца
 */
export function getPreviousMonthRange(): DateRange {
  const lastMonth = subMonths(new Date(), 1)
  return {
    start: startOfMonth(lastMonth),
    end: endOfMonth(lastMonth),
    label: 'Предыдущий месяц',
  }
}

/**
 * Получает диапазон дат для текущего года
 */
export function getCurrentYearRange(): DateRange {
  const today = new Date()
  return {
    start: startOfYear(today),
    end: endOfYear(today),
    label: 'Текущий год',
  }
}

/**
 * Получает диапазон дат для предыдущего года
 */
export function getPreviousYearRange(): DateRange {
  const lastYear = subYears(new Date(), 1)
  return {
    start: startOfYear(lastYear),
    end: endOfYear(lastYear),
    label: 'Предыдущий год',
  }
}

/**
 * Получает диапазон дат для последних N дней
 */
export function getLastDaysRange(days: number): DateRange {
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
 */
export function getLastWeeksRange(weeks: number): DateRange {
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
 */
export function getLastMonthsRange(months: number): DateRange {
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
 */
export function isDateToday(date: Date | string): boolean {
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
 */
export function isDateYesterday(date: Date | string): boolean {
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
 */
export function isDateThisWeek(date: Date | string): boolean {
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
 */
export function isDateThisMonth(date: Date | string): boolean {
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
 */
export function isDateThisYear(date: Date | string): boolean {
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
 */
export function getDaysDifference(date1: Date | string, date2: Date | string): number {
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
 */
export function getHoursDifference(date1: Date | string, date2: Date | string): number {
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
 */
export function getMinutesDifference(date1: Date | string, date2: Date | string): number {
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
 */
export function getPredefinedRanges(): DateRange[] {
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
 */
export function getRangeByName(rangeName: string): DateRange | null {
  const ranges: Record<string, DateRange> = {
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
 */
export function generateDateRange(startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = []
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
 */
export function getDayOfWeekName(date: Date | string): string {
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
 */
export function getMonthName(date: Date | string): string {
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
 */
export function isValidDate(date: Date | string): boolean {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    return isValid(dateObj)
  } catch (error) {
    return false
  }
}

/**
 * Конвертирует строку даты в объект Date
 */
export function parseDateString(dateString: string): Date | null {
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
 */
export function timeToMinutes(timeStr: string): number {
  if (!timeStr || !timeStr.includes(':')) return 0
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Получает текущую дату в формате YYYY-MM-DD
 */
export function getTodayString(): string {
  return formatDate(new Date())
}

/**
 * Форматирует дату в короткий формат DD.MM
 */
export function formatDateShort(date: Date | string): string {
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
 */
export function safeParseDate(dateInput: Date | string | null | undefined): Date | null {
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

