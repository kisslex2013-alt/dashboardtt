import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { ChartTypeSwitcher } from '../ui/ChartTypeSwitcher'
import { useEntries } from '../../store/useEntriesStore'
import { useCategories, useTheme } from '../../store/useSettingsStore'
import { parseISO } from 'date-fns'
import { InfoTooltip } from '../ui/InfoTooltip'
import { EmptyState } from '../ui/EmptyState'
import { ChartIllustration } from '../ui/illustrations'
import { ChevronDown } from '../../utils/icons'
import { useIsMobile } from '../../hooks/useIsMobile'
import { useResponsiveChartHeight } from '../../hooks/useResponsiveChartHeight'

/**
 * 📊 Объединенный график анализа дней недели
 *
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 *
 * Этот график объединяет два вида анализа:
 * - Часы работы по дням недели (stacked bar по категориям)
 * - Доход по дням недели (линия)
 *
 * Помогает увидеть связь между отработанными часами и доходом.
 *
 * @param {Array} entries - Отфильтрованные записи (опционально, если не передано - берет из store)
 */
export function WeekdayAnalysisChart({ entries: entriesProp }) {
  // ✅ ОПТИМИЗАЦИЯ: Используем атомарные селекторы для минимизации ре-рендеров
  const entriesStore = useEntries()
  const categories = useCategories()
  const theme = useTheme()
  const isMobile = useIsMobile()
  const chartHeight = useResponsiveChartHeight(350, 280)
  const [metricType, setMetricType] = useState('both') // 'hours', 'earned', 'both'
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
    { value: 'hours', label: 'Часы' },
    { value: 'earned', label: 'Доход' },
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

    // Инициализируем данные для каждого дня недели (Пн-Вс)
    const daysOfWeek = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
    const data = daysOfWeek.map((day, index) => {
      const dayData = {
        day,
        dayIndex: index, // 0 = Понедельник, 6 = Воскресенье
        totalHours: 0,
        totalEarned: 0,
      }

      // Добавляем поля для каждой категории (часы)
      categories.forEach(category => {
        dayData[`hours_${category.name}`] = 0
      })

      return dayData
    })

    // Заполняем данные из entries, группируя по дням недели
    entries.forEach(entry => {
      let entryDate
      try {
        entryDate = parseISO(entry.date)
        if (isNaN(entryDate.getTime())) {
          entryDate = new Date(entry.date)
        }
      } catch (e) {
        entryDate = new Date(entry.date)
      }

      // getDay() возвращает 0 (воскресенье) - 6 (суббота)
      // Преобразуем в 0 (понедельник) - 6 (воскресенье)
      let dayOfWeek = entryDate.getDay() - 1
      if (dayOfWeek === -1) dayOfWeek = 6 // Воскресенье

      const category = entry.category || 'Другое'

      // Считаем часы
      let duration = parseFloat(entry.duration) || 0
      if (duration === 0 && entry.start && entry.end) {
        try {
          const [startH, startM] = entry.start.split(':').map(Number)
          const [endH, endM] = entry.end.split(':').map(Number)
          const startMinutes = startH * 60 + startM
          let endMinutes = endH * 60 + endM
          if (endMinutes < startMinutes) endMinutes += 24 * 60
          duration = (endMinutes - startMinutes) / 60
        } catch (e) {
          duration = 0
        }
      }

      // Считаем доход
      const earned = parseFloat(entry.earned) || 0

      data[dayOfWeek][`hours_${category}`] = (data[dayOfWeek][`hours_${category}`] || 0) + duration
      data[dayOfWeek].totalHours += duration
      data[dayOfWeek].totalEarned += earned
    })

    return data
  }, [entries, categories])

  const totalHours = useMemo(() => {
    return chartData.reduce((sum, day) => sum + day.totalHours, 0)
  }, [chartData])

  const totalEarned = useMemo(() => {
    return chartData.reduce((sum, day) => sum + day.totalEarned, 0)
  }, [chartData])

  const averageHours = totalHours > 0 ? totalHours / 7 : 0
  const averageEarned = totalEarned > 0 ? totalEarned / 7 : 0

  // Пустое состояние
  if (totalHours === 0 && totalEarned === 0) {
    return (
      <div className="glass-effect rounded-xl p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold">Анализ дней недели</h2>
            <InfoTooltip text="Показывает часы работы и доход по дням недели с разбивкой по категориям. Помогает увидеть связь между отработанными часами и доходом." />
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
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const hoursData = payload.filter(item => item.dataKey && item.dataKey.startsWith('hours_'))
      const earnedData = payload.find(item => item.dataKey === 'totalEarned')
      const totalHoursValue = hoursData.reduce((sum, item) => sum + (item.value || 0), 0)

      return (
        <div className="glass-effect rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-sm mb-2">{label}</p>

          {/* Часы по категориям */}
          {hoursData.length > 0 && hoursData.some(item => item.value > 0) && (
            <>
              {hoursData
                .filter(item => item.value > 0)
                .map((item, index) => (
                  <div key={item.dataKey || `${item.name}-${index}`} className="flex justify-between gap-4 text-sm mb-1">
                    <span style={{ color: item.color }}>{item.name.replace('hours_', '')}:</span>
                    <span className="font-medium">{item.value.toFixed(1)}ч</span>
                  </div>
                ))}
              <div className="border-t border-gray-300 dark:border-gray-600 mt-2 pt-2 mb-2 flex justify-between gap-4 text-sm">
                <span className="font-semibold">Всего часов:</span>
                <span className="font-semibold">{totalHoursValue.toFixed(1)}ч</span>
              </div>
            </>
          )}

          {/* Доход */}
          {earnedData && earnedData.value > 0 && (
            <div className="flex justify-between gap-4 text-sm">
              <span className="text-blue-600 dark:text-blue-400 font-semibold">Доход:</span>
              <span className="font-semibold">{earnedData.value.toLocaleString('ru-RU')} ₽</span>
            </div>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <div className="glass-effect rounded-xl p-6 mb-6">
      <div className="flex flex-col gap-2 mb-4">
        {/* Заголовок, статистика и переключатель - в одной строке */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-bold">Анализ дней недели</h2>
            <InfoTooltip text="Показывает часы работы и доход по дням недели с разбивкой по категориям. Помогает увидеть связь между отработанными часами и доходом." />

            {/* Статистика - компактная, в одной строке с заголовком */}
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              {metricType !== 'earned' && (
                <span>
                  Ср: <span className="font-semibold">{averageHours.toFixed(1)} ч</span>
                </span>
              )}
              {metricType === 'both' && <span className="text-gray-400">•</span>}
              {metricType !== 'hours' && (
                <span>
                  Ср:{' '}
                  <span className="font-semibold">{averageEarned.toLocaleString('ru-RU')} ₽</span>
                </span>
              )}
            </div>
          </div>

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
                className="absolute right-0 mt-2 w-40 glass-effect rounded-lg border border-gray-300 dark:border-gray-600 shadow-xl z-[9999] backdrop-blur-lg bg-white/95 dark:bg-gray-800/95 animate-slide-down"
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
        </div>
      </div>

      {/* График на всю ширину — легенда в тултипе при наведении */}
      <ResponsiveContainer width="100%" height={chartHeight}>
        <ComposedChart data={chartData}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={theme === 'dark' ? '#374151' : '#E5E7EB'}
          />
          <XAxis dataKey="day" stroke="#6B7280" style={{ fontSize: '12px' }} />
          <YAxis
            yAxisId="left"
            stroke="#6B7280"
            style={{ fontSize: '12px' }}
            label={{ value: 'Часы', angle: -90, position: 'insideLeft', fontSize: 12 }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#3B82F6"
            style={{ fontSize: '12px' }}
            label={{ value: 'Доход (₽)', angle: 90, position: 'insideRight', fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />

          {/* Reference lines */}
          {metricType !== 'earned' && (
            <ReferenceLine
              yAxisId="left"
              y={averageHours}
              stroke="#F59E0B"
              strokeDasharray="5 5"
              label={{ value: 'Ср. часы', position: 'left', fontSize: 10, fill: '#F59E0B' }}
            />
          )}
          {metricType !== 'hours' && (
            <ReferenceLine
              yAxisId="right"
              y={averageEarned}
              stroke="#3B82F6"
              strokeDasharray="5 5"
              label={{ value: 'Ср. доход', position: 'right', fontSize: 10, fill: '#3B82F6' }}
            />
          )}

          {/* Bars для каждой категории (часы) */}
          {(metricType === 'hours' || metricType === 'both') &&
            categories.map(category => (
              <Bar
                key={category.name}
                yAxisId="left"
                dataKey={`hours_${category.name}`}
                stackId="hours"
                fill={category.color}
                name={category.name}
                radius={[0, 0, 0, 0]}
              />
            ))}

          {/* Line для дохода */}
          {(metricType === 'earned' || metricType === 'both') && (
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="totalEarned"
              name="Доход"
              stroke="#3B82F6"
              strokeWidth={3}
              dot={{ fill: '#3B82F6', r: 4 }}
              activeDot={{ r: 6 }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
