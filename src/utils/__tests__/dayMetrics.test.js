/**
 * ✅ ТЕСТЫ: Тесты для dayMetrics.js
 */

import { describe, it, expect } from 'vitest'
import {
  formatHoursToTime,
  calculateLongestSession,
  calculateTotalBreaks,
  calculateLongestBreak,
  calculateAverageRate,
  getDayStatus,
  getDayMetrics,
} from '../dayMetrics'

describe('dayMetrics', () => {
  describe('formatHoursToTime', () => {
    it('should format hours to time string', () => {
      expect(formatHoursToTime(2.5)).toBe('2:30')
      expect(formatHoursToTime(1)).toBe('1:00')
      expect(formatHoursToTime(0.5)).toBe('0:30')
      expect(formatHoursToTime(8.25)).toBe('8:15')
    })

    it('should handle zero hours', () => {
      expect(formatHoursToTime(0)).toBe('0:00')
    })

    it('should handle fractional hours', () => {
      expect(formatHoursToTime(0.1)).toBe('0:06')
      expect(formatHoursToTime(0.75)).toBe('0:45')
    })
  })

  describe('calculateLongestSession', () => {
    it('should return 0:00 when entries are empty', () => {
      expect(calculateLongestSession([])).toBe('0:00')
    })

    it('should return 0:00 when entries is null', () => {
      expect(calculateLongestSession(null)).toBe('0:00')
    })

    it('should calculate longest session from duration field', () => {
      const entries = [
        { duration: 2 },
        { duration: 5 },
        { duration: 3 },
      ]

      expect(calculateLongestSession(entries)).toBe('5:00')
    })

    it('should calculate longest session from start/end', () => {
      const entries = [
        { start: '09:00', end: '10:00' },
        { start: '14:00', end: '17:00' },
      ]

      const result = calculateLongestSession(entries)
      expect(result).toBe('3:00')
    })

    it('should prioritize duration field over start/end', () => {
      const entries = [
        { start: '09:00', end: '10:00', duration: 5 },
        { start: '14:00', end: '17:00', duration: 2 },
      ]

      expect(calculateLongestSession(entries)).toBe('5:00')
    })
  })

  describe('calculateTotalBreaks', () => {
    it('should return 0:00 when entries are empty', () => {
      expect(calculateTotalBreaks([])).toBe('0:00')
    })

    it('should return 0:00 when single entry', () => {
      expect(calculateTotalBreaks([{ start: '09:00', end: '10:00' }])).toBe('0:00')
    })

    it('should calculate total breaks between entries', () => {
      const entries = [
        { start: '09:00', end: '10:00' },
        { start: '11:00', end: '12:00' },
      ]

      const result = calculateTotalBreaks(entries)
      expect(result).toBe('1:00')
    })

    it('should handle entries without start/end', () => {
      const entries = [
        { start: '09:00', end: '10:00' },
        {},
        { start: '11:00', end: '12:00' },
      ]

      expect(() => calculateTotalBreaks(entries)).not.toThrow()
    })
  })

  describe('calculateLongestBreak', () => {
    it('should return 0:00 when entries are empty', () => {
      expect(calculateLongestBreak([])).toBe('0:00')
    })

    it('should return 0:00 when single entry', () => {
      expect(calculateLongestBreak([{ start: '09:00', end: '10:00' }])).toBe('0:00')
    })

    it('should find longest break', () => {
      const entries = [
        { start: '09:00', end: '10:00' },
        { start: '11:00', end: '12:00' },
        { start: '15:00', end: '16:00' },
      ]

      const result = calculateLongestBreak(entries)
      expect(result).toBe('3:00')
    })
  })

  describe('calculateAverageRate', () => {
    it('should return 0 when entries are empty', () => {
      expect(calculateAverageRate([])).toBe(0)
    })

    it('should calculate average rate', () => {
      const entries = [
        { earned: 2000, duration: 2 }, // rate = 1000
        { earned: 6000, duration: 3 }, // rate = 2000
      ]

      const result = calculateAverageRate(entries)
      expect(result).toBeGreaterThan(0)
      // Средняя ставка = (2000 + 6000) / (2 + 3) = 1600
      expect(result).toBe(1600)
    })

    it('should handle entries without rate', () => {
      const entries = [
        { rate: 1000, duration: 2 },
        { duration: 3 },
      ]

      const result = calculateAverageRate(entries)
      expect(result).toBeGreaterThanOrEqual(0)
    })
  })

  describe('getDayStatus', () => {
    it('should return null status when plan is zero', () => {
      const result = getDayStatus(1000, 0)
      expect(result.status).toBeNull()
      expect(result.color).toBeNull()
    })

    it('should return success status when plan is met', () => {
      const result = getDayStatus(10000, 10000)
      expect(result.status).toBe('success')
      expect(result.color).toBe('green')
      expect(result.percent).toBeGreaterThanOrEqual(100)
    })

    it('should return warning status when plan is partially met', () => {
      const result = getDayStatus(5000, 10000)
      expect(result.status).toBe('warning')
      expect(result.color).toBe('yellow')
      expect(result.percent).toBeGreaterThanOrEqual(50)
      expect(result.percent).toBeLessThan(100)
    })

    it('should return danger status when plan is not met', () => {
      const result = getDayStatus(2000, 10000)
      expect(result.status).toBe('danger')
      expect(result.color).toBe('red')
      expect(result.percent).toBeLessThan(50)
    })
  })

  describe('getDayMetrics', () => {
    it('should return default metrics when entries are empty', () => {
      const result = getDayMetrics([])
      expect(result.longestSession).toBe('0:00')
      expect(result.totalWorkTime).toBe('0:00')
      expect(result.totalBreaks).toBe('0:00')
      expect(result.averageRate).toBe(0)
      expect(result.totalEarned).toBe(0)
    })

    it('should calculate all metrics with entries', () => {
      const entries = [
        { start: '09:00', end: '10:00', earned: 1000, duration: 1 },
        { start: '14:00', end: '17:00', earned: 3000, duration: 3 },
      ]

      const result = getDayMetrics(entries)
      expect(result.longestSession).toBeDefined()
      expect(result.totalWorkTime).toBeDefined()
      expect(result.averageRate).toBeGreaterThan(0)
      expect(result.totalEarned).toBe(4000)
    })

    it('should include status when plan is provided', () => {
      const entries = [
        { start: '09:00', end: '10:00', earned: 5000, duration: 1 },
      ]

      const result = getDayMetrics(entries, 10000)
      expect(result.status).toBeDefined()
      expect(result.status.status).toBe('warning')
    })
  })
})

