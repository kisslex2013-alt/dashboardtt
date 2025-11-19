/**
 * 🍅 Плавающая панель Pomodoro таймера
 *
 * Отображает Pomodoro таймер в виде плавающей панели, которую можно перетаскивать по экрану
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { Play, Pause, RotateCcw, SkipForward, Maximize2, Minimize2 } from '../../utils/icons'
import { usePomodoro } from '../../hooks/usePomodoro'
import { usePomodoroPomodorosUntilLongBreak } from '../../store/usePomodoroStore'
import { useIsMobile } from '../../hooks/useIsMobile'

/**
 * Компонент плавающей панели Pomodoro
 */
export function FloatingPomodoroPanel() {
  const {
    mode,
    timeLeft,
    isRunning,
    pomodorosCompleted,
    formattedTime,
    progress,
    start,
    pause,
    resume,
    stop,
    reset,
    nextMode,
  } = usePomodoro()

  const pomodorosUntilLongBreak = usePomodoroPomodorosUntilLongBreak()
  const isMobile = useIsMobile()

  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [position, setPosition] = useState({ x: 20, y: 20 })
  const [isExpanded, setIsExpanded] = useState(true)
  const panelRef = useRef<HTMLDivElement>(null)

  // Определяем цвета и текст в зависимости от режима
  const getModeInfo = () => {
    switch (mode) {
      case 'work':
        return {
          label: 'Работа',
          color: '#10B981', // Green
          bgColor: 'bg-green-500',
          textColor: 'text-green-500',
        }
      case 'shortBreak':
        return {
          label: 'Короткий перерыв',
          color: '#3B82F6', // Blue
          bgColor: 'bg-blue-500',
          textColor: 'text-blue-500',
        }
      case 'longBreak':
        return {
          label: 'Длинный перерыв',
          color: '#8B5CF6', // Purple
          bgColor: 'bg-purple-500',
          textColor: 'text-purple-500',
        }
      default:
        return {
          label: 'Работа',
          color: '#10B981',
          bgColor: 'bg-green-500',
          textColor: 'text-green-500',
        }
    }
  }

  const modeInfo = getModeInfo()

  // Радиус круга прогресса
  const radius = isExpanded ? 40 : 30
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progress / 100) * circumference

  /**
   * Обработка начала перетаскивания (мышь)
   */
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // На мобильных не поддерживаем перетаскивание мышью
      if (isMobile) return

      // Игнорируем клики на кнопки
      if ((e.target as HTMLElement).closest('.pomodoro-button')) return

      setIsDragging(true)
      const rect = panelRef.current!.getBoundingClientRect()
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
    (e: React.TouchEvent) => {
      // На мобильных перетаскивание отключено
      if (isMobile) return

      // Игнорируем клики на кнопки
      if ((e.target as HTMLElement).closest('.pomodoro-button')) return

      const touch = e.touches[0]
      setIsDragging(true)
      const rect = panelRef.current!.getBoundingClientRect()
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
  const rafRef = useRef<number | null>(null)

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
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
        const panelWidth = isExpanded ? 240 : 160
        const panelHeight = isExpanded ? 200 : 120
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
    (e: TouchEvent) => {
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
        const panelWidth = isExpanded ? 240 : 160
        const panelHeight = isExpanded ? 200 : 120
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
    }
  }, [isDragging, isMobile])

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
    }
  }, [isDragging, isMobile])

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
    setIsExpanded(!isExpanded)
  }, [isExpanded])

  // На мобильных устройствах используем фиксированную позицию
  const finalPosition = isMobile ? { x: 20, y: window.innerHeight - 200 } : position

  return (
    <div
      ref={panelRef}
      className={`
        fixed z-50 select-none glass-effect
        ${isMobile ? 'left-4 right-4' : ''}
        ${isMobile ? 'touch-manipulation' : ''}
        ${!isMobile && isDragging ? 'cursor-grabbing scale-105' : !isMobile ? 'cursor-move' : ''}
        ${isMobile ? 'w-auto' : isExpanded ? 'w-[240px]' : 'w-[160px]'}
      `}
      style={{
        left: isMobile ? 'auto' : `${finalPosition.x}px`,
        right: isMobile ? 'auto' : 'auto',
        top: isMobile ? 'auto' : `${finalPosition.y}px`,
        bottom: isMobile ? '20px' : 'auto',
        borderRadius: '16px',
        padding: isExpanded ? '12px' : '8px',
        boxShadow: isDragging ? '0 20px 40px rgba(0, 0, 0, 0.3)' : '0 8px 32px rgba(0, 0, 0, 0.1)',
        transition: isDragging ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <div className={`flex flex-col items-center ${isExpanded ? 'gap-2' : 'gap-1.5'}`}>
        {/* Заголовок с кнопкой свернуть/развернуть */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-1.5">
            <span className="text-base">🍅</span>
            <span className={`text-xs font-semibold ${modeInfo.textColor}`}>
              {modeInfo.label}
            </span>
          </div>
          <button
            onClick={toggleSize}
            className="pomodoro-button p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-normal"
            title={isExpanded ? 'Свернуть' : 'Развернуть'}
          >
            {isExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
          </button>
        </div>

        {/* Круг прогресса с временем (только expanded) */}
        {isExpanded && (
          <div className="relative">
            <svg width={radius * 2 + 16} height={radius * 2 + 16} className="transform -rotate-90">
              {/* Фоновый круг */}
              <circle
                cx={(radius * 2 + 16) / 2}
                cy={(radius * 2 + 16) / 2}
                r={radius}
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                className="text-gray-200 dark:text-gray-700"
              />
              {/* Прогресс */}
              <circle
                cx={(radius * 2 + 16) / 2}
                cy={(radius * 2 + 16) / 2}
                r={radius}
                stroke={modeInfo.color}
                strokeWidth="4"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-linear"
              />
            </svg>
            {/* Время в центре */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-xl font-mono font-bold text-gray-900 dark:text-white">
                {formattedTime}
              </div>
            </div>
          </div>
        )}

        {/* Компактный вид - только время */}
        {!isExpanded && (
          <div className="text-lg font-mono font-bold text-gray-900 dark:text-white">
            {formattedTime}
          </div>
        )}

        {/* Кнопки управления и счетчик */}
        <div className={`flex items-center justify-between ${isExpanded ? 'gap-1.5' : 'gap-1'} w-full`}>
          {/* Кнопка Старт/Стоп слева */}
          {isRunning ? (
            <button
              onClick={stop}
              className="pomodoro-button px-2 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-normal hover-lift-scale click-shrink flex items-center justify-center gap-1"
            >
              <Pause className="w-3 h-3" />
              {isExpanded && <span className="text-[10px] font-semibold">Стоп</span>}
            </button>
          ) : (
            <button
              onClick={start}
              className="pomodoro-button px-2 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white transition-normal hover-lift-scale click-shrink flex items-center justify-center gap-1"
            >
              <Play className="w-3 h-3" />
              {isExpanded && (
                <span className="text-[10px] font-semibold">
                  Старт
                </span>
              )}
            </button>
          )}

          {/* Счетчик помодоро в центре - только в expanded */}
          {isExpanded && (
            <div className="flex items-center gap-1.5">
              <div className="flex gap-0.5">
                {Array.from({ length: pomodorosUntilLongBreak }).map((_, index) => (
                  <span
                    key={index}
                    className={`text-xs ${
                      index < pomodorosCompleted % pomodorosUntilLongBreak
                        ? 'text-green-500'
                        : 'text-gray-300 dark:text-gray-600'
                    }`}
                  >
                    🍅
                  </span>
                ))}
              </div>
              <span className="text-[10px] font-semibold text-gray-900 dark:text-white">
                {pomodorosCompleted}
              </span>
            </div>
          )}

          {/* Кнопки Сброс и Пропустить справа */}
          <div className="flex items-center gap-1">
            <button
              onClick={reset}
              className="pomodoro-button p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-normal hover-lift-scale click-shrink"
              title="Сбросить"
            >
              <RotateCcw className="w-3 h-3" />
            </button>

            <button
              onClick={nextMode}
              className="pomodoro-button p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-normal hover-lift-scale click-shrink"
              title="Пропустить"
            >
              <SkipForward className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

