import { useMemo } from 'react'
import { useIsMobile } from './useIsMobile'

/**
 * Хук для получения адаптивной высоты графика
 * 
 * @param {number} desktopHeight - высота для десктопа (по умолчанию 350)
 * @param {number} mobileHeight - высота для мобильных (по умолчанию 280)
 * @param {Object} options - дополнительные опции
 * @param {boolean} options.compact - использовать компактную высоту (уменьшает на 20%)
 * @returns {number} адаптивная высота графика
 */
export function useResponsiveChartHeight(desktopHeight = 350, mobileHeight = 280, options = {}) {
  const isMobile = useIsMobile()
  const { compact = false } = options

  return useMemo(() => {
    const baseHeight = isMobile ? mobileHeight : desktopHeight
    return compact ? Math.round(baseHeight * 0.8) : baseHeight
  }, [isMobile, desktopHeight, mobileHeight, compact])
}

