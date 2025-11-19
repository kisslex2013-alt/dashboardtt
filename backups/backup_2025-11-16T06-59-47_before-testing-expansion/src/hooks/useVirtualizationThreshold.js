import { useMemo } from 'react'
import { useIsMobile } from './useIsMobile'

/**
 * Хук для определения необходимости виртуализации списка
 * 
 * Адаптивные пороги в зависимости от устройства:
 * - Мобильные: более низкие пороги (меньше памяти)
 * - Десктоп: более высокие пороги (больше памяти)
 * 
 * @param {number} itemCount - количество элементов в списке
 * @param {number} groupCount - количество групп (для аккордеонов)
 * @returns {boolean} нужно ли виртуализировать список
 */
export function useVirtualizationThreshold(itemCount, groupCount = 0) {
  const isMobile = useIsMobile()

  return useMemo(() => {
    // Адаптивные пороги в зависимости от устройства
    const thresholds = isMobile
      ? {
          // Мобильные устройства: более низкие пороги
          items: 200, // Виртуализация при >200 элементов
          groups: 50, // Виртуализация при >50 групп
        }
      : {
          // Десктоп: более высокие пороги
          items: 500, // Виртуализация при >500 элементов
          groups: 100, // Виртуализация при >100 групп
        }

    // Виртуализируем если превышен порог по элементам или группам
    const shouldVirtualize =
      itemCount > thresholds.items || (groupCount > 0 && groupCount > thresholds.groups)

    return shouldVirtualize
  }, [itemCount, groupCount, isMobile])
}

