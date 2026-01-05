/**
 * 📊 Прогресс-бар для уведомлений
 * 
 * Визуальный индикатор прогресса с градиентом и анимацией.
 * Цвет автоматически определяется по проценту.
 */

import { useMemo } from 'react'
import { Lightbulb, CheckCircle, AlertTriangle, TrendingUp, PartyPopper } from '../../utils/icons'

interface NotificationProgressBarProps {
  percent: number
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  animated?: boolean
  color?: string
}

const getColorByPercent = (percent: number): string => {
  if (percent >= 110) return '#10B981'
  if (percent >= 90) return '#3B82F6'
  if (percent >= 70) return '#F59E0B'
  return '#EF4444'
}

const getGradientByPercent = (percent: number): string => {
  if (percent >= 110) return 'linear-gradient(90deg, #10B981 0%, #34D399 100%)'
  if (percent >= 90) return 'linear-gradient(90deg, #3B82F6 0%, #60A5FA 100%)'
  if (percent >= 70) return 'linear-gradient(90deg, #F59E0B 0%, #FBBF24 100%)'
  return 'linear-gradient(90deg, #EF4444 0%, #F87171 100%)'
}

const sizeClasses = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
}

export function NotificationProgressBar({
  percent,
  showLabel = false,
  size = 'md',
  animated = true,
  color,
}: NotificationProgressBarProps) {
  const clampedPercent = Math.min(Math.max(percent, 0), 100)
  
  const barColor = useMemo(() => {
    return color || getColorByPercent(percent)
  }, [color, percent])
  
  const gradient = useMemo(() => {
    return color ? `linear-gradient(90deg, ${color} 0%, ${color}DD 100%)` : getGradientByPercent(percent)
  }, [color, percent])

  return (
    <div className="w-full">
      <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div
          className={`${sizeClasses[size]} rounded-full transition-all duration-700 ease-out`}
          style={{
            width: `${clampedPercent}%`,
            background: gradient,
            animation: animated ? 'progressSlideIn 0.8s ease-out' : 'none',
          }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between items-center mt-1">
          <span className="text-xs font-semibold" style={{ color: barColor }}>
            {percent}%
          </span>
        </div>
      )}
    </div>
  )
}

/**
 * 🔵 Круговой прогресс
 */
interface ProgressRingProps {
  percent: number
  size?: number
  strokeWidth?: number
  showLabel?: boolean
}

export function ProgressRing({
  percent,
  size = 48,
  strokeWidth = 4,
  showLabel = true,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const clampedPercent = Math.min(Math.max(percent, 0), 100)
  const offset = circumference - (clampedPercent / 100) * circumference
  const color = getColorByPercent(percent)

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-200 dark:text-gray-700"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
            transition: 'stroke-dashoffset 0.8s ease-out',
          }}
        />
      </svg>
      {showLabel && (
        <span className="absolute text-xs font-bold" style={{ color }}>
          {percent}%
        </span>
      )}
    </div>
  )
}

/**
 * 📊 Hero-метрика для модалки
 */
interface HeroMetricProps {
  current: number
  goal: number
  percent: number
  label?: string
  status?: 'exceeded' | 'on-track' | 'behind' | 'failed'
}

export function HeroMetric({
  current,
  goal,
  percent,
  label = 'Выполнение',
  status,
}: HeroMetricProps) {
  const color = getColorByPercent(percent)
  
  const StatusIcon = {
    exceeded: PartyPopper,
    'on-track': CheckCircle,
    behind: AlertTriangle,
    failed: TrendingUp,
  }
  
  const Icon = status ? StatusIcon[status] : null

  return (
    <div className="text-center py-4">
      <div className="mb-4">
        <span className="text-4xl font-bold text-gray-900 dark:text-white">
          {current.toLocaleString('ru-RU')}
        </span>
        <span className="text-2xl text-gray-500 dark:text-gray-400 mx-2">/</span>
        <span className="text-2xl text-gray-500 dark:text-gray-400">
          {goal.toLocaleString('ru-RU')} ₽
        </span>
      </div>
      
      <div className="max-w-xs mx-auto mb-3">
        <NotificationProgressBar percent={percent} size="lg" showLabel />
      </div>
      
      {status && Icon && (
        <div 
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium"
          style={{ backgroundColor: `${color}20`, color }}
        >
          <Icon className="w-4 h-4" />
          {label}
        </div>
      )}
    </div>
  )
}

/**
 * 💡 Actionable insight (без иконки - убрали дублирование)
 */
interface ActionableInsightProps {
  text: string
  ctaLabel?: string
  ctaAction?: () => void
}

export function ActionableInsight({
  text,
  ctaLabel,
  ctaAction,
}: ActionableInsightProps) {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40">
          <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
            {text}
          </p>
          {ctaLabel && ctaAction && (
            <button
              onClick={ctaAction}
              className="mt-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              {ctaLabel} →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
