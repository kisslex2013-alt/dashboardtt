/**
 * 💾 BackupManager - Менеджер резервных копий на IndexedDB
 */

import { logger } from './logger'

import type { BackupData } from '../types'

interface BackupEntry {
  timestamp: number
  data: BackupData
}

interface BackupListItem {
  timestamp: number
  entriesCount: number
}

interface SaveBackupResult {
  success: boolean
  timestamp?: number
  error?: unknown
}

interface BackupInfo {
  timestamp: number
  data: BackupData
  entriesCount: number
}

export class BackupManager {
  private dbName: string
  private storeName: string
  private maxBackups: number
  private dbPromise: Promise<IDBDatabase> | null
  private broadcastChannel: BroadcastChannel | null

  constructor(dbName: string = 'TimeTrackerBackupDB', storeName: string = 'backups') {
    this.dbName = dbName
    this.storeName = storeName
    this.maxBackups = 10
    this.dbPromise = null
    this.broadcastChannel = null

    if (typeof BroadcastChannel !== 'undefined') {
      this.broadcastChannel = new BroadcastChannel('time-tracker-backups')
    }
  }

  async openDB(): Promise<IDBDatabase> {
    if (this.dbPromise) {
      return this.dbPromise
    }

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1)

      request.onerror = () => {
        logger.error('❌ Ошибка открытия IndexedDB:', request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        logger.log('✅ IndexedDB успешно открыта')
        resolve(request.result)
      }

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result

        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'timestamp' })
          store.createIndex('timestamp', 'timestamp', { unique: false })
          logger.log('✅ Хранилище бэкапов создано')
        }
      }
    })

    return this.dbPromise
  }

  async saveBackup(data: BackupData): Promise<SaveBackupResult> {
    try {
      const db = await this.openDB()
      const transaction = db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const timestamp = Date.now()

      await new Promise<void>((resolve, reject) => {
        const request = store.add({ timestamp, data })
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })

      await this.cleanupOldBackups(store)

      if (this.broadcastChannel) {
        this.broadcastChannel.postMessage({ type: 'backup-created', timestamp })
      }

      logger.log(`✅ Бэкап сохранен: ${new Date(timestamp).toLocaleString('ru-RU')}`)
      return { success: true, timestamp }
    } catch (error) {
      logger.error('❌ Ошибка сохранения бэкапа:', error)
      return { success: false, error }
    }
  }

  private async cleanupOldBackups(store: IDBObjectStore): Promise<void> {
    return new Promise(resolve => {
      const req = store.index('timestamp').openKeyCursor(null, 'prev')
      const keys: IDBValidKey[] = []

      req.onsuccess = () => {
        const cursor = req.result
        if (cursor) {
          keys.push(cursor.key)
          if (keys.length > this.maxBackups) {
            store.delete(cursor.key)
          }
          cursor.continue()
        } else {
          resolve()
        }
      }

      req.onerror = () => resolve()
    })
  }

  async listBackups(): Promise<BackupListItem[]> {
    try {
      const db = await this.openDB()
      const transaction = db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const req = store.index('timestamp').openCursor(null, 'prev')

      return new Promise(resolve => {
        const backups: BackupListItem[] = []

        req.onsuccess = () => {
          const cursor = req.result
          if (cursor) {
            const { timestamp, data } = cursor.value as BackupEntry
            const entriesCount = Array.isArray(data.entries) ? data.entries.length : 0
            backups.push({ timestamp, entriesCount })
            cursor.continue()
          } else {
            resolve(backups)
          }
        }

        req.onerror = () => resolve([])
      })
    } catch (error) {
      logger.error('❌ Ошибка получения списка бэкапов:', error)
      return []
    }
  }

  onBackupChange(callback: () => void): () => void {
    if (!this.broadcastChannel) {
      return () => {}
    }

    const handler = (event: MessageEvent) => {
      if (event.data && (event.data.type === 'backup-created' || event.data.type === 'backup-deleted')) {
        callback()
      }
    }

    this.broadcastChannel.addEventListener('message', handler)

    return () => {
      this.broadcastChannel?.removeEventListener('message', handler)
    }
  }

  close(): void {
    if (this.broadcastChannel) {
      this.broadcastChannel.close()
      this.broadcastChannel = null
    }
  }

  async restoreBackup(timestamp: number): Promise<BackupData | null> {
    try {
      const db = await this.openDB()
      const transaction = db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)

      return new Promise(resolve => {
        const req = store.get(timestamp)

        req.onsuccess = () => {
          const result = (req.result as BackupEntry | undefined)?.data || null
          if (result) {
            logger.log(`✅ Бэкап восстановлен: ${new Date(timestamp).toLocaleString('ru-RU')}`)
          }
          resolve(result)
        }

        req.onerror = () => {
          logger.error('❌ Ошибка восстановления бэкапа')
          resolve(null)
        }
      })
    } catch (error) {
      logger.error('❌ Ошибка восстановления бэкапа:', error)
      return null
    }
  }

  async deleteBackup(timestamp: number): Promise<boolean> {
    try {
      const db = await this.openDB()
      const transaction = db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)

      const success = await new Promise<boolean>(resolve => {
        const req = store.delete(timestamp)

        req.onsuccess = () => {
          logger.log(`✅ Бэкап удален: ${new Date(timestamp).toLocaleString('ru-RU')}`)
          resolve(true)
        }

        req.onerror = () => {
          logger.error('❌ Ошибка удаления бэкапа')
          resolve(false)
        }
      })

      if (this.broadcastChannel) {
        this.broadcastChannel.postMessage({ type: 'backup-deleted', timestamp })
      }

      return success
    } catch (error) {
      logger.error('❌ Ошибка удаления бэкапа:', error)
      return false
    }
  }

  async getBackupInfo(timestamp: number): Promise<BackupInfo | null> {
    try {
      const db = await this.openDB()
      const transaction = db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)

      return new Promise(resolve => {
        const req = store.get(timestamp)

        req.onsuccess = () => {
          const backup = req.result as BackupEntry | undefined
          if (backup) {
            const entriesCount = Array.isArray(backup.data?.entries) ? backup.data.entries.length : 0
            resolve({ timestamp: backup.timestamp, data: backup.data, entriesCount })
          } else {
            resolve(null)
          }
        }

        req.onerror = () => resolve(null)
      })
    } catch (error) {
      logger.error('❌ Ошибка получения информации о бэкапе:', error)
      return null
    }
  }
}

export const backupManager = new BackupManager()
