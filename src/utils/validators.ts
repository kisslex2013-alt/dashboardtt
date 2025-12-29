/**
 * Утилиты для валидации данных
 */

import { calculateDuration } from './calculations'
import { validateTimeEntry as validateTimeEntryNew } from './validation'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { TimeEntry, Category, SettingsState, WorkSchedule } from '../types'

interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
  warnings: Record<string, string>
}

interface PasswordStrengthResult {
  score: number
  level: 'weak' | 'medium' | 'strong' | 'very-strong'
  message: string
  checks?: {
    length: boolean
    lowercase: boolean
    uppercase: boolean
    numbers: boolean
    symbols: boolean
  }
}

export function validateTimeEntry(entry: Partial<TimeEntry>): ValidationResult {
  const errors: Record<string, string> = {}
  const warnings: Record<string, string> = {}

  if (!entry.date) {
    errors.date = 'Дата обязательна'
  } else if (!isValidDate(entry.date)) {
    errors.date = 'Неверный формат даты'
  }

  if (!entry.start) {
    errors.start = 'Время начала обязательно'
  } else if (!isValidTime(entry.start)) {
    errors.start = 'Неверный формат времени начала'
  }

  if (!entry.end) {
    errors.end = 'Время окончания обязательно'
  } else if (!isValidTime(entry.end)) {
    errors.end = 'Неверный формат времени окончания'
  }

  if (!entry.category && !entry.categoryId) {
    errors.category = 'Категория обязательна'
  }

  if (entry.start && entry.end && isValidTime(entry.start) && isValidTime(entry.end)) {
    if (entry.start >= entry.end) {
      errors.timeLogic = 'Время окончания должно быть позже времени начала'
    }

    const duration = calculateDuration(entry.start, entry.end)
    if (parseFloat(duration) > 24) {
      warnings.longWork = 'Работа более 24 часов подряд'
    } else if (parseFloat(duration) > 12) {
      warnings.longWork = 'Работа более 12 часов подряд'
    }
  }

  if (entry.duration && (isNaN(Number(entry.duration)) || parseFloat(String(entry.duration)) < 0)) {
    errors.duration = 'Длительность должна быть положительным числом'
  }

  if (entry.rate && (isNaN(Number(entry.rate)) || parseFloat(String(entry.rate)) < 0)) {
    errors.rate = 'Ставка должна быть положительным числом'
  }

  if (entry.earned && (isNaN(Number(entry.earned)) || parseFloat(String(entry.earned)) < 0)) {
    errors.earned = 'Заработок должен быть положительным числом'
  }

  if (entry.description && entry.description.length > 500) {
    warnings.longDescription = 'Описание слишком длинное (более 500 символов)'
  }

  return { isValid: Object.keys(errors).length === 0, errors, warnings }
}

export function validateCategory(category: Partial<Category>): ValidationResult {
  const errors: Record<string, string> = {}
  const warnings: Record<string, string> = {}

  if (!category.name) {
    errors.name = 'Название категории обязательно'
  } else if (category.name.length < 2) {
    errors.name = 'Название категории должно содержать минимум 2 символа'
  } else if (category.name.length > 50) {
    errors.name = 'Название категории слишком длинное (максимум 50 символов)'
  }

  if (!category.rate) {
    errors.rate = 'Ставка обязательна'
  } else if (isNaN(Number(category.rate)) || parseFloat(String(category.rate)) < 0) {
    errors.rate = 'Ставка должна быть положительным числом'
  } else if (parseFloat(String(category.rate)) > 100000) {
    warnings.highRate = 'Очень высокая ставка (более 100,000 ₽/ч)'
  }

  if (category.color && !isValidColor(category.color)) {
    errors.color = 'Неверный формат цвета'
  }

  if (category.icon && typeof category.icon !== 'string') {
    errors.icon = 'Иконка должна быть строкой'
  }

  return { isValid: Object.keys(errors).length === 0, errors, warnings }
}

interface SettingsValidationData {
  theme?: string
  dailyGoal?: number
  dailyHours?: number
  notifications?: { volume?: number }
  workSchedule?: Partial<WorkSchedule>
}

export function validateSettings(settings: SettingsValidationData): ValidationResult {
  const errors: Record<string, string> = {}
  const warnings: Record<string, string> = {}

  if (settings.theme && !['light', 'dark', 'auto'].includes(settings.theme)) {
    errors.theme = 'Неверная тема. Доступны: light, dark, auto'
  }

  if (settings.dailyGoal && (isNaN(settings.dailyGoal) || settings.dailyGoal < 0)) {
    errors.dailyGoal = 'Дневная цель должна быть положительным числом'
  } else if (settings.dailyGoal && settings.dailyGoal > 100000) {
    warnings.highGoal = 'Очень высокая дневная цель (более 100,000 ₽)'
  }

  if (settings.dailyHours && (isNaN(settings.dailyHours) || settings.dailyHours < 0)) {
    errors.dailyHours = 'Дневные часы должны быть положительным числом'
  } else if (settings.dailyHours && settings.dailyHours > 24) {
    warnings.highHours = 'Дневные часы превышают 24 часа'
  }

  if (settings.notifications?.volume !== undefined) {
    const vol = settings.notifications.volume
    if (isNaN(vol) || vol < 0 || vol > 100) {
      errors.notificationVolume = 'Громкость уведомлений должна быть от 0 до 100'
    }
  }

  return { isValid: Object.keys(errors).length === 0, errors, warnings }
}

export function isValidDate(dateString: string): boolean {
  if (!dateString) return false
  const date = new Date(dateString)
  return !isNaN(date.getTime()) && /^\d{4}-\d{2}-\d{2}$/.test(dateString)
}

export function isValidTime(timeString: string): boolean {
  if (!timeString) return false
  return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeString)
}

export function isValidColor(color: string): boolean {
  if (!color) return false
  if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) return true
  if (/^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/.test(color)) return true
  if (/^rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*([01]?\.?\d*)\s*\)$/.test(color)) return true
  return false
}

export function isValidEmail(email: string): boolean {
  if (!email) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function isValidURL(url: string): boolean {
  if (!url) return false
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function isValidPhone(phone: string): boolean {
  if (!phone) return false
  const cleanPhone = phone.replace(/\D/g, '')
  return cleanPhone.length >= 7 && cleanPhone.length <= 15
}

interface FormData {
  date?: string
  start?: string
  end?: string
  category?: string
}

export function validateEntryForm(
  formData: FormData,
  entries: TimeEntry[] = [],
  excludeId: string | number | null = null
): ValidationResult {
  const result = validateTimeEntryNew(formData, entries, excludeId)
  const warnings: Record<string, string> = {}

  if (formData.date && new Date(formData.date) > new Date()) {
    warnings.futureDate = 'Выбранная дата в будущем'
  }

  if (formData.start && formData.end) {
    const startParts = formData.start.split(':')
    const endParts = formData.end.split(':')
    const startHour = parseInt(startParts[0] ?? '0')
    const endHour = parseInt(endParts[0] ?? '0')
    if (startHour >= 22 || endHour <= 6) {
      warnings.nightWork = 'Работа в ночное время'
    }
  }

  return { isValid: result.isValid, errors: result.errors, warnings }
}

interface SettingsFormData {
  theme?: string
  dailyGoal?: number
  dailyHours?: number
  notificationVolume?: number
}

export function validateSettingsForm(formData: SettingsFormData): ValidationResult {
  const errors: Record<string, string> = {}
  const warnings: Record<string, string> = {}

  if (formData.theme && !['light', 'dark', 'auto'].includes(formData.theme)) {
    errors.theme = 'Неверная тема'
  }

  if (formData.dailyGoal && (isNaN(formData.dailyGoal) || formData.dailyGoal < 0)) {
    errors.dailyGoal = 'Дневная цель должна быть положительным числом'
  }

  if (formData.dailyHours && (isNaN(formData.dailyHours) || formData.dailyHours < 0)) {
    errors.dailyHours = 'Дневные часы должны быть положительным числом'
  }

  if (
    formData.notificationVolume !== undefined &&
    (isNaN(formData.notificationVolume) || formData.notificationVolume < 0 || formData.notificationVolume > 100)
  ) {
    errors.notificationVolume = 'Громкость должна быть от 0 до 100'
  }

  return { isValid: Object.keys(errors).length === 0, errors, warnings }
}

interface ImportData {
  version?: string
  data?: {
    entries?: unknown[]
    categories?: unknown[]
    settings?: unknown
  }
}

export function validateImportData(importData: ImportData): ValidationResult {
  const errors: Record<string, string> = {}
  const warnings: Record<string, string> = {}

  if (!importData || typeof importData !== 'object') {
    errors.structure = 'Неверная структура файла'
    return { isValid: false, errors, warnings }
  }

  if (!importData.version) {
    errors.version = 'Отсутствует версия файла'
  }

  if (!importData.data || typeof importData.data !== 'object') {
    errors.data = 'Отсутствует секция данных'
    return { isValid: false, errors, warnings }
  }

  if (!Array.isArray(importData.data.entries)) {
    errors.entries = 'Записи должны быть массивом'
  }

  if (!Array.isArray(importData.data.categories)) {
    errors.categories = 'Категории должны быть массивом'
  }

  return { isValid: Object.keys(errors).length === 0, errors, warnings }
}

interface SanitizeOptions {
  removeHTML?: boolean
  trim?: boolean
  maxLength?: number
  removeSpecialChars?: boolean
}

export function sanitizeInput(input: unknown, options: SanitizeOptions = {}): string {
  if (typeof input !== 'string') return ''

  let sanitized = input

  if (options.removeHTML !== false) {
    sanitized = sanitized.replace(/<[^>]*>/g, '')
  }

  if (options.trim !== false) {
    sanitized = sanitized.trim()
  }

  if (options.maxLength) {
    sanitized = sanitized.substring(0, options.maxLength)
  }

  if (options.removeSpecialChars) {
    sanitized = sanitized.replace(/[^\w\s\u0400-\u04FF]/g, '')
  }

  return sanitized
}

export function validatePasswordStrength(password: string): PasswordStrengthResult {
  if (!password) {
    return { score: 0, level: 'weak', message: 'Пароль не введен' }
  }

  let score = 0
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    numbers: /\d/.test(password),
    symbols: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  }

  Object.values(checks).forEach(check => {
    if (check) score++
  })

  if (password.length >= 12) score++
  if (password.length >= 16) score++

  let level: PasswordStrengthResult['level']
  let message: string

  if (score <= 2) {
    level = 'weak'
    message = 'Слабый пароль'
  } else if (score <= 4) {
    level = 'medium'
    message = 'Средний пароль'
  } else if (score <= 6) {
    level = 'strong'
    message = 'Сильный пароль'
  } else {
    level = 'very-strong'
    message = 'Очень сильный пароль'
  }

  return { score, level, message, checks }
}
