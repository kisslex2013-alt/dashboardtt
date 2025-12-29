import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface UpdateModalProps {
  countdown: number
  progress: number
  changelog?: string[]
  newVersion?: string
  currentVersion?: string
  onUpdateNow: () => void
  onLater: () => void
  onPauseChange?: (isPaused: boolean) => void
  isTestMode?: boolean
}

/**
 * Модальное окно обновления версии
 * Основано на концепте concept-2-informative-work.html
 * Компактный дизайн с slide-анимацией аккордеона
 */
export function UpdateModal({
  countdown,
  progress,
  changelog = [],
  newVersion = '1.4.0',
  currentVersion = '1.3.0',
  onUpdateNow,
  onLater,
  onPauseChange,
  isTestMode = false,
}: UpdateModalProps) {
  const [isChangelogExpanded, setIsChangelogExpanded] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [testCountdown, setTestCountdown] = useState(10)
  const [testProgress, setTestProgress] = useState(0)
  const contentRef = useRef<HTMLDivElement>(null)
  const arrowRef = useRef<SVGSVGElement>(null)

  // Таймер для тестового режима
  useEffect(() => {
    if (!isTestMode) return

    const interval = setInterval(() => {
      if (isPaused) return

      setTestCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isTestMode, isPaused])

  // Прогресс для тестового режима
  useEffect(() => {
    if (!isTestMode) return
    const completed = ((10 - testCountdown) / 10) * 100
    setTestProgress(Math.max(0, Math.min(100, completed)))
  }, [testCountdown, isTestMode])

  // Блокировка прокрутки фона при открытой модалке
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  // Управление паузой при наведении
  const handleMouseEnter = () => {
    setIsPaused(true)
    if (onPauseChange) {
      onPauseChange(true)
    }
  }

  const handleMouseLeave = () => {
    setIsPaused(false)
    if (onPauseChange) {
      onPauseChange(false)
    }
  }

  // Извлекаем только версию (убираем build строку)
  const extractVersion = (versionString: string): string => {
    if (!versionString) return '1.3.0'
    // Если это build строка типа "build_13.07_19.11.25", возвращаем дефолт
    if (versionString.startsWith('build_')) {
      return '1.3.0'
    }
    // Если это версия типа "1.3.0", возвращаем её
    if (/^\d+\.\d+\.\d+/.test(versionString)) {
      return versionString.match(/^\d+\.\d+\.\d+/)?.[0] || '1.3.0'
    }
    return versionString
  }

  const displayCurrentVersion = extractVersion(currentVersion)
  const displayCountdown = isTestMode ? testCountdown : countdown
  const displayProgress = isTestMode ? testProgress : progress

  // Категоризация changelog
  const categorizeChangelog = (items: string[]) => {
    const categories = {
      new: [] as string[],
      improved: [] as string[],
      fixed: [] as string[],
    }

    items.forEach(item => {
      const lower = item.toLowerCase()
      if (lower.includes('добавлен') || lower.includes('новый') || lower.includes('новая') || lower.includes('✨')) {
        categories.new.push(item.replace(/^✨\s*/, '').trim())
      } else if (lower.includes('улучшен') || lower.includes('оптимизирован') || lower.includes('улучшена') || lower.includes('🚀')) {
        categories.improved.push(item.replace(/^🚀\s*/, '').trim())
      } else if (lower.includes('исправлен') || lower.includes('исправлена') || lower.includes('баг') || lower.includes('🐛')) {
        categories.fixed.push(item.replace(/^🐛\s*/, '').trim())
      }
    })

    return categories
  }

  const categorizedChangelog = categorizeChangelog(changelog)
  const totalChanges = changelog.length

  // Функция цвета прогресс-бара (Синий -> Желтый -> Красный)
  const getProgressColor = (progressPercent: number) => {
    const p = 100 - progressPercent
    if (p < 50) {
      // Синий -> Желтый
      const r = p / 50
      return `rgb(${59 + Math.round(196 * r)}, ${130 + Math.round(63 * r)}, ${246 - Math.round(239 * r)})`
    }
    // Желтый -> Красный
    const r = (p - 50) / 50
    return `rgb(${255 - Math.round(16 * r)}, ${193 - Math.round(125 * r)}, ${7 + Math.round(61 * r)})`
  }

  // Прогресс-бар должен уменьшаться от 100% до 0%
  // progress идет от 0 до 100, поэтому progressPercent = 100 - progress
  const actualProgress = isTestMode ? displayProgress : progress
  const progressPercent = Math.max(0, Math.min(100, 100 - actualProgress))
  const progressColor = getProgressColor(progressPercent)

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Overlay - без onClick, закрытие только по кнопкам */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3 }}
        className="glass-effect rounded-xl p-5 shadow-2xl w-full max-w-[336px] relative z-10"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">{displayCurrentVersion}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">→</span>
            <div className="px-2 py-0.5 bg-blue-500/20 dark:bg-blue-500/30 rounded-full border border-blue-500/30">
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">{newVersion}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-gray-900 dark:text-white">{displayCountdown}</div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400">сек</div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Доступно обновление</h2>
          <p className="text-xs text-gray-600 dark:text-gray-400">Рекомендуем обновиться для новых возможностей</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
            <motion.div
              className="h-full rounded-full transition-all duration-1000 relative overflow-hidden ml-auto"
              style={{
                width: `${progressPercent}%`,
                backgroundColor: progressColor,
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            </motion.div>
          </div>
          <div className="text-center mt-1.5 text-[10px] text-gray-500 dark:text-gray-400">
            Автообновление через <span>{displayCountdown}</span> сек
          </div>
        </div>

        {/* Accordion */}
        {totalChanges > 0 && (
          <div className="mb-4 group overflow-hidden">
            <button
              type="button"
              onClick={() => setIsChangelogExpanded(!isChangelogExpanded)}
              className="w-full text-sm font-semibold text-gray-900 dark:text-white mb-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5 select-none text-left"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Что нового? ({totalChanges} {totalChanges === 1 ? 'изменение' : 'изменений'})
              <motion.svg
                ref={arrowRef}
                className="w-3 h-3 ml-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                animate={{ rotate: isChangelogExpanded ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </motion.svg>
            </button>

            <AnimatePresence initial={false}>
              {isChangelogExpanded && (
                <motion.div
                  ref={contentRef}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.4, ease: 'easeInOut' }}
                  className="space-y-2 overflow-hidden"
                >
                  {/* Новые возможности */}
                  {categorizedChangelog.new.length > 0 && (
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 20, opacity: 0 }}
                      transition={{ delay: 0.1, duration: 0.4 }}
                      className="p-2.5 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
                    >
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span className="text-xs font-semibold text-green-700 dark:text-green-400">Новые возможности</span>
                      </div>
                      <ul className="space-y-0.5 text-xs text-gray-700 dark:text-gray-300 ml-5.5">
                        {categorizedChangelog.new.map((item, i) => (
                          <li key={i}>• {item}</li>
                        ))}
                      </ul>
                    </motion.div>
                  )}

                  {/* Улучшения */}
                  {categorizedChangelog.improved.length > 0 && (
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 20, opacity: 0 }}
                      transition={{ delay: 0.18, duration: 0.4 }}
                      className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                    >
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">Улучшения</span>
                      </div>
                      <ul className="space-y-0.5 text-xs text-gray-700 dark:text-gray-300 ml-5.5">
                        {categorizedChangelog.improved.map((item, i) => (
                          <li key={i}>• {item}</li>
                        ))}
                      </ul>
                    </motion.div>
                  )}

                  {/* Исправления */}
                  {categorizedChangelog.fixed.length > 0 && (
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 20, opacity: 0 }}
                      transition={{ delay: 0.26, duration: 0.4 }}
                      className="p-2.5 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800"
                    >
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <svg className="w-4 h-4 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs font-semibold text-yellow-700 dark:text-yellow-400">Исправления</span>
                      </div>
                      <ul className="space-y-0.5 text-xs text-gray-700 dark:text-gray-300 ml-5.5">
                        {categorizedChangelog.fixed.map((item, i) => (
                          <li key={i}>• {item}</li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            onClick={onUpdateNow}
            className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-lg transition-colors"
            title="Немедленно обновить приложение. Страница перезагрузится, и вы получите новую версию со всеми улучшениями."
          >
            Обновить сейчас
          </button>
          <button
            onClick={onLater}
            className="flex-1 px-3 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors"
            title="Отложить обновление. Модальное окно закроется, но обновление будет доступно позже. Вы сможете обновиться вручную через перезагрузку страницы."
          >
            Позже
          </button>
        </div>
      </motion.div>
    </div>
  )
}
