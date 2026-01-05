/**
 * 📊 RadarComparisonChart — радарный график для сравнения периодов
 * 
 * Сравнивает метрики текущего периода с предыдущим:
 * - Доход
 * - Часы
 * - Количество записей
 * - Средняя ставка
 * - Продуктивность (часов/день)
 */

import React, { useMemo } from 'react'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts'

export interface PeriodMetrics {
  income: number
  hours: number
  entries: number
  avgRate: number      // средняя ставка (доход/час)
  productivity: number // часов в день (по рабочим дням)
}

interface RadarComparisonChartProps {
  /** Метрики текущего периода */
  current: PeriodMetrics
  /** Метрики предыдущего периода */
  previous: PeriodMetrics
  /** Название текущего периода */
  currentLabel?: string
  /** Название предыдущего периода */
  previousLabel?: string
}

// Названия метрик на русском
const METRIC_LABELS: Record<keyof PeriodMetrics, string> = {
  income: 'Доход',
  hours: 'Часы',
  entries: 'Записи',
  avgRate: 'Ставка ₽/ч',
  productivity: 'Часов/день',
}

export function RadarComparisonChart({
  current,
  previous,
  currentLabel = 'Этот месяц',
  previousLabel = 'Прошлый месяц',
}: RadarComparisonChartProps) {
  // Нормализуем данные для радара (0-100% от максимума)
  const radarData = useMemo(() => {
    const metrics: (keyof PeriodMetrics)[] = ['income', 'hours', 'entries', 'avgRate', 'productivity']
    
    return metrics.map(metric => {
      const currVal = current[metric] || 0
      const prevVal = previous[metric] || 0
      const maxVal = Math.max(currVal, prevVal, 1) // Avoid division by zero
      
      return {
        metric: METRIC_LABELS[metric],
        current: (currVal / maxVal) * 100,
        previous: (prevVal / maxVal) * 100,
        // Сохраняем оригинальные значения для тултипа
        currentRaw: currVal,
        previousRaw: prevVal,
      }
    })
  }, [current, previous])

  // Кастомный тултип
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null
    
    const data = payload[0].payload
    const metric = data.metric
    
    // Форматирование в зависимости от метрики
    const formatValue = (value: number, metricName: string) => {
      if (metricName === 'Доход') return `${value.toLocaleString('ru-RU')} ₽`
      if (metricName === 'Часы' || metricName === 'Часов/день') return `${value.toFixed(1)} ч`
      if (metricName === 'Ставка ₽/ч') return `${value.toFixed(0)} ₽/ч`
      return value.toFixed(0)
    }
    
    return (
      <div className="bg-gray-900/95 border border-gray-700 rounded-xl p-3 text-white text-xs shadow-xl">
        <p className="font-bold mb-2 text-gray-300">{metric}</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span>{currentLabel}:</span>
            <span className="font-bold">{formatValue(data.currentRaw, metric)}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
            <span>{previousLabel}:</span>
            <span className="font-bold">{formatValue(data.previousRaw, metric)}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full w-full min-h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
          <PolarGrid 
            stroke="#374151" 
            strokeOpacity={0.3}
          />
          <PolarAngleAxis 
            dataKey="metric" 
            tick={{ fontSize: 11, fill: '#9CA3AF' }}
            tickLine={false}
          />
          <PolarRadiusAxis 
            angle={90} 
            domain={[0, 100]}
            tick={false}
            axisLine={false}
          />
          <Radar
            name={currentLabel}
            dataKey="current"
            stroke="#3B82F6"
            fill="#3B82F6"
            fillOpacity={0.3}
            strokeWidth={2}
          />
          <Radar
            name={previousLabel}
            dataKey="previous"
            stroke="#A855F7"
            fill="#A855F7"
            fillOpacity={0.15}
            strokeWidth={2}
            strokeDasharray="4 4"
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
            iconType="circle"
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}

/**
 * Вычисляет метрики периода из записей
 */
export function calculatePeriodMetrics(
  entries: Array<{ earned?: number | string; duration?: number | string; date?: string }>,
  workingDaysInPeriod: number = 20
): PeriodMetrics {
  let totalIncome = 0
  let totalHours = 0
  let count = 0

  entries.forEach(entry => {
    const income = typeof entry.earned === 'number' 
      ? entry.earned 
      : parseFloat((entry.earned || '0').toString().replace(/[^\d.-]/g, '')) || 0
    
    const duration = typeof entry.duration === 'number'
      ? entry.duration
      : parseFloat((entry.duration || '0').toString()) || 0

    totalIncome += income
    totalHours += duration
    count++
  })

  return {
    income: totalIncome,
    hours: totalHours,
    entries: count,
    avgRate: totalHours > 0 ? totalIncome / totalHours : 0,
    productivity: workingDaysInPeriod > 0 ? totalHours / workingDaysInPeriod : 0,
  }
}
