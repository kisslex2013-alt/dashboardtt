import { useMemo, useCallback } from 'react'
import { useCategories } from '../store/useSettingsStore'
import type { Category, TimeEntry } from '../types'

interface UseCategoryOptions {
  defaultName?: string
}

interface UseCategoryReturn {
  categories: Category[]
  getCategoryName: (entry: TimeEntry, customDefault?: string) => string
  getCategoryNameById: (categoryIdOrName: string | number, customDefault?: string) => string
  getCategoryById: (categoryIdOrName: string | number) => Category | null
  hasCategory: (categoryIdOrName: string | number) => boolean
}

/**
 * Получает название категории из записи
 */
function getCategoryNameFromEntry(
  entry: TimeEntry,
  categories: Category[],
  defaultName: string = 'remix'
): string {
  // Если category - строка (название), возвращаем как есть
  if (entry.category && typeof entry.category === 'string') {
    return entry.category
  }

  // Если есть categoryId, ищем по нему
  if (entry.categoryId) {
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

  return defaultName
}

/**
 * Получает категорию по ID или имени
 */
function getCategoryNameByIdOrName(
  categoryIdOrName: string | number,
  categories: Category[],
  defaultName: string = 'Без категории'
): string {
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
 * 🎯 Хук для работы с категориями
 *
 * Централизует всю логику работы с категориями записей.
 */
export function useCategory(options: UseCategoryOptions = {}): UseCategoryReturn {
  const { defaultName = 'remix' } = options

  const categories = useCategories()

  const getCategoryName = useCallback(
    (entry: TimeEntry, customDefault: string = defaultName): string => {
      return getCategoryNameFromEntry(entry, categories, customDefault)
    },
    [categories, defaultName]
  )

  const getCategoryNameById = useCallback(
    (categoryIdOrName: string | number, customDefault: string = 'Без категории'): string => {
      return getCategoryNameByIdOrName(categoryIdOrName, categories, customDefault)
    },
    [categories]
  )

  const getCategoryById = useCallback(
    (categoryIdOrName: string | number): Category | null => {
      if (!categoryIdOrName) return null

      const categoryIdString = String(categoryIdOrName)
      return (
        categories.find(c => String(c.id) === categoryIdString || c.name === categoryIdOrName) ||
        null
      )
    },
    [categories]
  )

  const hasCategory = useCallback(
    (categoryIdOrName: string | number): boolean => {
      return getCategoryById(categoryIdOrName) !== null
    },
    [getCategoryById]
  )

  const categoriesList = useMemo(() => categories, [categories])

  return {
    categories: categoriesList,
    getCategoryName,
    getCategoryNameById,
    getCategoryById,
    hasCategory,
  }
}
