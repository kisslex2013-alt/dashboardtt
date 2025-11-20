/**
 * 🎯 Панель настройки отображения уведомлений
 * 
 * Позволяет пользователю настраивать, какие уведомления показывать
 * по категориям и типам (success, error, warning, info)
 */

import { useState, useCallback, useEffect, useMemo } from 'react'
import { useNotificationsSettings, useUpdateSettings } from '../../store/useSettingsStore'
import { Bell, CheckCircle, XCircle, AlertTriangle, Info, Check, X, Settings, Clock, ChevronDown, ChevronUp } from '../../utils/icons'
import type { NotificationDisplaySettings, NotificationConditions, NotificationFrequency } from '../../types'

interface CategoryConfig {
  key: keyof NotificationDisplaySettings['categories']
  label: string
  description: string
  icon?: any
}

const CATEGORIES: CategoryConfig[] = [
  { key: 'timer', label: 'Таймер', description: 'Уведомления о запуске/остановке таймера, Pomodoro' },
  { key: 'entries', label: 'Записи', description: 'Уведомления о добавлении, обновлении, удалении записей' },
  { key: 'categories', label: 'Категории', description: 'Уведомления об изменении категорий' },
  { key: 'exportImport', label: 'Экспорт/Импорт', description: 'Уведомления об экспорте и импорте данных' },
  { key: 'backups', label: 'Бэкапы', description: 'Уведомления о создании, восстановлении, удалении бэкапов' },
  { key: 'settings', label: 'Настройки', description: 'Уведомления о сохранении настроек' },
  { key: 'filters', label: 'Фильтры', description: 'Уведомления об изменении фильтров' },
  { key: 'actions', label: 'Действия', description: 'Уведомления об отмене/повторе действий, режимах' },
  { key: 'cleanup', label: 'Очистка', description: 'Уведомления об очистке базы данных' },
  { key: 'colors', label: 'Цвета', description: 'Уведомления об изменении цветов категорий' },
  { key: 'validation', label: 'Валидация', description: 'Уведомления об ошибках валидации (критичные)' },
  { key: 'overtime', label: 'Переработка', description: 'Предупреждения о переработке' },
  { key: 'breaks', label: 'Перерывы', description: 'Напоминания о перерывах' },
  { key: 'autoSync', label: 'Автосинхронизация', description: 'Уведомления об автосинхронизации' },
]

const TYPE_ICONS = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

const TYPE_LABELS = {
  success: 'Успех',
  error: 'Ошибка',
  warning: 'Предупреждение',
  info: 'Информация',
}

const TYPE_COLORS = {
  success: 'text-green-600 dark:text-green-400',
  error: 'text-red-600 dark:text-red-400',
  warning: 'text-orange-600 dark:text-orange-400',
  info: 'text-blue-600 dark:text-blue-400',
}

// Дефолтные настройки категорий
const getDefaultCategories = (): NotificationDisplaySettings['categories'] => ({
  timer: { enabled: true, types: { success: true, error: true, warning: true, info: true } },
  entries: { enabled: true, types: { success: true, error: true, warning: true, info: true } },
  categories: { enabled: true, types: { success: true, error: true, warning: true, info: true } },
  exportImport: { enabled: true, types: { success: true, error: true, warning: true, info: true } },
  backups: { enabled: true, types: { success: true, error: true, warning: true, info: true } },
  settings: { enabled: true, types: { success: true, error: true, warning: true, info: true } },
  filters: { enabled: true, types: { success: true, error: true, warning: true, info: true } },
  actions: { enabled: true, types: { success: true, error: true, warning: true, info: true } },
  cleanup: { enabled: true, types: { success: true, error: true, warning: true, info: true } },
  colors: { enabled: true, types: { success: true, error: true, warning: true, info: true } },
  validation: { enabled: true, types: { success: false, error: true, warning: true, info: false } },
  overtime: { 
    enabled: true, 
    types: { success: false, error: false, warning: true, info: false },
    conditions: {
      threshold: 1.0,
      criticalThreshold: 1.5,
      onlyWorkDays: false,
    },
    frequency: {
      showOncePerDay: true,
      minInterval: 60,
    },
  },
  breaks: { 
    enabled: true, 
    types: { success: false, error: false, warning: true, info: true },
    conditions: {
      minDurationMinutes: 0,
      onlyActiveWork: true,
    },
    frequency: {
      showEveryXHours: 2,
      minInterval: 30,
    },
  },
  autoSync: { enabled: true, types: { success: true, error: true, warning: false, info: true } },
})

export function NotificationsDisplaySettingsPanel() {
  const notifications = useNotificationsSettings()
  const updateSettings = useUpdateSettings()
  
  // Инициализируем настройки с дефолтными категориями, если их нет
  const displaySettings = useMemo(() => {
    if (!notifications.display) {
      return {
        enabled: true,
        categories: getDefaultCategories(),
      }
    }
    
    // Убеждаемся, что все категории инициализированы
    const defaultCategories = getDefaultCategories()
    const categories = { ...defaultCategories }
    
    // Заполняем существующие категории из store
    Object.keys(defaultCategories).forEach(key => {
      if (notifications.display?.categories?.[key]) {
        categories[key] = notifications.display.categories[key]
      }
    })
    
    return {
      enabled: notifications.display.enabled ?? true,
      categories,
    }
  }, [notifications.display])

  const [localSettings, setLocalSettings] = useState(displaySettings)

  // Синхронизируем с store при изменении
  useEffect(() => {
    setLocalSettings(displaySettings)
  }, [displaySettings])

  // Инициализируем категории в store, если их нет
  useEffect(() => {
    if (!notifications.display || Object.keys(notifications.display.categories || {}).length === 0) {
      updateSettings({
        notifications: {
          ...notifications,
          display: displaySettings,
        },
      })
    }
  }, [notifications, displaySettings, updateSettings]) // Зависимости для правильной инициализации

  const handleToggleGlobal = useCallback(() => {
    const newSettings = {
      ...localSettings,
      enabled: !localSettings.enabled,
    }
    setLocalSettings(newSettings)
    updateSettings({
      notifications: {
        ...notifications,
        display: newSettings,
      },
    })
  }, [localSettings, notifications, updateSettings])

  const handleToggleCategory = useCallback((categoryKey: keyof NotificationDisplaySettings['categories']) => {
    const category = localSettings.categories[categoryKey]
    if (!category) return

    const newSettings = {
      ...localSettings,
      categories: {
        ...localSettings.categories,
        [categoryKey]: {
          ...category,
          enabled: !category.enabled,
        },
      },
    }
    setLocalSettings(newSettings)
    updateSettings({
      notifications: {
        ...notifications,
        display: newSettings,
      },
    })
  }, [localSettings, notifications, updateSettings])

  const handleToggleType = useCallback((
    categoryKey: keyof NotificationDisplaySettings['categories'],
    type: 'success' | 'error' | 'warning' | 'info'
  ) => {
    const category = localSettings.categories[categoryKey]
    if (!category) return

    const newSettings = {
      ...localSettings,
      categories: {
        ...localSettings.categories,
        [categoryKey]: {
          ...category,
          types: {
            ...category.types,
            [type]: !category.types[type],
          },
        },
      },
    }
    setLocalSettings(newSettings)
    updateSettings({
      notifications: {
        ...notifications,
        display: newSettings,
      },
    })
  }, [localSettings, notifications, updateSettings])

  return (
    <div className="space-y-6">
      {/* Общий переключатель */}
      <div className="glass-effect rounded-xl p-4 border-2 border-gray-300 dark:border-gray-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Уведомления</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Включить/выключить все уведомления
              </p>
            </div>
          </div>
          <button
            onClick={handleToggleGlobal}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              localSettings.enabled
                ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                : 'bg-gray-500/20 text-gray-600 dark:text-gray-400'
            }`}
          >
            {localSettings.enabled ? (
              <>
                <Check className="w-5 h-5" />
                <span className="font-medium">ВКЛ</span>
              </>
            ) : (
              <>
                <X className="w-5 h-5" />
                <span className="font-medium">ВЫКЛ</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Категории */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Категории уведомлений</h3>
        {CATEGORIES.map(category => {
          // Используем настройки из localSettings или дефолтные значения
          const categorySettings = localSettings.categories?.[category.key] || getDefaultCategories()[category.key]
          if (!categorySettings) return null

          const isCategoryEnabled = categorySettings.enabled && localSettings.enabled

          return (
            <div
              key={category.key}
              className="glass-effect rounded-xl p-4 border-2 border-gray-300 dark:border-gray-600"
            >
              {/* Заголовок категории */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {category.icon && <category.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">{category.label}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{category.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggleCategory(category.key)}
                  disabled={!localSettings.enabled}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                    isCategoryEnabled
                      ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                      : 'bg-gray-500/20 text-gray-600 dark:text-gray-400'
                  } ${!localSettings.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isCategoryEnabled ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span className="text-sm font-medium">ВКЛ</span>
                    </>
                  ) : (
                    <>
                      <X className="w-4 h-4" />
                      <span className="text-sm font-medium">ВЫКЛ</span>
                    </>
                  )}
                </button>
              </div>

              {/* Типы уведомлений */}
              {isCategoryEnabled && (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
                    {(Object.keys(categorySettings.types) as Array<keyof typeof categorySettings.types>).map(type => {
                      const Icon = TYPE_ICONS[type]
                      const isTypeEnabled = categorySettings.types[type]

                      return (
                        <button
                          key={type}
                          onClick={() => handleToggleType(category.key, type)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                            isTypeEnabled
                              ? `${TYPE_COLORS[type]} bg-opacity-10`
                              : 'bg-gray-200/50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="text-sm font-medium">{TYPE_LABELS[type]}</span>
                        </button>
                      )
                    })}
                  </div>

                  {/* Детальные настройки для категорий, которые их поддерживают */}
                  {(category.key === 'overtime' || category.key === 'breaks' || category.key === 'timer' || category.key === 'entries') && (
                    <CategoryAdvancedSettings
                      categoryKey={category.key}
                      categorySettings={categorySettings}
                      localSettings={localSettings}
                      onUpdate={(updatedCategory) => {
                        const newSettings = {
                          ...localSettings,
                          categories: {
                            ...localSettings.categories,
                            [category.key]: updatedCategory,
                          },
                        }
                        setLocalSettings(newSettings)
                        updateSettings({
                          notifications: {
                            ...notifications,
                            display: newSettings,
                          },
                        })
                      }}
                    />
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Компонент для детальных настроек категории
 */
function CategoryAdvancedSettings({
  categoryKey,
  categorySettings,
  localSettings,
  onUpdate,
}: {
  categoryKey: keyof NotificationDisplaySettings['categories']
  categorySettings: NotificationDisplaySettings['categories'][typeof categoryKey]
  localSettings: NotificationDisplaySettings
  onUpdate: (updated: NotificationDisplaySettings['categories'][typeof categoryKey]) => void
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const conditions = categorySettings.conditions || {}
  const frequency = categorySettings.frequency || {}

  const handleConditionChange = useCallback((key: keyof NotificationConditions, value: any) => {
    onUpdate({
      ...categorySettings,
      conditions: {
        ...conditions,
        [key]: value,
      },
    })
  }, [categorySettings, conditions, onUpdate])

  const handleFrequencyChange = useCallback((key: keyof NotificationFrequency, value: any) => {
    onUpdate({
      ...categorySettings,
      frequency: {
        ...frequency,
        [key]: value,
      },
    })
  }, [categorySettings, frequency, onUpdate])

  // Специфичные настройки для каждой категории
  const renderCategorySpecificSettings = () => {
    if (categoryKey === 'overtime') {
      return (
        <>
          <div className="space-y-3">
            <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Условия показа
            </h5>
            <div className="space-y-2 pl-6">
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700 dark:text-gray-300">Порог предупреждения (коэффициент)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="5"
                  value={conditions.threshold ?? 1.0}
                  onChange={(e) => handleConditionChange('threshold', parseFloat(e.target.value) || 1.0)}
                  className="w-20 px-2 py-1 rounded-lg bg-white/80 dark:bg-gray-800/80 border border-gray-300 dark:border-gray-600 text-sm"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700 dark:text-gray-300">Критический порог (коэффициент)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="5"
                  value={conditions.criticalThreshold ?? 1.5}
                  onChange={(e) => handleConditionChange('criticalThreshold', parseFloat(e.target.value) || 1.5)}
                  className="w-20 px-2 py-1 rounded-lg bg-white/80 dark:bg-gray-800/80 border border-gray-300 dark:border-gray-600 text-sm"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={conditions.onlyWorkDays ?? false}
                  onChange={(e) => handleConditionChange('onlyWorkDays', e.target.checked)}
                  className="rounded"
                />
                <span>Учитывать только рабочие дни</span>
              </label>
            </div>
          </div>

          <div className="space-y-3 mt-4">
            <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Частота показа
            </h5>
            <div className="space-y-2 pl-6">
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={frequency.showOncePerDay ?? true}
                  onChange={(e) => handleFrequencyChange('showOncePerDay', e.target.checked)}
                  className="rounded"
                />
                <span>Показывать только один раз в день</span>
              </label>
              {!frequency.showOncePerDay && (
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-700 dark:text-gray-300">Минимальный интервал (минуты)</label>
                  <input
                    type="number"
                    min="1"
                    max="1440"
                    value={frequency.minInterval ?? 60}
                    onChange={(e) => handleFrequencyChange('minInterval', parseInt(e.target.value) || 60)}
                    className="w-24 px-2 py-1 rounded-lg bg-white/80 dark:bg-gray-800/80 border border-gray-300 dark:border-gray-600 text-sm"
                  />
                </div>
              )}
            </div>
          </div>
        </>
      )
    }

    if (categoryKey === 'breaks') {
      return (
        <>
          <div className="space-y-3">
            <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Условия показа
            </h5>
            <div className="space-y-2 pl-6">
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700 dark:text-gray-300">Минимальная длительность работы (минуты)</label>
                <input
                  type="number"
                  min="0"
                  max="1440"
                  value={conditions.minDurationMinutes ?? 0}
                  onChange={(e) => handleConditionChange('minDurationMinutes', parseInt(e.target.value) || 0)}
                  className="w-24 px-2 py-1 rounded-lg bg-white/80 dark:bg-gray-800/80 border border-gray-300 dark:border-gray-600 text-sm"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={conditions.onlyActiveWork ?? true}
                  onChange={(e) => handleConditionChange('onlyActiveWork', e.target.checked)}
                  className="rounded"
                />
                <span>Только активная работа (таймер запущен)</span>
              </label>
            </div>
          </div>

          <div className="space-y-3 mt-4">
            <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Частота показа
            </h5>
            <div className="space-y-2 pl-6">
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700 dark:text-gray-300">Показывать каждые (часы)</label>
                <input
                  type="number"
                  min="0.5"
                  max="24"
                  step="0.5"
                  value={frequency.showEveryXHours ?? 2}
                  onChange={(e) => handleFrequencyChange('showEveryXHours', parseFloat(e.target.value) || 2)}
                  className="w-24 px-2 py-1 rounded-lg bg-white/80 dark:bg-gray-800/80 border border-gray-300 dark:border-gray-600 text-sm"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700 dark:text-gray-300">Минимальный интервал (минуты)</label>
                <input
                  type="number"
                  min="1"
                  max="1440"
                  value={frequency.minInterval ?? 30}
                  onChange={(e) => handleFrequencyChange('minInterval', parseInt(e.target.value) || 30)}
                  className="w-24 px-2 py-1 rounded-lg bg-white/80 dark:bg-gray-800/80 border border-gray-300 dark:border-gray-600 text-sm"
                />
              </div>
            </div>
          </div>
        </>
      )
    }

    if (categoryKey === 'timer') {
      return (
        <div className="space-y-3">
          <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Условия показа
          </h5>
          <div className="space-y-2 pl-6">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={conditions.showOnStart ?? true}
                onChange={(e) => handleConditionChange('showOnStart', e.target.checked)}
                className="rounded"
              />
              <span>Показывать при запуске</span>
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={conditions.showOnStop ?? true}
                onChange={(e) => handleConditionChange('showOnStop', e.target.checked)}
                className="rounded"
              />
              <span>Показывать при остановке</span>
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={conditions.showOnPause ?? false}
                onChange={(e) => handleConditionChange('showOnPause', e.target.checked)}
                className="rounded"
              />
              <span>Показывать при паузе</span>
            </label>
            <div className="flex items-center justify-between mt-2">
              <label className="text-sm text-gray-700 dark:text-gray-300">Минимальная длительность для показа (минуты)</label>
              <input
                type="number"
                min="0"
                max="1440"
                value={conditions.minDurationMinutes ?? 0}
                onChange={(e) => handleConditionChange('minDurationMinutes', parseInt(e.target.value) || 0)}
                className="w-24 px-2 py-1 rounded-lg bg-white/80 dark:bg-gray-800/80 border border-gray-300 dark:border-gray-600 text-sm"
              />
            </div>
          </div>
        </div>
      )
    }

    if (categoryKey === 'entries') {
      return (
        <div className="space-y-3">
          <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Условия показа
          </h5>
          <div className="space-y-2 pl-6">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={conditions.showOnSuccess ?? true}
                onChange={(e) => handleConditionChange('showOnSuccess', e.target.checked)}
                className="rounded"
              />
              <span>Показывать при добавлении</span>
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={conditions.showOnUpdate ?? true}
                onChange={(e) => handleConditionChange('showOnUpdate', e.target.checked)}
                className="rounded"
              />
              <span>Показывать при обновлении</span>
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={conditions.showOnDelete ?? true}
                onChange={(e) => handleConditionChange('showOnDelete', e.target.checked)}
                className="rounded"
              />
              <span>Показывать при удалении</span>
            </label>
          </div>
        </div>
      )
    }

    return null
  }

  return (
    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
      >
        <span className="flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Детальные настройки
        </span>
        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-4 pl-6">
          {renderCategorySpecificSettings()}
        </div>
      )}
    </div>
  )
}

