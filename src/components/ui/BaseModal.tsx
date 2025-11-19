import { Dialog } from '@headlessui/react'
import type { BaseModalProps } from '../../types'
import { X } from '../../utils/icons'
import { useEffect, useState, useRef, createElement, isValidElement } from 'react'
import { useIsMobile } from '../../hooks/useIsMobile'

/**
 * 🎨 Базовый компонент модального окна с анимацией resize
 *
 * Устраняет дублирование кода во всех модальных окнах.
 * Предоставляет единообразную структуру и поведение.
 *
 * НОВОЕ: Добавлена плавная анимация при изменении размера окна браузера
 * Использует CSS переменные + ResizeObserver для отслеживания изменений viewport
 */

const sizeClasses: Record<'small' | 'medium' | 'large' | 'full', string> = {
  small: 'max-w-md',
  medium: 'max-w-lg',
  large: 'max-w-2xl',
  full: 'max-w-4xl',
}

// Адаптивные классы для мобильных устройств
const mobileSizeClasses: Record<'small' | 'medium' | 'large' | 'full', string> = {
  small: 'max-w-full',
  medium: 'max-w-full',
  large: 'max-w-full',
  full: 'max-w-full',
}

export function BaseModal({
  isOpen,
  onClose,
  title,
  titleIcon,
  subtitle,
  children,
  size = 'medium',
  showCloseButton = true,
  closeOnOverlayClick = true,
  className = '',
  footer,
  disableContentScroll = false,
  fixedHeight = false,
}: BaseModalProps) {
  // Три состояния для контроля анимаций (Three-State Animation Control)
  const [shouldMount, setShouldMount] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  // НОВОЕ: Состояния для анимации resize
  const [isResizing, setIsResizing] = useState(false)
  const [dimensions, setDimensions] = useState({ width: 'auto', height: 'auto' })

  const panelRef = useRef(null)
  const overlayRef = useRef(null)
  const resizeTimeoutRef = useRef<number | null>(null)
  const dimensionsRef = useRef({ width: 0, height: 0 })
  const isMobile = useIsMobile()

  // Логика открытия
  useEffect(() => {
    if (isOpen) {
      setShouldMount(true)
      setIsExiting(false)
      // Для модальных окон используем одинарный RAF - двойной вызывает дергание
      const rafId = requestAnimationFrame(() => {
        setIsAnimating(true)
      })
      return () => cancelAnimationFrame(rafId)
    }
  }, [isOpen])

  // Логика закрытия
  useEffect(() => {
    if (!isOpen && shouldMount && !isExiting) {
      setIsExiting(true)
    }
  }, [isOpen, shouldMount, isExiting])

  // Слушатель окончания анимации исчезновения
  useEffect(() => {
    if (isExiting && panelRef.current) {
      const handleAnimationEnd = (e: AnimationEvent) => {
        // Проверяем, что это именно наша exit анимация (slideDownOut или fadeOut)
        if (
          e.animationName === 'slideDownOut' ||
          e.animationName === 'fadeOut' ||
          e.animationName.includes('slideOut') ||
          e.animationName.includes('fadeOut')
        ) {
          // Сбрасываем все состояния после завершения анимации
          setIsAnimating(false)
          setIsExiting(false)
          setShouldMount(false)
        }
      }

      // Fallback на случай, если событие не сработает (например, при lazy loading)
      const fallbackTimer = setTimeout(() => {
        setIsAnimating(false)
        setIsExiting(false)
        setShouldMount(false)
      }, 350) // Немного больше длительности анимации (300ms + запас)

      const panel = panelRef.current
      panel.addEventListener('animationend', handleAnimationEnd)

      return () => {
        clearTimeout(fallbackTimer)
        panel?.removeEventListener('animationend', handleAnimationEnd)
      }
    }
  }, [isExiting])

  // НОВОЕ: ResizeObserver для отслеживания изменений размера при window resize
  useEffect(() => {
    if (!isOpen || !panelRef.current) return

    const panel = panelRef.current

    // Инициализация начальных размеров
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

        // Проверяем, действительно ли размеры изменились
        if (
          Math.abs(width - dimensionsRef.current.width) > 1 ||
          Math.abs(height - dimensionsRef.current.height) > 1
        ) {
          // Фиксируем текущие размеры для начала анимации
          setDimensions({
            width: `${dimensionsRef.current.width}px`,
            height: `${dimensionsRef.current.height}px`,
          })
          setIsResizing(true)

          // Очищаем предыдущий таймер
          if (resizeTimeoutRef.current) {
            clearTimeout(resizeTimeoutRef.current)
          }

          // Запускаем анимацию к новым размерам
          requestAnimationFrame(() => {
            setDimensions({
              width: `${width}px`,
              height: `${height}px`,
            })

            // После завершения анимации возвращаем auto
            resizeTimeoutRef.current = setTimeout(() => {
              setDimensions({ width: 'auto', height: 'auto' })
              setIsResizing(false)
              dimensionsRef.current = { width, height }
            }, 300) // Длительность transition
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

  // Закрытие по Escape (обрабатывается Dialog автоматически)
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      // Закрываем только если разрешено закрытие по overlay
      if (e.key === 'Escape' && closeOnOverlayClick) {
        onClose()
      } else if (e.key === 'Escape' && !closeOnOverlayClick) {
        // Предотвращаем закрытие по Escape, если это запрещено
        e.preventDefault()
        e.stopPropagation()
      }
    }

    window.addEventListener('keydown', handleEscape, true) // Используем capture phase
    return () => window.removeEventListener('keydown', handleEscape, true)
  }, [isOpen, onClose, closeOnOverlayClick])

  // КРИТИЧНО: Перехватываем все клики на document, когда закрытие по overlay запрещено
  useEffect(() => {
    if (!isOpen || closeOnOverlayClick || !shouldMount) return

    const handleDocumentClick = (e: MouseEvent) => {
      const panel = panelRef.current
      if (!panel) return

      // Проверяем, был ли клик вне панели
      const target = e.target as Node
      if (!panel.contains(target)) {
        // Клик был вне панели - предотвращаем закрытие
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()
        return false
      }
    }

    // Используем capture phase для перехвата события до того, как Dialog его обработает
    // Небольшая задержка, чтобы panelRef был готов
    const timeoutId = setTimeout(() => {
      if (panelRef.current) {
        document.addEventListener('click', handleDocumentClick, true)
        document.addEventListener('mousedown', handleDocumentClick, true)
      }
    }, 0)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('click', handleDocumentClick, true)
      document.removeEventListener('mousedown', handleDocumentClick, true)
    }
  }, [isOpen, closeOnOverlayClick, shouldMount])

  if (!shouldMount) return null

  return (
    // ИСПРАВЛЕНО: Увеличен z-index для модальных окон, чтобы они были выше аккордеонов
    <Dialog
      open={shouldMount}
      onClose={(value) => {
        // КРИТИЧНО: Если закрытие по overlay запрещено, игнорируем вызов onClose
        if (!closeOnOverlayClick) {
          return
        }
        onClose()
      }}
      className="relative z-[999999]"
      static={!closeOnOverlayClick}
    >
      {/* Overlay с backdrop blur - унифицированная анимация появления/исчезновения */}
      <div
        ref={overlayRef}
        className={`fixed inset-0 bg-black/30 backdrop-blur-sm ${
          !isAnimating && !isExiting ? 'opacity-0' : ''
        } ${isAnimating ? 'animate-fade-in' : ''} ${isExiting ? 'animate-fade-out' : ''} ${
          !closeOnOverlayClick ? 'pointer-events-none' : ''
        }`}
        aria-hidden="true"
        onClick={closeOnOverlayClick ? onClose : (e) => {
          e.stopPropagation()
          e.preventDefault()
        }}
        onMouseDown={closeOnOverlayClick ? undefined : (e) => {
          e.stopPropagation()
          e.preventDefault()
        }}
      />

      {/* Центрирование - на мобильных fullscreen */}
      <div
        className={`fixed inset-0 ${
          isMobile
            ? 'flex items-stretch p-0'
            : 'flex items-center justify-center p-4'
        } overflow-y-auto pointer-events-none`}
        onClick={closeOnOverlayClick ? undefined : (e) => {
          e.stopPropagation()
          e.preventDefault()
        }}
        onMouseDown={closeOnOverlayClick ? undefined : (e) => {
          e.stopPropagation()
          e.preventDefault()
        }}
      >
        <Dialog.Panel
          ref={panelRef}
          className={`
            glass-effect ${isMobile ? 'rounded-none' : 'rounded-xl'} 
            ${isMobile ? 'p-4' : 'p-6'} w-full shadow-2xl 
            ${isMobile ? 'max-h-screen h-screen' : fixedHeight ? 'h-[85vh]' : 'max-h-[90vh]'} 
            pointer-events-auto
            flex flex-col
            overflow-x-hidden
            ${disableContentScroll ? 'overflow-y-auto custom-scrollbar' : 'overflow-hidden'}
            ${!isAnimating && !isExiting ? 'opacity-0 scale-95 translate-y-4' : ''}
            ${isAnimating && !isExiting ? 'animate-slide-up' : ''}
            ${isExiting ? 'animate-slide-out' : ''}
            ${isMobile ? mobileSizeClasses[size] : sizeClasses[size]}
            ${className}
          `}
          style={{
            // НОВОЕ: CSS переменные для управления размерами
            '--panel-width': dimensions.width,
            '--panel-height': dimensions.height,
            width: isResizing ? 'var(--panel-width)' : undefined,
            height: isResizing ? 'var(--panel-height)' : undefined,
            transition: isResizing
              ? 'width 300ms cubic-bezier(0.4, 0, 0.2, 1), height 300ms cubic-bezier(0.4, 0, 0.2, 1)'
              : undefined,
            willChange: isResizing ? 'width, height' : undefined,
          }}
          onClick={(e) => {
            e.stopPropagation()
            if (!closeOnOverlayClick) {
              e.preventDefault()
            }
          }}
          onMouseDown={(e) => {
            if (!closeOnOverlayClick) {
              e.stopPropagation()
            }
          }}
        >
          {/* Заголовок */}
          {(title || showCloseButton) && (
            <div className={`flex items-start justify-between ${subtitle ? 'mb-2' : 'mb-6'}`}>
              {title && (
                <div className="flex-1 pr-4">
                  <div className="flex items-center gap-2">
                    {titleIcon && (
                      <div className="w-6 h-6 text-blue-500 dark:text-blue-400 flex-shrink-0 flex items-center justify-center">
                        {(() => {
                          // Если это уже рендеренный React элемент
                          if (isValidElement(titleIcon)) {
                            return titleIcon
                          }
                          // Если это компонент (функция или объект с $$typeof)
                          if (typeof titleIcon === 'function' || (typeof titleIcon === 'object' && titleIcon !== null && '$$typeof' in titleIcon)) {
                            const IconComponent = titleIcon as React.ComponentType<{ className?: string }>
                            return createElement(IconComponent, { className: 'w-6 h-6' })
                          }
                          // В остальных случаях возвращаем null
                          return null
                        })()}
                      </div>
                    )}
                    <Dialog.Title className="text-2xl font-bold text-gray-900 dark:text-white">
                    {title}
                  </Dialog.Title>
                  </div>
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
          <div
            className={`modal-content flex-1 min-h-0 overflow-x-hidden ${
              disableContentScroll 
                ? 'overflow-hidden' 
                : fixedHeight
                  ? 'overflow-y-auto custom-scrollbar'
                  : 'overflow-y-auto max-h-[calc(90vh-180px)] custom-scrollbar'
            }`}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {children}
          </div>

          {/* Футер (опционально) */}
          {footer && (
            <div className="mt-0 pt-4 border-t border-gray-200 dark:border-gray-700">{footer}</div>
          )}
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}
