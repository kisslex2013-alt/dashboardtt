import { useState, useCallback, ReactNode, useRef } from 'react'
import { ZoomIn, ZoomOut, RotateCcw } from '../../utils/icons'
import { IconButton } from '../ui/IconButton'

/**
 * Props для ZoomableChartWrapper
 */
interface ZoomableChartWrapperProps {
  /** Контент графика */
  children: ReactNode
  /** Начальный индекс для зума */
  initialStartIndex?: number
  /** Начальный конечный индекс для зума */
  initialEndIndex?: number
  /** Минимальное количество точек данных для отображения */
  minDataPoints?: number
  /** Максимальное количество точек данных для отображения */
  maxDataPoints?: number
  /** Общее количество точек данных */
  dataLength: number
  /** Включить зум колесиком мыши */
  enableMouseWheelZoom?: boolean
  /** Включить панорамирование перетаскиванием */
  enableDragPan?: boolean
  /** Callback при изменении зума */
  onZoomChange?: (startIndex: number, endIndex: number) => void
  /** Классы для стилизации */
  className?: string
}

/**
 * 🔍 ZoomableChartWrapper - Обертка для графиков с зумом и панорамированием
 *
 * Добавляет возможность:
 * - Зума с помощью кнопок
 * - Зума колесиком мыши (опционально)
 * - Панорамирования стрелками
 * - Сброса зума
 *
 * @example
 * ```tsx
 * <ZoomableChartWrapper dataLength={data.length}>
 *   {(zoomState) => (
 *     <ComposedChart data={data.slice(zoomState.startIndex, zoomState.endIndex)}>
 *       ...
 *     </ComposedChart>
 *   )}
 * </ZoomableChartWrapper>
 * ```
 */
export function ZoomableChartWrapper({
  children,
  initialStartIndex = 0,
  initialEndIndex,
  minDataPoints = 5,
  maxDataPoints,
  dataLength,
  enableMouseWheelZoom = true,
  enableDragPan = false,
  onZoomChange,
  className = '',
}: ZoomableChartWrapperProps) {
  // Начальное состояние зума
  const [startIndex, setStartIndex] = useState(initialStartIndex)
  const [endIndex, setEndIndex] = useState(
    initialEndIndex !== undefined ? initialEndIndex : dataLength
  )

  const containerRef = useRef<HTMLDivElement>(null)

  // Вычисляем фактический размер окна
  const windowSize = endIndex - startIndex
  const actualMaxDataPoints = maxDataPoints || dataLength

  /**
   * Увеличить масштаб (zoom in)
   */
  const handleZoomIn = useCallback(() => {
    if (windowSize <= minDataPoints) return

    const newWindowSize = Math.max(Math.floor(windowSize * 0.7), minDataPoints)
    const center = Math.floor((startIndex + endIndex) / 2)
    const newStart = Math.max(0, center - Math.floor(newWindowSize / 2))
    const newEnd = Math.min(dataLength, newStart + newWindowSize)

    setStartIndex(newStart)
    setEndIndex(newEnd)
    onZoomChange?.(newStart, newEnd)
  }, [startIndex, endIndex, windowSize, minDataPoints, dataLength, onZoomChange])

  /**
   * Уменьшить масштаб (zoom out)
   */
  const handleZoomOut = useCallback(() => {
    if (windowSize >= actualMaxDataPoints) return

    const newWindowSize = Math.min(
      Math.ceil(windowSize * 1.3),
      actualMaxDataPoints
    )
    const center = Math.floor((startIndex + endIndex) / 2)
    const newStart = Math.max(0, center - Math.floor(newWindowSize / 2))
    const newEnd = Math.min(dataLength, newStart + newWindowSize)

    setStartIndex(newStart)
    setEndIndex(newEnd)
    onZoomChange?.(newStart, newEnd)
  }, [startIndex, endIndex, windowSize, actualMaxDataPoints, dataLength, onZoomChange])

  /**
   * Сбросить зум (показать все данные)
   */
  const handleResetZoom = useCallback(() => {
    setStartIndex(initialStartIndex)
    setEndIndex(initialEndIndex !== undefined ? initialEndIndex : dataLength)
    onZoomChange?.(
      initialStartIndex,
      initialEndIndex !== undefined ? initialEndIndex : dataLength
    )
  }, [initialStartIndex, initialEndIndex, dataLength, onZoomChange])

  /**
   * Панорамирование влево
   */
  const handlePanLeft = useCallback(() => {
    if (startIndex === 0) return

    const shift = Math.max(1, Math.floor(windowSize * 0.2))
    const newStart = Math.max(0, startIndex - shift)
    const newEnd = newStart + windowSize

    setStartIndex(newStart)
    setEndIndex(newEnd)
    onZoomChange?.(newStart, newEnd)
  }, [startIndex, windowSize, onZoomChange])

  /**
   * Панорамирование вправо
   */
  const handlePanRight = useCallback(() => {
    if (endIndex >= dataLength) return

    const shift = Math.max(1, Math.floor(windowSize * 0.2))
    const newEnd = Math.min(dataLength, endIndex + shift)
    const newStart = newEnd - windowSize

    setStartIndex(newStart)
    setEndIndex(newEnd)
    onZoomChange?.(newStart, newEnd)
  }, [endIndex, dataLength, windowSize, onZoomChange])

  /**
   * Обработка зума колесиком мыши
   */
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!enableMouseWheelZoom) return
      if (!e.ctrlKey && !e.metaKey) return // Требуем Ctrl/Cmd для зума

      e.preventDefault()

      if (e.deltaY < 0) {
        handleZoomIn()
      } else {
        handleZoomOut()
      }
    },
    [enableMouseWheelZoom, handleZoomIn, handleZoomOut]
  )

  /**
   * Обработка клавиатурных сокращений
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Панорамирование стрелками
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        handlePanLeft()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        handlePanRight()
      }
      // Зум с помощью +/- или Ctrl+/Ctrl-
      else if ((e.key === '+' || e.key === '=') && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        handleZoomIn()
      } else if (e.key === '-' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        handleZoomOut()
      }
      // Сброс зума с помощью 0 или Ctrl+0
      else if (e.key === '0' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        handleResetZoom()
      }
    },
    [handlePanLeft, handlePanRight, handleZoomIn, handleZoomOut, handleResetZoom]
  )

  // Проверяем возможность зума
  const canZoomIn = windowSize > minDataPoints
  const canZoomOut = windowSize < actualMaxDataPoints
  const canPanLeft = startIndex > 0
  const canPanRight = endIndex < dataLength

  // Индикатор зума (процент)
  const zoomPercentage = Math.round((windowSize / dataLength) * 100)

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      onWheel={handleWheel}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label="Масштабируемый график"
    >
      {/* Контролы зума */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 border border-gray-200 dark:border-gray-700">
        {/* Zoom In */}
        <IconButton
          defaultIcon={ZoomIn}
          iconId="chart-zoom-in"
          onClick={handleZoomIn}
          disabled={!canZoomIn}
          aria-label="Увеличить масштаб (Ctrl + +)"
          title="Увеличить масштаб (Ctrl + +)"
          className={`
            ${!canZoomIn ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}
          `}
        />

        {/* Zoom Out */}
        <IconButton
          defaultIcon={ZoomOut}
          iconId="chart-zoom-out"
          onClick={handleZoomOut}
          disabled={!canZoomOut}
          aria-label="Уменьшить масштаб (Ctrl + -)"
          title="Уменьшить масштаб (Ctrl + -)"
          className={`
            ${!canZoomOut ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}
          `}
        />

        {/* Reset Zoom */}
        <IconButton
          defaultIcon={RotateCcw}
          iconId="chart-zoom-reset"
          onClick={handleResetZoom}
          aria-label="Сбросить масштаб (Ctrl + 0)"
          title="Сбросить масштаб (Ctrl + 0)"
          className="hover:bg-gray-100 dark:hover:bg-gray-700"
        />

        {/* Индикатор зума */}
        <span className="text-xs text-gray-600 dark:text-gray-400 font-medium min-w-[3rem] text-center">
          {zoomPercentage}%
        </span>
      </div>

      {/* Контролы панорамирования */}
      {(canPanLeft || canPanRight) && (
        <div className="absolute top-2 left-2 z-10 flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 border border-gray-200 dark:border-gray-700">
          {/* Pan Left */}
          <button
            onClick={handlePanLeft}
            disabled={!canPanLeft}
            aria-label="Панорамировать влево (←)"
            title="Панорамировать влево (←)"
            className={`
              px-2 py-1 rounded transition-colors text-xs font-medium
              ${
                canPanLeft
                  ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  : 'opacity-50 cursor-not-allowed text-gray-400 dark:text-gray-600'
              }
            `}
          >
            ←
          </button>

          {/* Pan Right */}
          <button
            onClick={handlePanRight}
            disabled={!canPanRight}
            aria-label="Панорамировать вправо (→)"
            title="Панорамировать вправо (→)"
            className={`
              px-2 py-1 rounded transition-colors text-xs font-medium
              ${
                canPanRight
                  ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  : 'opacity-50 cursor-not-allowed text-gray-400 dark:text-gray-600'
              }
            `}
          >
            →
          </button>
        </div>
      )}

      {/* Подсказка */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 bg-black/70 text-white text-xs px-3 py-1 rounded-full opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
        Ctrl + колесико для зума, ← → для панорамирования
      </div>

      {/* График */}
      <div className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg">
        {typeof children === 'function'
          ? children({ startIndex, endIndex, windowSize })
          : children}
      </div>
    </div>
  )
}

/**
 * Типы для callback функции children
 */
export interface ZoomState {
  startIndex: number
  endIndex: number
  windowSize: number
}
