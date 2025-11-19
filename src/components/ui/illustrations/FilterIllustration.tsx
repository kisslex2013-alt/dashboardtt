/**
 * 🔍 Иллюстрация фильтра для empty state результатов поиска
 * Анимированная SVG-иллюстрация с плавной анимацией
 */
import { motion } from 'framer-motion'

export function FilterIllustration({ className = '', animated = true }) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Воронка фильтра */}
      <motion.path
        d="M 100 30 L 60 100 L 60 150 L 140 150 L 140 100 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animated ? { pathLength: 0, opacity: 0 } : { pathLength: 1, opacity: 1 }}
        animate={animated ? { pathLength: 1, opacity: 1 } : { pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />

      {/* Линии внутри воронки */}
      <motion.line
        x1="80"
        y1="70"
        x2="120"
        y2="70"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.5"
        initial={animated ? { pathLength: 0 } : { pathLength: 1 }}
        animate={animated ? { pathLength: 1 } : { pathLength: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      />
      <motion.line
        x1="75"
        y1="85"
        x2="125"
        y2="85"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.5"
        initial={animated ? { pathLength: 0 } : { pathLength: 1 }}
        animate={animated ? { pathLength: 1 } : { pathLength: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      />

      {/* Выходные линии (результаты) */}
      <motion.line
        x1="100"
        y1="150"
        x2="100"
        y2="170"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        initial={animated ? { pathLength: 0, opacity: 0 } : { pathLength: 1, opacity: 0.3 }}
        animate={animated ? { pathLength: 1, opacity: 0.3 } : { pathLength: 1, opacity: 0.3 }}
        transition={{ duration: 0.4, delay: 0.8 }}
      />
    </svg>
  )
}

