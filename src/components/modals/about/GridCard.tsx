import React from 'react'
import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'

interface GridCardProps {
  icon: LucideIcon
  title: string
  subtitle: string
  stats: string
  accentClass: string // 'blue-500', 'orange-500', etc.
  onClick: () => void
  compact?: boolean
}

/**
 * Компонент карточки для grid layout в About Modal
 * Редизайн: Стиль StatCard (Glass effect + цветная обводка)
 */
export function GridCard({ icon: Icon, title, subtitle, stats, accentClass, onClick, compact = false }: GridCardProps) {
  
  // Хелперы для цветов (аналогично StatCard)
  const getHoverBorderClass = () => {
    if (accentClass.includes('blue')) return 'hover:border-blue-500 dark:hover:border-blue-400'
    if (accentClass.includes('orange')) return 'hover:border-orange-500 dark:hover:border-orange-400'
    if (accentClass.includes('purple')) return 'hover:border-purple-500 dark:hover:border-purple-400'
    if (accentClass.includes('green')) return 'hover:border-green-500 dark:hover:border-green-400'
    return 'hover:border-gray-500'
  }

  const getHoverShadowClass = () => {
    if (accentClass.includes('blue')) return 'hover:shadow-lg hover:shadow-blue-500/20'
    if (accentClass.includes('orange')) return 'hover:shadow-lg hover:shadow-orange-500/20'
    if (accentClass.includes('purple')) return 'hover:shadow-lg hover:shadow-purple-500/20'
    if (accentClass.includes('green')) return 'hover:shadow-lg hover:shadow-green-500/20'
    return 'hover:shadow-lg hover:shadow-gray-500/20'
  }

  const getIconColor = () => {
    if (accentClass.includes('blue')) return 'text-blue-500 dark:text-blue-400'
    if (accentClass.includes('orange')) return 'text-orange-500 dark:text-orange-400'
    if (accentClass.includes('purple')) return 'text-purple-500 dark:text-purple-400'
    if (accentClass.includes('green')) return 'text-green-500 dark:text-green-400'
    return 'text-gray-500'
  }

  const getGradient = () => {
    if (accentClass.includes('blue')) return 'bg-gradient-to-br from-blue-500/10 to-transparent'
    if (accentClass.includes('orange')) return 'bg-gradient-to-br from-orange-500/10 to-transparent'
    if (accentClass.includes('purple')) return 'bg-gradient-to-br from-purple-500/10 to-transparent'
    if (accentClass.includes('green')) return 'bg-gradient-to-br from-green-500/10 to-transparent'
    return ''
  }

  return (
    <motion.button
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-xl text-left
        glass-card border border-transparent
        ${getGradient()}
        ${getHoverBorderClass()} ${getHoverShadowClass()}
        transition-all duration-300 ease-out
        hover:scale-[1.02] hover:-translate-y-1
        focus:outline-none focus:ring-2 focus:ring-white/50
        group
        w-full h-full 
        ${compact ? 'p-4 min-h-[100px]' : 'p-5 min-h-[140px]'}
      `}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Контент */}
      <div className="relative z-10 flex flex-col justify-between h-full">
        <div className="flex justify-between items-start mb-2">
           {/* Иконка с фоном */}
          <div className={`p-2 rounded-lg bg-white/50 dark:bg-black/20 backdrop-blur-sm ${getIconColor()} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
            <Icon className={compact ? "w-5 h-5" : "w-6 h-6"} strokeWidth={2} />
          </div>
          
          {/* Стрелочка */}
          <motion.svg
            className={`w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 dark:text-gray-500`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            initial={{ x: -5 }}
            whileHover={{ x: 0 }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </motion.svg>
        </div>

        <div>
          <h3 className={`font-bold text-gray-900 dark:text-white mb-0.5 ${compact ? 'text-sm' : 'text-lg'}`}>{title}</h3>
          <p className={`text-gray-500 dark:text-gray-400 font-medium ${compact ? 'text-xs' : 'text-sm'}`}>{subtitle}</p>
          
          <div className={`mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center`}>
             <span className={`font-semibold ${getIconColor()} ${compact ? 'text-xs' : 'text-sm'}`}>
              {stats}
             </span>
          </div>
        </div>
      </div>
    </motion.button>
  )
}
