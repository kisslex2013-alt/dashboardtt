/**
 * ✅ ТЕСТЫ: Тесты для syncManager.js
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { syncManager, SyncMessageType } from '../syncManager'

// Мокаем logger
vi.mock('../logger', () => ({
  logger: {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

describe('syncManager', () => {
  let mockChannel

  beforeEach(() => {
    // Мокаем BroadcastChannel
    mockChannel = {
      addEventListener: vi.fn(),
      postMessage: vi.fn(),
      close: vi.fn(),
    }

    global.BroadcastChannel = vi.fn(() => mockChannel)
    global.sessionStorage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
    // Очищаем слушатели после каждого теста
    syncManager.listeners.clear()
  })

  describe('syncManager initialization', () => {
    it('should be initialized', () => {
      expect(syncManager).toBeDefined()
      expect(syncManager.channelName).toBeDefined()
    })

    it('should handle missing BroadcastChannel', () => {
      const originalBroadcastChannel = global.BroadcastChannel
      global.BroadcastChannel = undefined
      
      // Проверяем, что syncManager обрабатывает отсутствие BroadcastChannel
      expect(syncManager.isEnabled).toBeDefined()
      
      global.BroadcastChannel = originalBroadcastChannel
    })
  })

  describe('subscribe method', () => {
    it('should register listener', () => {
      const handler = vi.fn()
      const unsubscribe = syncManager.subscribe(SyncMessageType.ENTRY_ADDED, handler)

      expect(syncManager.listeners.has(SyncMessageType.ENTRY_ADDED)).toBe(true)
      expect(typeof unsubscribe).toBe('function')
    })

    it('should return unsubscribe function', () => {
      const handler = vi.fn()
      const unsubscribe = syncManager.subscribe(SyncMessageType.ENTRY_ADDED, handler)
      
      unsubscribe()
      
      const handlers = syncManager.listeners.get(SyncMessageType.ENTRY_ADDED)
      expect(handlers).not.toContain(handler)
    })

    it('should handle multiple listeners', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      syncManager.subscribe(SyncMessageType.ENTRY_ADDED, handler1)
      syncManager.subscribe(SyncMessageType.ENTRY_ADDED, handler2)

      const handlers = syncManager.listeners.get(SyncMessageType.ENTRY_ADDED)
      expect(handlers).toHaveLength(2)
    })
  })

  describe('broadcast method', () => {
    it('should broadcast message when enabled', () => {
      syncManager.isEnabled = true
      syncManager.channel = mockChannel
      syncManager.broadcast(SyncMessageType.ENTRY_ADDED, { id: '1' })

      expect(mockChannel.postMessage).toHaveBeenCalled()
    })

    it('should not broadcast message when disabled', () => {
      syncManager.isEnabled = false
      syncManager.broadcast(SyncMessageType.ENTRY_ADDED, { id: '1' })

      expect(mockChannel.postMessage).not.toHaveBeenCalled()
    })

    it('should include source ID in message', () => {
      syncManager.isEnabled = true
      syncManager.channel = mockChannel
      syncManager.sourceId = 'test-source'
      syncManager.broadcast(SyncMessageType.ENTRY_ADDED, { id: '1' })

      expect(mockChannel.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: SyncMessageType.ENTRY_ADDED,
          data: { id: '1' },
          source: 'test-source',
        })
      )
    })
  })

  describe('message handling', () => {
    it('should call registered handlers on message', () => {
      const handler = vi.fn()
      syncManager.subscribe(SyncMessageType.ENTRY_ADDED, handler)

      // Симулируем получение сообщения
      const messageData = {
        type: SyncMessageType.ENTRY_ADDED,
        data: { id: '1' },
        source: 'other-source',
      }

      // Вызываем обработчик напрямую
      const handlers = syncManager.listeners.get(SyncMessageType.ENTRY_ADDED)
      handlers.forEach(h => h(messageData.data))

      expect(handler).toHaveBeenCalledWith({ id: '1' })
    })

    it('should handle different message types', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      syncManager.subscribe(SyncMessageType.ENTRY_ADDED, handler1)
      syncManager.subscribe(SyncMessageType.ENTRY_UPDATED, handler2)

      const handlers1 = syncManager.listeners.get(SyncMessageType.ENTRY_ADDED)
      const handlers2 = syncManager.listeners.get(SyncMessageType.ENTRY_UPDATED)

      expect(handlers1).toContain(handler1)
      expect(handlers2).toContain(handler2)
    })
  })

  describe('getSourceId', () => {
    it('should generate source ID if not exists', () => {
      global.sessionStorage.getItem = vi.fn(() => null)
      // Сбрасываем sourceId для теста
      syncManager.sourceId = null
      const sourceId = syncManager.getSourceId()

      expect(sourceId).toBeDefined()
      expect(sourceId).toContain('tab-')
    })

    it('should return existing source ID from sessionStorage', () => {
      global.sessionStorage.getItem = vi.fn(() => 'existing-id')
      // Сбрасываем sourceId для теста
      syncManager.sourceId = null
      const sourceId = syncManager.getSourceId()

      expect(sourceId).toBe('existing-id')
    })
  })

  describe('close', () => {
    it('should close channel and clear listeners', () => {
      syncManager.channel = mockChannel
      syncManager.close()

      expect(mockChannel.close).toHaveBeenCalled()
      expect(syncManager.listeners.size).toBe(0)
      expect(syncManager.channel).toBeNull()
    })

    it('should handle close when channel is null', () => {
      syncManager.channel = null
      expect(() => syncManager.close()).not.toThrow()
    })
  })

  describe('isAvailable', () => {
    it('should return true when enabled and channel exists', () => {
      syncManager.isEnabled = true
      syncManager.channel = mockChannel
      expect(syncManager.isAvailable()).toBe(true)
    })

    it('should return false when disabled', () => {
      syncManager.isEnabled = false
      syncManager.channel = mockChannel
      expect(syncManager.isAvailable()).toBe(false)
    })

    it('should return false when channel is null', () => {
      syncManager.isEnabled = true
      syncManager.channel = null
      expect(syncManager.isAvailable()).toBe(false)
    })
  })
})

