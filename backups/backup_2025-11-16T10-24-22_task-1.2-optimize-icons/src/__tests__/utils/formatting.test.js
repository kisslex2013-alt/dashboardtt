import { describe, it, expect } from 'vitest'
import {
  formatHoursToTime,
  formatDuration,
  formatEarned,
  formatRate,
  formatCurrency,
  formatRateWithUnit,
} from '../../utils/formatting'

describe('formatting', () => {
  describe('formatHoursToTime', () => {
    it('should format hours correctly', () => {
      expect(formatHoursToTime(5.5)).toBe('5:30')
      expect(formatHoursToTime(0.25)).toBe('0:15')
      expect(formatHoursToTime(8)).toBe('8:00')
    })

    it('should handle zero', () => {
      expect(formatHoursToTime(0)).toBe('0:00')
    })

    it('should handle negative values', () => {
      expect(formatHoursToTime(-5.5)).toBe('5:30')
    })
  })

  describe('formatDuration', () => {
    it('should format duration correctly', () => {
      expect(formatDuration(5.5)).toBe('5.50')
      expect(formatDuration('8.333')).toBe('8.33')
      expect(formatDuration(0)).toBe('0.00')
    })

    it('should handle string inputs', () => {
      expect(formatDuration('3.5')).toBe('3.50')
    })
  })

  describe('formatEarned', () => {
    it('should round earned correctly', () => {
      expect(formatEarned(1234.56)).toBe(1235)
      expect(formatEarned('999.99')).toBe(1000)
      expect(formatEarned(0)).toBe(0)
    })
  })

  describe('formatRate', () => {
    it('should round rate correctly', () => {
      expect(formatRate(1234.56)).toBe(1235)
      expect(formatRate('999.99')).toBe(1000)
    })
  })

  describe('formatCurrency', () => {
    it('should format currency correctly', () => {
      expect(formatCurrency(1234.56)).toBe('1235 ₽')
      expect(formatCurrency(999.99, '$')).toBe('1000 $')
    })
  })

  describe('formatRateWithUnit', () => {
    it('should format rate with unit correctly', () => {
      expect(formatRateWithUnit(1234.56)).toBe('1235 ₽/ч')
      expect(formatRateWithUnit(999.99, '$')).toBe('1000 $/ч')
    })
  })
})
