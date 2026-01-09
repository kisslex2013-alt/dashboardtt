/**
 * 🛡️ Data Integrity Module
 *
 * Обеспечивает целостность и надёжность данных:
 * - Валидация TimeEntry перед сохранением
 * - Проверка целостности при старте приложения
 * - User-friendly сообщения об ошибках
 *
 * @module dataIntegrity
 */

import type { TimeEntry, Category } from '../types'
import { logger } from './logger'

// ===== Types =====

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  fixed?: Partial<TimeEntry>
}

export interface IntegrityCheckResult {
  isValid: boolean
  totalEntries: number
  validEntries: number
  invalidEntries: number
  fixedEntries: number
  errors: IntegrityError[]
  warnings: string[]
}

export interface IntegrityError {
  entryId: string
  field: string
  message: string
  severity: 'critical' | 'warning' | 'info'
  autoFixed: boolean
}

// ===== User-friendly Error Messages =====

const ERROR_MESSAGES = {
  MISSING_ID: 'Запись без идентификатора — будет создан новый',
  MISSING_DATE: 'Отсутствует дата записи',
  INVALID_DATE: 'Некорректный формат даты',
  MISSING_TIME: 'Отсутствует время начала или окончания',
  INVALID_TIME_RANGE: 'Время окончания раньше времени начала',
  MISSING_DURATION: 'Отсутствует длительность',
  NEGATIVE_DURATION: 'Длительность не может быть отрицательной',
  MISSING_EARNED: 'Отсутствует сумма заработка',
  NEGATIVE_EARNED: 'Заработок не может быть отрицательным',
  NAN_VALUE: 'Обнаружено некорректное числовое значение',
  MISSING_CATEGORY: 'Отсутствует категория — будет использована по умолчанию',
} as const

// ===== Validation Functions =====

/**
 * Проверяет, является ли значение валидным числом
 */
function isValidNumber(value: unknown): value is number {
  if (typeof value === 'number') {
    return !Number.isNaN(value) && Number.isFinite(value)
  }
  if (typeof value === 'string') {
    const num = parseFloat(value)
    return !Number.isNaN(num) && Number.isFinite(num)
  }
  return false
}

/**
 * Безопасно конвертирует значение в число
 */
function safeParseNumber(value: unknown, defaultValue = 0): number {
  if (typeof value === 'number' && isValidNumber(value)) {
    return value
  }
  if (typeof value === 'string') {
    const num = parseFloat(value)
    if (isValidNumber(num)) {
      return num
    }
  }
  return defaultValue
}

/**
 * Проверяет формат даты (YYYY-MM-DD)
 */
function isValidDateFormat(date: string): boolean {
  if (!date || typeof date !== 'string') return false
  const regex = /^\d{4}-\d{2}-\d{2}$/
  if (!regex.test(date)) return false

  const parsed = new Date(date)
  return !Number.isNaN(parsed.getTime())
}

/**
 * Проверяет формат времени (HH:MM или H:MM)
 */
function isValidTimeFormat(time: string): boolean {
  if (!time || typeof time !== 'string') return false
  // Поддерживаем как H:MM (7:30), так и HH:MM (07:30)
  const regex = /^\d{1,2}:\d{2}$/
  if (!regex.test(time)) return false

  const [hours, minutes] = time.split(':').map(Number)
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59
}

/**
 * Конвертирует время в минуты для сравнения
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

// ===== Entry Validation =====

/**
 * Валидирует одну запись TimeEntry
 * Возвращает результат валидации с возможными исправлениями
 */
export function validateEntry(entry: Partial<TimeEntry>): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const fixed: Partial<TimeEntry> = {}

  // 1. Проверка ID
  if (!entry.id) {
    warnings.push(ERROR_MESSAGES.MISSING_ID)
    // ID будет сгенерирован при сохранении
  }

  // 2. Проверка даты
  if (!entry.date) {
    errors.push(ERROR_MESSAGES.MISSING_DATE)
  } else if (!isValidDateFormat(entry.date)) {
    errors.push(ERROR_MESSAGES.INVALID_DATE)
  }

  // 3. Проверка времени
  if (!entry.start || !entry.end) {
    errors.push(ERROR_MESSAGES.MISSING_TIME)
  } else {
    if (!isValidTimeFormat(entry.start) || !isValidTimeFormat(entry.end)) {
      errors.push(ERROR_MESSAGES.INVALID_TIME_RANGE)
    } else {
      const startMinutes = timeToMinutes(entry.start)
      const endMinutes = timeToMinutes(entry.end)
      if (startMinutes >= endMinutes) {
        errors.push(ERROR_MESSAGES.INVALID_TIME_RANGE)
      }
    }
  }

  // 4. Проверка длительности
  if (entry.duration === undefined || entry.duration === null) {
    warnings.push(ERROR_MESSAGES.MISSING_DURATION)
    // Можем вычислить из start/end
    if (entry.start && entry.end && isValidTimeFormat(entry.start) && isValidTimeFormat(entry.end)) {
      const startMinutes = timeToMinutes(entry.start)
      const endMinutes = timeToMinutes(entry.end)
      if (endMinutes > startMinutes) {
        fixed.duration = ((endMinutes - startMinutes) / 60).toFixed(2)
      }
    }
  } else {
    const duration = safeParseNumber(entry.duration)
    if (!isValidNumber(entry.duration) && !isValidNumber(duration)) {
      errors.push(ERROR_MESSAGES.NAN_VALUE)
    } else if (duration < 0) {
      errors.push(ERROR_MESSAGES.NEGATIVE_DURATION)
    }
  }

  // 5. Проверка заработка
  if (entry.earned === undefined || entry.earned === null) {
    warnings.push(ERROR_MESSAGES.MISSING_EARNED)
    fixed.earned = 0
  } else {
    const earned = safeParseNumber(entry.earned)
    if (!isValidNumber(entry.earned) && !isValidNumber(earned)) {
      errors.push(ERROR_MESSAGES.NAN_VALUE)
      fixed.earned = 0
    } else if (earned < 0) {
      errors.push(ERROR_MESSAGES.NEGATIVE_EARNED)
      fixed.earned = 0
    }
  }

  // 6. Проверка ставки
  if (entry.rate !== undefined && entry.rate !== null) {
    const rate = safeParseNumber(entry.rate)
    if (!isValidNumber(rate)) {
      fixed.rate = 0
    }
  }

  // 7. Проверка категории
  if (!entry.categoryId && !entry.category) {
    warnings.push(ERROR_MESSAGES.MISSING_CATEGORY)
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    fixed: Object.keys(fixed).length > 0 ? fixed : undefined,
  }
}

/**
 * Валидирует запись и применяет автоматические исправления
 * Возвращает исправленную запись или null если критическая ошибка
 */
export function validateAndFixEntry(entry: Partial<TimeEntry>): TimeEntry | null {
  const result = validateEntry(entry)

  if (!result.isValid) {
    // Критические ошибки — запись нельзя сохранить
    logger.error('Entry validation failed', { entry, errors: result.errors })
    return null
  }

  // Применяем исправления
  const fixedEntry: TimeEntry = {
    ...entry,
    ...result.fixed,
  } as TimeEntry

  if (result.warnings.length > 0) {
    logger.warn('Entry fixed with warnings', { entry: fixedEntry, warnings: result.warnings })
  }

  return fixedEntry
}

// ===== Integrity Check =====

/**
 * Проверяет целостность массива записей
 * Используется при старте приложения
 */
export function checkEntriesIntegrity(entries: TimeEntry[]): IntegrityCheckResult {
  const errors: IntegrityError[] = []
  const warnings: string[] = []
  let validEntries = 0
  let invalidEntries = 0
  let fixedEntries = 0

  if (!Array.isArray(entries)) {
    return {
      isValid: false,
      totalEntries: 0,
      validEntries: 0,
      invalidEntries: 0,
      fixedEntries: 0,
      errors: [{
        entryId: 'root',
        field: 'entries',
        message: 'Данные записей повреждены — ожидался массив',
        severity: 'critical',
        autoFixed: false,
      }],
      warnings: [],
    }
  }

  for (const entry of entries) {
    const result = validateEntry(entry)

    if (result.isValid) {
      validEntries++
      if (result.fixed && Object.keys(result.fixed).length > 0) {
        fixedEntries++
      }
    } else {
      invalidEntries++
      result.errors.forEach(error => {
        errors.push({
          entryId: entry.id || 'unknown',
          field: 'unknown',
          message: error,
          severity: 'critical',
          autoFixed: false,
        })
      })
    }

    // Собираем предупреждения
    result.warnings.forEach(warning => {
      warnings.push(`[${entry.id || 'unknown'}] ${warning}`)
    })
  }

  const isValid = invalidEntries === 0

  if (!isValid) {
    logger.error('Entries integrity check failed', {
      total: entries.length,
      invalid: invalidEntries,
      errors: errors.slice(0, 5), // Логируем первые 5 ошибок
    })
  }

  return {
    isValid,
    totalEntries: entries.length,
    validEntries,
    invalidEntries,
    fixedEntries,
    errors,
    warnings,
  }
}

/**
 * Пытается восстановить записи с автоматическим исправлением
 * Возвращает массив исправленных записей и список удалённых
 */
export function repairEntries(entries: TimeEntry[]): {
  repaired: TimeEntry[]
  removed: string[]
  fixed: string[]
} {
  const repaired: TimeEntry[] = []
  const removed: string[] = []
  const fixed: string[] = []

  if (!Array.isArray(entries)) {
    logger.error('Cannot repair entries: invalid data type')
    return { repaired: [], removed: [], fixed: [] }
  }

  for (const entry of entries) {
    const result = validateEntry(entry)

    if (result.isValid) {
      // Запись валидна, применяем исправления если есть
      if (result.fixed && Object.keys(result.fixed).length > 0) {
        repaired.push({ ...entry, ...result.fixed } as TimeEntry)
        fixed.push(entry.id || 'unknown')
      } else {
        repaired.push(entry)
      }
    } else {
      // Запись невалидна, пытаемся исправить
      const fixedEntry = attemptDeepFix(entry)
      if (fixedEntry) {
        repaired.push(fixedEntry)
        fixed.push(entry.id || 'unknown')
        logger.info('Entry repaired', { id: entry.id })
      } else {
        // Не удалось исправить — удаляем
        removed.push(entry.id || 'unknown')
        logger.warn('Entry removed due to unfixable errors', { id: entry.id })
      }
    }
  }

  return { repaired, removed, fixed }
}

/**
 * Глубокое исправление записи
 * Пытается восстановить максимум данных
 */
function attemptDeepFix(entry: Partial<TimeEntry>): TimeEntry | null {
  // Минимальные обязательные поля
  if (!entry.date || !isValidDateFormat(entry.date)) {
    return null // Без даты запись бесполезна
  }

  if (!entry.start || !entry.end) {
    return null // Без времени запись бесполезна
  }

  if (!isValidTimeFormat(entry.start) || !isValidTimeFormat(entry.end)) {
    return null // Некорректное время
  }

  // Вычисляем/исправляем остальные поля
  const startMinutes = timeToMinutes(entry.start)
  const endMinutes = timeToMinutes(entry.end)

  if (startMinutes >= endMinutes) {
    return null // Время начала >= времени окончания
  }

  const duration = ((endMinutes - startMinutes) / 60).toFixed(2)
  const earned = safeParseNumber(entry.earned, 0)
  const rate = safeParseNumber(entry.rate, 0)

  return {
    id: entry.id || `recovered-${Date.now()}`,
    categoryId: entry.categoryId || 'default',
    category: entry.category || 'Без категории',
    date: entry.date,
    start: entry.start,
    end: entry.end,
    duration,
    earned,
    rate,
    description: entry.description || '',
    createdAt: entry.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

// ===== Utility Functions =====

/**
 * Форматирует ошибки для отображения пользователю
 */
export function formatErrorsForUser(errors: IntegrityError[]): string {
  if (errors.length === 0) return ''

  const criticalCount = errors.filter(e => e.severity === 'critical').length
  const warningCount = errors.filter(e => e.severity === 'warning').length

  let message = '⚠️ Обнаружены проблемы с данными:\n'

  if (criticalCount > 0) {
    message += `• ${criticalCount} критических ошибок\n`
  }
  if (warningCount > 0) {
    message += `• ${warningCount} предупреждений\n`
  }

  // Показываем первые 3 ошибки
  const firstErrors = errors.slice(0, 3)
  firstErrors.forEach(error => {
    message += `\n→ ${error.message}`
  })

  if (errors.length > 3) {
    message += `\n\n...и ещё ${errors.length - 3} проблем`
  }

  return message
}

/**
 * Создаёт отчёт о целостности данных
 */
export function createIntegrityReport(result: IntegrityCheckResult): string {
  const lines = [
    '📊 Отчёт о целостности данных',
    '─'.repeat(30),
    `Всего записей: ${result.totalEntries}`,
    `Валидных: ${result.validEntries}`,
    `С ошибками: ${result.invalidEntries}`,
    `Исправлено: ${result.fixedEntries}`,
  ]

  if (result.errors.length > 0) {
    lines.push('', '❌ Ошибки:')
    result.errors.slice(0, 5).forEach(error => {
      lines.push(`  • [${error.entryId}] ${error.message}`)
    })
  }

  if (result.warnings.length > 0) {
    lines.push('', '⚠️ Предупреждения:')
    result.warnings.slice(0, 5).forEach(warning => {
      lines.push(`  • ${warning}`)
    })
  }

  return lines.join('\n')
}
