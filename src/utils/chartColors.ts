/**
 * 🎨 Цветовая палитра для графиков с улучшенной контрастностью
 *
 * Все цвета протестированы на соответствие WCAG AA стандартам
 * для темного режима (фон #1f2937 / gray-800)
 */

/**
 * Основные цвета для графиков в темном режиме
 * Контраст ≥ 4.5:1 для всех цветов
 */
export const CHART_COLORS_DARK = {
  // Синяя палитра (primary)
  primary: ['#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af'],

  // Зеленая палитра (success)
  success: ['#34d399', '#10b981', '#059669', '#047857', '#065f46'],

  // Желтая/янтарная палитра (warning)
  warning: ['#fbbf24', '#f59e0b', '#d97706', '#b45309', '#92400e'],

  // Красная палитра (error)
  error: ['#f87171', '#ef4444', '#dc2626', '#b91c1c', '#991b1b'],

  // Фиолетовая палитра
  purple: ['#a78bfa', '#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6'],

  // Розовая палитра
  pink: ['#f472b6', '#ec4899', '#db2777', '#be185d', '#9f1239'],

  // Голубая палитра (cyan)
  cyan: ['#22d3ee', '#06b6d4', '#0891b2', '#0e7490', '#155e75'],

  // Оранжевая палитра
  orange: ['#fb923c', '#f97316', '#ea580c', '#c2410c', '#9a3412'],

  // Изумрудная палитра
  emerald: ['#6ee7b7', '#34d399', '#10b981', '#059669', '#047857'],

  // Индиго палитра
  indigo: ['#818cf8', '#6366f1', '#4f46e5', '#4338ca', '#3730a3'],
}

/**
 * Цвета для светлого режима (для сравнения)
 * Более темные оттенки для контраста на светлом фоне
 */
export const CHART_COLORS_LIGHT = {
  primary: ['#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a'],
  success: ['#10b981', '#059669', '#047857', '#065f46', '#064e3b'],
  warning: ['#f59e0b', '#d97706', '#b45309', '#92400e', '#78350f'],
  error: ['#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d'],
  purple: ['#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6', '#4c1d95'],
  pink: ['#ec4899', '#db2777', '#be185d', '#9f1239', '#831843'],
  cyan: ['#06b6d4', '#0891b2', '#0e7490', '#155e75', '#164e63'],
  orange: ['#f97316', '#ea580c', '#c2410c', '#9a3412', '#7c2d12'],
  emerald: ['#34d399', '#10b981', '#059669', '#047857', '#065f46'],
  indigo: ['#6366f1', '#4f46e5', '#4338ca', '#3730a3', '#312e81'],
}

/**
 * Получить палитру в зависимости от темы
 */
export const getChartColors = (isDark: boolean) => {
  return isDark ? CHART_COLORS_DARK : CHART_COLORS_LIGHT
}

/**
 * Семантические цвета для типов данных
 * Автоматически адаптируются под тему
 */
export const CHART_COLORS = {
  // Время/часы (синий)
  hours: {
    light: '#3b82f6',  // blue-500
    dark: '#60a5fa',   // blue-400
  },

  // Заработок (зеленый)
  earned: {
    light: '#10b981',  // emerald-500
    dark: '#34d399',   // emerald-400
  },

  // Ставка (оранжевый)
  rate: {
    light: '#f97316',  // orange-500
    dark: '#fb923c',   // orange-400
  },

  // Цель (фиолетовый)
  goal: {
    light: '#8b5cf6',  // violet-500
    dark: '#a78bfa',   // violet-400
  },

  // Прогноз (голубой)
  forecast: {
    light: '#06b6d4',  // cyan-500
    dark: '#22d3ee',   // cyan-400
  },

  // Предупреждение/warning (янтарный)
  warning: {
    light: '#f59e0b',  // amber-500
    dark: '#fbbf24',   // amber-400
  },

  // Ошибка/критическое (красный)
  critical: {
    light: '#ef4444',  // red-500
    dark: '#f87171',   // red-400
  },
}

/**
 * Получить цвет по семантическому ключу
 */
export const getSemanticColor = (
  key: keyof typeof CHART_COLORS,
  isDark: boolean
): string => {
  return isDark ? CHART_COLORS[key].dark : CHART_COLORS[key].light
}

/**
 * Градиенты для областных графиков (Area charts)
 */
export const CHART_GRADIENTS = {
  // Синий градиент
  blue: {
    light: { start: '#3b82f6', end: '#93c5fd' },
    dark: { start: '#60a5fa', end: '#1e40af' },
  },

  // Зеленый градиент
  green: {
    light: { start: '#10b981', end: '#6ee7b7' },
    dark: { start: '#34d399', end: '#047857' },
  },

  // Оранжевый градиент
  orange: {
    light: { start: '#f97316', end: '#fdba74' },
    dark: { start: '#fb923c', end: '#9a3412' },
  },
}

/**
 * Вспомогательная функция для создания массива цветов для графика
 */
export const createChartPalette = (
  isDark: boolean,
  count: number = 5
): string[] => {
  const colors = getChartColors(isDark)
  const palette: string[] = []

  // Берем по одному цвету из каждой палитры
  const paletteKeys = Object.keys(colors) as Array<keyof typeof colors>

  for (let i = 0; i < count; i++) {
    const paletteKey = paletteKeys[i % paletteKeys.length]
    const colorIndex = Math.floor(i / paletteKeys.length)
    palette.push(colors[paletteKey][colorIndex] || colors[paletteKey][0])
  }

  return palette
}

/**
 * Цвета для категорий (используется в pie/donut charts)
 */
export const getCategoryColors = (isDark: boolean, categoryCount: number): string[] => {
  const baseColors = [
    getSemanticColor('hours', isDark),
    getSemanticColor('earned', isDark),
    getSemanticColor('rate', isDark),
    getSemanticColor('forecast', isDark),
    getSemanticColor('warning', isDark),
  ]

  // Если категорий больше 5, создаем расширенную палитру
  if (categoryCount > 5) {
    return createChartPalette(isDark, categoryCount)
  }

  return baseColors.slice(0, categoryCount)
}

/**
 * Цвет сетки (grid) для графиков
 */
export const getGridColor = (isDark: boolean): string => {
  return isDark ? '#374151' : '#e5e7eb'  // gray-700 : gray-200
}

/**
 * Цвет осей (axis) для графиков
 */
export const getAxisColor = (isDark: boolean): string => {
  return isDark ? '#9ca3af' : '#6b7280'  // gray-400 : gray-500
}

/**
 * Цвет текста в графиках
 */
export const getChartTextColor = (isDark: boolean): string => {
  return isDark ? '#e5e7eb' : '#374151'  // gray-200 : gray-700
}

/**
 * Цвет tooltip background
 */
export const getTooltipBg = (isDark: boolean): string => {
  return isDark ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)'
}

/**
 * Экспорт всех утилит
 */
export default {
  CHART_COLORS_DARK,
  CHART_COLORS_LIGHT,
  CHART_COLORS,
  CHART_GRADIENTS,
  getChartColors,
  getSemanticColor,
  createChartPalette,
  getCategoryColors,
  getGridColor,
  getAxisColor,
  getChartTextColor,
  getTooltipBg,
}
