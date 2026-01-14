import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bug, X } from 'lucide-react'
import { BugReportModal } from '../modals/BugReportModal'

/**
 * 🐛 Плавающая кнопка для отправки баг-репортов
 * 
 * Расположена в левом нижнем углу экрана.
 * При наведении показывает текст "Сообщить о проблеме".
 * Можно свернуть (скрыть) кнопку.
 */
export function BugReportButton() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)

  // Проверяем, не скрыта ли кнопка пользователем
  const [isHidden, setIsHidden] = useState(() => {
    return localStorage.getItem('bug-report-button-hidden') === 'true'
  })

  const handleHide = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsHidden(true)
    localStorage.setItem('bug-report-button-hidden', 'true')
  }

  // Если кнопка скрыта, ничего не рендерим
  if (isHidden) return null

  return (
    <>
      {/* Плавающая кнопка */}
      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed left-4 bottom-4 z-[99999] flex items-center gap-2"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* Основная кнопка */}
            <motion.button
              onClick={() => setIsModalOpen(true)}
              className="
                flex items-center gap-2 px-4 py-3 rounded-full
                bg-gradient-to-r from-blue-600 to-indigo-600
                text-white font-medium
                shadow-lg shadow-blue-500/30
                hover:shadow-xl hover:shadow-blue-500/40
                transition-shadow duration-300
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              "
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Bug className="w-5 h-5" />
              <AnimatePresence mode="wait">
                {isHovered && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="whitespace-nowrap overflow-hidden"
                  >
                    Сообщить о проблеме
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Кнопка скрытия (появляется при наведении) */}
            <AnimatePresence>
              {isHovered && (
                <motion.button
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{ duration: 0.15 }}
                  onClick={handleHide}
                  className="
                    p-1.5 rounded-full
                    bg-gray-200 dark:bg-gray-700
                    text-gray-500 dark:text-gray-400
                    hover:bg-gray-300 dark:hover:bg-gray-600
                    transition-colors
                  "
                  title="Скрыть кнопку"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Модальное окно */}
      <BugReportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}
