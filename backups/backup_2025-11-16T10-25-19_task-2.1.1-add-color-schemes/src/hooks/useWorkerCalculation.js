import { useState, useEffect, useRef } from 'react'

/**
 * 🔧 Хук для использования Web Worker для тяжелых вычислений
 *
 * @param {Array} entries - массив записей для обработки
 * @param {string} calculationType - тип расчета: 'statistics', 'bestWeekday', 'peakProductivity', 'batch'
 * @param {string} filter - фильтр периода ('today', 'week', 'month', 'year', 'all')
 * @returns {Object} { result, isLoading, error }
 */
export function useWorkerCalculation(entries, calculationType = 'statistics', filter = 'month') {
  const [result, setResult] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const workerRef = useRef(null)

  useEffect(() => {
    // Создаем Worker только один раз
    if (!workerRef.current) {
      workerRef.current = new Worker(new URL('../workers/calculationWorker.js', import.meta.url), {
        type: 'module',
      })

      // Обработчик успешного результата
      workerRef.current.onmessage = e => {
        const { success, result: workerResult, error: workerError } = e.data

        if (success) {
          setResult(workerResult)
          setError(null)
        } else {
          setError(workerError || 'Unknown error in worker')
          setResult(null)
        }

        setIsLoading(false)
      }

      // Обработчик ошибок Worker
      workerRef.current.onerror = e => {
        setError(`Worker error: ${e.message}`)
        setIsLoading(false)
        setResult(null)
      }
    }

    // Отправляем задачу в Worker только если есть данные
    if (entries && entries.length > 0) {
      setIsLoading(true)
      setError(null)

      workerRef.current.postMessage({
        type: calculationType,
        data: entries,
        filter,
      })
    } else {
      // Если данных нет, устанавливаем пустой результат
      setResult(null)
      setIsLoading(false)
      setError(null)
    }

    // Cleanup: завершаем Worker при размонтировании
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate()
        workerRef.current = null
      }
    }
  }, [entries, calculationType, filter])

  return { result, isLoading, error }
}

/**
 * 🔧 Хук для пакетных расчетов (несколько типов сразу)
 *
 * @param {Array} entries - массив записей
 * @param {string} filter - фильтр периода
 * @returns {Object} { statistics, bestWeekday, peakProductivity, isLoading, error }
 */
export function useBatchWorkerCalculation(entries, filter = 'month') {
  const { result, isLoading, error } = useWorkerCalculation(entries, 'batch', filter)

  return {
    statistics: result?.statistics || null,
    bestWeekday: result?.bestWeekday || null,
    peakProductivity: result?.peakProductivity || null,
    isLoading,
    error,
  }
}
