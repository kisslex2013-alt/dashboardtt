import { useState } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { ChartTypeSwitcher } from '../ui/ChartTypeSwitcher'
import { useTheme } from '../../store/useSettingsStore'
import { useIsMobile } from '../../hooks/useIsMobile'
import { InfoTooltip } from '../ui/InfoTooltip'

/**
 * 📊 График распределения ставок (гистограмма)
 *
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 *
 * Этот график показывает, как часто встречаются разные диапазоны ваших почасовых ставок.
 * Например, если у вас много записей со ставкой 1000-1500₽/ч, это будет видно на графике.
 *
 * Можно переключать тип отображения:
 * - Bar (столбцы) - классическая гистограмма
 * - Line (линия) - показывает частотность плавной линией
 * - Area (область) - визуально выделяет области частотности
 *
 * @param {Array} entries - Отфильтрованные записи
 */
export function RateDistributionChart({ entries }) {
  // ✅ ОПТИМИЗАЦИЯ: Используем атомарный селектор для минимизации ре-рендеров
  const theme = useTheme()
  const isMobile = useIsMobile()
  const [chartType, setChartType] = useState('bar')

  // Подготовка данных для гистограммы
  const prepareChartData = () => {
    if (!entries || entries.length === 0) return []

    // Получаем все ставки из записей
    const rates = entries.map(entry => parseFloat(entry.rate) || 0).filter(rate => rate > 0)

    if (rates.length === 0) return []

    const minRate = Math.min(...rates)
    const maxRate = Math.max(...rates)

    // Если все ставки одинаковые
    if (minRate === maxRate) {
      return [{ range: `${Math.round(minRate)}`, count: rates.length }]
    }

    // Рассчитываем шаг для диапазонов (максимум 8 диапазонов, минимум 100)
    const step = Math.max(100, Math.round((maxRate - minRate) / 8 / 100) * 100)

    // Создаем объект для подсчета частотности
    const bins = {}

    // Инициализируем все диапазоны нулями
    for (let i = Math.floor(minRate / step) * step; i <= maxRate; i += step) {
      const rangeStart = i
      const rangeEnd = i + step - 1
      bins[`${rangeStart}-${rangeEnd}`] = 0
    }

    // Подсчитываем частотность для каждого диапазона
    rates.forEach(rate => {
      const binStart = Math.floor(rate / step) * step
      const range = `${binStart}-${binStart + step - 1}`
      if (bins[range] !== undefined) {
        bins[range]++
      }
    })

    // Преобразуем в массив для графика
    return Object.entries(bins)
      .map(([range, count]) => ({ range, count }))
      .filter(item => item.count > 0) // Убираем пустые диапазоны
  }

  const chartData = prepareChartData()

  // Пустое состояние
  if (chartData.length === 0) {
    return (
      <div className="glass-effect rounded-xl p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Распределение ставок</h2>
          <ChartTypeSwitcher currentType={chartType} onChange={setChartType} />
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
          <p className="text-sm">Нет данных для отображения</p>
          <p className="text-xs mt-2">Добавьте записи со ставками</p>
        </div>
      </div>
    )
  }

  // Кастомный tooltip с адаптивным размером для мобильных
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const {value} = payload[0]
      return (
        <div className={`glass-effect rounded-lg shadow-lg ${isMobile ? 'p-4' : 'p-3'}`}>
          <p className={`font-semibold ${isMobile ? 'text-base mb-3' : 'text-sm mb-2'}`}>
            {payload[0].payload.range} ₽/ч
          </p>
          <p className={isMobile ? 'text-base' : 'text-sm'}>
            <span className="text-green-600 dark:text-green-400">Количество: </span>
            <span className="font-medium">
              {value} {value === 1 ? 'раз' : value < 5 ? 'раза' : 'раз'}
            </span>
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="glass-effect rounded-xl p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold">Распределение ставок</h2>
          <InfoTooltip text="Как часто встречаются разные диапазоны ваших почасовых ставок." />
        </div>
        <ChartTypeSwitcher currentType={chartType} onChange={setChartType} />
      </div>

      <ResponsiveContainer width="100%" height={isMobile ? 280 : 350}>
        {chartType === 'bar' ? (
          <BarChart data={chartData}>
            <defs>
              <linearGradient id="colorRateDistributionBar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.3} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={theme === 'dark' ? '#374151' : '#E5E7EB'}
            />
            <XAxis
              dataKey="range"
              stroke="#6B7280"
              style={{ fontSize: '12px' }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="count"
              name="Кол-во раз"
              fill="url(#colorRateDistributionBar)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        ) : chartType === 'area' ? (
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorRateDistributionArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={theme === 'dark' ? '#374151' : '#E5E7EB'}
            />
            <XAxis
              dataKey="range"
              stroke="#6B7280"
              style={{ fontSize: '12px' }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="count"
              name="Кол-во раз"
              stroke="#10B981"
              fillOpacity={1}
              fill="url(#colorRateDistributionArea)"
            />
          </AreaChart>
        ) : (
          <LineChart data={chartData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={theme === 'dark' ? '#374151' : '#E5E7EB'}
            />
            <XAxis
              dataKey="range"
              stroke="#6B7280"
              style={{ fontSize: '12px' }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="count"
              name="Кол-во раз"
              stroke="#10B981"
              strokeWidth={2}
              dot={{ fill: '#10B981', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}
