/**
 * 🖐️ useDragToClose Hook
 *
 * Хук для закрытия модальных окон свайпом вниз на мобильных устройствах.
 * Best practice: нативное поведение как в iOS/Android приложениях.
 *
 * @example
 * const { dragProps, dragStyle, isDragging } = useDragToClose(onClose)
 *
 * <div {...dragProps} style={dragStyle}>
 *   Modal content
 * </div>
 */

import { useState, useRef, useCallback, CSSProperties, TouchEvent, MouseEvent } from 'react'

interface DragToCloseOptions {
  /** Минимальное расстояние для закрытия (px) */
  threshold?: number
  /** Направление свайпа */
  direction?: 'down' | 'up'
  /** Отключить на десктопе */
  mobileOnly?: boolean
  /** Callback при начале перетаскивания */
  onDragStart?: () => void
  /** Callback при закрытии */
  onClose: () => void
}

interface DragToCloseResult {
  /** Пропсы для элемента */
  dragProps: {
    onTouchStart: (e: TouchEvent) => void
    onTouchMove: (e: TouchEvent) => void
    onTouchEnd: () => void
    onMouseDown?: (e: MouseEvent) => void
    onMouseMove?: (e: MouseEvent) => void
    onMouseUp?: () => void
  }
  /** Стили для анимации */
  dragStyle: CSSProperties
  /** Флаг активного перетаскивания */
  isDragging: boolean
  /** Текущее смещение */
  offset: number
  /** Прогресс закрытия (0-1) */
  progress: number
}

export function useDragToClose({
  threshold = 150,
  direction = 'down',
  mobileOnly = true,
  onDragStart,
  onClose,
}: DragToCloseOptions): DragToCloseResult {
  const [isDragging, setIsDragging] = useState(false)
  const [offset, setOffset] = useState(0)

  const startY = useRef(0)
  const currentY = useRef(0)

  // Проверка мобильного устройства
  const isMobile = typeof window !== 'undefined' &&
    ('ontouchstart' in window || navigator.maxTouchPoints > 0)

  const handleStart = useCallback((clientY: number) => {
    if (mobileOnly && !isMobile) return

    startY.current = clientY
    currentY.current = clientY
    setIsDragging(true)
    onDragStart?.()
  }, [mobileOnly, isMobile, onDragStart])

  const handleMove = useCallback((clientY: number) => {
    if (!isDragging) return

    currentY.current = clientY
    const diff = direction === 'down'
      ? clientY - startY.current
      : startY.current - clientY

    // Только положительное смещение (в направлении закрытия)
    const newOffset = Math.max(0, diff)

    // Добавляем сопротивление после threshold
    const resistance = newOffset > threshold ? 0.5 : 1
    const resistedOffset = newOffset > threshold
      ? threshold + (newOffset - threshold) * resistance
      : newOffset

    setOffset(resistedOffset)
  }, [isDragging, direction, threshold])

  const handleEnd = useCallback(() => {
    if (!isDragging) return

    setIsDragging(false)

    if (offset >= threshold) {
      // Закрываем
      onClose()
    }

    // Сбрасываем смещение
    setOffset(0)
  }, [isDragging, offset, threshold, onClose])

  // Touch events
  const onTouchStart = useCallback((e: TouchEvent) => {
    handleStart(e.touches[0].clientY)
  }, [handleStart])

  const onTouchMove = useCallback((e: TouchEvent) => {
    handleMove(e.touches[0].clientY)
  }, [handleMove])

  const onTouchEnd = useCallback(() => {
    handleEnd()
  }, [handleEnd])

  // Mouse events (для тестирования на десктопе)
  const onMouseDown = useCallback((e: MouseEvent) => {
    if (mobileOnly) return
    handleStart(e.clientY)
  }, [mobileOnly, handleStart])

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (mobileOnly) return
    handleMove(e.clientY)
  }, [mobileOnly, handleMove])

  const onMouseUp = useCallback(() => {
    if (mobileOnly) return
    handleEnd()
  }, [mobileOnly, handleEnd])

  // Стили для анимации
  const dragStyle: CSSProperties = {
    transform: offset > 0 ? `translateY(${direction === 'down' ? offset : -offset}px)` : undefined,
    transition: isDragging ? 'none' : 'transform 0.3s ease-out',
    opacity: isDragging ? Math.max(0.5, 1 - offset / (threshold * 2)) : 1,
  }

  // Прогресс закрытия
  const progress = Math.min(1, offset / threshold)

  return {
    dragProps: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      ...(mobileOnly ? {} : {
        onMouseDown,
        onMouseMove,
        onMouseUp,
      }),
    },
    dragStyle,
    isDragging,
    offset,
    progress,
  }
}

/**
 * DragIndicator — индикатор для свайпа
 * Визуальная подсказка что модал можно закрыть свайпом
 */
export function DragIndicator({ className = '' }: { className?: string }) {
  return (
    <div className={`flex justify-center pt-2 pb-4 ${className}`}>
      <div className="w-12 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
    </div>
  )
}
