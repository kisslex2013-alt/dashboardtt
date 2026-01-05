import { useState, useRef, useEffect, useCallback } from 'react'
import { Square, Maximize2, Minimize2, Settings } from '../../utils/icons'
import { useTimer } from '../../hooks/useTimer'
import { useFloatingPanel, useUpdateSettings } from '../../store/useSettingsStore'
import { useEntries } from '../../store/useEntriesStore'
import { useOpenModal, useShowSuccess } from '../../store/useUIStore'
import { useIsMobile } from '../../hooks/useIsMobile'

/**
 * 💾 Расширенная плавающая панель активного таймера
 *
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 *
 * Эта панель показывает активный таймер и позволяет:
 * - Перетаскивать панель по экрану (drag & drop)
 * - Переключать размер (compact/expanded)
 * - Видеть быструю статистику за день в expanded режиме
 * - Переключать темы оформления (glass/solid/minimal)
 *
 * Позиция и настройки сохраняются автоматически.
 */
export function FloatingPanel() {
  const timer = useTimer()
  // ✅ ОПТИМИЗАЦИЯ: Используем атомарные селекторы для минимизации ре-рендеров
  const entries = useEntries()
  const floatingPanel = useFloatingPanel()
  const updateSettings = useUpdateSettings()
  const openModal = useOpenModal()
  const showSuccess = useShowSuccess()
  const isMobile = useIsMobile()

  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [position, setPosition] = useState(floatingPanel?.position || { x: 20, y: 20 })
  const [isExpanded, setIsExpanded] = useState(floatingPanel?.size === 'expanded')
  const panelRef = useRef(null)

  // На мобильных устройствах используем фиксированную позицию внизу экрана
  const mobilePosition = isMobile
    ? { x: 0, y: window.innerHeight - (isExpanded ? 200 : 120) }
    : position

  // Синхронизация с настройками
  useEffect(() => {
    if (floatingPanel) {
      setIsExpanded(floatingPanel.size === 'expanded')
      setPosition(floatingPanel.position || { x: 20, y: 20 })
    }
  }, [floatingPanel])

  /**
   * Форматирует время в формат HH:MM:SS
   */
  const formatElapsed = seconds => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  /**
   * Получает быструю статистику за сегодня
   */
  const getQuickStats = () => {
    const today = new Date().toISOString().split('T')[0]
    const todayEntries = entries.filter(entry => entry.date === today)

    const totalHours = todayEntries.reduce((sum, entry) => {
      if (entry.duration) {
        return sum + parseFloat(entry.duration)
      }
      if (entry.start && entry.end) {
        const [sh, sm] = entry.start.split(':').map(Number)
        const [eh, em] = entry.end.split(':').map(Number)
        const startMinutes = sh * 60 + sm
        let endMinutes = eh * 60 + em
        if (endMinutes < startMinutes) endMinutes += 24 * 60
        return sum + Math.max(0, (endMinutes - startMinutes) / 60)
      }
      return sum
    }, 0)

    const totalEarned = todayEntries.reduce((sum, entry) => sum + parseFloat(entry.earned || 0), 0)
    const averageRate = totalHours > 0 ? totalEarned / totalHours : 0

    return {
      totalHours: totalHours.toFixed(1),
      totalEarned: totalEarned.toLocaleString('ru-RU'),
      averageRate: averageRate.toFixed(0),
    }
  }

  /**
   * Обработка начала перетаскивания (мышь)
   */
  const handleMouseDown = useCallback(
    e => {
      // На мобильных не поддерживаем перетаскивание мышью
      if (isMobile) return

      // Игнорируем клики на кнопки
      if (e.target.closest('.floating-panel-button')) return

      setIsDragging(true)
      const rect = panelRef.current.getBoundingClientRect()
      setDragStart({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
      e.preventDefault()
    },
    [isMobile]
  )

  /**
   * Обработка начала перетаскивания (touch)
   */
  const handleTouchStart = useCallback(
    e => {
      // На мобильных перетаскивание отключено - используем фиксированную позицию
      if (isMobile) return

      // Игнорируем клики на кнопки
      if (e.target.closest('.floating-panel-button')) return

      const touch = e.touches[0]
      setIsDragging(true)
      const rect = panelRef.current.getBoundingClientRect()
      setDragStart({
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      })
      e.preventDefault()
    },
    [isMobile]
  )

  /**
   * Обработка движения мыши при перетаскивании (оптимизировано с requestAnimationFrame)
   */
  const rafRef = useRef(null)

  const handleMouseMove = useCallback(
    e => {
      if (!isDragging || isMobile) return

      // Отменяем предыдущий кадр если он есть
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }

      // Используем requestAnimationFrame для плавного обновления
      rafRef.current = requestAnimationFrame(() => {
        const newX = e.clientX - dragStart.x
        const newY = e.clientY - dragStart.y

        // Ограничиваем позицию в пределах экрана
        const panelWidth = isExpanded ? 320 : 200
        const panelHeight = isExpanded ? 180 : 100
        const maxX = window.innerWidth - panelWidth
        const maxY = window.innerHeight - panelHeight

        const clampedX = Math.max(0, Math.min(newX, maxX))
        const clampedY = Math.max(0, Math.min(newY, maxY))

        setPosition({ x: clampedX, y: clampedY })
      })
    },
    [isDragging, dragStart, isExpanded, isMobile]
  )

  /**
   * Обработка движения touch при перетаскивании
   */
  const handleTouchMove = useCallback(
    e => {
      if (!isDragging || isMobile) return

      const touch = e.touches[0]

      // Отменяем предыдущий кадр если он есть
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }

      // Используем requestAnimationFrame для плавного обновления
      rafRef.current = requestAnimationFrame(() => {
        const newX = touch.clientX - dragStart.x
        const newY = touch.clientY - dragStart.y

        // Ограничиваем позицию в пределах экрана
        const panelWidth = isExpanded ? 320 : 200
        const panelHeight = isExpanded ? 180 : 100
        const maxX = window.innerWidth - panelWidth
        const maxY = window.innerHeight - panelHeight

        const clampedX = Math.max(0, Math.min(newX, maxX))
        const clampedY = Math.max(0, Math.min(newY, maxY))

        setPosition({ x: clampedX, y: clampedY })
      })

      e.preventDefault()
    },
    [isDragging, dragStart, isExpanded, isMobile]
  )

  /**
   * Обработка окончания перетаскивания (мышь)
   */
  const handleMouseUp = useCallback(() => {
    if (isDragging && !isMobile) {
      setIsDragging(false)
      // Отменяем запланированный кадр
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      // Сохраняем позицию в настройках
      updateSettings({
        floatingPanel: {
          ...floatingPanel,
          position,
        },
      })
    }
  }, [isDragging, position, floatingPanel, updateSettings, isMobile])

  /**
   * Обработка окончания перетаскивания (touch)
   */
  const handleTouchEnd = useCallback(() => {
    if (isDragging && !isMobile) {
      setIsDragging(false)
      // Отменяем запланированный кадр
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      // Сохраняем позицию в настройках
      updateSettings({
        floatingPanel: {
          ...floatingPanel,
          position,
        },
      })
    }
  }, [isDragging, position, floatingPanel, updateSettings, isMobile])

  // Подписываемся на события мыши и touch для drag & drop
  useEffect(() => {
    if (isDragging && !isMobile) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.addEventListener('touchmove', handleTouchMove, { passive: false })
      document.addEventListener('touchend', handleTouchEnd)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.removeEventListener('touchmove', handleTouchMove)
        document.removeEventListener('touchend', handleTouchEnd)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd, isMobile])

  /**
   * Переключение размера панели
   */
  const toggleSize = useCallback(() => {
    const newExpanded = !isExpanded
    setIsExpanded(newExpanded)
    updateSettings({
      floatingPanel: {
        ...floatingPanel,
        size: newExpanded ? 'expanded' : 'compact',
      },
    })
  }, [isExpanded, floatingPanel, updateSettings])

  const theme = floatingPanel?.theme || 'glass'
  const stats = isExpanded ? getQuickStats() : null

  // Если панель отключена или таймер не запущен - не показываем (после всех хуков!)
  if (!floatingPanel?.enabled || !timer.isRunning) return null

  // На мобильных устройствах используем фиксированную позицию внизу экрана
  const finalPosition = isMobile
    ? { x: 0, y: window.innerHeight - (isExpanded ? 200 : 120) }
    : position

  return (
    <div
      ref={panelRef}
      className={`
        fixed z-50 select-none
        ${isMobile ? 'left-0 right-0 mx-auto' : ''}
        ${isMobile ? 'touch-manipulation' : ''}
        ${!isMobile && isDragging ? 'cursor-grabbing scale-105' : !isMobile ? 'cursor-move' : ''}
        ${isMobile ? (isExpanded ? 'w-full max-w-[400px] h-[200px]' : 'w-full max-w-[300px] h-[120px]') : ''}
        ${!isMobile && isExpanded ? 'w-[320px] h-[180px]' : !isMobile ? 'w-[200px] h-[100px]' : ''}
        ${theme === 'glass' ? 'glass-effect' : ''}
        ${theme === 'solid' ? 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700' : ''}
        ${theme === 'minimal' ? 'bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700' : ''}
      `}
      style={{
        left: isMobile ? 'auto' : `${finalPosition.x}px`,
        right: isMobile ? 'auto' : 'auto',
        top: isMobile ? 'auto' : `${finalPosition.y}px`,
        bottom: isMobile ? '20px' : 'auto',
        borderRadius: isExpanded ? '20px' : '16px',
        padding: isExpanded ? '14px' : '12px',
        boxShadow: isDragging ? '0 20px 40px rgba(0, 0, 0, 0.3)' : '0 8px 32px rgba(0, 0, 0, 0.1)',
        transition: isDragging ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <div className="flex flex-col h-full gap-2">
        {/* Заголовок с таймером */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* Индикатор статуса с пульсацией */}
            <div className="relative w-3 h-3 flex-shrink-0">
              {/* Внешний пульсирующий круг */}
              <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75" />
              {/* Основной индикатор */}
              <div className="relative w-3 h-3 rounded-full bg-green-500 animate-pulse shadow-lg shadow-green-500/50" />
            </div>

            {/* Время таймера */}
            <div className="flex flex-col min-w-0">
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {timer.activeTimer || 'Таймер'}
              </div>
              <div className="text-xl font-mono font-bold">{formatElapsed(timer.getSeconds())}</div>
            </div>
          </div>

          {/* Кнопка переключения размера */}
          <button
            onClick={toggleSize}
            className="floating-panel-button p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-normal hover-lift-scale click-shrink flex-shrink-0 touch-manipulation"
            style={{ minWidth: isMobile ? '44px' : 'auto', minHeight: isMobile ? '44px' : 'auto' }}
            title={isExpanded ? 'Свернуть' : 'Развернуть'}
            data-icon-id={isExpanded ? 'floating-panel-minimize' : 'floating-panel-maximize'}
          >
            {isExpanded ? (
              <Minimize2 className={isMobile ? 'w-5 h-5' : 'w-4 h-4'} />
            ) : (
              <Maximize2 className={isMobile ? 'w-5 h-5' : 'w-4 h-4'} />
            )}
          </button>
        </div>

        {/* Расширенная статистика (только в expanded режиме) */}
        {isExpanded && stats && (
          <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="grid grid-cols-3 gap-2 text-xs">
              {/* Часы работы */}
              <div className="flex flex-col items-center">
                <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
                  {stats.totalHours}ч
                </div>
                <div className="text-gray-500 dark:text-gray-400">Часы</div>
              </div>

              {/* Средняя ставка */}
              <div className="flex flex-col items-center">
                <div className="text-sm font-bold text-green-600 dark:text-green-400">
                  {stats.averageRate}₽/ч
                </div>
                <div className="text-gray-500 dark:text-gray-400">Ставка</div>
              </div>

              {/* Заработок */}
              <div className="flex flex-col items-center">
                <div className="text-sm font-bold text-purple-600 dark:text-purple-400">
                  {stats.totalEarned}₽
                </div>
                <div className="text-gray-500 dark:text-gray-400">Доход</div>
              </div>
            </div>
          </div>
        )}

        {/* Элементы управления */}
        <div className="flex items-center justify-between mt-auto gap-2">
          {/* Кнопка остановки таймера */}
          <button
            onClick={() => {
              // Останавливаем таймер и получаем данные записи
              const entryData = timer.stop()

              if (entryData) {
                // Открываем модальное окно с предзаполненными данными
                openModal('editEntry', { entry: entryData })
                showSuccess('Таймер остановлен. Проверьте и сохраните запись.')
              }
            }}
            className="floating-panel-button px-2 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-normal hover-lift-scale click-shrink flex items-center gap-1.5 flex-1 min-w-0 touch-manipulation"
            style={{ minHeight: isMobile ? '44px' : 'auto' }}
            title="Остановить таймер"
            data-icon-id="floating-panel-stop"
          >
            <Square className={isMobile ? 'w-4 h-4' : 'w-3.5 h-3.5'} flex-shrink-0 />
            <span className={`font-medium truncate ${isMobile ? 'text-sm' : 'text-xs'}`}>Стоп</span>
          </button>

          {/* Кнопка настроек */}
          <button
            onClick={() => openModal('floatingPanelSettings')}
            className="floating-panel-button p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-normal hover-lift-scale click-shrink flex-shrink-0 touch-manipulation"
            style={{ minWidth: isMobile ? '44px' : 'auto', minHeight: isMobile ? '44px' : 'auto' }}
            title="Настройки панели"
            data-icon-id="floating-panel-settings"
          >
            <Settings className={isMobile ? 'w-5 h-5' : 'w-4 h-4'} />
          </button>
        </div>
      </div>
    </div>
  )
}
