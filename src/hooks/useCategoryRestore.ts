/**
 * 🔄 useCategoryRestore - Автовосстановление категорий из IndexedDB бэкапа
 *
 * Проблема: категории хранятся в localStorage, который очищается при "Clear Cache".
 * Решение: при старте приложения проверяем, не сброшены ли категории в дефолт,
 *          и если да — автоматически восстанавливаем их из последнего IndexedDB бэкапа.
 *
 * IndexedDB НЕ очищается при обычной очистке кеша браузера, поэтому
 * бэкапы там выживают и мы можем использовать их для восстановления.
 */

import { useEffect, useRef } from 'react'
import { backupManager } from '../utils/backupManager'
import { useSettingsStore } from '../store/useSettingsStore'
import { useEntriesStore } from '../store/useEntriesStore'

// Дефолтные ID категорий из useSettingsStore (фиксированные)
const DEFAULT_CATEGORY_IDS = new Set([
  'remix', 'marketing', 'development', 'design',
  'management', 'consulting', 'teaching', 'other',
])

/**
 * Проверяет, являются ли текущие категории дефолтными
 * (т.е. пользователь не добавил ни одной кастомной)
 */
function isUsingDefaultCategories(categories: { id: string }[]): boolean {
  if (categories.length !== DEFAULT_CATEGORY_IDS.size) return false
  return categories.every(cat => DEFAULT_CATEGORY_IDS.has(cat.id))
}

/**
 * Хук автовосстановления категорий.
 * Запускается один раз при монтировании приложения.
 */
export function useCategoryRestore() {
  const hasRun = useRef(false)

  useEffect(() => {
    // Запускаем только один раз
    if (hasRun.current) return
    hasRun.current = true

    async function tryRestoreCategories() {
      const settingsStore = useSettingsStore.getState()
      const entriesStore = useEntriesStore.getState()
      const currentCategories = settingsStore.categories

      // Если категории уже кастомные — восстановление не нужно
      if (!isUsingDefaultCategories(currentCategories)) {
        console.log('✅ [CategoryRestore] Категории в норме, восстановление не требуется')
        return
      }

      console.log('⚠️ [CategoryRestore] Обнаружены только дефолтные категории — ищем бэкап...')

      try {
        // Получаем список всех бэкапов из IndexedDB (от новых к старым)
        const backupList = await backupManager.listBackups()

        if (backupList.length === 0) {
          console.log('ℹ️ [CategoryRestore] Бэкапы не найдены. Восстановление невозможно.')
          return
        }

        // Перебираем бэкапы от самого свежего к старому
        for (const backupItem of backupList) {
          const backup = await backupManager.restoreBackup(backupItem.timestamp)

          if (!backup?.categories || !Array.isArray(backup.categories)) continue

          // Проверяем что в бэкапе есть кастомные категории
          const hasCustomCategories = backup.categories.some(
            cat => !DEFAULT_CATEGORY_IDS.has(cat.id)
          )

          if (!hasCustomCategories) continue

          // ✅ Нашли бэкап с кастомными категориями — восстанавливаем!
          const date = new Date(backupItem.timestamp).toLocaleString('ru-RU')
          console.log(`✅ [CategoryRestore] Восстанавливаем ${backup.categories.length} категорий из бэкапа ${date}`)

          settingsStore.importCategories(backup.categories)

          // Синхронизируем записи с восстановленными категориями
          // (переподвязываем categoryId в записях по имени)
          const syncedCount = entriesStore.syncCategories(backup.categories)

          if (syncedCount > 0) {
            console.log(`🔗 [CategoryRestore] Синхронизировано ${syncedCount} записей с восстановленными категориями`)
          }

          return // Восстановление выполнено, выходим
        }

        console.log('ℹ️ [CategoryRestore] В бэкапах нет кастомных категорий.')
      } catch (error) {
        console.error('❌ [CategoryRestore] Ошибка при восстановлении категорий:', error)
      }
    }

    tryRestoreCategories()
  }, [])
}
