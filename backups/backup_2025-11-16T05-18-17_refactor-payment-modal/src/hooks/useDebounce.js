import { useState, useEffect } from 'react'

/**
 * 🎯 Хук для debounce (задержки) значения
 *
 * Полезен для оптимизации поиска, фильтрации и других операций,
 * которые не должны выполняться при каждом изменении значения.
 *
 * @param {any} value - Значение для debounce
 * @param {number} delay - Задержка в миллисекундах (по умолчанию 300мс)
 * @returns {any} - Debounced значение
 *
 * @example
 * const [searchQuery, setSearchQuery] = useState('');
 * const debouncedSearch = useDebounce(searchQuery, 300);
 *
 * // searchQuery меняется сразу при вводе
 * // debouncedSearch меняется только через 300мс после остановки ввода
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value)

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
