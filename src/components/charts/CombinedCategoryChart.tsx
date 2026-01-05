import { useState, useMemo } from 'react'
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { useEntries } from '../../store/useEntriesStore'
import { useCategories, useTheme } from '../../store/useSettingsStore'
import { InfoTooltip } from '../ui/InfoTooltip'
import { EmptyState } from '../ui/EmptyState'
import { ChartIllustration } from '../ui/illustrations'
import { ChartTypeSwitcher } from '../ui/ChartTypeSwitcher'
import { useResponsiveChartHeight } from '../../hooks/useResponsiveChartHeight'

type DataMode = 'hours' | 'income'
type ChartType = 'bar' | 'line' | 'area'

interface CombinedCategoryChartProps {
  entries?: any[]
}

/**
 * 📊 Объединённый график по категориям
 * 
 * Переключатель: Часы | Доход
 * - Часы: горизонтальная диаграмма распределения времени
 * - Доход: вертикальная диаграмма с доходами и ставкой
 * 
 * @param {Array} entries - Отфильтрованные записи
 */
export function CombinedCategoryChart({ entries: entriesProp }: CombinedCategoryChartProps) {
  const entriesStore = useEntries()
  const categories = useCategories()
  const theme = useTheme()
  const chartHeight = useResponsiveChartHeight(300, 250)
  
  const [dataMode, setDataMode] = useState<DataMode>('income')
  const [chartType, setChartType] = useState<ChartType>('bar')

  // Используем переданные entries или из store
  const entries = entriesProp !== undefined && entriesProp !== null
    ? entriesProp.length > 0 ? entriesProp : entriesStore.length > 0 ? entriesStore : entriesProp
    : entriesStore

  // Подготовка данных
  const chartData = useMemo(() => {
    if (!entries || entries.length === 0) return []

    const categoryStats: Record<string, {
      name: string
      hours: number
      earned: number
      entryCount: number
      avgRate: number
      color: string
    }> = {}

    entries.forEach((entry: any) => {
      const categoryName = entry.category || 'Другое'

      if (!categoryStats[categoryName]) {
        const categoryData = categories.find(
          cat => cat.name === categoryName || cat.id === categoryName
        )
        categoryStats[categoryName] = {
          name: categoryData?.name || categoryName,
          hours: 0,
          earned: 0,
          entryCount: 0,
          avgRate: 0,
          color: categoryData?.color || '#6B7280',
        }
      }

      const earned = parseFloat(entry.earned) || 0
      let duration = parseFloat(entry.duration) || 0

      if (duration === 0 && entry.start && entry.end) {
        try {
          const [startH, startM] = entry.start.split(':').map(Number)
          const [endH, endM] = entry.end.split(':').map(Number)
          const startMinutes = startH * 60 + startM
          let endMinutes = endH * 60 + endM
          if (endMinutes < startMinutes) endMinutes += 24 * 60
          duration = (endMinutes - startMinutes) / 60
        } catch {
          duration = 0
        }
      }

      categoryStats[categoryName].earned += earned
      categoryStats[categoryName].hours += duration
      categoryStats[categoryName].entryCount += 1
    })

    // Рассчитываем среднюю ставку
    Object.values(categoryStats).forEach(stat => {
      stat.avgRate = stat.hours > 0 ? stat.earned / stat.hours : 0
    })

    // Сортируем по выбранной метрике
    const sortKey = dataMode === 'hours' ? 'hours' : 'earned'
    return Object.values(categoryStats).sort((a, b) => b[sortKey] - a[sortKey])
  }, [entries, categories, dataMode])

  const totalHours = useMemo(() => chartData.reduce((sum, item) => sum + item.hours, 0), [chartData])
  const totalEarned = useMemo(() => chartData.reduce((sum, item) => sum + item.earned, 0), [chartData])

  // Добавляем проценты
  const chartDataWithPercentages = useMemo(() => {
    return chartData.map(item => ({
      ...item,
      hoursPercentage: totalHours > 0 ? ((item.hours / totalHours) * 100).toFixed(1) : '0',
      earnedPercentage: totalEarned > 0 ? ((item.earned / totalEarned) * 100).toFixed(1) : '0',
    }))
  }, [chartData, totalHours, totalEarned])

  // Empty State
  if (chartData.length === 0 || (totalHours === 0 && totalEarned === 0)) {
    return (
      <div className="glass-effect rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold">По категориям</h2>
            <InfoTooltip text="Распределение часов и доходов по категориям работы" />
          </div>
          <TabSwitcher dataMode={dataMode} onChange={setDataMode} />
        </div>
        <EmptyState
          illustration={ChartIllustration}
          title="Нет данных"
          description="Добавьте записи времени"
          variant="compact"
        />
      </div>
    )
  }

  // Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="glass-effect rounded-lg p-3 shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-semibold text-sm mb-2" style={{ color: data.color }}>
            {data.name}
          </p>
          <div className="space-y-1 text-sm">
            <p className="flex justify-between gap-4">
              <span className="text-gray-500">Часов:</span>
              <span className="font-medium">{data.hours.toFixed(1)} ч ({data.hoursPercentage}%)</span>
            </p>
            <p className="flex justify-between gap-4">
              <span className="text-gray-500">Доход:</span>
              <span className="font-medium">{data.earned.toLocaleString('ru-RU')} ₽</span>
            </p>
            <p className="flex justify-between gap-4">
              <span className="text-gray-500">Ставка:</span>
              <span className="font-medium">{data.avgRate.toFixed(0)} ₽/ч</span>
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  const dataKey = dataMode === 'hours' ? 'hours' : 'earned'
  const isHorizontal = dataMode === 'hours'

  return (
    <div className="glass-effect rounded-xl p-6 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold">По категориям</h2>
          <InfoTooltip text="Распределение часов и доходов по категориям работы" />
        </div>
        <div className="flex items-center gap-3">
          <TabSwitcher dataMode={dataMode} onChange={setDataMode} />
          {dataMode === 'income' && (
            <ChartTypeSwitcher currentType={chartType} onChange={(t) => setChartType(t as ChartType)} />
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
        Всего:{' '}
        <span className="font-semibold text-gray-900 dark:text-white">
          {dataMode === 'hours' 
            ? `${totalHours.toFixed(1)} часов`
            : `${totalEarned.toLocaleString('ru-RU')} ₽`
          }
        </span>
      </div>

      {/* Chart */}
      <ResponsiveContainer 
        width="100%" 
        height={isHorizontal ? Math.max(200, chartDataWithPercentages.length * 45) : chartHeight}
      >
        {isHorizontal ? (
          // Горизонтальный BarChart для часов
          <BarChart
            data={chartDataWithPercentages}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={theme === 'dark' ? '#374151' : '#E5E7EB'}
              horizontal={true}
              vertical={false}
            />
            <XAxis type="number" stroke="#6B7280" style={{ fontSize: '12px' }} />
            <YAxis
              type="category"
              dataKey="name"
              stroke="#6B7280"
              style={{ fontSize: '12px' }}
              width={100}
              tickFormatter={(value, index) => {
                const item = chartDataWithPercentages[index]
                return item ? `${item.name} ${item.hoursPercentage}%` : value
              }}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: theme === 'dark' ? 'rgba(55, 65, 81, 0.3)' : 'rgba(229, 231, 235, 0.5)' }}
            />
            <Bar dataKey={dataKey} radius={[0, 8, 8, 0]} animationDuration={800}>
              {chartDataWithPercentages.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        ) : chartType === 'bar' ? (
          <BarChart data={chartDataWithPercentages}>
            <defs>
              <linearGradient id="colorCombinedCategoryBar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.3} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#E5E7EB'} />
            <XAxis dataKey="name" stroke="#6B7280" style={{ fontSize: '11px' }} angle={-35} textAnchor="end" height={70} />
            <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey={dataKey} fill="url(#colorCombinedCategoryBar)" radius={[4, 4, 0, 0]} />
          </BarChart>
        ) : chartType === 'area' ? (
          <AreaChart data={chartDataWithPercentages}>
            <defs>
              <linearGradient id="colorCombinedCategoryArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#E5E7EB'} />
            <XAxis dataKey="name" stroke="#6B7280" style={{ fontSize: '11px' }} angle={-35} textAnchor="end" height={70} />
            <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey={dataKey} stroke="#3B82F6" fillOpacity={1} fill="url(#colorCombinedCategoryArea)" />
          </AreaChart>
        ) : (
          <LineChart data={chartDataWithPercentages}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#E5E7EB'} />
            <XAxis dataKey="name" stroke="#6B7280" style={{ fontSize: '11px' }} angle={-35} textAnchor="end" height={70} />
            <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey={dataKey} stroke="#3B82F6" strokeWidth={3} dot={{ fill: '#3B82F6', r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}

// Компонент переключателя табов
function TabSwitcher({ dataMode, onChange }: { dataMode: DataMode; onChange: (mode: DataMode) => void }) {
  return (
    <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
      <button
        onClick={() => onChange('hours')}
        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
          dataMode === 'hours'
            ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
        }`}
      >
        Часы
      </button>
      <button
        onClick={() => onChange('income')}
        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
          dataMode === 'income'
            ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
        }`}
      >
        Доход
      </button>
    </div>
  )
}
