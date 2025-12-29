/**
 * 🎨 FaviconSection Component
 *
 * Секция настройки анимации фавикона.
 */

import { SettingsCard, SettingsRow } from '../../SettingsCard'
import { Toggle } from '../../../ui/Toggle'
import { Sparkles, Activity } from 'lucide-react'
import { FaviconPreviewCard } from './FaviconPreviewCard'
import { animationStyles, animationSpeeds, presetColors } from './constants'

interface FaviconSectionProps {
  enabled: boolean
  setEnabled: (value: boolean) => void
  animationStyle: string
  setAnimationStyle: (value: string) => void
  animationColor: string
  setAnimationColor: (value: string) => void
  animationSpeed: string
  setAnimationSpeed: (value: string) => void
}

export function FaviconSection({
  enabled,
  setEnabled,
  animationStyle,
  setAnimationStyle,
  animationColor,
  setAnimationColor,
  animationSpeed,
  setAnimationSpeed,
}: FaviconSectionProps) {
  return (
    <SettingsCard
      title="Анимация фавикона"
      description="Настройте визуальный индикатор в табе браузера"
      icon={Sparkles}
      showToggle
      enabled={enabled}
      onToggle={setEnabled}
      collapseOnDisable
    >
      <div className="space-y-3">
        {/* Стиль анимации - dropdown */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-gray-900 dark:text-white whitespace-nowrap min-w-[60px]">
            Стиль
          </label>
          <select
            value={animationStyle}
            onChange={(e) => setAnimationStyle(e.target.value)}
            className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white"
          >
            {animationStyles.map(style => (
              <option key={style.value} value={style.value}>
                {style.label} — {style.description}
              </option>
            ))}
          </select>
        </div>

        {/* Цвет - compact picker */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-gray-900 dark:text-white whitespace-nowrap min-w-[60px]">
            Цвет
          </label>
          <div className="flex items-center gap-1.5 flex-wrap">
            {presetColors.map(color => (
              <button
                key={color.value}
                onClick={() => setAnimationColor(color.value)}
                className={`w-6 h-6 rounded-md border-2 transition-all hover:scale-110 ${
                  animationColor === color.value
                    ? 'border-white ring-2 ring-blue-500 scale-110'
                    : 'border-transparent hover:border-gray-400'
                }`}
                title={color.label}
              >
                <div className={`w-full h-full rounded ${color.preview}`} />
              </button>
            ))}
            {/* Custom color */}
            <div className="relative w-6 h-6">
              <input
                type="color"
                value={animationColor}
                onChange={e => setAnimationColor(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                title="Кастомный цвет"
              />
              <div className="w-full h-full rounded-md bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 border-2 border-transparent" />
            </div>
          </div>
        </div>

        {/* Скорость - inline radio */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-gray-900 dark:text-white whitespace-nowrap min-w-[60px]">
            Скорость
          </label>
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
            {animationSpeeds.map(speed => (
              <button
                key={speed.value}
                onClick={() => setAnimationSpeed(speed.value)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  animationSpeed === speed.value
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {speed.label.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </SettingsCard>
  )
}
