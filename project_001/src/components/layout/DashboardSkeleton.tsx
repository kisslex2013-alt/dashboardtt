/**
 * 💀 Dashboard Skeleton Loader
 *
 * Профессиональный skeleton loader, который повторяет структуру дашборда:
 * - Header (шапка с логотипом и кнопками)
 * - Statistics cards (карточки статистики)
 * - Task list (список задач)
 *
 * Использует shimmer анимацию для улучшения воспринимаемой производительности
 */

import { SkeletonCard, SkeletonGrid, SkeletonList } from '../ui/SkeletonCard'

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300" aria-busy="true" aria-live="polite">
      {/* ✅ A11Y: Скрытый текст для screen readers */}
      <div className="sr-only">Загрузка данных дашборда...</div>

      <div className="max-w-7xl mx-auto p-6 relative z-20">
        {/* Header Skeleton */}
        <div className="glass-effect rounded-xl p-4 sm:p-6 mb-6 relative overflow-hidden">
          {/* Shimmer эффект */}
          <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent dark:via-white/5" />
          
          {/* Верхняя строка с логотипом и кнопками */}
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
              {/* Логотип */}
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gray-300 dark:bg-gray-700 animate-pulse" />
              
              {/* Название и описание */}
              <div className="flex-1 min-w-0">
                <div className="h-6 sm:h-8 bg-gray-300 dark:bg-gray-700 rounded w-48 sm:w-64 mb-2 animate-pulse" />
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-40 sm:w-56 animate-pulse" style={{ animationDelay: '0.1s' }} />
              </div>
            </div>

            {/* Кнопки действий */}
            <div className="flex gap-2 items-center flex-shrink-0">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gray-300 dark:bg-gray-700 animate-pulse"
                  style={{ animationDelay: `${0.2 + i * 0.1}s` }}
                />
              ))}
            </div>
          </div>

          {/* Статистика в шапке (компактные карточки) */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="glass-effect rounded-lg p-3 sm:p-4 relative overflow-hidden"
              >
                <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent dark:via-white/5" />
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-gray-300 dark:bg-gray-700 animate-pulse" />
                  <div className="w-12 h-4 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" style={{ animationDelay: '0.1s' }} />
                </div>
                <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-1 animate-pulse" style={{ animationDelay: '0.2s' }} />
                <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2 animate-pulse" style={{ animationDelay: '0.3s' }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6 relative z-20">
        {/* Statistics Overview Skeleton */}
        <div className="mb-6">
          <SkeletonCard variant="default" className="p-4 mb-4">
            <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-48 mb-4 animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-24 bg-gray-300 dark:bg-gray-700 rounded-lg animate-pulse"
                  style={{ animationDelay: `${0.1 * i}s` }}
                />
              ))}
            </div>
          </SkeletonCard>
        </div>

        {/* Analytics Section Skeleton */}
        <div className="mb-6">
          <SkeletonCard variant="default" className="p-6">
            <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-40 mb-4 animate-pulse" />
            <div className="h-64 bg-gray-300 dark:bg-gray-700 rounded-lg animate-pulse" style={{ animationDelay: '0.1s' }} />
          </SkeletonCard>
        </div>

        {/* Entries List Skeleton */}
        <div className="glass-effect rounded-xl p-6 relative overflow-hidden">
          <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent dark:via-white/5" />
          
          {/* Заголовок списка */}
          <div className="flex items-center justify-between mb-6">
            <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-32 animate-pulse" />
            <div className="flex gap-2">
              <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-24 animate-pulse" style={{ animationDelay: '0.1s' }} />
              <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-24 animate-pulse" style={{ animationDelay: '0.2s' }} />
            </div>
          </div>

          {/* Список задач */}
          <SkeletonList count={5} variant="listItem" />
        </div>
      </main>
    </div>
  )
}
