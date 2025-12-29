import { useState, useEffect, memo } from 'react'
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
import { BarChart3 } from '../../utils/icons'
import { ChartTypeSwitcher } from '../ui/ChartTypeSwitcher'
import { useTheme } from '../../store/useSettingsStore'
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
} from 'date-fns'
import { InfoTooltip } from '../ui/InfoTooltip'
import { EmptyState } from '../ui/EmptyState'
import { ChartIllustration } from '../ui/illustrations'
import { EnhancedTooltip } from './EnhancedTooltip'
import { ru } from 'date-fns/locale'
import { useDailyGoal } from '../../store/useSettingsStore'
import { ZoomableChartWrapper } from './ZoomableChartWrapper'
import { ChartContainer } from './ChartContainer'

/**
 * 📊 График динамики заработка по дням
 *
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 *
 * Этот график показывает ваш ежедневный заработок за выбранный период.
 * Можно переключать тип отображения:
 * - Bar (столбцы) - хорошо показывает отдельные дни
 * - Line (линия) - показывает тренд
 * - Area (область) - визуально выделяет объем заработка
 *
 * АДАПТИВНОСТЬ: На мобильных устройствах уменьшена высота графика и упрощена легенда
 *
 * @param {Array} entries - Отфильтрованные записи
 * @param {string} dateFilter - Фильтр периода ('today', 'month', 'year', 'all', 'custom')
 * @param {Object} customDateRange - Кастомный диапазон дат (для 'custom')
 */
import type { TimeEntry } from '../../types'

interface DynamicsChartProps {
  entries: TimeEntry[]
  dateFilter?: string
  customDateRange?: { start: string; end: string }
}

export const DynamicsChart = memo(({
  entries,
  dateFilter = 'month',
  customDateRange = { start: '', end: '' },
}: DynamicsChartProps) => {
  // ✅ ОПТИМИЗАЦИЯ: Используем атомарные селекторы для минимизации ре-рендеров
  const theme = useTheme()
  const dailyGoal = useDailyGoal()
  const isMobile = useIsMobile()
  const chartHeight = useResponsiveChartHeight(350, 280)
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area'>('line')

  // Подготовка данных для графика
  const prepareChartData = () => {
    if (!entries || entries.length === 0) return []

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let startDate, endDate, days

    // Определяем диапазон дат в зависимости от фильтра
    switch (dateFilter) {
      case 'today': {
        const todayStart = new Date(today)
        const todayEnd = new Date(today)
        todayEnd.setHours(23, 59, 59)
        days = eachDayOfInterval({ start: todayStart, end: todayEnd })

        // Для сегодняшнего дня создаем данные по часам
        const hourlyData: any[] = []
        for (let hour = 0; hour < 24; hour++) {
          hourlyData.push({
            time: `${hour.toString().padStart(2, '0')}:00`,
            date: format(today, 'yyyy-MM-dd'),
            earned: 0,
          })
        }

        // Заполняем данные из entries
        entries.forEach(entry => {
          if (entry.date === format(today, 'yyyy-MM-dd')) {
            const startHour = entry.start ? parseInt(String(entry.start).split(':')[0]) : 0
            const earned = parseFloat(String(entry.earned)) || 0

            if (hourlyData[startHour]) {
              hourlyData[startHour].earned += earned
            }
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

      case 'halfMonth1': {
        startDate = new Date(today.getFullYear(), today.getMonth(), 1)
        endDate = new Date(today.getFullYear(), today.getMonth(), 15)
        break
      }

      case 'halfMonth2': {
        startDate = new Date(today.getFullYear(), today.getMonth(), 16)
        endDate = endOfMonth(today)
        break
      }

      case 'all': {
        // Находим самый ранний и поздний день из записей
        const entryDates = entries.map(e => new Date(e.date).getTime())
        startDate = new Date(Math.min(...entryDates))
        endDate = new Date(Math.max(...entryDates))
        break
      }

      case 'custom': {
        if (customDateRange.start && customDateRange.end) {
          startDate = new Date(customDateRange.start)
          endDate = new Date(customDateRange.end)
        } else {
          startDate = startOfMonth(today)
          endDate = endOfMonth(today)
        }
        break
      }

      default: {
        startDate = startOfMonth(today)
        endDate = endOfMonth(today)
      }
    }

    // Создаем массив дней
    days = eachDayOfInterval({ start: startDate, end: endDate })

    // Инициализируем данные для каждого дня
    const data = days.map(day => ({
      date: format(day, 'yyyy-MM-dd'),
      dateLabel: format(day, 'd MMM', { locale: ru }),
      earned: 0,
    }))

    // Заполняем данные из entries
    entries.forEach(entry => {
      const entryDate = format(parseISO(entry.date), 'yyyy-MM-dd')
      const dayIndex = data.findIndex(d => d.date === entryDate)

      if (dayIndex !== -1) {
        const earned = parseFloat(String(entry.earned)) || 0
        data[dayIndex].earned += earned
      }
    })

    return data
  }

  const chartData = prepareChartData()

  // ВИЗУАЛ: Empty State обрабатывается в ChartContainer (empty prop)
  const isEmpty = chartData.length === 0 || chartData.every(day => day.earned === 0)

  // Улучшенный tooltip с сравнением и проверкой цели
  const EnhancedCustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const currentData = payload[0].payload
    const currentValue = payload[0].value || 0
    const currentIndex = chartData.findIndex(d =>
      (dateFilter === 'today' ? d.time === label : d.dateLabel === label)
    )

    // Находим предыдущее значение для сравнения
    let previousValue = null
    if (currentIndex > 0) {
      previousValue = chartData[currentIndex - 1].earned || 0
    }

    return (
      <EnhancedTooltip
        active={active}
        payload={payload.map((item: any) => ({
          ...item,
          unit: '₽',
        }))}
        label={label}
        formatters={{
          label: (label: string) => label,
          earned: (value: number) => value.toLocaleString('ru-RU'),
        }}
        showComparison={currentIndex > 0}
        previousValue={previousValue}
        showGoal={dailyGoal > 0}
        goalValue={dailyGoal}
        additionalInfo={currentValue >= dailyGoal ? '🎉 Отличный день!' : '📊 Продолжай в том же духе!'}
      />
    )
  }

  // Определяем dataKey для оси X в зависимости от фильтра
  const xAxisDataKey = dateFilter === 'today' ? 'time' : 'dateLabel'

  return (
    <ChartContainer
      title="Динамика доходов"
      tooltip="Показывает ваш ежедневный заработок за выбранный период."
      rightControls={<ChartTypeSwitcher currentType={chartType} onChange={setChartType} />}
      empty={isEmpty}
      emptyTitle="Нет данных за выбранный период"
      emptyDescription="Добавьте записи времени за этот период, чтобы увидеть динамику дохода"
    >
      {/* 🔍 NEW: Зум и панорамирование для больших наборов данных */}
      <ZoomableChartWrapper
        dataLength={chartData.length}
        minDataPoints={5}
        enableMouseWheelZoom={true}
      >
        {({ startIndex, endIndex }) => {
          const slicedData = chartData.slice(startIndex, endIndex)

          return (
            <ResponsiveContainer width="100%" height={chartHeight}>
              {chartType === 'bar' ? (
                <BarChart data={slicedData}>
            <defs>
              <linearGradient id="colorEarnedBar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.3} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={theme === 'dark' ? '#374151' : '#E5E7EB'}
            />
            <XAxis
              dataKey={xAxisDataKey}
              stroke="#6B7280"
              style={{ fontSize: '12px' }}
              interval={dateFilter === 'today' ? 2 : 'preserveStartEnd'}
            />
            <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
            <Tooltip content={<EnhancedCustomTooltip />} />
            <Bar dataKey="earned" name="Доход" fill="url(#colorEarnedBar)" radius={[4, 4, 0, 0]} />
          </BarChart>
        ) : chartType === 'area' ? (
          <AreaChart data={slicedData}>
            <defs>
              <linearGradient id="colorEarnedArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={theme === 'dark' ? '#374151' : '#E5E7EB'}
            />
            <XAxis
              dataKey={xAxisDataKey}
              stroke="#6B7280"
              style={{ fontSize: '12px' }}
              interval={dateFilter === 'today' ? 2 : 'preserveStartEnd'}
            />
            <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
            <Tooltip content={<EnhancedCustomTooltip />} />
            <Area
              type="monotone"
              dataKey="earned"
              name="Доход"
              stroke="#3B82F6"
              fillOpacity={1}
              fill="url(#colorEarnedArea)"
            />
          </AreaChart>
        ) : (
          <LineChart data={slicedData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={theme === 'dark' ? '#374151' : '#E5E7EB'}
            />
            <XAxis
              dataKey={xAxisDataKey}
              stroke="#6B7280"
              style={{ fontSize: '12px' }}
              interval={dateFilter === 'today' ? 2 : 'preserveStartEnd'}
            />
            <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
            <Tooltip content={<EnhancedCustomTooltip />} />
            <Line
              type="monotone"
              dataKey="earned"
              name="Доход"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={{ fill: '#3B82F6', r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
          )
        }}
      </ZoomableChartWrapper>
    </ChartContainer>
  )
})
