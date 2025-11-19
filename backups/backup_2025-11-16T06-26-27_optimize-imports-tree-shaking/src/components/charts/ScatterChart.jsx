import { useState, useMemo } from 'react'
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { useTheme } from '../../store/useSettingsStore'
import { parseISO } from 'date-fns'
import { InfoTooltip } from '../ui/InfoTooltip'
import { EmptyState } from '../ui/EmptyState'
import { ChartIllustration } from '../ui/illustrations'
import { useIsMobile } from '../../hooks/useIsMobile'
import { useResponsiveChartHeight } from '../../hooks/useResponsiveChartHeight'

/**
 * 📊 График соотношения часов и дохода (Scatter Chart)
 *
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 *
 * Этот график показывает зависимость дохода от отработанных часов.
 * Каждая точка = один рабочий день.
 *
 * Особенности:
 * - Цвет точки зависит от суммы заработка (от синего к красному)
 * - Размер точки зависит от суммы заработка
 * - Можно настроить зум (масштаб) для осей X и Y
 * - Помогает увидеть эффективность работы (больше часов = больше дохода?)
 *
 * @param {Array} entries - Отфильтрованные записи
 */
export function HoursVsEarningsChart({ entries }) {
  // ✅ ОПТИМИЗАЦИЯ: Используем атомарный селектор для минимизации ре-рендеров
  const theme = useTheme()
  const isMobile = useIsMobile()
  const chartHeight = useResponsiveChartHeight(350, 280)
  const [zoom, setZoom] = useState({ xMin: '', xMax: '', yMin: '', yMax: '' })
  const [domain, setDomain] = useState({ x: ['auto', 'auto'], y: ['auto', 'auto'] })

  /**
   * Рассчитывает длительность в часах между двумя временами
   */
  const calculateDuration = (start, end) => {
    if (!start || !end) return 0

    const [startH, startM] = start.split(':').map(Number)
    const [endH, endM] = end.split(':').map(Number)

    const startMinutes = startH * 60 + startM
    let endMinutes = endH * 60 + endM

    // Если время окончания меньше времени начала, значит прошло через полночь
    if (endMinutes < startMinutes) {
      endMinutes += 24 * 60
    }

    const diffMinutes = endMinutes - startMinutes
    return diffMinutes / 60 // Возвращаем в часах
  }

  // Подготовка данных для scatter графика
  const { scatterData, colorScale } = useMemo(() => {
    if (!entries || entries.length === 0) {
      return { scatterData: [], colorScale: () => '#EF4444' }
    }

    // Группируем записи по дате (каждая точка = один день)
    const dailyData = entries.reduce((acc, entry) => {
      const date = entry.date

      if (!acc[date]) {
        acc[date] = { date, hours: 0, earned: 0 }
      }

      // Считаем часы
      if (entry.duration) {
        acc[date].hours += parseFloat(entry.duration) || 0
      } else if (entry.start && entry.end) {
        acc[date].hours += calculateDuration(entry.start, entry.end)
      }

      // Считаем заработок
      acc[date].earned += parseFloat(entry.earned) || 0

      return acc
    }, {})

    const data = Object.values(dailyData)

    if (data.length === 0) {
      return { scatterData: [], colorScale: () => '#EF4444' }
    }

    // Создаем функцию для цветовой шкалы
    const earnings = data.map(d => d.earned)
    const minEarned = Math.min(...earnings)
    const maxEarned = Math.max(...earnings)

    const getColor = value => {
      if (maxEarned === minEarned) return 'rgb(128, 80, 255)'

      const ratio = (value - minEarned) / (maxEarned - minEarned)
      const blue = Math.round(255 * (1 - ratio))
      const red = Math.round(255 * ratio)

      return `rgb(${red}, 80, ${blue})`
    }

    return { scatterData: data, colorScale: getColor }
  }, [entries])

  // Применяем зум к domain
  const handleApplyZoom = () => {
    setDomain({
      x: [zoom.xMin || 'auto', zoom.xMax || 'auto'],
      y: [zoom.yMin || 'auto', zoom.yMax || 'auto'],
    })
  }

  // Сброс зума
  const handleResetZoom = () => {
    setZoom({ xMin: '', xMax: '', yMin: '', yMax: '' })
    setDomain({ x: ['auto', 'auto'], y: ['auto', 'auto'] })
  }

  // Пустое состояние
  if (scatterData.length === 0) {
    return (
      <div className="glass-effect rounded-xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-xl font-bold">Соотношение Часы vs Доход</h2>
          <InfoTooltip text="Каждая точка - один рабочий день. Размер и цвет точки зависят от суммы заработка. Помогает увидеть зависимость дохода от отработанных часов." />
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
      return (
        <div className="glass-effect rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-sm mb-2">{data.date}</p>
          <p className="text-sm">
            <span className="text-gray-600 dark:text-gray-400">Часы: </span>
            <span className="font-medium">{data.hours.toFixed(2)} ч</span>
          </p>
          <p className="text-sm">
            <span className="text-gray-600 dark:text-gray-400">Доход: </span>
            <span className="font-medium">{data.earned.toLocaleString('ru-RU')} ₽</span>
          </p>
          <p className="text-sm">
            <span className="text-gray-600 dark:text-gray-400">Ставка: </span>
            <span className="font-medium">
              {data.hours > 0 ? (data.earned / data.hours).toFixed(0) : 0} ₽/ч
            </span>
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="glass-effect rounded-xl p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-xl font-bold">Соотношение Часы vs Доход</h2>
        <InfoTooltip text="Каждая точка - один рабочий день. Размер и цвет точки зависят от суммы заработка. Помогает увидеть зависимость дохода от отработанных часов." />
      </div>

      <ResponsiveContainer width="100%" height={chartHeight}>
        <ScatterChart>
          <CartesianGrid stroke={theme === 'dark' ? '#374151' : '#E5E7EB'} />
          <XAxis
            type="number"
            dataKey="hours"
            name="Часы"
            unit=" ч"
            stroke="#6B7280"
            style={{ fontSize: '12px' }}
            domain={domain.x}
            allowDataOverflow={true}
          />
          <YAxis
            type="number"
            dataKey="earned"
            name="Заработано"
            unit=" ₽"
            stroke="#6B7280"
            style={{ fontSize: '12px' }}
            domain={domain.y}
            allowDataOverflow={true}
          />
          <ZAxis type="number" dataKey="earned" range={[100, 1000]} name="Заработано" />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
          <Scatter name="Рабочий день" data={scatterData}>
            {scatterData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colorScale(entry.earned)} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>

      {/* Панель управления зумом */}
      <div className="flex items-center justify-center flex-wrap gap-2 mt-4 text-sm">
        <div className="flex items-center gap-1">
          <label className="text-gray-600 dark:text-gray-400">Часы:</label>
          <input
            type="number"
            value={zoom.xMin}
            onChange={e => setZoom({ ...zoom, xMin: e.target.value })}
            placeholder="Min"
            className="w-16 px-2 py-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-gray-400">-</span>
          <input
            type="number"
            value={zoom.xMax}
            onChange={e => setZoom({ ...zoom, xMax: e.target.value })}
            placeholder="Max"
            className="w-16 px-2 py-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1 flex-wrap">
          <label className="text-gray-600 dark:text-gray-400">Доход:</label>
          <input
            type="number"
            value={zoom.yMin}
            onChange={e => setZoom({ ...zoom, yMin: e.target.value })}
            placeholder="Min"
            className="w-16 px-2 py-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-gray-400">-</span>
          <input
            type="number"
            value={zoom.yMax}
            onChange={e => setZoom({ ...zoom, yMax: e.target.value })}
            placeholder="Max"
            className="w-16 px-2 py-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Кнопки в той же строке */}
          <button
            onClick={handleApplyZoom}
            className="glass-button px-3 py-1 rounded-lg text-xs hover-lift-scale transition-normal ml-2"
          >
            Применить
          </button>

          <button
            onClick={handleResetZoom}
            className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-xs transition-colors hover-lift-scale click-shrink"
          >
            Сброс
          </button>
        </div>
      </div>
    </div>
  )
}
