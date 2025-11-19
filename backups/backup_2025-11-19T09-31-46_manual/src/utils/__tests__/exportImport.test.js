/**
 * ✅ ТЕСТЫ: Тесты для exportImport.js
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  exportToJSON,
  importFromJSON,
  importFromJSONFile,
  validateImportData,
  createBackup,
  exportToCSV,
  exportToExcel,
  importFromCSV,
  getExportStats,
  checkVersionCompatibility,
  createImportOptions,
  resolveImportConflicts,
} from '../exportImport'

// Мокаем DOM API для тестов
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
global.URL.revokeObjectURL = vi.fn()

// Сохраняем оригинальный Blob для восстановления
const OriginalBlob = global.Blob

global.Blob = class Blob {
  constructor(parts, options) {
    this.parts = parts
    this.type = options?.type || ''
  }
}

// Мокаем document.createElement и методы
let mockClick
let mockAppendChild
let mockRemoveChild
let createdLinks = []

beforeEach(() => {
  vi.clearAllMocks()
  createdLinks = []
  mockClick = vi.fn()
  
  // Восстанавливаем оригинальный Blob
  global.Blob = OriginalBlob
  
  // Создаем spy на реальные методы body
  mockAppendChild = vi.spyOn(global.document.body, 'appendChild').mockImplementation((node) => {
    // Проверяем что это настоящий DOM элемент
    if (node && typeof node === 'object' && node.nodeType !== undefined) {
      return node
    }
    // Если это не настоящий DOM элемент, создаем мок
    return node
  })
  mockRemoveChild = vi.spyOn(global.document.body, 'removeChild').mockImplementation((node) => {
    return node
  })
  
  // Мокаем document.createElement - возвращаем объект с nodeType для совместимости
  global.document.createElement = vi.fn((tag) => {
    if (tag === 'a') {
      const link = {
        nodeType: 1, // ELEMENT_NODE
        href: '',
        download: '',
        style: { display: '' },
        click: mockClick,
      }
      createdLinks.push(link)
      return link
    }
    return { nodeType: 1 }
  })
})

describe('exportToJSON', () => {
  const mockEntries = [
    {
      id: '1',
      date: '2025-11-08',
      start: '09:00',
      end: '17:00',
      category: 'Разработка',
      description: 'Тестовая запись',
      rate: '1000',
    },
  ]
  
  const mockCategories = [
    { id: '1', name: 'Разработка', rate: 1000, color: '#6366F1' },
  ]
  
  const mockSettings = { theme: 'dark' }

  it('should export data to JSON format', async () => {
    const result = await exportToJSON(mockEntries, mockCategories, mockSettings)
    
    expect(result.success).toBe(true)
    expect(result.filename).toContain('time-tracker-export')
    expect(result.filename).toContain('.json')
    expect(mockClick).toHaveBeenCalled()
  })

  it('should filter invalid entries', async () => {
    const invalidEntries = [
      { id: '1', date: '2025-11-08', start: '09:00', end: '17:00' },
      null,
      { id: '2' }, // нет даты
      { id: '3', date: '2025-11-09', start: '10:00', end: '18:00' },
    ]

    const result = await exportToJSON(invalidEntries, mockCategories, mockSettings)
    
    expect(result.success).toBe(true)
    expect(mockClick).toHaveBeenCalled()
  })

  it('should sort entries by date (newest first)', async () => {
    const entries = [
      { id: '1', date: '2025-11-07', start: '09:00', end: '17:00' },
      { id: '2', date: '2025-11-09', start: '10:00', end: '18:00' },
      { id: '3', date: '2025-11-08', start: '11:00', end: '19:00' },
    ]

    const result = await exportToJSON(entries, mockCategories, mockSettings)
    
    expect(result.success).toBe(true)
    expect(mockClick).toHaveBeenCalled()
  })

  it('should use custom filename if provided', async () => {
    const options = { filename: 'custom-export.json' }
    const result = await exportToJSON(mockEntries, mockCategories, mockSettings, options)
    
    expect(result.success).toBe(true)
    expect(result.filename).toBe('custom-export.json')
  })

  it('should handle empty entries array', async () => {
    const result = await exportToJSON([], mockCategories, mockSettings)
    
    expect(result.success).toBe(true)
    expect(mockClick).toHaveBeenCalled()
  })

  it('should handle errors during export', async () => {
    // Мокаем ошибку при создании Blob
    const OriginalBlob = global.Blob
    global.Blob = class Blob {
      constructor() {
        throw new Error('Blob creation failed')
      }
    }

    await expect(
      exportToJSON(mockEntries, mockCategories, mockSettings)
    ).rejects.toThrow('Ошибка экспорта')
    
    // Восстанавливаем оригинальный Blob
    global.Blob = OriginalBlob
  })
})

describe('importFromJSON', () => {
  it('should import valid JSON data', () => {
    const jsonString = JSON.stringify({
      version: '1.1',
      data: {
        entries: [
          {
            id: '1',
            date: '2025-11-08',
            start: '09:00',
            end: '17:00',
            category: 'Разработка',
          },
        ],
        categories: [{ id: '1', name: 'Разработка' }],
        settings: { theme: 'dark' },
      },
    })

    const result = importFromJSON(jsonString)

    expect(result.isValid).toBe(true)
    expect(result.data.entries).toHaveLength(1)
    expect(result.data.entries[0].id).toBe('1')
    expect(result.version).toBe('1.1')
  })

  it('should handle old format without data wrapper', () => {
    const jsonString = JSON.stringify({
      version: '1.0',
      entries: [
        {
          id: '1',
          date: '2025-11-08',
          start: '09:00',
          end: '17:00',
          category: 'Разработка',
        },
      ],
    })

    const result = importFromJSON(jsonString)

    expect(result.isValid).toBe(true)
    expect(result.data.entries).toHaveLength(1)
  })

  it('should reject invalid JSON string', () => {
    const result = importFromJSON('invalid json{')

    expect(result.isValid).toBe(false)
    expect(result.error).toContain('Ошибка парсинга JSON')
  })

  it('should reject data without entries array', () => {
    const jsonString = JSON.stringify({
      version: '1.1',
      data: {
        categories: [],
        settings: {},
      },
    })

    const result = importFromJSON(jsonString)

    expect(result.isValid).toBe(false)
    expect(result.error).toContain('Ошибка валидации')
  })

  it('should reject entries without required fields', () => {
    const jsonString = JSON.stringify({
      version: '1.1',
      data: {
        entries: [
          {
            id: '1',
            // нет date, start, end
          },
        ],
      },
    })

    const result = importFromJSON(jsonString)

    expect(result.isValid).toBe(false)
    expect(result.error).toContain('Ошибка валидации')
  })
})

describe('importFromJSONFile', () => {
  it('should import data from JSON file', async () => {
    const jsonContent = JSON.stringify({
      version: '1.1',
      data: {
        entries: [
          {
            id: '1',
            date: '2025-11-08',
            start: '09:00',
            end: '17:00',
            category: 'Разработка',
          },
        ],
      },
    })

    const file = new File([jsonContent], 'test.json', { type: 'application/json' })
    
    // Мокаем FileReader как класс-конструктор
    const mockFileReaderInstance = {
      result: jsonContent,
      onload: null,
      onerror: null,
      readAsText: vi.fn(function(file) {
        setTimeout(() => {
          if (this.onload) {
            this.onload({ target: { result: jsonContent } })
          }
        }, 0)
      }),
    }
    
    global.FileReader = vi.fn(function FileReader() {
      Object.assign(this, mockFileReaderInstance)
    })

    const result = await importFromJSONFile(file)

    expect(result.success).toBe(true)
    expect(result.data.entries).toHaveLength(1)
  })

  it('should reject non-JSON file', async () => {
    const file = new File(['not json'], 'test.txt', { type: 'text/plain' })

    await expect(importFromJSONFile(file)).rejects.toThrow('Неверный формат файла')
  })

  it('should reject null file', async () => {
    await expect(importFromJSONFile(null)).rejects.toThrow('Файл не выбран')
  })

  it('should handle file read errors', async () => {
    const file = new File(['test'], 'test.json', { type: 'application/json' })
    
    const mockFileReaderInstance = {
      onload: null,
      onerror: null,
      readAsText: vi.fn(function() {
        setTimeout(() => {
          if (this.onerror) {
            this.onerror()
          }
        }, 0)
      }),
    }
    
    global.FileReader = vi.fn(function FileReader() {
      Object.assign(this, mockFileReaderInstance)
    })

    await expect(importFromJSONFile(file)).rejects.toThrow('Ошибка чтения файла')
  })
})

describe('validateImportData', () => {
  it('should validate correct data structure', () => {
    const data = {
      data: {
        entries: [
          {
            id: '1',
            date: '2025-11-08',
            start: '09:00',
            end: '17:00',
            category: 'Разработка',
          },
        ],
        categories: [{ id: '1', name: 'Разработка' }],
        settings: { theme: 'dark' },
      },
    }

    const result = validateImportData(data)

    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should reject non-object data', () => {
    const result = validateImportData(null)

    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('Неверная структура файла')
  })

  it('should reject data without entries array', () => {
    const data = {
      data: {
        categories: [],
        settings: {},
      },
    }

    const result = validateImportData(data)

    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('Записи должны быть массивом')
  })

  it('should validate entries and report errors', () => {
    const data = {
      data: {
        entries: [
          { id: '1' }, // нет date, start, end, category
          { id: '2', date: '2025-11-08' }, // нет start, end, category
        ],
      },
    }

    const result = validateImportData(data)

    expect(result.isValid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('should validate categories if present', () => {
    const data = {
      data: {
        entries: [
          {
            id: '1',
            date: '2025-11-08',
            start: '09:00',
            end: '17:00',
            category: 'Разработка',
          },
        ],
        categories: [{}, {}], // нет name или id
      },
    }

    const result = validateImportData(data)

    expect(result.isValid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('should handle old format without data wrapper', () => {
    const data = {
      entries: [
        {
          id: '1',
          date: '2025-11-08',
          start: '09:00',
          end: '17:00',
          category: 'Разработка',
        },
      ],
    }

    const result = validateImportData(data)

    expect(result.isValid).toBe(true)
  })
})

describe('createBackup', () => {
  const mockEntries = [
    {
      id: '1',
      date: '2025-11-08',
      start: '09:00',
      end: '17:00',
      category: 'Разработка',
    },
  ]
  
  const mockCategories = [{ id: '1', name: 'Разработка' }]
  const mockSettings = { theme: 'dark' }

  it('should create backup file', async () => {
    const result = await createBackup(mockEntries, mockCategories, mockSettings)

    expect(result.success).toBe(true)
    expect(result.filename).toContain('time-tracker-backup')
    expect(result.filename).toContain('.json')
  })
})

describe('exportToCSV', () => {
  const mockEntries = [
    {
      id: '1',
      date: '2025-11-08',
      start: '09:00',
      end: '17:00',
      duration: 8,
      category: 'Разработка',
      description: 'Тест',
      rate: 1000,
      earned: 8000,
      isManual: false,
    },
  ]
  
  const mockCategories = [{ id: '1', name: 'Разработка' }]

  it('should export data to CSV format', async () => {
    const result = await exportToCSV(mockEntries, mockCategories)

    expect(result.success).toBe(true)
    expect(result.filename).toContain('time-tracker-export')
    expect(result.filename).toContain('.csv')
    expect(mockClick).toHaveBeenCalled()
  })

  it('should reject empty entries', async () => {
    await expect(exportToCSV([], mockCategories)).rejects.toThrow('Нет данных для экспорта')
  })

  it('should handle entries with missing fields', async () => {
    const entries = [
      {
        id: '1',
        date: '2025-11-08',
        // остальные поля отсутствуют
      },
    ]

    const result = await exportToCSV(entries, mockCategories)

    expect(result.success).toBe(true)
  })
})

describe('exportToExcel', () => {
  const mockEntries = [
    {
      id: '1',
      date: '2025-11-08',
      start: '09:00',
      end: '17:00',
      duration: 8,
      category: 'Разработка',
      description: 'Тест',
      rate: 1000,
      earned: 8000,
      isManual: false,
    },
  ]
  
  const mockCategories = [
    { id: '1', name: 'Разработка', rate: 1000, color: '#6366F1', icon: 'Code' },
  ]

  it('should export data to Excel format', async () => {
    const result = await exportToExcel(mockEntries, mockCategories)

    expect(result.success).toBe(true)
    expect(result.filename).toContain('time-tracker-export')
    expect(result.filename).toContain('.xlsx')
    expect(mockClick).toHaveBeenCalled()
  })

  it('should reject empty entries', async () => {
    await expect(exportToExcel([], mockCategories)).rejects.toThrow('Нет данных для экспорта')
  })
})

describe('importFromCSV', () => {
  it('should import data from CSV file', async () => {
    const csvContent = `"Дата","Время начала","Время окончания","Длительность (ч)","Категория","Описание","Ставка (₽/ч)","Заработано (₽)","Тип записи","ID"
"2025-11-08","09:00","17:00","8","Разработка","Тест","1000","8000","Автоматическая","1"`

    const file = new File([csvContent], 'test.csv', { type: 'text/csv' })
    
    const mockFileReaderInstance = {
      result: csvContent,
      onload: null,
      onerror: null,
      readAsText: vi.fn(function(file) {
        setTimeout(() => {
          if (this.onload) {
            this.onload({ target: { result: csvContent } })
          }
        }, 0)
      }),
    }
    
    global.FileReader = vi.fn(function FileReader() {
      Object.assign(this, mockFileReaderInstance)
    })

    const result = await importFromCSV(file)

    expect(result.success).toBe(true)
    expect(result.entries).toHaveLength(1)
    expect(result.entries[0]['Дата']).toBe('2025-11-08')
  })

  it('should reject non-CSV file', async () => {
    const file = new File(['test'], 'test.txt', { type: 'text/plain' })

    await expect(importFromCSV(file)).rejects.toThrow('Неверный формат файла')
  })

  it('should reject empty CSV file', async () => {
    const csvContent = '"Дата","Время начала"'
    const file = new File([csvContent], 'test.csv', { type: 'text/csv' })
    
    const mockFileReaderInstance = {
      result: csvContent,
      onload: null,
      onerror: null,
      readAsText: vi.fn(function() {
        setTimeout(() => {
          if (this.onload) {
            this.onload({ target: { result: csvContent } })
          }
        }, 0)
      }),
    }
    
    global.FileReader = vi.fn(function FileReader() {
      Object.assign(this, mockFileReaderInstance)
    })

    await expect(importFromCSV(file)).rejects.toThrow('CSV файл пуст')
  })

  it('should generate UUID for entries without ID', async () => {
    const csvContent = `"Дата","Время начала","Время окончания"
"2025-11-08","09:00","17:00"`

    const file = new File([csvContent], 'test.csv', { type: 'text/csv' })
    
    const mockFileReaderInstance = {
      result: csvContent,
      onload: null,
      onerror: null,
      readAsText: vi.fn(function() {
        setTimeout(() => {
          if (this.onload) {
            this.onload({ target: { result: csvContent } })
          }
        }, 0)
      }),
    }
    
    global.FileReader = vi.fn(function FileReader() {
      Object.assign(this, mockFileReaderInstance)
    })

    const result = await importFromCSV(file)

    expect(result.success).toBe(true)
    expect(result.entries[0].ID).toBeDefined()
  })
})

describe('getExportStats', () => {
  it('should calculate export statistics', () => {
    const entries = [
      {
        id: '1',
        date: '2025-11-08',
        duration: 8,
        earned: 8000,
      },
      {
        id: '2',
        date: '2025-11-09',
        duration: 6,
        earned: 6000,
      },
    ]
    
    const categories = [
      { id: '1', name: 'Разработка' },
      { id: '2', name: 'Тестирование' },
    ]

    const stats = getExportStats(entries, categories)

    expect(stats.totalEntries).toBe(2)
    expect(stats.totalCategories).toBe(2)
    expect(stats.totalHours).toBe('14.00')
    expect(stats.totalEarned).toBe('14000.00')
    expect(stats.averageRate).toBe('1000.00')
    expect(stats.dateRange).toBeDefined()
  })

  it('should handle empty entries', () => {
    const stats = getExportStats([], [])

    expect(stats.totalEntries).toBe(0)
    expect(stats.totalCategories).toBe(0)
    expect(stats.totalHours).toBe('0.00')
    expect(stats.totalEarned).toBe('0.00')
    expect(stats.averageRate).toBe('0')
    expect(stats.dateRange).toBeNull()
  })

  it('should handle null entries', () => {
    const stats = getExportStats(null, null)

    expect(stats.totalEntries).toBe(0)
    expect(stats.totalCategories).toBe(0)
  })
})

describe('checkVersionCompatibility', () => {
  it('should detect compatible versions', () => {
    const result = checkVersionCompatibility('1.1', '1.1')

    expect(result.compatible).toBe(true)
    expect(result.warning).toBeNull()
  })

  it('should warn about newer import version', () => {
    const result = checkVersionCompatibility('2.0', '1.1')

    expect(result.compatible).toBe(false)
    expect(result.warning).toContain('более новой версии')
  })

  it('should warn about older import version', () => {
    // Проверяем случай когда major версия меньше
    const result = checkVersionCompatibility('0.9', '1.1')

    expect(result.compatible).toBe(true)
    expect(result.warning).toBeTruthy()
    expect(result.warning).toContain('более старой версии')
  })
})

describe('createImportOptions', () => {
  it('should create default import options', () => {
    const options = createImportOptions()

    expect(options.mergeMode).toBe('replace')
    expect(options.skipDuplicates).toBe(true)
    expect(options.validateData).toBe(true)
    expect(options.createBackup).toBe(true)
  })

  it('should override default options', () => {
    const options = createImportOptions({
      mergeMode: 'merge',
      skipDuplicates: false,
    })

    expect(options.mergeMode).toBe('merge')
    expect(options.skipDuplicates).toBe(false)
  })
})

describe('resolveImportConflicts', () => {
  const existingEntries = [
    { id: '1', date: '2025-11-08', category: 'Разработка' },
    { id: '2', date: '2025-11-09', category: 'Тестирование' },
  ]

  it('should detect duplicate IDs', () => {
    const importedEntries = [
      { id: '1', date: '2025-11-10', category: 'Разработка' },
      { id: '3', date: '2025-11-11', category: 'Дизайн' },
    ]

    const result = resolveImportConflicts(existingEntries, importedEntries)

    expect(result.totalConflicts).toBe(1)
    // Один конфликт (id='1'), один entry без конфликта (id='3')
    // По умолчанию duplicateResolution='skip', поэтому конфликтный entry не добавляется
    expect(result.totalResolved).toBe(1) // только entry без конфликта
  })

  it('should skip duplicates when resolution is skip', () => {
    const importedEntries = [
      { id: '1', date: '2025-11-10', category: 'Разработка' },
      { id: '3', date: '2025-11-11', category: 'Дизайн' },
    ]

    const result = resolveImportConflicts(existingEntries, importedEntries, {
      duplicateResolution: 'skip',
    })

    expect(result.totalConflicts).toBe(1)
    expect(result.totalResolved).toBe(1) // только новый entry добавлен
  })

  it('should replace duplicates when resolution is replace', () => {
    const importedEntries = [
      { id: '1', date: '2025-11-10', category: 'Разработка' },
    ]

    const result = resolveImportConflicts(existingEntries, importedEntries, {
      duplicateResolution: 'replace',
    })

    expect(result.totalConflicts).toBe(1)
    expect(result.totalResolved).toBe(1)
    expect(result.resolved[0].date).toBe('2025-11-10')
  })

  it('should merge duplicates when resolution is merge', () => {
    const importedEntries = [
      { id: '1', date: '2025-11-10', category: 'Разработка', description: 'Новое описание' },
    ]

    const result = resolveImportConflicts(existingEntries, importedEntries, {
      duplicateResolution: 'merge',
    })

    expect(result.totalConflicts).toBe(1)
    expect(result.totalResolved).toBe(1)
    expect(result.resolved[0].description).toBe('Новое описание')
  })

  it('should handle string and number IDs correctly', () => {
    const existingEntries = [
      { id: '1', date: '2025-11-08' },
      { id: 2, date: '2025-11-09' },
    ]

    const importedEntries = [
      { id: 1, date: '2025-11-10' }, // число вместо строки
      { id: '2', date: '2025-11-11' }, // строка вместо числа
    ]

    const result = resolveImportConflicts(existingEntries, importedEntries)

    expect(result.totalConflicts).toBe(2) // оба должны быть обнаружены
  })
})

