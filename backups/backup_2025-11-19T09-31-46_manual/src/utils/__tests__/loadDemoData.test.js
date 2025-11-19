/**
 * ✅ ТЕСТЫ: Тесты для loadDemoData.js
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { loadDemoData } from '../loadDemoData'

// Мокаем logger
vi.mock('../logger', () => ({
  logger: {
    log: vi.fn(),
    error: vi.fn(),
  },
}))

// Мокаем calculations
vi.mock('../calculations', () => ({
  calculateDuration: vi.fn((start, end) => {
    const [startH, startM] = start.split(':').map(Number)
    const [endH, endM] = end.split(':').map(Number)
    const startMinutes = startH * 60 + startM
    const endMinutes = endH * 60 + endM
    const minutes = endMinutes >= startMinutes ? endMinutes - startMinutes : 24 * 60 - startMinutes + endMinutes
    return (minutes / 60).toFixed(2)
  }),
}))

describe('loadDemoData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should load and process demo data', async () => {
    const mockData = {
      entries: [
        {
          id: '1',
          date: '2025-11-17',
          start: '09:00',
          end: '17:00',
          categoryId: 'remix',
          rate: 1000,
          earned: 8000,
        },
      ],
    }

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockData),
      })
    )

    const result = await loadDemoData()

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
    expect(result[0].category).toBe('remix')
    expect(result[0]._isDemoData).toBe(true)
  })

  it('should calculate duration from start/end if missing', async () => {
    const mockData = {
      entries: [
        {
          id: '1',
          date: '2025-11-17',
          start: '09:00',
          end: '17:00',
          categoryId: 'remix',
        },
      ],
    }

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockData),
      })
    )

    const result = await loadDemoData()

    expect(result[0].duration).toBeDefined()
    expect(result[0].duration).not.toBe('')
  })

  it('should handle entries without categoryId', async () => {
    const mockData = {
      entries: [
        {
          id: '1',
          date: '2025-11-17',
          start: '09:00',
          end: '17:00',
          category: 'work',
        },
      ],
    }

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockData),
      })
    )

    const result = await loadDemoData()

    expect(result[0].category).toBe('work')
  })

  it('should use default category when missing', async () => {
    const mockData = {
      entries: [
        {
          id: '1',
          date: '2025-11-17',
          start: '09:00',
          end: '17:00',
        },
      ],
    }

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockData),
      })
    )

    const result = await loadDemoData()

    expect(result[0].category).toBe('remix')
  })

  it('should handle breakMinutes and breakAfter', async () => {
    const mockData = {
      entries: [
        {
          id: '1',
          date: '2025-11-17',
          start: '09:00',
          end: '17:00',
          breakMinutes: 30,
          breakAfter: '12:00',
        },
      ],
    }

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockData),
      })
    )

    const result = await loadDemoData()

    expect(result[0].breakMinutes).toBe(30)
    expect(result[0].breakAfter).toBe('12:00')
  })

  it('should convert breakAfter to breakMinutes', async () => {
    const mockData = {
      entries: [
        {
          id: '1',
          date: '2025-11-17',
          start: '09:00',
          end: '17:00',
          breakAfter: '1:30',
        },
      ],
    }

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockData),
      })
    )

    const result = await loadDemoData()

    expect(result[0].breakMinutes).toBe(90) // 1 час 30 минут = 90 минут
  })

  it('should generate ID if missing', async () => {
    const mockData = {
      entries: [
        {
          date: '2025-11-17',
          start: '09:00',
          end: '17:00',
        },
      ],
    }

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockData),
      })
    )

    const result = await loadDemoData()

    expect(result[0].id).toBeDefined()
    expect(result[0].id).toContain('demo-')
  })

  it('should handle empty entries array', async () => {
    const mockData = {
      entries: [],
    }

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockData),
      })
    )

    const result = await loadDemoData()

    expect(result).toEqual([])
  })

  it('should handle fetch error', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 404,
      })
    )

    await expect(loadDemoData()).rejects.toThrow('Не удалось загрузить тестовые данные')
  })

  it('should handle network error', async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error('Network error')))

    await expect(loadDemoData()).rejects.toThrow()
  })
})

