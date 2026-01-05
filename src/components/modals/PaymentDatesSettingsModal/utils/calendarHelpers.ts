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

/**
 * Определяет, прошла ли дата выплаты для текущего цикла
 * Возвращает true если дата выплаты уже прошла
 */
function hasPaymentDatePassed(payment: PaymentDate): boolean {
  const now = new Date()
  const currentDay = now.getDate()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  
  // Для customDate парсим дату
  if (payment.customDate) {
    const parts = payment.customDate.split('.')
    const paymentDay = parseInt(parts[0])
    const paymentMonth = parseInt(parts[1]) - 1
    // Проверяем прошла ли эта дата в текущем году
    if (currentMonth > paymentMonth || (currentMonth === paymentMonth && currentDay > paymentDay)) {
      return true
    }
    return false
  }
  
  // Вычисляем месяц выплаты относительно текущего месяца
  // Для monthOffset = 0: выплата в текущем месяце
  // Для monthOffset = 1: выплата в следующем месяце (для периода предыдущего месяца)
  const paymentDay = payment.day || 1
  
  if (payment.monthOffset === 0) {
    // Выплата в текущем месяце — проверяем прошла ли дата в этом месяце
    return currentDay > paymentDay
  } else if (payment.monthOffset === 1) {
    // Выплата в следующем месяце за период текущего месяца
    // Если мы в начале месяца — проверяем прошла ли выплата за ПРОШЛЫЙ период
    return currentDay > paymentDay
  }
  
  return false
}

export function getPaymentMonth(payment: PaymentDate): number {
  if (payment.customDate) {
    const parts = payment.customDate.split('.')
    const m = parts[1]
    if (m) return parseInt(m) - 1
  }
  
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentDay = now.getDate()
  const paymentDay = payment.day || 1
  
  if (payment.monthOffset === 0) {
    // 1/2 месяца: выплата в текущем месяце
    // Если дата выплаты прошла — переходим на следующий месяц
    if (currentDay > paymentDay) {
      return currentMonth === 11 ? 0 : currentMonth + 1
    }
    return currentMonth
  } else if (payment.monthOffset === 1) {
    // 2/2 месяца: выплата за предыдущий период приходит в текущем месяце
    // Если дата выплаты прошла — следующая выплата будет в следующем месяце
    if (currentDay > paymentDay) {
      return currentMonth === 11 ? 0 : currentMonth + 1
    }
    return currentMonth
  }
  
  // monthOffset = -1 или другое
  const paymentMonth = currentMonth + (payment.monthOffset || 0)
  if (paymentMonth > 11) return paymentMonth - 12
  if (paymentMonth < 0) return paymentMonth + 12
  return paymentMonth
}

export function getPeriodMonth(payment: PaymentDate): number {
  // Если periodMonth сохранён в period, используем его
  if (payment.period?.periodMonth !== undefined) {
    return payment.period.periodMonth
  }
  
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentDay = now.getDate()
  const paymentDay = payment.day || 1
  
  if (payment.monthOffset === 0) {
    // 1/2 месяца (1-15): период = тот же месяц что и выплата
    // Если дата выплаты прошла — период следующего месяца
    if (currentDay > paymentDay) {
      return currentMonth === 11 ? 0 : currentMonth + 1
    }
    return currentMonth
  } else if (payment.monthOffset === 1) {
    // 2/2 месяца (16-31): период = предыдущий месяц относительно выплаты
    // Выплата за декабрь (16-31.12) приходит 10 января
    // Если 10 января еще не прошло — показываем период декабря
    // Если 10 января прошло — показываем период января
    if (currentDay > paymentDay) {
      // Дата выплаты прошла — период = текущий месяц
      return currentMonth
    }
    // Дата выплаты еще не прошла — период = предыдущий месяц
    return currentMonth === 0 ? 11 : currentMonth - 1
  } else if (payment.monthOffset === -1) {
    // Выплата в предыдущем месяце — период = предыдущий месяц
    return currentMonth === 0 ? 11 : currentMonth - 1
  }
  
  return currentMonth
}

export const monthNames: string[] = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
]

export const weekDays: string[] = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
