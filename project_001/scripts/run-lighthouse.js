/**
 * ✅ PERFORMANCE: Скрипт для запуска Lighthouse тестов
 * 
 * Запускает Lighthouse анализ производительности с проверкой порогов
 */

import { launch } from 'chrome-launcher'
import lighthouse from 'lighthouse'

const URL = process.env.LHCI_URL || 'http://localhost:4173/'
const PORT = 9222

// ✅ ИСПРАВЛЕНО: Путь к Chrome (можно переопределить через CHROME_PATH)
const CHROME_PATH = process.env.CHROME_PATH || 'C:\\Portable\\Cent\\chrome.exe'

// Пороги для проверки
const THRESHOLDS = {
  performance: 90,
  accessibility: 90,
  'best-practices': 90,
  seo: 90,
  lcp: 2500, // ms
  fid: 100, // ms
  cls: 0.1,
  fcp: 2000, // ms
  tbt: 300, // ms
  si: 3000, // ms
}

async function runLighthouse() {
  console.log('🚀 Запуск Lighthouse анализа...')
  console.log(`📊 URL: ${URL}`)
  console.log(`🌐 Chrome: ${CHROME_PATH}`)

  // ✅ ИСПРАВЛЕНО: Указываем путь к Chrome вручную
  const chrome = await launch({
    chromeFlags: ['--headless', '--no-sandbox'],
    port: PORT,
    chromePath: CHROME_PATH,
  })

  try {
    const options = {
      logLevel: 'info',
      output: 'json',
      port: chrome.port,
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    }

    const runnerResult = await lighthouse(URL, options)
    const lhr = runnerResult.lhr

    // Выводим результаты
    console.log('\n📈 Результаты Lighthouse:\n')
    
    const categories = ['performance', 'accessibility', 'best-practices', 'seo']
    categories.forEach(category => {
      const score = lhr.categories[category]?.score * 100 || 0
      const emoji = score >= 90 ? '✅' : score >= 50 ? '⚠️' : '❌'
      console.log(`${emoji} ${category.toUpperCase()}: ${score.toFixed(1)}/100`)
    })

    // Проверяем пороги
    console.log('\n🔍 Проверка порогов (>90):\n')
    
    let allPassed = true
    categories.forEach(category => {
      const score = lhr.categories[category]?.score * 100 || 0
      const threshold = THRESHOLDS[category] || 90
      const passed = score >= threshold
      if (!passed) {
        allPassed = false
      }
      console.log(`${passed ? '✅' : '❌'} ${category}: ${score.toFixed(1)}/100 (порог: ${threshold}) ${passed ? 'PASS' : 'FAIL'}`)
    })

    // Core Web Vitals
    console.log('\n⚡ Core Web Vitals:\n')
    const lcp = lhr.audits['largest-contentful-paint']?.numericValue || 0
    const fid = lhr.audits['max-potential-fid']?.numericValue || 0
    const cls = lhr.audits['cumulative-layout-shift']?.numericValue || 0
    const fcp = lhr.audits['first-contentful-paint']?.numericValue || 0
    const tbt = lhr.audits['total-blocking-time']?.numericValue || 0
    const si = lhr.audits['speed-index']?.numericValue || 0

    const lcpPassed = lcp < THRESHOLDS.lcp
    const fidPassed = fid < THRESHOLDS.fid
    const clsPassed = cls < THRESHOLDS.cls
    const fcpPassed = fcp < THRESHOLDS.fcp
    const tbtPassed = tbt < THRESHOLDS.tbt
    const siPassed = si < THRESHOLDS.si

    if (!lcpPassed || !fidPassed || !clsPassed || !fcpPassed || !tbtPassed || !siPassed) {
      allPassed = false
    }

    console.log(`LCP: ${lcp.toFixed(0)}ms (порог: ${THRESHOLDS.lcp}ms) ${lcpPassed ? '✅' : '❌'}`)
    console.log(`FID: ${fid.toFixed(0)}ms (порог: ${THRESHOLDS.fid}ms) ${fidPassed ? '✅' : '❌'}`)
    console.log(`CLS: ${cls.toFixed(3)} (порог: ${THRESHOLDS.cls}) ${clsPassed ? '✅' : '❌'}`)
    console.log(`FCP: ${fcp.toFixed(0)}ms (порог: ${THRESHOLDS.fcp}ms) ${fcpPassed ? '✅' : '❌'}`)
    console.log(`TBT: ${tbt.toFixed(0)}ms (порог: ${THRESHOLDS.tbt}ms) ${tbtPassed ? '✅' : '❌'}`)
    console.log(`SI: ${si.toFixed(0)}ms (порог: ${THRESHOLDS.si}ms) ${siPassed ? '✅' : '❌'}`)

    if (!allPassed) {
      console.error('\n❌ Некоторые метрики не соответствуют порогам!')
      process.exit(1)
    } else {
      console.log('\n✅ Все метрики соответствуют порогам!')
      process.exit(0)
    }
  } catch (error) {
    console.error('❌ Ошибка при запуске Lighthouse:', error)
    process.exit(1)
  } finally {
    await chrome.kill()
  }
}

runLighthouse()

