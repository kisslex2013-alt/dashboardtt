/**
 * Управление синхронизацией данных между вкладками браузера
 */

import { logger } from './logger'

/**
 * Типы сообщений для синхронизации
 */
export const SyncMessageType = {
  ENTRY_ADDED: 'entry-added',
  ENTRY_UPDATED: 'entry-updated',
  ENTRY_DELETED: 'entry-deleted',
  ENTRIES_BULK_UPDATE: 'entries-bulk-update',
  ENTRIES_CLEARED: 'entries-cleared',
} as const

export type SyncMessageTypeName = typeof SyncMessageType[keyof typeof SyncMessageType]

type MessageHandler<T = unknown> = (data: T) => void

interface SyncMessage {
  type: SyncMessageTypeName
  data: unknown
  timestamp: number
  source: string
}

/**
 * Менеджер синхронизации между вкладками
 */
class SyncManager {
  private channelName: string
  private channel: BroadcastChannel | null
  private listeners: Map<string, MessageHandler[]>
  private isEnabled: boolean
  private sourceId: string | null

  constructor(channelName: string = 'time-tracker-sync') {
    this.channelName = channelName
    this.channel = null
    this.listeners = new Map()
    this.isEnabled = false
    this.sourceId = null

    this.init()
  }

  private init(): void {
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

  private setupMessageListener(): void {
    if (!this.channel) return

    this.channel.addEventListener('message', (event: MessageEvent<SyncMessage>) => {
      try {
        const { type, data, source } = event.data

        if (source === this.getSourceId()) {
          return
        }

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

  private getSourceId(): string {
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

  broadcast(type: SyncMessageTypeName, data: unknown): boolean {
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

  subscribe<T = unknown>(type: SyncMessageTypeName, handler: MessageHandler<T>): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, [])
    }

    this.listeners.get(type)!.push(handler as MessageHandler)

    return () => {
      const handlers = this.listeners.get(type)
      if (handlers) {
        const index = handlers.indexOf(handler as MessageHandler)
        if (index > -1) {
          handlers.splice(index, 1)
        }
      }
    }
  }

  close(): void {
    if (this.channel) {
      this.channel.close()
      this.channel = null
      this.listeners.clear()
    }
  }

  isAvailable(): boolean {
    return this.isEnabled && this.channel !== null
  }
}

export const syncManager = new SyncManager('time-tracker-sync')
