import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import { X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

/**
 * 🎨 Базовый компонент модального окна с правильными анимациями
 *
 * ✅ ИСПРАВЛЕНО: Используем встроенные transitions от HeadlessUI
 * - Анимации открытия и закрытия работают корректно
 * - Dialog правильно управляет жизненным циклом
 * - Окно остается видимым после анимации открытия
 */

const sizeClasses = {
  small: 'max-w-md',
  medium: 'max-w-lg',
  large: 'max-w-2xl',
  full: 'max-w-4xl',
}

export function BaseModal({
  isOpen,
  onClose,
  title,
  titleIcon: TitleIcon,
  subtitle,
  children,
  size = 'medium',
  showCloseButton = true,
  closeOnOverlayClick = true,
  className = '',
  footer,
}) {
  // Состояния для анимации resize
  const [isResizing, setIsResizing] = useState(false)
  const [dimensions, setDimensions] = useState({ width: 'auto', height: 'auto' })

  const panelRef = useRef(null)
  const resizeTimeoutRef = useRef(null)
  const dimensionsRef = useRef({ width: 0, height: 0 })

  // ResizeObserver для отслеживания изменений размера при window resize
  useEffect(() => {
    if (!isOpen || !panelRef.current) return

    const panel = panelRef.current

    const initDimensions = () => {
      const rect = panel.getBoundingClientRect()
      dimensionsRef.current = {
        width: rect.width,
        height: rect.height,
      }
    }

    initDimensions()

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect

        if (
          Math.abs(width - dimensionsRef.current.width) > 1 ||
          Math.abs(height - dimensionsRef.current.height) > 1
        ) {
          setDimensions({
            width: `${dimensionsRef.current.width}px`,
            height: `${dimensionsRef.current.height}px`,
          })
          setIsResizing(true)

          if (resizeTimeoutRef.current) {
            clearTimeout(resizeTimeoutRef.current)
          }

          requestAnimationFrame(() => {
            setDimensions({
              width: `${width}px`,
              height: `${height}px`,
            })

            resizeTimeoutRef.current = setTimeout(() => {
              setDimensions({ width: 'auto', height: 'auto' })
              setIsResizing(false)
              dimensionsRef.current = { width, height }
            }, 300)
          })
        }
      }
    })

    resizeObserver.observe(panel)

    return () => {
      resizeObserver.disconnect()
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current)
      }
    }
  }, [isOpen])

  // Закрытие по Escape (Dialog делает это автоматически, но оставим для совместимости)
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = e => {
      if (e.key === 'Escape' && closeOnOverlayClick) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose, closeOnOverlayClick])

  return (
    <Dialog
      open={isOpen}
      onClose={closeOnOverlayClick ? onClose : () => {}}
      className="relative z-[999999]"
    >
      {/* ✨ ИСПРАВЛЕНИЕ: Используем DialogBackdrop с transition */}
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-black/30 backdrop-blur-sm duration-300 ease-out data-[closed]:opacity-0"
      />

      {/* Центрирование */}
      <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto pointer-events-none">
        {/* ✨ ИСПРАВЛЕНИЕ: Используем DialogPanel с transition */}
        <DialogPanel
          ref={panelRef}
          transition
          className={`
            glass-effect rounded-xl p-6 w-full shadow-2xl 
            max-h-[90vh] pointer-events-auto
            duration-300 ease-out
            data-[closed]:opacity-0 data-[closed]:scale-95 data-[closed]:translate-y-4
            ${sizeClasses[size]}
            ${className}
          `}
          style={{
            '--panel-width': dimensions.width,
            '--panel-height': dimensions.height,
            width: isResizing ? 'var(--panel-width)' : undefined,
            height: isResizing ? 'var(--panel-height)' : undefined,
            transition: isResizing
              ? 'width 300ms cubic-bezier(0.4, 0, 0.2, 1), height 300ms cubic-bezier(0.4, 0, 0.2, 1)'
              : undefined,
            willChange: isResizing ? 'width, height' : undefined,
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Заголовок */}
          {(title || showCloseButton) && (
            <div className={`flex items-start justify-between ${subtitle ? 'mb-2' : 'mb-6'}`}>
              {title && (
                <div className="flex-1 pr-4">
                  <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    {TitleIcon && (
                      <TitleIcon className="w-6 h-6 text-blue-500 dark:text-blue-400 flex-shrink-0" />
                    )}
                    {title}
                  </DialogTitle>
                  {subtitle && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-0">{subtitle}</p>
                  )}
                </div>
              )}

              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="glass-button p-1 rounded-lg flex-shrink-0 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors hover-lift-scale click-shrink"
                  aria-label="Закрыть модальное окно"
                  title="Закрыть (Escape)"
                  data-icon-id="modal-close"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          )}

          {/* Контент */}
          <div className="modal-content overflow-y-auto max-h-[calc(90vh-180px)] custom-scrollbar">
            {children}
          </div>

          {/* Футер */}
          {footer && (
            <div className="mt-0 pt-4 border-t border-gray-200 dark:border-gray-700">{footer}</div>
          )}
        </DialogPanel>
      </div>
    </Dialog>
  )
}
