import { useState, useEffect, useRef } from 'react'
import type { TimeEntry } from '../types'

type CalculationType = 'statistics' | 'bestWeekday' | 'peakProductivity' | 'batch'
type FilterType = 'today' | 'week' | 'month' | 'year' | 'all'

interface WorkerResult {
  success: boolean
  result?: unknown
  error?: string
}

interface BatchResult {
  statistics?: unknown
  bestWeekday?: unknown
  peakProductivity?: unknown
}

interface UseWorkerCalculationReturn {
  result: unknown
  isLoading: boolean
  error: string | null
}

interface UseBatchWorkerCalculationReturn {
  statistics: unknown
  bestWeekday: unknown
  peakProductivity: unknown
  isLoading: boolean
  error: string | null
}

/**
 * 🔧 Хук для использования Web Worker для тяжелых вычислений
 *
 * @param entries - массив записей для обработки
 * @param calculationType - тип расчета
 * @param filter - фильтр периода
 */
export function useWorkerCalculation(
  entries: TimeEntry[],
  calculationType: CalculationType = 'statistics',
  filter: FilterType = 'month'
): UseWorkerCalculationReturn {
  const [result, setResult] = useState<unknown>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const workerRef = useRef<Worker | null>(null)

  useEffect(() => {
    if (!workerRef.current) {
      workerRef.current = new Worker(new URL('../workers/calculationWorker.js', import.meta.url), {
        type: 'module',
      })

      workerRef.current.onmessage = (e: MessageEvent<WorkerResult>) => {
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

      workerRef.current.onerror = (e: ErrorEvent) => {
        setError(`Worker error: ${e.message}`)
        setIsLoading(false)
        setResult(null)
      }
    }

    if (entries && entries.length > 0) {
      setIsLoading(true)
      setError(null)

      workerRef.current.postMessage({
        type: calculationType,
        data: entries,
        filter,
      })
    } else {
      setResult(null)
      setIsLoading(false)
      setError(null)
    }

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
 */
export function useBatchWorkerCalculation(
  entries: TimeEntry[],
  filter: FilterType = 'month'
): UseBatchWorkerCalculationReturn {
  const { result, isLoading, error } = useWorkerCalculation(entries, 'batch', filter)

  const batchResult = result as BatchResult | null

  return {
    statistics: batchResult?.statistics || null,
    bestWeekday: batchResult?.bestWeekday || null,
    peakProductivity: batchResult?.peakProductivity || null,
    isLoading,
    error,
  }
}
