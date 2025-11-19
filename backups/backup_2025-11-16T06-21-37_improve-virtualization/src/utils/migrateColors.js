/**
 * 🎨 Утилита для миграции цветов категорий на семантические
 * Phase 1: Quick Wins
 */

// Семантические цвета (копия из useSettingsStore.js)
const SEMANTIC_COLORS = {
  deepWork: '#6366F1',     // Indigo - глубокая концентрация (разработка, код)
  communication: '#F59E0B', // Amber - общение и встречи
  learning: '#8B5CF6',     // Purple - обучение и рост
  routine: '#64748B',      // Slate - рутина и администрирование
  creative: '#EC4899',     // Pink - креативная работа (дизайн)
  personal: '#10B981',     // Green - личные дела
  consulting: '#06B6D4',   // Cyan - консультации и менеджмент
  other: '#6B7280',        // Gray - остальное
}

/**
 * Обновляет цвета всех категорий на семантические
 */
export const migrateCategoriesToSemanticColors = (categories) => {
  return categories.map(cat => {
    const name = cat.name.toLowerCase()
    let newColor = cat.color
    
    // Определяем семантический цвет по названию категории
    if (name.includes('remix') || name.includes('development') || name.includes('разработ')) {
      newColor = SEMANTIC_COLORS.deepWork
    } else if (name.includes('marketing') || name.includes('маркетинг')) {
      newColor = SEMANTIC_COLORS.communication
    } else if (name.includes('design') || name.includes('дизайн')) {
      newColor = SEMANTIC_COLORS.creative
    } else if (name.includes('management') || name.includes('менеджмент') || name.includes('consulting') || name.includes('консультац')) {
      newColor = SEMANTIC_COLORS.consulting
    } else if (name.includes('teaching') || name.includes('обучен')) {
      newColor = SEMANTIC_COLORS.learning
    } else if (name.includes('other') || name.includes('другое')) {
      newColor = SEMANTIC_COLORS.other
    }
    
    return { ...cat, color: newColor }
  })
}

/**
 * Проверяет, нужно ли обновление цветов
 */
export const needsColorMigration = (categories) => {
  return categories.some(cat => {
    const name = cat.name.toLowerCase()
    
    // Проверяем, соответствует ли текущий цвет семантическому
    if ((name.includes('remix') || name.includes('development') || name.includes('разработ')) && cat.color !== SEMANTIC_COLORS.deepWork) return true
    if ((name.includes('marketing') || name.includes('маркетинг')) && cat.color !== SEMANTIC_COLORS.communication) return true
    if ((name.includes('design') || name.includes('дизайн')) && cat.color !== SEMANTIC_COLORS.creative) return true
    if ((name.includes('management') || name.includes('менеджмент') || name.includes('consulting') || name.includes('консультац')) && cat.color !== SEMANTIC_COLORS.consulting) return true
    if ((name.includes('teaching') || name.includes('обучен')) && cat.color !== SEMANTIC_COLORS.learning) return true
    if ((name.includes('other') || name.includes('другое')) && cat.color !== SEMANTIC_COLORS.other) return true
    
    return false
  })
}

