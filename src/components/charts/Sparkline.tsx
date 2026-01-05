/**
 * 📈 Sparkline — мини-график для quick comparison
 * 
 * Компактный линейный график без осей, идеальный для:
 * - Отображения трендов в карточках
 * - Быстрого визуального сравнения
 * - Дашбордов с ограниченным пространством
 */

import React, { useMemo } from 'react'
import { LineChart, Line, ResponsiveContainer, ReferenceLine, Tooltip } from 'recharts'

export interface SparklineDataPoint {
  value: number
  label?: string
}

interface SparklineProps {
  /** Данные для графика */
  data: SparklineDataPoint[]
  /** Цвет линии (по умолчанию синий) */
  color?: string
  /** Высота графика */
  height?: number
  /** Ширина графика */
  width?: number | string
  /** Показывать ли точку на конце */
  showDot?: boolean
  /** Показывать ли тултип */
  showTooltip?: boolean
  /** Показывать ли референсную линию (среднее) */
  showAverage?: boolean
  /** Формат значения для тултипа */
  valueFormatter?: (value: number) => string
  /** Цвет для положительного тренда */
  positiveColor?: string
  /** Цвет для отрицательного тренда */
  negativeColor?: string
  /** Автоматически определять цвет по тренду */
  autoTrendColor?: boolean
}

export function Sparkline({
  data,
  color = '#3B82F6',
  height = 32,
  width = '100%',
  showDot = true,
  showTooltip = true,
  showAverage = false,
  valueFormatter = (v) => v.toLocaleString('ru-RU'),
  positiveColor = '#10B981',
  negativeColor = '#EF4444',
  autoTrendColor = false,
}: SparklineProps) {
  // Определяем тренд (сравниваем первое и последнее значение)
  const trend = useMemo(() => {
    if (data.length < 2) return 0
    const first = data[0].value
    const last = data[data.length - 1].value
    if (last > first) return 1  // рост
    if (last < first) return -1 // падение
    return 0 // стабильно
  }, [data])

  // Среднее значение
  const average = useMemo(() => {
    if (data.length === 0) return 0
    return data.reduce((sum, d) => sum + d.value, 0) / data.length
  }, [data])

  // Определяем цвет линии
  const lineColor = useMemo(() => {
    if (!autoTrendColor) return color
    if (trend > 0) return positiveColor
    if (trend < 0) return negativeColor
    return color
  }, [autoTrendColor, trend, color, positiveColor, negativeColor])

  // Кастомный тултип
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null
    const { value, label } = payload[0].payload
    return (
      <div className="bg-gray-900/95 border border-gray-700 rounded-lg px-2 py-1 text-white text-xs shadow-xl">
        {label && <span className="text-gray-400 mr-1">{label}:</span>}
        <span className="font-bold">{valueFormatter(value)}</span>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div 
        style={{ height, width: typeof width === 'number' ? width : '100%' }}
        className="flex items-center justify-center text-gray-400 text-xs"
      >
        —
      </div>
    )
  }

  return (
    <div style={{ height, width: typeof width === 'number' ? width : '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          {showAverage && (
            <ReferenceLine
              y={average}
              stroke="#9CA3AF"
              strokeDasharray="2 2"
              strokeWidth={1}
            />
          )}
          <Line
            type="monotone"
            dataKey="value"
            stroke={lineColor}
            strokeWidth={2}
            dot={false}
            activeDot={showDot ? { r: 3, fill: lineColor, stroke: '#fff', strokeWidth: 1 } : false}
            isAnimationActive={false}
          />
          {showTooltip && (
            <Tooltip
              content={<CustomTooltip />}
              cursor={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

/**
 * SparklineCard — карточка с sparkline и значениями
 */
interface SparklineCardProps {
  title: string
  currentValue: number
  previousValue?: number
  data: SparklineDataPoint[]
  valueFormatter?: (value: number) => string
  color?: string
  showChange?: boolean
}

export function SparklineCard({
  title,
  currentValue,
  previousValue,
  data,
  valueFormatter = (v) => v.toLocaleString('ru-RU'),
  color = '#3B82F6',
  showChange = true,
}: SparklineCardProps) {
  const change = previousValue !== undefined ? currentValue - previousValue : 0
  const changePercent = previousValue && previousValue !== 0 
    ? ((currentValue - previousValue) / previousValue) * 100 
    : 0

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{title}</div>
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-gray-900 dark:text-white">
            {valueFormatter(currentValue)}
          </span>
          {showChange && previousValue !== undefined && (
            <span className={`text-xs font-medium ${
              change >= 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              {change >= 0 ? '+' : ''}{changePercent.toFixed(1)}%
            </span>
          )}
        </div>
      </div>
      <Sparkline
        data={data}
        color={color}
        height={28}
        width={80}
        autoTrendColor
        showTooltip={false}
      />
    </div>
  )
}
