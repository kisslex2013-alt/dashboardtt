import React from 'react'
import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'

interface SettingsNavItemProps {
  icon: LucideIcon
  title: string
  subtitle?: string
  stats?: string
  accentClass: string // 'blue-500', 'orange-500', etc.
  onClick: () => void
  isActive?: boolean
}

/**
 * Компонент навигации для Settings Modal
 * Унифицирован со стилем GridCard из AboutModal
 */
export function SettingsNavItem({ 
  icon: Icon, 
  title, 
  subtitle,
  stats,
  accentClass, 
  onClick, 
  isActive = false 
}: SettingsNavItemProps) {
  
  const getActiveStyles = () => {
    if (!isActive) return ''
    if (accentClass.includes('amber')) return 'border-amber-500 bg-amber-500/10 shadow-amber-500/20'
    if (accentClass.includes('rose')) return 'border-rose-500 bg-rose-500/10 shadow-rose-500/20'
    if (accentClass.includes('blue')) return 'border-blue-500 bg-blue-500/10 shadow-blue-500/20'
    if (accentClass.includes('indigo')) return 'border-indigo-500 bg-indigo-500/10 shadow-indigo-500/20'
    if (accentClass.includes('emerald')) return 'border-emerald-500 bg-emerald-500/10 shadow-emerald-500/20'
    if (accentClass.includes('violet')) return 'border-violet-500 bg-violet-500/10 shadow-violet-500/20'
    if (accentClass.includes('fuchsia')) return 'border-fuchsia-500 bg-fuchsia-500/10 shadow-fuchsia-500/20'
    if (accentClass.includes('cyan')) return 'border-cyan-500 bg-cyan-500/10 shadow-cyan-500/20'
    if (accentClass.includes('slate')) return 'border-slate-500 bg-slate-500/10 shadow-slate-500/20'
    if (accentClass.includes('sky')) return 'border-sky-500 bg-sky-500/10 shadow-sky-500/20'
    return 'border-gray-500 bg-gray-500/10'
  }

  const getHoverBorderClass = () => {
    if (accentClass.includes('amber')) return 'hover:border-amber-500 dark:hover:border-amber-400'
    if (accentClass.includes('rose')) return 'hover:border-rose-500 dark:hover:border-rose-400'
    if (accentClass.includes('blue')) return 'hover:border-blue-500 dark:hover:border-blue-400'
    if (accentClass.includes('indigo')) return 'hover:border-indigo-500 dark:hover:border-indigo-400'
    if (accentClass.includes('emerald')) return 'hover:border-emerald-500 dark:hover:border-emerald-400'
    if (accentClass.includes('violet')) return 'hover:border-violet-500 dark:hover:border-violet-400'
    if (accentClass.includes('fuchsia')) return 'hover:border-fuchsia-500 dark:hover:border-fuchsia-400'
    if (accentClass.includes('cyan')) return 'hover:border-cyan-500 dark:hover:border-cyan-400'
    if (accentClass.includes('slate')) return 'hover:border-slate-500 dark:hover:border-slate-400'
    if (accentClass.includes('sky')) return 'hover:border-sky-500 dark:hover:border-sky-400'
    return 'hover:border-gray-500'
  }

  const getHoverShadowClass = () => {
    if (accentClass.includes('amber')) return 'hover:shadow-lg hover:shadow-amber-500/20'
    if (accentClass.includes('rose')) return 'hover:shadow-lg hover:shadow-rose-500/20'
    if (accentClass.includes('blue')) return 'hover:shadow-lg hover:shadow-blue-500/20'
    if (accentClass.includes('indigo')) return 'hover:shadow-lg hover:shadow-indigo-500/20'
    if (accentClass.includes('emerald')) return 'hover:shadow-lg hover:shadow-emerald-500/20'
    if (accentClass.includes('violet')) return 'hover:shadow-lg hover:shadow-violet-500/20'
    if (accentClass.includes('fuchsia')) return 'hover:shadow-lg hover:shadow-fuchsia-500/20'
    if (accentClass.includes('cyan')) return 'hover:shadow-lg hover:shadow-cyan-500/20'
    if (accentClass.includes('slate')) return 'hover:shadow-lg hover:shadow-slate-500/20'
    if (accentClass.includes('sky')) return 'hover:shadow-lg hover:shadow-sky-500/20'
    return 'hover:shadow-lg hover:shadow-gray-500/20'
  }

  const getIconColor = () => {
    if (accentClass.includes('amber')) return 'text-amber-500 dark:text-amber-400'
    if (accentClass.includes('rose')) return 'text-rose-500 dark:text-rose-400'
    if (accentClass.includes('blue')) return 'text-blue-500 dark:text-blue-400'
    if (accentClass.includes('indigo')) return 'text-indigo-500 dark:text-indigo-400'
    if (accentClass.includes('emerald')) return 'text-emerald-500 dark:text-emerald-400'
    if (accentClass.includes('violet')) return 'text-violet-500 dark:text-violet-400'
    if (accentClass.includes('fuchsia')) return 'text-fuchsia-500 dark:text-fuchsia-400'
    if (accentClass.includes('cyan')) return 'text-cyan-500 dark:text-cyan-400'
    if (accentClass.includes('slate')) return 'text-slate-500 dark:text-slate-400'
    if (accentClass.includes('sky')) return 'text-sky-500 dark:text-sky-400'
    return 'text-gray-500'
  }

  const getGradient = () => {
    if (accentClass.includes('amber')) return 'bg-gradient-to-br from-amber-500/10 to-transparent'
    if (accentClass.includes('rose')) return 'bg-gradient-to-br from-rose-500/10 to-transparent'
    if (accentClass.includes('blue')) return 'bg-gradient-to-br from-blue-500/10 to-transparent'
    if (accentClass.includes('indigo')) return 'bg-gradient-to-br from-indigo-500/10 to-transparent'
    if (accentClass.includes('emerald')) return 'bg-gradient-to-br from-emerald-500/10 to-transparent'
    if (accentClass.includes('violet')) return 'bg-gradient-to-br from-violet-500/10 to-transparent'
    if (accentClass.includes('fuchsia')) return 'bg-gradient-to-br from-fuchsia-500/10 to-transparent'
    if (accentClass.includes('cyan')) return 'bg-gradient-to-br from-cyan-500/10 to-transparent'
    if (accentClass.includes('slate')) return 'bg-gradient-to-br from-slate-500/10 to-transparent'
    if (accentClass.includes('sky')) return 'bg-gradient-to-br from-sky-500/10 to-transparent'
    return ''
  }

  return (
    <motion.button
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-xl text-left w-full
        glass-card border 
        ${isActive 
          ? `${getActiveStyles()} shadow-md` 
          : `border-transparent ${getGradient()} ${getHoverBorderClass()} ${getHoverShadowClass()}`
        }
        transition-all duration-300 ease-out
        hover:scale-[1.02] hover:-translate-y-0.5
        focus:outline-none focus:ring-2 focus:ring-white/50
        group
        p-3
      `}
      whileTap={{ scale: 0.98 }}
    >
      {/* Контент */}
      <div className="relative z-10 flex items-start gap-3">
        {/* Иконка с фоном */}
        <div className={`p-2 rounded-lg bg-white/50 dark:bg-black/20 backdrop-blur-sm ${getIconColor()} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 flex-shrink-0`}>
          <Icon className="w-5 h-5" strokeWidth={2} />
        </div>
        
        {/* Текстовый контент */}
        <div className="flex-1 min-w-0">
          <h3 className={`font-bold text-sm mb-0 ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-800 dark:text-gray-200'}`}>
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium truncate">
              {subtitle}
            </p>
          )}
          {stats && (
            <span className={`text-xs font-semibold ${getIconColor()} mt-1 block`}>
              {stats}
            </span>
          )}
        </div>
      </div>
    </motion.button>
  )
}
