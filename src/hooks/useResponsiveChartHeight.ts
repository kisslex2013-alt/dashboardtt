import { useMemo } from 'react'
import { useIsMobile } from './useIsMobile'

interface ResponsiveChartHeightOptions {
  compact?: boolean
}

/**
 * Хук для получения адаптивной высоты графика
 *
 * @param desktopHeight - высота для десктопа (по умолчанию 350)
 * @param mobileHeight - высота для мобильных (по умолчанию 280)
 * @param options - дополнительные опции
 * @returns адаптивная высота графика
 */
export function useResponsiveChartHeight(
  desktopHeight: number = 350,
  mobileHeight: number = 280,
  options: ResponsiveChartHeightOptions = {}
): number {
  const isMobile = useIsMobile()
  const { compact = false } = options

  return useMemo(() => {
    const baseHeight = isMobile ? mobileHeight : desktopHeight
    return compact ? Math.round(baseHeight * 0.8) : baseHeight
  }, [isMobile, desktopHeight, mobileHeight, compact])
}
