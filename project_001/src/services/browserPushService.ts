/**
 * 🔔 Сервис Browser Push Notifications
 *
 * Отвечает за:
 * - Проверку поддержки браузером
 * - Запрос разрешений
 * - Отправку push-уведомлений
 * - Показ нативных уведомлений браузера
 */

import type { AINotification } from '../types/aiNotifications'

export class BrowserPushService {
  /**
   * Проверка поддержки браузером
   */
  static isSupported(): boolean {
    return 'Notification' in window
  }

  /**
   * Получить текущий статус разрешений
   */
  static getPermission(): NotificationPermission {
    if (!this.isSupported()) {
      return 'denied'
    }
    return Notification.permission
  }

  /**
   * Запросить разрешение на отправку уведомлений
   */
  static async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      console.warn('Browser Push Notifications не поддерживаются браузером')
      return 'denied'
    }

    if (Notification.permission === 'granted') {
      return 'granted'
    }

    if (Notification.permission === 'denied') {
      console.warn('Разрешение на уведомления было отклонено пользователем')
      return 'denied'
    }

    try {
      const permission = await Notification.requestPermission()
      return permission
    } catch (error) {
      console.error('Ошибка при запросе разрешения на уведомления:', error)
      return 'denied'
    }
  }

  /**
   * Отправить браузерное push-уведомление
   */
  static async sendNotification(notification: AINotification): Promise<boolean> {
    // Проверка поддержки
    if (!this.isSupported()) {
      console.warn('Browser Push Notifications не поддерживаются')
      return false
    }

    // Проверка разрешений
    const permission = this.getPermission()
    if (permission !== 'granted') {
      console.warn('Нет разрешения на отправку уведомлений')
      return false
    }

    try {
      // Подготовка данных для уведомления
      const title = this.formatTitle(notification)
      const options: NotificationOptions = {
        body: notification.preview,
        icon: this.getIconUrl(notification),
        badge: '/favicon.ico',
        tag: notification.id,
        requireInteraction: notification.priority === 'critical',
        silent: false,
        timestamp: new Date(notification.createdAt).getTime(),
        data: {
          id: notification.id,
          type: notification.type,
          priority: notification.priority,
        },
      }

      // Создание уведомления
      const browserNotification = new Notification(title, options)

      // Обработчик клика по уведомлению
      browserNotification.onclick = () => {
        window.focus()
        browserNotification.close()

        // Можно добавить навигацию к конкретному уведомлению
        // Например, открыть модалку деталей
        const event = new CustomEvent('notification-clicked', {
          detail: { notificationId: notification.id },
        })
        window.dispatchEvent(event)
      }

      // Автозакрытие для обычных уведомлений через 10 секунд
      if (notification.priority !== 'critical') {
        setTimeout(() => {
          browserNotification.close()
        }, 10000)
      }

      return true
    } catch (error) {
      console.error('Ошибка при отправке Browser Push уведомления:', error)
      return false
    }
  }

  /**
   * Форматирование заголовка с префиксом по приоритету
   */
  private static formatTitle(notification: AINotification): string {
    const prefix = this.getPriorityPrefix(notification.priority)
    return `${prefix} ${notification.title}`
  }

  /**
   * Получить префикс для приоритета
   */
  private static getPriorityPrefix(priority: string): string {
    switch (priority) {
      case 'critical':
        return '🔥'
      case 'high':
        return '⚠️'
      default:
        return '💡'
    }
  }

  /**
   * Получить URL иконки для уведомления
   * В реальном приложении можно использовать разные иконки для разных типов
   */
  private static getIconUrl(notification: AINotification): string {
    // Пока используем favicon
    // Можно добавить разные иконки в /public/icons/
    return '/favicon.ico'
  }

  /**
   * Проверка, нужно ли показывать браузерное уведомление
   */
  static shouldShowPush(
    notification: AINotification,
    settings: {
      enabled: boolean
      showBrowserNotifications: boolean
    }
  ): boolean {
    // Должны быть включены уведомления в настройках
    if (!settings.enabled || !settings.showBrowserNotifications) {
      return false
    }

    // Browser Push только для критических уведомлений
    if (notification.priority !== 'critical') {
      return false
    }

    // Проверка поддержки и разрешений
    if (!this.isSupported() || this.getPermission() !== 'granted') {
      return false
    }

    return true
  }

  /**
   * Закрыть все уведомления приложения
   */
  static async closeAll(): Promise<void> {
    if (!this.isSupported()) {
      return
    }

    // Service Worker API для получения активных уведомлений
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      try {
        const registration = await navigator.serviceWorker.ready
        const notifications = await registration.getNotifications()
        notifications.forEach((notification) => notification.close())
      } catch (error) {
        console.error('Ошибка при закрытии уведомлений:', error)
      }
    }
  }
}
