/**
 * 🕐 Иллюстрация часов для empty state записей
 * Анимированная SVG-иллюстрация с плавной анимацией
 */
import { motion } from 'framer-motion'

export function ClockIllustration({ className = '', animated = true }) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Фон круга */}
      <circle
        cx="100"
        cy="100"
        r="80"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        opacity="0.2"
      />

      {/* Основной круг часов */}
      <motion.circle
        cx="100"
        cy="100"
        r="70"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        initial={animated ? { pathLength: 0, opacity: 0 } : { pathLength: 1, opacity: 1 }}
        animate={animated ? { pathLength: 1, opacity: 1 } : { pathLength: 1, opacity: 1 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />

      {/* Цифры на часах */}
      {[12, 3, 6, 9].map((num, index) => {
        const angle = ((num - 3) * Math.PI) / 6
        const x = 100 + 55 * Math.cos(angle)
        const y = 100 + 55 * Math.sin(angle)
        return (
          <text
            key={num}
            x={x}
            y={y + 5}
            textAnchor="middle"
            fontSize="14"
            fill="currentColor"
            opacity="0.6"
            fontWeight="bold"
          >
            {num}
          </text>
        )
      })}

      {/* Стрелка часов */}
      <motion.line
        x1="100"
        y1="100"
        x2="100"
        y2="60"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        initial={animated ? { pathLength: 0, opacity: 0 } : { pathLength: 1, opacity: 1 }}
        animate={animated ? { pathLength: 1, opacity: 1 } : { pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.5, ease: 'easeOut' }}
      />

      {/* Стрелка минут */}
      <motion.line
        x1="100"
        y1="100"
        x2="130"
        y2="100"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        initial={animated ? { pathLength: 0, opacity: 0 } : { pathLength: 1, opacity: 1 }}
        animate={animated ? { pathLength: 1, opacity: 1 } : { pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.7, ease: 'easeOut' }}
      />

      {/* Центр часов */}
      <motion.circle
        cx="100"
        cy="100"
        r="6"
        fill="currentColor"
        initial={animated ? { scale: 0 } : { scale: 1 }}
        animate={animated ? { scale: 1 } : { scale: 1 }}
        transition={{ duration: 0.3, delay: 1 }}
      />
    </svg>
  )
}

