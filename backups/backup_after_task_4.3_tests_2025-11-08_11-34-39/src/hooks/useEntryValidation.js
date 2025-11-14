/**
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 * 
 * Этот хук управляет валидацией формы записи времени.
 * Он проверяет правильность заполнения полей и проверяет
 * пересечения временных промежутков с другими записями.
 * 
 * Использование:
 * const { errors, validateForm, checkTimeOverlap } = useEntryValidation(formData, entries, effectiveEntry);
 */

import { useState } from 'react';
import { validateEntryForm } from '../utils/validators';
import { timeToMinutes } from '../utils/dateHelpers';

/**
 * Хук для валидации формы записи времени
 * @param {Object} formData - Данные формы
 * @param {Array} entries - Все записи (для проверки пересечений)
 * @param {Object|null} effectiveEntry - Текущая редактируемая запись
 * @returns {Object} Объект с ошибками и методами валидации
 */
export function useEntryValidation(formData, entries, effectiveEntry) {
  const [errors, setErrors] = useState({});

  /**
   * Проверяет пересечения временных промежутков
   * @param {string} start - Время начала в формате HH:MM
   * @param {string} end - Время окончания в формате HH:MM
   * @param {string} date - Дата в формате YYYY-MM-DD
   * @returns {string|null} Сообщение об ошибке или null
   */
  const checkTimeOverlap = (start, end, date) => {
    if (!start || !end || !date) return null;
    
    const startMinutes = timeToMinutes(start);
    const endMinutes = timeToMinutes(end);
    
    // Получаем записи за ту же дату, исключая текущую редактируемую
    // ✅ СТАНДАРТИЗАЦИЯ ID: Конвертируем в строку для корректного сравнения
    const excludeIdString = effectiveEntry?.id ? String(effectiveEntry.id) : null;
    const sameDayEntries = entries.filter(e => 
      e.date === date && 
      (excludeIdString ? String(e.id) !== excludeIdString : true) && 
      e.start && 
      e.end
    );
    
    if (sameDayEntries.length === 0) return null;
    
    // Проверяем пересечение с каждой записью
    for (const otherEntry of sameDayEntries) {
      const otherStart = timeToMinutes(otherEntry.start);
      const otherEnd = timeToMinutes(otherEntry.end);
      
      // ИСПРАВЛЕНО: Проверка пересечения интервалов (start < otherEnd) && (end > otherStart)
      if (startMinutes < otherEnd && endMinutes > otherStart) {
        return `Время пересекается с записью ${otherEntry.start} → ${otherEntry.end}`;
      }
    }
    
    return null;
  };

  /**
   * Валидирует форму записи
   * @returns {boolean} true если форма валидна
   */
  const validateForm = () => {
    // Используем централизованную валидацию с поддержкой проверки перекрытий
    const validation = validateEntryForm(
      formData, 
      entries, 
      formData.id ? String(formData.id) : null // Исключаем текущую запись при редактировании
    );
    
    // ДОПОЛНИТЕЛЬНО: Проверка заработка (если он важен для вашего кейса)
    const earnedValue = parseFloat(formData.earned) || 0;
    if (earnedValue <= 0) {
      validation.errors.earned = 'Заработок должен быть больше 0';
      validation.isValid = false;
    }
    
    setErrors(validation.errors);
    return validation.isValid;
  };

  /**
   * Валидирует время в реальном времени
   * @param {string} start - Время начала
   * @param {string} end - Время окончания
   * @param {string} date - Дата
   */
  const validateTime = (start, end, date) => {
    const newErrors = {};
    
    if (start && end) {
      const [startH, startM] = start.split(':').map(Number);
      const [endH, endM] = end.split(':').map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      
      if (startMinutes >= endMinutes) {
        newErrors.start = 'Время начала должно быть раньше времени окончания';
        newErrors.end = 'Время окончания должно быть позже времени начала';
      } else {
        // Проверка пересечений в реальном времени
        const overlapError = checkTimeOverlap(start, end, date);
        if (overlapError) {
          newErrors.start = overlapError;
          newErrors.end = overlapError;
        }
      }
    }
    
    setErrors(prev => ({
      ...prev,
      ...newErrors
    }));
  };

  /**
   * Очищает ошибки для указанных полей
   * @param {string[]} fields - Массив имен полей
   */
  const clearErrors = (fields) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      fields.forEach(field => {
        delete newErrors[field];
      });
      return newErrors;
    });
  };

  /**
   * Устанавливает ошибку для поля
   * @param {string} field - Имя поля
   * @param {string} message - Сообщение об ошибке
   */
  const setError = (field, message) => {
    setErrors(prev => ({
      ...prev,
      [field]: message
    }));
  };

  /**
   * Очищает все ошибки
   */
  const clearAllErrors = () => {
    setErrors({});
  };

  return {
    errors,
    setErrors,
    validateForm,
    validateTime,
    checkTimeOverlap,
    clearErrors,
    setError,
    clearAllErrors,
  };
}

