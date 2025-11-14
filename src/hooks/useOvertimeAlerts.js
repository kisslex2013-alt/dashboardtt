/**
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 *
 * Этот хук отслеживает переработку (превышение дневной нормы часов) и показывает предупреждения.
 * - Отслеживает общее время работы за текущий день
 * - Показывает предупреждение при достижении порога предупреждения
 * - Показывает критическое предупреждение при достижении критического порога
 * - Интегрируется с системой уведомлений и звуков
 */

import { useEffect, useRef } from 'react'
import { useEntries } from '../store/useEntriesStore'
import { useDailyHours, useNotificationsSettings } from '../store/useSettingsStore'
import { useNotifications } from './useNotifications'
import { useSoundManager } from './useSound'
import { format } from 'date-fns'
import { calculateDuration } from '../utils/calculations'
import { logger } from '../utils/logger'

/**
 * ⚠️ Хук для предупреждений о переработке
 *
 * Отслеживает время работы за текущий день и показывает предупреждения
 * при превышении дневной нормы часов.
 *
 * @returns {void}
 *
 * @example
 * // Использование в компоненте:
 * function App() {
 *   useOvertimeAlerts()
 *   // ... остальной код
 * }
 */
export function useOvertimeAlerts() {
  const entries = useEntries()
  const dailyHours = useDailyHours()
  const notifications = useNotificationsSettings()
  const { showWarning, showError } = useNotifications()
  const { playSound } = useSoundManager()

  // Отслеживаем уже показанные предупреждения за текущий день
  const alertsShownRef = useRef({
    warning: false,
    critical: false,
    date: null,
  })

  useEffect(() => {
    // Если предупреждения о переработке отключены, ничего не делаем
    if (!notifications.overtimeAlertsEnabled || !dailyHours || dailyHours <= 0) {
      return
    }

    // Получаем записи за текущий день
    const today = format(new Date(), 'yyyy-MM-dd')
    const todayEntries = entries.filter(entry => entry.date === today)

    if (todayEntries.length === 0) {
      // Если нет записей за сегодня, сбрасываем флаги предупреждений
      alertsShownRef.current = {
        warning: false,
        critical: false,
        date: today,
      }
      return
    }

    // Рассчитываем общее время работы за сегодня
    let totalHours = 0
    todayEntries.forEach(entry => {
      if (entry.duration) {
        totalHours += parseFloat(entry.duration) || 0
      } else if (entry.start && entry.end) {
        const duration = calculateDuration(entry.start, entry.end)
        totalHours += Number.isFinite(duration) ? duration : 0
      }
    })
    
    // Убеждаемся, что totalHours является числом
    totalHours = Number.isFinite(totalHours) ? totalHours : 0

    // Проверяем, нужно ли сбросить флаги при смене дня
    if (alertsShownRef.current.date !== today) {
      alertsShownRef.current = {
        warning: false,
        critical: false,
        date: today,
      }
    }

    const warningThreshold = dailyHours * (notifications.overtimeWarningThreshold || 1.0)
    const criticalThreshold = dailyHours * (notifications.overtimeCriticalThreshold || 1.5)

    // Проверяем критическое превышение (показываем только один раз за день)
    if (totalHours >= criticalThreshold && !alertsShownRef.current.critical) {
      const overtimeHours = Number.isFinite(totalHours - dailyHours) ? totalHours - dailyHours : 0
      const totalHoursFixed = Number.isFinite(totalHours) ? totalHours.toFixed(1) : '0.0'
      const overtimeHoursFixed = Number.isFinite(overtimeHours) ? overtimeHours.toFixed(1) : '0.0'
      const message = `🚨 Критическая переработка! Вы работаете уже ${totalHoursFixed} ${totalHours === 1 ? 'час' : totalHours < 5 ? 'часа' : 'часов'} (норма: ${dailyHours} ч). Превышение: ${overtimeHoursFixed} ${overtimeHours === 1 ? 'час' : overtimeHours < 5 ? 'часа' : 'часов'}. Рекомендуется сделать перерыв и отдохнуть.`

      showError(message, 15000) // Показываем 15 секунд

      // Звуковое уведомление при критической переработке
      if (notifications.overtimeSoundAlert) {
        playSound('alarm')
      }

      alertsShownRef.current.critical = true
      const totalHoursLog = Number.isFinite(totalHours) ? totalHours.toFixed(1) : '0.0'
      logger.log(`🚨 Критическое предупреждение о переработке показано (${totalHoursLog}ч / норма: ${dailyHours}ч)`)
    }
    // Проверяем предупреждение (показываем только один раз за день, если еще не было критического)
    else if (totalHours >= warningThreshold && !alertsShownRef.current.warning && !alertsShownRef.current.critical) {
      const overtimeHours = Number.isFinite(totalHours - dailyHours) ? totalHours - dailyHours : 0
      const totalHoursFixed = Number.isFinite(totalHours) ? totalHours.toFixed(1) : '0.0'
      const overtimeHoursFixed = Number.isFinite(overtimeHours) ? overtimeHours.toFixed(1) : '0.0'
      const message = `⚠️ Переработка! Вы работаете уже ${totalHoursFixed} ${totalHours === 1 ? 'час' : totalHours < 5 ? 'часа' : 'часов'} (норма: ${dailyHours} ч). Превышение: ${overtimeHoursFixed} ${overtimeHours === 1 ? 'час' : overtimeHours < 5 ? 'часа' : 'часов'}. Рекомендуется сделать перерыв.`

      showWarning(message, 12000) // Показываем 12 секунд

      // Звуковое уведомление при переработке
      if (notifications.overtimeSoundAlert) {
        playSound('alert')
      }

      alertsShownRef.current.warning = true
      const totalHoursLog = Number.isFinite(totalHours) ? totalHours.toFixed(1) : '0.0'
      logger.log(`⚠️ Предупреждение о переработке показано (${totalHoursLog}ч / норма: ${dailyHours}ч)`)
    }
  }, [entries, dailyHours, notifications.overtimeAlertsEnabled, notifications.overtimeWarningThreshold, notifications.overtimeCriticalThreshold, notifications.overtimeSoundAlert, showWarning, showError, playSound])
}

