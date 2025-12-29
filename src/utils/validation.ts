/**
 * Функции для проверки (валидации) данных
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createValidationError } from './errorHandler'
import type { TimeEntry, Category } from '../types'

export const FieldType = {
  TEXT: 'text',
  NUMBER: 'number',
  EMAIL: 'email',
  DATE: 'date',
  TIME: 'time',
  CATEGORY: 'category',
  REQUIRED: 'required',
} as const

interface ValidationResult {
  isValid: boolean
  error?: string
  value?: unknown
}

interface FormValidationResult {
  isValid: boolean
  errors: Record<string, string>
}

export function isRequired(value: unknown, fieldName: string = 'Поле'): ValidationResult {
  if (value === null || value === undefined || value === '') {
    return { isValid: false, error: `${fieldName} обязательно для заполнения` }
  }
  if (typeof value === 'string' && value.trim() === '') {
    return { isValid: false, error: `${fieldName} не может быть пустым` }
  }
  return { isValid: true }
}

export function minLength(value: unknown, min: number, fieldName: string = 'Поле'): ValidationResult {
  if (typeof value !== 'string') return { isValid: true }
  if (value.trim().length < min) {
    return { isValid: false, error: `${fieldName} должно содержать минимум ${min} символов` }
  }
  return { isValid: true }
}

export function maxLength(value: unknown, max: number, fieldName: string = 'Поле'): ValidationResult {
  if (typeof value !== 'string') return { isValid: true }
  if (value.length > max) {
    return { isValid: false, error: `${fieldName} не должно превышать ${max} символов` }
  }
  return { isValid: true }
}

export function isNumber(value: unknown, fieldName: string = 'Значение'): ValidationResult {
  const num = parseFloat(String(value))
  if (isNaN(num)) {
    return { isValid: false, error: `${fieldName} должно быть числом` }
  }
  return { isValid: true, value: num }
}

export function minValue(value: unknown, min: number, fieldName: string = 'Значение'): ValidationResult {
  const result = isNumber(value, fieldName)
  if (!result.isValid) return result

  if ((result.value as number) < min) {
    return { isValid: false, error: `${fieldName} не может быть меньше ${min}` }
  }
  return { isValid: true }
}

export function maxValue(value: unknown, max: number, fieldName: string = 'Значение'): ValidationResult {
  const result = isNumber(value, fieldName)
  if (!result.isValid) return result

  if ((result.value as number) > max) {
    return { isValid: false, error: `${fieldName} не может быть больше ${max}` }
  }
  return { isValid: true }
}

export function inRange(value: unknown, min: number, max: number, fieldName: string = 'Значение'): ValidationResult {
  const result = isNumber(value, fieldName)
  if (!result.isValid) return result

  const num = result.value as number
  if (num < min || num > max) {
    return { isValid: false, error: `${fieldName} должно быть от ${min} до ${max}` }
  }
  return { isValid: true }
}

export function isValidDate(dateString: string | null | undefined, fieldName: string = 'Дата'): ValidationResult {
  if (!dateString) {
    return { isValid: false, error: `${fieldName} обязательна` }
  }

  const date = new Date(dateString)
  if (isNaN(date.getTime())) {
    return { isValid: false, error: `${fieldName} имеет неверный формат` }
  }

  return { isValid: true, value: date }
}

export function isValidTime(timeString: string | null | undefined, fieldName: string = 'Время'): ValidationResult {
  if (!timeString) {
    return { isValid: false, error: `${fieldName} обязательно` }
  }

  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  if (!timeRegex.test(timeString)) {
    return { isValid: false, error: `${fieldName} имеет неверный формат (ожидается ЧЧ:МM)` }
  }

  return { isValid: true }
}

export function isTimeRangeValid(startTime: string, endTime: string): ValidationResult {
  const startResult = isValidTime(startTime, 'Время начала')
  if (!startResult.isValid) return startResult

  const endResult = isValidTime(endTime, 'Время окончания')
  if (!endResult.isValid) return endResult

  const startParts = startTime.split(':').map(Number)
  const endParts = endTime.split(':').map(Number)
  const startH = startParts[0] ?? 0
  const startM = startParts[1] ?? 0
  const endH = endParts[0] ?? 0
  const endM = endParts[1] ?? 0

  const startMinutes = startH * 60 + startM
  const endMinutes = endH * 60 + endM

  if (startMinutes >= endMinutes) {
    return { isValid: false, error: 'Время окончания должно быть позже времени начала' }
  }

  return { isValid: true }
}

export function checkTimeOverlap(
  date: string,
  startTime: string,
  endTime: string,
  entries: TimeEntry[],
  excludeId: string | number | null = null
): ValidationResult {
  const sameDate = entries.filter(
    entry => entry.date === date && (!excludeId || String(entry.id) !== String(excludeId))
  )

  if (sameDate.length === 0) return { isValid: true }

  const startParts = startTime.split(':').map(Number)
  const endParts = endTime.split(':').map(Number)
  const startH = startParts[0] ?? 0
  const startM = startParts[1] ?? 0
  const endH = endParts[0] ?? 0
  const endM = endParts[1] ?? 0
  const newStart = startH * 60 + startM
  const newEnd = endH * 60 + endM

  for (const entry of sameDate) {
    const eStartParts = entry.start.split(':').map(Number)
    const eEndParts = entry.end.split(':').map(Number)
    const eStartH = eStartParts[0] ?? 0
    const eStartM = eStartParts[1] ?? 0
    const eEndH = eEndParts[0] ?? 0
    const eEndM = eEndParts[1] ?? 0
    const existingStart = eStartH * 60 + eStartM
    const existingEnd = eEndH * 60 + eEndM

    const hasOverlap = newStart < existingEnd && newEnd > existingStart

    if (hasOverlap) {
      return { isValid: false, error: `Время пересекается с записью ${entry.start} - ${entry.end}` }
    }
  }

  return { isValid: true }
}

export function isValidEmail(email: string | null | undefined, fieldName: string = 'Email'): ValidationResult {
  if (!email) {
    return { isValid: false, error: `${fieldName} обязателен` }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { isValid: false, error: `${fieldName} имеет неверный формат` }
  }

  return { isValid: true }
}

export function isValidColor(color: string | null | undefined, fieldName: string = 'Цвет'): ValidationResult {
  if (!color) {
    return { isValid: false, error: `${fieldName} обязателен` }
  }

  const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
  if (!colorRegex.test(color)) {
    return { isValid: false, error: `${fieldName} должен быть в формате #RRGGBB` }
  }

  return { isValid: true }
}

interface TimeEntryData {
  date?: string
  start?: string
  end?: string
  category?: string
  description?: string
  earned?: string | number
}

export function validateTimeEntry(
  data: TimeEntryData,
  entries: TimeEntry[] = [],
  excludeId: string | number | null = null
): FormValidationResult {
  const errors: Record<string, string> = {}

  const dateResult = isValidDate(data.date, 'Дата')
  if (!dateResult.isValid && dateResult.error) errors.date = dateResult.error

  const startResult = isValidTime(data.start, 'Время начала')
  if (!startResult.isValid && startResult.error) errors.start = startResult.error

  const endResult = isValidTime(data.end, 'Время окончания')
  if (!endResult.isValid && endResult.error) errors.end = endResult.error

  if (startResult.isValid && endResult.isValid && data.start && data.end) {
    const rangeResult = isTimeRangeValid(data.start, data.end)
    if (!rangeResult.isValid && rangeResult.error) errors.end = rangeResult.error

    if (rangeResult.isValid && dateResult.isValid && data.date) {
      const overlapResult = checkTimeOverlap(data.date, data.start, data.end, entries, excludeId)
      if (!overlapResult.isValid && overlapResult.error) errors.time = overlapResult.error
    }
  }

  const categoryResult = isRequired(data.category, 'Категория')
  if (!categoryResult.isValid && categoryResult.error) errors.category = categoryResult.error

  if (data.description) {
    const descResult = maxLength(data.description, 500, 'Описание')
    if (!descResult.isValid && descResult.error) errors.description = descResult.error
  }

  if (data.earned !== undefined && data.earned !== '') {
    const earnedResult = minValue(data.earned, 0, 'Заработок')
    if (!earnedResult.isValid && earnedResult.error) errors.earned = earnedResult.error
  }

  return { isValid: Object.keys(errors).length === 0, errors }
}

interface CategoryData {
  name?: string
  color?: string
  rate?: string | number
}

export function validateCategory(
  data: CategoryData,
  existingCategories: Category[] = [],
  excludeId: string | number | null = null
): FormValidationResult {
  const errors: Record<string, string> = {}

  const nameResult = isRequired(data.name, 'Название категории')
  if (!nameResult.isValid && nameResult.error) {
    errors.name = nameResult.error
  } else if (data.name) {
    const lengthResult = minLength(data.name, 2, 'Название категории')
    if (!lengthResult.isValid && lengthResult.error) errors.name = lengthResult.error

    const maxLengthResult = maxLength(data.name, 50, 'Название категории')
    if (!maxLengthResult.isValid && maxLengthResult.error) errors.name = maxLengthResult.error

    const isDuplicate = existingCategories.some(
      cat => cat.name.toLowerCase() === data.name!.toLowerCase() && (!excludeId || String(cat.id) !== String(excludeId))
    )
    if (isDuplicate) errors.name = 'Категория с таким названием уже существует'
  }

  const colorResult = isValidColor(data.color, 'Цвет')
  if (!colorResult.isValid && colorResult.error) errors.color = colorResult.error

  if (data.rate !== undefined && data.rate !== '') {
    const rateResult = minValue(data.rate, 0, 'Ставка')
    if (!rateResult.isValid && rateResult.error) errors.rate = rateResult.error
  }

  return { isValid: Object.keys(errors).length === 0, errors }
}

interface SettingsData {
  dailyHours?: number
  dailyGoal?: number
  defaultHourlyRate?: number
}

export function validateSettings(data: SettingsData): FormValidationResult {
  const errors: Record<string, string> = {}

  if (data.dailyHours !== undefined) {
    const hoursResult = inRange(data.dailyHours, 0, 24, 'Дневная цель (часы)')
    if (!hoursResult.isValid && hoursResult.error) errors.dailyHours = hoursResult.error
  }

  if (data.dailyGoal !== undefined) {
    const goalResult = minValue(data.dailyGoal, 0, 'Дневная цель (заработок)')
    if (!goalResult.isValid && goalResult.error) errors.dailyGoal = goalResult.error
  }

  if (data.defaultHourlyRate !== undefined) {
    const rateResult = minValue(data.defaultHourlyRate, 0, 'Почасовая ставка')
    if (!rateResult.isValid && rateResult.error) errors.defaultHourlyRate = rateResult.error
  }

  return { isValid: Object.keys(errors).length === 0, errors }
}

export function formatValidationErrors(errors: Record<string, string>): string | null {
  const messages = Object.entries(errors).map(([, message]) => `• ${message}`)

  if (messages.length === 0) return null
  if (messages.length === 1) return (messages[0] ?? '').replace('• ', '')

  return messages.join('\n')
}

type ValidatorFunc = (value: unknown, ...args: unknown[]) => ValidationResult

export class Validator {
  private rules: Array<{ validator: ValidatorFunc; fieldName: string; args: unknown[] }>

  constructor() {
    this.rules = []
  }

  addRule(validator: ValidatorFunc, fieldName: string, ...args: unknown[]): this {
    this.rules.push({ validator, fieldName, args })
    return this
  }

  validate(value: unknown): ValidationResult {
    for (const rule of this.rules) {
      const result = rule.validator(value, ...rule.args)
      if (!result.isValid) return result
    }
    return { isValid: true }
  }
}
