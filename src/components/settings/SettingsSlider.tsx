/**
 * 📊 SettingsSlider Component
 *
 * Улучшенный слайдер для настроек с цветовой шкалой и крупными подписями.
 * Используется для настройки порогов переработки.
 */

import { useMemo } from 'react'

interface SettingsSliderProps {
  /** Текущее значение */
  value: number
  /** Callback при изменении */
  onChange: (value: number) => void
  /** Минимальное значение */
  min: number
  /** Максимальное значение */
  max: number
  /** Шаг */
  step?: number
  /** Метка */
  label?: string
  /** Суффикс для значения (например, "ч" для часов) */
  valueSuffix?: string
  /** Показывать цветовую шкалу */
  showColorScale?: boolean
  /** Подсказки под слайдером */
  hints?: { value: number; label: string }[]
  /** Дополнительные классы */
  className?: string
  /** Отключен ли слайдер */
  disabled?: boolean
}

export function SettingsSlider({
  value,
  onChange,
  min,
  max,
  step = 0.5,
  label,
  valueSuffix = '',
  showColorScale = false,
  hints,
  className = '',
  disabled = false,
}: SettingsSliderProps) {
  // Вычисляем процент для градиента
  const percentage = useMemo(() => {
    return ((value - min) / (max - min)) * 100
  }, [value, min, max])

  // Цвет в зависимости от позиции
  const getTrackColor = () => {
    if (!showColorScale) return 'bg-blue-500'

    if (percentage < 50) return 'bg-green-500'
    if (percentage < 75) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label и Value */}
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
          <span className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">
            {value}{valueSuffix}
          </span>
        </div>
      )}

      {/* Slider */}
      <div className="relative">
        {/* Track background */}
        <div className="absolute inset-0 h-2 bg-gray-200 dark:bg-gray-700 rounded-full top-1/2 -translate-y-1/2" />

        {/* Colored track */}
        <div
          className={`absolute h-2 rounded-full top-1/2 -translate-y-1/2 transition-all ${getTrackColor()}`}
          style={{ width: `${percentage}%` }}
        />

        {/* Input */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          disabled={disabled}
          className={`
            relative w-full h-6 appearance-none bg-transparent cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-5
            [&::-webkit-slider-thumb]:h-5
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-white
            [&::-webkit-slider-thumb]:border-2
            [&::-webkit-slider-thumb]:border-blue-500
            [&::-webkit-slider-thumb]:shadow-md
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:transition-transform
            [&::-webkit-slider-thumb]:hover:scale-110
            [&::-moz-range-thumb]:w-5
            [&::-moz-range-thumb]:h-5
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-white
            [&::-moz-range-thumb]:border-2
            [&::-moz-range-thumb]:border-blue-500
            [&::-moz-range-thumb]:shadow-md
            [&::-moz-range-thumb]:cursor-pointer
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        />
      </div>

      {/* Hints */}
      {hints && hints.length > 0 && (
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
          {hints.map((hint, index) => (
            <span
              key={index}
              className={value >= hint.value ? 'text-gray-700 dark:text-gray-300' : ''}
            >
              {hint.label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * OvertimeSlider — предустановленный слайдер для настройки переработки
 */
interface OvertimeSliderProps {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  description?: string
  disabled?: boolean
}

export function OvertimeSlider({
  label,
  value,
  onChange,
  min = 1,
  max = 3,
  description,
  disabled = false,
}: OvertimeSliderProps) {
  return (
    <div className="space-y-2">
      <SettingsSlider
        label={label}
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        step={0.1}
        valueSuffix=" ч"
        showColorScale={true}
        hints={[
          { value: min, label: `${min * 100}%` },
          { value: (min + max) / 2, label: `${Math.round(((min + max) / 2) * 100)}%` },
          { value: max, label: `${max * 100}%` },
        ]}
        disabled={disabled}
      />
      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {description}
        </p>
      )}
    </div>
  )
}
