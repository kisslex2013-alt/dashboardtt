/**
 * Функции форматирования данных выплат
 */

import { formatDate, getPaymentMonth, getPeriodMonth } from './calendarHelpers'
import type { PaymentDate } from '../../../../types'

export function formatPaymentDate(payment: PaymentDate): string {
  if (payment.customDate) return payment.customDate
  const paymentMonth = getPaymentMonth(payment)
  return formatDate(payment.day, paymentMonth)
}

export function formatPeriod(payment: PaymentDate): string {
  const periodMonth = getPeriodMonth(payment)
  return `${formatDate(payment.period.start, periodMonth)}-${formatDate(payment.period.end, periodMonth)}`
}

export const defaultColors: string[] = [
  '#10B981', '#06B6D4', '#3B82F6', '#8B5CF6',
  '#F59E0B', '#EF4444', '#EC4899', '#14B8A6',
]
