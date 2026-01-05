import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * ⏱️ Хранилище для управления таймером реального времени
 *
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 *
 * Это хранилище управляет состоянием таймера, который отслеживает время работы.
 *
 * Основные функции:
 * - Запуск таймера с выбором категории работы
 * - Отслеживание прошедшего времени в реальном времени
 * - Пауза и возобновление таймера
 * - Остановка таймера с возвратом общего времени работы
 *
 * ✅ ИСПРАВЛЕНО: Сохраняется в localStorage для восстановления после перезагрузки страницы.
 *
 * Состояние:
 * - activeTimer: название активной категории (null если не запущен)
 * - startTime: время начала работы таймера (timestamp)
 * - elapsedTime: прошедшее время в секундах (для паузы/возобновления)
 * - isPaused: статус паузы
 * - timerEntryId: ID записи, созданной при старте таймера
 */

/** Интерфейс состояния Timer store */
interface TimerState {
  // State
  activeTimer: string | null
  startTime: number | null
  elapsedTime: number
  lastUpdateTime: number | null
  isPaused: boolean
  timerEntryId: string | null
  lastHourAlert: number

  // Actions
  startTimer: (category: string) => void
  stopTimer: () => number
  setTimerEntryId: (entryId: string | null) => void
  pauseTimer: () => void
  resumeTimer: () => void
  updateElapsed: () => void
  getCurrentElapsed: () => number
  formatTime: (seconds: number) => string
  getFormattedTime: () => string
  isRunning: () => boolean
  getIsPaused: () => boolean
  getHours: () => number
  shouldShowHourlyAlert: () => boolean
  resetTimer: () => void
}

export const useTimerStore = create<TimerState>()(

  persist(
    (set, get) => ({
  // Текущая активная категория таймера (null если не запущен)
  activeTimer: null,

  // Время начала работы таймера (timestamp)
  startTime: null,

  // Прошедшее время в секундах (для паузы/возобновления)
  elapsedTime: 0,

  // Время последнего обновления (для точного расчета)
  lastUpdateTime: null,

  // Статус паузы
  isPaused: false,

  // ID записи, созданной при старте таймера
  timerEntryId: null,

  /**
   * Запускает таймер для указанной категории
   * @param {string} category - название категории работы
   */
  startTimer: category => {
    const now = Date.now()
    set({
      activeTimer: category,
      startTime: now,
      elapsedTime: 0,
      lastUpdateTime: now,
      isPaused: false,
    })
  },

  /**
   * Останавливает таймер и возвращает общее время работы
   * @returns {number} время работы в секундах
   */
  stopTimer: () => {
    const { startTime, elapsedTime, lastUpdateTime, isPaused } = get()

    if (!startTime) return 0

    // Рассчитываем финальное время
    let finalElapsed = elapsedTime
    if (!isPaused && lastUpdateTime) {
      finalElapsed += (Date.now() - lastUpdateTime) / 1000
    }

    // Сбрасываем состояние (timerEntryId не сбрасываем здесь - это сделает useTimer.js после обновления записи)
    set({
      activeTimer: null,
      startTime: null,
      elapsedTime: 0,
      lastUpdateTime: null,
      isPaused: false,
    })

    return finalElapsed
  },

  /**
   * Устанавливает ID записи таймера
   * @param {string} entryId - ID записи
   */
  setTimerEntryId: entryId => {
    set({ timerEntryId: entryId })
  },

  /**
   * Ставит таймер на паузу
   */
  pauseTimer: () => {
    const { startTime, elapsedTime, lastUpdateTime } = get()

    if (!startTime || get().isPaused) return

    // Обновляем elapsedTime с учетом времени с последнего обновления
    const currentElapsed = elapsedTime + (lastUpdateTime ? (Date.now() - lastUpdateTime) / 1000 : 0)

    set({
      elapsedTime: currentElapsed,
      lastUpdateTime: null,
      isPaused: true,
    })
  },

  /**
   * Возобновляет работу таймера
   */
  resumeTimer: () => {
    const { isPaused } = get()

    if (!isPaused) return

    set({
      lastUpdateTime: Date.now(),
      isPaused: false,
    })
  },

  /**
   * Обновляет прошедшее время (вызывается каждую секунду)
   */
  updateElapsed: () => {
    const { startTime, elapsedTime, lastUpdateTime, isPaused } = get()

    if (!startTime || isPaused) return

    const now = Date.now()
    const currentElapsed = elapsedTime + (lastUpdateTime ? (now - lastUpdateTime) / 1000 : 0)

    set({
      elapsedTime: currentElapsed,
      lastUpdateTime: now,
    })
  },

  /**
   * Получает текущее прошедшее время
   * @returns {number} время в секундах
   */
  getCurrentElapsed: () => {
    const { startTime, elapsedTime, lastUpdateTime, isPaused } = get()

    if (!startTime) return 0

    if (isPaused) {
      return elapsedTime
    }

    return elapsedTime + (lastUpdateTime ? (Date.now() - lastUpdateTime) / 1000 : 0)
  },

  /**
   * Форматирует время в формат HH:MM:SS
   * @param {number} seconds - время в секундах
   * @returns {string} отформатированное время
   */
  formatTime: seconds => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  },

  /**
   * Получает отформатированное текущее время
   * @returns {string} текущее время в формате HH:MM:SS
   */
  getFormattedTime: () => {
    const elapsed = get().getCurrentElapsed()
    return get().formatTime(elapsed)
  },

  /**
   * Проверяет, работает ли таймер
   * @returns {boolean} true если таймер активен
   */
  isRunning: () => {
    const { activeTimer, isPaused } = get()
    return !!activeTimer && !isPaused
  },

  /**
   * Проверяет, на паузе ли таймер
   * @returns {boolean} true если таймер на паузе
   */
  getIsPaused: () => {
    return get().isPaused
  },

  /**
   * Получает количество полных часов работы
   * @returns {number} количество часов
   */
  getHours: () => {
    const elapsed = get().getCurrentElapsed()
    return Math.floor(elapsed / 3600)
  },

  /**
   * Проверяет, нужно ли показать уведомление о прошедшем часе
   * @returns {boolean} true если прошел новый час
   */
  shouldShowHourlyAlert: () => {
    const hours = get().getHours()
    const { lastHourAlert } = get()

    if (hours > lastHourAlert) {
      set({ lastHourAlert: hours })
      return true
    }

    return false
  },

  // Последний час, для которого показывалось уведомление
  lastHourAlert: 0,

  /**
   * Сбрасывает таймер (принудительная остановка)
   */
  resetTimer: () => {
    set({
      activeTimer: null,
      startTime: null,
      elapsedTime: 0,
      lastUpdateTime: null,
      isPaused: false,
      lastHourAlert: 0,
      timerEntryId: null, // Сбрасываем ID записи
    })
  },
    }),
    {
      name: 'time-tracker-timer', // Ключ в localStorage
      // Сохраняем только критичные поля для восстановления таймера
      partialize: (state) => ({
        activeTimer: state.activeTimer,
        startTime: state.startTime,
        elapsedTime: state.elapsedTime,
        lastUpdateTime: state.lastUpdateTime,
        isPaused: state.isPaused,
        timerEntryId: state.timerEntryId,
      }),
    }
  )
)

// ===== Атомарные селекторы (рекомендуемое использование) =====
export const useActiveTimer = () => useTimerStore(state => state.activeTimer)
export const useIsPaused = () => useTimerStore(state => state.isPaused)
export const useElapsedTime = () => useTimerStore(state => state.elapsedTime)
export const useTimerEntryId = () => useTimerStore(state => state.timerEntryId)
export const useStartTime = () => useTimerStore(state => state.startTime)

// Derived/actions
export const useIsRunning = () => useTimerStore(state => state.isRunning())
export const useStartTimer = () => useTimerStore(state => state.startTimer)
export const useStopTimer = () => useTimerStore(state => state.stopTimer)
export const usePauseTimer = () => useTimerStore(state => state.pauseTimer)
export const useResumeTimer = () => useTimerStore(state => state.resumeTimer)
export const useUpdateElapsed = () => useTimerStore(state => state.updateElapsed)
export const useResetTimer = () => useTimerStore(state => state.resetTimer)
export const useSetTimerEntryId = () => useTimerStore(state => state.setTimerEntryId)
export const useGetCurrentElapsed = () => useTimerStore(state => state.getCurrentElapsed)
export const useGetFormattedTime = () => useTimerStore(state => state.getFormattedTime)
