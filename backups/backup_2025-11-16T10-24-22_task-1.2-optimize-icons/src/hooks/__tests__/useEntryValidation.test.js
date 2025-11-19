/**
 * ✅ ТЕСТЫ: Тесты для хука useEntryValidation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useEntryValidation } from '../useEntryValidation'

// Мокаем validators
vi.mock('../../utils/validators', () => ({
  validateEntryForm: (formData, entries, excludeId) => {
    const errors = {}
    let isValid = true

    if (!formData.date) {
      errors.date = 'Дата обязательна'
      isValid = false
    }
    if (!formData.start) {
      errors.start = 'Время начала обязательно'
      isValid = false
    }
    if (!formData.end) {
      errors.end = 'Время окончания обязательно'
      isValid = false
    }
    if (!formData.category) {
      errors.category = 'Категория обязательна'
      isValid = false
    }

    return { isValid, errors }
  },
}))

describe('useEntryValidation', () => {
  const mockEntries = [
    {
      id: '1',
      date: '2025-11-08',
      start: '09:00',
      end: '12:00',
    },
    {
      id: '2',
      date: '2025-11-08',
      start: '14:00',
      end: '17:00',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with empty errors', () => {
    const formData = {
      date: '2025-11-08',
      start: '10:00',
      end: '18:00',
      category: 'Разработка',
    }

    const { result } = renderHook(() => useEntryValidation(formData, mockEntries, null))

    expect(result.current.errors).toEqual({})
  })

  it('should validate form and return errors for invalid data', () => {
    const formData = {
      date: '',
      start: '',
      end: '',
      category: '',
    }

    const { result } = renderHook(() => useEntryValidation(formData, mockEntries, null))

    act(() => {
      const isValid = result.current.validateForm()
      expect(isValid).toBe(false)
    })

    expect(Object.keys(result.current.errors).length).toBeGreaterThan(0)
  })

  it('should validate form and return true for valid data', () => {
    const formData = {
      date: '2025-11-08',
      start: '10:00',
      end: '18:00',
      category: 'Разработка',
      earned: '8000.00',
    }

    const { result } = renderHook(() => useEntryValidation(formData, mockEntries, null))

    act(() => {
      const isValid = result.current.validateForm()
      expect(isValid).toBe(true)
    })
  })

  it('should detect time overlap', () => {
    const formData = {
      date: '2025-11-08',
      start: '10:00',
      end: '15:00', // Пересекается с 09:00-12:00 и 14:00-17:00
      category: 'Разработка',
    }

    const { result } = renderHook(() => useEntryValidation(formData, mockEntries, null))

    act(() => {
      result.current.validateTime('10:00', '15:00', '2025-11-08')
    })

    expect(result.current.errors.start).toBeDefined()
    expect(result.current.errors.end).toBeDefined()
  })

  it('should not detect overlap when times do not overlap', () => {
    const formData = {
      date: '2025-11-08',
      start: '12:30',
      end: '13:30', // Не пересекается
      category: 'Разработка',
    }

    const { result } = renderHook(() => useEntryValidation(formData, mockEntries, null))

    act(() => {
      result.current.validateTime('12:30', '13:30', '2025-11-08')
    })

    expect(result.current.errors.start).toBeUndefined()
    expect(result.current.errors.end).toBeUndefined()
  })

  it('should exclude current entry from overlap check', () => {
    const effectiveEntry = {
      id: '1',
      date: '2025-11-08',
      start: '09:00',
      end: '12:00',
    }

    const formData = {
      id: '1',
      date: '2025-11-08',
      start: '09:00',
      end: '12:00', // Та же запись
      category: 'Разработка',
    }

    const { result } = renderHook(() => useEntryValidation(formData, mockEntries, effectiveEntry))

    act(() => {
      result.current.validateTime('09:00', '12:00', '2025-11-08')
    })

    // Не должно быть ошибки, так как это та же запись
    expect(result.current.errors.start).toBeUndefined()
  })

  it('should validate time range and return error when start >= end', () => {
    const formData = {
      date: '2025-11-08',
      start: '17:00',
      end: '09:00', // Неправильный порядок
      category: 'Разработка',
    }

    const { result } = renderHook(() => useEntryValidation(formData, mockEntries, null))

    act(() => {
      result.current.validateTime('17:00', '09:00', '2025-11-08')
    })

    expect(result.current.errors.start).toBeDefined()
    expect(result.current.errors.end).toBeDefined()
  })

  it('should clear errors for specific fields', () => {
    const formData = {
      date: '2025-11-08',
      start: '',
      end: '',
      category: 'Разработка',
    }

    const { result } = renderHook(() => useEntryValidation(formData, mockEntries, null))

    act(() => {
      result.current.setError('start', 'Ошибка')
      result.current.setError('end', 'Ошибка')
    })

    expect(result.current.errors.start).toBeDefined()
    expect(result.current.errors.end).toBeDefined()

    act(() => {
      result.current.clearErrors(['start'])
    })

    expect(result.current.errors.start).toBeUndefined()
    expect(result.current.errors.end).toBeDefined()
  })

  it('should set error for specific field', () => {
    const formData = {
      date: '2025-11-08',
      start: '10:00',
      end: '18:00',
      category: 'Разработка',
    }

    const { result } = renderHook(() => useEntryValidation(formData, mockEntries, null))

    act(() => {
      result.current.setError('date', 'Неверная дата')
    })

    expect(result.current.errors.date).toBe('Неверная дата')
  })

  it('should clear all errors', () => {
    const formData = {
      date: '2025-11-08',
      start: '10:00',
      end: '18:00',
      category: 'Разработка',
    }

    const { result } = renderHook(() => useEntryValidation(formData, mockEntries, null))

    act(() => {
      result.current.setError('date', 'Ошибка 1')
      result.current.setError('start', 'Ошибка 2')
    })

    expect(Object.keys(result.current.errors).length).toBe(2)

    act(() => {
      result.current.clearAllErrors()
    })

    expect(Object.keys(result.current.errors).length).toBe(0)
  })

  it('should return null from checkTimeOverlap when no overlap', () => {
    const formData = {
      date: '2025-11-08',
      start: '12:30',
      end: '13:30',
      category: 'Разработка',
    }

    const { result } = renderHook(() => useEntryValidation(formData, mockEntries, null))

    const overlap = result.current.checkTimeOverlap('12:30', '13:30', '2025-11-08')
    expect(overlap).toBeNull()
  })

  it('should return error message from checkTimeOverlap when overlap exists', () => {
    const formData = {
      date: '2025-11-08',
      start: '10:00',
      end: '15:00',
      category: 'Разработка',
    }

    const { result } = renderHook(() => useEntryValidation(formData, mockEntries, null))

    const overlap = result.current.checkTimeOverlap('10:00', '15:00', '2025-11-08')
    expect(overlap).toBeDefined()
    expect(typeof overlap).toBe('string')
    expect(overlap).toContain('пересекается')
  })
})
