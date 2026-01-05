import { memo, useMemo } from 'react'
import { Trophy, ArrowRight, Wallet, Clock } from 'lucide-react'
import { useEntries } from '../../store/useEntriesStore'
import { useCategories, useTheme } from '../../store/useSettingsStore'

import { formatCurrency } from '../../utils/formatting'
import { InfoTooltip } from '../ui/InfoTooltip'

export const TopProjectsWidget = memo(({ shouldAnimate = true }: { shouldAnimate?: boolean }) => {
  const entries = useEntries()
  const categories = useCategories()
  const theme = useTheme()

  const topProjects = useMemo(() => {
    // 1. Filter entries for current month
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const monthlyEntries = entries.filter(e => {
        const d = new Date(e.date)
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear
    })

    if (monthlyEntries.length === 0) return []

    // 2. Aggregate by category
    const stats: Record<string, { earned: number, hours: number, count: number }> = {}
    
    monthlyEntries.forEach(entry => {
        const catName = entry.category || 'Без категории'
        if (!stats[catName]) stats[catName] = { earned: 0, hours: 0, count: 0 }
        
        const earned = parseFloat(String(entry.earned || 0))
        const duration = parseFloat(String(entry.duration || 0))
        
        stats[catName].earned += earned
        stats[catName].hours += duration
        stats[catName].count += 1
    })

    // 3. Convert to array and sort
    return Object.entries(stats)
        .map(([name, data]) => {
            const catConfig = categories.find(c => c.name === name)
            return {
                name,
                ...data,
                color: catConfig?.color || '#9CA3AF',
                icon: catConfig?.icon
            }
        })
        .sort((a, b) => b.earned - a.earned)
        .slice(0, 3) // Take top 3
  }, [entries, categories])

  if (topProjects.length === 0) {
      return (
        <div className="glass-card flex flex-col items-center justify-center p-6 text-center h-full min-h-[180px] border border-gray-200 dark:border-gray-800">
            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full mb-3">
                <Trophy className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Нет данных за этот месяц</p>
        </div>
      )
  }

  const maxEarned = topProjects[0]?.earned || 1

  return (
    <div 
        className="glass-card glow-red relative bg-red-200 dark:bg-red-500/10 border border-transparent hover:border-opacity-100 hover:border-red-500 dark:hover:border-red-400 hover:shadow-lg hover:shadow-red-500/20 transition-all duration-300 group rounded-2xl p-4 overflow-hidden h-full flex flex-col"
        style={{ borderColor: 'rgba(239, 68, 68, 0.4)' }}
    >
        <div className="flex justify-between items-center mb-4 relative z-10">
            <h4 className="font-semibold text-red-600 dark:text-red-400">Топ проекты</h4>
            <InfoTooltip text="Лидеры по заработку за текущий месяц" />
        </div>

        <div className="space-y-3 flex-1 relative z-10">
            {topProjects.map((project, index) => (
                <div 
                    key={project.name}
                    className={`relative ${shouldAnimate ? 'animate-slide-up' : ''}`}
                    style={shouldAnimate ? { animationDelay: `${index * 0.1}s` } : {}}
                >
                    <div className="flex justify-between items-center mb-1 text-sm">
                        <span className="font-medium text-gray-700 dark:text-gray-200 truncate pr-2 max-w-[120px]">
                            {index + 1}. {project.name}
                        </span>
                        <div className="flex items-center gap-2 text-xs">
                            <span className="font-bold text-gray-900 dark:text-white">
                                {formatCurrency(project.earned)}
                            </span>
                        </div>
                    </div>
                    
                    {/* Progress Bar Container */}
                    <div className="relative w-full h-1.5 bg-gray-200 dark:bg-gray-700/50 rounded-full overflow-hidden">
                        <div 
                            className="absolute top-0 left-0 h-full rounded-full transition-all duration-700 ease-out"
                            style={{ 
                                width: `${(project.earned / maxEarned) * 100}%`,
                                backgroundColor: project.color
                            }}
                        />
                    </div>

                    {/* Sub-stats (Hours) on hover or small text */}
                    <div className="mt-0.5 text-[10px] text-gray-400 flex justify-between items-center opacity-70">
                         <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {project.hours.toFixed(1)}ч
                         </span>
                         <span className="text-gray-300 dark:text-gray-600 font-mono">
                            {((project.earned / maxEarned) * 100).toFixed(0)}%
                         </span>
                    </div>
                </div>
            ))}
        </div>
        
        {/* Decorative elements */}
        <Trophy 
            className="absolute -right-5 -bottom-5 w-32 h-32 pointer-events-none transition-all duration-300 text-red-500/50 dark:text-red-400/40 group-hover:text-red-500/80 dark:group-hover:text-red-400/70 group-hover:scale-110" 
            strokeWidth={2}
            fill="none"
        />
    </div>
  )
})
