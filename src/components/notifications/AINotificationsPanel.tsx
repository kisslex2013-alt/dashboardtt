/**
 * 📋 Dropdown панель AI-уведомлений (Split-View)
 *
 * Desktop: Двухколоночный интерфейс (Список | Детали)
 * Mobile: Адаптивный список с модальными окнами
 */

import { useState, useMemo, forwardRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { History, CheckCircle, Settings, Bell, Filter, Search } from '../../utils/icons'
import { useNotificationActions, useAINotificationsStore } from '../../store/useAINotificationsStore'
import { useOpenModal } from '../../store/useUIStore'
import { NotificationItem } from './NotificationItem'
import { NotificationDetailModal } from './NotificationDetailModal'
import { NotificationHistoryModal } from './NotificationHistoryModal'
import { NotificationDetailInline } from './NotificationDetailInline'
import { EmptyState } from '../ui/EmptyState'
import type { NotificationType, NotificationPriority } from '../../types/aiNotifications'

interface AINotificationsPanelProps {
  onClose: () => void
  position: { top: number; right: number }
  isMobile: boolean
}

type TabType = 'unread' | 'history'

export const AINotificationsPanel = forwardRef<HTMLDivElement, AINotificationsPanelProps>(
  ({ onClose, position, isMobile }, ref) => {
    const allNotifications = useAINotificationsStore((state) => state.notifications)
    const { markAllAsRead, markAsRead } = useNotificationActions()
    const openModal = useOpenModal()
    
    // Состояния
    const [activeTab, setActiveTab] = useState<TabType>('unread')
    const [selectedNotificationId, setSelectedNotificationId] = useState<string | null>(null)
    const [showHistoryModal, setShowHistoryModal] = useState(false) // Для мобильных
    
    // Фильтры истории
    const [searchQuery, setSearchQuery] = useState('')
    const [filterPriority, setFilterPriority] = useState<NotificationPriority | 'all'>('all')

    // Мемоизация списков уведомлений
    const { unreadList, historyList, groupedUnread } = useMemo(() => {
      const now = new Date().toISOString()
      
      // Непрочитанные (учитываем snooze)
      const unread = allNotifications.filter(
        (n) => !n.isRead && (!n.snoozedUntil || n.snoozedUntil <= now)
      )

      // История (все уведомления для списка)
      let history = [...allNotifications]
      
      // Фильтрация истории
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        history = history.filter(n => 
          n.title.toLowerCase().includes(q) || n.preview.toLowerCase().includes(q)
        )
      }
      if (filterPriority !== 'all') {
        history = history.filter(n => n.priority === filterPriority)
      }
      
      // Сортировка по дате
      history.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      return {
        unreadList: unread,
        historyList: history,
        groupedUnread: {
          critical: unread.filter((n) => n.priority === 'critical'),
          high: unread.filter((n) => n.priority === 'high'),
          normal: unread.filter((n) => n.priority === 'normal'),
        }
      }
    }, [allNotifications, searchQuery, filterPriority])

    // Эффект авто-прочтения при выборе
    useEffect(() => {
      if (selectedNotificationId && !isMobile) {
        const notification = allNotifications.find(n => n.id === selectedNotificationId)
        if (notification && !notification.isRead) {
          markAsRead(selectedNotificationId)
        }
      }
    }, [selectedNotificationId, isMobile, allNotifications, markAsRead])

    // Обработчики
    const handleNotificationClick = (id: string) => {
      setSelectedNotificationId(id)
    }

    const handleTabChange = (tab: TabType) => {
      setActiveTab(tab)
      setSelectedNotificationId(null) // Сброс выбора при смене таба
    }

    const handleOpenSettings = () => {
      openModal('soundSettings', { activeTab: 'ai' })
      onClose()
    }

    // Текущее выбранное уведомление для правой колонки
    const selectedNotification = useMemo(() => 
      allNotifications.find(n => n.id === selectedNotificationId),
      [allNotifications, selectedNotificationId]
    )

    // Layout Content
    const panelContent = (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className={`
          fixed z-[999999] flex flex-col
          glass-effect rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden
          ${isMobile 
            ? 'w-[calc(100vw-1rem)] left-4 right-4 max-h-[calc(100vh-100px)]' 
            : 'w-[min(750px,90vw)] max-h-[min(700px,85vh)]'
          }
        `}
        style={{
          top: `${position.top}px`,
          right: `${position.right}px`,
        }}
      >
        {/* Header & Tabs */}
        <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between p-4 pb-2">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              AI-уведомления
              {unreadList.length > 0 && (
                <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-full">
                  {unreadList.length}
                </span>
              )}
            </h3>
            <button 
              onClick={handleOpenSettings}
              className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Настройки"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>

          {/* Desktop Tabs */}
          {!isMobile && (
            <div className="flex px-4 gap-6">
              <button
                onClick={() => handleTabChange('unread')}
                className={`
                  pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2
                  ${activeTab === 'unread' 
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                  }
                `}
              >
                <Bell className="w-4 h-4" />
                Текущие
              </button>
              <button
                onClick={() => handleTabChange('history')}
                className={`
                  pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2
                  ${activeTab === 'history' 
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                  }
                `}
              >
                <History className="w-4 h-4" />
                История
              </button>
            </div>
          )}
        </div>

        {/* Split View Content */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* LEFT COLUMN: List */}
          <div className={`
            ${isMobile ? 'w-full' : 'w-[40%] border-r border-gray-200 dark:border-gray-700'} 
            flex flex-col bg-white dark:bg-gray-900/50
          `}>
            
            {/* Search filter for History tab */}
            {!isMobile && activeTab === 'history' && (
              <div className="p-3 border-b border-gray-100 dark:border-gray-800 flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Поиск..."
                    className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800"
                  />
                </div>
                <button 
                  onClick={() => setFilterPriority(prev => prev === 'all' ? 'high' : prev === 'high' ? 'critical' : 'all')}
                  className={`p-1.5 rounded-md border ${filterPriority !== 'all' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'border-gray-200 text-gray-500'}`}
                  title="Фильтр по приоритету"
                >
                  <Filter className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
              {/* CONTENT: UNREAD TAB */}
              {activeTab === 'unread' && (
                <>
                  {unreadList.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center p-4">
                      <EmptyState
                        title="Всё чисто"
                        description="Нет новых уведомлений"
                        variant="compact"
                      />
                    </div>
                  ) : (
                    <div className="space-y-4 pb-2">
                      {groupedUnread.critical.length > 0 && (
                        <div>
                          <h4 className="px-2 text-xs font-semibold text-red-600 dark:text-red-400 mb-2 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                            КРИТИЧЕСКИЕ
                          </h4>
                          {groupedUnread.critical.map(n => (
                            <NotificationItem 
                              key={n.id} 
                              notification={n} 
                              onClick={() => handleNotificationClick(n.id)}
                              compact 
                              isActive={selectedNotificationId === n.id}
                            />
                          ))}
                        </div>
                      )}
                      {groupedUnread.high.length > 0 && (
                        <div>
                          <h4 className="px-2 text-xs font-semibold text-yellow-600 dark:text-yellow-400 mb-2 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span>
                            ВАЖНЫЕ
                          </h4>
                          {groupedUnread.high.map(n => (
                            <NotificationItem 
                              key={n.id} 
                              notification={n} 
                              onClick={() => handleNotificationClick(n.id)}
                              compact 
                              isActive={selectedNotificationId === n.id}
                            />
                          ))}
                        </div>
                      )}
                      {groupedUnread.normal.length > 0 && (
                        <div>
                          <h4 className="px-2 text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                            ОБЫЧНЫЕ
                          </h4>
                          {groupedUnread.normal.map(n => (
                            <NotificationItem 
                              key={n.id} 
                              notification={n} 
                              onClick={() => handleNotificationClick(n.id)}
                              compact 
                              isActive={selectedNotificationId === n.id}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {/* Mark All Read Button */}
                  {unreadList.length > 0 && (
                    <button
                      onClick={() => markAllAsRead()}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 mt-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg text-xs font-medium transition-colors"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Отметить все как прочитанные
                    </button>
                  )}
                </>
              )}

              {/* CONTENT: HISTORY TAB */}
              {activeTab === 'history' && (
                <div className="space-y-1">
                  {historyList.length === 0 ? (
                    <EmptyState
                      title="История пуста"
                      description="Здесь будут появляться все уведомления"
                      variant="compact"
                    />
                  ) : (
                    historyList.map(n => (
                      <NotificationItem 
                        key={n.id} 
                        notification={n} 
                        onClick={() => handleNotificationClick(n.id)}
                        compact 
                        isActive={selectedNotificationId === n.id}
                      />
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Mobile History Button (only in unread tab) */}
            {isMobile && (
              <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <button
                  onClick={() => setShowHistoryModal(true)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm"
                >
                  <History className="w-4 h-4" />
                  Открыть историю
                </button>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Details (Desktop Only) */}
          {!isMobile && (
            <div className="w-[60%] bg-gray-50/50 dark:bg-gray-900/30 flex flex-col relative overflow-hidden">
               {/* Декоративный фон */}
               <div className="absolute inset-0 bg-grid-slate-200/[0.04] bg-[bottom_1px_center] dark:bg-grid-slate-400/[0.05] [mask-image:linear-gradient(to_bottom,transparent,black)] pointer-events-none" />
               
               <div className="flex-1 overflow-y-auto p-6 custom-scrollbar relative">
                 <AnimatePresence mode="wait">
                   {selectedNotification ? (
                     <NotificationDetailInline 
                       key={selectedNotification.id} 
                       notification={selectedNotification} 
                     />
                   ) : (
                     <motion.div 
                       initial={{ opacity: 0 }}
                       animate={{ opacity: 1 }}
                       exit={{ opacity: 0 }}
                       className="h-full flex flex-col items-center justify-center text-center p-8 opacity-60"
                     >
                       <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                         <Bell className="w-8 h-8 text-gray-400" />
                       </div>
                       <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                         Выберите уведомление
                       </h3>
                       <p className="text-sm text-gray-500 max-w-xs">
                         Нажмите на уведомление в списке слева, чтобы просмотреть подробную информацию, метрики и рекомендации
                       </p>
                     </motion.div>
                   )}
                 </AnimatePresence>
               </div>
            </div>
          )}
        </div>

        {/* Mobile Modals */}
        {isMobile && selectedNotification && (
          <NotificationDetailModal
            isOpen={true}
            onClose={() => setSelectedNotificationId(null)}
            notification={selectedNotification}
          />
        )}
        
        {isMobile && showHistoryModal && (
          <NotificationHistoryModal
            isOpen={true}
            onClose={() => setShowHistoryModal(false)}
            onNotificationClick={(id) => {
              setSelectedNotificationId(id)
              setShowHistoryModal(false)
            }}
          />
        )}
      </motion.div>
    )

    return createPortal(panelContent, document.body)
  }
)

AINotificationsPanel.displayName = 'AINotificationsPanel'
