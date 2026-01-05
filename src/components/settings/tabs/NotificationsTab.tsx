/**
 * 🔔 NotificationsTab Component
 *
 * Вкладка настроек уведомлений (извлечена из SoundNotificationsSettingsModal).
 * Использует новые компоненты: SettingsCard, SoundSelector, SettingsSlider.
 */

import { Bell, Volume2, Coffee, AlertTriangle } from 'lucide-react'
import { SettingsCard, SettingsRow, SettingsDivider } from '../SettingsCard'
import { SoundSelector, DEFAULT_SOUND_OPTIONS } from '../SoundSelector'
import { OvertimeSlider } from '../SettingsSlider'

interface NotificationsTabProps {
  // Звуковые уведомления
  soundNotificationsEnabled: boolean
  setSoundNotificationsEnabled: (value: boolean) => void
  notificationSound: string
  setNotificationSound: (value: string) => void
  notificationInterval: number
  setNotificationInterval: (value: number) => void
  customIntervalMinutes: number | null
  setCustomIntervalMinutes: (value: number | null) => void

  // Напоминания о перерывах
  breakRemindersEnabled: boolean
  setBreakRemindersEnabled: (value: boolean) => void
  breakReminderInterval: number
  setBreakReminderInterval: (value: number) => void

  // Переработка
  overtimeAlertsEnabled: boolean
  setOvertimeAlertsEnabled: (value: boolean) => void
  overtimeWarningThreshold: number
  setOvertimeWarningThreshold: (value: number) => void
  overtimeCriticalThreshold: number
  setOvertimeCriticalThreshold: (value: number) => void
  overtimeSoundEnabled: boolean
  setOvertimeSoundEnabled: (value: boolean) => void
  dailyHours: number

  // Тесты
  onTestSound: (soundType: string) => void
  onTestBreakReminder: () => void
  onTestOvertimeAlert: (isCritical: boolean) => void
}

export function NotificationsTab({
  soundNotificationsEnabled,
  setSoundNotificationsEnabled,
  notificationSound,
  setNotificationSound,
  notificationInterval,
  setNotificationInterval,
  customIntervalMinutes,
  setCustomIntervalMinutes,
  breakRemindersEnabled,
  setBreakRemindersEnabled,
  breakReminderInterval,
  setBreakReminderInterval,
  overtimeAlertsEnabled,
  setOvertimeAlertsEnabled,
  overtimeWarningThreshold,
  setOvertimeWarningThreshold,
  overtimeCriticalThreshold,
  setOvertimeCriticalThreshold,
  overtimeSoundEnabled,
  setOvertimeSoundEnabled,
  dailyHours,
  onTestSound,
  onTestBreakReminder,
  onTestOvertimeAlert,
}: NotificationsTabProps) {

  // Интервалы для выпадающего списка
  const intervalOptions = [
    { value: 15, label: '15 минут' },
    { value: 30, label: '30 минут' },
    { value: 45, label: '45 минут' },
    { value: 60, label: '1 час' },
    { value: 120, label: '2 часа' },
    { value: -1, label: 'Кастомное' },
  ]

  const breakIntervalOptions = [
    { value: 1, label: 'Каждый час' },
    { value: 2, label: 'Каждые 2 часа' },
    { value: 3, label: 'Каждые 3 часа' },
    { value: 4, label: 'Каждые 4 часа' },
    { value: 6, label: 'Каждые 6 часов' },
  ]

  return (
    <div className="space-y-4">

      {/* Блок: Звуковые уведомления */}
      <SettingsCard
        title="Звуковые уведомления"
        description="Воспроизводить звук при уведомлениях"
        icon={Volume2}
        showToggle
        enabled={soundNotificationsEnabled}
        onToggle={setSoundNotificationsEnabled}
        collapseOnDisable
      >
        <div className="space-y-4">
          {/* Выбор звука */}
          <SettingsRow label="Звук уведомления">
            <div className="w-48">
              <SoundSelector
                value={notificationSound}
                onChange={setNotificationSound}
                options={DEFAULT_SOUND_OPTIONS}
                disabled={!soundNotificationsEnabled}
              />
            </div>
          </SettingsRow>

          {/* Интервал */}
          <SettingsRow label="Интервал">
            <div className="flex gap-2">
              <select
                value={notificationInterval === -1 ? 'custom' : notificationInterval}
                onChange={(e) => {
                  if (e.target.value === 'custom') {
                    setNotificationInterval(-1)
                    if (!customIntervalMinutes) setCustomIntervalMinutes(30)
                  } else {
                    setNotificationInterval(Number(e.target.value))
                    setCustomIntervalMinutes(null)
                  }
                }}
                disabled={!soundNotificationsEnabled}
                className="px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
              >
                {intervalOptions.map(opt => (
                  <option key={opt.value} value={opt.value === -1 ? 'custom' : opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              {notificationInterval === -1 && (
                <input
                  type="number"
                  min="1"
                  max="1440"
                  value={customIntervalMinutes || ''}
                  onChange={(e) => {
                    const val = parseInt(e.target.value)
                    if (val >= 1 && val <= 1440) setCustomIntervalMinutes(val)
                  }}
                  className="w-20 px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                  placeholder="мин"
                />
              )}
            </div>
          </SettingsRow>
        </div>
      </SettingsCard>

      {/* Блок: Напоминания о перерывах */}
      <SettingsCard
        title="Напоминания о перерывах"
        description="Напоминать делать перерыв после длительной работы"
        icon={Coffee}
        showToggle
        enabled={breakRemindersEnabled}
        onToggle={setBreakRemindersEnabled}
        collapseOnDisable
      >
        <div className="space-y-4">
          <SettingsRow label="Интервал">
            <div className="flex gap-2 items-center">
              <select
                value={breakReminderInterval}
                onChange={(e) => setBreakReminderInterval(parseInt(e.target.value))}
                disabled={!breakRemindersEnabled}
                className="px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
              >
                {breakIntervalOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <button
                onClick={onTestBreakReminder}
                disabled={!breakRemindersEnabled}
                className="px-3 py-2 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50"
              >
                Пример
              </button>
            </div>
          </SettingsRow>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            Напоминание появится после непрерывной работы указанное количество часов
          </p>
        </div>
      </SettingsCard>

      {/* Блок: Предупреждения о переработке */}
      <SettingsCard
        title="Предупреждения о переработке"
        description={`Предупреждать при превышении нормы (${dailyHours} ч/день)`}
        icon={AlertTriangle}
        showToggle
        enabled={overtimeAlertsEnabled}
        onToggle={setOvertimeAlertsEnabled}
        collapseOnDisable
      >
        <div className="space-y-6">
          {/* Порог предупреждения */}
          <OvertimeSlider
            label="Порог предупреждения"
            value={overtimeWarningThreshold * dailyHours}
            onChange={(val) => setOvertimeWarningThreshold(val / dailyHours)}
            min={dailyHours * 0.5}
            max={dailyHours * 2}
            description={`Предупреждение появится при превышении ${(overtimeWarningThreshold * dailyHours).toFixed(1)} часов работы за день`}
            disabled={!overtimeAlertsEnabled}
          />

          <SettingsDivider />

          {/* Критический порог */}
          <OvertimeSlider
            label="Критический порог"
            value={overtimeCriticalThreshold * dailyHours}
            onChange={(val) => setOvertimeCriticalThreshold(val / dailyHours)}
            min={dailyHours * 1}
            max={dailyHours * 3}
            description={`Критическое предупреждение появится при превышении ${(overtimeCriticalThreshold * dailyHours).toFixed(1)} часов работы за день`}
            disabled={!overtimeAlertsEnabled}
          />

          <SettingsDivider />

          {/* Звуковое оповещение */}
          <SettingsRow
            label="Звуковое уведомление"
            description="Воспроизводить звук при предупреждении о переработке"
          >
            <button
              type="button"
              onClick={() => setOvertimeSoundEnabled(!overtimeSoundEnabled)}
              disabled={!overtimeAlertsEnabled}
              className={`
                relative w-11 h-6 rounded-full transition-colors
                ${overtimeSoundEnabled && overtimeAlertsEnabled ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}
                ${!overtimeAlertsEnabled ? 'opacity-50' : ''}
              `}
            >
              <span
                className={`
                  absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm
                  ${overtimeSoundEnabled && overtimeAlertsEnabled ? 'translate-x-5' : 'translate-x-0'}
                `}
              />
            </button>
          </SettingsRow>

          {/* Кнопки тестов */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => onTestOvertimeAlert(false)}
              disabled={!overtimeAlertsEnabled}
              className="flex-1 px-3 py-2 text-xs font-medium rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-600 dark:text-orange-400 transition-colors disabled:opacity-50"
            >
              Пример предупреждения
            </button>
            <button
              onClick={() => onTestOvertimeAlert(true)}
              disabled={!overtimeAlertsEnabled}
              className="flex-1 px-3 py-2 text-xs font-medium rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-600 dark:text-red-400 transition-colors disabled:opacity-50"
            >
              Пример критического
            </button>
          </div>
        </div>
      </SettingsCard>
    </div>
  )
}
