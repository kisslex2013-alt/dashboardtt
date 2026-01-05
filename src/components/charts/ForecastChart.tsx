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
 * @param {string} dateFilter - Начальный фильтр периода ('month', 'year')
 */
export function ForecastChart({ entries, dateFilter: initialDateFilter = 'month' }) {
  // ✅ ОПТИМИЗАЦИЯ: Используем атомарные селекторы для минимизации ре-рендеров
  const theme = useTheme()
  const isMobile = useIsMobile()
  const chartHeight = useResponsiveChartHeight(350, 280)
  const dailyGoal = useDailyGoal()
  const workScheduleTemplate = useWorkScheduleTemplate()
  const workScheduleStartDay = useWorkScheduleStartDay()
  const customWorkDates = useCustomWorkDates()
  const [chartType, setChartType] = useState('line')
  
  // Внутренний переключатель периода
  const [dateFilter, setDateFilter] = useState<'month' | 'year'>(initialDateFilter as 'month' | 'year')

  // Подготовка данных для графика
  const chartData = useMemo(() => {
    if (!entries || entries.length === 0) return []

    const now = new Date()
    const validDailyPlan = typeof dailyGoal === 'number' && dailyGoal > 0 ? dailyGoal : 6000
    const settings = {
      workScheduleTemplate,
      workScheduleStartDay,
      customWorkDates,
    }

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

      // Рассчитываем факт
      const daysWorked = Object.keys(dailyTotals)
        .map(Number)
        .filter(day => day <= today).length
      const earnedSoFar = Object.values(dailyTotals).reduce((a, b) => a + b, 0)
      const avgDailyEarn = daysWorked > 0 ? earnedSoFar / daysWorked : 0

      // Рассчитываем рабочие дни для плана
      const workingDaysInMonth = calculateWorkingDaysInMonth(year, month, 1, null, settings)
      const monthlyPlan = Math.round(validDailyPlan * workingDaysInMonth)
      
      // Массив флагов рабочих дней
      const workingDaysFlags = Array.from({ length: daysInMonth }, (_, i) => {
        const d = new Date(year, month, i + 1)
        // Простая проверка: если не выходной по 5/2 (для превью-шага)
        // В идеале использовать ту же функцию, что и в календаре
        const dayOfWeek = d.getDay()
        return dayOfWeek !== 0 && dayOfWeek !== 6
      })
      const totalWorkingDays = workingDaysFlags.filter(Boolean).length

      let cumulativeActual = 0
      let cumulativePlan = 0
      let dailyPlanStep = monthlyPlan / (totalWorkingDays || daysInMonth)

      const data = Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1
        // План растет только в рабочие дни
        if (workingDaysFlags[i]) {
          cumulativePlan += dailyPlanStep
        }
        
        const actual = day <= today ? dailyTotals[day] || 0 : null

        if (day <= today && actual !== null) {
          cumulativeActual += actual
        }

        return {
          day: day.toString(),
          plan: Math.round(cumulativePlan),
          actual: day <= today ? cumulativeActual : null,
          forecast: null as number | null,
        }
      })

      // Рассчитываем прогноз (плавное соединение)
      if (today <= daysInMonth) {
        // Точка соединения: сегодняшний факт
        data[today - 1].forecast = cumulativeActual
        
        if (avgDailyEarn > 0 && today < daysInMonth) {
          let forecastValue = cumulativeActual
          for (let i = today; i < daysInMonth; i++) {
            forecastValue += avgDailyEarn
            data[i].forecast = Math.round(forecastValue)
          }
        }
      }

      return data
    } else if (dateFilter === 'year') {
      const year = now.getFullYear()
      const currentMonth = now.getMonth()

      // Группируем записи по месяцам
      const monthlyTotals: Record<number, number> = {}
      entries.forEach(entry => {
        const entryDate = parseISO(entry.date)
        if (entryDate.getFullYear() === year) {
          const month = entryDate.getMonth()
          monthlyTotals[month] = (monthlyTotals[month] || 0) + (parseFloat(String(entry.earned)) || 0)
        }
      })

      // Рассчитываем средний месячный заработок (только по прошедшим месяцам)
      const monthsWithData = Object.keys(monthlyTotals)
        .map(Number)
        .filter(month => month <= currentMonth).length
      const earnedSoFar: number = Object.values(monthlyTotals).reduce((a: number, b: number) => a + b, 0)
      const avgMonthlyEarn = monthsWithData > 0 ? earnedSoFar / monthsWithData : 0

      let cumulativeActual = 0
      let cumulativePlan = 0
      const data = Array.from({ length: 12 }, (_, i) => {
        const month = i
        const monthName = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'][month]
        
        // План на основе рабочих дней каждого месяца
        const workingDays = calculateWorkingDaysInMonth(year, month, 1, null, settings)
        const monthPlan = validDailyPlan * workingDays
        cumulativePlan += monthPlan
        
        const actual = month <= currentMonth ? monthlyTotals[month] || 0 : null

        if (month <= currentMonth && actual !== null) {
          cumulativeActual += actual
        }

        return {
          month: monthName,
          plan: Math.round(cumulativePlan),
          actual: month <= currentMonth ? cumulativeActual : null,
          forecast: null as number | null,
        }
      })

      // Прогноз: начинаем с текущего месяца
      if (currentMonth <= 11) {
        data[currentMonth].forecast = cumulativeActual
        
        if (avgMonthlyEarn > 0) {
          let forecastValue = cumulativeActual
          for (let i = currentMonth + 1; i < 12; i++) {
            forecastValue += avgMonthlyEarn
            data[i].forecast = Math.round(forecastValue)
          }
        }
      }

      return data
    }

    return []
  }, [entries, dateFilter, dailyGoal, workScheduleTemplate, workScheduleStartDay, customWorkDates])

  // Пустое состояние
  if (chartData.length === 0) {
    return (
      <div className="glass-effect rounded-xl p-6 mb-6">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Прогноз заработка</h2>
          <InfoTooltip text="Сравнение вашего фактического кумулятивного дохода с планом и прогнозом до конца периода." />
        </div>
        
        <div className="flex items-center gap-3">
          {/* Переключатель периода */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
            <button
              onClick={() => setDateFilter('month')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                dateFilter === 'month'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Месяц
            </button>
            <button
              onClick={() => setDateFilter('year')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                dateFilter === 'year'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Год
            </button>
          </div>
          
          <ChartTypeSwitcher currentType={chartType} onChange={setChartType} />
        </div>
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

  // Расчёт процента выполнения плана
  const planStatus = useMemo(() => {
    if (chartData.length === 0) return null
    
    // Находим последнюю точку с фактом
    const lastActualPoint = [...chartData].reverse().find(d => d.actual !== null)
    if (!lastActualPoint) return null
    
    const actual = lastActualPoint.actual as number
    const plan = lastActualPoint.plan as number
    
    if (plan === 0) return null
    
    const percent = Math.round((actual / plan) * 100)
    const status = percent >= 100 ? 'success' : percent >= 50 ? 'warning' : 'danger'
    
    return { percent, status, actual, plan }
  }, [chartData])

  return (
    <div className="glass-effect rounded-xl p-6">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Прогноз заработка</h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {dateFilter === 'year' 
              ? `(${new Date().getFullYear()} г.)`
              : `(${['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'][new Date().getMonth()]} ${new Date().getFullYear()})`
            }
          </span>
          <InfoTooltip text="Сравнение вашего фактического кумулятивного дохода с планом и прогнозом до конца периода." />
        </div>
        
        <div className="flex items-center gap-3">
          {/* Переключатель периода */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
            <button
              onClick={() => setDateFilter('month')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                dateFilter === 'month'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Месяц
            </button>
            <button
              onClick={() => setDateFilter('year')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                dateFilter === 'year'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Год
            </button>
          </div>
          
          <ChartTypeSwitcher currentType={chartType} onChange={setChartType} />
          
          {/* Индикатор выполнения плана */}
          {planStatus && (
            <div className={`
              inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
              ${planStatus.status === 'success' 
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                : planStatus.status === 'warning'
                  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }
            `}>
              <span>{planStatus.status === 'success' ? '✓' : planStatus.status === 'warning' ? '◐' : '!'}</span>
              <span>{planStatus.percent}% плана</span>
              <span className="opacity-70">
                ({planStatus.actual >= 1000000 
                  ? (planStatus.actual / 1000000).toFixed(1) + 'млн' 
                  : Math.round(planStatus.actual / 1000) + 'тыс'} / {planStatus.plan >= 1000000 
                  ? (planStatus.plan / 1000000).toFixed(1) + 'млн' 
                  : Math.round(planStatus.plan / 1000) + 'тыс'})
              </span>
            </div>
          )}
        </div>
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
              strokeWidth={3}
              strokeDasharray="5 3"
              dot={{ fill: '#3B82F6', r: 4, strokeWidth: 2, stroke: '#fff' }}
            />
          ) : chartType === 'area' ? (
            <Area
              type="monotone"
              dataKey="forecast"
              name="Прогноз"
              stroke="#3B82F6"
              strokeWidth={3}
              strokeDasharray="5 3"
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
