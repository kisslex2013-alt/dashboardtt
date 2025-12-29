/**
 * 🍅 PomodoroSection Component
 *
 * Секция настроек Pomodoro таймера.
 */

import { Timer } from 'lucide-react'
import { SettingsCard, SettingsRow } from '../../SettingsCard'
import { Toggle } from '../../../ui/Toggle'

interface PomodoroSectionProps {
  enabled: boolean
  setEnabled: (value: boolean) => void
  autoStartBreaks: boolean
  setAutoStartBreaks: (value: boolean) => void
  autoStartWork: boolean
  setAutoStartWork: (value: boolean) => void
  soundOnComplete: boolean
  setSoundOnComplete: (value: boolean) => void
  showNotifications: boolean
  setShowNotifications: (value: boolean) => void
  onTestNotification: () => void
}

export function PomodoroSection({
  enabled,
  setEnabled,
  autoStartBreaks,
  setAutoStartBreaks,
  autoStartWork,
  setAutoStartWork,
  soundOnComplete,
  setSoundOnComplete,
  showNotifications,
  setShowNotifications,
  onTestNotification,
}: PomodoroSectionProps) {
  return (
    <SettingsCard
      title="Pomodoro таймер"
      description="Настройте технику управления временем (25 минут работы + перерыв)"
      icon={Timer}
      showToggle
      enabled={enabled}
      onToggle={setEnabled}
      collapseOnDisable
    >
      <div className="space-y-4">
        <p className="text-xs text-gray-600 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700/50 pb-3">
          Техника управления временем: работа разбивается на интервалы по 25 минут (помодоро), разделенные перерывами.
        </p>

        <SettingsRow
          label="Автоматически запускать перерывы"
          description="После завершения работы автоматически запускается перерыв"
        >
          <Toggle
            checked={autoStartBreaks}
            onChange={setAutoStartBreaks}
            size="sm"
          />
        </SettingsRow>

        <SettingsRow
          label="Автоматически запускать работу"
          description="После завершения перерыва автоматически запускается работа"
        >
          <Toggle
            checked={autoStartWork}
            onChange={setAutoStartWork}
            size="sm"
          />
        </SettingsRow>

        <SettingsRow
          label="Звук при завершении интервала"
          description="Воспроизводить звук при завершении работы или перерыва"
        >
          <Toggle
            checked={soundOnComplete}
            onChange={setSoundOnComplete}
            size="sm"
          />
        </SettingsRow>

        <SettingsRow
          label="Показывать уведомления"
          description="Показывать визуальные уведомления при завершении интервалов"
        >
          <Toggle
            checked={showNotifications}
            onChange={setShowNotifications}
            size="sm"
          />
        </SettingsRow>

        <div className="pt-2">
          <button
            onClick={onTestNotification}
            className="px-3 py-2 text-xs font-medium rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors whitespace-nowrap"
          >
            Пример уведомления
          </button>
        </div>
      </div>
    </SettingsCard>
  )
}
