/**
 * Функции форматирования данных выплат
 */

import { formatDate, getPaymentMonth, getPeriodMonth } from './calendarHelpers'

/**
 * Форматирует дату выплаты для отображения
 * @param {Object} payment - объект выплаты
 * @returns {string} отформатированная дата
 */
export function formatPaymentDate(payment) {
  if (payment.customDate) {
    return payment.customDate
  }
  const paymentMonth = getPaymentMonth(payment)
  return formatDate(payment.day, paymentMonth)
}

/**
 * Форматирует период для отображения
 * @param {Object} payment - объект выплаты
 * @returns {string} отформатированный период
 */
export function formatPeriod(payment) {
  const periodMonth = getPeriodMonth(payment)
  return `${formatDate(payment.period.start, periodMonth)}-${formatDate(payment.period.end, periodMonth)}`
}

/**
 * Цвета по умолчанию для выбора
 */
export const defaultColors = [
  '#10B981', // Зеленый
  '#06B6D4', // Голубой
  '#3B82F6', // Синий
  '#8B5CF6', // Фиолетовый
  '#F59E0B', // Оранжевый
  '#EF4444', // Красный
  '#EC4899', // Розовый
  '#14B8A6', // Бирюзовый
]

