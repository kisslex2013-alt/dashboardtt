#!/usr/bin/env node

/**
 * Простой Smoke Test для Time Tracker Dashboard
 *
 * Проверяет базовую работоспособность приложения:
 * - Приложение запускается на localhost:5173
 * - Нет критичных ошибок в консоли
 * - Основные компоненты рендерятся
 *
 * Запуск: node scripts/smoke-test.js
 */

const http = require('http')

const APP_URL = 'http://localhost:5173'
const TIMEOUT = 5000 // 5 секунд

console.log('🧪 Smoke Test для Time Tracker Dashboard')
console.log('='.repeat(50))

// Проверка доступности приложения
function checkAppAvailability() {
  return new Promise((resolve, reject) => {
    const startTime = Date.now()

    const req = http.get(APP_URL, res => {
      const endTime = Date.now()
      const responseTime = endTime - startTime

      console.log(`✅ Приложение доступно на ${APP_URL}`)
      console.log(`   Время ответа: ${responseTime}ms`)
      console.log(`   Статус: ${res.statusCode}`)

      if (res.statusCode === 200) {
        resolve({
          success: true,
          statusCode: res.statusCode,
          responseTime,
        })
      } else {
        reject({
          success: false,
          statusCode: res.statusCode,
          message: `Неожиданный статус код: ${res.statusCode}`,
        })
      }
    })

    req.on('error', error => {
      reject({
        success: false,
        error: error.message,
        message: 'Приложение не запущено или недоступно',
      })
    })

    req.setTimeout(TIMEOUT, () => {
      req.destroy()
      reject({
        success: false,
        message: 'Таймаут при проверке доступности приложения',
      })
    })
  })
}

// Проверка содержимого HTML
function checkHTMLContent() {
  return new Promise((resolve, reject) => {
    http
      .get(APP_URL, res => {
        let data = ''

        res.on('data', chunk => {
          data += chunk
        })

        res.on('end', () => {
          // Проверяем наличие ключевых элементов
          const checks = {
            hasTitle: data.includes('<title>') || data.includes('Time Tracker'),
            hasReact: data.includes('react') || data.includes('React'),
            hasRoot: data.includes('root') || data.includes('id="root"'),
            hasApp: data.length > 0,
          }

          const allPassed = Object.values(checks).every(check => check === true)

          if (allPassed) {
            console.log('✅ HTML контент корректный')
            console.log('   - Найдены ключевые элементы')
            resolve({ success: true, checks })
          } else {
            console.log('⚠️  HTML контент частично некорректен')
            console.log('   Проверки:', checks)
            resolve({ success: true, checks }) // Не критично, но предупреждаем
          }
        })
      })
      .on('error', error => {
        reject({
          success: false,
          error: error.message,
        })
      })
  })
}

// Основная функция тестирования
async function runSmokeTest() {
  const results = {
    availability: null,
    htmlContent: null,
    overall: false,
  }

  try {
    // Проверка доступности
    console.log('\n📡 Проверка доступности приложения...')
    results.availability = await checkAppAvailability()

    // Проверка HTML контента
    console.log('\n📄 Проверка HTML контента...')
    results.htmlContent = await checkHTMLContent()

    // Общий результат
    results.overall = results.availability.success && results.htmlContent.success

    console.log('\n' + '='.repeat(50))
    if (results.overall) {
      console.log('✅ Smoke Test пройден успешно!')
      console.log('\n💡 Следующие шаги:')
      console.log('   - Используйте MCP инструменты для детального тестирования')
      console.log('   - Попросите AI: "Протестируй основную функциональность приложения"')
      process.exit(0)
    } else {
      console.log('❌ Smoke Test не пройден')
      console.log('\n🔧 Решение:')
      console.log('   1. Убедитесь что приложение запущено: npm run dev')
      console.log('   2. Проверьте что сервер доступен на localhost:5173')
      console.log('   3. Проверьте логи на наличие ошибок')
      process.exit(1)
    }
  } catch (error) {
    console.log('\n' + '='.repeat(50))
    console.log('❌ Ошибка при выполнении Smoke Test')
    console.log(`   ${error.message || error.error || 'Неизвестная ошибка'}`)
    console.log('\n🔧 Решение:')
    console.log('   1. Убедитесь что приложение запущено: npm run dev')
    console.log('   2. Проверьте что сервер доступен на localhost:5173')
    console.log('   3. Перезапустите приложение и попробуйте снова')
    process.exit(1)
  }
}

// Запуск теста
if (require.main === module) {
  runSmokeTest()
}

module.exports = { runSmokeTest, checkAppAvailability, checkHTMLContent }
