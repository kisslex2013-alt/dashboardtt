/**
 * ⚙️ Модалка настроек AI-уведомлений
 *
 * Секции:
 * 1. Общие настройки (вкл/выкл, режим частоты)
 * 2. Способы отображения (insights/toast/push/sounds)
 * 3. Типы уведомлений (чекбоксы)
 * 4. Тихие часы
 * 5. Режим тестирования (быстрые тесты, расширенный, массовый)
 */

import { useState, useCallback } from 'react'
import { BaseModal } from '../ui/BaseModal'
import { Toggle } from '../ui/Toggle'
import { Settings, Zap, Bell, Volume2, Moon, TestTube, Trash2, RefreshCw } from '../../utils/icons'
import { useAINotificationsStore } from '../../store/useAINotificationsStore'
import { AINotificationService } from '../../services/aiNotificationService'
import { BrowserPushService } from '../../services/browserPushService'
import { useAINotificationMonitor } from '../../hooks/useAINotificationMonitor'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'
import type { NotificationType, NotificationPriority } from '../../types/aiNotifications'

interface AINotificationsSettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AINotificationsSettingsModal({
  isOpen,
  onClose,
}: AINotificationsSettingsModalProps) {
  const store = useAINotificationsStore()
  const {
    enabled,
    frequencyMode,
    showInInsights,
    showBrowserNotifications,
    showToasts,
    enableSounds,
    enabledTypes,
    quietHours,
    testStats,
    addNotification,
    clearTestNotifications,
    updateTestStats,
    lastAnalyzed,
  } = store

  // Локальное состояние для расширенного режима тестирования
  const [advancedTestType, setAdvancedTestType] = useState<NotificationType>('productivity-pattern')
  const [advancedTestPriority, setAdvancedTestPriority] = useState<NotificationPriority>('normal')
  const [advancedTestPush, setAdvancedTestPush] = useState(false)
  const [advancedTestToast, setAdvancedTestToast] = useState(true)
  const [advancedTestSound, setAdvancedTestSound] = useState(false)

  // Хук для ручного запуска анализа
  const { triggerAnalysis } = useAINotificationMonitor()
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // Обработчик кнопки "Анализировать сейчас"
  const handleAnalyzeNow = useCallback(() => {
    setIsAnalyzing(true)
    triggerAnalysis()
    // Сбрасываем индикатор через 3 секунды
    setTimeout(() => setIsAnalyzing(false), 3000)
  }, [triggerAnalysis])

  // Статус разрешений Browser Push
  const [pushPermission, setPushPermission] = useState<NotificationPermission>(
    BrowserPushService.getPermission()
  )

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
  const handleQuickTest = (type: NotificationType) => (e: React.MouseEvent) => {
    e.stopPropagation()
    const notification = AINotificationService.generateTestNotification(type)
    addNotification(notification)
    updateTestStats()
  }

  // Расширенный тест
  const handleAdvancedTest = (e: React.MouseEvent) => {
    e.stopPropagation()
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
  const handleBulkTest = (count: number) => (e: React.MouseEvent) => {
    e.stopPropagation()
    const notifications = AINotificationService.generateBulkTestNotifications(count)
    notifications.forEach((n) => addNotification(n))
    updateTestStats()
  }

  // Очистка тестовых
  const handleClearTests = () => {
    if (confirm(`Удалить все тестовые уведомления (${testStats.currentCount} шт.)?`)) {
      clearTestNotifications()
    }
  }

  // Запрос разрешений на Browser Push
  const handleRequestPushPermission = async () => {
    const permission = await BrowserPushService.requestPermission()
    setPushPermission(permission)

    if (permission === 'granted') {
      alert('✅ Разрешение на уведомления получено!')
    } else if (permission === 'denied') {
      alert('❌ Разрешение на уведомления отклонено. Измените настройки браузера, чтобы разрешить уведомления.')
    }
  }

  const allTypes = AINotificationService.getAllTypes()
  const allPriorities = AINotificationService.getAllPriorities()

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Настройки AI-уведомлений"
      titleIcon={Settings}
      size="medium"
      closeOnOverlayClick={false}
    >
      <div className="space-y-6" onClick={(e) => e.stopPropagation()}>
        {/* 1. Общие настройки */}
        <section className="glass-effect rounded-xl p-4">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Общие настройки
          </h3>

          {/* Включить AI */}
          <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Включить AI-уведомления
            </span>
            <Toggle
              checked={enabled}
              onChange={(checked) => {
                useAINotificationsStore.setState({ enabled: checked })
              }}
              size="sm"
            />
          </div>

          {/* Режим частоты */}
          <div className="mt-3">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Режим частоты уведомлений
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={handleFrequencyChange('minimal')}
                className={`
                  px-3 py-2 rounded-lg text-xs font-medium transition-all
                  ${
                    frequencyMode === 'minimal'
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }
                `}
              >
                Минимум
              </button>
              <button
                type="button"
                onClick={handleFrequencyChange('balanced')}
                className={`
                  px-3 py-2 rounded-lg text-xs font-medium transition-all
                  ${
                    frequencyMode === 'balanced'
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }
                `}
              >
                Баланс
              </button>
              <button
                type="button"
                onClick={handleFrequencyChange('maximum')}
                className={`
                  px-3 py-2 rounded-lg text-xs font-medium transition-all
                  ${
                    frequencyMode === 'maximum'
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }
                `}
              >
                Максимум
              </button>
            </div>
            
            {/* Индикатор последнего анализа и кнопка "Анализировать сейчас" */}
            {enabled && (
              <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {lastAnalyzed ? (
                      <>Последний анализ: <span className="font-medium text-gray-700 dark:text-gray-300">{formatDistanceToNow(new Date(lastAnalyzed), { addSuffix: true, locale: ru })}</span></>
                    ) : (
                      <>Анализ ещё не выполнялся</>
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={handleAnalyzeNow}
                    disabled={isAnalyzing}
                    className={`
                      flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                      ${isAnalyzing 
                        ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-400 cursor-not-allowed' 
                        : 'bg-blue-500 hover:bg-blue-600 text-white shadow-sm hover:shadow-md'
                      }
                    `}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
                    {isAnalyzing ? 'Анализ...' : 'Анализировать'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 2. Способы отображения */}
        <section className="glass-effect rounded-xl p-4">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Способы отображения
          </h3>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <span className="text-xs text-gray-900 dark:text-white">
                Показывать в блоке инсайтов
              </span>
              <Toggle
                checked={showInInsights}
                onChange={(checked) => {
                  useAINotificationsStore.setState({ showInInsights: checked })
                }}
                size="sm"
              />
            </div>

            <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <span className="text-xs text-gray-900 dark:text-white">
                Browser Push (только критические)
              </span>
              <Toggle
                checked={showBrowserNotifications}
                onChange={(checked) => {
                  useAINotificationsStore.setState({ showBrowserNotifications: checked })
                }}
                size="sm"
              />
            </div>

            <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <span className="text-xs text-gray-900 dark:text-white">
                Toast-уведомления
              </span>
              <Toggle
                checked={showToasts}
                onChange={(checked) => {
                  useAINotificationsStore.setState({ showToasts: checked })
                }}
                size="sm"
              />
            </div>

            <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <span className="text-xs text-gray-900 dark:text-white flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5" />
                Звуковые эффекты
              </span>
              <Toggle
                checked={enableSounds}
                onChange={(checked) => {
                  useAINotificationsStore.setState({ enableSounds: checked })
                }}
                size="sm"
              />
            </div>

            {/* Кнопка запроса разрешений Browser Push */}
            {showBrowserNotifications && BrowserPushService.isSupported() && (
              <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-900 dark:text-white mb-0.5">
                      Разрешения браузера
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {pushPermission === 'granted' && '✅ Разрешено'}
                      {pushPermission === 'denied' && '❌ Отклонено'}
                      {pushPermission === 'default' && '⏳ Не запрошено'}
                    </p>
                  </div>
                  {pushPermission !== 'granted' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRequestPushPermission()
                      }}
                      className="px-2.5 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-medium transition-colors"
                    >
                      Запросить
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 3. Типы уведомлений */}
        <section className="glass-effect rounded-xl p-4">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
            Типы уведомлений
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
            <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <span className="text-xs text-gray-900 dark:text-white">
                🔥 Предупреждения о выгорании
              </span>
              <Toggle
                checked={enabledTypes.burnoutWarning}
                onChange={(checked) => {
                  useAINotificationsStore.setState({
                    enabledTypes: {
                      ...enabledTypes,
                      burnoutWarning: checked,
                    },
                  })
                }}
                size="sm"
              />
            </div>

            <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <span className="text-xs text-gray-900 dark:text-white">
                💡 Паттерны продуктивности
              </span>
              <Toggle
                checked={enabledTypes.productivityPatterns}
                onChange={(checked) => {
                  useAINotificationsStore.setState({
                    enabledTypes: {
                      ...enabledTypes,
                      productivityPatterns: checked,
                    },
                  })
                }}
                size="sm"
              />
            </div>

            <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <span className="text-xs text-gray-900 dark:text-white">
                📊 Прогноз месяца
              </span>
              <Toggle
                checked={enabledTypes.monthlyForecast}
                onChange={(checked) => {
                  useAINotificationsStore.setState({
                    enabledTypes: {
                      ...enabledTypes,
                      monthlyForecast: checked,
                    },
                  })
                }}
                size="sm"
              />
            </div>

            <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <span className="text-xs text-gray-900 dark:text-white">
                ⏱️ Неэффективные категории
              </span>
              <Toggle
                checked={enabledTypes.inefficientCategories}
                onChange={(checked) => {
                  useAINotificationsStore.setState({
                    enabledTypes: {
                      ...enabledTypes,
                      inefficientCategories: checked,
                    },
                  })
                }}
                size="sm"
              />
            </div>

            <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <span className="text-xs text-gray-900 dark:text-white">
                🏆 Достижения
              </span>
              <Toggle
                checked={enabledTypes.achievements}
                onChange={(checked) => {
                  useAINotificationsStore.setState({
                    enabledTypes: {
                      ...enabledTypes,
                      achievements: checked,
                    },
                  })
                }}
                size="sm"
              />
            </div>
          </div>
        </section>

        {/* 4. Тихие часы */}
        <section className="glass-effect rounded-xl p-4">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Moon className="w-4 h-4" />
            Тихие часы
          </h3>

          <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors mb-2">
            <span className="text-xs font-medium text-gray-900 dark:text-white">
              Включить тихие часы
            </span>
            <Toggle
              checked={quietHours.enabled}
              onChange={(checked) => {
                useAINotificationsStore.setState({
                  quietHours: {
                    ...quietHours,
                    enabled: checked,
                  },
                })
              }}
              size="sm"
            />
          </div>

          {quietHours.enabled && (
            <div className="space-y-2 pl-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Начало
                  </label>
                  <input
                    type="time"
                    value={quietHours.start}
                    onChange={(e) => handleQuietHoursStartChange(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Конец
                  </label>
                  <input
                    type="time"
                    value={quietHours.end}
                    onChange={(e) => handleQuietHoursEndChange(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-900 dark:text-white">
                <Toggle
                  checked={quietHours.weekendsOnly}
                  onChange={(checked) => {
                    useAINotificationsStore.setState({
                      quietHours: {
                        ...quietHours,
                        weekendsOnly: checked,
                      },
                    })
                  }}
                  size="sm"
                />
                <span>Только по выходным</span>
              </div>
            </div>
          )}
        </section>

        {/* 5. Режим тестирования */}
        <section className="border border-purple-200 dark:border-purple-800 rounded-lg p-3 bg-purple-50 dark:bg-purple-900/10">
          <h3 className="text-base font-semibold text-purple-900 dark:text-purple-300 mb-3 flex items-center gap-2">
            <TestTube className="w-4 h-4" />
            Режим тестирования
          </h3>

          {/* Быстрые тесты */}
          <div className="mb-4">
            <h4 className="text-xs font-semibold text-gray-900 dark:text-white mb-2">
              Быстрые тесты
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={handleQuickTest('burnout-warning')}
                className="px-2 py-1.5 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 rounded text-xs font-medium transition-colors"
              >
                🔥 Выгорание
              </button>
              <button
                type="button"
                onClick={handleQuickTest('goal-risk')}
                className="px-2 py-1.5 bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300 rounded text-xs font-medium transition-colors"
              >
                ⚠️ Риск цели
              </button>
              <button
                type="button"
                onClick={handleQuickTest('monthly-forecast')}
                className="px-2 py-1.5 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded text-xs font-medium transition-colors"
              >
                📊 Прогноз
              </button>
              <button
                type="button"
                onClick={handleQuickTest('productivity-pattern')}
                className="px-2 py-1.5 bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded text-xs font-medium transition-colors"
              >
                💡 Паттерн
              </button>
              <button
                type="button"
                onClick={handleQuickTest('achievement')}
                className="px-2 py-1.5 bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 text-green-700 dark:text-green-300 rounded text-xs font-medium transition-colors"
              >
                🏆 Достижение
              </button>
              <button
                type="button"
                onClick={handleQuickTest('anomaly')}
                className="px-2 py-1.5 bg-orange-100 dark:bg-orange-900/30 hover:bg-orange-200 dark:hover:bg-orange-900/50 text-orange-700 dark:text-orange-300 rounded text-xs font-medium transition-colors"
              >
                🔍 Аномалия
              </button>
            </div>
          </div>

          {/* Расширенный режим */}
          <div className="mb-4 p-3 bg-white dark:bg-gray-800 rounded-lg">
            <h4 className="text-xs font-semibold text-gray-900 dark:text-white mb-2">
              Расширенный режим
            </h4>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Тип
                  </label>
                  <select
                    value={advancedTestType}
                    onChange={(e) => setAdvancedTestType(e.target.value as NotificationType)}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  >
                    {allTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Приоритет
                  </label>
                  <select
                    value={advancedTestPriority}
                    onChange={(e) => setAdvancedTestPriority(e.target.value as NotificationPriority)}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  >
                    {allPriorities.map((priority) => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-1.5 text-xs text-gray-900 dark:text-white">
                  <Toggle
                    checked={advancedTestPush}
                    onChange={(checked) => setAdvancedTestPush(checked)}
                    size="sm"
                  />
                  <span>Browser Push</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-900 dark:text-white">
                  <Toggle
                    checked={advancedTestToast}
                    onChange={(checked) => setAdvancedTestToast(checked)}
                    size="sm"
                  />
                  <span>Toast</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-900 dark:text-white">
                  <Toggle
                    checked={advancedTestSound}
                    onChange={(checked) => setAdvancedTestSound(checked)}
                    size="sm"
                  />
                  <span>Звук</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAdvancedTest}
                className="w-full px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-xs font-medium transition-colors"
              >
                Создать тест
              </button>
            </div>
          </div>

          {/* Массовый тест */}
          <div className="mb-4">
            <h4 className="text-xs font-semibold text-gray-900 dark:text-white mb-2">
              Массовый тест
            </h4>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={handleBulkTest(3)}
                className="flex-1 px-2.5 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-xs font-medium transition-colors"
              >
                Создать 3
              </button>
              <button
                type="button"
                onClick={handleBulkTest(5)}
                className="flex-1 px-2.5 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-xs font-medium transition-colors"
              >
                Создать 5
              </button>
              <button
                type="button"
                onClick={handleBulkTest(10)}
                className="flex-1 px-2.5 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-xs font-medium transition-colors"
              >
                Создать 10
              </button>
            </div>
          </div>

          {/* Управление и статистика */}
          <div className="space-y-2">
            {testStats.currentCount > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleClearTests()
                }}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-medium transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Очистить все тестовые ({testStats.currentCount})
              </button>
            )}

            {testStats.totalCreated > 0 && (
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <p className="text-xs text-purple-900 dark:text-purple-300">
                  <strong>Статистика:</strong> Создано тестовых: {testStats.totalCreated}, Текущих: {testStats.currentCount}
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </BaseModal>
  )
}
