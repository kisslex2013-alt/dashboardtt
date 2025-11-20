/**
 * ✅ ТЕСТЫ: Тесты для insightsCalculations.js
 */

import { describe, it, expect } from 'vitest'
import {
  calculateBestWeekday,
  calculatePeakProductivity,
  calculateEarningsTrend,
  calculateLongestSession,
} from '../insightsCalculations'

describe('insightsCalculations', () => {
  describe('calculateBestWeekday', () => {
    it('should return default when entries are empty', () => {
      const result = calculateBestWeekday([])
      expect(result.day).toBe('Пн')
      expect(result.avg).toBe(0)
    })

    it('should return default when entries is null', () => {
      const result = calculateBestWeekday(null)
      expect(result.day).toBe('Пн')
      expect(result.avg).toBe(0)
    })

    it('should calculate best weekday by average earnings', () => {
      const entries = [
        { date: '2025-11-17', earned: 1000 }, // Понедельник
        { date: '2025-11-18', earned: 2000 }, // Вторник
        { date: '2025-11-19', earned: 1500 }, // Среда
        { date: '2025-11-20', earned: 3000 }, // Четверг
        { date: '2025-11-21', earned: 2500 }, // Пятница
      ]

      const result = calculateBestWeekday(entries)
      expect(result.day).toBeDefined()
      expect(result.avg).toBeGreaterThan(0)
    })

    it('should handle entries with same date', () => {
      const entries = [
        { date: '2025-11-17', earned: 500 },
        { date: '2025-11-17', earned: 1000 },
      ]

      const result = calculateBestWeekday(entries)
      expect(result.day).toBeDefined()
      expect(result.avg).toBe(1500)
    })

    it('should handle entries without earned field', () => {
      const entries = [
        { date: '2025-11-17' },
        { date: '2025-11-18', earned: 1000 },
      ]

      const result = calculateBestWeekday(entries)
      expect(result.day).toBeDefined()
      expect(result.avg).toBeGreaterThanOrEqual(0)
    })
  })

  describe('calculatePeakProductivity', () => {
    it('should return default when entries are empty', () => {
      const result = calculatePeakProductivity([])
      expect(result.start).toBe('09')
      expect(result.end).toBe('10')
      expect(result.rate).toBe(0)
    })

    it('should return default when entries is null', () => {
      const result = calculatePeakProductivity(null)
      expect(result.start).toBe('09')
      expect(result.end).toBe('10')
      expect(result.rate).toBe(0)
    })

    it('should calculate peak productivity hour', () => {
      const entries = [
        {
          start: '09:00',
          end: '10:00',
          earned: 1000,
        },
        {
          start: '14:00',
          end: '15:00',
          earned: 2000,
        },
      ]

      const result = calculatePeakProductivity(entries)
      expect(result.start).toBeDefined()
      expect(result.end).toBeDefined()
      expect(result.rate).toBeGreaterThanOrEqual(0)
    })

    it('should handle entries without start/end', () => {
      const entries = [
        { earned: 1000 },
        { start: '09:00', end: '10:00', earned: 2000 },
      ]

      const result = calculatePeakProductivity(entries)
      expect(result.start).toBeDefined()
      expect(result.end).toBeDefined()
    })

    it('should handle entries with zero duration', () => {
      const entries = [
        {
          start: '09:00',
          end: '09:00',
          earned: 1000,
        },
      ]

      const result = calculatePeakProductivity(entries)
      expect(result.start).toBe('09')
      expect(result.end).toBe('10')
      expect(result.rate).toBe(0)
    })
  })

  describe('calculateEarningsTrend', () => {
    it('should return default when entries are empty', () => {
      const result = calculateEarningsTrend([])
      expect(result.trend).toBe('недостаточно данных')
      expect(result.change).toBe(0)
    })

    it('should return default when entries less than 7', () => {
      const entries = [
        { date: '2025-11-10', earned: 1000 },
        { date: '2025-11-11', earned: 1500 },
      ]

      const result = calculateEarningsTrend(entries)
      expect(result.trend).toBe('недостаточно данных')
      expect(result.change).toBe(0)
    })

    it('should calculate trend with enough data', () => {
      // Создаем записи за последний месяц (минимум 7)
      const today = new Date()
      const entries = []
      for (let i = 0; i < 10; i++) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        entries.push({
          date: date.toISOString().split('T')[0],
          earned: 1000 + i * 100,
        })
      }

      const result = calculateEarningsTrend(entries)
      expect(result.trend).toBeDefined()
      expect(['растёт', 'падает', 'стабилен', 'недостаточно данных']).toContain(result.trend)
      expect(result.change).toBeDefined()
    })
  })

  describe('calculateLongestSession', () => {
    it('should return null when entries are empty', () => {
      const result = calculateLongestSession([])
      expect(result).toBeNull()
    })

    it('should return null when entries is null', () => {
      const result = calculateLongestSession(null)
      expect(result).toBeNull()
    })

    it('should find longest session', () => {
      const entries = [
        {
          date: '2025-11-17',
          start: '09:00',
          end: '10:00',
          earned: 1000,
        },
        {
          date: '2025-11-17',
          start: '14:00',
          end: '17:00',
          earned: 2000,
        },
      ]

      const result = calculateLongestSession(entries)
      expect(result).not.toBeNull()
      expect(result.date).toBeDefined()
      expect(result.start).toBeDefined()
      expect(result.end).toBeDefined()
      expect(result.duration).toBeGreaterThan(0)
    })

    it('should handle entries without start/end', () => {
      const entries = [
        {
          date: '2025-11-17',
          earned: 1000,
        },
        {
          date: '2025-11-17',
          start: '14:00',
          end: '17:00',
          earned: 2000,
        },
      ]

      const result = calculateLongestSession(entries)
      expect(result).not.toBeNull()
      expect(result.start).toBe('14:00')
      expect(result.end).toBe('17:00')
    })
  })
})

