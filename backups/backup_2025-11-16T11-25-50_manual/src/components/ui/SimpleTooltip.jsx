/**
 * 💡 Простой тултип для элементов
 *
 * Показывает всплывающую подсказку при наведении на элемент
 * Использует Portal для отображения поверх всех элементов
 * В стиле проекта (glass-effect)
 *
 * @param {ReactNode} children - Элемент, на который наводим
 * @param {string} text - Текст подсказки
 * @param {string} position - Позиция тултипа: 'top' | 'bottom' | 'left' | 'right' (по умолчанию 'top')
 */
import { useState, useRef, useEffect, cloneElement, isValidElement } from 'react'
import { createPortal } from 'react-dom'

export function SimpleTooltip({ children, text, position = 'top' }) {
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 })
  const elementRef = useRef(null)
  const tooltipRef = useRef(null)

  // Создаем клон дочернего элемента с ref для позиционирования
  const childWithRef = isValidElement(children)
    ? cloneElement(children, {
        ref: (node) => {
          elementRef.current = node
          // Сохраняем оригинальный ref, если он есть
          if (children.ref) {
            if (typeof children.ref === 'function') {
              children.ref(node)
            } else {
              children.ref.current = node
            }
          }
        },
        onMouseEnter: (e) => {
          setIsVisible(true)
          if (children.props.onMouseEnter) {
            children.props.onMouseEnter(e)
          }
        },
        onMouseLeave: (e) => {
          setIsVisible(false)
          if (children.props.onMouseLeave) {
            children.props.onMouseLeave(e)
          }
        },
      })
    : children

  // Анимация появления/исчезновения
  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true)
    } else {
      const timer = setTimeout(() => {
        setIsAnimating(false)
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [isVisible])

  // Позиционирование тултипа
  useEffect(() => {
    if (isAnimating && elementRef.current) {
      const updatePosition = () => {
        const rect = elementRef.current.getBoundingClientRect()
        const tooltipHeight = tooltipRef.current?.offsetHeight || 0
        const tooltipWidth = tooltipRef.current?.offsetWidth || 0

        let top = 0
        let left = 0

        switch (position) {
          case 'top':
            top = rect.top - tooltipHeight - 8
            left = rect.left + rect.width / 2
            break
          case 'bottom':
            top = rect.bottom + 8
            left = rect.left + rect.width / 2
            break
          case 'left':
            top = rect.top + rect.height / 2
            left = rect.left - tooltipWidth - 8
            break
          case 'right':
            top = rect.top + rect.height / 2
            left = rect.right + 8
            break
          default:
            top = rect.top - tooltipHeight - 8
            left = rect.left + rect.width / 2
        }

        setTooltipPosition({ top, left })
      }

      requestAnimationFrame(() => {
        updatePosition()
      })

      window.addEventListener('scroll', updatePosition, true)
      window.addEventListener('resize', updatePosition)

      return () => {
        window.removeEventListener('scroll', updatePosition, true)
        window.removeEventListener('resize', updatePosition)
      }
    }
  }, [isAnimating, position])

  // Определяем классы для позиционирования
  const getTransformClass = () => {
    switch (position) {
      case 'top':
        return '-translate-x-1/2'
      case 'bottom':
        return '-translate-x-1/2'
      case 'left':
        return '-translate-y-1/2'
      case 'right':
        return '-translate-y-1/2'
      default:
        return '-translate-x-1/2'
    }
  }

  return (
    <>
      {childWithRef}

      {isAnimating &&
        createPortal(
          <div
            ref={tooltipRef}
            className={`fixed w-max max-w-xs p-2 text-xs text-gray-900 dark:text-gray-100 rounded-lg shadow-lg z-[9999] glass-effect border border-gray-200/60 dark:border-gray-700/60 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm pointer-events-none ${getTransformClass()} ${
              isVisible ? 'animate-fade-in' : 'animate-fade-out'
            }`}
            style={{
              top: `${tooltipPosition.top}px`,
              left: `${tooltipPosition.left}px`,
            }}
          >
            {text}
          </div>,
          document.body
        )}
    </>
  )
}

