import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useHistoryStore } from './useHistoryStore'
import { useSettingsStore } from './useSettingsStore'
import { useAuthStore } from './useAuthStore'
import { supabaseService } from '../services/supabase'
import { backupManager } from '../utils/backupManager'
import { logger } from '../utils/logger'
import { generateUUID } from '../utils/uuid'
import { handleError, checkStorageSpace } from '../utils/errorHandler'
import { syncManager, SyncMessageType } from '../utils/syncManager'
import { setLastIntegrityRepairTime } from '../utils/syncUtils'
import {
  validateEntry,
  checkEntriesIntegrity,
  repairEntries,
  createIntegrityReport,
} from '../utils/dataIntegrity'
import type { EntriesState, TimeEntry, BackupResult, BackupData, Category } from '../types'

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

export const useEntriesStore = create<EntriesState>()(
  persist(
    (set, get) => {
      // Используем WeakMap для хранения таймеров (избегаем memory leaks)
      // Каждый экземпляр store получает свой таймер, который автоматически очищается
      const backupTimeouts = new WeakMap()
      const storeInstance = {} // Уникальный объект для этого экземпляра store

      // Инициализируем WeakMap для этого экземпляра
      backupTimeouts.set(storeInstance, null)

      /**
       * Создает бэкап с задержкой (debounce) чтобы не создавать бэкап при каждом изменении
       * @private
       */
      const scheduleBackup = () => {
        // Получаем текущий таймер для этого экземпляра store
        const currentTimeout = backupTimeouts.get(storeInstance)

        // Очищаем предыдущий таймер если он существует
        if (currentTimeout !== null && currentTimeout !== undefined) {
          clearTimeout(currentTimeout)
        }

        // ✅ ОПТИМИЗАЦИЯ: Увеличиваем задержку до 2 секунд для уменьшения частоты бэкапов
        // Это снижает нагрузку на IndexedDB и улучшает производительность
        const newTimeout = setTimeout(async () => {
          try {
            // Проверяем доступное место перед созданием бэкапа
            const storageInfo = checkStorageSpace()
            if (!storageInfo.hasSpace) {
              handleError(new Error('Недостаточно места для создания резервной копии'), {
                operation: 'Автоматический бэкап',
                storageInfo,
              })
              backupTimeouts.set(storeInstance, null)
              return
            }

            const { entries } = get()
            // Получаем настройки из другого store
            const settings = useSettingsStore.getState()

            // Создаем бэкап с записями и настройками
            // Создаем бэкап с записями и настройками
            const backupData: BackupData = {
              entries,
              categories: settings.categories,
              dailyGoal: settings.dailyGoal,
              dailyHours: settings.dailyHours,
              theme: settings.theme,
              timestamp: Date.now(),
              version: 1,
            }

            // Создаем локальный бэкап
            await backupManager.saveBackup(backupData)

            // ✅ CLOUD SYNC: Если пользователь авторизован, отправляем бэкап в облако
            const { user, setLastSyncTime } = useAuthStore.getState()
            if (user) {
              supabaseService.uploadBackup(user.id, backupData)
                .then(() => {
                    setLastSyncTime(Date.now())
                })
                .catch(err => {
                    console.error('Cloud backup failed:', err)
                })
            }

            // Очищаем ссылку на таймер после выполнения
            backupTimeouts.set(storeInstance, null)
          } catch (error) {
            // Используем централизованную обработку ошибок
            handleError(error instanceof Error ? error : new Error(String(error)), { operation: 'Автоматический бэкап' })
            // Очищаем ссылку даже при ошибке
            backupTimeouts.set(storeInstance, null)
          }
        }, 1000) // Задержка 1 секунда

        // Сохраняем новый таймер
        backupTimeouts.set(storeInstance, newTimeout)
      }

      /**
       * Очищает активный таймер бэкапа (вызывается при необходимости)
       * @private
       */
      const clearBackupTimer = () => {
        const currentTimeout = backupTimeouts.get(storeInstance)
        if (currentTimeout !== null && currentTimeout !== undefined) {
          clearTimeout(currentTimeout)
          backupTimeouts.set(storeInstance, null)
        }
      }

      return {
        // Массив всех записей времени
        entries: [],

        /**
         * Добавляет новую запись времени
         * @param {Object} entry - объект записи с полями: date, start, end, category, description, rate
         */
        addEntry: entry => {
          // ✅ ВАЛИДАЦИЯ: Проверяем данные перед сохранением
          const validation = validateEntry(entry)
          if (!validation.isValid) {
            const errorMessage = validation.errors.join(', ')
            logger.error('Entry validation failed', { errors: validation.errors })
            handleError(new Error(`Ошибка валидации: ${errorMessage}`), {
              operation: 'Добавление записи',
            })
            return // Не сохраняем невалидную запись
          }

          // Сохраняем текущее состояние перед изменением
          const currentEntries = get().entries
          useHistoryStore.getState().pushToUndo(currentEntries, 'Добавлена запись')

          // Применяем автоматические исправления если есть
          const fixedValues = validation.fixed || {}

          // Используем ID из entry, если он есть, иначе генерируем новый
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const entryAny = entry as any
          const entryWithId: TimeEntry = {
            ...entry,
            ...fixedValues,
            id: entryAny.id || generateUUID(),
            createdAt: entryAny.createdAt || new Date().toISOString(),
            updatedAt: entryAny.updatedAt || new Date().toISOString(),
          } as TimeEntry

          set(state => ({
            entries: [...state.entries, entryWithId],
          }))

          // ✅ СИНХРОНИЗАЦИЯ: Отправляем в другие вкладки (без влияния на UI)
          syncManager.broadcast(SyncMessageType.ENTRY_ADDED, entryWithId)

          // Создаем автоматический бэкап
          scheduleBackup()
        },

        /**
         * Обновляет существующую запись
         * @param {string} id - ID записи для обновления
         * @param {Object} updates - объект с новыми данными
         */
        updateEntry: (id, updates) => {
          // Сохраняем текущее состояние перед изменением
          const currentEntries = get().entries
          useHistoryStore.getState().pushToUndo(currentEntries, 'Обновлена запись')

          // ИСПРАВЛЕНО: Конвертируем id в строку для корректного сравнения
          const idString = String(id)

          set(state => ({
            entries: state.entries.map(entry => {
              // ИСПРАВЛЕНО: Конвертируем entry.id в строку для сравнения
              const entryIdString = String(entry.id)
              return entryIdString === idString
                ? {
                    ...entry,
                    ...updates,
                    // ИСПРАВЛЕНО: Убеждаемся, что earned - это число, а не строка
                    earned:
                      typeof updates.earned === 'number'
                        ? updates.earned
                        : parseFloat(String(updates.earned ?? '')) || entry.earned,
                    updatedAt: new Date().toISOString(),
                  }
                : entry
            }),
          }))

          // ✅ СИНХРОНИЗАЦИЯ: Отправляем в другие вкладки (без влияния на UI)
          syncManager.broadcast(SyncMessageType.ENTRY_UPDATED, { id: idString, updates })

          // Создаем автоматический бэкап
          scheduleBackup()
        },

        /**
         * Удаляет запись по ID
         * @param {string} id - ID записи для удаления
         */
        deleteEntry: id => {
          // Сохраняем текущее состояние перед изменением
          const currentEntries = get().entries
          useHistoryStore.getState().pushToUndo(currentEntries, 'Удалена запись')

          // ИСПРАВЛЕНО: Конвертируем id в строку для корректного сравнения
          const idString = String(id)

          set(state => ({
            entries: state.entries.filter(entry => String(entry.id) !== idString),
          }))

          // ✅ СИНХРОНИЗАЦИЯ: Отправляем в другие вкладки (без влияния на UI)
          syncManager.broadcast(SyncMessageType.ENTRY_DELETED, { id: idString })

          // Создаем автоматический бэкап
          scheduleBackup()
        },

        /**
         * Очищает все записи
         */
        clearEntries: () => {
          // Сохраняем текущее состояние перед изменением
          const currentEntries = get().entries
          useHistoryStore.getState().pushToUndo(currentEntries, 'Очищены все записи')

          set({ entries: [] })

          // ✅ СИНХРОНИЗАЦИЯ: Отправляем в другие вкладки (без влияния на UI)
          syncManager.broadcast(SyncMessageType.ENTRIES_CLEARED, {})

          // Создаем автоматический бэкап
          scheduleBackup()
        },

        /**
         * Импортирует массив записей (заменяет все существующие)
         * @param {Array} newEntries - новый массив записей
         */
        importEntries: newEntries => {
          // Сохраняем текущее состояние перед изменением
          const currentEntries = get().entries
          useHistoryStore.getState().pushToUndo(currentEntries, 'Импортированы данные')

          set({ entries: newEntries })

          // Создаем автоматический бэкап
          scheduleBackup()
        },

        /**
         * Восстанавливает состояние из истории (для Undo/Redo)
         * @param {Array} entries - массив записей для восстановления
         */
        restoreEntries: entries => {
          set({ entries })
        },

        /**
         * Получает записи за определенный период
         * @param {Date} startDate - начальная дата
         * @param {Date} endDate - конечная дата
         * @returns {Array} отфильтрованные записи
         */
        getEntriesByPeriod: (startDate, endDate) => {
          const { entries } = get()
          return entries.filter(entry => {
            const entryDate = new Date(entry.date)
            return entryDate >= startDate && entryDate <= endDate
          })
        },

        /**
         * Получает записи за сегодня
         * @returns {Array} записи за сегодняшний день
         */
        getTodayEntries: () => {
          const today = new Date()
          const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
          const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

          return get().getEntriesByPeriod(startOfDay, endOfDay)
        },

        /**
         * Получает статистику по записям
         * @param {Array} entries - массив записей для анализа
         * @returns {Object} объект со статистикой
         */
        getStatistics: (entries = null) => {
          const targetEntries = entries || get().entries

          const totalHours = targetEntries.reduce(
            (sum, entry) => sum + parseFloat(String(entry.duration) || '0'),
            0
          )
          const totalEarned = targetEntries.reduce(
            (sum, entry) => sum + parseFloat(String(entry.earned) || '0'),
            0
          )
          const averageRate = totalHours > 0 ? totalEarned / totalHours : 0

          return {
            totalHours: totalHours.toFixed(2),
            totalEarned: totalEarned.toFixed(2),
            averageRate: averageRate.toFixed(2),
            entriesCount: targetEntries.length,
          }
        },

        /**
         * Массовое изменение категории для нескольких записей
         * @param {Array<string>} entryIds - массив ID записей для изменения
         * @param {string} categoryId - новый ID категории
         */
        bulkUpdateCategory: (entryIds, categoryId) => {
          const currentEntries = get().entries
          useHistoryStore
            .getState()
            .pushToUndo(currentEntries, `Изменена категория для ${entryIds.length} записей`)

          set(state => ({
            entries: state.entries.map(entry =>
              entryIds.includes(entry.id)
                ? {
                    ...entry,
                    category: categoryId,
                    categoryId,
                    updatedAt: new Date().toISOString(),
                  }
                : entry
            ),
          }))

          // ✅ СИНХРОНИЗАЦИЯ: Отправляем в другие вкладки (без влияния на UI)
          syncManager.broadcast(SyncMessageType.ENTRIES_BULK_UPDATE, {
            entryIds: entryIds.map(id => String(id)),
            categoryId,
          })

          // Создаем автоматический бэкап
          scheduleBackup()
        },

        /**
         * Массовое удаление записей
         * @param {Array<string>} entryIds - массив ID записей для удаления
         */
        bulkDeleteEntries: entryIds => {
          const currentEntries = get().entries
          useHistoryStore
            .getState()
            .pushToUndo(currentEntries, `Удалено ${entryIds.length} записей`)

          // ИСПРАВЛЕНО: Конвертируем все ID в строки для корректного сравнения
          const entryIdsStrings = entryIds.map(id => String(id))

          set(state => ({
            entries: state.entries.filter(entry => !entryIdsStrings.includes(String(entry.id))),
          }))

          // ✅ СИНХРОНИЗАЦИЯ: Отправляем в другие вкладки (без влияния на UI)
          syncManager.broadcast(SyncMessageType.ENTRIES_BULK_UPDATE, {
            type: 'delete',
            entryIds: entryIdsStrings,
          })

          // Создаем автоматический бэкап
          scheduleBackup()
        },

        /**
         * Получает записи по массиву ID
         * @param {Array<string>} entryIds - массив ID записей
         * @returns {Array} найденные записи
         */
        getEntriesByIds: entryIds => {
          const { entries } = get()
          // ИСПРАВЛЕНО: Конвертируем все ID в строки для корректного сравнения
          const entryIdsStrings = entryIds.map(id => String(id))
          return entries.filter(entry => entryIdsStrings.includes(String(entry.id)))
        },

        /**
         * Обновляет детали категории во всех связанных записях
         * @param {string} categoryId - ID категории
         * @param {string} newName - новое название
         * @param {string} [oldName] - старое название (для поиска legacy записей)
         */
        updateEntryCategoryDetails: (categoryId, newName, oldName) => {
          const currentEntries = get().entries
          // Не создаем undo если изменений нет, но тут всегда могут быть
          // Можно проверить есть ли что менять, но проще записать в историю
          useHistoryStore.getState().pushToUndo(currentEntries, `Обновление категории "${newName}"`)

          set(state => ({
            entries: state.entries.map(entry => {
              // 1. Если есть совпадение по ID - обновляем имя
              if (String(entry.categoryId) === String(categoryId)) {
                return { ...entry, category: newName, updatedAt: new Date().toISOString() }
              }
              // 2. Если ID нет или не совпадает, но совпадает старое имя - обновляем имя и проставляем ID
              if (oldName && entry.category === oldName) {
                return { 
                  ...entry, 
                  category: newName, 
                  categoryId: categoryId, 
                  updatedAt: new Date().toISOString() 
                }
              }
              return entry
            }),
          }))

          scheduleBackup()
        },

        /**
         * Создает резервную копию вручную
         * @returns {Promise<{success: boolean, timestamp?: number}>}
         */
        createManualBackup: async () => {
          try {
            // Проверяем доступное место перед созданием бэкапа
            const storageInfo = checkStorageSpace()
            if (!storageInfo.hasSpace) {
              const errorMessage = handleError(
                new Error('Недостаточно места для создания резервной копии'),
                { operation: 'Ручной бэкап', storageInfo }
              )
              return { success: false, error: errorMessage }
            }

            const { entries } = get()
            const settings = useSettingsStore.getState()

            const result = await backupManager.saveBackup({
              entries,
              categories: settings.categories,
              dailyGoal: settings.dailyGoal,
              dailyHours: settings.dailyHours,
              theme: settings.theme,
              timestamp: Date.now(),
            })

            return result
          } catch (error) {
            // Используем централизованную обработку ошибок
            const errorMessage = handleError(error instanceof Error ? error : new Error(String(error)), { operation: 'Ручной бэкап' })
            return { success: false, error: errorMessage }
          }
        },

        /**
         * Синхронизирует записи с текущими категориями по названию
         * (Восстанавливает потерянные связи categoryId)
         * @param {Array} categories - список актуальных категорий
         * @returns {number} количество обновленных записей
         */
        syncCategories: categories => {
          const { entries } = get()
          let updatedCount = 0
          
          // Создаем карту для быстрого поиска: Имя (lowercase) -> ID
          const nameToId = new Map()
          // Создаем карту: ID -> Имя (для обновления имени, если ID совпадает)
          const idToName = new Map()
          
          categories.forEach(c => {
            if (c.name) {
              nameToId.set(c.name.trim().toLowerCase(), c.id)
              idToName.set(c.id, c.name.trim())
            }
          })

          const newEntries = entries.map(entry => {
            let changed = false
            let newEntry = { ...entry }
            
            const entryName = (typeof entry.category === 'string' ? entry.category : '').trim().toLowerCase()
            const entryId = entry.categoryId ? String(entry.categoryId) : null

            // 1. Если есть ID и он есть в списке категорий -> Обновляем имя (на случай переименования)
            if (entryId && idToName.has(entryId)) {
              if (newEntry.category !== idToName.get(entryId)) {
                newEntry.category = idToName.get(entryId)
                changed = true
              }
            } 
            // 2. Иначе, если ID нет или некорректный, ищем по имени
            else {
               let targetId = null
               
               // Хелпер для нормализации (удаляет скобки, лишние пробелы)
               const normalize = (s) => s.replace(/[\[\]\(\)\-_]/g, '').replace(/\s+/g, ' ').trim()
               const normEntryName = normalize(entryName)

               // 2a. Точное совпадение
               if (entryName && nameToId.has(entryName)) {
                 targetId = nameToId.get(entryName)
               }
               
               // 2b. Поиск по нормализованному имени (игнорируя скобки)
               // Пример: "Красота ответов" == "[Красота] ответов"
               if (!targetId && entryName) {
                  for (const [catName, catId] of nameToId.entries()) {
                      if (normalize(catName) === normEntryName) {
                          targetId = catId
                          break
                      }
                  }
               }

               // 2c. Эвристика "Ends With" (Суффикс)
               // Пример: "Задача [Работа]" -> "[Работа]"
               if (!targetId && entryName) {
                   for (const [catName, catId] of nameToId.entries()) {
                       // Защита от коротких совпадений (мин 3 символа)
                       if (catName.length >= 3 && entryName.endsWith(catName)) {
                           targetId = catId
                           break
                       }
                   }
               }

               // Применяем изменения, если нашли ID
               if (targetId && String(newEntry.categoryId) !== String(targetId)) {
                 newEntry.categoryId = targetId
                 newEntry.category = idToName.get(targetId)
                 changed = true
               }
            }

            if (changed) {
              updatedCount++
              return { ...newEntry, updatedAt: new Date().toISOString() }
            }
            return entry
          })

          if (updatedCount > 0) {
            useHistoryStore.getState().pushToUndo(entries, `Синхронизация ${updatedCount} записей`)
            set({ entries: newEntries })
            scheduleBackup()
          }
          
          return updatedCount
        },

        /**
         * Очищает активный таймер бэкапа (для предотвращения memory leaks)
         */
        clearBackupTimer,

        /**
         * Восстанавливает данные из резервной копии
         * @param {number} timestamp - временная метка бэкапа
         * @returns {Promise<boolean>} true если восстановление успешно
         */
        restoreFromBackup: async timestamp => {
          try {
            const backupData = await backupManager.restoreBackup(timestamp)

            if (!backupData) {
              handleError(new Error('Резервная копия не найдена или повреждена'), {
                operation: 'Восстановление из бэкапа',
                timestamp,
              })
              return false
            }

            // Восстанавливаем записи
            if (backupData.entries && Array.isArray(backupData.entries)) {
              set({ entries: backupData.entries as TimeEntry[] })
            }

            // Восстанавливаем настройки если они есть
            if (backupData.categories || backupData.dailyGoal !== undefined) {
              const settingsStore = useSettingsStore.getState()

              if (backupData.categories && Array.isArray(backupData.categories)) {
                settingsStore.importCategories(backupData.categories as Category[])
              }
              if (typeof backupData.dailyGoal === 'number' || typeof backupData.dailyHours === 'number') {
                settingsStore.updateSettings({
                  ...(typeof backupData.dailyGoal === 'number' && { dailyGoal: backupData.dailyGoal }),
                  ...(typeof backupData.dailyHours === 'number' && { dailyHours: backupData.dailyHours }),
                })
              }
              if (typeof backupData.theme === 'string' && ['light', 'dark', 'auto'].includes(backupData.theme)) {
                settingsStore.setTheme(backupData.theme as 'light' | 'dark' | 'auto')
              }
            }

            return true
          } catch (error) {
            // Используем централизованную обработку ошибок
            handleError(error instanceof Error ? error : new Error(String(error)), { operation: 'Восстановление из бэкапа', timestamp })
            return false
          }
        },

        /**
         * Восстанавливает данные из облачного бэкапа
         */
        /**
         * Восстанавливает данные из облачного бэкапа
         */
        restoreFromCloudBackup: async (backupData: BackupData) => {
          try {
             if (!backupData) return false

             // Восстанавливаем записи
             if (backupData.entries && Array.isArray(backupData.entries)) {
               set({ entries: backupData.entries })
             }

             // Восстанавливаем настройки
             const settingsStore = useSettingsStore.getState()

             if (backupData.categories && Array.isArray(backupData.categories)) {
               settingsStore.importCategories(backupData.categories)
             }
             
             if (typeof backupData.dailyGoal === 'number') {
                 settingsStore.updateSettings({ dailyGoal: backupData.dailyGoal })
             }
             
             if (typeof backupData.dailyHours === 'number') {
                 settingsStore.updateSettings({ dailyHours: backupData.dailyHours })
             }

             // ⚠️ FIX: Не восстанавливаем тему из облака при синхронизации данных,
             // так как это часто сбрасывает локальную настройку (Dark -> Light)
             // и раздражает пользователя. Тема должна быть локальной прерогативой или синхронизироваться отдельно.
             /*
             if (backupData.theme && ['light', 'dark', 'auto'].includes(backupData.theme)) {
               settingsStore.setTheme(backupData.theme as 'light' | 'dark' | 'auto')
             }
             */
             
             // Сохраняем восстановленные данные как новый локальный бэкап
             scheduleBackup()
             
             // Обновляем время синхронизации
             useAuthStore.getState().setLastSyncTime(Date.now())
             
             return true
          } catch (e) {
             console.error('Restore from cloud failed', e)
             return false
          }
        },
        
        /**
         * Запускает процедуру бэкапа (включая облако)
         */
        scheduleBackup,
      }
    },
    {
      name: 'entries-storage', // Изменено имя хранилища
      version: 1, // Версия для миграций данных
      // ✅ ОПТИМИЗАЦИЯ: Используем partialize для оптимизации размера данных
      // Сохраняем только entries, исключаем функции и временные данные
      partialize: state => ({ entries: state.entries }),
      
      // ✅ ПРОВЕРКА ЦЕЛОСТНОСТИ: При восстановлении из localStorage
      onRehydrateStorage: () => (state) => {
        if (!state?.entries) return
        
        // Проверяем целостность данных
        const integrityResult = checkEntriesIntegrity(state.entries)
        
        if (!integrityResult.isValid) {
          logger.warn('Data integrity issues detected', {
            invalid: integrityResult.invalidEntries,
            total: integrityResult.totalEntries,
          })
          
          // Пытаемся восстановить данные
          const { repaired, removed, fixed } = repairEntries(state.entries)
          
          if (removed.length > 0) {
            logger.error('Some entries were removed due to unfixable errors', { removed })
          }
          
          if (fixed.length > 0) {
            logger.info('Some entries were auto-fixed', { fixed: fixed.length })
          }
          
          // Обновляем state с исправленными данными
          state.entries = repaired
          
          // 🛡️ Устанавливаем флаг времени ремонта для подавления ложных конфликтов
          // Это предотвратит показ диалога синхронизации сразу после очистки данных
          setLastIntegrityRepairTime(Date.now())
          
          // Создаём бэкап после восстановления И синхронизируем с облаком
          // Используем scheduleBackup, чтобы "чистая" версия улетела в Supabase
          // и предотвратила повторный конфликт (Local != Cloud)
          useEntriesStore.getState().scheduleBackup()
        } else {
          logger.info('Data integrity check passed', {
            entries: integrityResult.totalEntries,
          })
        }
      },
    }
  )
)

// Helper to reset store
export const resetEntriesStore = () => {
  useEntriesStore.setState({ entries: [] })
}

// ===== Атомарные селекторы (рекомендуемое использование) =====
export const useEntries = () => useEntriesStore(state => state.entries)

// Actions
export const useAddEntry = () => useEntriesStore(state => state.addEntry)
export const useUpdateEntry = () => useEntriesStore(state => state.updateEntry)
export const useDeleteEntry = () => useEntriesStore(state => state.deleteEntry)
export const useClearEntries = () => useEntriesStore(state => state.clearEntries)
export const useImportEntries = () => useEntriesStore(state => state.importEntries)
export const useBulkUpdateCategory = () => useEntriesStore(state => state.bulkUpdateCategory)
export const useBulkDeleteEntries = () => useEntriesStore(state => state.bulkDeleteEntries)
export const useGetEntriesByIds = () => useEntriesStore(state => state.getEntriesByIds)
export const useCreateManualBackup = () => useEntriesStore(state => state.createManualBackup)
export const useRestoreFromBackup = () => useEntriesStore(state => state.restoreFromBackup)
export const useUpdateEntryCategoryDetails = () => useEntriesStore(state => state.updateEntryCategoryDetails)
export const useSyncCategories = () => useEntriesStore(state => state.syncCategories)
export const useRestoreFromCloudBackup = () => useEntriesStore(state => state.restoreFromCloudBackup)
