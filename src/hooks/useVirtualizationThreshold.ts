import { useMemo } from 'react'
import { useIsMobile } from './useIsMobile'

interface Thresholds {
  items: number
  groups: number
}

/**
 * Хук для определения необходимости виртуализации списка
 *
 * Адаптивные пороги в зависимости от устройства:
 * - Мобильные: более низкие пороги (меньше памяти)
 * - Десктоп: более высокие пороги (больше памяти)
 *
 * @param itemCount - количество элементов в списке
 * @param groupCount - количество групп (для аккордеонов)
 * @returns нужно ли виртуализировать список
 */
export function useVirtualizationThreshold(itemCount: number, groupCount: number = 0): boolean {
  const isMobile = useIsMobile()

  return useMemo(() => {
    const thresholds: Thresholds = isMobile
      ? {
          items: 500,
          groups: 100,
        }
      : {
          items: 1000,
          groups: 200,
        }

    const shouldVirtualize =
      itemCount > thresholds.items || (groupCount > 0 && groupCount > thresholds.groups)

    return shouldVirtualize
  }, [itemCount, groupCount, isMobile])
}
