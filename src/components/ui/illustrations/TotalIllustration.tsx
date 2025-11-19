/**
 * 📊 Иллюстрация для пустого состояния "Общие итоги"
 * Анимированная SVG-иллюстрация с графиком роста
 */
import { motion } from 'framer-motion'

export function TotalIllustration({ className = '', animated = true }) {
  return (
    <svg
      viewBox="0 0 200 150"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Столбцы гистограммы */}
      {[
        { x: 30, height: 30, delay: 0.1 },
        { x: 60, height: 50, delay: 0.2 },
        { x: 90, height: 70, delay: 0.3 },
        { x: 120, height: 90, delay: 0.4 },
        { x: 150, height: 110, delay: 0.5 },
      ].map((bar, index) => (
        <motion.rect
          key={index}
          x={bar.x - 10}
          y={120 - bar.height}
          width="20"
          height={bar.height}
          fill="currentColor"
          opacity="0.6"
          rx="2"
          initial={animated ? { scaleY: 0, opacity: 0 } : { scaleY: 1, opacity: 0.6 }}
          animate={animated ? { scaleY: 1, opacity: 0.6 } : { scaleY: 1, opacity: 0.6 }}
          transition={{
            duration: 0.4,
            delay: bar.delay,
            ease: 'easeOut',
          }}
          style={{ transformOrigin: 'bottom' }}
        />
      ))}

      {/* Стрелка роста */}
      <motion.path
        d="M 30 120 L 170 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.5"
        initial={animated ? { pathLength: 0, opacity: 0 } : { pathLength: 1, opacity: 0.5 }}
        animate={animated ? { pathLength: 1, opacity: 0.5 } : { pathLength: 1, opacity: 0.5 }}
        transition={{ duration: 0.8, delay: 0.6 }}
      />
      <motion.polygon
        points="170,20 165,15 175,15"
        fill="currentColor"
        opacity="0.5"
        initial={animated ? { opacity: 0 } : { opacity: 0.5 }}
        animate={animated ? { opacity: 0.5 } : { opacity: 0.5 }}
        transition={{ duration: 0.3, delay: 1 }}
      />
    </svg>
  )
}

