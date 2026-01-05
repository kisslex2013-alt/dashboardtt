import { BarChart3, LineChart, Layers } from '../../utils/icons'
import type { ChartTypeSwitcherProps } from '../../types'

/**
 * 📊 Переключатель типов графиков (только иконки с тултипами)
 *
 * - Bar (столбчатый) - показывает данные в виде столбцов
 * - Line (линейный) - показывает данные в виде линии
 * - Area (областной) - показывает данные в виде залитой области
 */
export function ChartTypeSwitcher({ currentType = 'line', onChange }: ChartTypeSwitcherProps) {
  const types = [
    { value: 'bar' as const, label: 'Столбцы', icon: BarChart3 },
    { value: 'line' as const, label: 'Линия', icon: LineChart },
    { value: 'area' as const, label: 'Область', icon: Layers },
  ]

  return (
    <div className="flex bg-gray-100 dark:bg-gray-700/50 rounded-lg p-0.5">
      {types.map(type => {
        const Icon = type.icon
        const isActive = currentType === type.value

        return (
          <button
            key={type.value}
            onClick={() => onChange(type.value)}
            className={`p-1.5 rounded-md transition-all ${
              isActive
                ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-500'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
            title={type.label}
          >
            <Icon className="w-4 h-4" />
          </button>
        )
      })}
    </div>
  )
}
