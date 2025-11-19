import { useState, useCallback, useRef } from 'react'

/**
 * Хук для оптимистичных обновлений UI
 * 
 * Позволяет обновлять UI сразу, до завершения асинхронной операции,
 * с возможностью отката при ошибке
 * 
 * @template T
 * @param {T} initialValue - Начальное значение
 * @returns {Object} Объект с состоянием и функциями управления
 */
export function useOptimisticUpdate(initialValue) {
  const [value, setValue] = useState(initialValue)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState(null)
  const previousValueRef = useRef(initialValue)

  const update = useCallback(
    async (optimisticValue, asyncOperation) => {
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
        setError(err)
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

