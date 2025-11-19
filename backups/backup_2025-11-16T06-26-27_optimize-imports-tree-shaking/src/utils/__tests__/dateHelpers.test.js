/**
 * вњ… РўР•РЎРўР«: РўРµСЃС‚С‹ РґР»СЏ СѓС‚РёР»РёС‚ СЂР°Р±РѕС‚С‹ СЃ РґР°С‚Р°РјРё
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  formatDate,
  formatTime,
  formatDateTime,
  formatRelativeDate,
  getTodayString,
  formatDateShort,
  safeParseDate,
  getTodayRange,
  getYesterdayRange,
  getCurrentWeekRange,
  getCurrentMonthRange,
  getCurrentYearRange,
} from '../dateHelpers'

describe('dateHelpers', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-11-08T12:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('formatDate', () => {
    it('should format Date object to YYYY-MM-DD', () => {
      const date = new Date('2025-11-08')
      expect(formatDate(date)).toBe('2025-11-08')
    })

    it('should format date string to YYYY-MM-DD', () => {
      expect(formatDate('2025-11-08')).toBe('2025-11-08')
    })

    it('should return empty string for invalid date', () => {
      expect(formatDate('invalid')).toBe('')
      expect(formatDate(null)).toBe('')
      expect(formatDate(undefined)).toBe('')
    })
  })

  describe('formatTime', () => {
    it('should format time to HH:MM', () => {
      const date = new Date('2025-11-08T14:30:00')
      expect(formatTime(date)).toBe('14:30')
    })

    it('should format time string', () => {
      expect(formatTime('2025-11-08T14:30:00')).toBe('14:30')
    })

    it('should return empty string for invalid time', () => {
      expect(formatTime('invalid')).toBe('')
    })
  })

  describe('formatDateTime', () => {
    it('should format date and time with default format', () => {
      const date = new Date('2025-11-08T14:30:00')
      const result = formatDateTime(date)
      expect(result).toContain('08.11.2025')
      expect(result).toContain('14:30')
    })

    it('should use custom format', () => {
      const date = new Date('2025-11-08T14:30:00')
      expect(formatDateTime(date, 'yyyy-MM-dd')).toBe('2025-11-08')
    })
  })

  describe('formatRelativeDate', () => {
    it('should return today for today', () => {
      const today = new Date('2025-11-08T12:00:00')
      expect(formatRelativeDate(today)).toBe('сегодня')
    })

    it('should return yesterday for yesterday', () => {
      const yesterday = new Date('2025-11-07T12:00:00')
      expect(formatRelativeDate(yesterday)).toBe('вчера')
    })

    it('should return tomorrow for tomorrow', () => {
      const tomorrow = new Date('2025-11-09T12:00:00')
      expect(formatRelativeDate(tomorrow)).toBe('завтра')
    })

    it('should return days count for past dates', () => {
      const pastDate = new Date('2025-11-05T12:00:00')
      expect(formatRelativeDate(pastDate)).toBe('3 дней назад')
    })
  })

  describe('getTodayString', () => {
    it('should return today date in YYYY-MM-DD format', () => {
      const today = getTodayString()
      expect(today).toBe('2025-11-08')
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })

  describe('formatDateShort', () => {
    it('should format date to short format', () => {
      const date = new Date('2025-11-08')
      const result = formatDateShort(date)
      expect(result).toMatch(/^\d{2}\.\d{2}$/)
    })

    it('should handle date string', () => {
      const result = formatDateShort('2025-11-08')
      expect(result).toMatch(/^\d{2}\.\d{2}$/)
    })
  })

  describe('safeParseDate', () => {
    it('should parse valid date string', () => {
      const result = safeParseDate('2025-11-08')
      expect(result).toBeInstanceOf(Date)
      expect(result.getFullYear()).toBe(2025)
      expect(result.getMonth()).toBe(10)
      expect(result.getDate()).toBe(8)
    })

    it('should return null for invalid date', () => {
      expect(safeParseDate('invalid')).toBeNull()
      expect(safeParseDate('')).toBeNull()
      expect(safeParseDate(null)).toBeNull()
    })

    it('should handle Date object', () => {
      const date = new Date('2025-11-08')
      expect(safeParseDate(date)).toEqual(date)
    })
  })

  describe('getTodayRange', () => {
    it('should return range for today', () => {
      const range = getTodayRange()
      expect(range).toHaveProperty('start')
      expect(range).toHaveProperty('end')
      expect(range.label).toBe('Сегодня')
    })
  })

  describe('getYesterdayRange', () => {
    it('should return range for yesterday', () => {
      const range = getYesterdayRange()
      expect(range).toHaveProperty('start')
      expect(range).toHaveProperty('end')
      expect(range.label).toBe('Вчера')
    })
  })

  describe('getCurrentWeekRange', () => {
    it('should return range for current week', () => {
      const range = getCurrentWeekRange()
      expect(range).toHaveProperty('start')
      expect(range).toHaveProperty('end')
      expect(range.label).toBe('Текущая неделя')
    })
  })

  describe('getCurrentMonthRange', () => {
    it('should return range for current month', () => {
      const range = getCurrentMonthRange()
      expect(range).toHaveProperty('start')
      expect(range).toHaveProperty('end')
      expect(range.label).toBe('Текущий месяц')
    })
  })

  describe('getCurrentYearRange', () => {
    it('should return range for current year', () => {
      const range = getCurrentYearRange()
      expect(range).toHaveProperty('start')
      expect(range).toHaveProperty('end')
      expect(range.label).toBe('Текущий год')
    })
  })
})
