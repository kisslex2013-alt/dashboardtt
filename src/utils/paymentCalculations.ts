/**
 * 🎯 Утилиты для расчета выплат
 */

import { calculateWorkingDaysInMonth } from './calculations'
import { safeParseDate, formatDateShort } from './dateHelpers'
import type { TimeEntry, PaymentDate, SettingsState } from '../types'

interface PaymentPeriod {
  start: Date
  end: Date
  paymentDate: Date
  year: number
  month: number
}

interface ValidationResult {
  isValid: boolean
  errors: string[]
}

/**
 * Рассчитывает период выплаты с учетом смещения месяца
 */
export function calculatePaymentPeriod(
  payment: PaymentDate,
  currentYear: number,
  currentMonth: number
): PaymentPeriod {
  // Если periodMonth сохранён, используем его для периода
  // Иначе вычисляем на основе monthOffset
  let periodMonth: number
  let periodYear: number
  
  if (payment.period?.periodMonth !== undefined) {
    // Используем сохранённый месяц периода
    periodMonth = payment.period.periodMonth
    periodYear = currentYear
    // Если сохранённый месяц больше текущего, то это период прошлого года
    if (periodMonth > currentMonth) {
      periodYear = currentYear - 1
    }
  } else {
    // Fallback на старую логику с monthOffset
    const targetMonth = currentMonth + payment.monthOffset
    periodYear = currentYear + Math.floor(targetMonth / 12)
    periodMonth = ((targetMonth % 12) + 12) % 12
  }

  const lastDayOfMonth = new Date(periodYear, periodMonth + 1, 0).getDate()

  const paymentDay = Math.min(payment.day, lastDayOfMonth)
  const periodStart = Math.min(payment.period.start, lastDayOfMonth)
  const periodEnd = Math.min(payment.period.end, lastDayOfMonth)

  // Дата выплаты - в текущем месяце или как указано в customDate
  let paymentDate: Date
  if (payment.customDate) {
    const [day, month] = payment.customDate.split('.').map(Number)
    paymentDate = new Date(currentYear, month - 1, day)
  } else {
    paymentDate = new Date(currentYear, currentMonth, paymentDay)
  }

  return {
    start: new Date(periodYear, periodMonth, periodStart),
    end: new Date(periodYear, periodMonth, periodEnd),
    paymentDate,
    year: periodYear,
    month: periodMonth,
  }
}

/**
 * Фильтрует записи по периоду выплаты
 */
export function getFilteredEntriesForPayment(
  entries: TimeEntry[],
  payment: PaymentDate,
  currentYear: number,
  currentMonth: number
): TimeEntry[] {
  const { start, end } = calculatePaymentPeriod(payment, currentYear, currentMonth)

  return entries.filter(entry => {
    if (!entry.date) return false

    const entryDate = safeParseDate(entry.date)
    if (!entryDate) return false

    return entryDate >= start && entryDate <= end
  })
}

/**
 * Рассчитывает рабочие дни в периоде выплаты
 */
export function calculateWorkingDaysInPaymentPeriod(
  payment: PaymentDate,
  currentYear: number,
  currentMonth: number,
  settings: Partial<SettingsState>
): number {
  const { start, end, year, month } = calculatePaymentPeriod(payment, currentYear, currentMonth)

  return calculateWorkingDaysInMonth(year, month, start.getDate(), end.getDate(), settings)
}

/**
 * Форматирует дату выплаты для отображения
 */
export function formatPaymentDate(
  payment: PaymentDate,
  currentYear: number,
  currentMonth: number
): string {
  if (payment.customDate && payment.customDate.trim() !== '') {
    return payment.customDate.trim()
  }
  const { paymentDate } = calculatePaymentPeriod(payment, currentYear, currentMonth)
  return formatDateShort(paymentDate)
}

/**
 * Валидирует настройки выплаты
 */
export function validatePaymentDate(
  payment: Partial<PaymentDate>,
  allPayments: PaymentDate[] = []
): ValidationResult {
  const errors: string[] = []

  if (payment.customDate && payment.customDate.trim() !== '') {
    const datePattern = /^\d{1,2}\.\d{1,2}$/
    if (!datePattern.test(payment.customDate.trim())) {
      errors.push('Дата выплаты должна быть в формате ДД.ММ (например: 25.11)')
    } else {
      const [day, month] = payment.customDate.trim().split('.').map(Number)
      if (day < 1 || day > 31) {
        errors.push('День в дате выплаты должен быть от 1 до 31')
      }
      if (month < 1 || month > 12) {
        errors.push('Месяц в дате выплаты должен быть от 1 до 12')
      }
    }
  } else {
    if (typeof payment.day !== 'number' || payment.day < 1 || payment.day > 31) {
      errors.push('День месяца должен быть от 1 до 31')
    }
  }

  if (!payment.period || typeof payment.period !== 'object') {
    errors.push('Период должен быть объектом с полями start и end')
  } else {
    if (typeof payment.period.start !== 'number' || payment.period.start < 1 || payment.period.start > 31) {
      errors.push('Начало периода должно быть от 1 до 31')
    }
    if (typeof payment.period.end !== 'number' || payment.period.end < 1 || payment.period.end > 31) {
      errors.push('Конец периода должен быть от 1 до 31')
    }
    if (payment.period.start > payment.period.end) {
      errors.push('Начало периода не может быть больше конца')
    }
  }

  if (!payment.name || typeof payment.name !== 'string' || payment.name.trim().length === 0) {
    errors.push('Название выплаты обязательно')
  }

  if (!payment.color || typeof payment.color !== 'string') {
    errors.push('Цвет должен быть строкой в формате hex (#RRGGBB)')
  } else if (!/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(payment.color)) {
    errors.push('Цвет должен быть в формате hex (#RRGGBB)')
  }

  if (payment.enabled !== false && payment.id && payment.period && payment.monthOffset !== undefined) {
    const paymentIdString = String(payment.id)
    const otherPayments = allPayments.filter(p => String(p.id) !== paymentIdString && p.enabled)

    const hasOverlap = otherPayments.some(other => {
      if (other.monthOffset === payment.monthOffset) {
        return (
          (payment.period!.start >= other.period.start && payment.period!.start <= other.period.end) ||
          (payment.period!.end >= other.period.start && payment.period!.end <= other.period.end) ||
          (payment.period!.start <= other.period.start && payment.period!.end >= other.period.end)
        )
      }
      return false
    })

    if (hasOverlap) {
      errors.push('Период пересекается с другой выплатой')
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}
