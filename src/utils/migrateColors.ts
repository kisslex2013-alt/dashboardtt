/**
 * 🎨 Утилита для миграции цветов категорий на семантические
 */

import type { Category } from '../types'

const SEMANTIC_COLORS: Record<string, string> = {
  deepWork: '#6366F1',
  communication: '#F59E0B',
  learning: '#8B5CF6',
  routine: '#64748B',
  creative: '#EC4899',
  personal: '#10B981',
  consulting: '#06B6D4',
  other: '#6B7280',
}

/**
 * Обновляет цвета всех категорий на семантические
 */
export const migrateCategoriesToSemanticColors = (categories: Category[]): Category[] => {
  return categories.map(cat => {
    const name = cat.name.toLowerCase()
    let newColor = cat.color

    if (name.includes('remix') || name.includes('development') || name.includes('разработ')) {
      newColor = SEMANTIC_COLORS.deepWork!
    } else if (name.includes('marketing') || name.includes('маркетинг')) {
      newColor = SEMANTIC_COLORS.communication!
    } else if (name.includes('design') || name.includes('дизайн')) {
      newColor = SEMANTIC_COLORS.creative!
    } else if (name.includes('management') || name.includes('менеджмент') || name.includes('consulting') || name.includes('консультац')) {
      newColor = SEMANTIC_COLORS.consulting!
    } else if (name.includes('teaching') || name.includes('обучен')) {
      newColor = SEMANTIC_COLORS.learning!
    } else if (name.includes('other') || name.includes('другое')) {
      newColor = SEMANTIC_COLORS.other!
    }

    return { ...cat, color: newColor }
  })
}

/**
 * Проверяет, нужно ли обновление цветов
 */
export const needsColorMigration = (categories: Category[]): boolean => {
  return categories.some(cat => {
    const name = cat.name.toLowerCase()

    if ((name.includes('remix') || name.includes('development') || name.includes('разработ')) && cat.color !== SEMANTIC_COLORS.deepWork) return true
    if ((name.includes('marketing') || name.includes('маркетинг')) && cat.color !== SEMANTIC_COLORS.communication) return true
    if ((name.includes('design') || name.includes('дизайн')) && cat.color !== SEMANTIC_COLORS.creative) return true
    if ((name.includes('management') || name.includes('менеджмент') || name.includes('consulting') || name.includes('консультац')) && cat.color !== SEMANTIC_COLORS.consulting) return true
    if ((name.includes('teaching') || name.includes('обучен')) && cat.color !== SEMANTIC_COLORS.learning) return true
    if ((name.includes('other') || name.includes('другое')) && cat.color !== SEMANTIC_COLORS.other) return true

    return false
  })
}
