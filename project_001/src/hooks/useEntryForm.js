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

import { useState, useEffect, useRef } from 'react'
import { getTodayString } from '../utils/dateHelpers'
import { useCategory } from './useCategory'

/**
 * Хук для управления формой записи времени
 * @param {Object|null} entry - Существующая запись для редактирования (null для новой)
 * @param {Array} categories - Список категорий (опционально, для обратной совместимости)
 * @param {boolean} isOpen - Открыта ли форма
 * @returns {Object} Объект с данными формы и методами управления
 */
export function useEntryForm(entry, categories = null, isOpen = true) {
  // ✅ ОПТИМИЗАЦИЯ: Используем централизованный хук для работы с категориями
  const { categories: hookCategories, getCategoryName } = useCategory({ defaultName: 'Разработка' })

  // Используем категории из хука, если не переданы как параметр (для обратной совместимости)
  const effectiveCategories = categories || hookCategories
  // ИСПРАВЛЕНО: Сохраняем последний entry в ref, чтобы избежать мелькания
  // при закрытии модального окна (когда entry становится null, но компонент ещё в DOM)
  const lastEntryRef = useRef(entry)

  // Обновляем ref при изменении entry
  useEffect(() => {
    if (entry) {
      lastEntryRef.current = entry
    }
  }, [entry])

  // ИСПРАВЛЕНО: Используем lastEntryRef для определения данных, если модальное окно открыто
  const effectiveEntry = isOpen ? entry : entry || lastEntryRef.current

  // Инициализация состояния формы
  const [formData, setFormData] = useState(() => {
    const initialEntry = entry || null
    return initialEntry
      ? {
          ...initialEntry,
          id: String(initialEntry.id || ''),
          earned: initialEntry.earned != null ? String(initialEntry.earned) : '',
        }
      : {
          date: getTodayString(),
          start: '',
          end: '',
          category: '',
          description: '',
          earned: '', // ИСПРАВЛЕНО: Строка вместо числа для Input компонента
        }
  })

  // Обновляем formData когда entry изменяется
  useEffect(() => {
    if (effectiveEntry) {
      // Конвертируем categoryId в название категории, если необходимо
      let categoryName = effectiveEntry.category

      // ✅ ОПТИМИЗАЦИЯ: Используем централизованную функцию из хука useCategory
      categoryName = getCategoryName(effectiveEntry, 'Разработка')

      setFormData({
        ...effectiveEntry,
        id: String(effectiveEntry.id || ''), // ИСПРАВЛЕНО: Конвертируем id в строку
        category: categoryName,
        // ✅ ИСПРАВЛЕНО: Для записей из таймера (isManual: false) поле заработка должно быть пустым
        // Пользователь должен ввести заработок вручную, ставка рассчитывается исходя из времени и суммы
        earned: effectiveEntry.isManual === false 
          ? '' 
          : (effectiveEntry.earned != null ? String(effectiveEntry.earned) : ''),
      })
    } else {
      // ✅ ОПТИМИЗАЦИЯ: Используем первую категорию из хука
      const defaultCategory = effectiveCategories[0]?.name || 'Разработка'
      setFormData({
        date: getTodayString(),
        start: '',
        end: '',
        category: defaultCategory,
        description: '',
        earned: '', // ИСПРАВЛЕНО: Строка вместо числа для Input компонента
      })
    }
  }, [entry, effectiveCategories, effectiveEntry, getCategoryName])

  /**
   * Обновляет значение поля формы
   * @param {string} field - Имя поля
   * @param {any} value - Новое значение
   */
  const setField = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  /**
   * Обновляет несколько полей одновременно
   * @param {Object} updates - Объект с обновлениями полей
   */
  const setFields = updates => {
    setFormData(prev => ({
      ...prev,
      ...updates,
    }))
  }

  /**
   * Сбрасывает форму к начальному состоянию
   */
  const resetForm = () => {
    // ✅ ОПТИМИЗАЦИЯ: Используем первую категорию из хука
    const defaultCategory = effectiveCategories[0]?.name || 'Разработка'
    setFormData({
      date: getTodayString(),
      start: '',
      end: '',
      category: defaultCategory,
      description: '',
      earned: '',
    })
  }

  return {
    formData,
    setFormData,
    setField,
    setFields,
    resetForm,
    effectiveEntry,
  }
}
