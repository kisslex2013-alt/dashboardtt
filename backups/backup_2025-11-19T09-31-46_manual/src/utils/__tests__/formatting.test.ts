/**
 * ✅ ТЕСТЫ: Тесты для утилит форматирования
 */

import { describe, it, expect } from 'vitest'
import {
  formatHoursToTime,
  formatDuration,
  formatEarned,
  formatRate,
  formatRateWithUnit,
  formatCurrency,
} from '../formatting'

describe('formatting', () => {
  describe('formatHoursToTime', () => {
    it('should format hours to H:MM format', () => {
      expect(formatHoursToTime(5.5)).toBe('5:30')
      expect(formatHoursToTime(0.25)).toBe('0:15')
      expect(formatHoursToTime(8.75)).toBe('8:45')
      expect(formatHoursToTime(0)).toBe('0:00')
    })

    it('should handle negative values', () => {
      expect(formatHoursToTime(-5.5)).toBe('5:30')
      expect(formatHoursToTime(-0.25)).toBe('0:15')
    })

    it('should handle null and undefined', () => {
      expect(formatHoursToTime(null)).toBe('0:00')
      expect(formatHoursToTime(undefined)).toBe('0:00')
    })

    it('should handle edge cases', () => {
      expect(formatHoursToTime(0.01)).toBe('0:01')
      expect(formatHoursToTime(23.99)).toBe('23:59')
      expect(formatHoursToTime(100.5)).toBe('100:30')
    })
  })

  describe('formatDuration', () => {
    it('should format duration with 2 decimal places', () => {
      expect(formatDuration(5.5)).toBe('5.50')
      expect(formatDuration(8.333)).toBe('8.33')
      expect(formatDuration(0)).toBe('0.00')
    })

    it('should handle string input', () => {
      expect(formatDuration('8.333')).toBe('8.33')
      expect(formatDuration('5.5')).toBe('5.50')
      expect(formatDuration('0')).toBe('0.00')
    })

    it('should handle null and undefined', () => {
      expect(formatDuration(null)).toBe('0.00')
      expect(formatDuration(undefined)).toBe('0.00')
    })

    it('should handle zero', () => {
      expect(formatDuration(0)).toBe('0.00')
      expect(formatDuration('0')).toBe('0.00')
    })
  })

  describe('formatEarned', () => {
    it('should format earned amount rounded to integer', () => {
      expect(formatEarned(1234.56)).toBe(1235)
      expect(formatEarned(1000.49)).toBe(1000)
      expect(formatEarned(0)).toBe(0)
    })

    it('should handle string input', () => {
      expect(formatEarned('1234.56')).toBe(1235)
      expect(formatEarned('1000')).toBe(1000)
    })

    it('should handle null and undefined', () => {
      expect(formatEarned(null)).toBe(0)
      expect(formatEarned(undefined)).toBe(0)
    })

    it('should handle large numbers', () => {
      expect(formatEarned(999999.99)).toBe(1000000)
      expect(formatEarned(1000000)).toBe(1000000)
    })
  })

  describe('formatRate', () => {
    it('should format rate rounded to integer', () => {
      expect(formatRate(1000.5)).toBe(1001)
      expect(formatRate(50.123)).toBe(50)
      expect(formatRate(0)).toBe(0)
    })

    it('should handle string input', () => {
      expect(formatRate('1000.5')).toBe(1001)
      expect(formatRate('50')).toBe(50)
    })

    it('should handle null and undefined', () => {
      expect(formatRate(null)).toBe(0)
      expect(formatRate(undefined)).toBe(0)
    })
  })

  describe('formatRateWithUnit', () => {
    it('should format rate with unit', () => {
      expect(formatRateWithUnit(1000, '₽')).toBe('1000 ₽/ч')
      expect(formatRateWithUnit(50.5, '$')).toBe('51 $/ч')
      expect(formatRateWithUnit(0, '€')).toBe('0 €/ч')
    })

    it('should handle string input', () => {
      expect(formatRateWithUnit('1000', '₽')).toBe('1000 ₽/ч')
      expect(formatRateWithUnit('50.5', '$')).toBe('51 $/ч')
    })

    it('should handle null and undefined', () => {
      expect(formatRateWithUnit(null, '₽')).toBe('0 ₽/ч')
      expect(formatRateWithUnit(undefined, '$')).toBe('0 $/ч')
    })
  })

  describe('formatCurrency', () => {
    it('should format currency with default symbol', () => {
      expect(formatCurrency(1234.56)).toBe('1235 ₽')
      expect(formatCurrency(1000)).toBe('1000 ₽')
      expect(formatCurrency(0)).toBe('0 ₽')
    })

    it('should format currency with custom symbol', () => {
      expect(formatCurrency(1234.56, '$')).toBe('1235 $')
      expect(formatCurrency(1000, '€')).toBe('1000 €')
    })

    it('should handle string input', () => {
      expect(formatCurrency('1234.56', '$')).toBe('1235 $')
      expect(formatCurrency('1000', '€')).toBe('1000 €')
    })

    it('should handle null and undefined', () => {
      expect(formatCurrency(null)).toBe('0 ₽')
      expect(formatCurrency(undefined)).toBe('0 ₽')
    })
  })
})

