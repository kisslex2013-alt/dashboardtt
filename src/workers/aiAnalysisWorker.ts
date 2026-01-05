/**
 * 🧠 Web Worker для AI-анализа
 *
 * Выполняет тяжелый анализ данных в фоновом потоке,
 * чтобы не блокировать интерфейс.
 */

import {
  analyzeBurnoutRisk,
  analyzeGoalProgress,
  generateMonthlyForecast,
  analyzeProductivityPatterns,
  analyzeEfficiency,
  detectAnomalies,
  detectAchievements,
  analyzeMonthSummary,
} from '../services/aiNotificationAnalyzer'
import type { TimeEntry, Category } from '../types'

// Типы сообщений
type WorkerMessage = {
  type: 'ANALYZE'
  entries: TimeEntry[]
  monthlyGoal: number
  categories: Category[]
}

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const { entries, monthlyGoal, categories } = e.data

  try {
    // Выполняем все анализы
    console.log('[AI Worker] Starting analysis with', entries.length, 'entries, monthlyGoal:', monthlyGoal)
    const start = performance.now()

    const burnoutData = analyzeBurnoutRisk(entries)
    console.log('[AI Worker] Burnout:', burnoutData ? '✅ Risk detected' : '❌ No risk')

    const goalRiskData = analyzeGoalProgress(entries, monthlyGoal)
    console.log('[AI Worker] Goal Risk:', goalRiskData ? '✅ Risk detected' : '❌ On track')

    const forecastData = generateMonthlyForecast(entries, monthlyGoal)
    console.log('[AI Worker] Forecast:', forecastData ? `✅ ${forecastData.forecast}/${forecastData.goalAmount}` : '❌ No data')

    const productivityData = analyzeProductivityPatterns(entries)
    console.log('[AI Worker] Productivity:', productivityData ? '✅ Pattern found' : '❌ No pattern')

    const efficiencyData = analyzeEfficiency(entries, categories)
    console.log('[AI Worker] Efficiency:', efficiencyData ? '✅ Issue found' : '❌ OK')

    const anomalyData = detectAnomalies(entries)
    console.log('[AI Worker] Anomaly:', anomalyData ? '✅ Detected' : '❌ None')

    const achievementData = detectAchievements(entries, monthlyGoal)
    console.log('[AI Worker] Achievement:', achievementData ? `✅ ${achievementData.type}` : '❌ None')

    const monthSummaryData = analyzeMonthSummary(entries, monthlyGoal)
    console.log('[AI Worker] Month Summary:', monthSummaryData ? `✅ ${monthSummaryData.percentComplete}% (${monthSummaryData.status})` : '❌ Not end of month')

    const end = performance.now()
    console.log(`[AI Worker] Analysis completed in ${(end - start).toFixed(2)}ms`)

    // Отправляем результаты обратно
    self.postMessage({
      success: true,
      data: {
        burnoutData,
        goalRiskData,
        forecastData,
        productivityData,
        efficiencyData,
        anomalyData,
        achievementData,
        monthSummaryData,
        timestamp: new Date().toISOString()
      },
    })
  } catch (error) {
    console.error('[AI Worker] Analysis failed:', error)
    self.postMessage({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

export {}
