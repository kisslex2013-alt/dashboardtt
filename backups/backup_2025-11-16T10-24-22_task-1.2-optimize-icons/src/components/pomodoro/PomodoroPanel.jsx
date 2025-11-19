/**
 * 🍅 Компонент панели Pomodoro таймера
 *
 * Отображает Pomodoro таймер с визуальным прогрессом и управлением
 */

import { usePomodoro } from '../../hooks/usePomodoro'
import { usePomodoroDurations } from '../../store/usePomodoroStore'
import { Play, Pause, RotateCcw, SkipForward } from '../../utils/icons'
import { motion } from 'framer-motion'

/**
 * Компонент панели Pomodoro
 */
export function PomodoroPanel() {
  const {
    mode,
    timeLeft,
    isRunning,
    pomodorosCompleted,
    formattedTime,
    progress,
    start,
    pause,
    resume,
    reset,
    nextMode,
  } = usePomodoro()

  const durations = usePomodoroDurations()

  // Определяем цвета и текст в зависимости от режима
  const getModeInfo = () => {
    switch (mode) {
      case 'work':
        return {
          label: 'Работа',
          color: '#10B981', // Green
          bgColor: 'bg-green-500',
          textColor: 'text-green-500',
        }
      case 'shortBreak':
        return {
          label: 'Короткий перерыв',
          color: '#3B82F6', // Blue
          bgColor: 'bg-blue-500',
          textColor: 'text-blue-500',
        }
      case 'longBreak':
        return {
          label: 'Длинный перерыв',
          color: '#8B5CF6', // Purple
          bgColor: 'bg-purple-500',
          textColor: 'text-purple-500',
        }
      default:
        return {
          label: 'Работа',
          color: '#10B981',
          bgColor: 'bg-green-500',
          textColor: 'text-green-500',
        }
    }
  }

  const modeInfo = getModeInfo()

  // Радиус круга прогресса
  const radius = 60
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div className="glass-effect rounded-xl p-6 mb-6">
      <div className="flex flex-col items-center">
        {/* Заголовок */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">🍅</span>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Pomodoro</h2>
        </div>

        {/* Режим */}
        <div className={`mb-4 px-4 py-2 rounded-lg ${modeInfo.bgColor} bg-opacity-10 dark:bg-opacity-20`}>
          <span className={`text-sm font-semibold ${modeInfo.textColor}`}>{modeInfo.label}</span>
        </div>

        {/* Круг прогресса с временем */}
        <div className="relative mb-6">
          <svg width="140" height="140" className="transform -rotate-90">
            {/* Фоновый круг */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-gray-200 dark:text-gray-700"
            />
            {/* Прогресс */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              stroke={modeInfo.color}
              strokeWidth="8"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          {/* Время в центре */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {formattedTime}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {Math.round(progress)}%
              </div>
            </div>
          </div>
        </div>

        {/* Счетчик помодоро */}
        <div className="mb-6 flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Завершено сегодня:</span>
          <div className="flex gap-1">
            {Array.from({ length: durations.pomodorosUntilLongBreak }).map((_, index) => (
              <span
                key={index}
                className={`text-lg ${
                  index < pomodorosCompleted % durations.pomodorosUntilLongBreak
                    ? 'text-green-500'
                    : 'text-gray-300 dark:text-gray-600'
                }`}
              >
                🍅
              </span>
            ))}
          </div>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {pomodorosCompleted}
          </span>
        </div>

        {/* Кнопки управления */}
        <div className="flex items-center gap-3">
          {isRunning ? (
            <button
              onClick={pause}
              className="glass-button px-6 py-3 rounded-lg transition-normal hover-lift-scale click-shrink flex items-center gap-2"
            >
              <Pause className="w-5 h-5" />
              <span className="font-semibold">Пауза</span>
            </button>
          ) : (
            <button
              onClick={timeLeft > 0 ? resume : start}
              className="glass-button px-6 py-3 rounded-lg transition-normal hover-lift-scale click-shrink flex items-center gap-2"
            >
              <Play className="w-5 h-5" />
              <span className="font-semibold">{timeLeft > 0 ? 'Продолжить' : 'Старт'}</span>
            </button>
          )}

          <button
            onClick={reset}
            className="glass-button p-3 rounded-lg transition-normal hover-lift-scale click-shrink"
            title="Сбросить"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={nextMode}
            className="glass-button p-3 rounded-lg transition-normal hover-lift-scale click-shrink"
            title="Пропустить"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

