import { useState, useCallback, useRef } from 'react'

/**
 * 🎯 Хук для оптимистичных обновлений UI
 *
 * Позволяет обновлять UI сразу, до завершения асинхронной операции,
 * с возможностью отката при ошибке
 *
 * @template T - Тип значения
 * @param initialValue - Начальное значение
 * @returns Объект с состоянием и функциями управления
 *
 * @example
 * // Оптимистичное удаление записи
 * const { value: isVisible, isPending, update } = useOptimisticUpdate(true)
 *
 * const handleDelete = async () => {
 *   await update(false, async () => {
 *     await deleteEntry(id)
 *     return false
 *   })
 * }
 */
export interface OptimisticUpdateResult<T> {
  /** Текущее значение (оптимистичное или актуальное) */
  value: T
  /** Флаг ожидания выполнения операции */
  isPending: boolean
  /** Ошибка, если операция провалилась */
  error: Error | null
  /** Функция для оптимистичного обновления с откатом */
  update: (optimisticValue: T, asyncOperation: () => Promise<T | void>) => Promise<T | void>
  /** Сброс к начальному значению */
  reset: () => void
}

export function useOptimisticUpdate<T>(initialValue: T): OptimisticUpdateResult<T> {
  const [value, setValue] = useState<T>(initialValue)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const previousValueRef = useRef<T>(initialValue)

  const update = useCallback(
    async (optimisticValue: T, asyncOperation: () => Promise<T | void>): Promise<T | void> => {
      // Сохраняем предыдущее значение для возможного отката
      previousValueRef.current = value

      // Оптимистично обновляем UI
      setValue(optimisticValue)
      setIsPending(true)
      setError(null)

      try {
        // Выполняем асинхронную операцию
        const result = await asyncOperation()

        // Если операция успешна, обновляем значение результатом
        if (result !== undefined) {
          setValue(result)
        }

        setIsPending(false)
        return result
      } catch (err) {
        // При ошибке откатываем к предыдущему значению
        setValue(previousValueRef.current)
        setError(err instanceof Error ? err : new Error(String(err)))
        setIsPending(false)
        throw err
      }
    },
    [value]
  )

  const reset = useCallback(() => {
    setValue(initialValue)
    setError(null)
    setIsPending(false)
    previousValueRef.current = initialValue
  }, [initialValue])

  return {
    value,
    isPending,
    error,
    update,
    reset,
  }
}
