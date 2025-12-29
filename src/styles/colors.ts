/**
 * 🎨 Семантическая цветовая система
 */

interface SemanticColor {
  main: string
  light: string
  dark: string
  bg: string
  label: string
}

export const SEMANTIC_COLORS: Record<string, SemanticColor> = {
  deepWork: {
    main: '#6366F1',
    light: '#818CF8',
    dark: '#4F46E5',
    bg: 'rgba(99, 102, 241, 0.1)',
    label: 'Глубокая работа',
  },
  communication: {
    main: '#F59E0B',
    light: '#FBBF24',
    dark: '#D97706',
    bg: 'rgba(245, 158, 11, 0.1)',
    label: 'Общение',
  },
  learning: {
    main: '#8B5CF6',
    light: '#A78BFA',
    dark: '#7C3AED',
    bg: 'rgba(139, 92, 246, 0.1)',
    label: 'Обучение',
  },
  urgent: {
    main: '#EF4444',
    light: '#F87171',
    dark: '#DC2626',
    bg: 'rgba(239, 68, 68, 0.1)',
    label: 'Срочное',
  },
  personal: {
    main: '#10B981',
    light: '#34D399',
    dark: '#059669',
    bg: 'rgba(16, 185, 129, 0.1)',
    label: 'Личное',
  },
  routine: {
    main: '#64748B',
    light: '#94A3B8',
    dark: '#475569',
    bg: 'rgba(100, 116, 139, 0.1)',
    label: 'Рутина',
  },
  creative: {
    main: '#EC4899',
    light: '#F472B6',
    dark: '#DB2777',
    bg: 'rgba(236, 72, 153, 0.1)',
    label: 'Креатив',
  },
  other: {
    main: '#6B7280',
    light: '#9CA3AF',
    dark: '#4B5563',
    bg: 'rgba(107, 114, 128, 0.1)',
    label: 'Другое',
  },
}

export const GRADIENTS: Record<string, string> = {
  success: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
  warning: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
  error: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
  primary: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
  purple: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
  pink: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)',
}

export const STATUS_COLORS: Record<string, string> = {
  active: '#10B981',
  paused: '#F59E0B',
  completed: '#6366F1',
  overdue: '#EF4444',
  idle: '#6B7280',
}

export const CHART_COLORS = {
  primary: ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#64748B'],
  earnings: '#10B981',
  hours: '#6366F1',
  rate: '#F59E0B',
  goal: '#8B5CF6',
  actual: '#10B981',
  planned: '#94A3B8',
}

export const getCategoryColor = (categoryName?: string): SemanticColor => {
  const name = categoryName?.toLowerCase() || ''

  if (name.includes('разработ') || name.includes('код') || name.includes('програм')) {
    return SEMANTIC_COLORS.deepWork!
  }
  if (name.includes('встреч') || name.includes('звон') || name.includes('общен')) {
    return SEMANTIC_COLORS.communication!
  }
  if (name.includes('обуч') || name.includes('курс') || name.includes('книг')) {
    return SEMANTIC_COLORS.learning!
  }
  if (name.includes('срочн') || name.includes('важн') || name.includes('критич')) {
    return SEMANTIC_COLORS.urgent!
  }
  if (name.includes('личн') || name.includes('хобби') || name.includes('отдых')) {
    return SEMANTIC_COLORS.personal!
  }
  if (name.includes('админ') || name.includes('рутин') || name.includes('документ')) {
    return SEMANTIC_COLORS.routine!
  }
  if (name.includes('креатив') || name.includes('дизайн') || name.includes('творч')) {
    return SEMANTIC_COLORS.creative!
  }

  return SEMANTIC_COLORS.other!
}

export const getProgressGradient = (percentage: number): string => {
  if (percentage >= 100) return GRADIENTS.success!
  if (percentage >= 75) return GRADIENTS.primary!
  if (percentage >= 50) return GRADIENTS.warning!
  return GRADIENTS.error!
}
