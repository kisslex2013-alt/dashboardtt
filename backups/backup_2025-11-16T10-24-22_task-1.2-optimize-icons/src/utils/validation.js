/**
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 *
 * Этот файл содержит функции для проверки (валидации) данных.
 * Перед тем как сохранить данные, мы проверяем их на правильность.
 *
 * Например:
 * - Время начала не может быть позже времени окончания
 * - Название категории не может быть пустым
 * - Ставка не может быть отрицательной
 */

import { createValidationError } from './errorHandler'

/**
 * Типы полей для валидации
 */
export const FieldType = {
  TEXT: 'text', // Обычный текст
  NUMBER: 'number', // Число
  EMAIL: 'email', // Email
  DATE: 'date', // Дата
  TIME: 'time', // Время
  CATEGORY: 'category', // Категория
  REQUIRED: 'required', // Обязательное поле
}

/**
 * Результат валидации
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - true если все поля валидны
 * @property {Object} errors - объект с ошибками по полям
 * @property {string[]} messages - массив всех сообщений об ошибках
 */

/**
 * Проверяет, что значение не пустое
 */
export function isRequired(value, fieldName = 'Поле') {
  if (value === null || value === undefined || value === '') {
    return { isValid: false, error: `${fieldName} обязательно для заполнения` }
  }
  if (typeof value === 'string' && value.trim() === '') {
    return { isValid: false, error: `${fieldName} не может быть пустым` }
  }
  return { isValid: true }
}

/**
 * Проверяет минимальную длину текста
 */
export function minLength(value, min, fieldName = 'Поле') {
  if (typeof value !== 'string') {
    return { isValid: true } // Пропускаем если не строка
  }
  if (value.trim().length < min) {
    return {
      isValid: false,
      error: `${fieldName} должно содержать минимум ${min} символов`,
    }
  }
  return { isValid: true }
}

/**
 * Проверяет максимальную длину текста
 */
export function maxLength(value, max, fieldName = 'Поле') {
  if (typeof value !== 'string') {
    return { isValid: true }
  }
  if (value.length > max) {
    return {
      isValid: false,
      error: `${fieldName} не должно превышать ${max} символов`,
    }
  }
  return { isValid: true }
}

/**
 * Проверяет, что значение - корректное число
 */
export function isNumber(value, fieldName = 'Значение') {
  const num = parseFloat(value)
  if (isNaN(num)) {
    return { isValid: false, error: `${fieldName} должно быть числом` }
  }
  return { isValid: true, value: num }
}

/**
 * Проверяет минимальное значение числа
 */
export function minValue(value, min, fieldName = 'Значение') {
  const result = isNumber(value, fieldName)
  if (!result.isValid) return result

  if (result.value < min) {
    return {
      isValid: false,
      error: `${fieldName} не может быть меньше ${min}`,
    }
  }
  return { isValid: true }
}

/**
 * Проверяет максимальное значение числа
 */
export function maxValue(value, max, fieldName = 'Значение') {
  const result = isNumber(value, fieldName)
  if (!result.isValid) return result

  if (result.value > max) {
    return {
      isValid: false,
      error: `${fieldName} не может быть больше ${max}`,
    }
  }
  return { isValid: true }
}

/**
 * Проверяет, что значение находится в заданном диапазоне
 */
export function inRange(value, min, max, fieldName = 'Значение') {
  const result = isNumber(value, fieldName)
  if (!result.isValid) return result

  if (result.value < min || result.value > max) {
    return {
      isValid: false,
      error: `${fieldName} должно быть от ${min} до ${max}`,
    }
  }
  return { isValid: true }
}

/**
 * Проверяет формат даты (YYYY-MM-DD)
 */
export function isValidDate(dateString, fieldName = 'Дата') {
  if (!dateString) {
    return { isValid: false, error: `${fieldName} обязательна` }
  }

  const date = new Date(dateString)
  if (isNaN(date.getTime())) {
    return { isValid: false, error: `${fieldName} имеет неверный формат` }
  }

  return { isValid: true, value: date }
}

/**
 * Проверяет формат времени (HH:MM)
 */
export function isValidTime(timeString, fieldName = 'Время') {
  if (!timeString) {
    return { isValid: false, error: `${fieldName} обязательно` }
  }

  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  if (!timeRegex.test(timeString)) {
    return { isValid: false, error: `${fieldName} имеет неверный формат (ожидается ЧЧ:МM)` }
  }

  return { isValid: true }
}

/**
 * Сравнивает два времени и проверяет, что startTime < endTime
 */
export function isTimeRangeValid(startTime, endTime) {
  const startResult = isValidTime(startTime, 'Время начала')
  if (!startResult.isValid) return startResult

  const endResult = isValidTime(endTime, 'Время окончания')
  if (!endResult.isValid) return endResult

  // Преобразуем в минуты для сравнения
  const [startH, startM] = startTime.split(':').map(Number)
  const [endH, endM] = endTime.split(':').map(Number)

  const startMinutes = startH * 60 + startM
  const endMinutes = endH * 60 + endM

  if (startMinutes >= endMinutes) {
    return {
      isValid: false,
      error: 'Время окончания должно быть позже времени начала',
    }
  }

  return { isValid: true }
}

/**
 * Проверяет перекрытие времени с другими записями
 */
export function checkTimeOverlap(date, startTime, endTime, entries, excludeId = null) {
  // Находим все записи на ту же дату
  const sameDate = entries.filter(
    entry => entry.date === date && (!excludeId || String(entry.id) !== String(excludeId))
  )

  if (sameDate.length === 0) {
    return { isValid: true }
  }

  // Преобразуем время в минуты
  const [startH, startM] = startTime.split(':').map(Number)
  const [endH, endM] = endTime.split(':').map(Number)
  const newStart = startH * 60 + startM
  const newEnd = endH * 60 + endM

  // Проверяем пересечение с каждой записью
  for (const entry of sameDate) {
    const [eStartH, eStartM] = entry.start.split(':').map(Number)
    const [eEndH, eEndM] = entry.end.split(':').map(Number)
    const existingStart = eStartH * 60 + eStartM
    const existingEnd = eEndH * 60 + eEndM

    // Проверка пересечения: новая запись начинается до окончания существующей
    // И новая запись заканчивается после начала существующей
    const hasOverlap = newStart < existingEnd && newEnd > existingStart

    if (hasOverlap) {
      return {
        isValid: false,
        error: `Время пересекается с записью ${entry.start} - ${entry.end}`,
      }
    }
  }

  return { isValid: true }
}

/**
 * Проверяет корректность email
 */
export function isValidEmail(email, fieldName = 'Email') {
  if (!email) {
    return { isValid: false, error: `${fieldName} обязателен` }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { isValid: false, error: `${fieldName} имеет неверный формат` }
  }

  return { isValid: true }
}

/**
 * Проверяет hex-код цвета
 */
export function isValidColor(color, fieldName = 'Цвет') {
  if (!color) {
    return { isValid: false, error: `${fieldName} обязателен` }
  }

  const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
  if (!colorRegex.test(color)) {
    return { isValid: false, error: `${fieldName} должен быть в формате #RRGGBB` }
  }

  return { isValid: true }
}

/**
 * Универсальная функция валидации для формы записи времени
 */
export function validateTimeEntry(data, entries = [], excludeId = null) {
  const errors = {}

  // Проверка даты
  const dateResult = isValidDate(data.date, 'Дата')
  if (!dateResult.isValid) {
    errors.date = dateResult.error
  }

  // Проверка времени начала
  const startResult = isValidTime(data.start, 'Время начала')
  if (!startResult.isValid) {
    errors.start = startResult.error
  }

  // Проверка времени окончания
  const endResult = isValidTime(data.end, 'Время окончания')
  if (!endResult.isValid) {
    errors.end = endResult.error
  }

  // Проверка диапазона времени
  if (startResult.isValid && endResult.isValid) {
    const rangeResult = isTimeRangeValid(data.start, data.end)
    if (!rangeResult.isValid) {
      errors.end = rangeResult.error
    }

    // Проверка перекрытия времени
    if (rangeResult.isValid && dateResult.isValid) {
      const overlapResult = checkTimeOverlap(data.date, data.start, data.end, entries, excludeId)
      if (!overlapResult.isValid) {
        errors.time = overlapResult.error
      }
    }
  }

  // Проверка категории
  const categoryResult = isRequired(data.category, 'Категория')
  if (!categoryResult.isValid) {
    errors.category = categoryResult.error
  }

  // Проверка описания (опционально, но если есть - проверяем длину)
  if (data.description) {
    const descResult = maxLength(data.description, 500, 'Описание')
    if (!descResult.isValid) {
      errors.description = descResult.error
    }
  }

  // Проверка заработка
  if (data.earned !== undefined && data.earned !== '') {
    const earnedResult = minValue(data.earned, 0, 'Заработок')
    if (!earnedResult.isValid) {
      errors.earned = earnedResult.error
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * Валидация категории
 */
export function validateCategory(data, existingCategories = [], excludeId = null) {
  const errors = {}

  // Проверка названия
  const nameResult = isRequired(data.name, 'Название категории')
  if (!nameResult.isValid) {
    errors.name = nameResult.error
  } else {
    const lengthResult = minLength(data.name, 2, 'Название категории')
    if (!lengthResult.isValid) {
      errors.name = lengthResult.error
    }

    const maxLengthResult = maxLength(data.name, 50, 'Название категории')
    if (!maxLengthResult.isValid) {
      errors.name = maxLengthResult.error
    }

    // Проверка уникальности названия
    const isDuplicate = existingCategories.some(
      cat =>
        cat.name.toLowerCase() === data.name.toLowerCase() &&
        (!excludeId || String(cat.id) !== String(excludeId))
    )
    if (isDuplicate) {
      errors.name = 'Категория с таким названием уже существует'
    }
  }

  // Проверка цвета
  const colorResult = isValidColor(data.color, 'Цвет')
  if (!colorResult.isValid) {
    errors.color = colorResult.error
  }

  // Проверка ставки (если указана)
  if (data.rate !== undefined && data.rate !== '') {
    const rateResult = minValue(data.rate, 0, 'Ставка')
    if (!rateResult.isValid) {
      errors.rate = rateResult.error
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * Валидация настроек
 */
export function validateSettings(data) {
  const errors = {}

  // Проверка дневной цели (часы)
  if (data.dailyHours !== undefined) {
    const hoursResult = inRange(data.dailyHours, 0, 24, 'Дневная цель (часы)')
    if (!hoursResult.isValid) {
      errors.dailyHours = hoursResult.error
    }
  }

  // Проверка дневной цели (заработок)
  if (data.dailyGoal !== undefined) {
    const goalResult = minValue(data.dailyGoal, 0, 'Дневная цель (заработок)')
    if (!goalResult.isValid) {
      errors.dailyGoal = goalResult.error
    }
  }

  // Проверка почасовой ставки по умолчанию
  if (data.defaultHourlyRate !== undefined) {
    const rateResult = minValue(data.defaultHourlyRate, 0, 'Почасовая ставка')
    if (!rateResult.isValid) {
      errors.defaultHourlyRate = rateResult.error
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * Создает сообщение об ошибке валидации для UI
 */
export function formatValidationErrors(errors) {
  const messages = Object.entries(errors).map(([field, message]) => {
    return `• ${message}`
  })

  if (messages.length === 0) {
    return null
  }

  if (messages.length === 1) {
    return messages[0].replace('• ', '')
  }

  return messages.join('\n')
}

/**
 * Вспомогательная функция для построения объекта с правилами валидации
 */
export class Validator {
  constructor() {
    this.rules = []
  }

  /**
   * Добавляет правило валидации
   */
  addRule(validator, fieldName, ...args) {
    this.rules.push({ validator, fieldName, args })
    return this
  }

  /**
   * Выполняет все правила валидации
   */
  validate(value) {
    for (const rule of this.rules) {
      const result = rule.validator(value, ...rule.args)
      if (!result.isValid) {
        return result
      }
    }
    return { isValid: true }
  }
}
