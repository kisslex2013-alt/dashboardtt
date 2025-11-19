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
    // ✅ ОПТИМИЗАЦИЯ: Пороги виртуализации для >1000 записей с поддержкой accordion
    // Адаптивные пороги в зависимости от устройства
    const thresholds = isMobile
      ? {
          // Мобильные устройства: более низкие пороги (меньше памяти)
          items: 500, // Виртуализация при >500 элементов (повышено с 200)
          groups: 100, // Виртуализация при >100 групп (повышено с 50)
        }
      : {
          // Десктоп: пороги для >1000 записей с поддержкой accordion
          items: 1000, // Виртуализация при >1000 элементов (повышено с 500)
          groups: 200, // Виртуализация при >200 групп (повышено с 100)
        }

    // Виртуализируем если превышен порог по элементам или группам
    const shouldVirtualize =
      itemCount > thresholds.items || (groupCount > 0 && groupCount > thresholds.groups)

    return shouldVirtualize
  }, [itemCount, groupCount, isMobile])
}

