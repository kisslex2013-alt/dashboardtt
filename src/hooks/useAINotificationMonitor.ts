/**
 * 🔔 Хук автоматического мониторинга AI-уведомлений
 *
 * Автоматически анализирует данные пользователя и генерирует уведомления
 * на основе выявленных паттернов и условий.
 */

import { useEffect, useRef } from 'react'
import { useEntriesStore } from '../store/useEntriesStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { useAINotificationsStore } from '../store/useAINotificationsStore'
import {
  analyzeBurnoutRisk,
  analyzeGoalProgress,
  generateMonthlyForecast,
  analyzeProductivityPatterns,
  analyzeEfficiency,
  detectAnomalies,
  detectAchievements,
} from '../services/aiNotificationAnalyzer'
import { AINotificationService } from '../services/aiNotificationService'

/**
 * Хук для автоматического мониторинга и генерации AI-уведомлений
 *
 * Запускает проверку данных каждые 30 минут и генерирует уведомления
 * при выполнении определённых условий.
 *
 * @example
 * function App() {
 *   useAINotificationMonitor()
 *   return <div>...</div>
 * }
 */
export const useAINotificationMonitor = () => {
  // Получаем данные из store (отдельные селекторы для предотвращения бесконечного цикла)
  const entries = useEntriesStore((state) => state.entries)
  const dailyGoal = useSettingsStore((state) => state.dailyGoal)
  const categories = useSettingsStore((state) => state.categories)

  const enabled = useAINotificationsStore((state) => state.enabled)
  const quietHours = useAINotificationsStore((state) => state.quietHours)
  const lastShownDates = useAINotificationsStore((state) => state.lastShownDates)
  const addNotification = useAINotificationsStore((state) => state.addNotification)
  const markAsShown = useAINotificationsStore((state) => state.markAsShown)

  // Используем ref для отслеживания активного интервала
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Функция проверки и генерации уведомлений
    const checkAndGenerate = () => {
      // Если AI-уведомления выключены, ничего не делаем
      if (!enabled) return

      // Вычисляем месячную цель в рублях
      const monthlyGoal = dailyGoal * 30

      // 1. Проверка риска выгорания
      const burnoutData = analyzeBurnoutRisk(entries)
      if (burnoutData) {
        const canShow = AINotificationService.shouldShowNotification(
          'burnout-warning',
          lastShownDates,
          quietHours
        )

        if (canShow) {
          const notification = AINotificationService.generateBurnoutNotification(burnoutData)
          addNotification(notification)
          markAsShown('burnout-warning')
        }
      }

      // 2. Проверка риска недостижения цели
      const goalRiskData = analyzeGoalProgress(entries, monthlyGoal)
      if (goalRiskData) {
        const canShow = AINotificationService.shouldShowNotification(
          'goal-risk',
          lastShownDates,
          quietHours
        )

        if (canShow) {
          const notification = AINotificationService.generateGoalRiskNotification(goalRiskData)
          addNotification(notification)
          markAsShown('goal-risk')
        }
      }

      // 3. Прогноз месяца (позитивный)
      const forecastData = generateMonthlyForecast(entries, monthlyGoal)
      if (forecastData) {
        const canShow = AINotificationService.shouldShowNotification(
          'monthly-forecast',
          lastShownDates,
          quietHours
        )

        if (canShow) {
          const notification = AINotificationService.generateForecastNotification(forecastData)
          addNotification(notification)
          markAsShown('monthly-forecast')
        }
      }

      // 4. Паттерны продуктивности
      const productivityData = analyzeProductivityPatterns(entries)
      if (productivityData) {
        const canShow = AINotificationService.shouldShowNotification(
          'productivity-pattern',
          lastShownDates,
          quietHours
        )

        if (canShow) {
          const notification = AINotificationService.generateProductivityNotification(productivityData)
          addNotification(notification)
          markAsShown('productivity-pattern')
        }
      }

      // 5. Неэффективные категории
      const efficiencyData = analyzeEfficiency(entries, categories)
      if (efficiencyData) {
        const canShow = AINotificationService.shouldShowNotification(
          'inefficient-category',
          lastShownDates,
          quietHours
        )

        if (canShow) {
          const notification = AINotificationService.generateEfficiencyNotification(efficiencyData)
          addNotification(notification)
          markAsShown('inefficient-category')
        }
      }

      // 6. Аномалии
      const anomalyData = detectAnomalies(entries)
      if (anomalyData) {
        const canShow = AINotificationService.shouldShowNotification(
          'anomaly',
          lastShownDates,
          quietHours
        )

        if (canShow) {
          const notification = AINotificationService.generateAnomalyNotification(anomalyData)
          addNotification(notification)
          markAsShown('anomaly')
        }
      }

      // 7. Достижения
      const achievementData = detectAchievements(entries, monthlyGoal)
      if (achievementData) {
        const canShow = AINotificationService.shouldShowNotification(
          'achievement',
          lastShownDates,
          quietHours
        )

        if (canShow) {
          const notification = AINotificationService.generateAchievementNotification(achievementData)
          addNotification(notification)
          markAsShown('achievement')
        }
      }
    }

    // Запускаем первую проверку сразу (с небольшой задержкой для инициализации)
    const initialTimeout = setTimeout(() => {
      checkAndGenerate()
    }, 5000) // 5 секунд после загрузки

    // Запускаем периодическую проверку каждые 30 минут
    intervalRef.current = setInterval(() => {
      checkAndGenerate()
    }, 30 * 60 * 1000) // 30 минут

    // Очистка при размонтировании
    return () => {
      clearTimeout(initialTimeout)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [
    entries,
    dailyGoal,
    categories,
    enabled,
    quietHours,
    lastShownDates,
    addNotification,
    markAsShown,
  ])

  // Хук ничего не возвращает, работает в фоне
}
