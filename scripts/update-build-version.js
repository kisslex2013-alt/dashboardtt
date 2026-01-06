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

// Путь к appVersion.ts (централизованный файл версии)
const appVersionPath = join(rootDir, 'src', 'config', 'appVersion.ts')

// Для обратной совместимости - старые пути
const appTsxPath = join(rootDir, 'src', 'App.tsx')
const appJsxPath = join(rootDir, 'src', 'App.jsx')

try {
  // Читаем версию из package.json
  const packageJsonPath = join(rootDir, 'package.json')
  let appVersion = '1.4'
  if (existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
      if (packageJson.version) {
        appVersion = packageJson.version
      }
    } catch (e) {
      console.warn('⚠️ Не удалось прочитать версию из package.json, используем 1.4')
    }
  }

  // Обновляем версию в appVersion.ts (если нужно)
  if (existsSync(appVersionPath)) {
    let content = readFileSync(appVersionPath, 'utf8')
    
    // Проверяем текущую версию
    const versionMatch = content.match(/APP_VERSION\s*=\s*['"]([^'"]+)['"]/)
    if (versionMatch) {
      console.log(`✅ Версия в appVersion.ts: v${versionMatch[1]}`)
    }
  } else {
    console.warn(`⚠️ Файл ${appVersionPath} не найден`)
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
    // Читаем версию из package.json
    const packageJsonPath = join(rootDir, 'package.json')
    let existingVersion = '1.3.0'
    if (existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
        if (packageJson.version) {
          existingVersion = packageJson.version
        }
      } catch (e) {
        // Игнорируем ошибки чтения
      }
    }
    
    // Если version.json существует, пытаемся сохранить версию из него (если она не build версия)
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
