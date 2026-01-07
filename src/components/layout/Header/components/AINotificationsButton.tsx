/**
 * 🤖 Кнопка AI-уведомлений в Header
 *
 * Отображает:
 * - Иконку AI (BotMessageSquare)
 * - Бейдж с количеством непрочитанных
 * - Разные анимации в зависимости от приоритета
 * - Dropdown панель при клике
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import { BotMessageSquare } from '../../../../utils/icons'
import { useAINotificationsStore } from '../../../../store/useAINotificationsStore'
import { useIsMobile } from '../../../../hooks/useIsMobile'
import { AINotificationsPanel } from '../../../notifications/AINotificationsPanel'

export function AINotificationsButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [panelPosition, setPanelPosition] = useState({ top: 0, right: 0 })
  const isMobile = useIsMobile()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // Получаем notifications из store (stable reference)
  const notifications = useAINotificationsStore((state) => state.notifications)

  // Мемоизируем вычисления
  // Проверяем snoozedUntil здесь, чтобы избежать бесконечных циклов
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

  // Вычисление позиции панели
  const calculatePanelPosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setPanelPosition({
        top: rect.bottom + 8, // 8px от кнопки
        right: window.innerWidth - rect.right,
      })
    }
  }, [])

  // Обновление позиции при открытии и изменении размера окна
  useEffect(() => {
    if (isOpen) {
      calculatePanelPosition()
      window.addEventListener('resize', calculatePanelPosition)
      window.addEventListener('scroll', calculatePanelPosition, true)
    }
    return () => {
      window.removeEventListener('resize', calculatePanelPosition)
      window.removeEventListener('scroll', calculatePanelPosition, true)
    }
  }, [isOpen, calculatePanelPosition])

  // Закрытие панели при клике вне
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        buttonRef.current &&
        panelRef.current &&
        !buttonRef.current.contains(event.target as Node) &&
        !panelRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Keyboard shortcut: Alt + N
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey && event.key === 'n') {
        event.preventDefault()
        setIsOpen((prev) => !prev)
      }
    }

    // Слушатель для открытия панели из мобильного меню
    const handleToggleFromMobile = () => {
      setIsOpen(true)
    }

    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('toggleAINotifications', handleToggleFromMobile)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('toggleAINotifications', handleToggleFromMobile)
    }
  }, [])

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

  // Классы для подсветки кнопки
  const getButtonGlow = () => {
    if (unreadCount === 0) return ''
    if (hasCritical) {
      return 'ring-2 ring-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
    }
    return 'ring-2 ring-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
  }

  return (
    <div className="relative">
      {/* Кнопка */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-lg transition-all hover-lift-scale click-shrink relative ${
          unreadCount > 0 
            ? hasCritical 
              ? 'bg-red-500/10 ring-2 ring-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]' 
              : 'bg-blue-500/10 ring-2 ring-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]'
            : 'glass-button'
        }`}
        aria-label={`AI-уведомления${unreadCount > 0 ? ` (${unreadCount} новых)` : ''}`}
        title={`AI-уведомления${unreadCount > 0 ? ` (${unreadCount} новых)` : ''} (Alt+N)`}
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

      {/* Dropdown панель */}
      <AnimatePresence>
        {isOpen && (
          <AINotificationsPanel
            ref={panelRef}
            onClose={() => setIsOpen(false)}
            position={panelPosition}
            isMobile={isMobile}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
