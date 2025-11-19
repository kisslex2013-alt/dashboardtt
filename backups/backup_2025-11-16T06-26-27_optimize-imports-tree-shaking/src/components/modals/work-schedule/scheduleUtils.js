/**
 * 🎨 Утилиты для работы с цветами шаблонов графика
 */

/**
 * Получает классы Tailwind для цвета иконки
 */
export function getIconColorClasses(color) {
  const colors = {
    blue: 'from-blue-100 to-blue-200 text-blue-600 dark:from-blue-900/30 dark:to-blue-800/30 dark:text-blue-400',
    purple:
      'from-purple-100 to-purple-200 text-purple-600 dark:from-purple-900/30 dark:to-purple-800/30 dark:text-purple-400',
    orange:
      'from-orange-100 to-orange-200 text-orange-600 dark:from-orange-900/30 dark:to-orange-800/30 dark:text-orange-400',
    red: 'from-red-100 to-red-200 text-red-600 dark:from-red-900/30 dark:to-red-800/30 dark:text-red-400',
    green:
      'from-green-100 to-green-200 text-green-600 dark:from-green-900/30 dark:to-green-800/30 dark:text-green-400',
    gray: 'from-gray-200 to-gray-300 text-gray-700 dark:from-gray-700 dark:to-gray-600 dark:text-gray-300',
  }
  return colors[color] || colors.blue
}

/**
 * Получает классы Tailwind для цвета эффективности
 */
export function getEfficiencyColor(color) {
  const colors = {
    blue: 'text-blue-600 dark:text-blue-400',
    purple: 'text-purple-600 dark:text-purple-400',
    orange: 'text-orange-600 dark:text-orange-400',
    red: 'text-red-600 dark:text-red-400',
    green: 'text-green-600 dark:text-green-400',
  }
  return colors[color] || colors.blue
}
