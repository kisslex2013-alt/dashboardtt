import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * 🍅 Хранилище для управления Pomodoro таймером
 *
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 *
 * Это хранилище управляет состоянием Pomodoro таймера - техники управления временем,
 * где работа разбивается на интервалы по 25 минут (помодоро), разделенные короткими перерывами.
 *
 * Основные функции:
 * - Запуск/остановка Pomodoro таймера
 * - Отслеживание текущего режима (работа/перерыв/длинный перерыв)
 * - Автоматическое переключение между режимами
 * - Статистика по завершенным помодоро
 * - Настройки длительности интервалов
 *
 * Состояние:
 * - mode: текущий режим ('work' | 'shortBreak' | 'longBreak')
 * - timeLeft: оставшееся время в секундах
 * - isRunning: работает ли таймер
 * - pomodorosCompleted: количество завершенных помодоро за сегодня
 * - totalPomodoros: общее количество завершенных помодоро
 */

export const usePomodoroStore = create(
  persist(
    (set, get) => ({
      // Текущий режим: 'work' | 'shortBreak' | 'longBreak'
      mode: 'work',

      // Оставшееся время в секундах
      timeLeft: 25 * 60, // 25 минут по умолчанию

      // Работает ли таймер
      isRunning: false,

      // Время начала текущего интервала (timestamp)
      startTime: null,

      // Количество завершенных помодоро за сегодня
      pomodorosCompleted: 0,

      // Дата последнего сброса счетчика (для сброса ежедневной статистики)
      lastResetDate: null,

      // Общее количество завершенных помодоро (все время)
      totalPomodoros: 0,

      // Настройки длительности интервалов (в минутах)
      workDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      pomodorosUntilLongBreak: 4, // После 4 помодоро - длинный перерыв

      /**
       * Запускает Pomodoro таймер
       */
      start: () => {
        const { timeLeft } = get()
        set({
          isRunning: true,
          startTime: Date.now(),
          timeLeft: timeLeft > 0 ? timeLeft : get().getDurationForMode() * 60,
        })
      },

      /**
       * Останавливает Pomodoro таймер
       */
      pause: () => {
        const { startTime, timeLeft } = get()
        if (startTime) {
          const elapsed = Math.floor((Date.now() - startTime) / 1000)
          const newTimeLeft = Math.max(0, timeLeft - elapsed)
          set({
            isRunning: false,
            startTime: null,
            timeLeft: newTimeLeft,
          })
        }
      },

      /**
       * Возобновляет Pomodoro таймер
       */
      resume: () => {
        const { timeLeft } = get()
        if (timeLeft > 0) {
          set({
            isRunning: true,
            startTime: Date.now(),
          })
        }
      },

      /**
       * Останавливает и сбрасывает таймер
       */
      reset: () => {
        const { mode } = get()
        set({
          isRunning: false,
          startTime: null,
          timeLeft: get().getDurationForMode() * 60,
        })
      },

      /**
       * Переключает на следующий режим
       */
      nextMode: () => {
        const { mode, pomodorosCompleted, pomodorosUntilLongBreak } = get()
        let nextMode = 'work'
        let newPomodorosCompleted = pomodorosCompleted

        if (mode === 'work') {
          // После работы - перерыв
          newPomodorosCompleted = pomodorosCompleted + 1
          // Проверяем, нужен ли длинный перерыв
          if (newPomodorosCompleted % pomodorosUntilLongBreak === 0) {
            nextMode = 'longBreak'
          } else {
            nextMode = 'shortBreak'
          }
        } else {
          // После перерыва - работа
          nextMode = 'work'
        }

        // Сбрасываем счетчик ежедневных помодоро при смене дня
        const today = new Date().toDateString()
        const { lastResetDate } = get()
        if (lastResetDate !== today) {
          newPomodorosCompleted = mode === 'work' ? 1 : 0
        }

        set({
          mode: nextMode,
          isRunning: false,
          startTime: null,
          timeLeft: get().getDurationForMode(nextMode) * 60,
          pomodorosCompleted: newPomodorosCompleted,
          totalPomodoros: get().totalPomodoros + (mode === 'work' ? 1 : 0),
          lastResetDate: today,
        })
      },

      /**
       * Обновляет оставшееся время (вызывается каждую секунду)
       */
      tick: () => {
        const { isRunning, startTime, timeLeft } = get()
        if (!isRunning || !startTime) return

        const elapsed = Math.floor((Date.now() - startTime) / 1000)
        const newTimeLeft = Math.max(0, timeLeft - elapsed)

        if (newTimeLeft <= 0) {
          // Время вышло - останавливаем и переключаем режим
          set({
            isRunning: false,
            startTime: null,
            timeLeft: 0,
          })
          // Переключаем режим после небольшой задержки (для звука/уведомлений)
          setTimeout(() => {
            get().nextMode()
          }, 100)
        } else {
          set({
            timeLeft: newTimeLeft,
          })
        }
      },

      /**
       * Получает длительность для текущего режима (в минутах)
       */
      getDurationForMode: (mode = null) => {
        const currentMode = mode || get().mode
        const { workDuration, shortBreakDuration, longBreakDuration } = get()

        switch (currentMode) {
          case 'work':
            return workDuration
          case 'shortBreak':
            return shortBreakDuration
          case 'longBreak':
            return longBreakDuration
          default:
            return workDuration
        }
      },

      /**
       * Устанавливает длительность интервалов
       */
      setDurations: ({ work, shortBreak, longBreak, pomodorosUntilLongBreak }) => {
        set({
          workDuration: work ?? get().workDuration,
          shortBreakDuration: shortBreak ?? get().shortBreakDuration,
          longBreakDuration: longBreak ?? get().longBreakDuration,
          pomodorosUntilLongBreak: pomodorosUntilLongBreak ?? get().pomodorosUntilLongBreak,
        })
      },

      /**
       * Сбрасывает статистику за сегодня
       */
      resetDailyStats: () => {
        const today = new Date().toDateString()
        set({
          pomodorosCompleted: 0,
          lastResetDate: today,
        })
      },
    }),
    {
      name: 'pomodoro-storage',
      partialize: state => ({
        pomodorosCompleted: state.pomodorosCompleted,
        totalPomodoros: state.totalPomodoros,
        lastResetDate: state.lastResetDate,
        workDuration: state.workDuration,
        shortBreakDuration: state.shortBreakDuration,
        longBreakDuration: state.longBreakDuration,
        pomodorosUntilLongBreak: state.pomodorosUntilLongBreak,
      }),
    }
  )
)

// ===== Атомарные селекторы =====
export const usePomodoroMode = () => usePomodoroStore(state => state.mode)
export const usePomodoroTimeLeft = () => usePomodoroStore(state => state.timeLeft)
export const usePomodoroIsRunning = () => usePomodoroStore(state => state.isRunning)
export const usePomodoroCompleted = () => usePomodoroStore(state => state.pomodorosCompleted)
export const usePomodoroTotal = () => usePomodoroStore(state => state.totalPomodoros)
export const usePomodoroDurations = () =>
  usePomodoroStore(state => ({
    work: state.workDuration,
    shortBreak: state.shortBreakDuration,
    longBreak: state.longBreakDuration,
    pomodorosUntilLongBreak: state.pomodorosUntilLongBreak,
  }))

// Actions
export const usePomodoroStart = () => usePomodoroStore(state => state.start)
export const usePomodoroPause = () => usePomodoroStore(state => state.pause)
export const usePomodoroResume = () => usePomodoroStore(state => state.resume)
export const usePomodoroReset = () => usePomodoroStore(state => state.reset)
export const usePomodoroNextMode = () => usePomodoroStore(state => state.nextMode)
export const usePomodoroSetDurations = () => usePomodoroStore(state => state.setDurations)
export const usePomodoroResetDailyStats = () => usePomodoroStore(state => state.resetDailyStats)

