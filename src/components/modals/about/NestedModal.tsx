import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, LucideIcon, ArrowLeft } from 'lucide-react'

interface NestedModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  icon: LucideIcon
  children: React.ReactNode
  embedded?: boolean
}

/**
 * Nested modal для детального просмотра контента
 * - Slide-in анимация справа
 * - Backdrop blur
 * - Escape для закрытия
 */
export function NestedModal({ isOpen, onClose, title, icon: Icon, children, embedded = false }: NestedModalProps) {
  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Backdrop - виден только на мобильных и если НЕ embedded */}
          {!embedded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 z-[1000000] bg-black/50 backdrop-blur-sm md:hidden"
            />
          )}

          {/* Modal Content */}
          <motion.div
            initial={embedded ? { opacity: 0, x: 20 } : { x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={embedded ? { opacity: 0, x: 20 } : { x: '100%', opacity: 0 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30,
            }}
            className={embedded 
              ? `h-full w-full bg-white dark:bg-gray-900 rounded-xl overflow-hidden flex flex-col border-l border-gray-100 dark:border-gray-800`
              : `
                fixed right-0 top-0 bottom-0 z-[1000001] w-full bg-white dark:bg-gray-900 shadow-2xl overflow-hidden flex flex-col
                md:hidden
              ` // На десктопе используем embedded версию, этот блок только для мобилок (md:hidden)
            }
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                   <button 
                     onClick={onClose}
                     className="md:hidden mr-2 p-1 -ml-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                   >
                     <ArrowLeft size={20} />
                   </button>
                <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                  <Icon size={20} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
              </div>
              
              <button 
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
