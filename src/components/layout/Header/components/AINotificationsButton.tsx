/**
 * 🤖 Кнопка AI-уведомлений в Header
 *
 * Отображает:
 * - Иконку AI (BotMessageSquare)
 * - Бейдж с количеством непрочитанных
 * - Разные анимации в зависимости от приоритета
 * - Открывает модал (унифицированный интерфейс)
 */

import { useEffect, useRef, useMemo } from 'react'
import { BotMessageSquare } from '../../../../utils/icons'
import { useAINotificationsStore } from '../../../../store/useAINotificationsStore'
import { useOpenModal } from '../../../../store/useUIStore'
import { useIsMobile } from '../../../../hooks/useIsMobile'

export function AINotificationsButton() {
  const isMobile = useIsMobile()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const openModal = useOpenModal()

  // Получаем notifications из store (stable reference)
  const notifications = useAINotificationsStore((state) => state.notifications)

  // Мемоизируем вычисления
  const { unreadCount, hasCritical } = useMemo(() => {
    const now = new Date().toISOString()
    // Фильтруем только непрочитанные и не отложенные
    const unread = notifications.filter(
      (n) => !n.isRead && (!n.snoozedUntil || n.snoozedUntil <= now)
    )
    return {
      unreadCount: unread.length,
      hasCritical: unread.some((n) => n.priority === 'critical'),
    }
  }, [notifications])

  // Открытие модала
  const handleClick = () => {
    openModal('aiNotifications')
  }

  // Keyboard shortcut: Alt + N
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey && event.key === 'n') {
        event.preventDefault()
        openModal('aiNotifications')
      }
    }

    // Слушатель для открытия панели из мобильного меню
    const handleToggleFromMobile = () => {
      openModal('aiNotifications')
    }

    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('toggleAINotifications', handleToggleFromMobile)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('toggleAINotifications', handleToggleFromMobile)
    }
  }, [openModal])

  // Классы для анимации иконки
  const getIconClasses = () => {
    if (unreadCount === 0) {
      // Нет уведомлений - обычная иконка
      return 'text-gray-400 dark:text-gray-500'
    }

    if (hasCritical) {
      // Критические - красная с bounce
      return 'text-red-500 dark:text-red-400 animate-bounce'
    }

    // Обычные непрочитанные - синяя с pulse
    return 'text-blue-500 dark:text-blue-400 animate-pulse'
  }

  // Классы для бейджа
  const getBadgeClasses = () => {
    if (hasCritical) {
      return 'bg-red-500 dark:bg-red-600 animate-pulse'
    }
    return 'bg-blue-500 dark:bg-blue-600'
  }

  return (
    <div className="relative">
      {/* Кнопка */}
      <button
        ref={buttonRef}
        onClick={handleClick}
        className={`p-2 rounded-lg transition-all hover-lift-scale click-shrink relative ${
          unreadCount > 0 
            ? hasCritical 
              ? 'bg-red-500/10 ring-2 ring-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]' 
              : 'bg-blue-500/10 ring-2 ring-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]'
            : 'glass-button'
        }`}
        aria-label={`AI-уведомления${unreadCount > 0 ? ` (${unreadCount} новых)` : ''}`}
        title={`AI-уведомления${unreadCount > 0 ? ` (${unreadCount} новых)` : ''} (Alt+N)`}
        data-tour="ai-notifications"
        style={{
          minWidth: isMobile ? '44px' : 'auto',
          minHeight: isMobile ? '44px' : 'auto',
        }}
        data-icon-id="header-ai-notifications"
      >
        <BotMessageSquare className={`w-5 h-5 transition-colors ${getIconClasses()}`} />

        {/* Бейдж с количеством */}
        {unreadCount > 0 && (
          <span
            className={`absolute -top-1 -right-1 ${getBadgeClasses()} text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 shadow-lg`}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
    </div>
  )
}
