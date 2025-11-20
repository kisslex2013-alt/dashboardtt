/**
 * 📝 Утилита для логирования
 * - Централизованное логирование с уровнями
 * - Условное логирование (только в development)
 * - Форматированный вывод
 */

const isDevelopment = import.meta.env.DEV

/**
 * Проверяет, включен ли режим отладки
 * @returns true если debugMode включен
 */
function isDebugMode(): boolean {
  try {
    // Используем только переменную окружения для избежания circular dependencies
    // В production можно добавить проверку настроек через динамический импорт
    return import.meta.env.DEV || false
  } catch (error) {
    // Если не удалось получить настройки, используем переменную окружения
    return import.meta.env.DEV || false
  }
}

/**
 * Логирование уровней
 */
export const logger = {
  /**
   * Обычное информационное сообщение
   */
  log: (...args: any[]): void => {
    if (isDevelopment) {
      console.log(...args)
    }
  },

  /**
   * Информация (синий цвет)
   */
  info: (...args: any[]): void => {
    if (isDevelopment) {
      console.info('ℹ️', ...args)
    }
  },

  /**
   * Предупреждение (желтый цвет)
   */
  warn: (...args: any[]): void => {
    if (isDevelopment) {
      console.warn('⚠️', ...args)
    }
  },

  /**
   * Ошибка (красный цвет)
   */
  error: (...args: any[]): void => {
    // Ошибки всегда логируем, даже в production
    console.error('❌', ...args)
  },

  /**
   * Успех (зеленый цвет через styled console)
   */
  success: (...args: any[]): void => {
    if (isDevelopment) {
      console.log('%c✅ Success:', 'color: #10b981; font-weight: bold', ...args)
    }
  },

  /**
   * Debug (серый цвет)
   */
  debug: (...args: any[]): void => {
    if (isDevelopment) {
      console.debug('🐛', ...args)
    }
  },

  /**
   * Таблица (для объектов и массивов)
   */
  table: (data: any): void => {
    if (isDevelopment) {
      console.table(data)
    }
  },

  /**
   * Группа (для вложенного логирования)
   */
  group: (label: string): void => {
    if (isDevelopment) {
      console.group(label)
    }
  },

  /**
   * Закрыть группу
   */
  groupEnd: (): void => {
    if (isDevelopment) {
      console.groupEnd()
    }
  },

  /**
   * Время начала
   */
  time: (label: string): void => {
    if (isDevelopment) {
      console.time(label)
    }
  },

  /**
   * Время конца
   */
  timeEnd: (label: string): void => {
    if (isDevelopment) {
      console.timeEnd(label)
    }
  },

  /**
   * Логирует информацию с префиксом эмодзи (только в debug режиме)
   */
  logWithEmoji: (emoji: string, ...args: any[]): void => {
    if (isDebugMode()) {
      console.log(emoji, ...args)
    }
  },

  /**
   * Проверка режима отладки
   */
  isDebugMode,
}

/**
 * Создает логгер с префиксом компонента для удобной отладки
 *
 * @param {string} componentName - Название компонента для префикса в логах
 * @returns {object} Объект с методами логирования (log, info, warn, error, success, debug)
 *
 * @example
 * ```ts
 * const log = createLogger('MyComponent')
 * log.info('Component mounted') // Выведет: [MyComponent] ℹ️ Component mounted
 * ```
 */
export function createLogger(componentName: string) {
  return {
    log: (...args: any[]) => logger.log(`[${componentName}]`, ...args),
    info: (...args: any[]) => logger.info(`[${componentName}]`, ...args),
    warn: (...args: any[]) => logger.warn(`[${componentName}]`, ...args),
    error: (...args: any[]) => logger.error(`[${componentName}]`, ...args),
    success: (...args: any[]) => logger.success(`[${componentName}]`, ...args),
    debug: (...args: any[]) => logger.debug(`[${componentName}]`, ...args),
  }
}

// Экспорт отдельных функций для обратной совместимости
export const log = logger.log
export const error = logger.error
export const warn = logger.warn
