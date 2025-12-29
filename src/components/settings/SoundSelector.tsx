/**
 * 🎵 SoundSelector Component (Headless UI Listbox)
 *
 * Компактный dropdown для выбора звука уведомления с кнопкой preview.
 * Использует Headless UI Listbox для accessibility и keyboard navigation.
 */

import { useState, Fragment } from 'react'
import { Listbox, Transition } from '@headlessui/react'
import { Play, ChevronDown, Volume2, Check } from '../../utils/icons'
import { useSoundManager } from '../../hooks/useSound'

export interface SoundOption {
  value: string
  label: string
}

interface SoundSelectorProps {
  /** Текущий выбранный звук */
  value: string
  /** Callback при изменении */
  onChange: (value: string) => void
  /** Список доступных звуков */
  options: SoundOption[]
  /** Отключен ли селектор */
  disabled?: boolean
  /** Дополнительные классы */
  className?: string
}

export function SoundSelector({
  value,
  onChange,
  options,
  disabled = false,
  className = '',
}: SoundSelectorProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const soundManager = useSoundManager()

  const selectedOption = options.find(opt => opt.value === value) || options[0]

  const handlePreview = (e: React.MouseEvent, soundValue: string) => {
    e.preventDefault()
    e.stopPropagation()
    setIsPlaying(true)
    soundManager.playSound(soundValue as any)
    setTimeout(() => setIsPlaying(false), 500)
  }

  return (
    <div className={`relative ${className}`}>
      <Listbox value={value} onChange={onChange} disabled={disabled}>
        {({ open }) => (
          <>
            <Listbox.Button
              className={`
                w-full flex items-center justify-between gap-2 px-3 py-2.5
                bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                rounded-lg text-sm transition-all
                ${disabled
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:border-blue-500 focus:ring-2 focus:ring-blue-500/30 focus:outline-none'
                }
              `}
            >
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-gray-900 dark:text-white font-medium">
                  {selectedOption?.label || 'Выберите звук'}
                </span>
              </div>

              <div className="flex items-center gap-1">
                {/* Preview button */}
                <span
                  onClick={(e) => handlePreview(e, value)}
                  className={`
                    p-1.5 rounded-md transition-all cursor-pointer
                    ${isPlaying
                      ? 'bg-blue-500 text-white scale-110'
                      : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }
                  `}
                  title="Прослушать"
                >
                  <Play className={`w-4 h-4 ${isPlaying ? 'animate-pulse' : ''}`} />
                </span>

                <ChevronDown
                  className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${
                    open ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </Listbox.Button>

            <Transition
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
              enter="transition ease-out duration-100"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
            >
              <Listbox.Options
                className="
                  absolute z-50 mt-1 w-full
                  bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                  rounded-lg shadow-xl max-h-64 overflow-y-auto custom-scrollbar
                  focus:outline-none
                "
              >
                {options.map((option) => (
                  <Listbox.Option
                    key={option.value}
                    value={option.value}
                    className={({ active, selected }) => `
                      relative flex items-center justify-between gap-2 px-3 py-2.5
                      text-sm transition-colors cursor-pointer select-none
                      ${selected
                        ? 'bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'
                        : active
                          ? 'bg-gray-100 dark:bg-gray-700'
                          : 'text-gray-700 dark:text-gray-300'
                      }
                    `}
                  >
                    {({ selected }) => (
                      <>
                        <span className="flex items-center gap-2">
                          {selected && <Check className="w-4 h-4" />}
                          <span>{option.label}</span>
                        </span>

                        <span
                          onClick={(e) => handlePreview(e, option.value)}
                          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer"
                          title="Прослушать"
                        >
                          <Play className="w-3 h-3" />
                        </span>
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </>
        )}
      </Listbox>
    </div>
  )
}

/**
 * Список стандартных звуков для уведомлений
 */
export const DEFAULT_SOUND_OPTIONS: SoundOption[] = [
  { value: 'melody', label: 'Мелодия' },
  { value: 'warning', label: 'Предупреждение' },
  { value: 'call', label: 'Звонок' },
  { value: 'doorbell', label: 'Дверной звонок' },
  { value: 'alarm', label: 'Тревога' },
  { value: 'notification', label: 'Уведомление' },
  { value: 'bell', label: 'Колокол' },
  { value: 'signal', label: 'Сигнал' },
  { value: 'ping', label: 'Пинг' },
  { value: 'gentle', label: 'Нежный' },
  { value: 'soft', label: 'Мягкий' },
  { value: 'zen', label: 'Дзен' },
  { value: 'focus', label: 'Фокус' },
  { value: 'lightbreeze', label: 'Легкий ветер' },
  { value: 'crystal', label: 'Кристалл' },
  { value: 'harmony', label: 'Гармония' },
  { value: 'whisper', label: 'Шёпот' },
  { value: 'flowering', label: 'Цветение' },
]
