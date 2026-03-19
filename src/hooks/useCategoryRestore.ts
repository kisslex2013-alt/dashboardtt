/**
 * 🔄 useCategoryRestore - Автовосстановление категорий
 *
 * Стратегия (в порядке приоритета):
 * 1. Ищем категории в IndexedDB бэкапах (если бэкап содержит categories)
 * 2. Если в бэкапах нет categories → извлекаем уникальные категории
 *    из самих записей (entries) через поле entry.category / entry.categoryId
 *
 * IndexedDB НЕ очищается при обычной очистке кеша браузера,
 * поэтому бэкапы с записями там выживают.
 */

import { useEffect, useRef } from 'react'
import { backupManager } from '../utils/backupManager'
import { useSettingsStore } from '../store/useSettingsStore'
import { useEntriesStore } from '../store/useEntriesStore'
import { generateUUID } from '../utils/uuid'

// Дефолтные ID категорий (фиксированные строки, не UUID)
const DEFAULT_CATEGORY_IDS = new Set([
  'remix', 'marketing', 'development', 'design',
  'management', 'consulting', 'teaching', 'other',
])

// Дефолтные названия категорий (lowercase) — для сравнения
const DEFAULT_CATEGORY_NAMES = new Set([
  'remix', 'маркетинг', 'marketing',
  'разработка', 'development',
  'дизайн', 'design',
  'менеджмент', 'management',
  'консультации', 'consulting',
  'обучение', 'teaching',
  'другое', 'other',
])

/** Проверяет, является ли набор категорий дефолтным */
function isUsingDefaultCategories(categories: { id: string }[]): boolean {
  if (categories.length !== DEFAULT_CATEGORY_IDS.size) return false
  return categories.every(cat => DEFAULT_CATEGORY_IDS.has(String(cat.id)))
}

/** Набор цветов для auto-назначения новым категориям */
const FALLBACK_COLORS = [
  '#6366F1', '#F59E0B', '#8B5CF6', '#EC4899',
  '#10B981', '#06B6D4', '#F97316', '#EF4444',
  '#84CC16', '#14B8A6', '#A855F7', '#F43F5E',
]

/**
 * Строит список уникальных кастомных категорий из массива записей.
 * Сохраняет оригинальные categoryId, чтобы связи не потерялись.
 */
function extractCategoriesFromEntries(entries: any[]): any[] {
  const seen = new Map<string, { id: string; name: string; count: number }>()

  for (const entry of entries) {
    const rawName = (typeof entry.category === 'string' ? entry.category : '').trim()
    const rawId = entry.categoryId ? String(entry.categoryId) : null

    if (!rawName) continue

    // Пропускаем дефолтные категории — они уже есть в списке
    if (DEFAULT_CATEGORY_NAMES.has(rawName.toLowerCase())) continue
    // Пропускаем дефолтные ID
    if (rawId && DEFAULT_CATEGORY_IDS.has(rawId)) continue

    // Ключ: предпочитаем ID, fallback на имя
    const key = rawId || rawName.toLowerCase()

    if (seen.has(key)) {
      seen.get(key)!.count++
    } else {
      seen.set(key, {
        id: rawId || generateUUID(),
        name: rawName,
        count: 1,
      })
    }
  }

  // Сортируем по частоте использования
  const sorted = [...seen.values()].sort((a, b) => b.count - a.count)

  return sorted.map((cat, index) => ({
    id: cat.id,
    name: cat.name,
    icon: 'Tag',
    rate: 1000,
    color: FALLBACK_COLORS[index % FALLBACK_COLORS.length],
  }))
}

/**
 * Хук автовосстановления категорий.
 * Запускается один раз при монтировании приложения.
 */
export function useCategoryRestore() {
  const hasRun = useRef(false)

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true

    // Небольшая задержка — ждём пока Zustand восстановит данные из localStorage
    // и облачный бэкап успеет загрузиться
    const timer = setTimeout(async () => {
      await tryRestoreCategories()
    }, 2000)

    return () => clearTimeout(timer)
  }, [])
}

async function tryRestoreCategories() {
  const settingsStore = useSettingsStore.getState()
  const entriesStore = useEntriesStore.getState()
  const currentCategories = settingsStore.categories

  // Если категории уже кастомные — ничего не делаем
  if (!isUsingDefaultCategories(currentCategories)) {
    console.log('✅ [CategoryRestore] Категории в норме, восстановление не требуется')
    return
  }

  console.warn('⚠️ [CategoryRestore] Обнаружены только дефолтные категории — ищем бэкап...')

  try {
    // ── Стратегия 1: Ищем категории в IndexedDB бэкапах ─────────────────────
    const backupList = await backupManager.listBackups()

    for (const backupItem of backupList) {
      const backup = await backupManager.restoreBackup(backupItem.timestamp)
      if (!backup) continue

      // Если в бэкапе есть массив categories с кастомными элементами
      if (backup.categories && Array.isArray(backup.categories)) {
        const customCats = backup.categories.filter(
          (cat: any) => !DEFAULT_CATEGORY_IDS.has(String(cat.id))
        )
        if (customCats.length > 0) {
          const date = new Date(backupItem.timestamp).toLocaleString('ru-RU')
          console.log(`✅ [CategoryRestore] Восстанавливаем ${backup.categories.length} категорий из бэкапа (${date})`)
          settingsStore.importCategories(backup.categories)
          entriesStore.syncCategories(backup.categories)
          return
        }
      }

      // ── Стратегия 2: Нет categories в бэкапе — извлекаем из entries бэкапа ─
      if (backup.entries && Array.isArray(backup.entries) && backup.entries.length > 0) {
        const extracted = extractCategoriesFromEntries(backup.entries)
        if (extracted.length > 0) {
          const date = new Date(backupItem.timestamp).toLocaleString('ru-RU')
          console.log(
            `✅ [CategoryRestore] Восстановлено ${extracted.length} кастомных категорий из записей бэкапа (${date}):`,
            extracted.map((c: any) => c.name)
          )
          // Добавляем кастомные к дефолтным (не заменяем, а дополняем)
          const merged = [...settingsStore.categories, ...extracted]
          settingsStore.importCategories(merged)
          entriesStore.syncCategories(merged)
          return
        }
      }
    }

    // ── Стратегия 3: Бэкапов нет / пусты — читаем текущие entries из стора ──
    const currentEntries = entriesStore.entries
    if (currentEntries.length > 0) {
      const extracted = extractCategoriesFromEntries(currentEntries)
      if (extracted.length > 0) {
        console.log(
          `✅ [CategoryRestore] Восстановлено ${extracted.length} кастомных категорий из текущих записей:`,
          extracted.map((c: any) => c.name)
        )
        const merged = [...settingsStore.categories, ...extracted]
        settingsStore.importCategories(merged)
        entriesStore.syncCategories(merged)
        return
      }
    }

    console.log('ℹ️ [CategoryRestore] Кастомных категорий для восстановления не найдено.')
  } catch (error) {
    console.error('❌ [CategoryRestore] Ошибка:', error)
  }
}
