/**
 * Утилиты для экспорта и импорта данных
 */

import { logger } from './logger'
import { generateUUID } from './uuid'
import type { TimeEntry, Category, SettingsState } from '../types'

interface ExportOptions {
  filename?: string
  includeMetadata?: boolean
}

interface ExportResult {
  success: boolean
  filename: string
}

interface ImportDataStructure {
  version?: string
  exportDate?: string
  appName?: string
  data?: {
    entries: TimeEntry[]
    categories?: Category[]
    settings?: Partial<SettingsState>
  }
  entries?: TimeEntry[]
  categories?: Category[]
  settings?: Partial<SettingsState>
  metadata?: Record<string, unknown>
}

interface ImportResult {
  isValid: boolean
  data: {
    entries: TimeEntry[]
    categories?: Category[]
    settings?: Partial<SettingsState>
  } | null
  metadata?: Record<string, unknown>
  version?: string
  error: string | null
}

interface ValidationResult {
  isValid: boolean
  errors: string[]
}

interface ExportStats {
  totalEntries: number
  totalCategories: number
  totalHours: string
  totalEarned: string
  averageRate: string
  dateRange: { start: string; end: string } | null
}

interface VersionCompatibility {
  compatible: boolean
  warning: string | null
  recommendation: string | null
}

interface ImportOptions {
  mergeMode: 'replace' | 'merge' | 'append'
  skipDuplicates: boolean
  validateData: boolean
  createBackup: boolean
  updateCategories: boolean
  updateSettings: boolean
  duplicateResolution?: 'skip' | 'replace' | 'merge'
}

interface ConflictResolution {
  conflicts: Array<{
    type: string
    existing: TimeEntry
    imported: TimeEntry
    resolution: string
  }>
  resolved: TimeEntry[]
  totalConflicts: number
  totalResolved: number
}

export function exportToJSON(
  entries: TimeEntry[],
  categories: Category[],
  settings: Partial<SettingsState>,
  options: ExportOptions = {}
): Promise<ExportResult> {
  return new Promise((resolve, reject) => {
    try {
      const now = new Date()
      const day = String(now.getDate()).padStart(2, '0')
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const year = now.getFullYear()
      const hours = String(now.getHours()).padStart(2, '0')
      const minutes = String(now.getMinutes()).padStart(2, '0')

      const exportDateISO = now.toISOString()

      const validEntries = entries
        ? entries.filter(entry => {
            if (!entry || !entry.date) return false
            return true
          })
        : []

      const sortedEntries = validEntries.sort((a, b) => {
        const dateA = new Date(a.date || 0)
        const dateB = new Date(b.date || 0)
        return dateB.getTime() - dateA.getTime()
      })

      const data = {
        version: '1.1',
        exportDate: exportDateISO,
        exportDateLocal: `${day}-${month}-${year} ${hours}:${minutes}`,
        appName: 'Time Tracker Dashboard',
        data: {
          entries: sortedEntries,
          categories: categories || [],
          settings: settings || {},
        },
        metadata: {
          totalEntries: sortedEntries.length,
          totalCategories: categories ? categories.length : 0,
          exportOptions: options,
        },
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url

      if (options.filename) {
        a.download = options.filename
      } else {
        a.download = `time-tracker-export-${day}-${month}-${year}-${hours}-${minutes}.json`
      }

      a.style.display = 'none'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      URL.revokeObjectURL(url)
      resolve({ success: true, filename: a.download })
    } catch (error) {
      reject(new Error(`Ошибка экспорта: ${(error as Error).message}`))
    }
  })
}

export function importFromJSON(jsonString: string): ImportResult {
  try {
    const data: ImportDataStructure = JSON.parse(jsonString)

    const validation = validateImportData(data)
    if (!validation.isValid) {
      return {
        isValid: false,
        error: `Ошибка валидации: ${validation.errors.join(', ')}`,
        data: null,
      }
    }

    const extractedData = data.data || data

    if (!extractedData.entries || !Array.isArray(extractedData.entries)) {
      return {
        isValid: false,
        error: 'Записи отсутствуют или имеют неверный формат',
        data: null,
      }
    }

    return {
      isValid: true,
      data: extractedData as { entries: TimeEntry[]; categories?: Category[]; settings?: Partial<SettingsState> },
      metadata: data.metadata,
      version: data.version,
      error: null,
    }
  } catch (error) {
    return {
      isValid: false,
      error: `Ошибка парсинга JSON: ${(error as Error).message}`,
      data: null,
    }
  }
}

export function importFromJSONFile(file: File): Promise<{
  success: boolean
  data: { entries: TimeEntry[]; categories?: Category[]; settings?: Partial<SettingsState> }
  metadata?: Record<string, unknown>
  version?: string
}> {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('Файл не выбран'))
      return
    }

    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      reject(new Error('Неверный формат файла. Выберите JSON файл.'))
      return
    }

    const reader = new FileReader()

    reader.onload = e => {
      const result = importFromJSON(e.target?.result as string)
      if (result.isValid && result.data) {
        resolve({
          success: true,
          data: result.data,
          metadata: result.metadata,
          version: result.version,
        })
      } else {
        reject(new Error(result.error || 'Неизвестная ошибка'))
      }
    }

    reader.onerror = () => reject(new Error('Ошибка чтения файла'))
    reader.readAsText(file)
  })
}

export function validateImportData(data: unknown): ValidationResult {
  const errors: string[] = []

  if (!data || typeof data !== 'object') {
    errors.push('Неверная структура файла')
    return { isValid: false, errors }
  }

  const importData = data as ImportDataStructure
  const actualData = importData.data || importData

  if (!Array.isArray(actualData.entries)) {
    errors.push('Записи должны быть массивом')
    return { isValid: false, errors }
  }

  const entriesToCheck = actualData.entries.slice(0, 10)

  entriesToCheck.forEach((entry, index) => {
    if (!entry.date) {
      errors.push(`Запись ${index + 1}: отсутствует дата`)
    }
    if (errors.length >= 3) return
  })

  if (errors.length > 0) {
    return { isValid: false, errors }
  }

  if (actualData.categories && !Array.isArray(actualData.categories)) {
    errors.push('Категории должны быть массивом')
  }

  if (actualData.settings && typeof actualData.settings !== 'object') {
    errors.push('Настройки должны быть объектом')
  }

  return { isValid: errors.length === 0, errors }
}

export function createBackup(
  entries: TimeEntry[],
  categories: Category[],
  settings: Partial<SettingsState>
): Promise<ExportResult> {
  return exportToJSON(entries, categories, settings, {
    filename: `time-tracker-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`,
    includeMetadata: true,
  })
}

export function exportToCSV(entries: TimeEntry[], categories: Category[]): Promise<ExportResult> {
  return new Promise((resolve, reject) => {
    try {
      if (!entries || entries.length === 0) {
        reject(new Error('Нет данных для экспорта'))
        return
      }

      const headers = ['Дата', 'Время начала', 'Время окончания', 'Длительность (ч)', 'Категория', 'Описание', 'Ставка (₽/ч)', 'Заработано (₽)', 'ID']

      const rows = entries.map(entry => [
        entry.date || '',
        entry.start || '',
        entry.end || '',
        String(entry.duration) || '0',
        entry.category || entry.categoryId || '',
        entry.description || '',
        String(entry.rate) || '0',
        String(entry.earned) || '0',
        entry.id || '',
      ])

      const csvContent = [headers, ...rows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url

      const now = new Date()
      const day = String(now.getDate()).padStart(2, '0')
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const year = now.getFullYear()
      const hours = String(now.getHours()).padStart(2, '0')
      const minutes = String(now.getMinutes()).padStart(2, '0')
      a.download = `time-tracker-export-${day}-${month}-${year}-${hours}-${minutes}.csv`
      a.style.display = 'none'

      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      URL.revokeObjectURL(url)
      resolve({ success: true, filename: a.download })
    } catch (error) {
      reject(new Error(`Ошибка экспорта в CSV: ${(error as Error).message}`))
    }
  })
}

export function exportToExcel(entries: TimeEntry[], categories: Category[]): Promise<ExportResult> {
  return new Promise((resolve, reject) => {
    try {
      if (!entries || entries.length === 0) {
        reject(new Error('Нет данных для экспорта'))
        return
      }

      const excelData = {
        'Записи времени': entries.map(entry => ({
          Дата: entry.date || '',
          'Время начала': entry.start || '',
          'Время окончания': entry.end || '',
          'Длительность (ч)': parseFloat(String(entry.duration) || '0'),
          Категория: entry.category || entry.categoryId || '',
          Описание: entry.description || '',
          'Ставка (₽/ч)': parseFloat(String(entry.rate) || '0'),
          'Заработано (₽)': parseFloat(String(entry.earned) || '0'),
          ID: entry.id || '',
        })),
        Категории: categories.map(category => ({
          Название: category.name || '',
          'Ставка (₽/ч)': parseFloat(String(category.rate) || '0'),
          Цвет: category.color || '',
          Иконка: category.icon || '',
        })),
      }

      const blob = new Blob([JSON.stringify(excelData, null, 2)], { type: 'application/json' })

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url

      const now = new Date()
      const day = String(now.getDate()).padStart(2, '0')
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const year = now.getFullYear()
      const hours = String(now.getHours()).padStart(2, '0')
      const minutes = String(now.getMinutes()).padStart(2, '0')
      a.download = `time-tracker-export-${day}-${month}-${year}-${hours}-${minutes}.xlsx`
      a.style.display = 'none'

      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      URL.revokeObjectURL(url)
      resolve({ success: true, filename: a.download })
    } catch (error) {
      reject(new Error(`Ошибка экспорта в Excel: ${(error as Error).message}`))
    }
  })
}

export function importFromCSV(file: File): Promise<{ success: boolean; entries: Record<string, string>[]; headers: string[]; totalRows: number }> {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('Файл не выбран'))
      return
    }

    if (!file.name.endsWith('.csv')) {
      reject(new Error('Неверный формат файла. Выберите CSV файл.'))
      return
    }

    const reader = new FileReader()

    reader.onload = e => {
      try {
        const csvText = e.target?.result as string
        const lines = csvText.split('\n')

        if (lines.length < 2) {
          reject(new Error('CSV файл пуст или содержит только заголовки'))
          return
        }

        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())

        const entries: Record<string, string>[] = []
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim()
          if (!line) continue

          const values = line.split(',').map(v => v.replace(/"/g, '').trim())

          if (values.length !== headers.length) {
            logger.warn(`Строка ${i + 1}: неверное количество колонок`)
            continue
          }

          const entry: Record<string, string> = {}
          headers.forEach((header, index) => {
            entry[header] = values[index]
          })

          if (!entry.ID) {
            entry.ID = generateUUID()
          }

          entries.push(entry)
        }

        resolve({ success: true, entries, headers, totalRows: entries.length })
      } catch (error) {
        reject(new Error(`Ошибка парсинга CSV: ${(error as Error).message}`))
      }
    }

    reader.onerror = () => reject(new Error('Ошибка чтения файла'))
    reader.readAsText(file)
  })
}

export function getExportStats(entries: TimeEntry[], categories: Category[]): ExportStats {
  const totalEntries = entries ? entries.length : 0
  const totalCategories = categories ? categories.length : 0

  let totalHours = 0
  let totalEarned = 0

  if (entries) {
    totalHours = entries.reduce((sum, entry) => sum + parseFloat(String(entry.duration) || '0'), 0)
    totalEarned = entries.reduce((sum, entry) => sum + parseFloat(String(entry.earned) || '0'), 0)
  }

  return {
    totalEntries,
    totalCategories,
    totalHours: totalHours.toFixed(2),
    totalEarned: totalEarned.toFixed(2),
    averageRate: totalHours > 0 ? (totalEarned / totalHours).toFixed(2) : '0',
    dateRange:
      entries && entries.length > 0
        ? {
            start: entries.reduce((min, entry) => (entry.date < min ? entry.date : min), entries[0].date),
            end: entries.reduce((max, entry) => (entry.date > max ? entry.date : max), entries[0].date),
          }
        : null,
  }
}

export function checkVersionCompatibility(importVersion: string, currentVersion: string = '1.1'): VersionCompatibility {
  const importMajor = parseInt(importVersion.split('.')[0])
  const currentMajor = parseInt(currentVersion.split('.')[0])

  if (importMajor > currentMajor) {
    return {
      compatible: false,
      warning: 'Файл создан в более новой версии приложения. Возможны проблемы совместимости.',
      recommendation: 'Обновите приложение до последней версии.',
    }
  }

  if (importMajor < currentMajor) {
    return {
      compatible: true,
      warning: 'Файл создан в более старой версии приложения. Некоторые функции могут быть недоступны.',
      recommendation: 'Рекомендуется создать новый экспорт в текущей версии.',
    }
  }

  return { compatible: true, warning: null, recommendation: null }
}

export function createImportOptions(options: Partial<ImportOptions> = {}): ImportOptions {
  return {
    mergeMode: options.mergeMode || 'replace',
    skipDuplicates: options.skipDuplicates ?? true,
    validateData: options.validateData !== false,
    createBackup: options.createBackup !== false,
    updateCategories: options.updateCategories ?? true,
    updateSettings: options.updateSettings ?? true,
    ...options,
  }
}

export function resolveImportConflicts(
  existingEntries: TimeEntry[],
  importedEntries: TimeEntry[],
  options: Partial<ImportOptions> = {}
): ConflictResolution {
  const conflicts: ConflictResolution['conflicts'] = []
  const resolved: TimeEntry[] = []

  importedEntries.forEach(importedEntry => {
    const existingEntry = existingEntries.find(e => String(e.id) === String(importedEntry.id))

    if (existingEntry) {
      conflicts.push({
        type: 'duplicate_id',
        existing: existingEntry,
        imported: importedEntry,
        resolution: options.duplicateResolution || 'skip',
      })

      if (options.duplicateResolution === 'replace') {
        resolved.push(importedEntry)
      } else if (options.duplicateResolution === 'merge') {
        resolved.push({ ...existingEntry, ...importedEntry })
      }
    } else {
      resolved.push(importedEntry)
    }
  })

  return {
    conflicts,
    resolved,
    totalConflicts: conflicts.length,
    totalResolved: resolved.length,
  }
}
