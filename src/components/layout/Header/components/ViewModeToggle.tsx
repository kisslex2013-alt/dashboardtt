/**
 * 🎯 ViewModeToggle — переключатель между Focus и Analytics режимами
 * 
 * Focus Mode: Только работа — таймер, список записей
 * Analytics Mode: Полная аналитика — графики, предсказания, сравнения
 */

import { Focus, BarChart3 } from 'lucide-react'
import { useViewMode, useSetViewMode } from '../../../../store/useSettingsStore'

export function ViewModeToggle() {
  const viewMode = useViewMode()
  const setViewMode = useSetViewMode()

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => setViewMode('focus')}
        className={`
          glass-button p-2 rounded-lg transition-normal hover-lift-scale click-shrink
          ${viewMode === 'focus' 
            ? 'ring-2 ring-purple-500/50 text-purple-500 dark:text-purple-400' 
            : ''
          }
        `}
        title="Focus Mode — только работа (Ctrl+Shift+F)"
        aria-label="Focus Mode"
        data-tour="view-mode-focus"
      >
        <Focus className="w-5 h-5" />
      </button>
      
      <button
        onClick={() => setViewMode('analytics')}
        className={`
          glass-button p-2 rounded-lg transition-normal hover-lift-scale click-shrink
          ${viewMode === 'analytics' 
            ? 'ring-2 ring-blue-500/50 text-blue-500 dark:text-blue-400' 
            : ''
          }
        `}
        title="Analytics Mode — полная аналитика (Ctrl+Shift+F)"
        aria-label="Analytics Mode"
        data-tour="view-mode-analytics"
      >
        <BarChart3 className="w-5 h-5" />
      </button>
    </div>
  )
}
