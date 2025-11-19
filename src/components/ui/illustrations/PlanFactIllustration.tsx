/**
 * 📅 Иллюстрация для пустого состояния "План/факт"
 * Анимированная SVG-иллюстрация с календарем и графиком
 */
import { motion } from 'framer-motion'

export function PlanFactIllustration({ className = '', animated = true }) {
  return (
    <svg
      viewBox="0 0 200 150"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Календарь */}
      <motion.rect
        x="20"
        y="20"
        width="80"
        height="60"
        rx="4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.3"
        initial={animated ? { scale: 0.8, opacity: 0 } : { scale: 1, opacity: 0.3 }}
        animate={animated ? { scale: 1, opacity: 0.3 } : { scale: 1, opacity: 0.3 }}
        transition={{ duration: 0.5 }}
      />
      <motion.line
        x1="20"
        y1="40"
        x2="100"
        y2="40"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.3"
        initial={animated ? { pathLength: 0 } : { pathLength: 1 }}
        animate={animated ? { pathLength: 1 } : { pathLength: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      />
      {[30, 50, 70].map((x, i) => (
        <motion.circle
          key={i}
          cx={x}
          cy="55"
          r="4"
          fill="currentColor"
          opacity="0.5"
          initial={animated ? { scale: 0 } : { scale: 1 }}
          animate={animated ? { scale: 1 } : { scale: 1 }}
          transition={{ duration: 0.3, delay: 0.3 + i * 0.1 }}
        />
      ))}

      {/* График */}
      <motion.path
        d="M 120 100 L 140 80 L 160 60 L 180 50"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animated ? { pathLength: 0, opacity: 0 } : { pathLength: 1, opacity: 1 }}
        animate={animated ? { pathLength: 1, opacity: 1 } : { pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.5 }}
      />
      {[120, 140, 160, 180].map((x, i) => (
        <motion.circle
          key={i}
          cx={x}
          cy={[100, 80, 60, 50][i]}
          r="3"
          fill="currentColor"
          initial={animated ? { scale: 0 } : { scale: 1 }}
          animate={animated ? { scale: 1 } : { scale: 1 }}
          transition={{ duration: 0.3, delay: 0.7 + i * 0.1 }}
        />
      ))}
    </svg>
  )
}

