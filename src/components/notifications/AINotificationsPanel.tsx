/**
 * 📋 Dropdown панель AI-уведомлений
 *
 * Отображает:
 * - Список непрочитанных уведомлений
 * - Кнопки "История" и "Настройки"
 * - Группировку по приоритету
 * - Кнопку "Отметить всё как прочитанное"
 */

import { useState, useMemo, forwardRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { History, CheckCircle, Settings } from '../../utils/icons'
import { useNotificationActions, useAINotificationsStore } from '../../store/useAINotificationsStore'
import { useOpenModal } from '../../store/useUIStore'
import { NotificationItem } from './NotificationItem'
import { NotificationDetailModal } from './NotificationDetailModal'
import { NotificationHistoryModal } from './NotificationHistoryModal'
import { EmptyState } from '../ui/EmptyState'

interface AINotificationsPanelProps {
  onClose: () => void
  position: { top: number; right: number }
  isMobile: boolean
}

export const AINotificationsPanel = forwardRef<HTMLDivElement, AINotificationsPanelProps>(
  ({ onClose, position, isMobile }, ref) => {
    const allNotifications = useAINotificationsStore((state) => state.notifications)
    const { markAllAsRead } = useNotificationActions()
    const openModal = useOpenModal()
    const [selectedNotificationId, setSelectedNotificationId] = useState<string | null>(null)
    const [showHistory, setShowHistory] = useState(false)

  // Мемоизируем вычисления непрочитанных и группировку
  // Проверяем snoozedUntil здесь, чтобы избежать бесконечных циклов
  const { unreadNotifications, groupedNotifications } = useMemo(() => {
    const now = new Date().toISOString()
    // Фильтруем непрочитанные и не отложенные
    const unread = allNotifications.filter(
      (n) => !n.isRead && (!n.snoozedUntil || n.snoozedUntil <= now)
    )

    return {
      unreadNotifications: unread,
      groupedNotifications: {
        critical: unread.filter((n) => n.priority === 'critical'),
        high: unread.filter((n) => n.priority === 'high'),
        normal: unread.filter((n) => n.priority === 'normal'),
      },
    }
  }, [allNotifications])

  const handleNotificationClick = (id: string) => {
    setSelectedNotificationId(id)
  }

  const handleMarkAllAsRead = () => {
    markAllAsRead()
  }

  const handleOpenHistory = () => {
    setShowHistory(true)
  }

  const handleOpenSettings = () => {
    openModal('soundSettings', { activeTab: 'ai' })
    onClose() // Закрываем панель уведомлений
  }

  // Найти выбранное уведомление
  const selectedNotification = selectedNotificationId
    ? allNotifications.find((n) => n.id === selectedNotificationId) || null
    : null

    const panelContent = (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className={`
          fixed z-[999999] flex flex-col
          glass-effect rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700
          ${isMobile ? 'w-[calc(100vw-1rem)] left-4 right-4' : 'w-96'}
        `}
        style={{
          top: `${position.top}px`,
          right: `${position.right}px`,
          maxHeight: isMobile ? 'calc(100vh - 100px)' : '500px',
        }}
      >
      {/* Header - фиксированный */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            AI-уведомления
          </h3>
          {unreadNotifications.length > 0 && (
            <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
              {unreadNotifications.length} новых
            </span>
          )}
        </div>

        {/* Кнопки История и Настройки */}
        <div className="flex gap-2">
          <button
            onClick={handleOpenHistory}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            <History className="w-4 h-4" />
            История
          </button>
          <button
            onClick={handleOpenSettings}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4" />
            Настройки
          </button>
        </div>
      </div>

      {/* Список уведомлений - скроллящийся */}
      <div className="flex-1 overflow-y-auto p-4 min-h-0">
        {unreadNotifications.length === 0 ? (
          <EmptyState
            title="Нет новых уведомлений"
            description="AI следит за вашей продуктивностью и сообщит, если обнаружит важные паттерны"
            variant="compact"
          />
        ) : (
          <div className="space-y-4">
            {/* Критические */}
            {groupedNotifications.critical.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-red-600 dark:text-red-400 mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  КРИТИЧЕСКИЕ ({groupedNotifications.critical.length})
                </h4>
                <AnimatePresence mode="popLayout">
                  {groupedNotifications.critical.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <NotificationItem
                        notification={notification}
                        onClick={() => handleNotificationClick(notification.id)}
                        compact
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Важные */}
            {groupedNotifications.high.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-yellow-600 dark:text-yellow-400 mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                  ВАЖНЫЕ ({groupedNotifications.high.length})
                </h4>
                <AnimatePresence mode="popLayout">
                  {groupedNotifications.high.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <NotificationItem
                        notification={notification}
                        onClick={() => handleNotificationClick(notification.id)}
                        compact
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Обычные */}
            {groupedNotifications.normal.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  ОБЫЧНЫЕ ({groupedNotifications.normal.length})
                </h4>
                <AnimatePresence mode="popLayout">
                  {groupedNotifications.normal.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <NotificationItem
                        notification={notification}
                        onClick={() => handleNotificationClick(notification.id)}
                        compact
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}
      </div>

        {/* Footer with Mark All button - фиксированный */}
        {unreadNotifications.length > 0 && (
          <div className="flex-shrink-0 p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <button
              onClick={handleMarkAllAsRead}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg transition-all text-sm font-medium shadow-lg shadow-blue-500/25"
            >
              <CheckCircle className="w-4 h-4" />
              Прочитано всё
            </button>
          </div>
        )}

      {/* Модалки - рендерим только когда открыты, чтобы не подписываться на store */}
      {selectedNotification && (
        <NotificationDetailModal
          isOpen={true}
          onClose={() => setSelectedNotificationId(null)}
          notification={selectedNotification}
        />
      )}

      {showHistory && (
        <NotificationHistoryModal
          isOpen={true}
          onClose={() => setShowHistory(false)}
          onNotificationClick={handleNotificationClick}
        />
      )}
      </motion.div>
    )

    return createPortal(panelContent, document.body)
  }
)

AINotificationsPanel.displayName = 'AINotificationsPanel'
