import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import {
  ComposedChart,
  Bar,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { ChartTypeSwitcher } from '../ui/ChartTypeSwitcher'
import { useEntries } from '../../store/useEntriesStore'
import { useTheme } from '../../store/useSettingsStore'
import { InfoTooltip } from '../ui/InfoTooltip'
import { EmptyState } from '../ui/EmptyState'
import { ChartIllustration } from '../ui/illustrations'
import { ChevronDown } from '../../utils/icons'
import { useIsMobile } from '../../hooks/useIsMobile'
import { useResponsiveChartHeight } from '../../hooks/useResponsiveChartHeight'

/**
 * 📊 Объединенный график анализа часов дня
 *
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 *
 * Этот график объединяет два вида анализа:
 * - Доход по часам дня (столбцы)
 * - Средняя ставка по часам дня (линия)
 *
 * Помогает увидеть связь между доходом и ставкой в разные часы дня.
 *
 * @param {Array} entries - Отфильтрованные записи (опционально, если не передано - берет из store)
 */
export function HourAnalysisChart({ entries: entriesProp }) {
  // ✅ ОПТИМИЗАЦИЯ: Используем атомарные селекторы для минимизации ре-рендеров
  const entriesStore = useEntries()
  const theme = useTheme()
  const isMobile = useIsMobile()
  const chartHeight = useResponsiveChartHeight(350, 280)
  const [metricType, setMetricType] = useState('both') // 'earned', 'rate', 'both'
  const [chartType, setChartType] = useState('bar') // Для доходов: bar/area
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const buttonRef = useRef(null)

  // Обработчик клика вне dropdown
  const handleClickOutside = useCallback(event => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target) &&
      buttonRef.current &&
      !buttonRef.current.contains(event.target)
    ) {
      setIsDropdownOpen(false)
    }
  }, [])

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [handleClickOutside])

  const metricOptions = [
    { value: 'both', label: 'Оба' },
    { value: 'earned', label: 'Доход' },
    { value: 'rate', label: 'Ставка' },
  ]

  const currentLabel = metricOptions.find(opt => opt.value === metricType)?.label || 'Оба'

  // Логика выбора данных
  const entries =
    entriesProp !== undefined && entriesProp !== null
      ? entriesProp.length > 0
        ? entriesProp
        : entriesStore.length > 0
          ? entriesStore
          : entriesProp
      : entriesStore

  // Подготовка данных для графика (мемоизирована для производительности)
  const chartData = useMemo(() => {
    if (!entries || entries.length === 0) return []

    // Инициализируем данные для каждого часа (0-23)
    const hourlyData = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      hourLabel: `${i.toString().padStart(2, '0')}:00`,
      earned: 0,
      totalHours: 0,
      totalEarned: 0,
      entryCount: 0,
      avgRate: 0,
    }))

    // Агрегируем данные по часам
    entries.forEach(entry => {
      if (!entry.start) return

      const startHour = parseInt(entry.start.split(':')[0])
      if (isNaN(startHour) || startHour < 0 || startHour > 23) return

      const earned = parseFloat(entry.earned) || 0
      let duration = 0

      // Рассчитываем длительность
      if (entry.duration) {
        duration = parseFloat(entry.duration) || 0
      } else if (entry.start && entry.end) {
        const [startH, startM] = entry.start.split(':').map(Number)
        const [endH, endM] = entry.end.split(':').map(Number)
        const startMinutes = startH * 60 + startM
        let endMinutes = endH * 60 + endM
        if (endMinutes < startMinutes) endMinutes += 24 * 60
        duration = (endMinutes - startMinutes) / 60
      }

      if (duration > 0) {
        // Для дохода: распределяем пропорционально, если работа длится несколько часов
        const earnedPerHour = duration > 0 ? earned / duration : 0
        const endHour = entry.end ? parseInt(entry.end.split(':')[0]) : startHour

        // Если работа в пределах одного часа
        if (startHour === endHour) {
          hourlyData[startHour].earned += earned
          hourlyData[startHour].totalHours += duration
          hourlyData[startHour].totalEarned += earned
          hourlyData[startHour].entryCount += 1
        } else {
          // Распределяем заработок пропорционально между часами
          for (let h = startHour; h <= endHour && h < 24; h++) {
            hourlyData[h].earned += earnedPerHour
            hourlyData[h].totalHours += duration
            hourlyData[h].totalEarned += earned
            hourlyData[h].entryCount += 1
          }
        }
      }
    })

    // Рассчитываем среднюю ставку для каждого часа
    hourlyData.forEach(hourData => {
      if (hourData.totalHours > 0) {
        hourData.avgRate = hourData.totalEarned / hourData.totalHours
      }
    })

    // Округляем значения
    return hourlyData.map(item => ({
      ...item,
      earned: parseFloat(item.earned.toFixed(2)),
      avgRate: parseFloat(item.avgRate.toFixed(0)),
    }))
  }, [entries])

  const maxEarned = Math.max(...chartData.map(d => d.earned), 0)
  const maxRate = Math.max(...chartData.map(d => d.avgRate), 0)
  const totalEarned = chartData.reduce((sum, d) => sum + d.earned, 0)

  // Функция для определения цвета столбца (для дохода)
  const getBarColor = value => {
    const intensity = maxEarned > 0 ? value / maxEarned : 0
    if (intensity > 0.7) return '#10B981' // Зеленый - высокая продуктивность
    if (intensity > 0.4) return '#3B82F6' // Синий - средняя
    if (intensity > 0.1) return '#F59E0B' // Желтый - низкая
    return '#9CA3AF' // Серый - нет данных
  }

  // Пустое состояние
  if (totalEarned === 0 && chartData.every(h => h.avgRate === 0)) {
    return (
      <div className="glass-effect rounded-xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-xl font-bold">Анализ часов дня</h2>
          <InfoTooltip text="Показывает доход и среднюю ставку по часам дня. Помогает увидеть связь между доходом и ставкой в разные часы." />
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
      const data = payload[0].payload
      const earnedItem = payload.find(item => item.dataKey === 'earned')
      const rateItem = payload.find(item => item.dataKey === 'avgRate')
      const percentage =
        totalEarned > 0 && earnedItem ? ((earnedItem.value / totalEarned) * 100).toFixed(1) : 0

      return (
        <div className="glass-effect rounded-lg p-3 shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-semibold text-sm mb-2">{data.hourLabel}</p>
          <div className="space-y-1">
            {earnedItem && (
              <>
                <p className="text-sm flex items-center justify-between gap-4">
                  <span className="text-gray-600 dark:text-gray-400">Заработано:</span>
                  <span className="font-medium">{earnedItem.value.toFixed(2)} ₽</span>
                </p>
                <p className="text-sm flex items-center justify-between gap-4">
                  <span className="text-gray-600 dark:text-gray-400">Доля:</span>
                  <span className="font-medium">{percentage}%</span>
                </p>
              </>
            )}
            {rateItem && (
              <p className="text-sm flex items-center justify-between gap-4">
                <span className="text-gray-600 dark:text-gray-400">Средняя ставка:</span>
                <span className="font-medium">{rateItem.value.toFixed(0)} ₽/ч</span>
              </p>
            )}
            <p className="text-sm flex items-center justify-between gap-4">
              <span className="text-gray-600 dark:text-gray-400">Записей:</span>
              <span className="font-medium">{data.entryCount}</span>
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="glass-effect rounded-xl p-6 mb-6">
      <div className="flex flex-col gap-2 mb-4">
        {/* Заголовок и переключатели - в одной строке */}
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-xl font-bold">Анализ часов дня</h2>
          <InfoTooltip text="Показывает доход и среднюю ставку по часам дня. Помогает увидеть связь между доходом и ставкой в разные часы." />

          {/* Переключатели метрик и типа графика - в одной строке */}
          <div className="flex items-center gap-2">
            {/* Переключатель метрик - кастомный dropdown */}
            <div className="relative">
              <button
                ref={buttonRef}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="glass-effect px-2.5 py-1.5 pr-8 rounded-lg border border-gray-300 dark:border-gray-600 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-left transition-normal hover-lift-scale click-shrink min-w-[100px]"
              >
                {currentLabel}
                <ChevronDown
                  className={`absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Dropdown меню */}
              {isDropdownOpen && (
                <div
                  ref={dropdownRef}
                  className={`absolute mt-2 w-40 glass-effect rounded-lg border border-gray-300 dark:border-gray-600 shadow-xl z-[9999] backdrop-blur-lg bg-white/95 dark:bg-gray-800/95 animate-slide-down ${isMobile ? 'left-0' : 'right-0'}`}
                >
                  {metricOptions.map(option => (
                    <div
                      key={option.value}
                      onClick={() => {
                        setMetricType(option.value)
                        setIsDropdownOpen(false)
                      }}
                      className={`flex items-center justify-between px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 last:border-b-0 ${
                        metricType === option.value ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                    >
                      <span className="text-xs">{option.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Переключатель типа графика (только для дохода) */}
            {(metricType === 'earned' || metricType === 'both') && (
              <ChartTypeSwitcher currentType={chartType} onChange={type => setChartType(type)} />
            )}
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={chartHeight}>
        <ComposedChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#E5E7EB'} />
          <XAxis
            dataKey="hourLabel"
            stroke="#6B7280"
            style={{ fontSize: '11px' }}
            interval={1}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis
            yAxisId="left"
            stroke="#6B7280"
            style={{ fontSize: '12px' }}
            label={{ value: 'Доход (₽)', angle: -90, position: 'insideLeft', fontSize: 12 }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#F59E0B"
            style={{ fontSize: '12px' }}
            label={{ value: 'Ставка (₽/ч)', angle: 90, position: 'insideRight', fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            wrapperStyle={{ fontSize: '12px', paddingBottom: '10px' }}
            iconType="square"
          />

          {/* Доход - Bar, Line или Area */}
          {(metricType === 'earned' || metricType === 'both') && chartType === 'bar' && (
            <Bar
              yAxisId="left"
              dataKey="earned"
              name="Доход"
              radius={[8, 8, 0, 0]}
              animationDuration={800}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.earned)} />
              ))}
            </Bar>
          )}

          {(metricType === 'earned' || metricType === 'both') && chartType === 'line' && (
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="earned"
              name="Доход"
              stroke="#3B82F6"
              strokeWidth={3}
              dot={{ fill: '#3B82F6', r: 4 }}
              activeDot={{ r: 6 }}
            />
          )}

          {(metricType === 'earned' || metricType === 'both') && chartType === 'area' && (
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="earned"
              name="Доход"
              stroke="#3B82F6"
              fill="#3B82F6"
              fillOpacity={0.6}
            />
          )}

          {/* Ставка - Line */}
          {(metricType === 'rate' || metricType === 'both') && (
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="avgRate"
              name="Средняя ставка"
              stroke="#F59E0B"
              strokeWidth={3}
              dot={{ fill: '#F59E0B', r: 4 }}
              activeDot={{ r: 6 }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>

      {/* Легенда (только для дохода) */}
      {(metricType === 'earned' || metricType === 'both') && chartType === 'bar' && (
        <div className="mt-4 flex flex-wrap gap-3 justify-center text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>Высокая продуктивность</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span>Средняя</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span>Низкая</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-400" />
            <span>Нет данных</span>
          </div>
        </div>
      )}
    </div>
  )
}
