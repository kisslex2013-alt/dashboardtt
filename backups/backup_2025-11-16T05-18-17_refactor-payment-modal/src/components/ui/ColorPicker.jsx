import { useState } from 'react'

/**
 * 🎨 Компонент выбора цвета для кнопок
 * @param {string} value - текущий выбранный цвет (hex)
 * @param {function} onChange - обработчик изменения цвета
 */
export function ColorPicker({ value = '', onChange }) {
  // Предустановленные цвета
  const presetColors = [
    '#3B82F6', // blue-500
    '#10B981', // green-500
    '#F59E0B', // yellow-500
    '#EF4444', // red-500
    '#8B5CF6', // purple-500
    '#EC4899', // pink-500
    '#06B6D4', // cyan-500
    '#F97316', // orange-500
    '#6366F1', // indigo-500
    '#14B8A6', // teal-500
    '#84CC16', // lime-500
    '#64748B', // slate-500
  ]

  const [customColor, setCustomColor] = useState(
    value && !presetColors.includes(value) ? value : ''
  )

  const handlePresetClick = color => {
    onChange?.(color)
    setCustomColor('')
  }

  const handleCustomChange = e => {
    const color = e.target.value
    setCustomColor(color)
    if (color) {
      onChange?.(color)
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Выберите цвет
        </label>
        <div className="grid grid-cols-6 gap-2">
          {presetColors.map(color => (
            <button
              key={color}
              type="button"
              onClick={() => handlePresetClick(color)}
              className={`
                w-10 h-10 rounded-lg border-2 transition-all
                ${
                  value === color
                    ? 'border-gray-900 dark:border-white scale-110 ring-2 ring-offset-2 ring-gray-400'
                    : 'border-gray-300 dark:border-gray-600 hover:scale-105'
                }
              `}
              style={{ backgroundColor: color }}
              title={color}
              aria-label={`Выбрать цвет ${color}`}
            />
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Или введите свой цвет (hex)
        </label>
        <input
          type="color"
          value={customColor || value || '#3B82F6'}
          onChange={handleCustomChange}
          className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
        />
        <input
          type="text"
          value={customColor || value || ''}
          onChange={handleCustomChange}
          placeholder="#3B82F6"
          pattern="^#[0-9A-Fa-f]{6}$"
          className="mt-2 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  )
}
