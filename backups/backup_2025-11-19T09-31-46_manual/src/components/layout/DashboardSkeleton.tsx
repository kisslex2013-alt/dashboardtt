import React from 'react'

const shimmerBase =
  'animate-pulse rounded-lg bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800'

function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`${shimmerBase} ${className}`} aria-hidden="true" />
}

function SkeletonBadgeRow({ count }: { count: number }) {
  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonBlock key={`badge-${index}`} className="h-10 w-16 rounded-full" />
      ))}
    </div>
  )
}

function SkeletonCardGrid({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonBlock key={`card-${index}`} className="h-28" />
      ))}
    </div>
  )
}

function SkeletonList({ count }: { count: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonBlock key={`list-${index}`} className="h-12" />
      ))}
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-live="polite" aria-busy="true">
      <span className="sr-only">Загрузка панели управления...</span>

      {/* Header + stats cards */}
      <section className="glass-effect rounded-xl p-4 sm:p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <SkeletonBlock className="h-12 w-12 rounded-2xl" />
            <div className="space-y-2">
              <SkeletonBlock className="h-4 w-40 sm:w-56" />
              <SkeletonBlock className="h-3 w-24 sm:w-40" />
            </div>
          </div>
          <SkeletonBadgeRow count={4} />
        </div>

        <SkeletonCardGrid count={4} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: charts + stats */}
        <div className="space-y-6 lg:col-span-2">
          <div className="glass-effect rounded-xl p-6 space-y-4">
            <SkeletonBlock className="h-5 w-32" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <SkeletonBlock key={`analytics-${index}`} className="h-40" />
              ))}
            </div>
          </div>

          <div className="glass-effect rounded-xl p-6 space-y-4">
            <SkeletonBlock className="h-5 w-40" />
            <SkeletonList count={5} />
          </div>
        </div>

        {/* Right column: tasks / upcoming items */}
        <div className="glass-effect rounded-xl p-6 space-y-4">
          <SkeletonBlock className="h-5 w-48" />
          <SkeletonList count={6} />
        </div>
      </section>
    </div>
  )
}


