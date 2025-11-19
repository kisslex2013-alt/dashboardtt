/**
 * 📊 Хук для вычисления статистики из записей времени
 *
 * Оптимизированный хук с мемоизацией для вычисления статистики:
 * - Общие часы и заработок
 * - Средняя ставка
 * - Количество рабочих дней
 * - Перерывы между сессиями
 * - Выходные дни
 *
 * Автоматически использует Web Workers для больших объемов данных (>500 записей)
 *
 * @example
 * ```tsx
 * const stats = useStatistics(entries, 'month')
 * // { totalHours: 160, totalEarned: 8000, avgRate: 50, daysWorked: 20, ... }
 * ```
 */

import { useMemo } from 'react'
import { calculateDuration } from '../utils/calculations'
import { timeToMinutes } from '../utils/dateHelpers'
import { useWorkerCalculation } from './useWorkerCalculation'
import type { TimeEntry } from '../types'

/**
 * Тип периода для фильтрации
 */
export type PeriodFilter = 'today' | 'week' | 'month' | 'year' | 'all' | 'custom'

/**
 * Результат вычисления статистики
 */
export interface StatisticsResult {
  totalHours: number
  totalEarned: number
  avgRate: number
  daysWorked: number
  totalBreaks: number
  daysOff: number
}

/**
 * Опции для хука useStatistics
 */
export interface UseStatisticsOptions {
  /** Период фильтрации */
  periodFilter?: PeriodFilter
  /** Начальная дата для кастомного периода */
  customDateFrom?: string | null
  /** Конечная дата для кастомного периода */
  customDateTo?: string | null
  /** Порог для использования Web Worker (по умолчанию 500) */
  workerThreshold?: number
}

/**
 * Фильтрует записи по заданному периоду
 *
 * @param entries - Массив записей времени
 * @param filter - Тип фильтра периода
 * @param dateFrom - Начальная дата (для custom периода)
 * @param dateTo - Конечная дата (для custom периода)
 * @returns Отфильтрованный массив записей
 */
function filterEntriesByPeriod(
  entries: TimeEntry[],
  filter: PeriodFilter,
  dateFrom: string | null = null,
  dateTo: string | null = null
): TimeEntry[] {
  const now = new Date()

  return entries.filter(entry => {
    const entryDate = new Date(entry.date)

    switch (filter) {
      case 'today': {
        return entryDate.toDateString() === now.toDateString()
      }

      case 'week': {
        const startOfWeek = new Date(now)
        startOfWeek.setDate(now.getDate() - now.getDay() + 1) // Понедельник
        startOfWeek.setHours(0, 0, 0, 0)
        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(startOfWeek.getDate() + 6)
        endOfWeek.setHours(23, 59, 59, 999)
        return entryDate >= startOfWeek && entryDate <= endOfWeek
      }

      case 'month': {
        return (
          entryDate.getFullYear() === now.getFullYear() && entryDate.getMonth() === now.getMonth()
        )
      }

      case 'year': {
        return entryDate.getFullYear() === now.getFullYear()
      }

      case 'custom': {
        if (!dateFrom || !dateTo) return true
        const from = new Date(dateFrom)
        from.setHours(0, 0, 0, 0)
        const to = new Date(dateTo)
        to.setHours(23, 59, 59, 999)
        return entryDate >= from && entryDate <= to
      }

      default:
        return true
    }
  })
}

/**
 * Рассчитывает детальную статистику для массива записей
 *
 * @param entries - Массив записей времени
 * @param filter - Тип фильтра периода (для расчета выходных дней)
 * @param customDateFrom - Начальная дата для кастомного периода
 * @param customDateTo - Конечная дата для кастомного периода
 * @returns Объект со статистикой
 */
function calculateDetailedStats(
  entries: TimeEntry[],
  filter: PeriodFilter,
  customDateFrom: string | null = null,
  customDateTo: string | null = null
): StatisticsResult {
  if (entries.length === 0) {
    return {
      totalHours: 0,
      totalEarned: 0,
      avgRate: 0,
      daysWorked: 0,
      totalBreaks: 0,
      daysOff: 0,
    }
  }

  // Общие часы и заработок
  const totalHours = entries.reduce((sum, e) => {
    if (!e.start || !e.end) return sum
    return sum + parseFloat(String(calculateDuration(e.start, e.end)))
  }, 0)

  const totalEarned = entries.reduce((sum, e) => sum + (parseFloat(String(e.earned)) || 0), 0)

  // Расчет перерывов между сессиями
  const breaksByDay = entries.reduce((acc, entry) => {
    if (!acc[entry.date]) {
      acc[entry.date] = []
    }
    acc[entry.date].push(entry)
    return acc
  }, {} as Record<string, TimeEntry[]>)

  let totalBreakMinutes = 0
  Object.values(breaksByDay).forEach(dayEntries => {
    const sorted = [...dayEntries].sort((a, b) => a.start.localeCompare(b.start))
    for (let i = 1; i < sorted.length; i++) {
      const prevEnd = timeToMinutes(sorted[i - 1].end)
      const currentStart = timeToMinutes(sorted[i].start)
      const breakMinutes = (currentStart + 24 * 60 - prevEnd) % (24 * 60)
      if (breakMinutes > 0 && breakMinutes < 12 * 60) {
        // Игнорируем перерывы > 12 часов
        totalBreakMinutes += breakMinutes
      }
    }
  })

  // Вычисляем рабочие дни (уникальные даты с записями)
  const workedDays = new Set(entries.map(e => e.date))
  const daysWorked = workedDays.size

  // Вычисляем выходные дни (дни БЕЗ записей в периоде)
  let daysOff = 0
  const now = new Date()

  if (filter === 'today') {
    daysOff = entries.length === 0 ? 1 : 0
  } else if (filter === 'week') {
    // Текущая неделя (понедельник-воскресенье)
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay() + 1)
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]
      if (!workedDays.has(dateStr)) {
        daysOff++
      }
    }
  } else if (filter === 'month') {
    // Текущий месяц
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(now.getFullYear(), now.getMonth(), i)
      const dateStr = date.toISOString().split('T')[0]
      if (!workedDays.has(dateStr)) {
        daysOff++
      }
    }
  } else if (filter === 'year') {
    // Текущий год
    const startOfYear = new Date(now.getFullYear(), 0, 1)
    const endOfYear = new Date(now.getFullYear(), 11, 31)
    const daysInYear = Math.ceil((endOfYear.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)) + 1
    for (let i = 0; i < daysInYear; i++) {
      const date = new Date(startOfYear)
      date.setDate(startOfYear.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]
      if (!workedDays.has(dateStr)) {
        daysOff++
      }
    }
  } else if (filter === 'custom' && customDateFrom && customDateTo) {
    // Кастомный период
    const from = new Date(customDateFrom)
    const to = new Date(customDateTo)
    const daysInRange = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1
    for (let i = 0; i < daysInRange; i++) {
      const date = new Date(from)
      date.setDate(from.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]
      if (!workedDays.has(dateStr)) {
        daysOff++
      }
    }
  } else {
    // Все время
    if (entries.length > 0) {
      const firstDate = new Date(Math.min(...entries.map(e => new Date(e.date).getTime())))
      const today = new Date()
      const daysInRange = Math.ceil((today.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
      for (let i = 0; i < daysInRange; i++) {
        const date = new Date(firstDate)
        date.setDate(firstDate.getDate() + i)
        const dateStr = date.toISOString().split('T')[0]
        if (!workedDays.has(dateStr) && date <= today) {
          daysOff++
        }
      }
    }
  }

  return {
    totalHours,
    totalEarned,
    avgRate: totalHours > 0 ? totalEarned / totalHours : 0,
    daysWorked,
    totalBreaks: totalBreakMinutes / 60,
    daysOff,
  }
}

/**
 * Хук для вычисления статистики из записей времени
 *
 * Автоматически использует Web Workers для больших объемов данных (>500 записей по умолчанию)
 * для предотвращения блокировки UI потока.
 *
 * @param entries - Массив записей времени
 * @param options - Опции для вычисления статистики
 * @returns Объект со статистикой и состоянием загрузки
 *
 * @example
 * ```tsx
 * const { stats, isLoading } = useStatistics(entries, {
 *   periodFilter: 'month',
 *   customDateFrom: '2025-01-01',
 *   customDateTo: '2025-01-31'
 * })
 * ```
 */
export function useStatistics(
  entries: TimeEntry[],
  options: UseStatisticsOptions = {}
): {
  stats: StatisticsResult
  isLoading: boolean
} {
  const {
    periodFilter = 'month',
    customDateFrom = null,
    customDateTo = null,
    workerThreshold = 500,
  } = options

  // Мемоизируем отфильтрованные записи
  const filtered = useMemo(
    () => filterEntriesByPeriod(entries, periodFilter, customDateFrom, customDateTo),
    [entries, periodFilter, customDateFrom, customDateTo]
  )

  // Определяем, нужно ли использовать Web Worker
  const shouldUseWorker = filtered.length > workerThreshold

  // Используем Web Worker для тяжелых вычислений
  const { result: workerStats, isLoading: workerLoading } = useWorkerCalculation(
    shouldUseWorker ? filtered : [],
    'statistics',
    periodFilter
  )

  // Вычисляем статистику (синхронно или из worker)
  const stats = useMemo(() => {
    if (shouldUseWorker) {
      return (
        (workerStats as StatisticsResult | null) || {
          totalHours: 0,
          totalEarned: 0,
          avgRate: 0,
          daysWorked: 0,
          totalBreaks: 0,
          daysOff: 0,
        }
      )
    } else {
      return calculateDetailedStats(filtered, periodFilter, customDateFrom, customDateTo)
    }
  }, [shouldUseWorker, workerStats, filtered, periodFilter, customDateFrom, customDateTo])

  return {
    stats,
    isLoading: shouldUseWorker ? workerLoading : false,
  }
}

/**
 * Упрощенная версия хука для базовой статистики (часы, заработок, средняя ставка)
 *
 * @param entries - Массив записей времени
 * @returns Базовая статистика
 *
 * @example
 * ```tsx
 * const basicStats = useBasicStatistics(entries)
 * // { totalHours: 160, totalEarned: 8000, avgRate: 50, entriesCount: 20 }
 * ```
 */
export function useBasicStatistics(entries: TimeEntry[]): {
  totalHours: number
  totalEarned: number
  avgRate: number
  entriesCount: number
} {
  return useMemo(() => {
    if (entries.length === 0) {
      return {
        totalHours: 0,
        totalEarned: 0,
        avgRate: 0,
        entriesCount: 0,
      }
    }

    const totalHours = entries.reduce((sum, e) => {
      if (!e.start || !e.end) return sum
      return sum + parseFloat(String(calculateDuration(e.start, e.end)))
    }, 0)

    const totalEarned = entries.reduce((sum, e) => sum + (parseFloat(String(e.earned)) || 0), 0)
    const avgRate = totalHours > 0 ? totalEarned / totalHours : 0

    return {
      totalHours,
      totalEarned,
      avgRate,
      entriesCount: entries.length,
    }
  }, [entries])
}

