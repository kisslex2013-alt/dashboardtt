/**
 * 🎯 Хелперы для работы с уведомлениями
 * 
 * Функции для проверки настроек отображения уведомлений
 */

import type { NotificationDisplaySettings, NotificationConditions, NotificationFrequency } from '../types'

// Хранилище для отслеживания частоты показа уведомлений
// Ключ: `${categoryKey}-${type}`, значение: { count: number, lastShown: number, date: string }
const notificationFrequencyTracker = new Map<string, { count: number; lastShown: number; date: string }>()

/**
 * Определяет категорию уведомления по сообщению
 * @param message - текст сообщения
 * @param type - тип уведомления (success, error, warning, info)
 * @returns ключ категории или null
 */
export function getNotificationCategory(
  message: string,
  type: 'success' | 'error' | 'warning' | 'info'
): keyof NotificationDisplaySettings['categories'] | null {
  const lowerMessage = message.toLowerCase()

  // Таймер
  if (
    lowerMessage.includes('таймер') ||
    lowerMessage.includes('pomodoro') ||
    lowerMessage.includes('🍅')
  ) {
    return 'timer'
  }

  // Записи
  if (
    lowerMessage.includes('запись') ||
    lowerMessage.includes('записей') ||
    lowerMessage.includes('добавлена') ||
    lowerMessage.includes('обновлена') ||
    lowerMessage.includes('удалена')
  ) {
    return 'entries'
  }

  // Категории
  if (
    lowerMessage.includes('категори') ||
    lowerMessage.includes('категория')
  ) {
    return 'categories'
  }

  // Экспорт/Импорт
  if (
    lowerMessage.includes('экспорт') ||
    lowerMessage.includes('импорт') ||
    lowerMessage.includes('экспортировано') ||
    lowerMessage.includes('импортировано')
  ) {
    return 'exportImport'
  }

  // Бэкапы
  if (
    lowerMessage.includes('резервная копия') ||
    lowerMessage.includes('бэкап') ||
    lowerMessage.includes('восстановлен') ||
    lowerMessage.includes('backup')
  ) {
    return 'backups'
  }

  // Настройки
  if (
    lowerMessage.includes('настройки сохранены') ||
    lowerMessage.includes('рабочий график сохранен') ||
    lowerMessage.includes('выплата сохранена') ||
    lowerMessage.includes('выплата удалена')
  ) {
    return 'settings'
  }

  // Фильтры
  if (
    lowerMessage.includes('фильтр') ||
    lowerMessage.includes('по умолчанию')
  ) {
    return 'filters'
  }

  // Действия
  if (
    lowerMessage.includes('действие отменено') ||
    lowerMessage.includes('действие повторено') ||
    lowerMessage.includes('режим сравнения')
  ) {
    return 'actions'
  }

  // Очистка
  if (
    lowerMessage.includes('очистка') ||
    lowerMessage.includes('очищена') ||
    lowerMessage.includes('удалено') && lowerMessage.includes('записей')
  ) {
    return 'cleanup'
  }

  // Цвета
  if (
    lowerMessage.includes('цвет') ||
    lowerMessage.includes('🎨')
  ) {
    return 'colors'
  }

  // Валидация
  if (
    type === 'error' && (
      lowerMessage.includes('ошибка') ||
      lowerMessage.includes('валидация') ||
      lowerMessage.includes('некорректн')
    )
  ) {
    return 'validation'
  }

  // Переработка
  if (
    lowerMessage.includes('переработк') ||
    lowerMessage.includes('превышен')
  ) {
    return 'overtime'
  }

  // Перерывы
  if (
    lowerMessage.includes('перерыв') ||
    lowerMessage.includes('отдохни')
  ) {
    return 'breaks'
  }

  // Автосинхронизация
  if (
    lowerMessage.includes('синхронизац') ||
    lowerMessage.includes('sync')
  ) {
    return 'autoSync'
  }

  return null
}

/**
 * Проверяет условия показа уведомления
 * @param message - текст сообщения
 * @param type - тип уведомления
 * @param category - категория уведомления
 * @param conditions - условия показа
 * @param context - дополнительный контекст (длительность, значение и т.д.)
 * @returns true, если условия выполнены
 */
function checkConditions(
  message: string,
  type: 'success' | 'error' | 'warning' | 'info',
  category: keyof NotificationDisplaySettings['categories'],
  conditions?: NotificationConditions,
  context?: { duration?: number; value?: number; isWorkDay?: boolean; isActiveWork?: boolean }
): boolean {
  if (!conditions) return true

  // Проверка минимальной длительности
  if (conditions.minDurationMinutes !== undefined && context?.duration !== undefined) {
    if (context.duration < conditions.minDurationMinutes) {
      return false
    }
  }

  // Проверка минимального значения
  if (conditions.minValue !== undefined && context?.value !== undefined) {
    if (context.value < conditions.minValue) {
      return false
    }
  }

  // Проверка только рабочих дней
  if (conditions.onlyWorkDays && context?.isWorkDay === false) {
    return false
  }

  // Проверка только активной работы
  if (conditions.onlyActiveWork && context?.isActiveWork === false) {
    return false
  }

  // Проверка условий для entries
  if (category === 'entries') {
    if (type === 'success' && conditions.showOnSuccess === false) return false
    if (type === 'error' && conditions.showOnError === false) return false
    if (message.includes('обновлен') && conditions.showOnUpdate === false) return false
    if (message.includes('удален') && conditions.showOnDelete === false) return false
  }

  // Проверка условий для timer
  if (category === 'timer') {
    if (message.includes('запущен') && conditions.showOnStart === false) return false
    if (message.includes('остановлен') && conditions.showOnStop === false) return false
    if (message.includes('пауза') && conditions.showOnPause === false) return false
  }

  return true
}

/**
 * Проверяет частоту показа уведомления
 * @param category - категория уведомления
 * @param type - тип уведомления
 * @param frequency - настройки частоты
 * @returns true, если можно показывать уведомление
 */
function checkFrequency(
  category: keyof NotificationDisplaySettings['categories'],
  type: 'success' | 'error' | 'warning' | 'info',
  frequency?: NotificationFrequency
): boolean {
  if (!frequency) return true

  const today = new Date().toISOString().split('T')[0]
  const key = `${category}-${type}`
  const tracker = notificationFrequencyTracker.get(key)

  // Проверка "показывать только один раз в день"
  if (frequency.showOncePerDay) {
    if (tracker && tracker.date === today && tracker.count > 0) {
      return false
    }
  }

  // Проверка максимума в день
  if (frequency.maxPerDay !== undefined) {
    if (tracker && tracker.date === today && tracker.count >= frequency.maxPerDay) {
      return false
    }
  }

  // Проверка минимального интервала
  if (frequency.minInterval !== undefined) {
    const now = Date.now()
    if (tracker && tracker.date === today) {
      const timeSinceLastShown = (now - tracker.lastShown) / 1000 / 60 // в минутах
      if (timeSinceLastShown < frequency.minInterval) {
        return false
      }
    }
  }

  // Обновляем трекер
  const newTracker = {
    count: (tracker?.date === today ? tracker.count : 0) + 1,
    lastShown: Date.now(),
    date: today,
  }
  notificationFrequencyTracker.set(key, newTracker)

  // Очищаем старые записи (старше 7 дней)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  for (const [k, v] of notificationFrequencyTracker.entries()) {
    if (v.date < sevenDaysAgo.toISOString().split('T')[0]) {
      notificationFrequencyTracker.delete(k)
    }
  }

  return true
}

/**
 * Проверяет, нужно ли показывать уведомление на основе настроек
 * @param message - текст сообщения
 * @param type - тип уведомления
 * @param displaySettings - настройки отображения
 * @param context - дополнительный контекст для проверки условий
 * @returns true, если нужно показывать уведомление
 */
export function shouldShowNotification(
  message: string,
  type: 'success' | 'error' | 'warning' | 'info',
  displaySettings?: NotificationDisplaySettings,
  context?: { duration?: number; value?: number; isWorkDay?: boolean; isActiveWork?: boolean }
): boolean {
  // Если настройки не заданы, показываем все уведомления
  if (!displaySettings) {
    return true
  }

  // Если общее отключение, не показываем (кроме критичных)
  if (!displaySettings.enabled) {
    // Критичные уведомления (ошибки валидации) всегда показываем
    const category = getNotificationCategory(message, type)
    if (category === 'validation' && type === 'error') {
      return true
    }
    return false
  }

  // Определяем категорию
  const category = getNotificationCategory(message, type)
  if (!category) {
    // Если категория не определена, показываем по умолчанию
    return true
  }

  // Проверяем настройки категории
  const categorySettings = displaySettings.categories[category]
  if (!categorySettings) {
    return true
  }

  // Если категория отключена, не показываем (кроме критичных)
  if (!categorySettings.enabled) {
    if (category === 'validation' && type === 'error') {
      return true
    }
    return false
  }

  // Проверяем настройки типа
  if (!(categorySettings.types[type] ?? true)) {
    return false
  }

  // Проверяем условия
  if (!checkConditions(message, type, category, categorySettings.conditions, context)) {
    return false
  }

  // Проверяем частоту
  if (!checkFrequency(category, type, categorySettings.frequency)) {
    return false
  }

  return true
}

