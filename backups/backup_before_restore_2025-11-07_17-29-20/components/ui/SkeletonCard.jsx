/**
 * 💀 Skeleton Loading Card
 * 
 * Компонент для отображения состояния загрузки в виде skeleton
 * Улучшает воспринимаемую производительность приложения
 * 
 * Использование:
 * - При загрузке списков записей
 * - При расчете статистики в Web Worker
 * - При фильтрации больших объемов данных
 */

export function SkeletonCard({ variant = 'default', className = '' }) {
  // ВИЗУАЛ: Разные варианты skeleton для разных контекстов
  const variants = {
    // Для карточек записей
    entry: (
      <div className={`glass-effect rounded-xl p-6 animate-pulse ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-700" />
            <div className="flex-1">
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2" />
            </div>
          </div>
          <div className="w-20 h-6 bg-gray-300 dark:bg-gray-700 rounded" />
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-full" />
          <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-5/6" />
        </div>
        <div className="flex gap-2 mt-4">
          <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-24" />
          <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-24" />
        </div>
      </div>
    ),
    
    // Для статистических карточек
    statistic: (
      <div className={`glass-effect rounded-xl p-6 animate-pulse ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 rounded-lg bg-gray-300 dark:bg-gray-700" />
          <div className="w-16 h-6 bg-gray-300 dark:bg-gray-700 rounded" />
        </div>
        <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-2" />
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2" />
      </div>
    ),
    
    // Для списка записей (аккордеон)
    listItem: (
      <div className={`glass-effect rounded-xl p-4 animate-pulse ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded w-32" />
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-20" />
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full" />
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-4/5" />
        </div>
      </div>
    ),
    
    // По умолчанию - универсальный skeleton
    default: (
      <div className={`glass-effect rounded-xl p-6 animate-pulse ${className}`}>
        <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-4" />
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mb-2" />
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-2/3" />
      </div>
    ),
  };

  return variants[variant] || variants.default;
}

/**
 * 💀 Skeleton List
 * 
 * Компонент для отображения нескольких skeleton карточек
 */
export function SkeletonList({ count = 6, variant = 'default', className = '' }) {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} variant={variant} />
      ))}
    </div>
  );
}

/**
 * 💀 Skeleton Grid
 * 
 * Компонент для отображения skeleton карточек в сетке
 */
export function SkeletonGrid({ count = 6, variant = 'default', columns = 3, className = '' }) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={`grid ${gridCols[columns] || gridCols[3]} gap-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} variant={variant} />
      ))}
    </div>
  );
}

