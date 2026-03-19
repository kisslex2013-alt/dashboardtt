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

// Дефолтные названия категорий (lowercase)
const DEFAULT_CATEGORY_NAMES = new Set([
  'remix', 'маркетинг', 'marketing',
  'разработка', 'development',
  'дизайн', 'design',
  'менеджмент', 'management',
  'консультации', 'consulting',
  'обучение', 'teaching',
  'другое', 'other',
])

/** Цвета для auto-назначения */
const FALLBACK_COLORS = [
  '#6366F1', '#F59E0B', '#8B5CF6', '#EC4899',
  '#10B981', '#06B6D4', '#F97316', '#EF4444',
  '#84CC16', '#14B8A6', '#A855F7', '#F43F5E',
]

/** Проверяет, являются ли текущие категории дефолтными */
function isUsingDefaultCategories(categories: { id: string }[]): boolean {
  if (categories.length !== DEFAULT_CATEGORY_IDS.size) return false
  return categories.every(cat => DEFAULT_CATEGORY_IDS.has(String(cat.id)))
}

/**
 * Удаляет дубли из текущего списка категорий.
 * Дубль = одно имя (case-insensitive). Оставляем первый попавшийся.
 * Запускается при каждом старте, чтобы убрать дубли созданные прошлыми версиями.
 */
function deduplicateExistingCategories(categories: any[]): { result: any[]; changed: boolean } {
  const seenNames = new Set<string>()
  const seenIds = new Set<string>()
  const result: any[] = []

  for (const cat of categories) {
    const normName = (cat.name || '').toLowerCase()
    const id = String(cat.id || '')
    if (seenNames.has(normName) || seenIds.has(id)) continue
    seenNames.add(normName)
    seenIds.add(id)
    result.push(cat)
  }

  return { result, changed: result.length !== categories.length }
}

/**
 * Извлекает уникальные кастомные категории из массива записей.
 * Дедупликация: по categoryId (приоритет) и по названию (lowercase).
 * Категория с tем же именем = одна категория, даже если разные записи
 * имели разные/отсутствующие categoryId.
 */
function extractCategoriesFromEntries(entries: any[]): any[] {
  // Храним результат, дедуплицированный сразу по двум осям
  const byId = new Map<string, { id: string; name: string; count: number }>()
  const byName = new Map<string, { id: string; name: string; count: number }>()

  for (const entry of entries) {
    const rawName = (typeof entry.category === 'string' ? entry.category : '').trim()
    const rawId = entry.categoryId ? String(entry.categoryId) : null

    if (!rawName) continue

    // Пропускаем дефолтные по имени и по ID
    if (DEFAULT_CATEGORY_NAMES.has(rawName.toLowerCase())) continue
    if (rawId && DEFAULT_CATEGORY_IDS.has(rawId)) continue

    const normName = rawName.toLowerCase()

    // Ищем existing по ID
    const existingById = rawId ? byId.get(rawId) : undefined
    // Ищем existing по имени
    const existingByName = byName.get(normName)

    if (existingById) {
      // Уже знаем этот ID — просто считаем
      existingById.count++
    } else if (existingByName) {
      // Уже знаем это имя — просто считаем
      existingByName.count++
      // Если у записи есть реальный ID, а у существующей нет — обновляем
      if (rawId && existingByName.id.startsWith('tmp-')) {
        byId.delete(existingByName.id)
        existingByName.id = rawId
        byId.set(rawId, existingByName)
      } else if (rawId) {
        byId.set(rawId, existingByName)
      }
    } else {
      // Абсолютно новая категория
      const cat = { id: rawId || `tmp-${generateUUID()}`, name: rawName, count: 1 }
      byName.set(normName, cat)
      byId.set(cat.id, cat)
    }
  }

  // Собираем результат из byName (он уже уникален по именам)
  return [...byName.values()]
    .sort((a, b) => b.count - a.count)
    .map((cat, index) => ({
      id: cat.id,
      name: cat.name,
      icon: 'Tag',
      rate: 1000,
      color: FALLBACK_COLORS[index % FALLBACK_COLORS.length],
    }))
}

/**
 * Мёрджит две коллекции категорий без дублей.
 * Дедупликация: по ID и по названию (case-insensitive).
 * Приоритет у existingCategories (они уже в сторе).
 */
function mergeCategories(existing: any[], toAdd: any[]): any[] {
  const existingIds = new Set(existing.map(c => String(c.id)))
  const existingNames = new Set(existing.map(c => c.name.toLowerCase()))

  const newOnes = toAdd.filter(
    c => !existingIds.has(String(c.id)) && !existingNames.has(c.name.toLowerCase())
  )

  return [...existing, ...newOnes]
}

/**
 * Хук автовосстановления категорий.
 * Запускается один раз при монтировании приложения.
 * Ждёт 3 секунды, чтобы Zustand и cloud sync завершили свою работу.
 */
export function useCategoryRestore() {
  const hasRun = useRef(false)

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true

    // Шаг 0: сразу убираем дубли (могли появиться из прошлых версий хука)
    const settingsStore = useSettingsStore.getState()
    const { result: deduped, changed } = deduplicateExistingCategories(settingsStore.categories)
    if (changed) {
      console.log(`🧹 [CategoryRestore] Удалено ${settingsStore.categories.length - deduped.length} дублей категорий`)
      settingsStore.importCategories(deduped)
    }

    const timer = setTimeout(async () => {
      await tryRestoreCategories()
    }, 3000) // 3 секунды — дождаться Zustand rehydration + cloud sync

    return () => clearTimeout(timer)
  }, [])
}

async function tryRestoreCategories() {
  const settingsStore = useSettingsStore.getState()
  const entriesStore = useEntriesStore.getState()
  const currentCategories = settingsStore.categories

  // Если категории уже кастомные — восстановление не нужно
  if (!isUsingDefaultCategories(currentCategories)) {
    console.log('✅ [CategoryRestore] Категории в норме, восстановление не требуется')
    return
  }

  console.warn('⚠️ [CategoryRestore] Обнаружены только дефолтные категории — ищем бэкап...')

  try {
    const backupList = await backupManager.listBackups()

    // ── Стратегия 1: Ищем categories прямо в поле бэкапа ─────────────────────
    for (const backupItem of backupList) {
      const backup = await backupManager.restoreBackup(backupItem.timestamp)
      if (!backup) continue

      if (backup.categories && Array.isArray(backup.categories)) {
        const customCats = backup.categories.filter(
          (cat: any) => !DEFAULT_CATEGORY_IDS.has(String(cat.id))
        )
        if (customCats.length > 0) {
          const date = new Date(backupItem.timestamp).toLocaleString('ru-RU')
          console.log(`✅ [CategoryRestore] Стратегия 1: ${backup.categories.length} категорий из бэкапа (${date})`)
          const merged = mergeCategories(settingsStore.categories, backup.categories)
          settingsStore.importCategories(merged)
          entriesStore.syncCategories(merged)
          return
        }
      }

      // ── Стратегия 2: Извлекаем из entries бэкапа ─────────────────────────
      if (backup.entries && Array.isArray(backup.entries) && backup.entries.length > 0) {
        const extracted = extractCategoriesFromEntries(backup.entries)
        if (extracted.length > 0) {
          const date = new Date(backupItem.timestamp).toLocaleString('ru-RU')
          console.log(
            `✅ [CategoryRestore] Стратегия 2: ${extracted.length} категорий из entries бэкапа (${date}):`,
            extracted.map((c: any) => c.name)
          )
          // Дедуплицированный мёрдж с текущими
          const merged = mergeCategories(settingsStore.categories, extracted)
          settingsStore.importCategories(merged)
          entriesStore.syncCategories(merged)
          return
        }
      }
    }

    // ── Стратегия 3: Читаем текущие entries из стора ──────────────────────
    const currentEntries = entriesStore.entries
    if (currentEntries.length > 0) {
      const extracted = extractCategoriesFromEntries(currentEntries)
      if (extracted.length > 0) {
        console.log(
          `✅ [CategoryRestore] Стратегия 3: ${extracted.length} категорий из текущих entries:`,
          extracted.map((c: any) => c.name)
        )
        const merged = mergeCategories(settingsStore.categories, extracted)
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
