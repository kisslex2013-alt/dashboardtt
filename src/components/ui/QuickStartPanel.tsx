import { useState, useMemo } from 'react'
import { useCategories } from '../../store/useSettingsStore'
import { useIsRunning } from '../../store/useTimerStore'
import { useTimer } from '../../hooks/useTimer'
import { getIcon } from '../../utils/iconHelper'
import { ChevronDown, ChevronUp } from '../../utils/icons'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * 🚀 Quick Start Panel - Панель быстрого запуска таймера
 *
 * Позволяет запустить таймер одним кликом по категории
 * Показывает самые часто используемые категории
 *
 * Phase 1: Quick Wins
 */
export function QuickStartPanel() {
  const categories = useCategories()
  const isRunning = useIsRunning()
  const { start } = useTimer()
  const [isExpanded, setIsExpanded] = useState(true)

  // Получаем топ-5 категорий (можно будет расширить до "самых используемых")
  const topCategories = useMemo(() => {
    return categories.slice(0, 5)
  }, [categories])

  const handleQuickStart = (categoryName) => {
    if (isRunning) {
      // Если таймер уже запущен, не делаем ничего
      return
    }

    start(categoryName)
  }

  // Если категорий нет, не показываем панель
  if (topCategories.length === 0) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="glass-effect rounded-xl p-4 mb-6"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Быстрый старт
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Запустите таймер одним кликом
          </span>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label={isExpanded ? 'Свернуть' : 'Развернуть'}
        >
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          )}
        </button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-2">
              {topCategories.map((category) => {
                const isActive = isRunning
                const IconComponent = getIcon(category.icon)

                return (
                  <motion.button
                    key={category.id}
                    onClick={() => handleQuickStart(category.name)}
                    disabled={isActive}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-lg font-medium
                      transition-all duration-200
                      ${isActive
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:scale-105 active:scale-95'
                      }
                    `}
                    style={{
                      backgroundColor: isActive
                        ? '#9CA3AF'
                        : category.color || '#6366F1',
                      color: '#FFFFFF',
                    }}
                    whileHover={!isActive ? { scale: 1.05 } : {}}
                    whileTap={!isActive ? { scale: 0.95 } : {}}
                  >
                    {IconComponent && <IconComponent className="w-4 h-4" />}
                    <span>{category.name}</span>
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

