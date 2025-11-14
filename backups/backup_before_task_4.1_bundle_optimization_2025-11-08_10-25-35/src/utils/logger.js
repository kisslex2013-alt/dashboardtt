/**
 * 📝 Централизованная утилита для логирования
 * 
 * Используется вместо console.log/console.error для:
 * - Условного логирования (только в режиме debug)
 * - Единообразного форматирования
 * - Легкого отключения логов в production
 */

/**
 * Проверяет, включен ли режим отладки
 * @returns {boolean} true если debugMode включен
 */
function isDebugMode() {
  try {
    // Динамический импорт для избежания circular dependencies
    const { useSettingsStore } = require('../store/useSettingsStore');
    const settings = useSettingsStore.getState();
    return settings?.advanced?.debugMode === true || import.meta.env.DEV;
  } catch (error) {
    // Если не удалось получить настройки, используем переменную окружения
    return import.meta.env.DEV || false;
  }
}

/**
 * Логирует информацию (только в debug режиме)
 * @param {...any} args - аргументы для логирования
 */
export function log(...args) {
  if (isDebugMode()) {
    console.log(...args);
  }
}

/**
 * Логирует ошибку (всегда, даже в production)
 * @param {...any} args - аргументы для логирования
 */
export function error(...args) {
  console.error(...args);
}

/**
 * Логирует предупреждение (только в debug режиме)
 * @param {...any} args - аргументы для логирования
 */
export function warn(...args) {
  if (isDebugMode()) {
    console.warn(...args);
  }
}

/**
 * Логирует информацию с префиксом эмодзи (только в debug режиме)
 * @param {string} emoji - эмодзи префикс
 * @param {...any} args - аргументы для логирования
 */
export function logWithEmoji(emoji, ...args) {
  if (isDebugMode()) {
    console.log(emoji, ...args);
  }
}

/**
 * Объект-экспорт для удобного использования
 */
export const logger = {
  log,
  error,
  warn,
  logWithEmoji,
  isDebugMode,
};

