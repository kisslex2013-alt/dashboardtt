/**
 * ⏱️ ProductivityTab Component
 *
 * Вкладка "Продуктивность" — Pomodoro настройки.
 */

import { PomodoroSection } from './productivity'

interface ProductivityTabProps {
  // Pomodoro props
  pomodoroEnabled: boolean
  setPomodoroEnabled: (value: boolean) => void
  pomodoroAutoStartBreaks: boolean
  setPomodoroAutoStartBreaks: (value: boolean) => void
  pomodoroAutoStartWork: boolean
  setPomodoroAutoStartWork: (value: boolean) => void
  pomodoroSoundOnComplete: boolean
  setPomodoroSoundOnComplete: (value: boolean) => void
  pomodoroShowNotifications: boolean
  setPomodoroShowNotifications: (value: boolean) => void
  onTestPomodoroNotification: () => void
}

export function ProductivityTab({
  pomodoroEnabled,
  setPomodoroEnabled,
  pomodoroAutoStartBreaks,
  setPomodoroAutoStartBreaks,
  pomodoroAutoStartWork,
  setPomodoroAutoStartWork,
  pomodoroSoundOnComplete,
  setPomodoroSoundOnComplete,
  pomodoroShowNotifications,
  setPomodoroShowNotifications,
  onTestPomodoroNotification,
}: ProductivityTabProps) {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Продуктивность
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Настройте таймер Pomodoro для фокусировки на работе
        </p>
      </div>

      <PomodoroSection
        enabled={pomodoroEnabled}
        setEnabled={setPomodoroEnabled}
        autoStartBreaks={pomodoroAutoStartBreaks}
        setAutoStartBreaks={setPomodoroAutoStartBreaks}
        autoStartWork={pomodoroAutoStartWork}
        setAutoStartWork={setPomodoroAutoStartWork}
        soundOnComplete={pomodoroSoundOnComplete}
        setSoundOnComplete={setPomodoroSoundOnComplete}
        showNotifications={pomodoroShowNotifications}
        setShowNotifications={setPomodoroShowNotifications}
        onTestNotification={onTestPomodoroNotification}
      />
    </div>
  )
}

