import { AnimatePresence, motion } from 'framer-motion'
import { useState, useEffect } from 'react'

/**
 * Компонент перехода темы "Ирис" (вариант 15)
 * Круг расширяется от точки клика, покрывая экран новой темой
 *
 * @param {boolean} isAnimating - Флаг активной анимации
 * @param {string} currentTheme - Текущая тема ('light' | 'dark')
 * @param {object} clickPosition - Позиция клика { x, y }
 */
export function ThemePixelTransition({ isAnimating, currentTheme, clickPosition }) {
  const [maxRadius, setMaxRadius] = useState(0)

  // Вычисляем максимальное расстояние до углов экрана от точки клика
  useEffect(() => {
    if (isAnimating && clickPosition) {
      const radius = Math.max(
        Math.hypot(clickPosition.x, clickPosition.y),
        Math.hypot(window.innerWidth - clickPosition.x, clickPosition.y),
        Math.hypot(clickPosition.x, window.innerHeight - clickPosition.y),
        Math.hypot(window.innerWidth - clickPosition.x, window.innerHeight - clickPosition.y)
      )
      setMaxRadius(radius)
    }
  }, [isAnimating, clickPosition])

  // Цвет круга: цвет НОВОЙ темы (противоположной текущей)
  const circleColor =
    currentTheme === 'dark'
      ? 'bg-gray-100' // Переход к светлой теме - круг светлый
      : 'bg-gray-900' // Переход к темной теме - круг темный

  if (!clickPosition) return null

  return (
    <AnimatePresence>
      {isAnimating && maxRadius > 0 && (
        <motion.div
          className={`fixed rounded-full ${circleColor} pointer-events-none`}
          style={{
            left: clickPosition.x,
            top: clickPosition.y,
            x: '-50%',
            y: '-50%',
            zIndex: 1, // Низкий z-index, чтобы элементы были поверх
            mixBlendMode: 'normal',
          }}
          initial={{ width: 0, height: 0, opacity: 0 }}
          animate={{
            width: maxRadius * 2,
            height: maxRadius * 2,
            opacity: 1,
          }}
          exit={{
            width: 0,
            height: 0,
            opacity: 0,
            transition: { duration: 0.8, ease: [0.4, 0, 0.2, 1] }, // Плавное сжатие
          }}
          transition={{
            duration: 1.2, // Увеличена длительность расширения
            ease: [0.4, 0, 0.2, 1], // Плавная easing функция (cubic-bezier)
          }}
        />
      )}
    </AnimatePresence>
  )
}
