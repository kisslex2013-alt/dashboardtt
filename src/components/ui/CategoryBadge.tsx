import { memo } from 'react'
import { useCategories } from '../../store/useSettingsStore'
import { getIcon } from '../../utils/iconHelper'

/**
 * 🏷️ CategoryBadge — компонент для отображения категории с иконкой
 * 
 * Унифицированный компонент для использования во всех view-компонентах:
 * ListView, GridView, TimelineView, VirtualizedListView
 */

export interface CategoryBadgeProps {
  /** ID или имя категории */
  categoryId: string | number | undefined
  /** Показывать иконку категории */
  showIcon?: boolean
  /** Размер: sm (12px), md (14px), lg (16px) */
  size?: 'sm' | 'md' | 'lg'
  /** Обрезать длинный текст */
  truncate?: boolean
  /** Дополнительные классы */
  className?: string
}

/**
 * Получает категорию по ID или имени
 */
function findCategory(
  categories: Array<{ id: string | number; name: string; icon?: string; color?: string }>,
  categoryIdOrName: string | number | undefined
) {
  if (categoryIdOrName === undefined || categoryIdOrName === null) return null

  if (typeof categoryIdOrName === 'string') {
    // Ищем по ID (как строка) или по имени
    return (
      categories.find(
        (c) => String(c.id) === categoryIdOrName || c.name === categoryIdOrName
      ) || null
    )
  }

  // Ищем по ID (как число)
  return categories.find((c) => String(c.id) === String(categoryIdOrName)) || null
}

/**
 * Получает имя категории
 */
function getCategoryName(
  categories: Array<{ id: string | number; name: string }>,
  categoryIdOrName: string | number | undefined
): string {
  if (categoryIdOrName === undefined || categoryIdOrName === null) return 'Без категории'

  const category = findCategory(categories, categoryIdOrName)
  if (category) return category.name

  // Если категория не найдена, возвращаем как есть (если строка) или "Без категории"
  if (typeof categoryIdOrName === 'string') return categoryIdOrName
  return 'Без категории'
}

const sizeClasses = {
  sm: {
    icon: 'w-3 h-3',
    text: 'text-xs',
  },
  md: {
    icon: 'w-3.5 h-3.5',
    text: 'text-sm',
  },
  lg: {
    icon: 'w-4 h-4',
    text: 'text-base',
  },
}

export const CategoryBadge = memo(function CategoryBadge({
  categoryId,
  showIcon = true,
  size = 'sm',
  truncate = true,
  className = '',
}: CategoryBadgeProps) {
  const categories = useCategories()

  const category = findCategory(categories, categoryId)
  const categoryName = getCategoryName(categories, categoryId)
  const CategoryIcon = showIcon && category?.icon ? getIcon(category.icon) : null
  const categoryColor = category?.color ?? '#6B7280'

  const { icon: iconClass, text: textClass } = sizeClasses[size]

  return (
    <div className={`flex items-center gap-1 min-w-0 ${className}`}>
      {CategoryIcon && (
        <CategoryIcon
          className={`${iconClass} flex-shrink-0`}
          style={{ color: categoryColor }}
        />
      )}
      <span
        className={`${textClass} text-gray-700 dark:text-gray-300 ${truncate ? 'truncate' : ''}`}
        title={truncate ? categoryName : undefined}
      >
        {categoryName}
      </span>
    </div>
  )
})

// Экспортируем утилиты для использования в других компонентах
export { findCategory, getCategoryName }
