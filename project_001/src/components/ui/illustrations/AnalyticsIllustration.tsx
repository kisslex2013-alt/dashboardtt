/**
 * 📈 Иллюстрация аналитики для empty state статистики
 * Анимированная SVG-иллюстрация с плавной анимацией
 */
import { motion } from 'framer-motion'

export function AnalyticsIllustration({ className = '', animated = true }) {
  return (
    <svg
      viewBox="0 0 200 150"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Столбцы гистограммы */}
      {[
        { x: 40, height: 40, delay: 0.1 },
        { x: 70, height: 60, delay: 0.2 },
        { x: 100, height: 80, delay: 0.3 },
        { x: 130, height: 50, delay: 0.4 },
        { x: 160, height: 70, delay: 0.5 },
      ].map((bar, index) => (
        <motion.rect
          key={`bar-${bar.x}-${index}`}
          x={bar.x - 10}
          y={110 - bar.height}
          width="20"
          height={bar.height}
          fill="currentColor"
          opacity="0.7"
          rx="2"
          initial={animated ? { scaleY: 0, opacity: 0 } : { scaleY: 1, opacity: 0.7 }}
          animate={animated ? { scaleY: 1, opacity: 0.7 } : { scaleY: 1, opacity: 0.7 }}
          transition={{
            duration: 0.5,
            delay: bar.delay,
            ease: 'easeOut',
          }}
          style={{ transformOrigin: 'bottom' }}
        />
      ))}

      {/* Линия тренда */}
      <motion.path
        d="M 30 100 Q 65 80, 100 50 T 170 40"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.5"
        initial={animated ? { pathLength: 0, opacity: 0 } : { pathLength: 1, opacity: 0.5 }}
        animate={animated ? { pathLength: 1, opacity: 0.5 } : { pathLength: 1, opacity: 0.5 }}
        transition={{ duration: 1, delay: 0.6, ease: 'easeOut' }}
      />
    </svg>
  )
}

