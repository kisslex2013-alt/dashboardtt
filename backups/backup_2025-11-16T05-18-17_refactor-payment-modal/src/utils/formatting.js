/**
 * 📝 Утилиты для форматирования данных
 *
 * Централизованные функции форматирования для использования во всем приложении:
 * - Форматирование времени и длительности
 * - Форматирование денежных сумм
 * - Форматирование чисел
 */

/**
 * Форматирует часы в формат H:MM
 * @param {number} hours - количество часов (может быть дробным)
 * @returns {string} отформатированное время в формате "H:MM"
 *
 * @example
 * formatHoursToTime(5.5) // "5:30"
 * formatHoursToTime(0.25) // "0:15"
 */
export function formatHoursToTime(hours) {
  if (!hours && hours !== 0) return '0:00'

  const h = Math.floor(Math.abs(hours))
  const m = Math.round((Math.abs(hours) - h) * 60)

  return `${h}:${m.toString().padStart(2, '0')}`
}

/**
 * Форматирует длительность в часах с 2 знаками после запятой
 * @param {number|string} duration - длительность в часах
 * @returns {string} отформатированная длительность
 *
 * @example
 * formatDuration(5.5) // "5.50"
 * formatDuration('8.333') // "8.33"
 */
export function formatDuration(duration) {
  if (!duration && duration !== 0) return '0.00'
  return parseFloat(duration).toFixed(2)
}

/**
 * Форматирует денежную сумму (заработок) с округлением до целого
 * @param {number|string} earned - сумма заработка
 * @returns {number} округленная сумма
 *
 * @example
 * formatEarned(1234.56) // 1235
 * formatEarned('999.99') // 1000
 */
export function formatEarned(earned) {
  if (!earned && earned !== 0) return 0
  return Math.round(parseFloat(earned))
}

/**
 * Форматирует ставку с округлением до целого
 * @param {number|string} rate - ставка за час
 * @returns {number} округленная ставка
 *
 * @example
 * formatRate(1234.56) // 1235
 * formatRate('999.99') // 1000
 */
export function formatRate(rate) {
  if (!rate && rate !== 0) return 0
  return Math.round(parseFloat(rate))
}

/**
 * Форматирует денежную сумму с символом валюты
 * @param {number|string} amount - сумма
 * @param {string} currency - символ валюты (по умолчанию '₽')
 * @returns {string} отформатированная сумма с валютой
 *
 * @example
 * formatCurrency(1234.56) // "1235 ₽"
 * formatCurrency(999.99, '$') // "1000 $"
 */
export function formatCurrency(amount, currency = '₽') {
  const formatted = formatEarned(amount)
  return `${formatted} ${currency}`
}

/**
 * Форматирует ставку с единицей измерения
 * @param {number|string} rate - ставка за час
 * @param {string} currency - символ валюты (по умолчанию '₽')
 * @returns {string} отформатированная ставка с единицей
 *
 * @example
 * formatRateWithUnit(1234.56) // "1235 ₽/ч"
 * formatRateWithUnit(999.99, '$') // "1000 $/ч"
 */
export function formatRateWithUnit(rate, currency = '₽') {
  const formatted = formatRate(rate)
  return `${formatted} ${currency}/ч`
}
