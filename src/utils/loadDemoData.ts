/**
 * Утилита для загрузки демонстрационных тестовых данных
 */

import { calculateDuration } from './calculations'
import { logger } from './logger'
import type { TimeEntry } from '../types'

interface RawDemoEntry {
  id?: string
  date: string
  start?: string
  end?: string
  category?: string
  categoryId?: string
  rate?: string | number
  earned?: string | number
  duration?: string | number
  breakMinutes?: number
  breakAfter?: string
  description?: string
  createdAt?: string
  updatedAt?: string
}

interface DemoDataResponse {
  entries: RawDemoEntry[]
}

// Демо запись расширяет TimeEntry с обязательным маркером
type ProcessedDemoEntry = TimeEntry & {
  _isDemoData: boolean
}

/**
 * Загружает и обрабатывает тестовые демонстрационные данные
 */
export async function loadDemoData(): Promise<TimeEntry[]> {
  try {
    const cacheBuster = `?v=${import.meta.env.VITE_BUILD_VERSION || Date.now()}`
    const response = await fetch(`/test-data-sample.json${cacheBuster}`, {
      cache: 'no-store'
    })

    if (!response.ok) {
      throw new Error(`Не удалось загрузить тестовые данные: ${response.status}`)
    }

    const data: DemoDataResponse = await response.json()
    const rawEntries = data.entries || []

    logger.log('📥 Загружено тестовых записей:', rawEntries.length)

    const processedEntries = rawEntries.map((entry, index) => {
      const category = entry.categoryId || entry.category || 'remix'

      let duration: string | number = entry.duration || '0.00'
      if (!entry.duration && entry.start && entry.end) {
        duration = calculateDuration(entry.start, entry.end)
      }

      if (typeof duration === 'number') {
        duration = duration.toFixed(2)
      }

      let {breakMinutes} = entry
      if (!breakMinutes && entry.breakAfter) {
        const [hours, minutes] = entry.breakAfter.split(':').map(Number)
        breakMinutes = hours * 60 + minutes
      }

      const processedEntry = {
        id: entry.id || `demo-${Date.now()}-${index}`,
        date: entry.date,
        start: entry.start || '',
        end: entry.end || '',
        category,
        categoryId: category,
        rate: entry.rate ? parseFloat(String(entry.rate)) : 0,
        earned: entry.earned ? parseFloat(String(entry.earned)) : 0,
        duration,
        ...(breakMinutes !== undefined && { breakMinutes }),
        ...(entry.breakAfter && { breakAfter: entry.breakAfter }),
        ...(entry.description && { description: entry.description }),
        _isDemoData: true,
        createdAt: entry.createdAt || new Date(entry.date).toISOString(),
        updatedAt: entry.updatedAt || new Date().toISOString(),
      } as TimeEntry

      return processedEntry
    })

    logger.log('✅ Обработано тестовых записей:', processedEntries.length)

    return processedEntries
  } catch (error) {
    logger.error('❌ Ошибка загрузки тестовых данных:', error)
    throw error
  }
}
