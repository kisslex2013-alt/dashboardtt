/**
 * 📜 Модалка истории AI-уведомлений
 *
 * Показывает:
 * - Все уведомления (прочитанные и непрочитанные)
 * - Фильтры по типу, приоритету, статусу
 * - Поиск по тексту
 * - Сортировка по дате
 * - Очистка тестовых уведомлений
 */

import { useState, useMemo } from 'react'
import { BaseModal } from '../ui/BaseModal'
import { History, Search, Filter, Trash2 } from '../../utils/icons'
import { useAINotificationsStore, useNotificationActions, useTestStats } from '../../store/useAINotificationsStore'
import { NotificationItem } from './NotificationItem'
import { EmptyState } from '../ui/EmptyState'
import type { NotificationType, NotificationPriority } from '../../types/aiNotifications'

interface NotificationHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  onNotificationClick?: (id: string) => void
}

export function NotificationHistoryModal({
  isOpen,
  onClose,
  onNotificationClick,
}: NotificationHistoryModalProps) {
  const allNotifications = useAINotificationsStore((state) => state.notifications)
  const { clearTestNotifications } = useNotificationActions()
  const testStats = useTestStats()

  // Фильтры
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<NotificationType | 'all'>('all')
  const [filterPriority, setFilterPriority] = useState<NotificationPriority | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'read' | 'unread'>('all')
  const [showTestOnly, setShowTestOnly] = useState(false)

  // Применение фильтров
  const filteredNotifications = useMemo(() => {
    let filtered = [...allNotifications]

    // Поиск по тексту
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (n) =>
          n.title.toLowerCase().includes(query) ||
          n.preview.toLowerCase().includes(query)
      )
    }

    // Фильтр по типу
    if (filterType !== 'all') {
      filtered = filtered.filter((n) => n.type === filterType)
    }

    // Фильтр по приоритету
    if (filterPriority !== 'all') {
      filtered = filtered.filter((n) => n.priority === filterPriority)
    }

    // Фильтр по статусу
    if (filterStatus !== 'all') {
      filtered = filtered.filter((n) =>
        filterStatus === 'read' ? n.isRead : !n.isRead
      )
    }

    // Показывать только тестовые
    if (showTestOnly) {
      filtered = filtered.filter((n) => n.isTest)
    }

    // Сортировка по дате (новые сверху)
    filtered.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    return filtered
  }, [
    allNotifications,
    searchQuery,
    filterType,
    filterPriority,
    filterStatus,
    showTestOnly,
  ])

  const handleClearTests = () => {
    if (
      confirm(
        `Удалить все тестовые уведомления (${testStats.currentCount} шт.)?`
      )
    ) {
      clearTestNotifications()
    }
  }

  const handleResetFilters = () => {
    setSearchQuery('')
    setFilterType('all')
    setFilterPriority('all')
    setFilterStatus('all')
    setShowTestOnly(false)
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="История уведомлений"
      closeOnOverlayClick={false}
      titleIcon={History}
      size="full"
    >
      <div className="space-y-4">
        {/* Поиск */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по заголовку или тексту..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Фильтры */}
        <div className="flex flex-wrap gap-3">
          {/* Тип */}
          <select
            value={filterType}
            onChange={(e) =>
              setFilterType(e.target.value as NotificationType | 'all')
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
          >
            <option value="all">Все типы</option>
            <option value="burnout-warning">🔥 Выгорание</option>
            <option value="goal-risk">⚠️ Риск цели</option>
            <option value="monthly-forecast">📊 Прогноз</option>
            <option value="productivity-pattern">💡 Паттерн</option>
            <option value="inefficient-category">⏱️ Неэффективность</option>
            <option value="achievement">🏆 Достижение</option>
            <option value="weekly-insight">💡 Инсайт</option>
            <option value="anomaly">🔍 Аномалия</option>
          </select>

          {/* Приоритет */}
          <select
            value={filterPriority}
            onChange={(e) =>
              setFilterPriority(e.target.value as NotificationPriority | 'all')
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
          >
            <option value="all">Все приоритеты</option>
            <option value="critical">🔴 Критический</option>
            <option value="high">🟡 Высокий</option>
            <option value="normal">🔵 Обычный</option>
          </select>

          {/* Статус */}
          <select
            value={filterStatus}
            onChange={(e) =>
              setFilterStatus(e.target.value as 'all' | 'read' | 'unread')
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
          >
            <option value="all">Все статусы</option>
            <option value="unread">📩 Непрочитанные</option>
            <option value="read">✅ Прочитанные</option>
          </select>

          {/* Тестовые */}
          <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm">
            <input
              type="checkbox"
              checked={showTestOnly}
              onChange={(e) => setShowTestOnly(e.target.checked)}
              className="w-4 h-4"
            />
            <span>Только тестовые</span>
          </label>

          {/* Сброс фильтров */}
          <button
            onClick={handleResetFilters}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Сбросить фильтры"
          >
            <Filter className="w-4 h-4" />
          </button>

          {/* Очистка тестовых */}
          {testStats.currentCount > 0 && (
            <button
              onClick={handleClearTests}
              className="ml-auto px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Очистить тестовые ({testStats.currentCount})
            </button>
          )}
        </div>

        {/* Статистика */}
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>
            Найдено: {filteredNotifications.length} из {allNotifications.length}
          </span>
          {testStats.totalCreated > 0 && (
            <span className="text-purple-600 dark:text-purple-400">
              Создано тестовых: {testStats.totalCreated}
            </span>
          )}
        </div>

        {/* Список уведомлений */}
        <div
          className="space-y-2 overflow-y-auto"
          style={{ maxHeight: '60vh' }}
        >
          {filteredNotifications.length === 0 ? (
            <EmptyState
              title="Уведомлений не найдено"
              description={
                allNotifications.length === 0
                  ? 'AI ещё не создавал уведомлений'
                  : 'Попробуйте изменить фильтры'
              }
              variant="compact"
            />
          ) : (
            filteredNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClick={() => onNotificationClick?.(notification.id)}
              />
            ))
          )}
        </div>
      </div>
    </BaseModal>
  )
}
