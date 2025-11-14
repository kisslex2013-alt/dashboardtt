/**
 * 🎯 Утилиты для расчета выплат
 * 
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 * 
 * Эти функции помогают рассчитывать рабочие дни и планы для выплат.
 * Они учитывают настройки рабочего графика пользователя.
 * 
 * @module utils/paymentCalculations
 */

import { calculateWorkingDaysInMonth } from './calculations';
import { safeParseDate, formatDateShort } from './dateHelpers';

/**
 * Рассчитывает период выплаты с учетом смещения месяца
 * @param {Object} payment - объект выплаты
 * @param {number} currentYear - текущий год
 * @param {number} currentMonth - текущий месяц (0-11)
 * @returns {Object} объект с датами начала, конца периода и датой выплаты
 */
export function calculatePaymentPeriod(payment, currentYear, currentMonth) {
  const now = new Date();
  const targetMonth = currentMonth + payment.monthOffset;
  const targetYear = currentYear + Math.floor(targetMonth / 12);
  const adjustedMonth = ((targetMonth % 12) + 12) % 12; // Обрабатываем отрицательные значения
  
  // Получаем последний день месяца для валидации
  const lastDayOfMonth = new Date(targetYear, adjustedMonth + 1, 0).getDate();
  
  // Ограничиваем день выплаты и период последним днем месяца
  const paymentDay = Math.min(payment.day, lastDayOfMonth);
  const periodStart = Math.min(payment.period.start, lastDayOfMonth);
  const periodEnd = Math.min(payment.period.end, lastDayOfMonth);
  
  return {
    start: new Date(targetYear, adjustedMonth, periodStart),
    end: new Date(targetYear, adjustedMonth, periodEnd),
    paymentDate: new Date(targetYear, adjustedMonth, paymentDay),
    year: targetYear,
    month: adjustedMonth,
  };
}

/**
 * Фильтрует записи по периоду выплаты
 * @param {Array} entries - массив записей
 * @param {Object} payment - объект выплаты
 * @param {number} currentYear - текущий год
 * @param {number} currentMonth - текущий месяц (0-11)
 * @returns {Array} отфильтрованные записи
 */
export function getFilteredEntriesForPayment(entries, payment, currentYear, currentMonth) {
  const { start, end } = calculatePaymentPeriod(payment, currentYear, currentMonth);
  
  return entries.filter(entry => {
    if (!entry.date) return false;
    
    // ✅ ОПТИМИЗАЦИЯ: Используем централизованную функцию для парсинга даты
    const entryDate = safeParseDate(entry.date);
    if (!entryDate) return false;
    
    // Проверяем, что дата записи попадает в период выплаты
    return entryDate >= start && entryDate <= end;
  });
}

/**
 * Рассчитывает рабочие дни в периоде выплаты
 * @param {Object} payment - объект выплаты
 * @param {number} currentYear - текущий год
 * @param {number} currentMonth - текущий месяц (0-11)
 * @param {Object} settings - настройки рабочего графика
 * @returns {number} количество рабочих дней
 */
export function calculateWorkingDaysInPaymentPeriod(payment, currentYear, currentMonth, settings) {
  const { start, end, year, month } = calculatePaymentPeriod(payment, currentYear, currentMonth);
  
  // Рассчитываем рабочие дни в периоде
  return calculateWorkingDaysInMonth(
    year,
    month,
    start.getDate(),
    end.getDate(),
    settings
  );
}

/**
 * Форматирует дату выплаты для отображения
 * @param {Object} payment - объект выплаты
 * @param {number} currentYear - текущий год
 * @param {number} currentMonth - текущий месяц (0-11)
 * @returns {string} отформатированная дата
 */
export function formatPaymentDate(payment, currentYear, currentMonth) {
  const { paymentDate } = calculatePaymentPeriod(payment, currentYear, currentMonth);
  // ✅ ОПТИМИЗАЦИЯ: Используем централизованную функцию для форматирования даты
  return formatDateShort(paymentDate);
}

/**
 * Валидирует настройки выплаты
 * @param {Object} payment - объект выплаты для валидации
 * @param {Array} allPayments - все существующие выплаты (для проверки пересечений)
 * @returns {Object} результат валидации { isValid: boolean, errors: string[] }
 */
export function validatePaymentDate(payment, allPayments = []) {
  const errors = [];
  
  // Проверка дня месяца
  if (typeof payment.day !== 'number' || payment.day < 1 || payment.day > 31) {
    errors.push('День месяца должен быть от 1 до 31');
  }
  
  // Проверка периода
  if (!payment.period || typeof payment.period !== 'object') {
    errors.push('Период должен быть объектом с полями start и end');
  } else {
    if (typeof payment.period.start !== 'number' || payment.period.start < 1 || payment.period.start > 31) {
      errors.push('Начало периода должно быть от 1 до 31');
    }
    if (typeof payment.period.end !== 'number' || payment.period.end < 1 || payment.period.end > 31) {
      errors.push('Конец периода должен быть от 1 до 31');
    }
    if (payment.period.start > payment.period.end) {
      errors.push('Начало периода не может быть больше конца');
    }
  }
  
  // Проверка названия
  if (!payment.name || typeof payment.name !== 'string' || payment.name.trim().length === 0) {
    errors.push('Название выплаты обязательно');
  }
  
  // Проверка цвета
  if (!payment.color || typeof payment.color !== 'string') {
    errors.push('Цвет должен быть строкой в формате hex (#RRGGBB)');
  } else if (!/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(payment.color)) {
    errors.push('Цвет должен быть в формате hex (#RRGGBB)');
  }
  
  // Проверка пересечений с другими выплатами (только если включена)
  if (payment.enabled !== false) {
    // ✅ СТАНДАРТИЗАЦИЯ ID: Конвертируем в строку для корректного сравнения
    const paymentIdString = String(payment.id);
    const otherPayments = allPayments.filter(p => String(p.id) !== paymentIdString && p.enabled);
    
    // Проверяем пересечения периодов в том же месяце
    const hasOverlap = otherPayments.some(other => {
      // Если выплаты в одном месяце (с учетом monthOffset)
      if (other.monthOffset === payment.monthOffset) {
        // Проверяем пересечение периодов
        return (
          (payment.period.start >= other.period.start && payment.period.start <= other.period.end) ||
          (payment.period.end >= other.period.start && payment.period.end <= other.period.end) ||
          (payment.period.start <= other.period.start && payment.period.end >= other.period.end)
        );
      }
      return false;
    });
    
    if (hasOverlap) {
      errors.push('Период пересекается с другой выплатой');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

