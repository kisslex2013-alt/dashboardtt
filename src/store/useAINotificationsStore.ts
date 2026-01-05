/**
 * 🤖 Zustand Store для AI-уведомлений
 *
 * Управляет:
 * - Настройками AI-уведомлений
 * - Списком уведомлений (новые, прочитанные, тестовые)
 * - Статистикой тестового режима
 * - Тихими часами
 * - Browser Push уведомлениями
 */

import { useMemo } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  AINotification,
  EnabledNotificationTypes,
  FrequencyMode,
  QuietHours,
  TestStats,
} from '../types/aiNotifications'
import { BrowserPushService } from '../services/browserPushService'

interface AINotificationsState {
  // ============ НАСТРОЙКИ ============
  /** Включены ли AI-уведомления вообще */
  enabled: boolean
  /** Режим частоты (minimal/balanced/maximum) */
  frequencyMode: FrequencyMode
  /** Показывать ли в блоке инсайтов */
  showInInsights: boolean
  /** Browser Push для критических */
  showBrowserNotifications: boolean
  /** Toast-уведомления */
  showToasts: boolean
  /** Звуковые эффекты */
  enableSounds: boolean
  /** Какие типы уведомлений включены */
  enabledTypes: EnabledNotificationTypes
  /** Настройки тихих часов */
  quietHours: QuietHours

  // ============ УВЕДОМЛЕНИЯ ============
  /** Все уведомления */
  notifications: AINotification[]
  /** ID отклонённых рекомендаций (чтобы не показывать повторно) */
  dismissedRecommendations: string[]
  /** Последние даты показа для каждого типа (для контроля частоты) */
  lastShownDates: Record<string, string>
  /** Время последнего полного анализа */
  lastAnalyzed: string | null

  // ============ ТЕСТОВЫЙ РЕЖИМ ============
  /** Статистика тестовых уведомлений */
  testStats: TestStats

  // ============ ACTIONS ============
  /** Включить/выключить AI-уведомления */
  setEnabled: (enabled: boolean) => void
  /** Изменить режим частоты */
  setFrequencyMode: (mode: FrequencyMode) => void
  /** Изменить способ отображения */
  setShowInInsights: (show: boolean) => void
  setShowBrowserNotifications: (show: boolean) => void
  setShowToasts: (show: boolean) => void
  setEnableSounds: (enable: boolean) => void
  /** Изменить включенные типы */
  setEnabledTypes: (types: Partial<EnabledNotificationTypes>) => void
  /** Изменить настройки тихих часов */
  setQuietHours: (hours: Partial<QuietHours>) => void

  /** Добавить уведомление */
  addNotification: (notification: AINotification) => void
  /** Отметить уведомление как прочитанное */
  markAsRead: (id: string) => void
  /** Отметить все как прочитанные */
  markAllAsRead: () => void
  /** Удалить уведомление */
  removeNotification: (id: string) => void
  /** Отложить уведомление */
  snoozeNotification: (id: string, until: string) => void
  /** Отклонить рекомендацию (больше не показывать) */
  dismissRecommendation: (recommendationId: string) => void

  /** Очистить все тестовые уведомления */
  clearTestNotifications: () => void
  /** Обновить статистику тестов */
  updateTestStats: () => void
  /** Отметить тип уведомления как показанный (для контроля частоты) */
  markAsShown: (type: string) => void
  /** Установить время последнего анализа */
  setLastAnalyzed: (date: string) => void

  /** Получить непрочитанные уведомления */
  getUnreadNotifications: () => AINotification[]
  /** Получить количество непрочитанных */
  getUnreadCount: () => number
  /** Получить критические непрочитанные */
  getCriticalUnread: () => AINotification[]
  /** Проверить, находимся ли в тихих часах */
  isQuietTime: () => boolean
}

export const useAINotificationsStore = create<AINotificationsState>()(
  persist(
    (set, get) => ({
      // ============ НАЧАЛЬНЫЕ ЗНАЧЕНИЯ ============
      enabled: true,
      frequencyMode: 'balanced',
      showInInsights: true,
      showBrowserNotifications: true,
      showToasts: true,
      enableSounds: false,
      enabledTypes: {
        burnoutWarning: true,
        productivityPatterns: true,
        monthlyForecast: true,
        inefficientCategories: true,
        achievements: true,
      },
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00',
        weekendsOnly: false,
      },
      notifications: [],
      dismissedRecommendations: [],
      lastShownDates: {},
      lastAnalyzed: null,
      testStats: {
        totalCreated: 0,
        currentCount: 0,
      },

      // ============ НАСТРОЙКИ ============
      setEnabled: (enabled) => set({ enabled }),
      setFrequencyMode: (frequencyMode) => set({ frequencyMode }),
      setShowInInsights: (showInInsights) => set({ showInInsights }),
      setShowBrowserNotifications: (showBrowserNotifications) =>
        set({ showBrowserNotifications }),
      setShowToasts: (showToasts) => set({ showToasts }),
      setEnableSounds: (enableSounds) => set({ enableSounds }),
      setEnabledTypes: (types) =>
        set((state) => ({
          enabledTypes: { ...state.enabledTypes, ...types },
        })),
      setQuietHours: (hours) =>
        set((state) => ({
          quietHours: { ...state.quietHours, ...hours },
        })),

      // ============ УВЕДОМЛЕНИЯ ============
      addNotification: (notification) =>
        set((state) => {
          // Обновляем дату последнего показа для этого типа
          const lastShownDates = {
            ...state.lastShownDates,
            [notification.type]: notification.createdAt,
          }

          // Обновляем статистику тестов, если это тестовое уведомление
          const testStats = notification.isTest
            ? {
                totalCreated: state.testStats.totalCreated + 1,
                currentCount: state.testStats.currentCount + 1,
              }
            : state.testStats

          // Отправляем Browser Push, если нужно
          const settings = {
            enabled: state.enabled,
            showBrowserNotifications: state.showBrowserNotifications,
          }
          if (BrowserPushService.shouldShowPush(notification, settings)) {
            BrowserPushService.sendNotification(notification).catch((error) => {
              console.error('Ошибка при отправке Browser Push:', error)
            })
          }

          return {
            notifications: [notification, ...state.notifications],
            lastShownDates,
            testStats,
          }
        }),

      markAsRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id
              ? { ...n, isRead: true, readAt: new Date().toISOString() }
              : n
          ),
        })),

      markAllAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.isRead
              ? n
              : { ...n, isRead: true, readAt: new Date().toISOString() }
          ),
        })),

      removeNotification: (id) =>
        set((state) => {
          const notification = state.notifications.find((n) => n.id === id)
          const isTest = notification?.isTest || false

          return {
            notifications: state.notifications.filter((n) => n.id !== id),
            testStats: isTest
              ? {
                  ...state.testStats,
                  currentCount: Math.max(0, state.testStats.currentCount - 1),
                }
              : state.testStats,
          }
        }),

      snoozeNotification: (id, until) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, snoozedUntil: until } : n
          ),
        })),

      dismissRecommendation: (recommendationId) =>
        set((state) => ({
          dismissedRecommendations: [
            ...state.dismissedRecommendations,
            recommendationId,
          ],
        })),

      // ============ ТЕСТОВЫЙ РЕЖИМ ============
      clearTestNotifications: () =>
        set((state) => ({
          notifications: state.notifications.filter((n) => !n.isTest),
          testStats: {
            ...state.testStats,
            currentCount: 0,
          },
        })),

      updateTestStats: () =>
        set((state) => {
          const currentCount = state.notifications.filter((n) => n.isTest).length
          return {
            testStats: {
              ...state.testStats,
              currentCount,
            },
          }
        }),

      // Отмечаем тип уведомления как показанный (для контроля частоты)
      markAsShown: (type) =>
        set((state) => ({
          lastShownDates: {
            ...state.lastShownDates,
            [type]: new Date().toISOString(),
          },
        })),

      // Установить время последнего анализа
      setLastAnalyzed: (date) => set({ lastAnalyzed: date }),

      // ============ ГЕТТЕРЫ ============
      getUnreadNotifications: () => {
        const state = get()
        const now = new Date().toISOString()

        return state.notifications.filter(
          (n) =>
            !n.isRead &&
            (!n.snoozedUntil || n.snoozedUntil <= now) // Не показываем отложенные
        )
      },

      getUnreadCount: () => {
        return get().getUnreadNotifications().length
      },

      getCriticalUnread: () => {
        return get()
          .getUnreadNotifications()
          .filter((n) => n.priority === 'critical')
      },

      isQuietTime: () => {
        const state = get()
        if (!state.quietHours.enabled) return false

        const now = new Date()
        const currentDay = now.getDay()
        const isWeekend = currentDay === 0 || currentDay === 6

        // Если weekendsOnly включено, проверяем только в выходные
        if (state.quietHours.weekendsOnly && !isWeekend) {
          return false
        }

        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
        const { start, end } = state.quietHours

        // Обрабатываем случай, когда диапазон переходит через полночь
        if (start > end) {
          return currentTime >= start || currentTime <= end
        }

        return currentTime >= start && currentTime <= end
      },
    }),
    {
      name: 'ai-notifications-storage',
      // Не сохраняем уведомления в localStorage (они временные)
      // Сохраняем только настройки
      partialize: (state) => ({
        enabled: state.enabled,
        frequencyMode: state.frequencyMode,
        showInInsights: state.showInInsights,
        showBrowserNotifications: state.showBrowserNotifications,
        showToasts: state.showToasts,
        enableSounds: state.enableSounds,
        enabledTypes: state.enabledTypes,
        quietHours: state.quietHours,
        dismissedRecommendations: state.dismissedRecommendations,
        lastShownDates: state.lastShownDates,
        lastAnalyzed: state.lastAnalyzed,
        testStats: state.testStats,
      }),
    }
  )
)

// ============ СЕЛЕКТОРЫ ДЛЯ ОПТИМИЗАЦИИ ============

/** Включены ли AI-уведомления */
export const useAIEnabled = () =>
  useAINotificationsStore((state) => state.enabled)

/** Время последнего анализа */
export const useLastAnalyzed = () =>
  useAINotificationsStore((state) => state.lastAnalyzed)

/** Все уведомления */
export const useNotifications = () =>
  useAINotificationsStore((state) => state.notifications)

/** Непрочитанные уведомления (без проверки snoozedUntil - проверяйте в компоненте) */
export const useUnreadNotifications = () =>
  useAINotificationsStore((state) => state.notifications.filter((n) => !n.isRead))

/** Количество непрочитанных (без проверки snoozedUntil - проверяйте в компоненте) */
export const useUnreadCount = () =>
  useAINotificationsStore((state) => state.notifications.filter((n) => !n.isRead).length)

/** Критические непрочитанные (без проверки snoozedUntil - проверяйте в компоненте) */
export const useCriticalUnread = () =>
  useAINotificationsStore((state) =>
    state.notifications.filter((n) => !n.isRead && n.priority === 'critical')
  )

/** Настройки уведомлений */
export const useNotificationSettings = () =>
  useAINotificationsStore((state) => ({
    enabled: state.enabled,
    frequencyMode: state.frequencyMode,
    showInInsights: state.showInInsights,
    showBrowserNotifications: state.showBrowserNotifications,
    showToasts: state.showToasts,
    enableSounds: state.enableSounds,
    enabledTypes: state.enabledTypes,
    quietHours: state.quietHours,
  }))

/** Actions для управления уведомлениями (мемоизированный объект) */
export const useNotificationActions = () => {
  const addNotification = useAINotificationsStore((state) => state.addNotification)
  const markAsRead = useAINotificationsStore((state) => state.markAsRead)
  const markAllAsRead = useAINotificationsStore((state) => state.markAllAsRead)
  const removeNotification = useAINotificationsStore((state) => state.removeNotification)
  const snoozeNotification = useAINotificationsStore((state) => state.snoozeNotification)
  const dismissRecommendation = useAINotificationsStore((state) => state.dismissRecommendation)
  const clearTestNotifications = useAINotificationsStore((state) => state.clearTestNotifications)
  const updateTestStats = useAINotificationsStore((state) => state.updateTestStats)

  // Используем useMemo для стабильной ссылки на объект
  return useMemo(
    () => ({
      addNotification,
      markAsRead,
      markAllAsRead,
      removeNotification,
      snoozeNotification,
      dismissRecommendation,
      clearTestNotifications,
      updateTestStats,
    }),
    [
      addNotification,
      markAsRead,
      markAllAsRead,
      removeNotification,
      snoozeNotification,
      dismissRecommendation,
      clearTestNotifications,
      updateTestStats,
    ]
  )
}

/** Статистика тестового режима */
export const useTestStats = () =>
  useAINotificationsStore((state) => state.testStats)
