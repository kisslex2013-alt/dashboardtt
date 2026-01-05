/**
 * 🤖 AISection Component
 *
 * Секция настроек AI-уведомлений.
 */

import { useState, useCallback } from 'react'
import { SettingsCard, SettingsRow } from '../../SettingsCard'
import { Toggle } from '../../../ui/Toggle'
import { BotMessageSquare, Trash2, RefreshCw, Settings, Megaphone, Bell, FlaskConical } from 'lucide-react'
import { useAINotificationsStore } from '../../../../store/useAINotificationsStore'
import { AINotificationService } from '../../../../services/aiNotificationService'
import type { NotificationType, NotificationPriority } from '../../../../types/aiNotifications'
import { BrowserPushService } from '../../../../services/browserPushService'
import { useAINotificationMonitor } from '../../../../hooks/useAINotificationMonitor'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'
import { allTypes, allPriorities } from './constants'

export function AISection() {
  const aiStore = useAINotificationsStore()
  const {
    enabled: aiEnabled,
    frequencyMode,
    showInInsights,
    showBrowserNotifications,
    showToasts,
    enableSounds: aiEnableSounds,
    enabledTypes,
    quietHours,
    testStats,
    addNotification,
    clearTestNotifications,
    updateTestStats,
    lastAnalyzed,
  } = aiStore

  // Локальное состояние для расширенного режима тестирования
  const [advancedTestType, setAdvancedTestType] = useState<NotificationType>('productivity-pattern')
  const [advancedTestPriority, setAdvancedTestPriority] = useState<NotificationPriority>('normal')
  const [advancedTestPush, setAdvancedTestPush] = useState(false)
  const [advancedTestToast, setAdvancedTestToast] = useState(true)
  const [advancedTestSound, setAdvancedTestSound] = useState(false)

  // Статус разрешений Browser Push
  const [pushPermission, setPushPermission] = useState<NotificationPermission>(
    BrowserPushService.getPermission()
  )

  // Хук для ручного запуска анализа
  const { triggerAnalysis } = useAINotificationMonitor()
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // Обработчик кнопки "Анализировать сейчас"
  const handleAnalyzeNow = useCallback(() => {
    setIsAnalyzing(true)
    triggerAnalysis()
    setTimeout(() => setIsAnalyzing(false), 3000)
  }, [triggerAnalysis])

  // Обработчики изменения настроек
  const handleFrequencyChange = (mode: 'minimal' | 'balanced' | 'maximum') => (e: React.MouseEvent) => {
    e.stopPropagation()
    useAINotificationsStore.setState({ frequencyMode: mode })
  }

  const handleQuietHoursStartChange = (value: string) => {
    useAINotificationsStore.setState({
      quietHours: {
        ...quietHours,
        start: value,
      },
    })
  }

  const handleQuietHoursEndChange = (value: string) => {
    useAINotificationsStore.setState({
      quietHours: {
        ...quietHours,
        end: value,
      },
    })
  }

  // Быстрые тесты
  const handleQuickTest = (type: NotificationType) => () => {
    const notification = AINotificationService.generateTestNotification(type)
    addNotification(notification)
    updateTestStats()
  }

  // Расширенный тест
  const handleAdvancedTest = () => {
    const notification = AINotificationService.generateAdvancedTest({
      type: advancedTestType,
      priority: advancedTestPriority,
      withBrowserPush: advancedTestPush,
      withToast: advancedTestToast,
      withSound: advancedTestSound,
    })
    addNotification(notification)
    updateTestStats()
  }

  // Массовый тест
  const handleBulkTest = (count: number) => () => {
    const notifications = AINotificationService.generateBulkTestNotifications(count)
    notifications.forEach((notification) => addNotification(notification))
    updateTestStats()
  }

  // Очистка тестовых
  const handleClearTests = () => {
    clearTestNotifications()
  }

  // Запрос разрешений Browser Push
  const handleRequestPushPermission = async () => {
    const result = await BrowserPushService.requestPermission()
    setPushPermission(result)
  }

  return (
    <SettingsCard
      title="AI-уведомления"
      description="Настройте интеллектуальные уведомления и подсказки"
      icon={BotMessageSquare}
      showToggle
      enabled={aiEnabled}
      onToggle={(checked) => useAINotificationsStore.setState({ enabled: checked })}
      collapseOnDisable
    >
      <div className="space-y-4">
        {/* 1, 2 и 3. Настройки, Отображение, Типы (в три колонки) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">
          {/* 1. Настройки */}
          <div className="glass-effect rounded-xl p-3">
            <h3 className="text-xs font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5 text-gray-500" />
              Настройки
            </h3>

            <div className="space-y-2">
              {/* Тихие часы */}
              <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <span className="text-xs text-gray-700 dark:text-gray-300">Тихие часы</span>
                <Toggle
                  checked={quietHours.enabled}
                  onChange={(checked) => {
                    useAINotificationsStore.setState({
                      quietHours: { ...quietHours, enabled: checked },
                    })
                  }}
                  size="sm"
                />
              </div>

              {/* Частота */}
              <div className="p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <span className="text-xs text-gray-700 dark:text-gray-300 block mb-1.5">Частота</span>
                <div className="grid grid-cols-3 gap-1">
                  {(['minimal', 'balanced', 'maximum'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={handleFrequencyChange(mode)}
                      className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${
                        frequencyMode === mode
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      {mode === 'minimal' ? 'Мин' : mode === 'balanced' ? 'Сред' : 'Макс'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Анализ */}
              <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">
                  {lastAnalyzed ? (
                    <>Анализ: {formatDistanceToNow(new Date(lastAnalyzed), { addSuffix: true, locale: ru })}</>
                  ) : (
                    'Не выполнялся'
                  )}
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleAnalyzeNow() }}
                  disabled={isAnalyzing}
                  className={`px-2 py-1 rounded text-[10px] font-medium transition-all flex items-center gap-1 ${
                    isAnalyzing
                      ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-400'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  <RefreshCw className={`w-3 h-3 ${isAnalyzing ? 'animate-spin' : ''}`} />
                  {isAnalyzing ? '...' : 'Анализ'}
                </button>
              </div>
            </div>
          </div>

          {/* 2. Отображение */}
          <div className="glass-effect rounded-xl p-3">
            <h3 className="text-xs font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-1.5">
              <Megaphone className="w-3.5 h-3.5 text-gray-500" />
              Каналы
            </h3>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <span className="text-xs text-gray-700 dark:text-gray-300">В инсайтах</span>
                <Toggle
                  checked={showInInsights}
                  onChange={(checked) => useAINotificationsStore.setState({ showInInsights: checked })}
                  size="sm"
                />
              </div>

              <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <span className="text-xs text-gray-700 dark:text-gray-300">Browser Push</span>
                <Toggle
                  checked={showBrowserNotifications}
                  onChange={(checked) => useAINotificationsStore.setState({ showBrowserNotifications: checked })}
                  size="sm"
                />
              </div>

              <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <span className="text-xs text-gray-700 dark:text-gray-300">Toast</span>
                <Toggle
                  checked={showToasts}
                  onChange={(checked) => useAINotificationsStore.setState({ showToasts: checked })}
                  size="sm"
                />
              </div>

              <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <span className="text-xs text-gray-700 dark:text-gray-300">Звук</span>
                <Toggle
                  checked={aiEnableSounds}
                  onChange={(checked) => useAINotificationsStore.setState({ enableSounds: checked })}
                  size="sm"
                />
              </div>

              {/* Разрешения Browser Push */}
              {showBrowserNotifications && BrowserPushService.isSupported() && (
                <div className="p-2 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-600 dark:text-gray-400">
                      {pushPermission === 'granted' && '✅ Разрешено'}
                      {pushPermission === 'denied' && '❌ Отклонено'}
                      {pushPermission === 'default' && '⏳ Не запрошено'}
                    </span>
                    {pushPermission !== 'granted' && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleRequestPushPermission() }}
                        className="px-2 py-0.5 bg-blue-500 hover:bg-blue-600 text-white rounded text-[10px] font-medium"
                      >
                        Запросить
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 3. Типы уведомлений */}
          <div className="glass-effect rounded-xl p-3">
            <h3 className="text-xs font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-gray-500" />
              Типы
            </h3>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <span className="text-xs text-gray-700 dark:text-gray-300">Выгорание</span>
                <Toggle
                  checked={enabledTypes.burnoutWarning}
                  onChange={(checked) => useAINotificationsStore.setState({ enabledTypes: { ...enabledTypes, burnoutWarning: checked } })}
                  size="sm"
                />
              </div>

              <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <span className="text-xs text-gray-700 dark:text-gray-300">Паттерны</span>
                <Toggle
                  checked={enabledTypes.productivityPatterns}
                  onChange={(checked) => useAINotificationsStore.setState({ enabledTypes: { ...enabledTypes, productivityPatterns: checked } })}
                  size="sm"
                />
              </div>

              <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <span className="text-xs text-gray-700 dark:text-gray-300">Прогноз</span>
                <Toggle
                  checked={enabledTypes.monthlyForecast}
                  onChange={(checked) => useAINotificationsStore.setState({ enabledTypes: { ...enabledTypes, monthlyForecast: checked } })}
                  size="sm"
                />
              </div>

              <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <span className="text-xs text-gray-700 dark:text-gray-300">Категории</span>
                <Toggle
                  checked={enabledTypes.inefficientCategories}
                  onChange={(checked) => useAINotificationsStore.setState({ enabledTypes: { ...enabledTypes, inefficientCategories: checked } })}
                  size="sm"
                />
              </div>

              <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <span className="text-xs text-gray-700 dark:text-gray-300">Достижения</span>
                <Toggle
                  checked={enabledTypes.achievements}
                  onChange={(checked) => useAINotificationsStore.setState({ enabledTypes: { ...enabledTypes, achievements: checked } })}
                  size="sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 4. Режим тестирования */}
        <div className="border border-purple-200 dark:border-purple-800 rounded-xl p-3 bg-purple-50 dark:bg-purple-900/10">
          <h3 className="text-xs font-bold text-purple-900 dark:text-purple-300 mb-3 flex items-center gap-1.5">
            <FlaskConical className="w-3.5 h-3.5" />
            Тестирование
          </h3>

          {/* Быстрые тесты */}
          <div className="mb-3">
            <div className="grid grid-cols-3 md:grid-cols-6 gap-1">
              <button type="button" onClick={handleQuickTest('burnout-warning')} className="px-2 py-1 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 rounded text-[10px] font-medium">Выгор.</button>
              <button type="button" onClick={handleQuickTest('goal-risk')} className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300 rounded text-[10px] font-medium">Риск</button>
              <button type="button" onClick={handleQuickTest('monthly-forecast')} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded text-[10px] font-medium">Прогноз</button>
              <button type="button" onClick={handleQuickTest('productivity-pattern')} className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded text-[10px] font-medium">Паттерн</button>
              <button type="button" onClick={handleQuickTest('achievement')} className="px-2 py-1 bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 text-green-700 dark:text-green-300 rounded text-[10px] font-medium">Достиж.</button>
              <button type="button" onClick={handleQuickTest('anomaly')} className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 hover:bg-orange-200 dark:hover:bg-orange-900/50 text-orange-700 dark:text-orange-300 rounded text-[10px] font-medium">Аномал.</button>
            </div>
          </div>

          {/* Расширенный + Массовый в две колонки */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
            {/* Расширенный */}
            <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">
              <div className="grid grid-cols-2 gap-1.5 mb-2">
                <select
                  value={advancedTestType}
                  onChange={(e) => setAdvancedTestType(e.target.value as NotificationType)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full px-1.5 py-1 text-[10px] border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                >
                  {allTypes.map((type) => (<option key={type.value} value={type.value}>{type.label}</option>))}
                </select>
                <select
                  value={advancedTestPriority}
                  onChange={(e) => setAdvancedTestPriority(e.target.value as NotificationPriority)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full px-1.5 py-1 text-[10px] border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                >
                  {allPriorities.map((p) => (<option key={p.value} value={p.value}>{p.label}</option>))}
                </select>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center gap-1 text-[10px] text-gray-700 dark:text-gray-300"><Toggle checked={advancedTestPush} onChange={setAdvancedTestPush} size="sm" /><span>Push</span></div>
                <div className="flex items-center gap-1 text-[10px] text-gray-700 dark:text-gray-300"><Toggle checked={advancedTestToast} onChange={setAdvancedTestToast} size="sm" /><span>Toast</span></div>
                <div className="flex items-center gap-1 text-[10px] text-gray-700 dark:text-gray-300"><Toggle checked={advancedTestSound} onChange={setAdvancedTestSound} size="sm" /><span>Звук</span></div>
              </div>
              <button type="button" onClick={handleAdvancedTest} className="w-full px-2 py-1 bg-purple-500 hover:bg-purple-600 text-white rounded text-[10px] font-medium">Создать</button>
            </div>

            {/* Массовый */}
            <div className="p-2 bg-white dark:bg-gray-800 rounded-lg flex flex-col justify-between">
              <div className="flex gap-1 mb-2">
                <button type="button" onClick={handleBulkTest(3)} className="flex-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-[10px] font-medium">×3</button>
                <button type="button" onClick={handleBulkTest(5)} className="flex-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-[10px] font-medium">×5</button>
                <button type="button" onClick={handleBulkTest(10)} className="flex-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-[10px] font-medium">×10</button>
              </div>
              {testStats.currentCount > 0 && (
                <button type="button" onClick={(e) => { e.stopPropagation(); handleClearTests() }} className="w-full flex items-center justify-center gap-1 px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-[10px] font-medium">
                  <Trash2 className="w-3 h-3" />Очистить ({testStats.currentCount})
                </button>
              )}
              {testStats.totalCreated > 0 && !testStats.currentCount && (
                <p className="text-[10px] text-purple-600 dark:text-purple-400 text-center">Создано: {testStats.totalCreated}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </SettingsCard>
  )
}
