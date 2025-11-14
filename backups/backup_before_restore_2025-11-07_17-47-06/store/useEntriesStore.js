import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useHistoryStore } from './useHistoryStore';
import { backupManager } from '../utils/backupManager';
import { logger } from '../utils/logger';
import { generateUUID } from '../utils/uuid';
import { handleError, checkStorageSpace } from '../utils/errorHandler';

/**
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 * 
 * Zustand - это библиотека для управления состоянием в React.
 * Она позволяет создавать "хранилища" (stores) где мы можем хранить данные
 * и функции для их изменения.
 * 
 * persist - это middleware (промежуточное ПО) которое автоматически
 * сохраняет данные в localStorage браузера.
 * 
 * История изменений (Undo/Redo):
 * Перед каждым изменением сохраняем текущее состояние в useHistoryStore
 */

export const useEntriesStore = create(
  persist(
    (set, get) => {
      // Используем WeakMap для хранения таймеров (избегаем memory leaks)
      // Каждый экземпляр store получает свой таймер, который автоматически очищается
      const backupTimeouts = new WeakMap();
      const storeInstance = {}; // Уникальный объект для этого экземпляра store
      
      // Инициализируем WeakMap для этого экземпляра
      backupTimeouts.set(storeInstance, null);

      /**
       * Создает бэкап с задержкой (debounce) чтобы не создавать бэкап при каждом изменении
       * @private
       */
      const scheduleBackup = () => {
        // Получаем текущий таймер для этого экземпляра store
        const currentTimeout = backupTimeouts.get(storeInstance);
        
        // Очищаем предыдущий таймер если он существует
        if (currentTimeout !== null && currentTimeout !== undefined) {
          clearTimeout(currentTimeout);
        }

        // Устанавливаем новый таймер на 1 секунду
        const newTimeout = setTimeout(async () => {
          try {
            // Проверяем доступное место перед созданием бэкапа
            const storageInfo = checkStorageSpace();
            if (!storageInfo.hasSpace) {
              handleError(
                new Error('Недостаточно места для создания резервной копии'),
                { operation: 'Автоматический бэкап', storageInfo }
              );
              backupTimeouts.set(storeInstance, null);
              return;
            }
            
            const { entries } = get();
            // Получаем настройки из другого store
            const { useSettingsStore } = await import('./useSettingsStore');
            const settings = useSettingsStore.getState();
            
            // Создаем бэкап с записями и настройками
            await backupManager.saveBackup({
              entries,
              categories: settings.categories,
              dailyGoal: settings.dailyGoal,
              dailyHours: settings.dailyHours,
              theme: settings.theme,
              timestamp: Date.now()
            });
            
            // Очищаем ссылку на таймер после выполнения
            backupTimeouts.set(storeInstance, null);
          } catch (error) {
            // Используем централизованную обработку ошибок
            handleError(error, { operation: 'Автоматический бэкап' });
            // Очищаем ссылку даже при ошибке
            backupTimeouts.set(storeInstance, null);
          }
        }, 1000); // Задержка 1 секунда
        
        // Сохраняем новый таймер
        backupTimeouts.set(storeInstance, newTimeout);
      };
      
      /**
       * Очищает активный таймер бэкапа (вызывается при необходимости)
       * @private
       */
      const clearBackupTimer = () => {
        const currentTimeout = backupTimeouts.get(storeInstance);
        if (currentTimeout !== null && currentTimeout !== undefined) {
          clearTimeout(currentTimeout);
          backupTimeouts.set(storeInstance, null);
        }
      };

      return {
        // Массив всех записей времени
        entries: [],
      
      /**
       * Добавляет новую запись времени
       * @param {Object} entry - объект записи с полями: date, start, end, category, description, rate
       */
      addEntry: (entry) => {
        // Сохраняем текущее состояние перед изменением
        const currentEntries = get().entries;
        useHistoryStore.getState().pushToUndo(currentEntries, 'Добавлена запись');
        
        // Используем ID из entry, если он есть, иначе генерируем новый
        const entryWithId = {
          ...entry,
          id: entry.id || generateUUID(),
          createdAt: entry.createdAt || new Date().toISOString(),
          updatedAt: entry.updatedAt || new Date().toISOString()
        };
        
        set((state) => ({
          entries: [...state.entries, entryWithId]
        }));
        
        // Создаем автоматический бэкап
        scheduleBackup();
      },
      
      /**
       * Обновляет существующую запись
       * @param {string} id - ID записи для обновления
       * @param {Object} updates - объект с новыми данными
       */
      updateEntry: (id, updates) => {
        // Сохраняем текущее состояние перед изменением
        const currentEntries = get().entries;
        useHistoryStore.getState().pushToUndo(currentEntries, 'Обновлена запись');
        
        // ИСПРАВЛЕНО: Конвертируем id в строку для корректного сравнения
        const idString = String(id);
        
        set((state) => ({
          entries: state.entries.map(entry => {
            // ИСПРАВЛЕНО: Конвертируем entry.id в строку для сравнения
            const entryIdString = String(entry.id);
            return entryIdString === idString 
              ? { 
                  ...entry, 
                  ...updates,
                  // ИСПРАВЛЕНО: Убеждаемся, что earned - это число, а не строка
                  earned: typeof updates.earned === 'number' ? updates.earned : parseFloat(updates.earned) || entry.earned,
                  updatedAt: new Date().toISOString() 
                } 
              : entry;
          })
        }));
        
        // Создаем автоматический бэкап
        scheduleBackup();
      },
      
      /**
       * Удаляет запись по ID
       * @param {string} id - ID записи для удаления
       */
      deleteEntry: (id) => {
        // Сохраняем текущее состояние перед изменением
        const currentEntries = get().entries;
        useHistoryStore.getState().pushToUndo(currentEntries, 'Удалена запись');
        
        set((state) => ({
          entries: state.entries.filter(entry => entry.id !== id)
        }));
        
        // Создаем автоматический бэкап
        scheduleBackup();
      },
      
      /**
       * Очищает все записи
       */
      clearEntries: () => {
        // Сохраняем текущее состояние перед изменением
        const currentEntries = get().entries;
        useHistoryStore.getState().pushToUndo(currentEntries, 'Очищены все записи');
        
        set({ entries: [] });
        
        // Создаем автоматический бэкап
        scheduleBackup();
      },
      
      /**
       * Импортирует массив записей (заменяет все существующие)
       * @param {Array} newEntries - новый массив записей
       */
      importEntries: (newEntries) => {
        // Сохраняем текущее состояние перед изменением
        const currentEntries = get().entries;
        useHistoryStore.getState().pushToUndo(currentEntries, 'Импортированы данные');
        
        set({ entries: newEntries });
        
        // Создаем автоматический бэкап
        scheduleBackup();
      },
      
      /**
       * Восстанавливает состояние из истории (для Undo/Redo)
       * @param {Array} entries - массив записей для восстановления
       */
      restoreEntries: (entries) => {
        set({ entries });
      },
      
      /**
       * Получает записи за определенный период
       * @param {Date} startDate - начальная дата
       * @param {Date} endDate - конечная дата
       * @returns {Array} отфильтрованные записи
       */
      getEntriesByPeriod: (startDate, endDate) => {
        const { entries } = get();
        return entries.filter(entry => {
          const entryDate = new Date(entry.date);
          return entryDate >= startDate && entryDate <= endDate;
        });
      },
      
      /**
       * Получает записи за сегодня
       * @returns {Array} записи за сегодняшний день
       */
      getTodayEntries: () => {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
        
        return get().getEntriesByPeriod(startOfDay, endOfDay);
      },
      
      /**
       * Получает статистику по записям
       * @param {Array} entries - массив записей для анализа
       * @returns {Object} объект со статистикой
       */
      getStatistics: (entries = null) => {
        const targetEntries = entries || get().entries;
        
        const totalHours = targetEntries.reduce((sum, entry) => sum + parseFloat(entry.duration || 0), 0);
        const totalEarned = targetEntries.reduce((sum, entry) => sum + parseFloat(entry.earned || 0), 0);
        const averageRate = totalHours > 0 ? totalEarned / totalHours : 0;
        
        return {
          totalHours: totalHours.toFixed(2),
          totalEarned: totalEarned.toFixed(2),
          averageRate: averageRate.toFixed(2),
          entriesCount: targetEntries.length,
        };
      },
      
      /**
       * Массовое изменение категории для нескольких записей
       * @param {Array<string>} entryIds - массив ID записей для изменения
       * @param {string} categoryId - новый ID категории
       */
      bulkUpdateCategory: (entryIds, categoryId) => {
        const currentEntries = get().entries;
        useHistoryStore.getState().pushToUndo(currentEntries, `Изменена категория для ${entryIds.length} записей`);
        
        set((state) => ({
          entries: state.entries.map(entry => 
            entryIds.includes(entry.id)
              ? { 
                  ...entry, 
                  category: categoryId,
                  categoryId: categoryId,
                  updatedAt: new Date().toISOString() 
                } 
              : entry
          )
        }));
        
        // Создаем автоматический бэкап
        scheduleBackup();
      },
      
      /**
       * Массовое удаление записей
       * @param {Array<string>} entryIds - массив ID записей для удаления
       */
      bulkDeleteEntries: (entryIds) => {
        const currentEntries = get().entries;
        useHistoryStore.getState().pushToUndo(currentEntries, `Удалено ${entryIds.length} записей`);
        
        set((state) => ({
          entries: state.entries.filter(entry => !entryIds.includes(entry.id))
        }));
        
        // Создаем автоматический бэкап
        scheduleBackup();
      },
      
      /**
       * Получает записи по массиву ID
       * @param {Array<string>} entryIds - массив ID записей
       * @returns {Array} найденные записи
       */
      getEntriesByIds: (entryIds) => {
        const { entries } = get();
        return entries.filter(entry => entryIds.includes(entry.id));
      },
      
      /**
       * Создает резервную копию вручную
       * @returns {Promise<{success: boolean, timestamp?: number}>}
       */
      createManualBackup: async () => {
        try {
          // Проверяем доступное место перед созданием бэкапа
          const storageInfo = checkStorageSpace();
          if (!storageInfo.hasSpace) {
            const errorMessage = handleError(
              new Error('Недостаточно места для создания резервной копии'),
              { operation: 'Ручной бэкап', storageInfo }
            );
            return { success: false, error: errorMessage };
          }
          
          const { entries } = get();
          const { useSettingsStore } = await import('./useSettingsStore');
          const settings = useSettingsStore.getState();
          
          const result = await backupManager.saveBackup({
            entries,
            categories: settings.categories,
            dailyGoal: settings.dailyGoal,
            dailyHours: settings.dailyHours,
            theme: settings.theme,
            timestamp: Date.now()
          });
          
          return result;
        } catch (error) {
          // Используем централизованную обработку ошибок
          const errorMessage = handleError(error, { operation: 'Ручной бэкап' });
          return { success: false, error: errorMessage };
        }
      },
      
      /**
       * Очищает активный таймер бэкапа (для предотвращения memory leaks)
       */
      clearBackupTimer: clearBackupTimer,
      
      /**
       * Восстанавливает данные из резервной копии
       * @param {number} timestamp - временная метка бэкапа
       * @returns {Promise<boolean>} true если восстановление успешно
       */
      restoreFromBackup: async (timestamp) => {
        try {
          const backupData = await backupManager.restoreBackup(timestamp);
          
          if (!backupData) {
            handleError(
              new Error('Резервная копия не найдена или повреждена'),
              { operation: 'Восстановление из бэкапа', timestamp }
            );
            return false;
          }
          
          // Восстанавливаем записи
          if (backupData.entries) {
            set({ entries: backupData.entries });
          }
          
          // Восстанавливаем настройки если они есть
          if (backupData.categories || backupData.dailyGoal !== undefined) {
            const { useSettingsStore } = await import('./useSettingsStore');
            const settingsStore = useSettingsStore.getState();
            
            if (backupData.categories) {
              settingsStore.importCategories(backupData.categories);
            }
            if (backupData.dailyGoal !== undefined || backupData.dailyHours !== undefined) {
              settingsStore.updateSettings({
                ...(backupData.dailyGoal !== undefined && { dailyGoal: backupData.dailyGoal }),
                ...(backupData.dailyHours !== undefined && { dailyHours: backupData.dailyHours })
              });
            }
            if (backupData.theme) {
              settingsStore.setTheme(backupData.theme);
            }
          }
          
          return true;
        } catch (error) {
          // Используем централизованную обработку ошибок
          handleError(error, { operation: 'Восстановление из бэкапа', timestamp });
          return false;
        }
      },
    };
    },
    {
      name: 'time-tracker-entries', // Ключ в localStorage
      version: 1, // Версия для миграций данных
    }
  )
);
