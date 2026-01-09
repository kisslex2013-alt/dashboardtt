/**
 * 🔔 Элемент уведомления в списке (Redesign v2 + Animations)
 *
 * Минималистичный дизайн с:
 * - Hero-метрикой
 * - Прогресс-баром
 * - 1 actionable рекомендацией
 * - Color-coded статусом
 * - Плавные анимации
 */

import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'
import { motion } from 'framer-motion'
import { Eye, X, Clock, Lightbulb, Sparkles, Database } from '../../utils/icons'
import type { AINotification } from '../../types/aiNotifications'
import { useNotificationActions } from '../../store/useAINotificationsStore'
import { NotificationProgressBar } from './NotificationProgress'

interface NotificationItemProps {
  notification: AINotification
  onClick: () => void
  compact?: boolean
  index?: number // для stagger анимации
  isActive?: boolean // для подсветки выбранного
}

/**
 * Извлекает метрики из data уведомления
 */
const extractMetrics = (notification: AINotification) => {
  const data = notification.data || {}
  
  if (data.currentEarned !== undefined && data.goalAmount !== undefined) {
    return {
      current: data.currentEarned,
      goal: data.goalAmount,
      percent: data.percentComplete || Math.round((data.currentEarned / data.goalAmount) * 100),
      remaining: data.goalAmount - data.currentEarned,
      daysRemaining: data.daysRemaining,
      hasProgress: true,
    }
  }
  
  if (data.forecast !== undefined && data.goalAmount !== undefined) {
    return {
      current: data.forecast,
      goal: data.goalAmount,
      percent: Math.round((data.forecast / data.goalAmount) * 100),
      hasProgress: true,
    }
  }
  
  if (data.avgHoursPerDay !== undefined) {
    return {
      avgHours: data.avgHoursPerDay,
      consecutiveDays: data.consecutiveDays,
      hasProgress: false,
    }
  }
  
  return { hasProgress: false }
}

const getBorderColor = (notification: AINotification) => {
  const data = notification.data || {}
  
  if (data.status) {
    switch (data.status) {
      case 'exceeded': return 'border-l-green-500'
      case 'on-track': return 'border-l-blue-500'
      case 'behind': return 'border-l-yellow-500'
      case 'failed': return 'border-l-red-500'
    }
  }
  
  switch (notification.priority) {
    case 'critical': return 'border-l-red-500'
    case 'high': return 'border-l-yellow-500'
    default: return 'border-l-blue-500'
  }
}

const getIconBgColor = (notification: AINotification) => {
  const data = notification.data || {}
  
  if (data.status) {
    switch (data.status) {
      case 'exceeded': return 'bg-green-500/15 text-green-400'
      case 'on-track': return 'bg-blue-500/15 text-blue-400'
      case 'behind': return 'bg-yellow-500/15 text-yellow-400'
      case 'failed': return 'bg-red-500/15 text-red-400'
    }
  }
  
  switch (notification.priority) {
    case 'critical': return 'bg-red-500/15 text-red-400'
    case 'high': return 'bg-yellow-500/15 text-yellow-400'
    default: return 'bg-blue-500/15 text-blue-400'
  }
}

// Neon Glow стили для карточек
const getNeonGlow = (notification: AINotification) => {
  // WOW-эффект для "удивительных" инсайтов
  if (notification.isSurprising) {
    return { 
      glow: 'shadow-[0_0_20px_rgba(168,85,247,0.35)]', 
      border: 'border-purple-500/50', 
      gradient: 'from-pink-500 via-purple-500 to-cyan-500',
      isRainbow: true
    }
  }

  const data = notification.data || {}
  
  if (data.status) {
    switch (data.status) {
      case 'exceeded': return { glow: 'shadow-[0_0_15px_rgba(34,197,94,0.25)]', border: 'border-green-500/30', gradient: 'from-green-500 to-emerald-400', isRainbow: false }
      case 'on-track': return { glow: 'shadow-[0_0_15px_rgba(59,130,246,0.25)]', border: 'border-blue-500/30', gradient: 'from-blue-500 to-cyan-400', isRainbow: false }
      case 'behind': return { glow: 'shadow-[0_0_15px_rgba(245,158,11,0.25)]', border: 'border-amber-500/30', gradient: 'from-amber-500 to-yellow-400', isRainbow: false }
      case 'failed': return { glow: 'shadow-[0_0_15px_rgba(239,68,68,0.25)]', border: 'border-red-500/30', gradient: 'from-red-500 to-rose-400', isRainbow: false }
    }
  }
  
  switch (notification.priority) {
    case 'critical': return { glow: 'shadow-[0_0_15px_rgba(239,68,68,0.25)]', border: 'border-red-500/30', gradient: 'from-red-500 to-rose-400', isRainbow: false }
    case 'high': return { glow: 'shadow-[0_0_15px_rgba(245,158,11,0.25)]', border: 'border-amber-500/30', gradient: 'from-amber-500 to-yellow-400', isRainbow: false }
    default: return { glow: 'shadow-[0_0_15px_rgba(59,130,246,0.25)]', border: 'border-blue-500/30', gradient: 'from-blue-500 to-cyan-400', isRainbow: false }
  }
}

// Анимация для карточки
const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: index * 0.08,
      duration: 0.3,
      type: 'spring',
      stiffness: 300,
      damping: 25,
    },
  }),
  exit: {
    opacity: 0,
    x: -100,
    transition: { duration: 0.2 },
  },
}

// Анимация для кнопок быстрых действий
const actionButtonVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.15 }
  },
}

export function NotificationItem({
  notification,
  onClick,
  compact = false,
  index = 0,
  isActive = false,
}: NotificationItemProps) {
  const { markAsRead, removeNotification, snoozeNotification } = useNotificationActions()
  const metrics = extractMetrics(notification)
  const neonStyles = getNeonGlow(notification)

  const getTimeAgo = () => {
    try {
      return formatDistanceToNow(new Date(notification.createdAt), {
        addSuffix: false,
        locale: ru,
      })
    } catch {
      return 'недавно'
    }
  }

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation()
    markAsRead(notification.id)
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    removeNotification(notification.id)
  }

  const handleSnooze = (e: React.MouseEvent) => {
    e.stopPropagation()
    const snoozeUntil = new Date(Date.now() + 60 * 60 * 1000).toISOString()
    snoozeNotification(notification.id, snoozeUntil)
  }

  const firstRecommendation = notification.recommendations?.[0]

  return (
    <motion.div
      onClick={onClick}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      custom={index}
      whileHover={{ 
        scale: isActive ? 1 : 1.02,
        boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.15)',
      }}
      whileTap={{ scale: 0.98 }}
      layout
      className={`
        relative overflow-hidden
        ${isActive 
          ? 'bg-blue-50/80 dark:bg-blue-900/20 border-blue-500/50 ring-1 ring-blue-500/30' 
          : notification.isRead 
            ? 'bg-gray-50/95 dark:bg-gray-800/50' 
            : 'bg-white/95 dark:bg-slate-900/95'
        }
        ${!isActive && neonStyles.border}
        ${!isActive && !notification.isRead ? neonStyles.glow : ''}
        border rounded-xl p-4
        backdrop-blur-sm
        cursor-pointer
        group
        ${compact ? 'mb-2' : 'mb-3'}
        transition-all duration-300
      `}
    >
      {/* Активный маркер слева */}
      {isActive && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
      )}

      {/* Неоновая линия сверху (только если не активный и не прочитан) */}
      {!isActive && !notification.isRead && (
        <div 
          className={`
            absolute top-0 left-0 right-0 h-[2px]
            bg-gradient-to-r ${neonStyles.gradient}
            opacity-70
          `}
        >
          <div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer"
            style={{ animationDuration: '2s' }}
          />
        </div>
      )}
      {/* Main content */}
      <div className="flex items-start gap-3 pl-1">
        {/* Icon with pulse animation for unread */}
        <motion.div 
          className={`flex-shrink-0 p-2.5 rounded-xl ${getIconBgColor(notification)}`}
          animate={!notification.isRead && !isActive ? { 
            scale: [1, 1.05, 1],
          } : {}}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          {notification.icon}
        </motion.div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h4 className={`
            text-sm font-bold mb-1 flex items-center gap-1.5
            ${notification.isRead ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-white'}
          `}>
            {notification.isSurprising && (
              <motion.span
                animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className="w-4 h-4 text-purple-500" />
              </motion.span>
            )}
            {notification.title}
          </h4>

          {/* Progress bar */}
          {metrics.hasProgress && 'percent' in metrics && (
            <motion.div 
              className="mb-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-gray-900 dark:text-white">
                  {metrics.current?.toLocaleString('ru-RU')} ₽
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  из {metrics.goal?.toLocaleString('ru-RU')} ₽
                </span>
              </div>
              <NotificationProgressBar 
                percent={metrics.percent || 0} 
                size="sm" 
                animated={!notification.isRead}
              />
            </motion.div>
          )}

          {/* Key insight */}
          {'remaining' in metrics && metrics.remaining && metrics.remaining > 0 && (
            <motion.p 
              className="text-xs text-gray-600 dark:text-gray-400 mb-2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              До цели: <span className="font-semibold">{metrics.remaining.toLocaleString('ru-RU')} ₽</span>
              {'daysRemaining' in metrics && metrics.daysRemaining !== undefined && (
                <span> ({metrics.daysRemaining} {metrics.daysRemaining === 1 ? 'день' : 'дней'})</span>
              )}
            </motion.p>
          )}

          {/* Burnout specific */}
          {'avgHours' in metrics && (
            <motion.p 
              className="text-xs text-red-600 dark:text-red-400 mb-2"
              animate={{ color: ['#DC2626', '#EF4444', '#DC2626'] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              ⚡ {metrics.avgHours} ч/день • {metrics.consecutiveDays} дней подряд
            </motion.p>
          )}

          {/* First recommendation */}
          {firstRecommendation && (
            <motion.div 
              className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Lightbulb className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{firstRecommendation}</span>
            </motion.div>
          )}

          {/* Footer */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {getTimeAgo()}
            </span>
            {notification.data?.analysisDepth && (
              <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                <Database className="w-3 h-3" />
                {notification.data.analysisDepth.daysAnalyzed} дн.
              </span>
            )}
            {notification.isTest && (
              <span className="text-xs px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded">
                Тест
              </span>
            )}
            {!notification.isRead && !isActive && (
              <motion.span 
                className="w-2 h-2 bg-blue-500 rounded-full"
                animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Quick actions (on hover) */}
      <motion.div 
        className="absolute top-3 right-3 flex items-center gap-1"
        initial="hidden"
        whileHover="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1 }
        }}
      >
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
          {!notification.isRead && (
            <motion.button
              onClick={handleMarkAsRead}
              className="p-1.5 rounded-lg bg-white dark:bg-gray-700 shadow-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              title="Прочитано"
              variants={actionButtonVariants}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Eye className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300" />
            </motion.button>
          )}

          {!notification.isRead && (
            <motion.button
              onClick={handleSnooze}
              className="p-1.5 rounded-lg bg-white dark:bg-gray-700 shadow-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              title="Отложить"
              variants={actionButtonVariants}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Clock className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300" />
            </motion.button>
          )}

          <motion.button
            onClick={handleRemove}
            className="p-1.5 rounded-lg bg-white dark:bg-gray-700 shadow-md hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            title="Удалить"
            variants={actionButtonVariants}
            whileHover={{ scale: 1.1, backgroundColor: '#FEE2E2' }}
            whileTap={{ scale: 0.9 }}
          >
            <X className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300" />
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}
