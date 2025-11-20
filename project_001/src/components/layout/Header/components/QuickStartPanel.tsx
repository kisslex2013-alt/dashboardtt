import { createPortal } from 'react-dom'
import { Play } from '../../../../utils/icons'
import { useCategories } from '../../../../store/useSettingsStore'
import { useIsRunning } from '../../../../store/useTimerStore'
import { useTimer } from '../../../../hooks/useTimer'
import { getIcon } from '../../../../utils/iconHelper'
import { useQuickStart } from '../hooks/useQuickStart'

/**
 * Компонент панели быстрого старта таймера
 */
export function QuickStartPanel() {
  const categories = useCategories()
  const isRunning = useIsRunning()
  const { start } = useTimer()
  const quickStart = useQuickStart()

  const handleQuickStart = categoryName => {
    if (isRunning) {
      return
    }
    start(categoryName)
    quickStart.setIsQuickStartOpen(false)
  }

  return (
    <div className="relative">
      <button
        ref={quickStart.quickStartButtonRef}
        aria-label="Быстрый старт таймера"
        onClick={() => quickStart.setIsQuickStartOpen(!quickStart.isQuickStartOpen)}
        disabled={isRunning}
        className={`glass-button p-2 rounded-lg transition-normal hover-lift-scale click-shrink ${
          isRunning
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
        } ${quickStart.isQuickStartOpen ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}`}
        title={isRunning ? 'Таймер уже запущен' : 'Быстрый запуск таймера'}
        data-icon-id="header-quick-start"
      >
        <Play className="w-5 h-5" />
      </button>

      {/* Выпадающий список категорий - используем Portal для рендеринга вне DOM-дерева Header */}
      {quickStart.shouldMountQuickStart &&
        createPortal(
          <div
            ref={quickStart.quickStartRef}
            className={`fixed z-[999999] min-w-[200px] ${
              !quickStart.isAnimatingQuickStart && !quickStart.isExitingQuickStart
                ? 'opacity-0 -translate-y-4'
                : ''
            } ${quickStart.isAnimatingQuickStart ? 'animate-slide-down' : ''} ${
              quickStart.isExitingQuickStart ? 'animate-slide-out' : ''
            }`}
            style={{
              top: `${quickStart.dropdownPosition.top}px`,
              right: `${quickStart.dropdownPosition.right}px`,
            }}
          >
            <div className="glass-effect rounded-xl p-2 shadow-2xl border border-gray-200 dark:border-gray-700 backdrop-blur-lg bg-white/95 dark:bg-gray-800/95">
              <div className="flex flex-col gap-1 max-h-[400px] overflow-y-auto">
                {categories.map(category => {
                  const IconComponent = getIcon(category.icon)
                  return (
                    <button
                      key={category.id}
                      onClick={() => handleQuickStart(category.name)}
                      disabled={isRunning}
                      className={`
                        flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
                        transition-all duration-200 text-left
                        bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600
                        text-gray-900 dark:text-white
                        ${
                          isRunning
                            ? 'opacity-50 cursor-not-allowed'
                            : 'hover:scale-[1.02] active:scale-[0.98]'
                        }
                      `}
                    >
                      {IconComponent && (
                        <IconComponent
                          className="w-4 h-4 flex-shrink-0"
                          style={{ color: category.color || '#6366F1' }}
                        />
                      )}
                      <span className="truncate">{category.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}

