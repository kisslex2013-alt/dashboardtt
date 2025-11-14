/**
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 * 
 * Этот хук управляет состоянием формы записи времени.
 * Он хранит данные формы, обрабатывает изменения полей,
 * и предоставляет функции для работы с формой.
 * 
 * Использование:
 * const { formData, setField, resetForm, errors } = useEntryForm(entry, categories);
 */

import { useState, useEffect, useRef } from 'react';
import { getTodayString } from '../utils/dateHelpers';
import { useSettingsStore } from '../store/useSettingsStore';

/**
 * Хук для управления формой записи времени
 * @param {Object|null} entry - Существующая запись для редактирования (null для новой)
 * @param {Array} categories - Список категорий
 * @returns {Object} Объект с данными формы и методами управления
 */
export function useEntryForm(entry, categories, isOpen = true) {
  // ИСПРАВЛЕНО: Сохраняем последний entry в ref, чтобы избежать мелькания
  // при закрытии модального окна (когда entry становится null, но компонент ещё в DOM)
  const lastEntryRef = useRef(entry);

  // Обновляем ref при изменении entry
  useEffect(() => {
    if (entry) {
      lastEntryRef.current = entry;
    }
  }, [entry]);

  // ИСПРАВЛЕНО: Используем lastEntryRef для определения данных, если модальное окно открыто
  const effectiveEntry = isOpen ? entry : (entry || lastEntryRef.current);

  // Инициализация состояния формы
  const [formData, setFormData] = useState(() => {
    const initialEntry = entry || null;
    return initialEntry ? {
      ...initialEntry,
      id: String(initialEntry.id || ''),
      earned: initialEntry.earned != null ? String(initialEntry.earned) : '',
    } : {
      date: getTodayString(),
      start: '',
      end: '',
      category: '',
      description: '',
      earned: '', // ИСПРАВЛЕНО: Строка вместо числа для Input компонента
    };
  });

  // Обновляем formData когда entry изменяется
  useEffect(() => {
    if (effectiveEntry) {
      // Конвертируем categoryId в название категории, если необходимо
      let categoryName = effectiveEntry.category;
      
      // Если category - это ID, ищем по ID
      if (effectiveEntry.categoryId && !effectiveEntry.category) {
        // ✅ СТАНДАРТИЗАЦИЯ ID: Конвертируем в строку для корректного сравнения
        const categoryIdString = String(effectiveEntry.categoryId);
        const foundCategory = categories.find(c => String(c.id) === categoryIdString);
        categoryName = foundCategory ? foundCategory.name : categories[0]?.name || 'Разработка';
      } else if (effectiveEntry.category) {
        // Проверяем, является ли entry.category ID или name
        // ✅ СТАНДАРТИЗАЦИЯ ID: Конвертируем в строку для корректного сравнения
        const categoryString = String(effectiveEntry.category);
        const foundById = categories.find(c => String(c.id) === categoryString);
        const foundByName = categories.find(c => c.name === effectiveEntry.category);
        
        if (foundById) {
          categoryName = foundById.name;
        } else if (foundByName) {
          categoryName = foundByName.name;
        } else {
          // Если категория не найдена, используем первую доступную
          categoryName = categories[0]?.name || 'Разработка';
        }
      }
      
      setFormData({
        ...effectiveEntry,
        id: String(effectiveEntry.id || ''), // ИСПРАВЛЕНО: Конвертируем id в строку
        category: categoryName,
        // ИСПРАВЛЕНО: Конвертируем earned в строку для поля формы (Input ожидает строку)
        earned: effectiveEntry.earned != null ? String(effectiveEntry.earned) : '',
      });
    } else {
      setFormData({
        date: getTodayString(),
        start: '',
        end: '',
        category: categories[0]?.name || 'Разработка',
        description: '',
        earned: '', // ИСПРАВЛЕНО: Строка вместо числа для Input компонента
      });
    }
  }, [entry, categories, effectiveEntry]);

  /**
   * Обновляет значение поля формы
   * @param {string} field - Имя поля
   * @param {any} value - Новое значение
   */
  const setField = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  /**
   * Обновляет несколько полей одновременно
   * @param {Object} updates - Объект с обновлениями полей
   */
  const setFields = (updates) => {
    setFormData(prev => ({
      ...prev,
      ...updates
    }));
  };

  /**
   * Сбрасывает форму к начальному состоянию
   */
  const resetForm = () => {
    setFormData({
      date: getTodayString(),
      start: '',
      end: '',
      category: categories[0]?.name || 'Разработка',
      description: '',
      earned: '',
    });
  };

  return {
    formData,
    setFormData,
    setField,
    setFields,
    resetForm,
    effectiveEntry,
  };
}

