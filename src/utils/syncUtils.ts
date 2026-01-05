/**
 * Утилиты для безопасной синхронизации данных между localStorage и Supabase
 * 
 * Стратегия: Smart Merge + Confirmation
 * - Уникальные записи добавляются автоматически
 * - Конфликты разрешаются по updatedAt (более новая побеждает)
 * - При сомнениях показывается диалог пользователю
 */

import type { TimeEntry } from '../types'
import { backupManager } from './backupManager'
import { logger } from './logger'

// Используем облегчённый интерфейс для совместимости с supabase.ts и types/index.ts
export interface CloudBackupData {
  entries?: TimeEntry[]
  timestamp: number
  version?: number
  [key: string]: unknown
}

/**
 * Результат merge-операции
 */
export interface SyncResult {
  /** Объединённый массив записей */
  merged: TimeEntry[]
  /** Записи с конфликтами (для информирования пользователя) */
  conflicts: ConflictInfo[]
  /** Пересечения времени (требуют внимания) */
  overlaps: TimeOverlap[]
  /** Статистика операции */
  stats: {
    addedFromCloud: number
    addedFromLocal: number
    updatedFromCloud: number
    updatedFromLocal: number
    unchanged: number
  }
}

/**
 * Информация о конфликте
 */
export interface ConflictInfo {
  id: string
  localVersion: TimeEntry
  cloudVersion: TimeEntry
  resolvedTo: 'local' | 'cloud'
  reason: string
}

/**
 * Информация для диалога подтверждения
 */
export interface SyncConfirmationData {
  needsConfirmation: boolean
  reason: string
  localCount: number
  cloudCount: number
  cloudTimestamp: number
  localLastSync: number | null
  recommendation: 'merge' | 'use-cloud' | 'keep-local'
}

/**
 * Проверяет, нужно ли показывать диалог подтверждения
 */
export function checkSyncConfirmation(
  localEntries: TimeEntry[],
  cloudBackup: CloudBackupData,
  lastSyncTime: number | null
): SyncConfirmationData {
  const cloudTimestamp = cloudBackup.timestamp
  const cloudEntries = cloudBackup.entries || []
  
  // Случай 1: Локальных данных нет — безопасно восстановить из облака
  if (localEntries.length === 0) {
    return {
      needsConfirmation: false,
      reason: 'Локальных данных нет, восстанавливаем из облака',
      localCount: 0,
      cloudCount: cloudEntries.length,
      cloudTimestamp,
      localLastSync: lastSyncTime,
      recommendation: 'use-cloud'
    }
  }
  
  // Случай 2: Облако пустое — оставляем локальные
  if (cloudEntries.length === 0) {
    return {
      needsConfirmation: false,
      reason: 'Облако пустое, сохраняем локальные данные',
      localCount: localEntries.length,
      cloudCount: 0,
      cloudTimestamp,
      localLastSync: lastSyncTime,
      recommendation: 'keep-local'
    }
  }
  
  // Случай 3: Есть lastSyncTime и облако новее — безопасный merge
  if (lastSyncTime && cloudTimestamp > lastSyncTime) {
    return {
      needsConfirmation: false,
      reason: 'Облако новее последней синхронизации, выполняем merge',
      localCount: localEntries.length,
      cloudCount: cloudEntries.length,
      cloudTimestamp,
      localLastSync: lastSyncTime,
      recommendation: 'merge'
    }
  }
  
  // Случай 4: Облако СТАРШЕ локальных данных
  // Но если количество записей одинаковое — скорее всего данные идентичны
  if (lastSyncTime && cloudTimestamp < lastSyncTime) {
    const countMatches = localEntries.length === cloudEntries.length
    
    // Если количество одинаковое — данные идентичны, просто продолжаем
    if (countMatches) {
      return {
        needsConfirmation: false,
        reason: 'Данные синхронизированы, локальные актуальнее',
        localCount: localEntries.length,
        cloudCount: cloudEntries.length,
        cloudTimestamp,
        localLastSync: lastSyncTime,
        recommendation: 'keep-local'
      }
    }
    
    // Количество разное — есть реальный конфликт
    return {
      needsConfirmation: true,
      reason: 'Облачный бэкап старее ваших локальных данных',
      localCount: localEntries.length,
      cloudCount: cloudEntries.length,
      cloudTimestamp,
      localLastSync: lastSyncTime,
      recommendation: 'keep-local'
    }
  }
  
  // Случай 5: lastSyncTime отсутствует, но есть локальные данные
  // Проверяем, не идентичны ли данные — если да, просто обновляем lastSyncTime
  if (!lastSyncTime && localEntries.length > 0) {
    // Если количество записей одинаковое и timestamp близок — вероятно, данные идентичны
    const countMatches = localEntries.length === cloudEntries.length
    const timestampDiff = Math.abs(cloudTimestamp - Date.now())
    const isLikelyIdentical = countMatches && timestampDiff < 60000 // 1 минута
    
    if (isLikelyIdentical) {
      return {
        needsConfirmation: false,
        reason: 'Данные идентичны, синхронизация не требуется',
        localCount: localEntries.length,
        cloudCount: cloudEntries.length,
        cloudTimestamp,
        localLastSync: null,
        recommendation: 'keep-local'
      }
    }
    
    return {
      needsConfirmation: true,
      reason: 'Обнаружены локальные данные без истории синхронизации',
      localCount: localEntries.length,
      cloudCount: cloudEntries.length,
      cloudTimestamp,
      localLastSync: null,
      recommendation: 'merge'
    }
  }
  
  // Default: merge без подтверждения
  return {
    needsConfirmation: false,
    reason: 'Стандартный merge',
    localCount: localEntries.length,
    cloudCount: cloudEntries.length,
    cloudTimestamp,
    localLastSync: lastSyncTime,
    recommendation: 'merge'
  }
}

/**
 * Выполняет Smart Merge записей
 * 
 * Логика:
 * 1. Записи только в локальном — добавляются
 * 2. Записи только в облаке — добавляются
 * 3. Записи с одинаковым ID — выбирается более новая по updatedAt
 */
export function mergeEntries(
  localEntries: TimeEntry[],
  cloudEntries: TimeEntry[]
): SyncResult {
  const merged: TimeEntry[] = []
  const conflicts: ConflictInfo[] = []
  const stats = {
    addedFromCloud: 0,
    addedFromLocal: 0,
    updatedFromCloud: 0,
    updatedFromLocal: 0,
    unchanged: 0
  }
  
  // Создаём Map для быстрого поиска по ID
  const localMap = new Map<string, TimeEntry>()
  const cloudMap = new Map<string, TimeEntry>()
  
  localEntries.forEach(entry => {
    const id = String(entry.id)
    localMap.set(id, entry)
  })
  
  cloudEntries.forEach(entry => {
    const id = String(entry.id)
    cloudMap.set(id, entry)
  })
  
  // Обрабатываем все уникальные ID
  const allIds = new Set([...localMap.keys(), ...cloudMap.keys()])
  
  allIds.forEach(id => {
    const local = localMap.get(id)
    const cloud = cloudMap.get(id)
    
    // Только в локальном
    if (local && !cloud) {
      merged.push(local)
      stats.addedFromLocal++
      return
    }
    
    // Только в облаке
    if (!local && cloud) {
      merged.push(cloud)
      stats.addedFromCloud++
      return
    }
    
    // Есть в обоих — разрешаем конфликт
    if (local && cloud) {
      const localTime = new Date(local.updatedAt || local.createdAt || 0).getTime()
      const cloudTime = new Date(cloud.updatedAt || cloud.createdAt || 0).getTime()
      
      // Если данные идентичны
      if (JSON.stringify(local) === JSON.stringify(cloud)) {
        merged.push(local)
        stats.unchanged++
        return
      }
      
      // Выбираем более новую версию
      if (cloudTime > localTime) {
        merged.push(cloud)
        stats.updatedFromCloud++
        conflicts.push({
          id,
          localVersion: local,
          cloudVersion: cloud,
          resolvedTo: 'cloud',
          reason: `Облачная версия новее (${formatDate(cloudTime)} vs ${formatDate(localTime)})`
        })
      } else {
        merged.push(local)
        stats.updatedFromLocal++
        conflicts.push({
          id,
          localVersion: local,
          cloudVersion: cloud,
          resolvedTo: 'local',
          reason: `Локальная версия новее (${formatDate(localTime)} vs ${formatDate(cloudTime)})`
        })
      }
    }
  })
  
  // Сортируем по дате и времени начала для правильного отображения
  merged.sort((a, b) => {
    // Сначала по дате
    const dateA = a.date || ''
    const dateB = b.date || ''
    if (dateA !== dateB) {
      return dateB.localeCompare(dateA) // Новее сверху
    }
    // Затем по времени начала
    const startA = a.start || '00:00'
    const startB = b.start || '00:00'
    return startA.localeCompare(startB) // Раньше сверху внутри дня
  })
  
  // Проверяем пересечения времени после merge
  const overlaps = findTimeOverlaps(merged)
  if (overlaps.length > 0) {
    logger.log(`⚠️ Обнаружено ${overlaps.length} пересечений времени после merge`)
  }
  
  logger.log(`🔄 Merge завершён: +${stats.addedFromCloud} из облака, +${stats.addedFromLocal} локальных, ${conflicts.length} конфликтов`)
  
  return { merged, conflicts, overlaps, stats }
}

/**
 * Информация о пересечении времени
 */
export interface TimeOverlap {
  entry1: TimeEntry
  entry2: TimeEntry
  date: string
  overlapMinutes: number
}

/**
 * Находит пересечения времени между записями
 */
export function findTimeOverlaps(entries: TimeEntry[]): TimeOverlap[] {
  const overlaps: TimeOverlap[] = []
  
  // Группируем записи по дате
  const byDate = new Map<string, TimeEntry[]>()
  entries.forEach(entry => {
    const date = entry.date || ''
    if (!byDate.has(date)) {
      byDate.set(date, [])
    }
    byDate.get(date)!.push(entry)
  })
  
  // Проверяем пересечения внутри каждого дня
  byDate.forEach((dayEntries, date) => {
    for (let i = 0; i < dayEntries.length; i++) {
      for (let j = i + 1; j < dayEntries.length; j++) {
        const entry1 = dayEntries[i]
        const entry2 = dayEntries[j]
        
        const overlap = getOverlapMinutes(entry1, entry2)
        if (overlap > 0) {
          overlaps.push({
            entry1,
            entry2,
            date,
            overlapMinutes: overlap
          })
        }
      }
    }
  })
  
  return overlaps
}

/**
 * Вычисляет количество минут пересечения между двумя записями
 */
function getOverlapMinutes(entry1: TimeEntry, entry2: TimeEntry): number {
  const parseTime = (time: string): number => {
    const [hours, minutes] = (time || '00:00').split(':').map(Number)
    return hours * 60 + minutes
  }
  
  const start1 = parseTime(entry1.start)
  const end1 = parseTime(entry1.end)
  const start2 = parseTime(entry2.start)
  const end2 = parseTime(entry2.end)
  
  // Находим пересечение
  const overlapStart = Math.max(start1, start2)
  const overlapEnd = Math.min(end1, end2)
  
  if (overlapStart < overlapEnd) {
    return overlapEnd - overlapStart
  }
  
  return 0
}

/**
 * Преобразует минуты в формат времени HH:MM
 */
function formatTimeFromMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60) % 24
  const minutes = totalMinutes % 60
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

/**
 * Результат автоматического исправления пересечений
 */
export interface OverlapResolution {
  fixed: TimeEntry[]
  fixedCount: number
  changes: Array<{
    entryId: string
    oldStart: string
    oldEnd: string
    newStart: string
    newEnd: string
    reason: string
  }>
}

/**
 * Автоматически исправляет пересечения времени
 * 
 * Стратегия: более поздняя запись (по времени создания/обновления) сдвигается
 * чтобы не пересекаться с более ранней
 */
export function resolveTimeOverlaps(entries: TimeEntry[]): OverlapResolution {
  const fixed = [...entries]
  const changes: OverlapResolution['changes'] = []
  
  // Группируем по дате
  const byDate = new Map<string, number[]>()
  fixed.forEach((entry, index) => {
    const date = entry.date || ''
    if (!byDate.has(date)) {
      byDate.set(date, [])
    }
    byDate.get(date)!.push(index)
  })
  
  // Обрабатываем каждый день
  byDate.forEach((indices) => {
    // Сортируем записи дня по времени начала
    indices.sort((a, b) => {
      const startA = fixed[a].start || '00:00'
      const startB = fixed[b].start || '00:00'
      return startA.localeCompare(startB)
    })
    
    // Проверяем и исправляем пересечения последовательно
    for (let i = 0; i < indices.length - 1; i++) {
      const currentIdx = indices[i]
      const nextIdx = indices[i + 1]
      const current = fixed[currentIdx]
      const next = fixed[nextIdx]
      
      const parseTime = (time: string): number => {
        const [hours, minutes] = (time || '00:00').split(':').map(Number)
        return hours * 60 + minutes
      }
      
      const currentEnd = parseTime(current.end)
      const nextStart = parseTime(next.start)
      
      // Если есть пересечение (текущая заканчивается после начала следующей)
      if (currentEnd > nextStart) {
        const oldStart = next.start
        const oldEnd = next.end
        
        // Вычисляем новое время для следующей записи
        const nextDuration = parseTime(next.end) - parseTime(next.start)
        const newStart = currentEnd
        const newEnd = newStart + nextDuration
        
        // Обновляем запись
        fixed[nextIdx] = {
          ...next,
          start: formatTimeFromMinutes(newStart),
          end: formatTimeFromMinutes(newEnd),
          updatedAt: new Date().toISOString()
        }
        
        changes.push({
          entryId: String(next.id),
          oldStart,
          oldEnd,
          newStart: formatTimeFromMinutes(newStart),
          newEnd: formatTimeFromMinutes(newEnd),
          reason: `Сдвинуто после "${current.category || current.description || 'Без названия'}" (${current.start}-${current.end})`
        })
      }
    }
  })
  
  logger.log(`🔧 Исправлено ${changes.length} пересечений времени`)
  
  return {
    fixed,
    fixedCount: changes.length,
    changes
  }
}

/**
 * Создаёт pre-restore бэкап перед восстановлением из облака
 */
export async function createPreRestoreBackup(
  entries: TimeEntry[],
  reason: string = 'pre-restore'
): Promise<boolean> {
  if (entries.length === 0) {
    logger.log('⏭️ Pre-restore backup пропущен (нет данных)')
    return true
  }
  
  try {
    // Используем backupManager для создания snapshot
    await backupManager.saveBackup({
      entries,
      timestamp: Date.now(),
      version: 1,
      // Помечаем как pre-restore бэкап
      metadata: {
        type: reason,
        createdAt: new Date().toISOString()
      }
    } as any)
    
    logger.log(`💾 Pre-restore backup создан: ${entries.length} записей`)
    return true
  } catch (error) {
    logger.error('❌ Ошибка создания pre-restore backup:', error)
    return false
  }
}

/**
 * Форматирует дату для отображения в конфликтах
 */
function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Проверяет, безопасно ли автоматически восстановить из облака
 */
export function shouldAutoRestore(
  localEntries: TimeEntry[],
  cloudBackup: CloudBackupData,
  lastSyncTime: number | null
): boolean {
  const check = checkSyncConfirmation(localEntries, cloudBackup, lastSyncTime)
  return !check.needsConfirmation
}
