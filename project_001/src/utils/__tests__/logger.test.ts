/**
 * ✅ ТЕСТЫ: Тесты для утилит логирования
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createLogger } from '../logger'

describe('logger', () => {
  let originalConsole: {
    log: typeof console.log
    warn: typeof console.warn
    error: typeof console.error
    info: typeof console.info
  }

  beforeEach(() => {
    // Сохраняем оригинальные методы console
    originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info,
    }

    // Мокаем console методы
    console.log = vi.fn()
    console.warn = vi.fn()
    console.error = vi.fn()
    console.info = vi.fn()
  })

  afterEach(() => {
    // Восстанавливаем оригинальные методы
    console.log = originalConsole.log
    console.warn = originalConsole.warn
    console.error = originalConsole.error
    console.info = originalConsole.info
    vi.clearAllMocks()
  })

  describe('createLogger', () => {
    it('should create a logger with all methods', () => {
      const logger = createLogger('test')
      expect(logger).toHaveProperty('log')
      expect(logger).toHaveProperty('warn')
      expect(logger).toHaveProperty('error')
      expect(logger).toHaveProperty('info')
    })

    it('should log messages with prefix', () => {
      const logger = createLogger('TestModule')
      logger.log('test message')
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('TestModule'),
        expect.stringContaining('test message')
      )
    })

    it('should warn messages with prefix', () => {
      const logger = createLogger('TestModule')
      logger.warn('warning message')
      expect(console.warn).toHaveBeenCalledWith(
        '⚠️',
        '[TestModule]',
        'warning message'
      )
    })

    it('should error messages with prefix', () => {
      const logger = createLogger('TestModule')
      logger.error('error message')
      expect(console.error).toHaveBeenCalledWith(
        '❌',
        '[TestModule]',
        'error message'
      )
    })

    it('should info messages with prefix', () => {
      const logger = createLogger('TestModule')
      logger.info('info message')
      expect(console.info).toHaveBeenCalledWith(
        'ℹ️',
        '[TestModule]',
        'info message'
      )
    })

    it('should handle multiple arguments', () => {
      const logger = createLogger('TestModule')
      logger.log('message', { data: 'test' }, 123)
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('TestModule'),
        'message',
        { data: 'test' },
        123
      )
    })

    it('should create different loggers for different modules', () => {
      const logger1 = createLogger('Module1')
      const logger2 = createLogger('Module2')
      
      logger1.log('message 1')
      logger2.log('message 2')
      
      expect(console.log).toHaveBeenCalledTimes(2)
      expect(console.log).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('Module1'),
        'message 1'
      )
      expect(console.log).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('Module2'),
        'message 2'
      )
    })
  })
})

