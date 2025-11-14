/**
 * Скрипт для автоматического обновления версии сборки
 * Формат: build hh:mm_dd/mm/yy
 *
 * Использование:
 * node scripts/update-build-version.js
 */

import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '..')

// Получаем текущую дату и время
const now = new Date()
const hours = String(now.getHours()).padStart(2, '0')
const minutes = String(now.getMinutes()).padStart(2, '0')
const day = String(now.getDate()).padStart(2, '0')
const month = String(now.getMonth() + 1).padStart(2, '0')
const year = String(now.getFullYear()).slice(-2)

// Формат: build_hh.mm_dd.mm.yy
const buildVersion = `build_${hours}.${minutes}_${day}.${month}.${year}`

// Путь к App.jsx
const appJsxPath = join(rootDir, 'src', 'App.jsx')

try {
  // Читаем файл
  let content = readFileSync(appJsxPath, 'utf8')

  // Ищем и заменяем версию
  // Ищем паттерн: Time Tracker Dashboard v1.2.0 или Time Tracker Dashboard v1.2.0 build ...
  const versionPattern = /(Time Tracker Dashboard v\d+\.\d+\.\d+)(\s+build[\d:/\s_.]+)?/

  if (versionPattern.test(content)) {
    // Заменяем версию
    content = content.replace(versionPattern, `Time Tracker Dashboard v1.2.1 ${buildVersion}`)

    // Записываем обратно
    writeFileSync(appJsxPath, content, 'utf8')
    console.log(`✅ Версия сборки обновлена: ${buildVersion}`)
  } else {
    console.warn('⚠️ Паттерн версии не найден в App.jsx')
  }
} catch (error) {
  console.error('❌ Ошибка обновления версии:', error)
  process.exit(1)
}
