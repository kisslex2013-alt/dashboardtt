/**
 * Вспомогательные функции для работы с календарем
 */

/**
 * Получает количество дней в месяце
 * @param {number} year - год
 * @param {number} month - месяц (0-11)
 * @returns {number} количество дней
 */
export function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

/**
 * Получает день недели первого дня месяца
 * @param {number} year - год
 * @param {number} month - месяц (0-11)
 * @returns {number} день недели (0 = понедельник, 6 = воскресенье)
 */
export function getFirstDayOfMonth(year, month) {
  const day = new Date(year, month, 1).getDay()
  return day === 0 ? 6 : day - 1 // Понедельник = 0
}

/**
 * Форматирует дату в формат ДД.ММ
 * @param {number} day - день
 * @param {number} month - месяц (0-11)
 * @returns {string} отформатированная дата
 */
export function formatDate(day, month) {
  return `${day}.${(month + 1).toString().padStart(2, '0')}`
}

/**
 * Получает месяц выплаты для отображения
 * @param {Object} payment - объект выплаты
 * @returns {number} месяц (0-11)
 */
export function getPaymentMonth(payment) {
  if (payment.customDate) {
    const [d, m] = payment.customDate.split('.')
    return parseInt(m) - 1
  }
  const now = new Date()
  const baseMonth = now.getMonth()
  const paymentMonth = baseMonth + (payment.monthOffset || 0)
  if (paymentMonth > 11) return paymentMonth - 12
  if (paymentMonth < 0) return paymentMonth + 12
  return paymentMonth
}

/**
 * Получает месяц периода для отображения
 * @param {Object} payment - объект выплаты
 * @returns {number} месяц (0-11)
 */
export function getPeriodMonth(payment) {
  if (payment.period && payment.period.periodMonth !== undefined) {
    return payment.period.periodMonth
  }
  const paymentMonth = getPaymentMonth(payment)
  if (payment.monthOffset === -1) {
    return paymentMonth === 0 ? 11 : paymentMonth - 1
  }
  return paymentMonth
}

/**
 * Названия месяцев
 */
export const monthNames = [
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

/**
 * Названия дней недели
 */
export const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

