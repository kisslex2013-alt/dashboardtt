/**
 * 🎓 Скрипт автоматического деплоя на Cloudflare Pages через Wrangler CLI
 *
 * Выполняет:
 * 1. Проверку наличия dist/index.html
 * 2. Создание/поиск проекта Cloudflare Pages
 * 3. Деплой dist на Cloudflare Pages через Wrangler
 * 4. Удаление старых деплоев (кроме последнего)
 * 5. Включение Web Analytics
 * 6. Проверку статуса аналитики
 */

import 'dotenv/config'
import { existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'
import fetch from 'node-fetch'

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
 * Проверяет существование проекта или создает новый
 */
async function ensureProject() {
  try {
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
      throw new Error('Проект не существует. Создайте его вручную или через API.')
    }
    throw error
  }
}

/**
 * Деплоит проект на Cloudflare Pages через Wrangler
 */
async function deployProject() {
  console.log('🚀 Начинаю деплой через Wrangler CLI...')

  try {
    // Устанавливаем переменные окружения для Wrangler
    process.env.CLOUDFLARE_ACCOUNT_ID = CF_ACCOUNT_ID
    process.env.CLOUDFLARE_API_TOKEN = CF_API_TOKEN

    // Используем Wrangler для деплоя
    const distPath = join(rootDir, 'dist')
    const command = `npx wrangler pages deploy "${distPath}" --project-name="${CF_PROJECT_NAME}" --branch=main`

    console.log('   Выполняю команду Wrangler...')
    const output = execSync(command, {
      cwd: rootDir,
      encoding: 'utf8',
      stdio: 'pipe',
      env: {
        ...process.env,
        CLOUDFLARE_ACCOUNT_ID: CF_ACCOUNT_ID,
        CLOUDFLARE_API_TOKEN: CF_API_TOKEN,
      },
    })

    console.log(output)

    // Парсим URL из вывода Wrangler
    const urlMatch = output.match(/https?:\/\/[^\s]+/)
    const deploymentUrl = urlMatch
      ? urlMatch[0]
      : `https://${CF_PROJECT_NAME.toLowerCase()}.pages.dev`

    console.log(`✅ Деплой успешен!`)
    console.log(`🌐 URL деплоя: ${deploymentUrl}`)

    // Ждем немного, чтобы деплой обработался
    console.log('   Ожидаю обработку деплоя...')
    await new Promise(resolve => setTimeout(resolve, 3000))

    // Получаем информацию о деплое
    const deploymentsData = await cfRequest(`/pages/projects/${CF_PROJECT_NAME}/deployments`)
    const deployments = deploymentsData.result || []
    const latestDeployment = deployments[0] // Самый новый

    if (latestDeployment) {
      console.log(`📦 ID деплоя: ${latestDeployment.id.substring(0, 8)}...`)
    }

    return {
      deployment: latestDeployment,
      url: deploymentUrl,
      productionUrl: `https://${CF_PROJECT_NAME.toLowerCase()}.pages.dev`,
      deploymentId: latestDeployment?.id,
    }
  } catch (error) {
    console.error('❌ Ошибка деплоя через Wrangler:', error.message)
    if (error.stdout) console.error('STDOUT:', error.stdout)
    if (error.stderr) console.error('STDERR:', error.stderr)
    throw error
  }
}

/**
 * Устанавливает деплой как production
 */
async function setProductionDeployment(deploymentId) {
  if (!deploymentId) {
    console.log('⚠️ ID деплоя не найден, пропускаю установку production')
    return
  }

  console.log('🎯 Устанавливаю новый деплой как production...')

  try {
    // Cloudflare Pages автоматически использует последний деплой как production
    // Но можно попробовать установить явно
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
  } catch (error) {
    console.log('⚠️ Не удалось автоматически установить production деплой')
    console.log('   Cloudflare Pages автоматически использует последний деплой')
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

    // Фильтруем: оставляем первый (самый новый) и production деплои
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
    const projectData = await cfRequest(`/pages/projects/${CF_PROJECT_NAME}`)
    const project = projectData.result

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

    // Шаг 3: Деплой через Wrangler
    console.log('📋 Шаг 3: Деплой проекта через Wrangler')
    const { url, productionUrl, deploymentId } = await deployProject()
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
    console.log(`🌐 URL деплоя: ${url}`)
    console.log(`🌍 Production URL: ${productionUrl}`)
    console.log('')
    console.log('💡 Примечание:')
    console.log('   Cloudflare Pages автоматически обновит production через несколько секунд.')
    console.log('   Если нужно обновить вручную:')
    console.log('   1. Откройте https://dash.cloudflare.com → Pages → dashboardtt')
    console.log('   2. Найдите новый деплой и установите его как production')
    console.log('')
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
    console.error('4. Установлен ли Wrangler: npm install -D wrangler')
    process.exit(1)
  }
}

main()
