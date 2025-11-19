/**
 * 🛣️ Route-based Code Splitting для основных секций приложения
 *
 * Реализует условный route-based splitting без React Router:
 * - Разделяет основные секции на отдельные chunks
 * - Использует lazy loading для каждой секции
 * - Поддерживает Suspense с fallback компонентами
 *
 * Виртуальные "роуты" основаны на состоянии приложения:
 * - statistics - секция статистики
 * - analytics - секция аналитики
 * - entries - список записей
 * - pomodoro - панель помодоро (условно)
 */

import { lazy, Suspense, type ComponentType, type ReactNode } from 'react'
import { SkeletonCard, SkeletonList } from '../components/ui/SkeletonCard'

/**
 * Типы виртуальных роутов
 */
export type VirtualRoute = 'statistics' | 'analytics' | 'entries' | 'pomodoro'

/**
 * Lazy-loaded компоненты для каждой секции
 * Каждая секция загружается в отдельный chunk
 */

// ✅ ROUTE-BASED SPLITTING: Statistics route chunk
export const StatisticsRoute = lazy(() =>
  import('../components/statistics/StatisticsOverview').then(module => ({
    default: module.StatisticsOverview,
  }))
)

// ✅ ROUTE-BASED SPLITTING: Analytics route chunk
export const AnalyticsRoute = lazy(() => import('../components/statistics/AnalyticsSection'))

// ✅ ROUTE-BASED SPLITTING: Entries route chunk
export const EntriesRoute = lazy(() =>
  import('../components/entries/EntriesList').then(module => ({
    default: module.EntriesList,
  }))
)

// ✅ ROUTE-BASED SPLITTING: Pomodoro route chunk
export const PomodoroRoute = lazy(() =>
  import('../components/pomodoro/PomodoroPanel').then(module => ({
    default: module.PomodoroPanel,
  }))
)

/**
 * Fallback компоненты для каждой секции
 */
const RouteFallbacks: Record<VirtualRoute, ReactNode> = {
  statistics: <SkeletonCard variant="statistic" />,
  analytics: (
    <div className="mb-6">
      <div className="glass-effect rounded-xl p-8 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            Загрузка графиков и аналитики...
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Это происходит только при первой загрузке
          </p>
        </div>
      </div>
    </div>
  ),
  entries: (
    <div className="glass-effect rounded-xl p-6">
      <SkeletonList count={3} variant="listItem" />
    </div>
  ),
  pomodoro: <SkeletonCard variant="default" className="p-4" />,
}

/**
 * Компонент-обертка для route-based splitting с Suspense
 */
interface RouteWrapperProps {
  route: VirtualRoute
  children: ReactNode
  fallback?: ReactNode
}

export function RouteWrapper({ route, children, fallback }: RouteWrapperProps) {
  return <Suspense fallback={fallback || RouteFallbacks[route]}>{children}</Suspense>
}

/**
 * Хук для получения lazy-loaded компонента по роуту
 */
export function useRouteComponent(route: VirtualRoute): ComponentType<any> {
  switch (route) {
    case 'statistics':
      return StatisticsRoute
    case 'analytics':
      return AnalyticsRoute
    case 'entries':
      return EntriesRoute
    case 'pomodoro':
      return PomodoroRoute
    default:
      return StatisticsRoute
  }
}

