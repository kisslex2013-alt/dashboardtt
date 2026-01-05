import React from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, LineChart, Line } from 'recharts'

export interface TrendData {
  date: string
  monthName: string
  fullDate: string
  income: number
  hours: number
}

export type TrendChartType = 'area' | 'bar' | 'line'

interface TrendChartProps {
  data: TrendData[]
  type: 'income' | 'hours'
  visType?: TrendChartType
}

export function TrendChart({ data, type, visType = 'area' }: TrendChartProps) {
  const formatValue = (val: number) => {
    if (type === 'income') {
      if (val >= 1000000) return (val / 1000000).toFixed(1) + 'млн'
      if (val >= 1000) return (val / 1000).toFixed(0) + 'к'
      return val.toString()
    }
    return val.toFixed(0) + 'ч'
  }

  const formatTooltipValue = (val: number) => {
    if (type === 'income') return val.toLocaleString('ru-RU') + ' ₽'
    return val.toFixed(1) + ' ч'
  }

  const commonProps = {
    data: data,
    margin: { top: 10, right: 10, left: -20, bottom: 0 },
  }

  const color = "#8B5CF6"

  const renderContent = () => {
    switch (visType) {
        case 'bar':
             return (
                <BarChart {...commonProps} barCategoryGap={20}>
                    {renderAxes()}
                    <Tooltip {...tooltipProps} />
                    <Bar dataKey={type} fill={color} radius={[4, 4, 0, 0]} />
                </BarChart>
             )
        case 'line':
            return (
                <LineChart {...commonProps}>
                    {renderAxes()}
                    <Tooltip {...tooltipProps} />
                    <Line type="monotone" dataKey={type} stroke={color} strokeWidth={3} dot={{ r: 4, fill: color }} activeDot={{ r: 6 }} />
                </LineChart>
            )
        case 'area':
        default:
            return (
                 <AreaChart {...commonProps}>
                    <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={color} stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    {renderAxes()}
                    <Tooltip {...tooltipProps} />
                    <Area 
                        type="monotone" 
                        dataKey={type} 
                        stroke={color} 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorValue)" 
                    />
                </AreaChart>
            )
    }
  }

  const renderAxes = () => (
    <>
      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
      <XAxis 
        dataKey="monthName" 
        axisLine={false}
        tickLine={false}
        tick={{ fontSize: 12, fill: '#9CA3AF' }}
      />
      <YAxis 
        hide={false}
        axisLine={false}
        tickLine={false}
        tick={{ fontSize: 10, fill: '#9CA3AF' }}
        tickFormatter={formatValue}
      />
    </>
  )

  const tooltipProps = {
    labelFormatter: (label: any, payload: any) => payload[0]?.payload.fullDate || label,
    cursor: { stroke: '#8B5CF6', strokeWidth: 1, strokeDasharray: '4 4', fill: 'rgba(139, 92, 246, 0.05)' },
    contentStyle: { 
        backgroundColor: 'rgba(17, 24, 39, 0.95)', 
        borderColor: 'rgba(75, 85, 99, 0.4)',
        borderRadius: '0.75rem',
        color: '#F3F4F6',
        fontSize: '12px',
        padding: '8px 12px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
    },
    itemStyle: { color: '#E5E7EB' },
    formatter: (value: number) => [formatTooltipValue(value), type === 'income' ? 'Доход' : 'Часы']
  }

  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        {renderContent()}
      </ResponsiveContainer>
    </div>
  )
}
