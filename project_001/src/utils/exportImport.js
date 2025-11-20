import { logger } from './logger'
import { generateUUID } from './uuid'

/**
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 *
 * Этот файл содержит утилиты для экспорта и импорта данных:
 * - Экспорт данных в JSON формат
 * - Импорт данных из JSON файлов
 * - Валидация импортируемых данных
 * - Создание резервных копий
 * - Экспорт в различные форматы
 */

/**
 * Экспортирует данные в JSON формат
 * @param {Array} entries - массив записей времени
 * @param {Array} categories - массив категорий
 * @param {Object} settings - настройки приложения
 * @param {Object} options - дополнительные опции экспорта
 * @returns {Promise} промис с результатом экспорта
 */
export function exportToJSON(entries, categories, settings, options = {}) {
  return new Promise((resolve, reject) => {
    try {
      // Используем одно и то же время для exportDate и имени файла
      const now = new Date()
      const day = String(now.getDate()).padStart(2, '0')
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const year = now.getFullYear()
      const hours = String(now.getHours()).padStart(2, '0')
      const minutes = String(now.getMinutes()).padStart(2, '0')

      // Формируем exportDate в формате, соответствующем времени в имени файла
      // Используем локальное время для консистентности
      const exportDateISO = now.toISOString()

      // Фильтруем и валидируем записи перед экспортом
      const validEntries = entries
        ? entries.filter(entry => {
            // Проверяем, что запись существует и имеет обязательные поля
            if (!entry || !entry.date) {
              console.warn('⚠️ Пропущена запись без даты:', entry)
              return false
            }
            return true
          })
        : []

      // Сортируем записи по дате (сначала самые новые) для удобства
      const sortedEntries = validEntries.sort((a, b) => {
        const dateA = new Date(a.date || 0)
        const dateB = new Date(b.date || 0)
        return dateB - dateA // Сначала новые
      })

      // Логируем для отладки
      if (validEntries.length !== entries.length) {
        console.warn(`⚠️ Отфильтровано ${entries.length - validEntries.length} невалидных записей`)
      }

      // Проверяем записи за сегодня
      const today = new Date()
      const todayStr = today.toISOString().split('T')[0] // YYYY-MM-DD
      const todayEntries = sortedEntries.filter(entry => {
        const entryDateStr = entry.date.split('T')[0] // Извлекаем дату из строки
        return entryDateStr === todayStr
      })

      if (todayEntries.length > 0) {
        console.log(`✅ Найдено ${todayEntries.length} записей за сегодня (${todayStr}) в экспорте`)
      } else {
        console.warn(`⚠️ Записей за сегодня (${todayStr}) не найдено в экспорте`)
      }

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

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      })

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url

      // Формируем имя файла с датой и временем экспорта: time-tracker-export-05-11-2025-16-54.json
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
      reject(new Error(`Ошибка экспорта: ${error.message}`))
    }
  })
}

/**
 * Импортирует данные из JSON строки (используется в ImportModal)
 * @param {string} jsonString - JSON строка для импорта
 * @returns {Object} результат импорта с валидацией
 */
export function importFromJSON(jsonString) {
  try {
    const data = JSON.parse(jsonString)

    // Логируем структуру для отладки
    console.log('📋 Структура импортируемого файла:', {
      hasData: !!data.data,
      hasEntries: !!(data.data?.entries || data.entries),
      entriesCount: (data.data?.entries || data.entries)?.length || 0,
      version: data.version,
    })

    // Валидация структуры файла
    const validation = validateImportData(data)
    if (!validation.isValid) {
      // Безопасное преобразование ошибок в строки
      const errorMessages = validation.errors.map(err => {
        if (typeof err === 'string') return err
        if (err?.message) return err.message
        if (err?.toString) return err.toString()
        return 'Неизвестная ошибка'
      })

      console.error('❌ Ошибки валидации:', errorMessages)
      return {
        isValid: false,
        error: `Ошибка валидации: ${errorMessages.join(', ')}`,
        data: null,
      }
    }

    // Извлекаем данные - поддерживаем оба формата: { data: { entries: [...] } } и { entries: [...] }
    const extractedData = data.data || data
    
    // Проверяем, что entries есть
    if (!extractedData.entries || !Array.isArray(extractedData.entries)) {
      console.error('❌ Записи отсутствуют или имеют неверный формат')
      return {
        isValid: false,
        error: 'Записи отсутствуют или имеют неверный формат',
        data: null,
      }
    }

    console.log('✅ Валидация пройдена, записей:', extractedData.entries.length)

    return {
      isValid: true,
      data: extractedData,
      metadata: data.metadata,
      version: data.version,
      error: null,
    }
  } catch (error) {
    console.error('❌ Ошибка парсинга JSON:', error)
    return {
      isValid: false,
      error: `Ошибка парсинга JSON: ${error.message}`,
      data: null,
    }
  }
}

/**
 * Импортирует данные из JSON файла (File объект)
 * @param {File} file - файл для импорта
 * @returns {Promise} промис с импортированными данными
 */
export function importFromJSONFile(file) {
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
      const result = importFromJSON(e.target.result)
      if (result.isValid) {
        resolve({
          success: true,
          data: result.data,
          metadata: result.metadata,
          version: result.version,
        })
      } else {
        reject(new Error(result.error))
      }
    }

    reader.onerror = () => reject(new Error('Ошибка чтения файла'))
    reader.readAsText(file)
  })
}

/**
 * Валидирует импортируемые данные
 * @param {Object} data - данные для валидации
 * @returns {Object} результат валидации
 */
export function validateImportData(data) {
  const errors = []

  // Проверяем базовую структуру
  if (!data || typeof data !== 'object') {
    errors.push('Неверная структура файла')
    return { isValid: false, errors }
  }

  // Поддерживаем два формата: с data.data и просто data
  const actualData = data.data || data

  // Проверяем записи (обязательно)
  if (!Array.isArray(actualData.entries)) {
    errors.push('Записи должны быть массивом')
    return { isValid: false, errors }
  }

  // Валидируем каждую запись (только первые 10 для скорости)
  const entriesToCheck = actualData.entries.slice(0, 10)
  let hasErrors = false

  entriesToCheck.forEach((entry, index) => {
    // ID не обязателен - может быть сгенерирован при импорте
    // if (!entry.id) {
    //   errors.push(`Запись ${index + 1}: отсутствует ID`)
    //   hasErrors = true
    // }
    if (!entry.date) {
      errors.push(`Запись ${index + 1}: отсутствует дата`)
      hasErrors = true
    }
    // start и end не обязательны - могут быть вычислены из duration
    // if (!entry.start) {
    //   errors.push(`Запись ${index + 1}: отсутствует время начала`)
    //   hasErrors = true
    // }
    // if (!entry.end) {
    //   errors.push(`Запись ${index + 1}: отсутствует время окончания`)
    //   hasErrors = true
    // }
    // category или categoryId допустимы, но не обязательны (может быть дефолтная)
    // if (!entry.category && !entry.categoryId) {
    //   errors.push(`Запись ${index + 1}: отсутствует категория`)
    //   hasErrors = true
    // }

    // Останавливаемся после 3 ошибок для краткости
    if (errors.length >= 3) {
      return
    }
  })

  // Если есть критичные ошибки, возвращаем
  if (hasErrors && errors.length > 0) {
    return { isValid: false, errors }
  }

  // Проверяем категории (опционально)
  if (actualData.categories && !Array.isArray(actualData.categories)) {
    errors.push('Категории должны быть массивом')
  } else if (actualData.categories) {
    // Валидируем первые 5 категорий
    const categoriesToCheck = actualData.categories.slice(0, 5)
    categoriesToCheck.forEach((category, index) => {
      if (!category.name && !category.id) {
        errors.push(`Категория ${index + 1}: отсутствует название или ID`)
      }
    })
  }

  // Проверяем настройки (опционально)
  if (actualData.settings && typeof actualData.settings !== 'object') {
    errors.push('Настройки должны быть объектом')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Создает резервную копию всех данных
 * @param {Array} entries - записи времени
 * @param {Array} categories - категории
 * @param {Object} settings - настройки
 * @returns {Promise} промис с результатом создания резервной копии
 */
export function createBackup(entries, categories, settings) {
  return exportToJSON(entries, categories, settings, {
    filename: `time-tracker-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`,
    includeMetadata: true,
  })
}

/**
 * Экспортирует данные в CSV формат
 * @param {Array} entries - массив записей времени
 * @param {Array} categories - массив категорий
 * @returns {Promise} промис с результатом экспорта
 */
export function exportToCSV(entries, categories) {
  return new Promise((resolve, reject) => {
    try {
      if (!entries || entries.length === 0) {
        reject(new Error('Нет данных для экспорта'))
        return
      }

      // Создаем заголовки CSV
      const headers = [
        'Дата',
        'Время начала',
        'Время окончания',
        'Длительность (ч)',
        'Категория',
        'Описание',
        'Ставка (₽/ч)',
        'Заработано (₽)',
        'Тип записи',
        'ID',
      ]

      // Создаем строки данных
      const rows = entries.map(entry => [
        entry.date || '',
        entry.start || '',
        entry.end || '',
        entry.duration || '0',
        entry.category || '',
        entry.description || '',
        entry.rate || '0',
        entry.earned || '0',
        entry.isManual ? 'Ручная' : 'Автоматическая',
        entry.id || '',
      ])

      // Объединяем заголовки и данные
      const csvContent = [headers, ...rows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n')

      // Создаем и скачиваем файл
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      // Формируем имя файла с датой и временем экспорта: time-tracker-export-05-11-2025-16-54.csv
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
      reject(new Error(`Ошибка экспорта в CSV: ${error.message}`))
    }
  })
}

/**
 * Экспортирует данные в Excel формат (XLSX)
 * @param {Array} entries - массив записей времени
 * @param {Array} categories - массив категорий
 * @returns {Promise} промис с результатом экспорта
 */
export function exportToExcel(entries, categories) {
  return new Promise((resolve, reject) => {
    try {
      if (!entries || entries.length === 0) {
        reject(new Error('Нет данных для экспорта'))
        return
      }

      // Создаем данные для Excel
      const excelData = {
        'Записи времени': entries.map(entry => ({
          Дата: entry.date || '',
          'Время начала': entry.start || '',
          'Время окончания': entry.end || '',
          'Длительность (ч)': parseFloat(entry.duration || 0),
          Категория: entry.category || '',
          Описание: entry.description || '',
          'Ставка (₽/ч)': parseFloat(entry.rate || 0),
          'Заработано (₽)': parseFloat(entry.earned || 0),
          'Тип записи': entry.isManual ? 'Ручная' : 'Автоматическая',
          ID: entry.id || '',
        })),
        Категории: categories.map(category => ({
          Название: category.name || '',
          'Ставка (₽/ч)': parseFloat(category.rate || 0),
          Цвет: category.color || '',
          Иконка: category.icon || '',
        })),
      }

      // Конвертируем в JSON для простоты (в реальном проекте можно использовать библиотеку xlsx)
      const blob = new Blob([JSON.stringify(excelData, null, 2)], {
        type: 'application/json',
      })

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      // Формируем имя файла с датой и временем экспорта: time-tracker-export-05-11-2025-16-54.xlsx
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
      reject(new Error(`Ошибка экспорта в Excel: ${error.message}`))
    }
  })
}

/**
 * Импортирует данные из CSV файла
 * @param {File} file - CSV файл
 * @returns {Promise} промис с импортированными данными
 */
export function importFromCSV(file) {
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
        const csvText = e.target.result
        const lines = csvText.split('\n')

        if (lines.length < 2) {
          reject(new Error('CSV файл пуст или содержит только заголовки'))
          return
        }

        // Парсим заголовки
        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())

        // Парсим данные
        const entries = []
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim()
          if (!line) continue

          const values = line.split(',').map(v => v.replace(/"/g, '').trim())

          if (values.length !== headers.length) {
            logger.warn(`Строка ${i + 1}: неверное количество колонок`)
            continue
          }

          const entry = {}
          headers.forEach((header, index) => {
            entry[header] = values[index]
          })

          // Добавляем ID если его нет
          if (!entry.ID) {
            entry.ID = generateUUID()
          }

          entries.push(entry)
        }

        resolve({
          success: true,
          entries,
          headers,
          totalRows: entries.length,
        })
      } catch (error) {
        reject(new Error(`Ошибка парсинга CSV: ${error.message}`))
      }
    }

    reader.onerror = () => reject(new Error('Ошибка чтения файла'))
    reader.readAsText(file)
  })
}

/**
 * Получает статистику экспорта
 * @param {Array} entries - записи времени
 * @param {Array} categories - категории
 * @returns {Object} статистика экспорта
 */
export function getExportStats(entries, categories) {
  const totalEntries = entries ? entries.length : 0
  const totalCategories = categories ? categories.length : 0

  let totalHours = 0
  let totalEarned = 0

  if (entries) {
    totalHours = entries.reduce((sum, entry) => sum + parseFloat(entry.duration || 0), 0)
    totalEarned = entries.reduce((sum, entry) => sum + parseFloat(entry.earned || 0), 0)
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
            start: entries.reduce(
              (min, entry) => (entry.date < min ? entry.date : min),
              entries[0].date
            ),
            end: entries.reduce(
              (max, entry) => (entry.date > max ? entry.date : max),
              entries[0].date
            ),
          }
        : null,
  }
}

/**
 * Проверяет совместимость версий при импорте
 * @param {string} importVersion - версия импортируемого файла
 * @param {string} currentVersion - текущая версия приложения
 * @returns {Object} результат проверки совместимости
 */
export function checkVersionCompatibility(importVersion, currentVersion = '1.1') {
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
      warning:
        'Файл создан в более старой версии приложения. Некоторые функции могут быть недоступны.',
      recommendation: 'Рекомендуется создать новый экспорт в текущей версии.',
    }
  }

  return {
    compatible: true,
    warning: null,
    recommendation: null,
  }
}

/**
 * Создает файл с настройками для импорта
 * @param {Object} options - опции импорта
 * @returns {Object} настройки импорта
 */
export function createImportOptions(options = {}) {
  return {
    mergeMode: options.mergeMode || 'replace', // 'replace', 'merge', 'append'
    skipDuplicates: options.skipDuplicates || true,
    validateData: options.validateData !== false,
    createBackup: options.createBackup !== false,
    updateCategories: options.updateCategories || true,
    updateSettings: options.updateSettings || true,
    ...options,
  }
}

/**
 * Обрабатывает конфликты при импорте
 * @param {Array} existingEntries - существующие записи
 * @param {Array} importedEntries - импортируемые записи
 * @param {Object} options - опции обработки конфликтов
 * @returns {Object} результат обработки конфликтов
 */
export function resolveImportConflicts(existingEntries, importedEntries, options = {}) {
  const conflicts = []
  const resolved = []

  importedEntries.forEach(importedEntry => {
    // ИСПРАВЛЕНО: Конвертируем ID в строки для корректного сравнения
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
      // Если 'skip', то не добавляем в resolved
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
