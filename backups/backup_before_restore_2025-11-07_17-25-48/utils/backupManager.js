import { logger } from './logger';

/**
 * 💾 BackupManager - Менеджер резервных копий на IndexedDB
 * 
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 * 
 * IndexedDB - это встроенная база данных в браузере, которая позволяет хранить
 * большие объемы данных локально. Это лучше чем localStorage, потому что:
 * - Может хранить больше данных (GB против MB)
 * - Асинхронная работа (не блокирует интерфейс)
 * - Поддерживает индексы для быстрого поиска
 * 
 * Этот класс управляет автоматическими резервными копиями всех данных приложения.
 * Резервные копии создаются автоматически при изменениях и хранятся в IndexedDB.
 */
export class BackupManager {
  constructor(dbName = 'TimeTrackerBackupDB', storeName = 'backups') {
    this.dbName = dbName;
    this.storeName = storeName;
    this.maxBackups = 10; // Максимум бэкапов для хранения
    this.dbPromise = null; // Кэш соединения с БД
    this.broadcastChannel = null; // Канал для синхронизации между вкладками
    
    // ✨ ОПТИМИЗАЦИЯ: Кэш списка бэкапов
    this.backupsCache = null;
    this.cacheTimestamp = 0;
    this.cacheTTL = 5000; // 5 секунд кэш
    
    // Инициализируем BroadcastChannel для синхронизации между вкладками
    if (typeof BroadcastChannel !== 'undefined') {
      this.broadcastChannel = new BroadcastChannel('time-tracker-backups');
    }
  }

  /**
   * Открывает соединение с IndexedDB
   * @returns {Promise<IDBDatabase>} Promise с объектом базы данных
   */
  async openDB() {
    // Если соединение уже открыто, возвращаем его
    if (this.dbPromise) {
      return this.dbPromise;
    }

    // Создаем новое Promise для открытия БД
    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => {
        logger.error('❌ Ошибка открытия IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        logger.log('✅ IndexedDB успешно открыта');
        resolve(request.result);
      };

      // Выполняется при первом создании БД или обновлении версии
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Создаем хранилище (object store) если его еще нет
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'timestamp' });
          // Создаем индекс для быстрого поиска по времени
          store.createIndex('timestamp', 'timestamp', { unique: false });
          logger.log('✅ Хранилище бэкапов создано');
        }
      };
    });

    return this.dbPromise;
  }

  /**
   * ✨ ОПТИМИЗИРОВАНО: Сохраняет резервную копию данных
   * Оптимизации:
   * - Очистка временных полей перед сохранением
   * - Инвалидация кэша после сохранения
   * @param {Object} data - данные для сохранения (entries, categories, settings и т.д.)
   * @returns {Promise<{success: boolean, timestamp?: number, error?: Error}>}
   */
  async saveBackup(data) {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const timestamp = Date.now();

      // ✨ ОПТИМИЗАЦИЯ: Очищаем временные поля и оптимизируем структуру данных
      const optimizedData = this.optimizeBackupData(data);

      // Сохраняем данные с timestamp
      await new Promise((resolve, reject) => {
        const request = store.add({ timestamp, data: optimizedData });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      // Удаляем старые бэкапы, если превышен лимит
      await this.cleanupOldBackups(store);

      // ✨ ОПТИМИЗАЦИЯ: Инвалидируем кэш после сохранения
      this.backupsCache = null;
      this.cacheTimestamp = 0;

      // Уведомляем другие вкладки о создании нового бэкапа
      if (this.broadcastChannel) {
        const message = {
          type: 'backup-created',
          timestamp
        };
        this.broadcastChannel.postMessage(message);
        logger.log('📡 BroadcastChannel: отправлено сообщение о создании бэкапа', message);
      } else {
        logger.warn('⚠️ BroadcastChannel недоступен, синхронизация между вкладками не работает');
      }

      logger.log(`✅ Бэкап сохранен: ${new Date(timestamp).toLocaleString('ru-RU')}`);
      return { success: true, timestamp };
    } catch (error) {
      logger.error('❌ Ошибка сохранения бэкапа:', error);
      return { success: false, error };
    }
  }

  /**
   * ✨ ОПТИМИЗАЦИЯ: Очищает и оптимизирует данные перед сохранением
   * Удаляет временные поля и оптимизирует структуру для уменьшения размера
   * @param {Object} data - исходные данные
   * @returns {Object} оптимизированные данные
   */
  optimizeBackupData(data) {
    const optimized = { ...data };
    
    // Оптимизируем entries - убираем временные поля если есть
    if (Array.isArray(optimized.entries)) {
      optimized.entries = optimized.entries.map(entry => {
        const { id, date, start, end, category, categoryId, description, duration, earned, rate, isManual, createdAt, updatedAt } = entry;
        // Сохраняем только необходимые поля
        return {
          id,
          date,
          start,
          end,
          category: category || categoryId, // Нормализуем категорию
          description: description || '',
          duration: parseFloat(duration) || 0,
          earned: parseFloat(earned) || 0,
          rate: parseFloat(rate) || 0,
          isManual: isManual || false,
          createdAt: createdAt || new Date().toISOString(),
          updatedAt: updatedAt || new Date().toISOString()
        };
      });
    }
    
    // Убираем timestamp из data (он уже в ключе)
    delete optimized.timestamp;
    
    return optimized;
  }

  /**
   * ✨ ОПТИМИЗИРОВАНО: Удаляет старые резервные копии, оставляя только последние maxBackups
   * Оптимизация: останавливаемся после maxBackups, не проходим по всем записям
   * @param {IDBObjectStore} store - объект хранилища IndexedDB
   * @returns {Promise<void>}
   */
  async cleanupOldBackups(store) {
    return new Promise((resolve) => {
      const req = store.index('timestamp').openKeyCursor(null, 'prev'); // Сортируем по убыванию
      const keys = [];
      let count = 0;

      req.onsuccess = () => {
        const cursor = req.result;
        if (cursor) {
          count++;
          keys.push(cursor.key);
          
          // ✨ ОПТИМИЗАЦИЯ: Останавливаемся после maxBackups + 1
          // Удаляем только те, что превышают лимит
          if (count > this.maxBackups) {
            store.delete(cursor.key);
          }
          
          // ✨ ОПТИМИЗАЦИЯ: Останавливаемся когда нашли достаточно записей
          if (count >= this.maxBackups + 5) {
            // Проверяем еще несколько на всякий случай, но не все
            resolve();
            return;
          }
          
          cursor.continue();
        } else {
          resolve();
        }
      };

      req.onerror = () => resolve();
    });
  }

  /**
   * ✨ ОПТИМИЗИРОВАНО: Получает список всех резервных копий с кэшированием
   * @param {boolean} forceRefresh - принудительно обновить кэш
   * @returns {Promise<Array<{timestamp: number, entriesCount: number}>>}
   */
  async listBackups(forceRefresh = false) {
    // ✨ ОПТИМИЗАЦИЯ: Используем кэш если он актуален
    const now = Date.now();
    if (!forceRefresh && this.backupsCache && (now - this.cacheTimestamp) < this.cacheTTL) {
      return this.backupsCache;
    }

    try {
      const db = await this.openDB();
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const req = store.index('timestamp').openCursor(null, 'prev'); // Сортируем по убыванию

      return new Promise((resolve) => {
        const backups = [];

        req.onsuccess = () => {
          const cursor = req.result;
          if (cursor) {
            const { timestamp, data } = cursor.value;
            // Подсчитываем количество записей
            const entriesCount = Array.isArray(data.entries) ? data.entries.length : 0;
            backups.push({ timestamp, entriesCount });
            cursor.continue();
          } else {
            // ✨ ОПТИМИЗАЦИЯ: Сохраняем в кэш
            this.backupsCache = backups;
            this.cacheTimestamp = now;
            resolve(backups);
          }
        };

        req.onerror = () => {
          this.backupsCache = [];
          this.cacheTimestamp = now;
          resolve([]);
        };
      });
    } catch (error) {
      logger.error('❌ Ошибка получения списка бэкапов:', error);
      return [];
    }
  }

  /**
   * ✨ ОПТИМИЗИРОВАНО: Подписывается на события создания/удаления бэкапов в других вкладках
   * Оптимизация: инвалидация кэша при изменениях
   * @param {Function} callback - функция обратного вызова при изменении бэкапов
   * @returns {Function} функция для отписки
   */
  onBackupChange(callback) {
    if (!this.broadcastChannel) {
      logger.warn('⚠️ BroadcastChannel недоступен, синхронизация между вкладками не работает');
      return () => {}; // Возвращаем пустую функцию для отписки
    }

    const handler = (event) => {
      if (event.data && (event.data.type === 'backup-created' || event.data.type === 'backup-deleted')) {
        logger.log('📡 BroadcastChannel: получено сообщение о изменении бэкапа', event.data);
        // ✨ ОПТИМИЗАЦИЯ: Инвалидируем кэш при изменениях из других вкладок
        this.backupsCache = null;
        this.cacheTimestamp = 0;
        callback();
      }
    };

    this.broadcastChannel.addEventListener('message', handler);
    logger.log('✅ BroadcastChannel: подписка на изменения бэкапов установлена');

    // Возвращаем функцию для отписки
    return () => {
      this.broadcastChannel.removeEventListener('message', handler);
    };
  }

  /**
   * Закрывает соединение с BroadcastChannel (для cleanup)
   */
  close() {
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }
  }

  /**
   * Восстанавливает данные из резервной копии по timestamp
   * @param {number} timestamp - временная метка бэкапа
   * @returns {Promise<Object|null>} восстановленные данные или null
   */
  async restoreBackup(timestamp) {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);

      return new Promise((resolve) => {
        const req = store.get(timestamp);

        req.onsuccess = () => {
          const result = req.result?.data || null;
          if (result) {
            logger.log(`✅ Бэкап восстановлен: ${new Date(timestamp).toLocaleString('ru-RU')}`);
          }
          resolve(result);
        };

        req.onerror = () => {
          logger.error('❌ Ошибка восстановления бэкапа');
          resolve(null);
        };
      });
    } catch (error) {
      logger.error('❌ Ошибка восстановления бэкапа:', error);
      return null;
    }
  }

  /**
   * ✨ ОПТИМИЗИРОВАНО: Удаляет конкретную резервную копию
   * Оптимизация: инвалидация кэша после удаления
   * @param {number} timestamp - временная метка бэкапа для удаления
   * @returns {Promise<boolean>} true если удаление успешно
   */
  async deleteBackup(timestamp) {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      const success = await new Promise((resolve) => {
        const req = store.delete(timestamp);

        req.onsuccess = () => {
          logger.log(`✅ Бэкап удален: ${new Date(timestamp).toLocaleString('ru-RU')}`);
          resolve(true);
        };

        req.onerror = () => {
          logger.error('❌ Ошибка удаления бэкапа');
          resolve(false);
        };
      });

      // ✨ ОПТИМИЗАЦИЯ: Инвалидируем кэш после удаления
      if (success) {
        this.backupsCache = null;
        this.cacheTimestamp = 0;
      }

      // Уведомляем другие вкладки об удалении бэкапа
      if (this.broadcastChannel) {
        this.broadcastChannel.postMessage({
          type: 'backup-deleted',
          timestamp
        });
      }

      return success;
    } catch (error) {
      logger.error('❌ Ошибка удаления бэкапа:', error);
      return false;
    }
  }

  /**
   * Получает информацию о конкретном бэкапе
   * @param {number} timestamp - временная метка бэкапа
   * @returns {Promise<{timestamp: number, data: Object, entriesCount: number}|null>}
   */
  async getBackupInfo(timestamp) {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);

      return new Promise((resolve) => {
        const req = store.get(timestamp);

        req.onsuccess = () => {
          const backup = req.result;
          if (backup) {
            const entriesCount = Array.isArray(backup.data?.entries) ? backup.data.entries.length : 0;
            resolve({
              timestamp: backup.timestamp,
              data: backup.data,
              entriesCount
            });
          } else {
            resolve(null);
          }
        };

        req.onerror = () => resolve(null);
      });
    } catch (error) {
      logger.error('❌ Ошибка получения информации о бэкапе:', error);
      return null;
    }
  }
}

// Создаем единственный экземпляр менеджера (singleton pattern)
export const backupManager = new BackupManager();
