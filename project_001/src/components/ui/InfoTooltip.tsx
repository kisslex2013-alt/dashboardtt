import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Info } from '../../utils/icons'
import type { InfoTooltipProps } from '../../types'

/**
 * 📊 Информационный тултип для графиков
 *
 * Показывает иконку с информацией, при наведении отображает всплывающую подсказку
 * Использует Portal для отображения поверх всех элементов
 * ИСПРАВЛЕНО: Добавлена анимация появления/исчезновения
 *
 * @param {string} text - Текст подсказки
 */
export function InfoTooltip({ text }: InfoTooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const iconRef = useRef(null)
  const tooltipRef = useRef(null)

  // ИСПРАВЛЕНО: Анимация появления/исчезновения
  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true)
    } else {
      // Задержка для анимации исчезновения
      const timer = setTimeout(() => {
        setIsAnimating(false)
      }, 200) // Длительность fade-out анимации
      return () => clearTimeout(timer)
    }
  }, [isVisible])

  useEffect(() => {
    if (isAnimating && iconRef.current) {
      const updatePosition = () => {
        const rect = iconRef.current.getBoundingClientRect()
        setPosition({
          top: rect.top - (tooltipRef.current?.offsetHeight || 0) - 8,
          left: rect.left + rect.width / 2,
        })
      }

      // Используем requestAnimationFrame для правильного позиционирования после анимации
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
  }, [isAnimating])

  return (
    <>
      <div
        ref={iconRef}
        className="relative flex items-center group"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {/* ✅ A11Y: Улучшаем контраст для темной темы */}
        <Info className="w-4 h-4 text-gray-400 dark:text-gray-300 transition-normal hover:text-gray-600 dark:hover:text-gray-200" />
      </div>

      {isAnimating &&
        createPortal(
          <div
            ref={tooltipRef}
            className={`fixed w-max max-w-xs p-2 text-sm text-gray-900 dark:text-gray-100 rounded-lg shadow-lg z-[9999] glass-effect border border-gray-200/60 dark:border-gray-700/60 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm pointer-events-none transform -translate-x-1/2 ${
              isVisible ? 'animate-fade-in' : 'animate-fade-out'
            }`}
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
            }}
          >
            {text}
          </div>,
          document.body
        )}
    </>
  )
}
