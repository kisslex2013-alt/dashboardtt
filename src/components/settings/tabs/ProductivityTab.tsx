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

