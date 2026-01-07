import React from 'react'
import { motion } from 'framer-motion'
import { Sun, Moon, Laptop, Check } from 'lucide-react'
import { useTheme, useSetTheme } from '../../../../store/useSettingsStore'

export function ThemeSection() {
  const theme = useTheme()
  const setTheme = useSetTheme()

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme)
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const themes = [
    { id: 'light', name: 'Светлая', icon: Sun },
    { id: 'dark', name: 'Тёмная', icon: Moon },
    // { id: 'system', name: 'Системная', icon: Laptop, disabled: true },
  ]

  return (
    <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-100 dark:border-gray-800 backdrop-blur-sm">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
        <span>Тема оформления</span>
      </h3>
      
      <div className="grid grid-cols-2 gap-3">
        {themes.map((item) => {
           const isActive = theme === item.id
           const Icon = item.icon
           
           return (
             <button
               key={item.id}
               onClick={() => handleThemeChange(item.id as 'light' | 'dark')}
               className={`
                 relative flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all duration-200
                 ${isActive 
                   ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 ring-1 ring-blue-500/20' 
                   : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm'
                 }
               `}
             >
               {isActive && (
                 <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                   <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                 </div>
               )}
               
               <div className={`p-2 rounded-full ${isActive ? 'bg-blue-100 text-blue-600 dark:bg-blue-800 dark:text-blue-200' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                 <Icon className="w-5 h-5" />
               </div>
               <span className={`text-xs font-medium ${isActive ? 'text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-300'}`}>
                 {item.name}
               </span>
             </button>
           )
        })}
      </div>
    </div>
  )
}
