import React from 'react'
import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'

interface SettingsNavItemProps {
  icon: LucideIcon
  title: string
  accentClass: string // 'blue-500', 'orange-500', etc.
  onClick: () => void
  isActive?: boolean
}

/**
 * Компактный пункт навигации для Settings Modal
 * Горизонтальный layout: иконка слева, текст справа
 */
export function SettingsNavItem({ icon: Icon, title, accentClass, onClick, isActive = false }: SettingsNavItemProps) {
  
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
    return 'border-gray-500 bg-gray-500/10'
  }

  const getHoverBorderClass = () => {
    if (accentClass.includes('amber')) return 'hover:border-amber-500/50'
    if (accentClass.includes('rose')) return 'hover:border-rose-500/50'
    if (accentClass.includes('blue')) return 'hover:border-blue-500/50'
    if (accentClass.includes('indigo')) return 'hover:border-indigo-500/50'
    if (accentClass.includes('emerald')) return 'hover:border-emerald-500/50'
    if (accentClass.includes('violet')) return 'hover:border-violet-500/50'
    if (accentClass.includes('fuchsia')) return 'hover:border-fuchsia-500/50'
    if (accentClass.includes('cyan')) return 'hover:border-cyan-500/50'
    return 'hover:border-gray-500/50'
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
    return 'text-gray-500'
  }

  return (
    <motion.button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
        border transition-all duration-200 ease-out
        ${isActive 
          ? `${getActiveStyles()} shadow-md` 
          : `border-transparent hover:bg-gray-100/50 dark:hover:bg-gray-800/50 ${getHoverBorderClass()}`
        }
        focus:outline-none focus:ring-2 focus:ring-white/30
        group
      `}
      whileTap={{ scale: 0.98 }}
    >
      {/* Icon */}
      <div className={`p-1.5 rounded-md bg-white/50 dark:bg-black/20 ${getIconColor()} transition-transform duration-200 group-hover:scale-110`}>
        <Icon className="w-4 h-4" strokeWidth={2} />
      </div>
      
      {/* Title */}
      <span className={`text-sm font-medium ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
        {title}
      </span>
    </motion.button>
  )
}
