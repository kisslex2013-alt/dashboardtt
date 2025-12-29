/**
 * Вспомогательные функции для работы с календарем
 */

import type { PaymentDate } from '../../../../types'

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

export function getFirstDayOfMonth(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay()
  return day === 0 ? 6 : day - 1
}

export function formatDate(day: number, month: number): string {
  return `${day}.${(month + 1).toString().padStart(2, '0')}`
}

export function getPaymentMonth(payment: PaymentDate): number {
  if (payment.customDate) {
    const parts = payment.customDate.split('.')
    const m = parts[1]
    if (m) return parseInt(m) - 1
  }
  const now = new Date()
  const baseMonth = now.getMonth()
  const paymentMonth = baseMonth + (payment.monthOffset || 0)
  if (paymentMonth > 11) return paymentMonth - 12
  if (paymentMonth < 0) return paymentMonth + 12
  return paymentMonth
}

export function getPeriodMonth(payment: PaymentDate): number {
  const paymentMonth = getPaymentMonth(payment)
  if (payment.monthOffset === -1) {
    return paymentMonth === 0 ? 11 : paymentMonth - 1
  }
  return paymentMonth
}

export const monthNames: string[] = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
]

export const weekDays: string[] = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
