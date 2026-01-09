/**
 * 🔔 useBackupReminder - Хук для ненавязчивых напоминаний о бекапе
 * 
 * Показывает toast-уведомление раз в неделю с рекомендацией сделать бекап.
 * Использует localStorage для хранения времени последнего напоминания.
 */

import { useEffect, useCallback } from 'react'
import { useShowInfo } from '../store/useUIStore'
import { useOpenModal } from '../store/useUIStore'

const BACKUP_REMINDER_KEY = 'lastBackupReminder'
const REMINDER_INTERVAL_DAYS = 7

/**
 * Получает timestamp последнего напоминания из localStorage
 */
function getLastReminderTime(): number | null {
  try {
    const stored = localStorage.getItem(BACKUP_REMINDER_KEY)
    if (stored) {
      return parseInt(stored, 10)
    }
  } catch (e) {
    console.warn('Ошибка чтения lastBackupReminder:', e)
  }
  return null
}

/**
 * Сохраняет timestamp последнего напоминания в localStorage
 */
function setLastReminderTime(timestamp: number): void {
  try {
    localStorage.setItem(BACKUP_REMINDER_KEY, timestamp.toString())
  } catch (e) {
    console.warn('Ошибка записи lastBackupReminder:', e)
  }
}

/**
 * Проверяет, прошло ли достаточно времени для показа напоминания
 */
function shouldShowReminder(): boolean {
  const lastReminder = getLastReminderTime()
  if (!lastReminder) {
    // Первый запуск — устанавливаем время и не показываем
    setLastReminderTime(Date.now())
    return false
  }
  
  const daysSinceReminder = (Date.now() - lastReminder) / (1000 * 60 * 60 * 24)
  return daysSinceReminder >= REMINDER_INTERVAL_DAYS
}

/**
 * Хук для показа напоминания о бекапе
 */
export function useBackupReminder() {
  const showInfo = useShowInfo()
  const openModal = useOpenModal()

  const handleBackupClick = useCallback(() => {
    // Открываем модал настроек на вкладку с экспортом
    openModal('soundSettings', { activeTab: 'backup' })
    // Обновляем время напоминания
    setLastReminderTime(Date.now())
  }, [openModal])

  const dismissReminder = useCallback(() => {
    // Просто обновляем время напоминания
    setLastReminderTime(Date.now())
  }, [])

  useEffect(() => {
    // Проверяем с небольшой задержкой (чтобы не мешать начальной загрузке)
    const timer = setTimeout(() => {
      if (shouldShowReminder()) {
        showInfo(
          '💾 Рекомендуем сделать резервную копию данных',
          10000, // 10 секунд
          undefined
        )
        // Обновляем время после показа напоминания
        setLastReminderTime(Date.now())
      }
    }, 5000) // 5 секунд после загрузки

    return () => clearTimeout(timer)
  }, [showInfo])

  return {
    handleBackupClick,
    dismissReminder,
    checkReminder: shouldShowReminder,
  }
}

/**
 * Сброс напоминания (для тестирования)
 */
export function resetBackupReminder(): void {
  try {
    localStorage.removeItem(BACKUP_REMINDER_KEY)
  } catch (e) {
    console.warn('Ошибка удаления lastBackupReminder:', e)
  }
}

/**
 * Установка времени для тестирования (устанавливает время 8 дней назад)
 */
export function setTestReminderTime(): void {
  const eightDaysAgo = Date.now() - (8 * 24 * 60 * 60 * 1000)
  setLastReminderTime(eightDaysAgo)
}
