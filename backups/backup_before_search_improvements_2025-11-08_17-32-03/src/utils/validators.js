/**
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 * 
 * Этот файл содержит утилиты для валидации данных:
 * - Валидация записей времени
 * - Валидация категорий
 * - Валидация настроек
 * - Проверка форматов данных
 * - Валидация пользовательского ввода
 */

import { calculateDuration } from './calculations';
import { validateTimeEntry as validateTimeEntryNew } from './validation';

/**
 * Валидирует запись времени
 * @param {Object} entry - запись для валидации
 * @returns {Object} результат валидации
 */
export function validateTimeEntry(entry) {
  const errors = {};
  const warnings = {};
  
  // Проверяем обязательные поля
  if (!entry.date) {
    errors.date = 'Дата обязательна';
  } else if (!isValidDate(entry.date)) {
    errors.date = 'Неверный формат даты';
  }
  
  if (!entry.start) {
    errors.start = 'Время начала обязательно';
  } else if (!isValidTime(entry.start)) {
    errors.start = 'Неверный формат времени начала';
  }
  
  if (!entry.end) {
    errors.end = 'Время окончания обязательно';
  } else if (!isValidTime(entry.end)) {
    errors.end = 'Неверный формат времени окончания';
  }
  
  if (!entry.category) {
    errors.category = 'Категория обязательна';
  }
  
  // Проверяем логику времени
  if (entry.start && entry.end && isValidTime(entry.start) && isValidTime(entry.end)) {
    if (entry.start >= entry.end) {
      errors.timeLogic = 'Время окончания должно быть позже времени начала';
    }
    
    // Проверяем на слишком долгую работу
    const duration = calculateDuration(entry.start, entry.end);
    if (parseFloat(duration) > 24) {
      warnings.longWork = 'Работа более 24 часов подряд';
    } else if (parseFloat(duration) > 12) {
      warnings.longWork = 'Работа более 12 часов подряд';
    }
  }
  
  // Проверяем длительность
  if (entry.duration && (isNaN(entry.duration) || parseFloat(entry.duration) < 0)) {
    errors.duration = 'Длительность должна быть положительным числом';
  }
  
  // Проверяем ставку
  if (entry.rate && (isNaN(entry.rate) || parseFloat(entry.rate) < 0)) {
    errors.rate = 'Ставка должна быть положительным числом';
  }
  
  // Проверяем заработок
  if (entry.earned && (isNaN(entry.earned) || parseFloat(entry.earned) < 0)) {
    errors.earned = 'Заработок должен быть положительным числом';
  }
  
  // Проверяем описание
  if (entry.description && entry.description.length > 500) {
    warnings.longDescription = 'Описание слишком длинное (более 500 символов)';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings,
  };
}

/**
 * Валидирует категорию
 * @param {Object} category - категория для валидации
 * @returns {Object} результат валидации
 */
export function validateCategory(category) {
  const errors = {};
  const warnings = {};
  
  // Проверяем название
  if (!category.name) {
    errors.name = 'Название категории обязательно';
  } else if (category.name.length < 2) {
    errors.name = 'Название категории должно содержать минимум 2 символа';
  } else if (category.name.length > 50) {
    errors.name = 'Название категории слишком длинное (максимум 50 символов)';
  }
  
  // Проверяем ставку
  if (!category.rate) {
    errors.rate = 'Ставка обязательна';
  } else if (isNaN(category.rate) || parseFloat(category.rate) < 0) {
    errors.rate = 'Ставка должна быть положительным числом';
  } else if (parseFloat(category.rate) > 100000) {
    warnings.highRate = 'Очень высокая ставка (более 100,000 ₽/ч)';
  }
  
  // Проверяем цвет
  if (category.color && !isValidColor(category.color)) {
    errors.color = 'Неверный формат цвета';
  }
  
  // Проверяем иконку
  if (category.icon && typeof category.icon !== 'string') {
    errors.icon = 'Иконка должна быть строкой';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings,
  };
}

/**
 * Валидирует настройки приложения
 * @param {Object} settings - настройки для валидации
 * @returns {Object} результат валидации
 */
export function validateSettings(settings) {
  const errors = {};
  const warnings = {};
  
  // Проверяем тему
  if (settings.theme && !['light', 'dark', 'auto'].includes(settings.theme)) {
    errors.theme = 'Неверная тема. Доступны: light, dark, auto';
  }
  
  // Проверяем дневную цель
  if (settings.dailyGoal && (isNaN(settings.dailyGoal) || parseFloat(settings.dailyGoal) < 0)) {
    errors.dailyGoal = 'Дневная цель должна быть положительным числом';
  } else if (settings.dailyGoal && parseFloat(settings.dailyGoal) > 100000) {
    warnings.highGoal = 'Очень высокая дневная цель (более 100,000 ₽)';
  }
  
  // Проверяем дневные часы
  if (settings.dailyHours && (isNaN(settings.dailyHours) || parseFloat(settings.dailyHours) < 0)) {
    errors.dailyHours = 'Дневные часы должны быть положительным числом';
  } else if (settings.dailyHours && parseFloat(settings.dailyHours) > 24) {
    warnings.highHours = 'Дневные часы превышают 24 часа';
  }
  
  // Проверяем настройки уведомлений
  if (settings.notifications) {
    if (settings.notifications.volume && (isNaN(settings.notifications.volume) || 
        settings.notifications.volume < 0 || settings.notifications.volume > 100)) {
      errors.notificationVolume = 'Громкость уведомлений должна быть от 0 до 100';
    }
  }
  
  // Проверяем рабочий график
  if (settings.workSchedule) {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    days.forEach(day => {
      const daySchedule = settings.workSchedule[day];
      if (daySchedule) {
        if (daySchedule.hours && (isNaN(daySchedule.hours) || parseFloat(daySchedule.hours) < 0)) {
          errors[`${day}Hours`] = `Часы для ${day} должны быть положительным числом`;
        }
        if (daySchedule.rate && (isNaN(daySchedule.rate) || parseFloat(daySchedule.rate) < 0)) {
          errors[`${day}Rate`] = `Ставка для ${day} должна быть положительным числом`;
        }
      }
    });
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings,
  };
}

/**
 * Проверяет валидность даты
 * @param {string} dateString - строка даты
 * @returns {boolean} true если дата валидна
 */
export function isValidDate(dateString) {
  if (!dateString) return false;
  
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && dateString.match(/^\d{4}-\d{2}-\d{2}$/);
}

/**
 * Проверяет валидность времени
 * @param {string} timeString - строка времени
 * @returns {boolean} true если время валидно
 */
export function isValidTime(timeString) {
  if (!timeString) return false;
  
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(timeString);
}

/**
 * Проверяет валидность цвета
 * @param {string} color - строка цвета
 * @returns {boolean} true если цвет валиден
 */
export function isValidColor(color) {
  if (!color) return false;
  
  // Проверяем hex цвет
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  if (hexRegex.test(color)) return true;
  
  // Проверяем rgb цвет
  const rgbRegex = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/;
  if (rgbRegex.test(color)) return true;
  
  // Проверяем rgba цвет
  const rgbaRegex = /^rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*([01]?\.?\d*)\s*\)$/;
  if (rgbaRegex.test(color)) return true;
  
  return false;
}

/**
 * Проверяет валидность email
 * @param {string} email - email адрес
 * @returns {boolean} true если email валиден
 */
export function isValidEmail(email) {
  if (!email) return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Проверяет валидность URL
 * @param {string} url - URL адрес
 * @returns {boolean} true если URL валиден
 */
export function isValidURL(url) {
  if (!url) return false;
  
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Проверяет валидность номера телефона
 * @param {string} phone - номер телефона
 * @returns {boolean} true если номер валиден
 */
export function isValidPhone(phone) {
  if (!phone) return false;
  
  // Убираем все символы кроме цифр
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Проверяем длину (7-15 цифр)
  return cleanPhone.length >= 7 && cleanPhone.length <= 15;
}

/**
 * Валидирует форму добавления записи
 * @param {Object} formData - данные формы
 * @param {Array} entries - существующие записи для проверки перекрытий
 * @param {string} excludeId - ID записи, которую нужно исключить при проверке (для редактирования)
 * @returns {Object} результат валидации
 */
export function validateEntryForm(formData, entries = [], excludeId = null) {
  // Используем централизованную валидацию (импортирована в начале файла)
  const result = validateTimeEntryNew(formData, entries, excludeId);
  const warnings = {};
  
  // Дополнительные предупреждения (не блокируют сохранение)
  if (formData.date && new Date(formData.date) > new Date()) {
    warnings.futureDate = 'Выбранная дата в будущем';
  }
  
  // Проверяем на работу в ночное время
  if (formData.start && formData.end) {
    const startHour = parseInt(formData.start.split(':')[0]);
    const endHour = parseInt(formData.end.split(':')[0]);
    
    if (startHour >= 22 || endHour <= 6) {
      warnings.nightWork = 'Работа в ночное время';
    }
  }
  
  // Возвращаем результат с warnings
  return {
    isValid: result.isValid,
    errors: result.errors,
    warnings,
  };
}

/**
 * Валидирует форму настроек
 * @param {Object} formData - данные формы
 * @returns {Object} результат валидации
 */
export function validateSettingsForm(formData) {
  const errors = {};
  const warnings = {};
  
  // Проверяем тему
  if (formData.theme && !['light', 'dark', 'auto'].includes(formData.theme)) {
    errors.theme = 'Неверная тема';
  }
  
  // Проверяем дневную цель
  if (formData.dailyGoal && (isNaN(formData.dailyGoal) || parseFloat(formData.dailyGoal) < 0)) {
    errors.dailyGoal = 'Дневная цель должна быть положительным числом';
  }
  
  // Проверяем дневные часы
  if (formData.dailyHours && (isNaN(formData.dailyHours) || parseFloat(formData.dailyHours) < 0)) {
    errors.dailyHours = 'Дневные часы должны быть положительным числом';
  }
  
  // Проверяем громкость уведомлений
  if (formData.notificationVolume && (isNaN(formData.notificationVolume) || 
      formData.notificationVolume < 0 || formData.notificationVolume > 100)) {
    errors.notificationVolume = 'Громкость должна быть от 0 до 100';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings,
  };
}

/**
 * Валидирует данные импорта
 * @param {Object} importData - данные для импорта
 * @returns {Object} результат валидации
 */
export function validateImportData(importData) {
  const errors = {};
  const warnings = {};
  
  // Проверяем базовую структуру
  if (!importData || typeof importData !== 'object') {
    errors.structure = 'Неверная структура файла';
    return { isValid: false, errors, warnings };
  }
  
  // Проверяем версию
  if (!importData.version) {
    errors.version = 'Отсутствует версия файла';
  }
  
  // Проверяем данные
  if (!importData.data || typeof importData.data !== 'object') {
    errors.data = 'Отсутствует секция данных';
    return { isValid: false, errors, warnings };
  }
  
  // Проверяем записи
  if (!Array.isArray(importData.data.entries)) {
    errors.entries = 'Записи должны быть массивом';
  } else {
    // Валидируем каждую запись
    importData.data.entries.forEach((entry, index) => {
      const entryValidation = validateTimeEntry(entry);
      if (!entryValidation.isValid) {
        errors[`entry_${index}`] = `Запись ${index + 1}: ${Object.values(entryValidation.errors).join(', ')}`;
      }
      if (Object.keys(entryValidation.warnings).length > 0) {
        warnings[`entry_${index}`] = `Запись ${index + 1}: ${Object.values(entryValidation.warnings).join(', ')}`;
      }
    });
  }
  
  // Проверяем категории
  if (!Array.isArray(importData.data.categories)) {
    errors.categories = 'Категории должны быть массивом';
  } else {
    // Валидируем каждую категорию
    importData.data.categories.forEach((category, index) => {
      const categoryValidation = validateCategory(category);
      if (!categoryValidation.isValid) {
        errors[`category_${index}`] = `Категория ${index + 1}: ${Object.values(categoryValidation.errors).join(', ')}`;
      }
      if (Object.keys(categoryValidation.warnings).length > 0) {
        warnings[`category_${index}`] = `Категория ${index + 1}: ${Object.values(categoryValidation.warnings).join(', ')}`;
      }
    });
  }
  
  // Проверяем настройки
  if (importData.data.settings) {
    const settingsValidation = validateSettings(importData.data.settings);
    if (!settingsValidation.isValid) {
      errors.settings = `Настройки: ${Object.values(settingsValidation.errors).join(', ')}`;
    }
    if (Object.keys(settingsValidation.warnings).length > 0) {
      warnings.settings = `Настройки: ${Object.values(settingsValidation.warnings).join(', ')}`;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings,
  };
}

/**
 * Санитизирует пользовательский ввод
 * @param {string} input - пользовательский ввод
 * @param {Object} options - опции санитизации
 * @returns {string} санитизированный ввод
 */
export function sanitizeInput(input, options = {}) {
  if (typeof input !== 'string') return '';
  
  let sanitized = input;
  
  // Убираем HTML теги
  if (options.removeHTML !== false) {
    sanitized = sanitized.replace(/<[^>]*>/g, '');
  }
  
  // Убираем лишние пробелы
  if (options.trim !== false) {
    sanitized = sanitized.trim();
  }
  
  // Ограничиваем длину
  if (options.maxLength) {
    sanitized = sanitized.substring(0, options.maxLength);
  }
  
  // Убираем специальные символы
  if (options.removeSpecialChars) {
    sanitized = sanitized.replace(/[^\w\s\u0400-\u04FF]/g, '');
  }
  
  return sanitized;
}

/**
 * Проверяет сложность пароля
 * @param {string} password - пароль
 * @returns {Object} результат проверки сложности
 */
export function validatePasswordStrength(password) {
  if (!password) {
    return {
      score: 0,
      level: 'weak',
      message: 'Пароль не введен',
    };
  }
  
  let score = 0;
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    numbers: /\d/.test(password),
    symbols: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };
  
  // Подсчитываем баллы
  Object.values(checks).forEach(check => {
    if (check) score++;
  });
  
  // Дополнительные баллы за длину
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  
  let level, message;
  if (score <= 2) {
    level = 'weak';
    message = 'Слабый пароль';
  } else if (score <= 4) {
    level = 'medium';
    message = 'Средний пароль';
  } else if (score <= 6) {
    level = 'strong';
    message = 'Сильный пароль';
  } else {
    level = 'very-strong';
    message = 'Очень сильный пароль';
  }
  
  return {
    score,
    level,
    message,
    checks,
  };
}

