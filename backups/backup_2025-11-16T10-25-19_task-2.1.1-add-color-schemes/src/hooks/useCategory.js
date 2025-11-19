import { useMemo, useCallback } from 'react'
import { useCategories } from '../store/useSettingsStore'

/**
 * 🎯 Хук для работы с категориями
 *
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 *
 * Этот хук централизует всю логику работы с категориями записей.
 * Вместо дублирования кода в разных компонентах, мы используем один хук.
 *
 * Что делает:
 * - Получает список категорий из store
 * - Предоставляет функции для поиска категорий по ID или имени
 * - Конвертирует categoryId в название категории
 * - Обрабатывает старые записи (где category может быть строкой)
 *
 * Преимущества:
 * - Единая логика во всем приложении
 * - Легко поддерживать и изменять
 * - Нет дублирования кода
 */

/**
 * Получает название категории из записи
 * @param {Object} entry - запись времени
 * @param {Array} categories - массив категорий
 * @param {string} defaultName - название по умолчанию (опционально)
 * @returns {string} название категории
 */
function getCategoryNameFromEntry(entry, categories, defaultName = 'remix') {
  // Если category - строка (название), возвращаем как есть
  if (entry.category && typeof entry.category === 'string') {
    return entry.category
  }

  // Если есть categoryId, ищем по нему
  if (entry.categoryId) {
    // ✅ СТАНДАРТИЗАЦИЯ ID: Конвертируем в строку для корректного сравнения
    const categoryIdString = String(entry.categoryId)
    const category = categories.find(c => String(c.id) === categoryIdString)
    return category ? category.name : defaultName
  }

  // Если category - это ID (старый формат), ищем по ID
  if (entry.category) {
    const categoryString = String(entry.category)
    const foundById = categories.find(c => String(c.id) === categoryString)
    if (foundById) {
      return foundById.name
    }

    // Проверяем, может быть это уже название
    const foundByName = categories.find(c => c.name === entry.category)
    if (foundByName) {
      return foundByName.name
    }
  }

  // Если ничего не найдено - возвращаем дефолт
  return defaultName
}

/**
 * Получает категорию по ID или имени
 * @param {string|number} categoryIdOrName - ID или название категории
 * @param {Array} categories - массив категорий
 * @param {string} defaultName - название по умолчанию (опционально)
 * @returns {string} название категории
 */
function getCategoryNameByIdOrName(categoryIdOrName, categories, defaultName = 'Без категории') {
  if (!categoryIdOrName) {
    return defaultName
  }

  // Если это уже строка (название), проверяем существует ли такая категория
  if (typeof categoryIdOrName === 'string') {
    const foundByName = categories.find(c => c.name === categoryIdOrName)
    if (foundByName) {
      return categoryIdOrName
    }
  }

  // Ищем по ID
  const categoryIdString = String(categoryIdOrName)
  const category = categories.find(c => String(c.id) === categoryIdString)
  return category ? category.name : defaultName
}

/**
 * Хук для работы с категориями
 * @param {Object} options - опции хука
 * @param {string} options.defaultName - название категории по умолчанию
 * @returns {Object} объект с функциями и данными для работы с категориями
 */
export function useCategory(options = {}) {
  const { defaultName = 'remix' } = options

  // ✅ ОПТИМИЗАЦИЯ: Используем атомарный селектор для минимизации ре-рендеров
  const categories = useCategories()

  /**
   * Получает название категории из записи
   * @param {Object} entry - запись времени
   * @param {string} customDefault - кастомное название по умолчанию (опционально)
   * @returns {string} название категории
   */
  const getCategoryName = useCallback(
    (entry, customDefault = defaultName) => {
      return getCategoryNameFromEntry(entry, categories, customDefault)
    },
    [categories, defaultName]
  )

  /**
   * Получает категорию по ID или имени
   * @param {string|number} categoryIdOrName - ID или название категории
   * @param {string} customDefault - кастомное название по умолчанию (опционально)
   * @returns {string} название категории
   */
  const getCategoryNameById = useCallback(
    (categoryIdOrName, customDefault = 'Без категории') => {
      return getCategoryNameByIdOrName(categoryIdOrName, categories, customDefault)
    },
    [categories]
  )

  /**
   * Получает объект категории по ID или имени
   * @param {string|number} categoryIdOrName - ID или название категории
   * @returns {Object|null} объект категории или null
   */
  const getCategoryById = useCallback(
    categoryIdOrName => {
      if (!categoryIdOrName) return null

      const categoryIdString = String(categoryIdOrName)
      return (
        categories.find(c => String(c.id) === categoryIdString || c.name === categoryIdOrName) ||
        null
      )
    },
    [categories]
  )

  /**
   * Проверяет, существует ли категория
   * @param {string|number} categoryIdOrName - ID или название категории
   * @returns {boolean} true если категория существует
   */
  const hasCategory = useCallback(
    categoryIdOrName => {
      return getCategoryById(categoryIdOrName) !== null
    },
    [getCategoryById]
  )

  // Мемоизируем список категорий для оптимизации
  const categoriesList = useMemo(() => categories, [categories])

  return {
    categories: categoriesList,
    getCategoryName,
    getCategoryNameById,
    getCategoryById,
    hasCategory,
  }
}
