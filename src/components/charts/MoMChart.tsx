import React from 'react'
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'
import { ComparisonResult } from '../../utils/comparativeCalculations'
import { Sparkline, SparklineDataPoint } from './Sparkline'

interface MoMChartProps {
  data: ComparisonResult
  type: 'income' | 'hours'
  /** Данные для sparkline (опционально) */
  sparklineData?: SparklineDataPoint[]
}

export function MoMChart({ data, type, sparklineData }: MoMChartProps) {
  const current = type === 'income' ? data.current.income : data.current.hours
  const previous = type === 'income' ? data.previous.income : data.previous.hours
  const percent = type === 'income' ? data.percentChange.income : data.percentChange.hours
  const absolute = type === 'income' ? data.absoluteChange.income : data.absoluteChange.hours

  const isPositive = percent > 0
  const isZero = percent === 0

  const formatValue = (val: number) => {
    if (type === 'income') {
      return val.toLocaleString('ru-RU') + ' ₽'
    }
    return val.toFixed(1) + ' ч'
  }

  const formatPercent = (val: number) => {
    return Math.abs(val).toFixed(1) + '%'
  }

  return (
    <div className="flex flex-col h-full justify-center">
      <div className="flex items-end gap-3 mb-2">
        <span className="text-3xl font-bold text-gray-900 dark:text-white">
          {formatValue(current)}
        </span>
        <div 
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-medium mb-1
            ${isPositive 
              ? 'bg-green-500/10 text-green-600 dark:text-green-400' 
              : isZero
                ? 'bg-gray-500/10 text-gray-600 dark:text-gray-400'
                : 'bg-red-500/10 text-red-600 dark:text-red-400'
            }`}
        >
          {isPositive ? <ArrowUpRight className="w-4 h-4" /> : isZero ? <Minus className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
          <span>{formatPercent(percent)}</span>
        </div>
      </div>
      
      <div className="text-sm text-gray-500 dark:text-gray-400 flex justify-between items-center">
        <span>В прошлом месяце: {formatValue(previous)}</span>
        <span className={`${isPositive ? 'text-green-600 dark:text-green-400' : isZero ? 'text-gray-500' : 'text-red-600 dark:text-red-400'}`}>
          {isPositive ? '+' : ''}{formatValue(absolute)}
        </span>
      </div>
      
      {/* Sparkline или Simple Bar */}
      <div className="mt-4">
        {sparklineData && sparklineData.length > 0 ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Тренд:</span>
            <Sparkline
              data={sparklineData}
              height={32}
              width="100%"
              autoTrendColor
              showTooltip
              valueFormatter={(v) => type === 'income' ? `${v.toLocaleString('ru-RU')} ₽` : `${v.toFixed(1)} ч`}
            />
          </div>
        ) : (
          <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden flex relative">
            {/* Previous Month Marker (Background Bar) */}
            <div className="absolute top-0 bottom-0 left-0 bg-gray-300 dark:bg-gray-600 w-full opacity-30"></div>
            
            {/* Current Bar */}
            <div 
              className={`h-full rounded-full transition-all duration-500 ${isPositive ? 'bg-green-500' : 'bg-red-500'}`}
              style={{ width: `${Math.min(100, (current / (Math.max(current, previous) || 1)) * 100)}%` }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
