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
 * @param hours - количество часов (может быть дробным)
 * @returns отформатированное время в формате "H:MM"
 *
 * @example
 * ```ts
 * formatHoursToTime(5.5) // "5:30"
 * formatHoursToTime(0.25) // "0:15"
 * ```
 */
export function formatHoursToTime(hours: number | null | undefined): string {
  if (!hours && hours !== 0) return '0:00'

  const h = Math.floor(Math.abs(hours))
  const m = Math.round((Math.abs(hours) - h) * 60)

  return `${h}:${m.toString().padStart(2, '0')}`
}

/**
 * Форматирует длительность в часах с 2 знаками после запятой
 * @param duration - длительность в часах
 * @returns отформатированная длительность
 *
 * @example
 * ```ts
 * formatDuration(5.5) // "5.50"
 * formatDuration('8.333') // "8.33"
 * ```
 */
export function formatDuration(duration: number | string | null | undefined): string {
  if (!duration && duration !== 0) return '0.00'
  return parseFloat(String(duration)).toFixed(2)
}

/**
 * Форматирует денежную сумму (заработок) с округлением до целого
 * @param earned - сумма заработка
 * @returns округленная сумма
 *
 * @example
 * ```ts
 * formatEarned(1234.56) // 1235
 * formatEarned('999.99') // 1000
 * ```
 */
export function formatEarned(earned: number | string | null | undefined): number {
  if (!earned && earned !== 0) return 0
  return Math.round(parseFloat(String(earned)))
}

/**
 * Форматирует ставку с округлением до целого
 * @param rate - ставка за час
 * @returns округленная ставка
 *
 * @example
 * ```ts
 * formatRate(1234.56) // 1235
 * formatRate('999.99') // 1000
 * ```
 */
export function formatRate(rate: number | string | null | undefined): number {
  if (!rate && rate !== 0) return 0
  return Math.round(parseFloat(String(rate)))
}

/**
 * Форматирует денежную сумму с символом валюты
 * @param amount - сумма
 * @param currency - символ валюты (по умолчанию '₽')
 * @returns отформатированная сумма с валютой
 *
 * @example
 * ```ts
 * formatCurrency(1234.56) // "1235 ₽"
 * formatCurrency(999.99, '$') // "1000 $"
 * ```
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  currency: string = '₽'
): string {
  const formatted = formatEarned(amount)
  return `${formatted} ${currency}`
}

/**
 * Форматирует ставку с единицей измерения
 * @param rate - ставка за час
 * @param currency - символ валюты (по умолчанию '₽')
 * @returns отформатированная ставка с единицей
 *
 * @example
 * ```ts
 * formatRateWithUnit(1234.56) // "1235 ₽/ч"
 * formatRateWithUnit(999.99, '$') // "1000 $/ч"
 * ```
 */
export function formatRateWithUnit(
  rate: number | string | null | undefined,
  currency: string = '₽'
): string {
  const formatted = formatRate(rate)
  return `${formatted} ${currency}/ч`
}

