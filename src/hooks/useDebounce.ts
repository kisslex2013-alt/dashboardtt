import { useState, useEffect } from 'react'

/**
 * 🎯 Хук для debounce (задержки) значения
 *
 * Полезен для оптимизации поиска, фильтрации и других операций,
 * которые не должны выполняться при каждом изменении значения.
 *
 * @param value - Значение для debounce
 * @param delay - Задержка в миллисекундах (по умолчанию 300мс)
 * @returns Debounced значение
 *
 * @example
 * ```tsx
 * function SearchComponent() {
 *   const [searchQuery, setSearchQuery] = useState('')
 *   const debouncedSearch = useDebounce(searchQuery, 300)
 * 
 *   useEffect(() => {
 *     // Выполняется только через 300мс после остановки ввода
 *     if (debouncedSearch) {
 *       performSearch(debouncedSearch)
 *     }
 *   }, [debouncedSearch])
 * 
 *   return (
 *     <input
 *       value={searchQuery}
 *       onChange={(e) => setSearchQuery(e.target.value)}
 *     />
 *   )
 * }
 * ```
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    // Устанавливаем таймер для обновления debounced значения
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Очищаем таймер если value изменился до истечения delay
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

