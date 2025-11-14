/**
 * Скрипт для автоматического обновления версии сборки
 * Формат: build hh:mm_dd/mm/yy
 *
 * Использование:
 * node scripts/update-build-version.js
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
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
    // Заменяем версию БЕЗ build версии (она теперь отображается отдельно в footer)
    content = content.replace(versionPattern, `Time Tracker Dashboard v1.2.3`)

    // Записываем обратно
    writeFileSync(appJsxPath, content, 'utf8')
    console.log(`✅ Версия сборки обновлена: ${buildVersion}`)
  } else {
    console.warn('⚠️ Паттерн версии не найден в App.jsx')
  }

  // Записываем версию в .env файл
  const envPath = join(rootDir, '.env')
  try {
    let envContent = ''
    if (existsSync(envPath)) {
      envContent = readFileSync(envPath, 'utf8')
    }

    // Обновляем или добавляем VITE_BUILD_VERSION
    if (envContent.includes('VITE_BUILD_VERSION=')) {
      envContent = envContent.replace(
        /VITE_BUILD_VERSION=.*/,
        `VITE_BUILD_VERSION=${buildVersion}`
      )
    } else {
      envContent += `\nVITE_BUILD_VERSION=${buildVersion}\n`
    }

    writeFileSync(envPath, envContent, 'utf8')
    console.log(`✅ Версия сборки записана в .env: ${buildVersion}`)
  } catch (envError) {
    console.warn('⚠️ Не удалось записать версию в .env:', envError.message)
  }

  // Создаем/обновляем version.json в public
  const versionJsonPath = join(rootDir, 'public', 'version.json')
  try {
    // Читаем существующий version.json, если он есть, чтобы сохранить версию приложения
    let existingVersion = '1.2.3'
    if (existsSync(versionJsonPath)) {
      try {
        const existingData = JSON.parse(readFileSync(versionJsonPath, 'utf8'))
        if (existingData.version && !existingData.version.startsWith('build_')) {
          existingVersion = existingData.version
        }
      } catch (e) {
        // Игнорируем ошибки чтения
      }
    }

    const versionData = {
      version: existingVersion,
      build: buildVersion,
    }
    writeFileSync(versionJsonPath, JSON.stringify(versionData, null, 2), 'utf8')
    console.log(`✅ version.json обновлен: version=${existingVersion}, build=${buildVersion}`)
  } catch (versionError) {
    console.warn('⚠️ Не удалось записать version.json:', versionError.message)
  }
} catch (error) {
  console.error('❌ Ошибка обновления версии:', error)
  process.exit(1)
}
