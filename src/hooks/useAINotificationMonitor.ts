/**
 * 🔔 Хук автоматического мониторинга AI-уведомлений (Web Worker версия)
 *
 * Автоматически анализирует данные пользователя в фоновом потоке
 * и генерирует уведомления на основе выявленных паттернов.
 */

import { useEffect, useRef, useMemo } from 'react'
import { useEntriesStore } from '../store/useEntriesStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { useAINotificationsStore } from '../store/useAINotificationsStore'
import { AINotificationService } from '../services/aiNotificationService'
import { BrowserPushService } from '../services/browserPushService'
import { calculateWorkingDaysInMonth } from '../utils/calculations'

// Типы для worker
interface WorkerResult {
  success: boolean
  data?: {
    burnoutData: any
    goalRiskData: any
    forecastData: any
    productivityData: any
    efficiencyData: any
    anomalyData: any
    achievementData: any
    monthSummaryData: any
    timestamp: string
  }
  error?: string
}

export const useAINotificationMonitor = () => {
  // Данные из store
  const entries = useEntriesStore((state) => state.entries)
  const dailyGoal = useSettingsStore((state) => state.dailyGoal)
  const categories = useSettingsStore((state) => state.categories)
  const workScheduleTemplate = useSettingsStore((state) => state.workScheduleTemplate)
  const workScheduleStartDay = useSettingsStore((state) => state.workScheduleStartDay)
  const customWorkDates = useSettingsStore((state) => state.customWorkDates)
  
  // Вычисляем реальный monthlyGoal с учётом рабочих дней
  const monthlyGoal = useMemo(() => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()
    const settings = { workScheduleTemplate, workScheduleStartDay, customWorkDates }
    const workingDaysInMonth = calculateWorkingDaysInMonth(currentYear, currentMonth, 1, null, settings)
    return Math.round(dailyGoal * workingDaysInMonth)
  }, [dailyGoal, workScheduleTemplate, workScheduleStartDay, customWorkDates])
  
  // Состояние уведомлений
  const enabled = useAINotificationsStore((state) => state.enabled)
  const quietHours = useAINotificationsStore((state) => state.quietHours)
  const lastShownDates = useAINotificationsStore((state) => state.lastShownDates)
  const addNotification = useAINotificationsStore((state) => state.addNotification)
  const markAsShown = useAINotificationsStore((state) => state.markAsShown)
  const showBrowserNotifications = useAINotificationsStore((state) => state.showBrowserNotifications)
  const setLastAnalyzed = useAINotificationsStore((state) => state.setLastAnalyzed)

  // Refs
  const workerRef = useRef<Worker | null>(null)
  const lastCacheKeyRef = useRef<string>('')

  // Инициализация Web Worker
  useEffect(() => {
    // В Vite worker импортируется через конструктор
    workerRef.current = new Worker(new URL('../workers/aiAnalysisWorker.ts', import.meta.url), {
      type: 'module',
    })

    workerRef.current.onmessage = (e: MessageEvent<WorkerResult>) => {
      const { success, data, error } = e.data

      if (success && data) {
        // Устанавливаем время последнего анализа
        setLastAnalyzed(data.timestamp)
        console.log('[AI Monitor] Received analysis results, processing notifications...')

        // Обработка результатов анализа
        
        // 1. Риск выгорания
        if (data.burnoutData) {
          const canShow = AINotificationService.shouldShowNotification(
            'burnout-warning',
            lastShownDates,
            quietHours
          )
          console.log('[AI Monitor] Burnout: data exists, canShow:', canShow)
          if (canShow) {
            const notification = AINotificationService.generateBurnoutNotification(data.burnoutData)
            addNotification(notification)
            markAsShown('burnout-warning')
          }
        }

        // 2. Риск цели
        if (data.goalRiskData) {
          const canShow = AINotificationService.shouldShowNotification(
            'goal-risk',
            lastShownDates,
            quietHours
          )
          if (canShow) {
            const notification = AINotificationService.generateGoalRiskNotification(data.goalRiskData)
            addNotification(notification)
            markAsShown('goal-risk')
          }
        }

        // 3. Прогноз
        if (data.forecastData) {
          const canShow = AINotificationService.shouldShowNotification(
            'monthly-forecast',
            lastShownDates,
            quietHours
          )
          if (canShow) {
            const notification = AINotificationService.generateForecastNotification(data.forecastData)
            addNotification(notification)
            markAsShown('monthly-forecast')
          }
        }

        // 4. Паттерны продуктивности
        if (data.productivityData) {
          const canShow = AINotificationService.shouldShowNotification(
            'productivity-pattern',
            lastShownDates,
            quietHours
          )
          if (canShow) {
            const notification = AINotificationService.generateProductivityNotification(data.productivityData)
            addNotification(notification)
            markAsShown('productivity-pattern')
          }
        }

        // 5. Эффективность категорий
        if (data.efficiencyData) {
          const canShow = AINotificationService.shouldShowNotification(
            'inefficient-category',
            lastShownDates,
            quietHours
          )
          if (canShow) {
            const notification = AINotificationService.generateEfficiencyNotification(data.efficiencyData)
            addNotification(notification)
            markAsShown('inefficient-category')
          }
        }

        // 6. Аномалии
        if (data.anomalyData) {
          const canShow = AINotificationService.shouldShowNotification(
            'anomaly',
            lastShownDates,
            quietHours
          )
          if (canShow) {
            const notification = AINotificationService.generateAnomalyNotification(data.anomalyData)
            addNotification(notification)
            markAsShown('anomaly')
          }
        }

        // 7. Достижения
        if (data.achievementData) {
          const canShow = AINotificationService.shouldShowNotification(
            'achievement',
            lastShownDates,
            quietHours
          )
          if (canShow) {
            const notification = AINotificationService.generateAchievementNotification(data.achievementData)
            addNotification(notification)
            markAsShown('achievement')
          }
        }

        // 8. Итоги месяца
        if (data.monthSummaryData) {
          const canShow = AINotificationService.shouldShowNotification(
            'month-summary',
            lastShownDates,
            quietHours
          )
          console.log('[AI Monitor] Month Summary: data exists, canShow:', canShow)
          if (canShow) {
            const notification = AINotificationService.generateMonthSummaryNotification(data.monthSummaryData)
            addNotification(notification)
            markAsShown('month-summary')
          }
        }

      } else {
        console.error('AI Analysis Error:', error)
      }
    }

    return () => {
      workerRef.current?.terminate()
    }
  }, [addNotification, lastShownDates, markAsShown, quietHours, setLastAnalyzed])

  // Запуск анализа при изменении данных
  useEffect(() => {
    if (!enabled || !entries.length || !workerRef.current) return

    // Создаем ключ кэширования: длина массива + дата последней записи + дневная цель
    const lastEntryDate = entries[0]?.date || '' // Предполагаем сортировку по дате
    const recordsCount = entries.length
    const cacheKey = `${recordsCount}-${lastEntryDate}-${dailyGoal}`

    // Если данные не изменились, пропускаем анализ
    if (cacheKey === lastCacheKeyRef.current) {
      return
    }

    // Сохраняем новый ключ
    lastCacheKeyRef.current = cacheKey

    // Дебаунс: ждем пока пользователь закончит редактирование/импорт
    const timer = setTimeout(() => {
      workerRef.current?.postMessage({
        entries,
        monthlyGoal,
        categories
      })
    }, 2000) // 2 секунды задержка после последнего изменения

    return () => clearTimeout(timer)
  }, [entries, monthlyGoal, categories, enabled])

  /**
   * 🔄 Принудительный запуск анализа
   * Игнорирует кэш и запускает анализ немедленно
   */
  const triggerAnalysis = () => {
    if (!enabled || !entries.length || !workerRef.current) {
      console.warn('[AI Analysis] Cannot trigger: disabled, no entries, or worker not ready')
      return
    }

    console.log('[AI Analysis] Manual analysis triggered')
    
    // Очищаем кэш чтобы следующий авто-анализ тоже сработал
    lastCacheKeyRef.current = ''
    
    // Отправляем данные в worker немедленно
    workerRef.current.postMessage({
      entries,
      monthlyGoal,
      categories
    })
  }

  return { triggerAnalysis }
}

