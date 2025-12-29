import { useState, memo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Activity } from '../../utils/icons'
import { useEntries } from '../../store/useEntriesStore'
import { useIsMobile } from '../../hooks/useIsMobile'
import { useResponsiveChartHeight } from '../../hooks/useResponsiveChartHeight'
import {
  subDays,
  format,
  eachDayOfInterval,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  startOfDay,
} from 'date-fns'
import { ru } from 'date-fns/locale'
import { InfoTooltip } from '../ui/InfoTooltip'
import { EmptyState } from '../ui/EmptyState'
import { ChartIllustration } from '../ui/illustrations'
import { ZoomableChartWrapper } from './ZoomableChartWrapper'
import { ChartContainer } from './ChartContainer'
import { useTheme } from '../../store/useSettingsStore'
import type { TrendsChartProps } from '../../types'

/**
 * Мультилинейный график трендов
 * - Заработок
 * - Часы работы
 * - Средняя ставка
 * - Переключатель метрик
 *
 * АДАПТИВНОСТЬ: На мобильных устройствах уменьшена высота графика и упрощена легенда
 */
export const TrendsChart = memo(({
  entries: entriesProp,
  dateFilter = 'month',
  customDateRange = { start: '', end: '' },
}: TrendsChartProps) => {
  // ✅ ОПТИМИЗАЦИЯ: Используем атомарный селектор для минимизации ре-рендеров
  const theme = useTheme()
  const entriesStore = useEntries()
  const isMobile = useIsMobile()
  const chartHeight = useResponsiveChartHeight(350, 280)
  const entries = entriesProp || entriesStore // Используем переданные или из store
  const [visibleMetrics, setVisibleMetrics] = useState({
    earned: true,
    hours: true,
    rate: true,
  })

  // Подготовка данных с учетом фильтра периода
  const prepareChartData = () => {
    if (!entries || entries.length === 0) return []

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let startDate, endDate, days

    // Определяем диапазон дат в зависимости от фильтра
    switch (dateFilter) {
      case 'today': {
        startDate = startOfDay(today)
        endDate = new Date(today)
        endDate.setHours(23, 59, 59)
        days = eachDayOfInterval({ start: startDate, end: endDate })

        // Для сегодняшнего дня создаем данные по часам
        const hourlyData: any[] = []
        for (let hour = 0; hour < 24; hour++) {
          hourlyData.push({
            date: `${hour.toString().padStart(2, '0')}:00`,
            fullDate: format(today, 'yyyy-MM-dd'),
            hour,
            earned: 0,
            hours: 0,
            rate: 0,
          })
        }

        entries.forEach(entry => {
          if (entry.date === format(today, 'yyyy-MM-dd')) {
            const startHour = entry.start ? parseInt(String(entry.start).split(':')[0]) : 0
            const earned = parseFloat(String(entry.earned)) || 0
            const duration = parseFloat(String(entry.duration)) || 0

            if (hourlyData[startHour]) {
              hourlyData[startHour].earned += earned
              hourlyData[startHour].hours += duration
            }
          }
        })

        hourlyData.forEach(hour => {
          if (hour.hours > 0) {
            hour.rate = hour.earned / hour.hours
          }
        })

        return hourlyData
      }

      case 'month': {
        startDate = startOfMonth(today)
        endDate = endOfMonth(today)
        break
      }

      case 'year': {
        startDate = startOfYear(today)
        endDate = endOfYear(today)
        break
      }

      case 'all': {
        const entryDates = entries.map(e => parseISO(e.date).getTime())
        startDate = new Date(Math.min(...entryDates))
        endDate = new Date(Math.max(...entryDates))
        break
      }

      case 'custom': {
        if (customDateRange.start && customDateRange.end) {
          startDate = parseISO(customDateRange.start)
          endDate = parseISO(customDateRange.end)
        } else {
          // Fallback на месяц если custom не задан
          startDate = startOfMonth(today)
          endDate = endOfMonth(today)
        }
        break
      }

      default: {
        // По умолчанию - последние 30 дней
        startDate = subDays(today, 29)
        endDate = today
        break
      }
    }

    days = eachDayOfInterval({ start: startDate, end: endDate })

    // Инициализируем данные для каждого дня
    const data = days.map(day => ({
      date: format(day, 'd MMM', { locale: ru }),
      fullDate: format(day, 'yyyy-MM-dd'),
      earned: 0,
      hours: 0,
      rate: 0,
    }))

    // Заполняем данные из entries
    entries.forEach(entry => {
      const entryDate = format(parseISO(entry.date), 'yyyy-MM-dd')
      const dayIndex = data.findIndex(d => d.fullDate === entryDate)

      if (dayIndex !== -1) {
        const earned = parseFloat(String(entry.earned)) || 0
        const duration = parseFloat(String(entry.duration)) || 0

        data[dayIndex].earned += earned
        data[dayIndex].hours += duration
      }
    })

    // Рассчитываем среднюю ставку для каждого дня
    data.forEach(day => {
      if (day.hours > 0) {
        day.rate = day.earned / day.hours
      }
    })

    return data
  }

  const chartData = prepareChartData()

  // Определяем заголовок в зависимости от фильтра
  const getChartTitle = () => {
    switch (dateFilter) {
      case 'today':
        return 'Тренды за сегодня'
      case 'month':
        return 'Тренды за месяц'
      case 'year':
        return 'Тренды за год'
      case 'all':
        return 'Тренды за весь период'
      case 'custom':
        return 'Тренды за выбранный период'
      default:
        return 'Тренды за 30 дней'
    }
  }

  // ВИЗУАЛ: Empty State обрабатывается в ChartContainer (empty prop)
  const isEmpty = chartData.every(day => day.earned === 0 && day.hours === 0)

  // Переключатель метрик
  const toggleMetric = (metric: keyof typeof visibleMetrics) => {
    setVisibleMetrics(prev => ({
      ...prev,
      [metric]: !prev[metric],
    }))
  }

  // Кастомный tooltip с адаптивным размером для мобильных
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={`glass-effect rounded-lg shadow-lg ${isMobile ? 'p-4' : 'p-3'}`}>
          <p className={`font-semibold ${isMobile ? 'text-base mb-3' : 'text-sm mb-2'}`}>{label}</p>
          {payload.map((item: any, index: number) => (
            <div
              key={`${item.dataKey || item.name}-${item.color || index}`}
              className={`flex justify-between gap-4 ${isMobile ? 'text-base' : 'text-sm'}`}
            >
              <span style={{ color: item.color }}>{item.name}:</span>
              <span className="font-medium">
                {item.dataKey === 'earned' && `${item.value.toFixed(2)} ₽`}
                {item.dataKey === 'hours' && `${item.value.toFixed(1)} ч`}
                {item.dataKey === 'rate' && `${item.value.toFixed(0)} ₽/ч`}
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <ChartContainer
      title={getChartTitle()}
      empty={isEmpty}
      emptyTitle="Нет данных за выбранный период"
      emptyDescription="Добавьте записи времени, чтобы увидеть тренды"
      rightControls={
        <div className="flex items-center gap-4">
          {!isMobile && (
            <div className="flex gap-2">
              <label className="flex items-center gap-1 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={visibleMetrics.earned}
                  onChange={() => toggleMetric('earned')}
                  className="w-4 h-4 text-blue-500 rounded focus:ring-blue-500"
                />
                <span className="text-gray-700 dark:text-gray-300">Заработок</span>
              </label>
              <label className="flex items-center gap-1 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={visibleMetrics.hours}
                  onChange={() => toggleMetric('hours')}
                  className="w-4 h-4 text-green-500 rounded focus:ring-green-500"
                />
                <span className="text-gray-700 dark:text-gray-300">Часы</span>
              </label>
              <label className="flex items-center gap-1 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={visibleMetrics.rate}
                  onChange={() => toggleMetric('rate')}
                  className="w-4 h-4 text-yellow-500 rounded focus:ring-yellow-500"
                />
                <span className="text-gray-700 dark:text-gray-300">Ставка</span>
              </label>
            </div>
          )}
        </div>
      }
      tooltip="Совмещенный график дохода, часов работы и почасовой ставки для сравнения трендов за выбранный период."
    >
      <ZoomableChartWrapper
        dataLength={chartData.length}
        minDataPoints={5}
        enableMouseWheelZoom={true}
      >
        {({ startIndex, endIndex }) => (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <LineChart data={chartData.slice(startIndex, endIndex)}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#E5E7EB'} />
              <XAxis
                dataKey="date"
                stroke="#6B7280"
                style={{ fontSize: '11px' }}
                interval="preserveStartEnd"
              />
              <YAxis
                yAxisId="left"
                stroke="#6B7280"
                style={{ fontSize: '12px' }}
                label={{ value: '₽ / ч', angle: -90, position: 'insideLeft' }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#6B7280"
                style={{ fontSize: '12px' }}
              />
              <Tooltip content={<CustomTooltip />} />
              {!isMobile && <Legend wrapperStyle={{ fontSize: '12px' }} iconType="line" />}

              {visibleMetrics.earned && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="earned"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  name="Заработок (₽)"
                  dot={{ fill: '#3B82F6', r: 3 }}
                  activeDot={{ r: 5 }}
                  animationDuration={1000}
                />
              )}

              {visibleMetrics.hours && (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="hours"
                  stroke="#10B981"
                  strokeWidth={2}
                  name="Часы работы"
                  dot={{ fill: '#10B981', r: 3 }}
                  activeDot={{ r: 5 }}
                  animationDuration={1000}
                />
              )}

              {visibleMetrics.rate && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="rate"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  name="Средняя ставка (₽/ч)"
                  dot={{ fill: '#F59E0B', r: 3 }}
                  activeDot={{ r: 5 }}
                  animationDuration={1000}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </ZoomableChartWrapper>
    </ChartContainer>
  )
})
