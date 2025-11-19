/**
 * ✅ ТЕСТЫ: Тесты для расчета Productivity Score
 */

import { describe, it, expect } from 'vitest'
import { calculateProductivityScore } from '../productivityScore'
import type { TimeEntry } from '../../types'

describe('productivityScore', () => {
  const createMockEntry = (overrides: Partial<TimeEntry> = {}): TimeEntry => ({
    id: '1',
    date: '2025-11-17',
    start: '09:00',
    end: '17:00',
    category: 'work',
    categoryId: 'cat-1',
    duration: '8.00',
    rate: 1000,
    earned: 8000,
    ...overrides,
  })

  describe('calculateProductivityScore', () => {
    it('should calculate score for entries with goal completion', () => {
      const entries = [
        createMockEntry({ date: '2025-11-17', earned: 10000 }),
        createMockEntry({ date: '2025-11-18', earned: 10000 }),
      ]

      const result = calculateProductivityScore(entries, 10000, 8)
      expect(result.score).toBeGreaterThanOrEqual(0)
      expect(result.score).toBeLessThanOrEqual(100)
      expect(result.factors).toBeDefined()
      expect(result.factors.goalCompletion).toBeDefined()
    })

    it('should return low score for empty entries', () => {
      const result = calculateProductivityScore([], 10000, 8)
      // Empty entries return breakBalance = 1.0, which gives 15% score
      expect(result.score).toBeGreaterThanOrEqual(0)
      expect(result.score).toBeLessThanOrEqual(20)
    })

    it('should calculate consistency factor', () => {
      const entries = Array.from({ length: 15 }, (_, i) =>
        createMockEntry({ date: `2025-11-${String(i + 1).padStart(2, '0')}` })
      )

      const result = calculateProductivityScore(entries, 10000, 8)
      expect(result.factors.consistency).toHaveProperty('value')
      expect(result.factors.consistency.value).toBeGreaterThanOrEqual(0)
      expect(result.factors.consistency.value).toBeLessThanOrEqual(25)
    })

    it('should calculate focus time factor', () => {
      const entries = [
        createMockEntry({ duration: '4.00' }), // Long session
        createMockEntry({ duration: '3.00' }), // Long session
      ]

      const result = calculateProductivityScore(entries, 10000, 8)
      expect(result.factors.focusTime).toHaveProperty('value')
      expect(result.factors.focusTime.value).toBeGreaterThanOrEqual(0)
      expect(result.factors.focusTime.value).toBeLessThanOrEqual(20)
    })

    it('should handle entries without goal', () => {
      const entries = [createMockEntry()]
      const result = calculateProductivityScore(entries, 0, 8)
      expect(result.score).toBeGreaterThanOrEqual(0)
      expect(result.score).toBeLessThanOrEqual(100)
    })

    it('should return all factors', () => {
      const entries = [createMockEntry()]
      const result = calculateProductivityScore(entries, 10000, 8)

      expect(result.factors).toHaveProperty('goalCompletion')
      expect(result.factors).toHaveProperty('consistency')
      expect(result.factors).toHaveProperty('focusTime')
      expect(result.factors).toHaveProperty('breakBalance')
    })

    it('should handle entries with breaks', () => {
      const entries = [
        createMockEntry({ category: 'break', duration: '0.5' }),
        createMockEntry({ duration: '4.00' }),
      ]

      const result = calculateProductivityScore(entries, 10000, 8)
      expect(result.factors.breakBalance).toHaveProperty('value')
      expect(result.factors.breakBalance.value).toBeGreaterThanOrEqual(0)
      expect(result.factors.breakBalance.value).toBeLessThanOrEqual(15)
    })

    it('should calculate score for multiple days', () => {
      const entries = Array.from({ length: 5 }, (_, i) =>
        createMockEntry({
          date: `2025-11-${String(i + 1).padStart(2, '0')}`,
          earned: 10000,
        })
      )

      const result = calculateProductivityScore(entries, 10000, 8)
      expect(result.score).toBeGreaterThanOrEqual(0)
      expect(result.score).toBeLessThanOrEqual(100)
    })
  })
})

