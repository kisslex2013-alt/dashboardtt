import { useState, useCallback } from 'react'

/**
 * Параметры хука useChartZoom
 */
interface UseChartZoomOptions {
  /** Общее количество точек данных */
  dataLength: number
  /** Начальный индекс */
  initialStartIndex?: number
  /** Конечный индекс */
  initialEndIndex?: number
  /** Минимальное количество точек для отображения */
  minDataPoints?: number
  /** Максимальное количество точек для отображения */
  maxDataPoints?: number
}

/**
 * Состояние зума
 */
interface ZoomState {
  startIndex: number
  endIndex: number
}

/**
 * 🔍 useChartZoom - Хук для управления зумом графиков
 *
 * Предоставляет функции для зума, панорамирования и сброса
 *
 * @example
 * ```tsx
 * const { zoomState, zoomIn, zoomOut, resetZoom, panLeft, panRight } = useChartZoom({
 *   dataLength: data.length,
 *   minDataPoints: 5,
 * })
 *
 * <ComposedChart data={data.slice(zoomState.startIndex, zoomState.endIndex)}>
 *   ...
 * </ComposedChart>
 * ```
 */
export function useChartZoom({
  dataLength,
  initialStartIndex = 0,
  initialEndIndex,
  minDataPoints = 5,
  maxDataPoints,
}: UseChartZoomOptions) {
  // Состояние зума
  const [zoomState, setZoomState] = useState<ZoomState>({
    startIndex: initialStartIndex,
    endIndex: initialEndIndex !== undefined ? initialEndIndex : dataLength,
  })

  // Вычисляем размер окна
  const windowSize = zoomState.endIndex - zoomState.startIndex
  const actualMaxDataPoints = maxDataPoints || dataLength

  /**
   * Увеличить масштаб (zoom in)
   */
  const zoomIn = useCallback(() => {
    if (windowSize <= minDataPoints) return

    const newWindowSize = Math.max(Math.floor(windowSize * 0.7), minDataPoints)
    const center = Math.floor((zoomState.startIndex + zoomState.endIndex) / 2)
    const newStart = Math.max(0, center - Math.floor(newWindowSize / 2))
    const newEnd = Math.min(dataLength, newStart + newWindowSize)

    setZoomState({ startIndex: newStart, endIndex: newEnd })
  }, [zoomState, windowSize, minDataPoints, dataLength])

  /**
   * Уменьшить масштаб (zoom out)
   */
  const zoomOut = useCallback(() => {
    if (windowSize >= actualMaxDataPoints) return

    const newWindowSize = Math.min(
      Math.ceil(windowSize * 1.3),
      actualMaxDataPoints
    )
    const center = Math.floor((zoomState.startIndex + zoomState.endIndex) / 2)
    const newStart = Math.max(0, center - Math.floor(newWindowSize / 2))
    const newEnd = Math.min(dataLength, newStart + newWindowSize)

    setZoomState({ startIndex: newStart, endIndex: newEnd })
  }, [zoomState, windowSize, actualMaxDataPoints, dataLength])

  /**
   * Сбросить зум (показать все данные)
   */
  const resetZoom = useCallback(() => {
    setZoomState({
      startIndex: initialStartIndex,
      endIndex: initialEndIndex !== undefined ? initialEndIndex : dataLength,
    })
  }, [initialStartIndex, initialEndIndex, dataLength])

  /**
   * Панорамирование влево
   */
  const panLeft = useCallback(() => {
    if (zoomState.startIndex === 0) return

    const shift = Math.max(1, Math.floor(windowSize * 0.2))
    const newStart = Math.max(0, zoomState.startIndex - shift)
    const newEnd = newStart + windowSize

    setZoomState({ startIndex: newStart, endIndex: newEnd })
  }, [zoomState, windowSize])

  /**
   * Панорамирование вправо
   */
  const panRight = useCallback(() => {
    if (zoomState.endIndex >= dataLength) return

    const shift = Math.max(1, Math.floor(windowSize * 0.2))
    const newEnd = Math.min(dataLength, zoomState.endIndex + shift)
    const newStart = newEnd - windowSize

    setZoomState({ startIndex: newStart, endIndex: newEnd })
  }, [zoomState, dataLength, windowSize])

  /**
   * Установить зум вручную
   */
  const setZoom = useCallback(
    (startIndex: number, endIndex: number) => {
      const validStart = Math.max(0, Math.min(startIndex, dataLength - minDataPoints))
      const validEnd = Math.min(dataLength, Math.max(endIndex, validStart + minDataPoints))

      setZoomState({ startIndex: validStart, endIndex: validEnd })
    },
    [dataLength, minDataPoints]
  )

  /**
   * Обработчик для Brush компонента Recharts
   */
  const handleBrushChange = useCallback(
    (e: { startIndex?: number; endIndex?: number }) => {
      if (e.startIndex !== undefined && e.endIndex !== undefined) {
        setZoom(e.startIndex, e.endIndex)
      }
    },
    [setZoom]
  )

  // Проверяем возможности зума/панорамирования
  const canZoomIn = windowSize > minDataPoints
  const canZoomOut = windowSize < actualMaxDataPoints
  const canPanLeft = zoomState.startIndex > 0
  const canPanRight = zoomState.endIndex < dataLength

  // Процент зума
  const zoomPercentage = Math.round((windowSize / dataLength) * 100)

  return {
    zoomState,
    zoomIn,
    zoomOut,
    resetZoom,
    panLeft,
    panRight,
    setZoom,
    handleBrushChange,
    canZoomIn,
    canZoomOut,
    canPanLeft,
    canPanRight,
    zoomPercentage,
    windowSize,
  }
}
