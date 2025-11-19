/**
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 *
 * Этот файл - центральная система обработки ошибок.
 * Когда что-то идёт не так, мы ловим ошибку здесь и показываем
 * пользователю понятное сообщение вместо технического текста.
 */

import { logger } from './logger'

/**
 * Типы ошибок в приложении
 */
export const ErrorType = {
  NETWORK: 'network', // Проблемы с интернетом
  STORAGE: 'storage', // Проблемы с сохранением данных
  VALIDATION: 'validation', // Неправильно заполнены поля
  PERMISSION: 'permission', // Нет прав доступа
  NOT_FOUND: 'not_found', // Данные не найдены
  UNKNOWN: 'unknown', // Неизвестная ошибка
}

/**
 * Класс для создания понятных ошибок
 */
export class AppError extends Error {
  constructor(message, type = ErrorType.UNKNOWN, details = {}) {
    super(message)
    this.name = 'AppError'
    this.type = type
    this.details = details
    this.timestamp = new Date().toISOString()
  }
}

/**
 * Превращает техническую ошибку в понятное сообщение для пользователя
 */
export function getUserFriendlyMessage(error) {
  // Если это уже наша понятная ошибка
  if (error instanceof AppError) {
    return error.message
  }

  // Превращаем технические ошибки в понятные
  const errorMessage = error.message?.toLowerCase() || ''

  // Ошибки сети
  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return 'Проблема с подключением к интернету. Проверьте соединение.'
  }

  // Ошибки хранилища (localStorage переполнен)
  if (errorMessage.includes('quota') || errorMessage.includes('storage')) {
    return 'Недостаточно места для сохранения данных. Попробуйте удалить старые записи.'
  }

  // Ошибки парсинга JSON
  if (errorMessage.includes('json') || errorMessage.includes('parse')) {
    return 'Данные повреждены. Попробуйте перезагрузить страницу.'
  }

  // Ошибки прав доступа
  if (errorMessage.includes('permission') || errorMessage.includes('denied')) {
    return 'Нет доступа к этой функции. Проверьте настройки браузера.'
  }

  // Ошибки файлов
  if (errorMessage.includes('file') || errorMessage.includes('blob')) {
    return 'Проблема с файлом. Проверьте формат и размер.'
  }

  // Для всех остальных ошибок
  return 'Что-то пошло не так. Попробуйте ещё раз или перезагрузите страницу.'
}

/**
 * Главная функция обработки ошибок
 *
 * @param {Error} error - ошибка, которую нужно обработать
 * @param {Object} context - дополнительная информация (где произошла ошибка)
 * @returns {string} - понятное сообщение для пользователя
 */
export function handleError(error, context = {}) {
  // Логируем ошибку для разработчика
  logger.error('❌ Ошибка:', {
    message: error.message,
    type: error.type || 'unknown',
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  })

  // В production можно добавить отправку в Sentry или другой сервис
  // if (import.meta.env.PROD) {
  //   Sentry.captureException(error, { contexts: { custom: context } });
  // }

  // Возвращаем понятное сообщение для показа пользователю
  return getUserFriendlyMessage(error)
}

/**
 * Обёртка для async функций с автоматической обработкой ошибок
 *
 * Использование:
 * const result = await withErrorHandling(
 *   async () => await someAsyncFunction(),
 *   'Сохранение данных'
 * );
 */
export async function withErrorHandling(asyncFn, operationName = 'Операция') {
  try {
    return await asyncFn()
  } catch (error) {
    const message = handleError(error, { operation: operationName })
    throw new AppError(message, ErrorType.UNKNOWN, { originalError: error })
  }
}

/**
 * Обёртка для обычных функций с автоматической обработкой ошибок
 */
export function tryCatch(fn, operationName = 'Операция') {
  try {
    return fn()
  } catch (error) {
    const message = handleError(error, { operation: operationName })
    throw new AppError(message, ErrorType.UNKNOWN, { originalError: error })
  }
}

/**
 * Проверка доступного места в localStorage
 *
 * @returns {Object} информация о месте в localStorage
 */
export function checkStorageSpace() {
  try {
    // Пытаемся записать тестовые данные
    const testKey = '__storage_test__'
    const testData = new Array(1024).join('a') // ~1KB

    localStorage.setItem(testKey, testData)
    localStorage.removeItem(testKey)

    // Примерная оценка используемого места
    let usedSpace = 0
    for (const key in localStorage) {
      if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
        usedSpace += localStorage[key].length + key.length
      }
    }

    // localStorage обычно ~5-10MB, используем 5MB как минимум
    const totalSpace = 5 * 1024 * 1024 // 5MB в байтах
    const usedMB = (usedSpace / (1024 * 1024)).toFixed(2)
    const totalMB = (totalSpace / (1024 * 1024)).toFixed(2)
    const percentUsed = ((usedSpace / totalSpace) * 100).toFixed(1)

    return {
      available: true,
      usedSpace,
      totalSpace,
      usedMB,
      totalMB,
      percentUsed,
      hasSpace: usedSpace < totalSpace * 0.9, // Предупреждение при 90%
    }
  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      return {
        available: false,
        error: 'Хранилище переполнено',
        hasSpace: false,
      }
    }
    return {
      available: false,
      error: error.message,
      hasSpace: false,
    }
  }
}

/**
 * Создаёт ошибку валидации с понятным сообщением
 */
export function createValidationError(field, message) {
  return new AppError(message || `Поле "${field}" заполнено неправильно`, ErrorType.VALIDATION, {
    field,
  })
}

/**
 * Создаёт ошибку хранилища
 */
export function createStorageError(message, details = {}) {
  return new AppError(message || 'Не удалось сохранить данные', ErrorType.STORAGE, details)
}

/**
 * Создаёт ошибку сети
 */
export function createNetworkError(message, details = {}) {
  return new AppError(message || 'Проблема с подключением к интернету', ErrorType.NETWORK, details)
}

/**
 * Обработчик для React Error Boundary
 */
export function logErrorToService(error, errorInfo) {
  // Логируем для разработчика
  logger.error('React Error Boundary перехватил ошибку:', {
    error: error.toString(),
    componentStack: errorInfo.componentStack,
    timestamp: new Date().toISOString(),
  })

  // В production можно отправить в Sentry
  // if (import.meta.env.PROD) {
  //   Sentry.captureException(error, {
  //     contexts: { react: { componentStack: errorInfo.componentStack } }
  //   });
  // }
}
