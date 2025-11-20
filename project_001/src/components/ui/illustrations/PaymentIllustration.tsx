/**
 * 💰 Иллюстрация для пустого состояния "Выплаты"
 * Анимированная SVG-иллюстрация с монетами и календарем
 */
import { motion } from 'framer-motion'

export function PaymentIllustration({ className = '', animated = true }) {
  return (
    <svg
      viewBox="0 0 200 150"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Монеты */}
      {[
        { x: 50, y: 50, delay: 0.1 },
        { x: 100, y: 40, delay: 0.2 },
        { x: 150, y: 55, delay: 0.3 },
      ].map((coin, index) => (
        <g key={`coin-${coin.x}-${coin.y}-${index}`}>
          <motion.circle
            cx={coin.x}
            cy={coin.y}
            r="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            opacity="0.6"
            initial={animated ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 0.6 }}
            animate={animated ? { scale: 1, opacity: 0.6 } : { scale: 1, opacity: 0.6 }}
            transition={{ duration: 0.4, delay: coin.delay }}
          />
          <motion.text
            x={coin.x}
            y={coin.y + 5}
            textAnchor="middle"
            fontSize="12"
            fill="currentColor"
            fontWeight="bold"
            opacity="0.8"
            initial={animated ? { opacity: 0 } : { opacity: 0.8 }}
            animate={animated ? { opacity: 0.8 } : { opacity: 0.8 }}
            transition={{ duration: 0.3, delay: coin.delay + 0.2 }}
          >
            ₽
          </motion.text>
        </g>
      ))}

      {/* Календарь */}
      <motion.rect
        x="60"
        y="90"
        width="80"
        height="50"
        rx="4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.4"
        initial={animated ? { pathLength: 0, opacity: 0 } : { pathLength: 1, opacity: 0.4 }}
        animate={animated ? { pathLength: 1, opacity: 0.4 } : { pathLength: 1, opacity: 0.4 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      />
      <motion.line
        x1="60"
        y1="110"
        x2="140"
        y2="110"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.4"
        initial={animated ? { pathLength: 0 } : { pathLength: 1 }}
        animate={animated ? { pathLength: 1 } : { pathLength: 1 }}
        transition={{ duration: 0.3, delay: 0.6 }}
      />
    </svg>
  )
}

