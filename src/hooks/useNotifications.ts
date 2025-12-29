/**
 * 🔔 Хук для работы с уведомлениями (toast сообщениями)
 */

import {
  useNotifications as useUIStoreNotifications,
  useAddNotification,
  useRemoveNotification
} from '../store/useUIStore'
import { logger } from '../utils/logger'

type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'confirm' | 'progress'

interface Notification {
  id: number
  message: string
  type: NotificationType
  duration: number
  timestamp: string
  progress?: number
  onConfirm?: () => void
  onCancel?: () => void
}

interface UseNotificationsReturn {
  showNotification: (message: string, type?: NotificationType, duration?: number) => number
  showSuccess: (message: string, duration?: number) => number
  showError: (message: string, duration?: number) => number
  showWarning: (message: string, duration?: number) => number
  showInfo: (message: string, duration?: number) => number
  hideNotification: (id: number) => void
  clearAll: () => void
  clearByType: (type: NotificationType) => void
  getCount: () => number
  getCountByType: (type: NotificationType) => number
  hasType: (type: NotificationType) => boolean
  getAll: () => Notification[]
  getByType: (type: NotificationType) => Notification[]
  showConfirm: (message: string, onConfirm: () => void, onCancel?: () => void) => number
  showProgress: (message: string, progress?: number) => number
  updateProgress: (id: number, progress: number) => void
  showLoading: (message?: string) => number
  finishLoading: (id: number, successMessage?: string) => void
  notifications: Notification[]
}

export function useNotifications(): UseNotificationsReturn {
  const notifications = useUIStoreNotifications() as Notification[]
  const addNotification = useAddNotification()
  const removeNotification = useRemoveNotification()

  const showNotification = (message: string, type: NotificationType = 'info', duration: number = 3000): number => {
    const notification: Notification = {
      id: Date.now() + Math.random(),
      message,
      type,
      duration,
      timestamp: new Date().toISOString(),
    }

    addNotification(notification)

    if (duration > 0) {
      setTimeout(() => {
        removeNotification(notification.id)
      }, duration)
    }

    logger.log(`🔔 Уведомление [${type}]: ${message}`)
    return notification.id
  }

  const showSuccess = (message: string, duration: number = 3000): number => {
    return showNotification(message, 'success', duration)
  }

  const showError = (message: string, duration: number = 5000): number => {
    return showNotification(message, 'error', duration)
  }

  const showWarning = (message: string, duration: number = 4000): number => {
    return showNotification(message, 'warning', duration)
  }

  const showInfo = (message: string, duration: number = 3000): number => {
    return showNotification(message, 'info', duration)
  }

  const hideNotification = (id: number): void => {
    removeNotification(id)
    logger.log(`🔕 Уведомление ${id} скрыто`)
  }

  const clearAll = (): void => {
    notifications.forEach(notification => {
      removeNotification(notification.id)
    })
    logger.log('🔕 Все уведомления очищены')
  }

  const clearByType = (type: NotificationType): void => {
    notifications
      .filter(notification => notification.type === type)
      .forEach(notification => {
        removeNotification(notification.id)
      })
    logger.log(`🔕 Уведомления типа ${type} очищены`)
  }

  const getCount = (): number => notifications.length

  const getCountByType = (type: NotificationType): number => {
    return notifications.filter(notification => notification.type === type).length
  }

  const hasType = (type: NotificationType): boolean => {
    return notifications.some(notification => notification.type === type)
  }

  const getAll = (): Notification[] => [...notifications]

  const getByType = (type: NotificationType): Notification[] => {
    return notifications.filter(notification => notification.type === type)
  }

  const showConfirm = (message: string, onConfirm: () => void, onCancel?: () => void): number => {
    const notification: Notification = {
      id: Date.now() + Math.random(),
      message,
      type: 'confirm',
      duration: 0,
      timestamp: new Date().toISOString(),
      onConfirm,
      onCancel,
    }

    addNotification(notification)
    logger.log(`❓ Уведомление с подтверждением: ${message}`)
    return notification.id
  }

  const showProgress = (message: string, progress: number = 0): number => {
    const notification: Notification = {
      id: Date.now() + Math.random(),
      message,
      type: 'progress',
      duration: 0,
      timestamp: new Date().toISOString(),
      progress: Math.max(0, Math.min(100, progress)),
    }

    addNotification(notification)
    logger.log(`📊 Прогресс [${progress}%]: ${message}`)
    return notification.id
  }

  const updateProgress = (id: number, progress: number): void => {
    const idString = String(id)
    const notification = notifications.find(n => String(n.id) === idString)
    if (notification && notification.type === 'progress') {
      notification.progress = Math.max(0, Math.min(100, progress))
      logger.log(`📊 Прогресс обновлен [${progress}%]: ${notification.message}`)
    }
  }

  const showLoading = (message: string = 'Загрузка...'): number => {
    return showProgress(message, 0)
  }

  const finishLoading = (id: number, successMessage: string = 'Загрузка завершена'): void => {
    updateProgress(id, 100)
    setTimeout(() => {
      hideNotification(id)
      showSuccess(successMessage)
    }, 500)
  }

  return {
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    hideNotification,
    clearAll,
    clearByType,
    getCount,
    getCountByType,
    hasType,
    getAll,
    getByType,
    showConfirm,
    showProgress,
    updateProgress,
    showLoading,
    finishLoading,
    notifications,
  }
}
