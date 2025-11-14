/**
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 * 
 * Этот файл содержит утилиты (helper функции):
 * - Чистые функции (pure functions) - всегда возвращают одинаковый результат
 * - Валидация входных данных
 * - Форматирование данных
 * - Обработка ошибок
 */

/**
 * Форматирует число в денежном формате
 * 
 * 🎓 ПОЯСНЕНИЕ:
 * Это чистая функция - она не изменяет входные данные и всегда возвращает
 * одинаковый результат для одинаковых входных данных.
 * 
 * @param {number|string} amount - Сумма для форматирования
 * @param {string} [currency='₽'] - Валюта
 * @returns {string} Отформатированная строка
 * 
 * @throws {Error} Если amount не является числом
 * 
 * @example
 * formatCurrency(1234.56)
 * // => "1 234.56 ₽"
 * 
 * @example
 * formatCurrency(1000, '$')
 * // => "1 000.00 $"
 */
export function formatCurrency(amount, currency = '₽') {
  // Валидация входных данных
  if (typeof amount !== 'number' && typeof amount !== 'string') {
    throw new Error('Amount must be a number or string');
  }
  
  const numAmount = parseFloat(amount);
  
  if (isNaN(numAmount)) {
    throw new Error('Amount must be a valid number');
  }
  
  // Форматирование с пробелами как разделителями тысяч
  const formatted = numAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  
  return `${formatted} ${currency}`;
}

/**
 * Валидирует email адрес
 * 
 * @param {string} email - Email для валидации
 * @returns {boolean} true если email валиден
 * 
 * @example
 * validateEmail('test@example.com')
 * // => true
 * 
 * @example
 * validateEmail('invalid-email')
 * // => false
 */
export function validateEmail(email) {
  if (typeof email !== 'string') {
    return false;
  }
  
  // Простая проверка формата email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Преобразует строку времени в минуты
 * 
 * @param {string} timeString - Время в формате "HH:MM"
 * @returns {number} Количество минут от начала дня
 * 
 * @throws {Error} Если формат времени неверный
 * 
 * @example
 * timeToMinutes('14:30')
 * // => 870 (14 * 60 + 30)
 */
export function timeToMinutes(timeString) {
  if (typeof timeString !== 'string') {
    throw new Error('Time must be a string');
  }
  
  const parts = timeString.split(':');
  
  if (parts.length !== 2) {
    throw new Error('Time must be in format "HH:MM"');
  }
  
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  
  if (isNaN(hours) || isNaN(minutes)) {
    throw new Error('Hours and minutes must be numbers');
  }
  
  if (hours < 0 || hours > 23) {
    throw new Error('Hours must be between 0 and 23');
  }
  
  if (minutes < 0 || minutes > 59) {
    throw new Error('Minutes must be between 0 and 59');
  }
  
  return hours * 60 + minutes;
}

/**
 * Округляет число до указанного количества знаков
 * 
 * @param {number} value - Значение для округления
 * @param {number} [decimals=2] - Количество знаков после запятой
 * @returns {number} Округленное значение
 * 
 * @example
 * round(3.14159, 2)
 * // => 3.14
 */
export function round(value, decimals = 2) {
  if (typeof value !== 'number') {
    throw new Error('Value must be a number');
  }
  
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * 🎓 ИТОГОВЫЕ ПРАВИЛА ДЛЯ AI:
 * 
 * 1. Все функции должны быть чистыми (pure functions)
 * 2. ВСЕГДА валидируй входные параметры
 * 3. Выбрасывай понятные ошибки (throw new Error)
 * 4. Документируй все функции в JSDoc
 * 5. Добавляй @param, @returns, @throws, @example
 * 6. Используй обучающие комментарии 🎓
 * 7. Округляй числа до нужного количества знаков
 * 8. Переиспользуй другие утилиты где возможно
 */

