/**
 * ✅ ТЕСТЫ: Тесты для утилит валидации данных
 */

import { describe, it, expect } from 'vitest'
import {
  validateTimeEntry,
  validateCategory,
  validateSettings,
  isValidDate,
  isValidTime,
  isValidEmail,
  isValidColor,
} from '../validators'

describe('validators', () => {
  describe('validateTimeEntry', () => {
    it('should validate valid entry', () => {
      const entry = {
        date: '2025-11-17',
        start: '09:00',
        end: '17:00',
        category: 'work',
        duration: '8.00',
        rate: 1000,
        earned: 8000,
      }

      const result = validateTimeEntry(entry)
      expect(result.isValid).toBe(true)
      expect(Object.keys(result.errors)).toHaveLength(0)
    })

    it('should return errors for missing required fields', () => {
      const entry = {}
      const result = validateTimeEntry(entry)

      expect(result.isValid).toBe(false)
      expect(result.errors.date).toBeDefined()
      expect(result.errors.start).toBeDefined()
      expect(result.errors.end).toBeDefined()
      expect(result.errors.category).toBeDefined()
    })

    it('should return error if end time is before start time', () => {
      const entry = {
        date: '2025-11-17',
        start: '17:00',
        end: '09:00',
        category: 'work',
      }

      const result = validateTimeEntry(entry)
      expect(result.isValid).toBe(false)
      expect(result.errors.timeLogic).toBeDefined()
    })

    it('should return warning for long work session', () => {
      const entry = {
        date: '2025-11-17',
        start: '00:00',
        end: '13:00',
        category: 'work',
      }

      const result = validateTimeEntry(entry)
      expect(result.warnings.longWork).toBeDefined()
    })

    it('should validate duration', () => {
      const entry = {
        date: '2025-11-17',
        start: '09:00',
        end: '17:00',
        category: 'work',
        duration: '-5',
      }

      const result = validateTimeEntry(entry)
      expect(result.isValid).toBe(false)
      expect(result.errors.duration).toBeDefined()
    })

    it('should validate rate', () => {
      const entry = {
        date: '2025-11-17',
        start: '09:00',
        end: '17:00',
        category: 'work',
        rate: '-100',
      }

      const result = validateTimeEntry(entry)
      expect(result.isValid).toBe(false)
      expect(result.errors.rate).toBeDefined()
    })

    it('should return warning for long description', () => {
      const entry = {
        date: '2025-11-17',
        start: '09:00',
        end: '17:00',
        category: 'work',
        description: 'a'.repeat(501),
      }

      const result = validateTimeEntry(entry)
      expect(result.warnings.longDescription).toBeDefined()
    })
  })

  describe('validateCategory', () => {
    it('should validate valid category', () => {
      const category = {
        name: 'Work',
        icon: 'briefcase',
        color: '#000000',
        rate: 1000,
      }

      const result = validateCategory(category)
      expect(result.isValid).toBe(true)
    })

    it('should return errors for missing required fields', () => {
      const category = {}
      const result = validateCategory(category)

      expect(result.isValid).toBe(false)
      expect(result.errors.name).toBeDefined()
    })

    it('should validate color format', () => {
      const category = {
        name: 'Work',
        color: 'invalid-color',
      }

      const result = validateCategory(category)
      expect(result.isValid).toBe(false)
      expect(result.errors.color).toBeDefined()
    })
  })

  describe('validateSettings', () => {
    it('should validate valid settings', () => {
      const settings = {
        dailyGoal: 10000,
        currency: '₽',
        theme: 'dark',
      }

      const result = validateSettings(settings)
      expect(result.isValid).toBe(true)
    })

    it('should return errors for invalid settings', () => {
      const settings = {
        dailyGoal: -1000,
        theme: 'invalid-theme',
      }

      const result = validateSettings(settings)
      expect(result.isValid).toBe(false)
    })
  })

  describe('isValidDate', () => {
    it('should validate valid date string', () => {
      // isValidDate returns truthy value (match result) for valid dates
      expect(isValidDate('2025-11-17')).toBeTruthy()
      expect(isValidDate('2025-01-01')).toBeTruthy()
    })

    it('should reject invalid date string', () => {
      expect(isValidDate('invalid-date')).toBe(false)
      expect(isValidDate('2025-13-01')).toBe(false)
      expect(isValidDate('')).toBe(false)
    })
  })

  describe('isValidTime', () => {
    it('should validate valid time string', () => {
      expect(isValidTime('09:00')).toBe(true)
      expect(isValidTime('23:59')).toBe(true)
      expect(isValidTime('00:00')).toBe(true)
    })

    it('should reject invalid time string', () => {
      expect(isValidTime('25:00')).toBe(false)
      expect(isValidTime('09:60')).toBe(false)
      expect(isValidTime('invalid')).toBe(false)
      expect(isValidTime('')).toBe(false)
    })
  })

  describe('isValidEmail', () => {
    it('should validate valid email', () => {
      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true)
    })

    it('should reject invalid email', () => {
      expect(isValidEmail('invalid-email')).toBe(false)
      expect(isValidEmail('@example.com')).toBe(false)
      expect(isValidEmail('test@')).toBe(false)
      expect(isValidEmail('')).toBe(false)
    })
  })

  describe('isValidColor', () => {
    it('should validate valid hex color', () => {
      expect(isValidColor('#000000')).toBe(true)
      expect(isValidColor('#FFFFFF')).toBe(true)
      expect(isValidColor('#abc123')).toBe(true)
    })

    it('should reject invalid color', () => {
      expect(isValidColor('invalid-color')).toBe(false)
      expect(isValidColor('#GGGGGG')).toBe(false)
      expect(isValidColor('#12345')).toBe(false)
      expect(isValidColor('')).toBe(false)
    })
  })
})

