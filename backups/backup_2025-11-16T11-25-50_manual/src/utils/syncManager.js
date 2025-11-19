/**
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 *
 * Этот файл управляет синхронизацией данных между вкладками браузера.
 * Используется BroadcastChannel API - встроенный способ обмена сообщениями
 * между вкладками одного сайта.
 *
 * ⚠️ ВАЖНО: Этот модуль работает только с stores, не затрагивает UI компоненты.
 */

import { logger } from './logger'

/**
 * Типы сообщений для синхронизации
 */
export const SyncMessageType = {
  // Записи времени
  ENTRY_ADDED: 'entry-added',
  ENTRY_UPDATED: 'entry-updated',
  ENTRY_DELETED: 'entry-deleted',
  ENTRIES_BULK_UPDATE: 'entries-bulk-update',
  ENTRIES_CLEARED: 'entries-cleared',
}

/**
 * Менеджер синхронизации между вкладками
 * Легковесная реализация, не влияющая на UI
 */
class SyncManager {
  constructor(channelName = 'time-tracker-sync') {
    this.channelName = channelName
    this.channel = null
    this.listeners = new Map()
    this.isEnabled = false
    this.sourceId = null

    this.init()
  }

  /**
   * Инициализирует BroadcastChannel
   */
  init() {
    if (typeof BroadcastChannel === 'undefined') {
      logger.warn('⚠️ SyncManager: BroadcastChannel недоступен')
      return
    }

    try {
      this.channel = new BroadcastChannel(this.channelName)
      this.isEnabled = true
      this.setupMessageListener()
      logger.log('✅ SyncManager: инициализирован')
    } catch (error) {
      logger.error('❌ SyncManager: ошибка инициализации:', error)
      this.isEnabled = false
    }
  }

  /**
   * Настраивает слушатель сообщений
   */
  setupMessageListener() {
    if (!this.channel) return

    this.channel.addEventListener('message', event => {
      try {
        const { type, data, source } = event.data

        // Игнорируем сообщения от самой себя
        if (source === this.getSourceId()) {
          return
        }

        // Вызываем обработчики
        const handlers = this.listeners.get(type) || []
        handlers.forEach(handler => {
          try {
            handler(data)
          } catch (error) {
            logger.error(`❌ SyncManager: ошибка в обработчике ${type}:`, error)
          }
        })
      } catch (error) {
        logger.error('❌ SyncManager: ошибка обработки сообщения:', error)
      }
    })
  }

  /**
   * Генерирует уникальный ID для этой вкладки
   */
  getSourceId() {
    if (!this.sourceId) {
      if (typeof sessionStorage !== 'undefined') {
        this.sourceId = sessionStorage.getItem('sync-source-id')
        if (!this.sourceId) {
          this.sourceId = `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          sessionStorage.setItem('sync-source-id', this.sourceId)
        }
      } else {
        this.sourceId = `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }
    }
    return this.sourceId
  }

  /**
   * Отправляет сообщение в другие вкладки
   */
  broadcast(type, data) {
    if (!this.isEnabled || !this.channel) {
      return false
    }

    try {
      this.channel.postMessage({
        type,
        data,
        timestamp: Date.now(),
        source: this.getSourceId(),
      })
      return true
    } catch (error) {
      logger.error('❌ SyncManager: ошибка отправки:', error)
      return false
    }
  }

  /**
   * Подписывается на сообщения определенного типа
   */
  subscribe(type, handler) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, [])
    }

    this.listeners.get(type).push(handler)

    return () => {
      const handlers = this.listeners.get(type)
      if (handlers) {
        const index = handlers.indexOf(handler)
        if (index > -1) {
          handlers.splice(index, 1)
        }
      }
    }
  }

  /**
   * Закрывает канал
   */
  close() {
    if (this.channel) {
      this.channel.close()
      this.channel = null
      this.listeners.clear()
    }
  }

  /**
   * Проверяет доступность
   */
  isAvailable() {
    return this.isEnabled && this.channel !== null
  }
}

// Единственный экземпляр
export const syncManager = new SyncManager('time-tracker-sync')
