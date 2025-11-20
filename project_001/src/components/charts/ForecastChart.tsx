import { useState, useMemo } from 'react'
import {
  ComposedChart,
  Line,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { ChartTypeSwitcher } from '../ui/ChartTypeSwitcher'
import { EmptyState } from '../ui/EmptyState'
import { ChartIllustration } from '../ui/illustrations'
import { useIsMobile } from '../../hooks/useIsMobile'
import { useResponsiveChartHeight } from '../../hooks/useResponsiveChartHeight'
import {
  useTheme,
  useDailyGoal,
  useWorkScheduleTemplate,
  useWorkScheduleStartDay,
  useCustomWorkDates,
} from '../../store/useSettingsStore'
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  eachDayOfInterval,
  eachMonthOfInterval,
} from 'date-fns'
import { InfoTooltip } from '../ui/InfoTooltip'
import { calculateWorkingDaysInMonth } from '../../utils/calculations'

/**
 * 📊 График прогноза заработка (План/Факт/Прогноз)
 *
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 *
 * Этот график показывает сравнение вашего фактического кумулятивного дохода
 * с планом и прогнозом до конца периода.
 *
 * - План (красный пунктир) - ваш целевой заработок
 * - Факт (зеленая линия) - фактический заработок за прошедшие дни
 * - Прогноз (синяя пунктир) - прогнозируемый заработок до конца периода
 *
 * Помогает понять, выполняете ли вы план и как будет выглядеть итог месяца/года.
 *
 * @param {Array} entries - Отфильтрованные записи
 * @param {string} dateFilter - Фильтр периода ('month', 'year')
 */
export function ForecastChart({ entries, dateFilter = 'month' }) {
  // ✅ ОПТИМИЗАЦИЯ: Используем атомарные селекторы для минимизации ре-рендеров
  const theme = useTheme()
  const isMobile = useIsMobile()
  const chartHeight = useResponsiveChartHeight(350, 280)
  const dailyGoal = useDailyGoal()
  const workScheduleTemplate = useWorkScheduleTemplate()
  const workScheduleStartDay = useWorkScheduleStartDay()
  const customWorkDates = useCustomWorkDates()
  const [chartType, setChartType] = useState('line')

  // Подготовка данных для графика
  const chartData = useMemo(() => {
    if (!entries || entries.length === 0) return []

    const now = new Date()
    const validDailyPlan = typeof dailyGoal === 'number' && dailyGoal > 0 ? dailyGoal : 6000

    if (dateFilter === 'month') {
      const year = now.getFullYear()
      const month = now.getMonth()
      const today = now.getDate()
      const daysInMonth = new Date(year, month + 1, 0).getDate()

      // Группируем записи по дням
      const dailyTotals = {}
      entries.forEach(entry => {
        const entryDate = parseISO(entry.date)
        if (entryDate.getMonth() === month && entryDate.getFullYear() === year) {
          const day = entryDate.getDate()
          dailyTotals[day] = (dailyTotals[day] || 0) + (parseFloat(entry.earned) || 0)
        }
      })

      // Рассчитываем факт и прогноз
      const daysWorked = Object.keys(dailyTotals)
        .map(Number)
        .filter(day => day <= today).length
      const earnedSoFar = Object.values(dailyTotals).reduce((a, b) => a + b, 0)
      const avgDailyEarn = daysWorked > 0 ? earnedSoFar / daysWorked : 0

      // Рассчитываем месячный план на основе рабочих дней (как в PlanFactCompactView)
      const settings = {
        workScheduleTemplate,
        workScheduleStartDay,
        customWorkDates,
      }
      const workingDaysInMonth = calculateWorkingDaysInMonth(year, month, 1, null, settings)
      const monthlyPlan = Math.round(validDailyPlan * workingDaysInMonth)

      let cumulativeActual = 0
      const data = Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1
        // План нарастающим итогом: каждый день добавляется доля плана
        const plan = (day / daysInMonth) * monthlyPlan
        const actual = day <= today ? dailyTotals[day] || 0 : null

        if (day <= today && actual !== null) {
          cumulativeActual += actual
        }

        return {
          day: day.toString(),
          plan,
          actual: day <= today ? cumulativeActual : null,
          forecast: null, // Заполним ниже
        }
      })

      // Рассчитываем прогноз для оставшихся дней (кумулятивно)
      if (avgDailyEarn > 0 && today < daysInMonth) {
        let forecastValue = cumulativeActual
        // i - это индекс в массиве (0-based), day = i + 1
        for (let i = today; i < daysInMonth; i++) {
          forecastValue += avgDailyEarn
          data[i].forecast = forecastValue
        }
      } else if (cumulativeActual > 0) {
        // Если нет данных о средней заработке, прогноз = текущий факт для всех дней
        for (let i = today; i < daysInMonth; i++) {
          data[i].forecast = cumulativeActual
        }
      }

      return data
    } else if (dateFilter === 'year') {
      const year = now.getFullYear()
      const currentMonth = now.getMonth()

      // Группируем записи по месяцам
      const monthlyTotals = {}
      entries.forEach(entry => {
        const entryDate = parseISO(entry.date)
        if (entryDate.getFullYear() === year) {
          const month = entryDate.getMonth()
          monthlyTotals[month] = (monthlyTotals[month] || 0) + (parseFloat(entry.earned) || 0)
        }
      })

      // Рассчитываем средний месячный заработок
      const monthsWorked = Object.keys(monthlyTotals)
        .map(Number)
        .filter(month => month <= currentMonth).length
      const earnedSoFar = Object.values(monthlyTotals).reduce((a, b) => a + b, 0)
      const avgMonthlyEarn = monthsWorked > 0 ? earnedSoFar / monthsWorked : 0
      const monthlyPlan = validDailyPlan * 30 // Примерный план на месяц

      let cumulativeActual = 0
      const data = Array.from({ length: 12 }, (_, i) => {
        const month = i
        const monthName = format(new Date(year, month, 1), 'MMM', {
          locale: {
            localize: {
              month: n =>
                [
                  'Янв',
                  'Фев',
                  'Мар',
                  'Апр',
                  'Май',
                  'Июн',
                  'Июл',
                  'Авг',
                  'Сен',
                  'Окт',
                  'Ноя',
                  'Дек',
                ][n],
            },
          },
        })
        const plan = (month + 1) * monthlyPlan
        const actual = month <= currentMonth ? monthlyTotals[month] || 0 : null

        if (month <= currentMonth && actual !== null) {
          cumulativeActual += actual
        }

        return {
          month: monthName,
          plan,
          actual: month <= currentMonth ? cumulativeActual : null,
          forecast: null,
        }
      })

      // Прогноз для оставшихся месяцев
      if (avgMonthlyEarn > 0 && currentMonth < 11) {
        let lastActual = cumulativeActual
        for (let i = currentMonth + 1; i < 12; i++) {
          lastActual += avgMonthlyEarn
          data[i].forecast = lastActual
        }
      }

      return data
    }

    return []
  }, [entries, dateFilter, dailyGoal])

  // Пустое состояние
  if (chartData.length === 0) {
    return (
      <div className="glass-effect rounded-xl p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold">Прогноз заработка</h2>
            <InfoTooltip text="Сравнение вашего фактического кумулятивного дохода с планом и прогнозом до конца периода." />
          </div>
          <ChartTypeSwitcher currentType={chartType} onChange={setChartType} />
        </div>
        <EmptyState
          illustration={ChartIllustration}
          title="Нет данных для отображения"
          description="Добавьте записи времени"
          variant="compact"
        />
      </div>
    )
  }

  // Кастомный tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-effect rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-sm mb-2">
            {dateFilter === 'month' ? `День ${payload[0].payload.day}` : payload[0].payload.month}
          </p>
          {payload.map((item, index) => {
            if (item.value === null || item.value === undefined) return null
            return (
              <p key={`${item.name}-${item.color}-${index}`} className="text-sm" style={{ color: item.color }}>
                <span className="capitalize">{item.name}: </span>
                <span className="font-medium">{item.value.toLocaleString('ru-RU')} ₽</span>
              </p>
            )
          })}
        </div>
      )
    }
    return null
  }

  const xAxisDataKey = dateFilter === 'month' ? 'day' : 'month'

  // Проверяем, настроен ли dailyGoal
  const isDailyGoalSet = typeof dailyGoal === 'number' && dailyGoal > 0
  const usingDefaultGoal = !isDailyGoalSet

  return (
    <div className="glass-effect rounded-xl p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold">Прогноз заработка</h2>
          <InfoTooltip text="Сравнение вашего фактического кумулятивного дохода с планом и прогнозом до конца периода." />
        </div>
        <ChartTypeSwitcher currentType={chartType} onChange={setChartType} />
      </div>

      {/* Предупреждение о dailyGoal */}
      {usingDefaultGoal && (
        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <span className="font-semibold">⚠️ Внимание:</span> Дневная цель не настроена.
            Используется значение по умолчанию (6000₽/день).
            <span className="ml-1">Настройте дневную цель в настройках для точного прогноза.</span>
          </p>
        </div>
      )}

      <ResponsiveContainer width="100%" height={chartHeight}>
        <ComposedChart data={chartData}>
          <defs>
            <linearGradient id="colorForecastPlan" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorForecastActual" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22C55E" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorForecastForecast" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#E5E7EB'} />
          <XAxis dataKey={xAxisDataKey} stroke="#6B7280" style={{ fontSize: '12px' }} />
          <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: '12px' }} />

          {/* План */}
          {chartType === 'line' ? (
            <Line
              type="monotone"
              dataKey="plan"
              name="План"
              stroke="#EF4444"
              strokeWidth={3}
              strokeDasharray="10 5"
              dot={false}
            />
          ) : chartType === 'area' ? (
            <Area
              type="monotone"
              dataKey="plan"
              name="План"
              stroke="#EF4444"
              strokeWidth={3}
              strokeDasharray="10 5"
              fillOpacity={1}
              fill="url(#colorForecastPlan)"
            />
          ) : (
            <Bar dataKey="plan" name="План" fill="#EF4444" fillOpacity={0.3} />
          )}

          {/* Факт */}
          {chartType === 'line' ? (
            <Line
              type="monotone"
              dataKey="actual"
              name="Факт"
              stroke="#22C55E"
              strokeWidth={4}
              dot={{ fill: '#22C55E', r: 4 }}
            />
          ) : chartType === 'area' ? (
            <Area
              type="monotone"
              dataKey="actual"
              name="Факт"
              stroke="#22C55E"
              strokeWidth={4}
              fillOpacity={1}
              fill="url(#colorForecastActual)"
            />
          ) : (
            <Bar dataKey="actual" name="Факт" fill="#22C55E" />
          )}

          {/* Прогноз */}
          {chartType === 'line' ? (
            <Line
              type="monotone"
              dataKey="forecast"
              name="Прогноз"
              stroke="#3B82F6"
              strokeWidth={2}
              strokeDasharray="2 2"
              dot={{ fill: '#3B82F6', r: 2 }}
            />
          ) : chartType === 'area' ? (
            <Area
              type="monotone"
              dataKey="forecast"
              name="Прогноз"
              stroke="#3B82F6"
              strokeWidth={2}
              strokeDasharray="2 2"
              fillOpacity={1}
              fill="url(#colorForecastForecast)"
            />
          ) : (
            <Bar dataKey="forecast" name="Прогноз" fill="#3B82F6" fillOpacity={0.5} />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
