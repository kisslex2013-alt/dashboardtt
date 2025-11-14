/**
 * 🎓 Скрипт автоматического деплоя на Cloudflare Pages
 *
 * Выполняет:
 * 1. Проверку наличия dist/index.html
 * 2. Создание/поиск проекта Cloudflare Pages
 * 3. Деплой dist на Cloudflare Pages
 * 4. Удаление старых деплоев (кроме последнего)
 * 5. Включение Web Analytics
 * 6. Проверку статуса аналитики
 */

import 'dotenv/config'
import {
  readFileSync,
  existsSync,
  createReadStream,
  unlinkSync,
  createWriteStream,
  readdirSync,
  statSync,
} from 'fs'
import { join, dirname, relative, sep } from 'path'
import { fileURLToPath } from 'url'
import { createHash } from 'crypto'
import fetch from 'node-fetch'
import FormData from 'form-data'
import archiver from 'archiver'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '..')

// Конфигурация из .env
const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID
const CF_PROJECT_NAME = process.env.CF_PROJECT_NAME || 'dashboardtt'
const CF_API_TOKEN = process.env.CF_API_TOKEN

// Проверка наличия переменных окружения
if (!CF_ACCOUNT_ID || !CF_API_TOKEN) {
  console.error('❌ Ошибка: Не заданы переменные окружения!')
  console.error('   Убедитесь, что в .env файле указаны:')
  console.error('   - CF_ACCOUNT_ID')
  console.error('   - CF_API_TOKEN')
  console.error('   - CF_PROJECT_NAME (опционально, по умолчанию: dashboardtt)')
  process.exit(1)
}

const CF_API_BASE = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}`

/**
 * Выполняет запрос к Cloudflare API
 */
async function cfRequest(endpoint, options = {}) {
  const url = `${CF_API_BASE}${endpoint}`
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${CF_API_TOKEN}`,
      ...options.headers,
    },
  })

  const data = await response.json()

  if (!response.ok || !data.success) {
    throw new Error(`Cloudflare API Error: ${JSON.stringify(data.errors || data)}`)
  }

  return data
}

/**
 * Проверяет наличие dist/index.html
 */
function checkDistExists() {
  const distIndexPath = join(rootDir, 'dist', 'index.html')

  if (!existsSync(distIndexPath)) {
    console.error('❌ Ошибка: dist/index.html не найден!')
    console.error('   Запустите: npm run build')
    process.exit(1)
  }

  console.log('✅ dist/index.html найден')
}

/**
 * Создает ZIP архив из папки dist
 */
async function createDistArchive() {
  const archivePath = join(rootDir, 'dist.zip')
  const output = createWriteStream(archivePath)
  const archive = archiver('zip', { zlib: { level: 9 } })

  return new Promise((resolve, reject) => {
    archive.on('error', reject)
    archive.pipe(output)

    output.on('close', () => {
      console.log('✅ Архив dist.zip создан')
      resolve(archivePath)
    })

    archive.directory(join(rootDir, 'dist'), false)
    archive.finalize()
  })
}

/**
 * Проверяет существование проекта или создает новый
 */
async function ensureProject() {
  try {
    // Пытаемся получить проект
    const data = await cfRequest(`/pages/projects/${CF_PROJECT_NAME}`)
    console.log(`✅ Проект "${CF_PROJECT_NAME}" найден`)
    return data.result
  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('404')) {
      console.log(`⚠️ Проект "${CF_PROJECT_NAME}" не найден`)
      console.log('📝 Для создания проекта вручную:')
      console.log('   1. Откройте https://dash.cloudflare.com')
      console.log('   2. Перейдите в Pages → "Create a project"')
      console.log('   3. Выберите "Upload assets directly"')
      console.log('   4. Назовите проект: ' + CF_PROJECT_NAME)
      console.log('   5. Выберите папку dist и нажмите "Deploy site"')
      console.log('\n   Или создайте проект через API (требуются дополнительные права)')
      throw new Error('Проект не существует. Создайте его вручную или через API.')
    }
    throw error
  }
}

/**
 * Вычисляет хэш файла
 */
function calculateFileHash(filePath) {
  const content = readFileSync(filePath)
  return createHash('sha256').update(content).digest('hex')
}

/**
 * Рекурсивно собирает все файлы из директории
 */
function collectFiles(dir, baseDir = dir, files = []) {
  const entries = readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    const relativePath = relative(baseDir, fullPath).replace(/\\/g, '/')

    if (entry.isDirectory()) {
      collectFiles(fullPath, baseDir, files)
    } else {
      const stats = statSync(fullPath)
      const hash = calculateFileHash(fullPath)
      // Путь должен начинаться с / для манифеста, но без / для FormData
      const manifestPath = relativePath.startsWith('/') ? relativePath : '/' + relativePath
      const formDataPath = relativePath // Без ведущего слеша для FormData
      files.push({
        path: formDataPath,
        manifestPath,
        fullPath,
        size: stats.size,
        hash,
      })
    }
  }

  return files
}

/**
 * Деплоит проект на Cloudflare Pages
 */
async function deployProject() {
  console.log('📦 Подготавливаю файлы для деплоя...')

  const distPath = join(rootDir, 'dist')

  // Проверяем наличие index.html
  const indexHtmlPath = join(distPath, 'index.html')
  if (!existsSync(indexHtmlPath)) {
    throw new Error('index.html не найден в dist/! Проверьте сборку проекта.')
  }
  console.log('   ✅ index.html найден')

  // Собираем файлы для манифеста
  const files = collectFiles(distPath, distPath)
  console.log(`   Найдено ${files.length} файлов`)

  // Создаем манифест (формат для Cloudflare Pages API: путь -> хэш)
  const manifest = {}

  // Заполняем манифест: путь с ведущим слешем -> хэш
  for (const file of files) {
    manifest[file.manifestPath] = file.hash
  }

  console.log('📦 Создаю ZIP архив...')
  let archivePath
  try {
    archivePath = await createDistArchive()
  } catch (error) {
    console.error('❌ Ошибка создания архива:', error.message)
    throw error
  }

  console.log('🚀 Начинаю деплой на Cloudflare Pages...')
  console.log(`   Манифест содержит ${Object.keys(manifest).length} файлов`)

  try {
    const form = new FormData()

    // Cloudflare Pages API требует манифест в формате:
    // { "/path/to/file": "sha256-hash", ... }
    // И ZIP архив с файлами

    // Добавляем манифест как JSON строку
    const manifestJson = JSON.stringify(manifest)
    form.append('manifest', manifestJson, {
      contentType: 'application/json',
    })

    // Добавляем ZIP архив
    const archiveStats = statSync(archivePath)
    form.append('file', createReadStream(archivePath), {
      filename: 'dist.zip',
      contentType: 'application/zip',
      knownLength: archiveStats.size,
    })

    console.log('   Отправляю запрос к Cloudflare Pages API...')
    console.log(`   Размер архива: ${(archiveStats.size / 1024 / 1024).toFixed(2)} MB`)

    const data = await cfRequest(`/pages/projects/${CF_PROJECT_NAME}/deployments`, {
      method: 'POST',
      headers: form.getHeaders(),
      body: form,
    })

    // Удаляем архив после успешного деплоя
    unlinkSync(archivePath)

    const deployment = data.result
    const deploymentId = deployment.id
    const url =
      deployment.url ||
      deployment.deployment_trigger?.metadata?.branch_url ||
      `https://${CF_PROJECT_NAME.toLowerCase()}.pages.dev`

    console.log(`✅ Деплой успешен!`)
    console.log(`🌐 URL деплоя: ${url}`)
    console.log(`📦 ID деплоя: ${deploymentId}`)

    return { deployment, url, deploymentId }
  } catch (error) {
    // Удаляем архив даже при ошибке
    if (existsSync(archivePath)) {
      unlinkSync(archivePath)
    }
    throw error
  }
}

/**
 * Устанавливает деплой как production
 */
async function setProductionDeployment(deploymentId) {
  console.log('🎯 Устанавливаю новый деплой как production...')

  try {
    const data = await cfRequest(
      `/pages/projects/${CF_PROJECT_NAME}/deployments/${deploymentId}/retry`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          environment: 'production',
        }),
      }
    )

    console.log('✅ Production деплой обновлен')
    return data.result
  } catch (error) {
    // Пытаемся через другой endpoint
    try {
      await cfRequest(`/pages/projects/${CF_PROJECT_NAME}/deployments/${deploymentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stage: 'production',
        }),
      })
      console.log('✅ Production деплой обновлен')
    } catch (error2) {
      console.warn('⚠️ Не удалось автоматически установить production деплой')
      console.warn('   Это нормально - Cloudflare Pages автоматически использует последний деплой')
      console.warn('   Если нужно обновить вручную:')
      console.warn(`   1. Откройте https://dash.cloudflare.com → Pages → ${CF_PROJECT_NAME}`)
      console.warn(`   2. Найдите деплой ${deploymentId.substring(0, 8)}...`)
      console.warn('   3. Нажмите "..." → "Retry deployment" или установите как production')
    }
  }
}

/**
 * Удаляет старые деплои (кроме последнего активного)
 */
async function cleanupOldDeployments() {
  console.log('🧹 Проверяю старые деплои...')

  try {
    const data = await cfRequest(`/pages/projects/${CF_PROJECT_NAME}/deployments`)
    const deployments = data.result || []

    if (deployments.length <= 1) {
      console.log('✅ Старых деплоев нет')
      return
    }

    // Сортируем по дате создания (новые первыми)
    const sorted = deployments.sort((a, b) => new Date(b.created_on) - new Date(a.created_on))

    // Фильтруем: оставляем первый (самый новый) и production деплои, удаляем остальные
    const toDelete = sorted
      .slice(1)
      .filter(d => d.stage !== 'production' && d.environment !== 'production')

    if (toDelete.length === 0) {
      console.log('✅ Нет старых деплоев для удаления (все активные или production)')
      return
    }

    console.log(`🗑 Удаляю ${toDelete.length} старых деплоев...`)

    for (const deployment of toDelete) {
      try {
        await cfRequest(`/pages/projects/${CF_PROJECT_NAME}/deployments/${deployment.id}`, {
          method: 'DELETE',
        })
        console.log(`   ✅ Удалён деплой: ${deployment.id.substring(0, 8)}...`)
      } catch (error) {
        // Игнорируем ошибки об активном production деплое
        if (error.message.includes('active production') || error.message.includes('8000034')) {
          console.log(
            `   ⏭ Пропущен активный production деплой: ${deployment.id.substring(0, 8)}...`
          )
        } else {
          console.warn(
            `   ⚠️ Не удалось удалить деплой ${deployment.id.substring(0, 8)}...: ${error.message}`
          )
        }
      }
    }

    console.log('✅ Очистка старых деплоев завершена')
  } catch (error) {
    console.warn('⚠️ Не удалось очистить старые деплои:', error.message)
  }
}

/**
 * Включает Web Analytics для проекта
 */
async function enableWebAnalytics() {
  console.log('📊 Проверяю Web Analytics...')

  try {
    // Получаем информацию о проекте
    const projectData = await cfRequest(`/pages/projects/${CF_PROJECT_NAME}`)
    const project = projectData.result

    // Пытаемся получить информацию об аналитике
    try {
      const analyticsData = await cfRequest(`/pages/projects/${CF_PROJECT_NAME}/analytics`)
      console.log('✅ Web Analytics уже активна')
      console.log(`   Analytics ID: ${analyticsData.result?.id || 'N/A'}`)
      return analyticsData.result
    } catch (error) {
      if (error.message.includes('not found') || error.message.includes('404')) {
        console.log('⚠️ Web Analytics не активна')
        console.log('📝 Для включения аналитики вручную:')
        console.log('   1. Откройте https://dash.cloudflare.com')
        console.log('   2. Перейдите в Web Analytics → Add site')
        console.log('   3. Выберите проект: ' + CF_PROJECT_NAME)
        console.log('   4. Нажмите "Activate"')
        console.log('\n   Или включите через API (требуются дополнительные права)')
        return null
      }
      throw error
    }
  } catch (error) {
    console.warn('⚠️ Не удалось проверить Web Analytics:', error.message)
    return null
  }
}

// Основная логика
async function main() {
  try {
    console.log('🚀 Начинаю автоматический деплой на Cloudflare Pages...\n')

    // Шаг 1: Проверка dist/index.html
    console.log('📋 Шаг 1: Проверка dist/index.html')
    checkDistExists()
    console.log('')

    // Шаг 2: Проверка/создание проекта
    console.log('📋 Шаг 2: Проверка проекта Cloudflare Pages')
    await ensureProject()
    console.log('')

    // Шаг 3: Деплой
    console.log('📋 Шаг 3: Деплой проекта')
    const { url, deploymentId } = await deployProject()
    console.log('')

    // Шаг 3.5: Установка как production
    console.log('📋 Шаг 3.5: Установка production деплоя')
    await setProductionDeployment(deploymentId)
    console.log('')

    // Шаг 4: Очистка старых деплоев
    console.log('📋 Шаг 4: Очистка старых деплоев')
    await cleanupOldDeployments()
    console.log('')

    // Шаг 5: Web Analytics
    console.log('📋 Шаг 5: Web Analytics')
    const analytics = await enableWebAnalytics()
    console.log('')

    // Итоговый результат
    console.log('═══════════════════════════════════════════════════════')
    console.log('✨ ДЕПЛОЙ ЗАВЕРШЕН УСПЕШНО!')
    console.log('═══════════════════════════════════════════════════════')
    console.log(`🌐 URL проекта: ${url}`)
    if (analytics) {
      console.log(`📊 Web Analytics: Активна (ID: ${analytics.id || 'N/A'})`)
    } else {
      console.log('📊 Web Analytics: Требуется ручное включение')
    }
    console.log('═══════════════════════════════════════════════════════')
  } catch (error) {
    console.error('\n❌ Ошибка при деплое:', error.message)
    console.error('\nПроверьте:')
    console.error('1. Правильность CF_ACCOUNT_ID и CF_API_TOKEN в .env')
    console.error('2. Существование проекта Cloudflare Pages')
    console.error('3. Права API токена')
    process.exit(1)
  }
}

main()
