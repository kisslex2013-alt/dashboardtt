import { BarChart3, LineChart, Layers } from 'lucide-react'

/**
 * 📊 Переключатель типов графиков
 *
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 *
 * Этот компонент позволяет переключать тип отображения графика:
 * - Bar (столбчатый) - показывает данные в виде столбцов
 * - Line (линейный) - показывает данные в виде линии
 * - Area (областной) - показывает данные в виде залитой области
 *
 * Используется для разных графиков аналитики.
 */
export function ChartTypeSwitcher({ currentType = 'line', onChange }) {
  const types = [
    { value: 'bar', label: 'Столбцы', icon: BarChart3 },
    { value: 'line', label: 'Линия', icon: LineChart },
    { value: 'area', label: 'Область', icon: Layers },
  ]

  return (
    <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
      {types.map(type => {
        const Icon = type.icon
        const isActive = currentType === type.value

        return (
          <button
            key={type.value}
            onClick={() => onChange(type.value)}
            className={`
              flex items-center justify-center px-2 py-1 rounded-md text-xs font-medium transition-all
              ${
                isActive
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }
            `}
            title={type.label}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden lg:inline ml-1">{type.label}</span>
          </button>
        )
      })}
    </div>
  )
}
