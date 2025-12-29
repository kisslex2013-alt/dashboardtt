/**
 * ⚠️ Хук для предупреждений о переработке
 */

import { useEffect, useRef } from 'react'
import { useEntries } from '../store/useEntriesStore'
import { useDailyHours, useNotificationsSettings } from '../store/useSettingsStore'
import { useNotifications } from './useNotifications'
import { useSoundManager } from './useSound'
import { format } from 'date-fns'
import { calculateDuration } from '../utils/calculations'
import { logger } from '../utils/logger'
import type { TimeEntry } from '../types'

interface AlertsShown {
  warning: boolean
  critical: boolean
  date: string | null
}

/**
 * ⚠️ Хук для предупреждений о переработке
 *
 * Отслеживает время работы за текущий день и показывает предупреждения
 * при превышении дневной нормы часов.
 */
export function useOvertimeAlerts(): void {
  const entries = useEntries() as TimeEntry[]
  const dailyHours = useDailyHours()
  const notifications = useNotificationsSettings()
  const { showWarning, showError } = useNotifications()
  const { playSound } = useSoundManager()

  const alertsShownRef = useRef<AlertsShown>({
    warning: false,
    critical: false,
    date: null,
  })

  useEffect(() => {
    const dailyHoursNum = Number(dailyHours)
    if (!notifications.overtimeAlertsEnabled || !Number.isFinite(dailyHoursNum) || dailyHoursNum <= 0) {
      return
    }

    const today = format(new Date(), 'yyyy-MM-dd')
    const todayEntries = entries.filter((entry: TimeEntry) => entry.date === today)

    if (todayEntries.length === 0) {
      alertsShownRef.current = {
        warning: false,
        critical: false,
        date: today,
      }
      return
    }

    let totalHours = 0
    todayEntries.forEach((entry: TimeEntry) => {
      if (entry.duration) {
        totalHours += parseFloat(String(entry.duration)) || 0
      } else if (entry.start && entry.end) {
        const duration = calculateDuration(entry.start, entry.end)
        totalHours += Number.isFinite(duration) ? duration : 0
      }
    })

    totalHours = Number.isFinite(totalHours) ? totalHours : 0

    if (alertsShownRef.current.date !== today) {
      alertsShownRef.current = {
        warning: false,
        critical: false,
        date: today,
      }
    }

    const warningThresholdMultiplier = Number(notifications.overtimeWarningThreshold) || 1.0
    const criticalThresholdMultiplier = Number(notifications.overtimeCriticalThreshold) || 1.5
    const warningThreshold = Number.isFinite(warningThresholdMultiplier) ? dailyHoursNum * warningThresholdMultiplier : dailyHoursNum * 1.0
    const criticalThreshold = Number.isFinite(criticalThresholdMultiplier) ? dailyHoursNum * criticalThresholdMultiplier : dailyHoursNum * 1.5

    if (totalHours >= criticalThreshold && !alertsShownRef.current.critical) {
      const overtimeHours = Number.isFinite(totalHours - dailyHoursNum) ? totalHours - dailyHoursNum : 0
      const totalHoursFixed = Number.isFinite(totalHours) ? totalHours.toFixed(1) : '0.0'
      const overtimeHoursFixed = Number.isFinite(overtimeHours) ? overtimeHours.toFixed(1) : '0.0'
      const message = `Критическая переработка! Вы работаете уже ${totalHoursFixed} ч (норма: ${dailyHoursNum} ч). Превышение: ${overtimeHoursFixed} ч.`

      showError(message, 15000)

      if (notifications.overtimeSoundAlert) {
        playSound('alarm')
      }

      alertsShownRef.current.critical = true
      logger.log(`Критическое предупреждение о переработке показано`)
    }
    else if (totalHours >= warningThreshold && !alertsShownRef.current.warning && !alertsShownRef.current.critical) {
      const overtimeHours = Number.isFinite(totalHours - dailyHoursNum) ? totalHours - dailyHoursNum : 0
      const totalHoursFixed = Number.isFinite(totalHours) ? totalHours.toFixed(1) : '0.0'
      const overtimeHoursFixed = Number.isFinite(overtimeHours) ? overtimeHours.toFixed(1) : '0.0'
      const message = `Переработка! Вы работаете уже ${totalHoursFixed} ч (норма: ${dailyHoursNum} ч). Превышение: ${overtimeHoursFixed} ч.`

      showWarning(message, 12000)

      if (notifications.overtimeSoundAlert) {
        playSound('alert')
      }

      alertsShownRef.current.warning = true
      logger.log(`Предупреждение о переработке показано`)
    }
  }, [entries, dailyHours, notifications.overtimeAlertsEnabled, notifications.overtimeWarningThreshold, notifications.overtimeCriticalThreshold, notifications.overtimeSoundAlert, showWarning, showError, playSound])
}
