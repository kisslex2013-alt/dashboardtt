import { motion } from 'framer-motion'
import { useRef, useEffect } from 'react'

/**
 * 📝 Компонент для анимированного отображения текста
 *
 * Анимирует появление текста при загрузке или раскрытии аккордеона
 *
 * @param {React.ReactNode} children - Текст для анимации
 * @param {string} className - CSS классы
 * @param {object} style - Inline стили
 * @param {boolean} shouldAnimate - Запускать ли анимацию
 * @param {number} delay - Задержка анимации в секундах
 */
export function AnimatedText({
  children,
  className = '',
  style = {},
  shouldAnimate = true,
  delay = 0,
}) {
  const isFirstMountRef = useRef(true)
  const previousShouldAnimateRef = useRef(shouldAnimate)

  // Определяем, нужно ли запустить анимацию
  const shouldReset =
    isFirstMountRef.current ||
    (shouldAnimate && String(shouldAnimate) !== String(previousShouldAnimateRef.current))

  useEffect(() => {
    if (shouldReset) {
      isFirstMountRef.current = false
      previousShouldAnimateRef.current = shouldAnimate
    }
  }, [shouldAnimate, shouldReset])

  return (
    <motion.span
      className={className}
      style={style}
      initial={shouldReset ? { opacity: 0, y: 10 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay,
        ease: 'easeOut',
      }}
    >
      {children}
    </motion.span>
  )
}
