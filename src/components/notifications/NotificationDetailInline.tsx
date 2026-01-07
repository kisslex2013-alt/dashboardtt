/**
 * 🔍 Inline-детали AI-уведомления (для Split-View панелей)
 *
 * Адаптированная версия NotificationDetailModal без модального окна.
 * Предназначена для отображения в правой колонке AINotificationsPanel.
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'
import type { AINotification } from '../../types/aiNotifications'
import { HeroMetric, ActionableInsight, NotificationProgressBar } from './NotificationProgress'
import { TrendingUp, BarChart3, Calendar, ChevronDown } from '../../utils/icons'

interface NotificationDetailInlineProps {
  notification: AINotification
}

/**
 * Извлекает метрики из data уведомления
 */
const extractMetrics = (data: Record<string, any> = {}) => {
  if (data.currentEarned !== undefined && data.goalAmount !== undefined) {
    return {
      type: 'goal' as const,
      current: data.currentEarned,
      goal: data.goalAmount,
      percent: data.percentComplete || Math.round((data.currentEarned / data.goalAmount) * 100),
      remaining: data.goalAmount - data.currentEarned,
      daysRemaining: data.daysRemaining,
      status: data.status,
    }
  }
  
  if (data.forecast !== undefined && data.goalAmount !== undefined) {
    return {
      type: 'forecast' as const,
      current: data.forecast,
      goal: data.goalAmount,
      percent: Math.round((data.forecast / data.goalAmount) * 100),
      overachievement: data.overachievement,
    }
  }
  
  if (data.avgHoursPerDay !== undefined) {
    return {
      type: 'burnout' as const,
      avgHours: data.avgHoursPerDay,
      consecutiveDays: data.consecutiveDays,
      totalHours: data.totalHours,
    }
  }
  
  if (data.peakHour !== undefined) {
    return {
      type: 'productivity' as const,
      peakHour: data.peakHour,
      peakEfficiency: data.peakEfficiency,
      worstHour: data.worstHour,
    }
  }
  
  if (data.category !== undefined && data.timePercent !== undefined) {
    return {
      type: 'efficiency' as const,
      category: data.category,
      timePercent: data.timePercent,
      incomePercent: data.incomePercent,
    }
  }
  
  if (data.earned !== undefined && data.normalEarned !== undefined) {
    return {
      type: 'anomaly' as const,
      earned: data.earned,
      normalEarned: data.normalEarned,
      deviation: data.deviation,
    }
  }
  
  return { type: 'generic' as const }
}

// Анимации для секций
const sectionVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3 }
  }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05
    }
  }
}

export function NotificationDetailInline({ notification }: NotificationDetailInlineProps) {
  const [isRecommendationsOpen, setIsRecommendationsOpen] = useState(false)
  
  // Сбрасываем состояние при смене уведомления
  useEffect(() => {
    setIsRecommendationsOpen(false)
  }, [notification.id])

  const metrics = extractMetrics(notification.data)

  const getTimeAgo = () => {
    try {
      return formatDistanceToNow(new Date(notification.createdAt), {
        addSuffix: true,
        locale: ru,
      })
    } catch {
      return 'недавно'
    }
  }

  const getStatusColor = () => {
    if (metrics.type === 'goal' && 'status' in metrics) {
      switch (metrics.status) {
        case 'exceeded': return 'text-green-600 dark:text-green-400'
        case 'on-track': return 'text-blue-600 dark:text-blue-400'
        case 'behind': return 'text-yellow-600 dark:text-yellow-400'
        case 'failed': return 'text-red-600 dark:text-red-400'
      }
    }
    
    switch (notification.priority) {
      case 'critical': return 'text-red-600 dark:text-red-400'
      case 'high': return 'text-yellow-600 dark:text-yellow-400'
      default: return 'text-blue-600 dark:text-blue-400'
    }
  }

  return (
    <motion.div 
      key={notification.id} // Ключ для перезапуска анимации при смене ID
      className="space-y-6 h-full"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {/* Заголовок и время */}
      <motion.div variants={sectionVariants}>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 leading-tight">
          {notification.title}
        </h3>
        <div className={`text-sm ${getStatusColor()} flex items-center gap-2`}>
          {getTimeAgo()}
          {notification.isTest && (
            <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded text-xs border border-purple-200 dark:border-purple-800">
              Тестовое
            </span>
          )}
        </div>
      </motion.div>

      {/* Hero section для метрик с целями */}
      {metrics.type === 'goal' && (
        <motion.div variants={sectionVariants}>
          <HeroMetric
            current={metrics.current}
            goal={metrics.goal}
            percent={metrics.percent || 0}
            status={metrics.status as 'exceeded' | 'on-track' | 'behind' | 'failed'}
            label={
              metrics.status === 'exceeded' ? 'Перевыполнено!' :
              metrics.status === 'on-track' ? 'Цель достигнута' :
              metrics.status === 'behind' ? 'Почти у цели' :
              'Итоги месяца'
            }
          />
        </motion.div>
      )}

      {/* Hero section для прогноза */}
      {metrics.type === 'forecast' && (
        <motion.div 
          className="text-center py-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700"
          variants={sectionVariants}
        >
          <motion.div 
            className="mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <span className="text-sm text-gray-500 dark:text-gray-400">Прогноз на конец месяца</span>
          </motion.div>
          <motion.div 
            className="text-4xl font-bold text-green-600 dark:text-green-400 mb-4"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          >
            {metrics.current.toLocaleString('ru-RU')} ₽
          </motion.div>
          <div className="max-w-xs mx-auto mb-3 px-4">
            <NotificationProgressBar percent={metrics.percent || 0} size="lg" showLabel />
          </div>
          {metrics.overachievement && (
            <motion.p 
              className="text-sm text-green-600 dark:text-green-400 font-medium"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              🎉 Превышение цели на {metrics.overachievement.toLocaleString('ru-RU')} ₽
            </motion.p>
          )}
        </motion.div>
      )}

      {/* Burnout section */}
      {metrics.type === 'burnout' && (
        <motion.div 
          className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 text-center border border-red-100 dark:border-red-900/30"
          variants={sectionVariants}
        >
          <motion.div 
            className="text-5xl mb-4"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            🔥
          </motion.div>
          <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">
            {metrics.avgHours} ч/день
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {metrics.consecutiveDays} дней интенсивной работы подряд
          </p>
          {metrics.totalHours && (
            <p className="text-xs text-gray-500 mt-2">
              Всего за неделю: {metrics.totalHours} часов
            </p>
          )}
        </motion.div>
      )}

      {/* Productivity section */}
      {metrics.type === 'productivity' && (
        <motion.div 
          className="grid grid-cols-2 gap-4"
          variants={sectionVariants}
        >
          <motion.div 
            className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center border border-green-100 dark:border-green-900/30"
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Пик продуктивности</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {metrics.peakHour}:00
            </div>
            {metrics.peakEfficiency && (
              <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                +{metrics.peakEfficiency}% эффективнее
              </div>
            )}
          </motion.div>
          <motion.div 
            className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center border border-gray-100 dark:border-gray-700"
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Низкая активность</div>
            <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
              {metrics.worstHour}:00
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Efficiency section */}
      {metrics.type === 'efficiency' && (
        <motion.div 
          className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 border border-yellow-100 dark:border-yellow-900/30"
          variants={sectionVariants}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/40 rounded-lg">
              <BarChart3 className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <span className="font-semibold text-gray-900 dark:text-white text-lg">
              {metrics.category}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-center divide-x divide-yellow-200 dark:divide-yellow-800/30">
            <div>
              <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{metrics.timePercent}%</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium mt-1">времени</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-600 dark:text-gray-300">{metrics.incomePercent}%</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium mt-1">дохода</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Anomaly section */}
      {metrics.type === 'anomaly' && (
        <motion.div 
          className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6 text-center border border-purple-100 dark:border-purple-900/30"
          variants={sectionVariants}
        >
          <motion.div 
            className="text-5xl mb-4"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            📈
          </motion.div>
          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
            {metrics.earned.toLocaleString('ru-RU')} ₽
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Обычно: {metrics.normalEarned.toLocaleString('ru-RU')} ₽
          </p>
          {metrics.deviation && (
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-2 font-medium bg-purple-100 dark:bg-purple-900/40 inline-block px-2 py-1 rounded-full">
              ×{metrics.deviation.toFixed(1)} от нормы
            </p>
          )}
        </motion.div>
      )}

      {/* Key insight for goal types */}
      {metrics.type === 'goal' && metrics.remaining > 0 && (
        <motion.div 
          className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700"
          variants={sectionVariants}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">До цели</span>
            </div>
            <span className="font-bold text-gray-900 dark:text-white">
              {metrics.remaining.toLocaleString('ru-RU')} ₽
            </span>
          </div>
          {metrics.daysRemaining !== undefined && metrics.daysRemaining > 0 && (
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Нужно в день</span>
              </div>
              <span className="font-bold text-gray-900 dark:text-white">
                {Math.round(metrics.remaining / metrics.daysRemaining).toLocaleString('ru-RU')} ₽
              </span>
            </div>
          )}
        </motion.div>
      )}

      {/* Recommendations - only first one as actionable */}
      {notification.recommendations && notification.recommendations.length > 0 && (
        <motion.div variants={sectionVariants}>
          <ActionableInsight text={notification.recommendations[0]} />
        </motion.div>
      )}

      {/* Additional recommendations (animated accordion) */}
      {notification.recommendations && notification.recommendations.length > 1 && (
        <motion.div variants={sectionVariants}>
          <button
            onClick={() => setIsRecommendationsOpen(!isRecommendationsOpen)}
            className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors w-full p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
          >
            <motion.div
              animate={{ rotate: isRecommendationsOpen ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronDown className="w-4 h-4" />
            </motion.div>
            <span>Ещё {notification.recommendations.length - 1} рекомендаций</span>
          </button>
          
          <AnimatePresence>
            {isRecommendationsOpen && (
              <motion.ul
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden mt-2 space-y-2 pl-4 border-l-2 border-gray-100 dark:border-gray-800 ml-3"
              >
                {notification.recommendations.slice(1).map((rec, i) => (
                  <motion.li 
                    key={i}
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="text-sm text-gray-600 dark:text-gray-400 py-1"
                  >
                    {rec}
                  </motion.li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </motion.div>
  )
}
