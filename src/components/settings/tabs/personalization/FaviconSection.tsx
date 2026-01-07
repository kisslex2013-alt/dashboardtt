/**
 * 🎨 FaviconSection Component
 *
 * Секция настройки анимации фавикона.
 */

import { SettingsCard, SettingsRow } from '../../SettingsCard'
import { Toggle } from '../../../ui/Toggle'
import { Sparkles, Activity, Check, ChevronDown } from 'lucide-react'
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react'
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
          <Listbox value={animationStyle} onChange={setAnimationStyle}>
            <div className="relative flex-1">
              <ListboxButton className="relative w-full cursor-default rounded-lg bg-gray-100 dark:bg-gray-800 py-2 pl-3 pr-10 text-left border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors">
                <span className="block truncate text-gray-900 dark:text-white">
                  {animationStyles.find(s => s.value === animationStyle)?.label}
                </span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                  <ChevronDown
                    className="h-4 w-4 text-gray-500"
                    aria-hidden="true"
                  />
                </span>
              </ListboxButton>
              <ListboxOptions 
                className="absolute z-50 mt-1 min-w-full max-h-60 overflow-auto rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-1 shadow-lg ring-1 ring-black/5 focus:outline-none"
              >
                {animationStyles.map((style) => (
                  <ListboxOption
                    key={style.value}
                    className={({ active }) =>
                      `relative cursor-pointer select-none rounded-lg py-2 pl-10 pr-4 ${
                        active ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-gray-100'
                      }`
                    }
                    value={style.value}
                  >
                    {({ selected }) => (
                      <>
                        <span
                          className={`block ${
                            selected ? 'font-medium' : 'font-normal'
                          }`}
                          title={`${style.label} — ${style.description}`}
                        >
                          {style.label} <span className="text-gray-400 dark:text-gray-500 text-xs ml-1">— {style.description}</span>
                        </span>
                        {selected ? (
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600 dark:text-blue-400">
                            <Check className="h-4 w-4" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </ListboxOption>
                ))}
              </ListboxOptions>
            </div>
          </Listbox>
        </div>

        {/* Цвет - compact picker */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-gray-900 dark:text-white whitespace-nowrap min-w-[60px]">
            Цвет
          </label>
          <div className="flex items-center gap-1 flex-nowrap">
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
