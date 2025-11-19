/**
 * ✅ ТЕСТЫ: Тесты для обработки ошибок
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AppError, ErrorType, getUserFriendlyMessage, handleError, checkStorageSpace } from '../errorHandler'

describe('errorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('AppError', () => {
    it('should create AppError with message and type', () => {
      const error = new AppError('Test error', ErrorType.VALIDATION)
      expect(error.message).toBe('Test error')
      expect(error.type).toBe(ErrorType.VALIDATION)
      expect(error.name).toBe('AppError')
      expect(error.timestamp).toBeDefined()
    })

    it('should create AppError with default type', () => {
      const error = new AppError('Test error')
      expect(error.type).toBe(ErrorType.UNKNOWN)
    })

    it('should create AppError with details', () => {
      const details = { field: 'email', originalError: new Error('Original') }
      const error = new AppError('Test error', ErrorType.VALIDATION, details)
      expect(error.details).toEqual(details)
    })

    it('should be instance of Error', () => {
      const error = new AppError('Test error')
      expect(error).toBeInstanceOf(Error)
    })
  })

  describe('getUserFriendlyMessage', () => {
    it('should return message from AppError', () => {
      const error = new AppError('User friendly message', ErrorType.VALIDATION)
      expect(getUserFriendlyMessage(error)).toBe('User friendly message')
    })

    it('should convert network errors', () => {
      const error = new Error('Network request failed')
      expect(getUserFriendlyMessage(error)).toContain('интернету')
    })

    it('should convert storage errors', () => {
      const error = new Error('QuotaExceededError')
      expect(getUserFriendlyMessage(error)).toContain('места')
    })

    it('should convert JSON parse errors', () => {
      const error = new Error('Unexpected token in JSON')
      expect(getUserFriendlyMessage(error)).toContain('повреждены')
    })

    it('should return default message for unknown errors', () => {
      const error = new Error('Some unknown error')
      const message = getUserFriendlyMessage(error)
      expect(message).toBeTruthy()
      expect(typeof message).toBe('string')
    })
  })

  describe('handleError', () => {
    it('should handle AppError', () => {
      const error = new AppError('Test error', ErrorType.VALIDATION)
      const result = handleError(error)
      expect(result).toBeDefined()
    })

    it('should handle regular Error', () => {
      const error = new Error('Test error')
      const result = handleError(error)
      expect(result).toBeDefined()
    })

    it('should handle error with context', () => {
      const error = new Error('Test error')
      const context = { operation: 'save', component: 'EntryForm' }
      const result = handleError(error, context)
      expect(result).toBeDefined()
    })
  })

  describe('checkStorageSpace', () => {
    it('should check storage space', async () => {
      const result = await checkStorageSpace()
      expect(result).toHaveProperty('hasSpace')
      expect(typeof result.hasSpace).toBe('boolean')
    })

    it('should return storage info', async () => {
      const result = await checkStorageSpace()
      expect(result).toHaveProperty('available')
      expect(typeof result.available).toBe('boolean')
    })
  })
})

