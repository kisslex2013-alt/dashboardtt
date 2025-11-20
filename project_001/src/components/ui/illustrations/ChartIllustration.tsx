/**
 * 📊 Иллюстрация графика для empty state аналитики
 * Анимированная SVG-иллюстрация с плавной анимацией
 */
import { motion } from 'framer-motion'

export function ChartIllustration({ className = '', animated = true }) {
  const points = [
    { x: 30, y: 120 },
    { x: 60, y: 100 },
    { x: 90, y: 80 },
    { x: 120, y: 60 },
    { x: 150, y: 40 },
    { x: 170, y: 30 },
  ]

  return (
    <svg
      viewBox="0 0 200 150"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Оси координат */}
      <motion.line
        x1="20"
        y1="130"
        x2="180"
        y2="130"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.3"
        initial={animated ? { pathLength: 0 } : { pathLength: 1 }}
        animate={animated ? { pathLength: 1 } : { pathLength: 1 }}
        transition={{ duration: 0.6 }}
      />
      <motion.line
        x1="20"
        y1="130"
        x2="20"
        y2="20"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.3"
        initial={animated ? { pathLength: 0 } : { pathLength: 1 }}
        animate={animated ? { pathLength: 1 } : { pathLength: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      />

      {/* Линия графика */}
      <motion.polyline
        points={points.map(p => `${p.x},${p.y}`).join(' ')}
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animated ? { pathLength: 0, opacity: 0 } : { pathLength: 1, opacity: 1 }}
        animate={animated ? { pathLength: 1, opacity: 1 } : { pathLength: 1, opacity: 1 }}
        transition={{ duration: 1, delay: 0.4, ease: 'easeOut' }}
      />

      {/* Точки на графике */}
      {points.map((point, index) => (
        <motion.circle
          key={`point-${point.x}-${point.y}-${index}`}
          cx={point.x}
          cy={point.y}
          r="4"
          fill="currentColor"
          initial={animated ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
          animate={animated ? { scale: 1, opacity: 1 } : { scale: 1, opacity: 1 }}
          transition={{
            duration: 0.3,
            delay: 0.6 + index * 0.1,
            ease: 'easeOut',
          }}
        />
      ))}
    </svg>
  )
}

