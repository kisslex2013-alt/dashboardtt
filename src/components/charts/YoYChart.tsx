import React from 'react'
import { 
  BarChart, Bar, 
  AreaChart, Area, 
  LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid 
} from 'recharts'

interface YoYData {
  year: number
  income: number
  hours: number
}

export type YoYChartType = 'bar' | 'area' | 'line'

interface YoYChartProps {
  data: YoYData[]
  type: 'income' | 'hours'
  visType?: YoYChartType
}

export function YoYChart({ data, type, visType = 'bar' }: YoYChartProps) {
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

  // Find max value for domain
  const maxValue = Math.max(...data.map(d => type === 'income' ? d.income : d.hours), 0)

  // Common props for charts
  const commonProps = {
    data,
    margin: { top: 10, right: 10, left: -20, bottom: 0 }
  }

  // Common styles
  const axisStyle = { fontSize: 12, fill: '#9CA3AF' }
  const gridStyle = { strokeDasharray: "3 3", vertical: false, opacity: 0.1 }
  const mainColor = '#8B5CF6'
  const currentYearColor = '#8B5CF6'
  const pastYearColor = '#C4B5FD'

  const tooltipProps = {
    cursor: { fill: 'rgba(255, 255, 255, 0.1)' },
    contentStyle: { 
      backgroundColor: 'rgba(17, 24, 39, 0.95)', 
      borderColor: 'rgba(75, 85, 99, 0.4)',
      borderRadius: '0.75rem',
      color: '#F3F4F6',
      fontSize: '12px',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      padding: '8px 12px'
    },
    itemStyle: { color: '#E5E7EB' }, // Force light text color
    formatter: (value: number) => [formatTooltipValue(value), type === 'income' ? 'Доход' : 'Часы']
  }

  const renderChart = () => {
    if (visType === 'area') {
      return (
        <AreaChart {...commonProps}>
          <defs>
            <linearGradient id="colorValueYoY" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={mainColor} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={mainColor} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid {...gridStyle} />
          <XAxis dataKey="year" axisLine={false} tickLine={false} tick={axisStyle} />
          <YAxis hide={false} axisLine={false} tickLine={false} tick={axisStyle} tickFormatter={formatValue} domain={[0, maxValue * 1.1]} />
          <Tooltip {...tooltipProps} cursor={{ stroke: mainColor, strokeWidth: 1, strokeDasharray: '4 4' }} />
          <Area type="monotone" dataKey={type} stroke={mainColor} fill="url(#colorValueYoY)" strokeWidth={2} />
        </AreaChart>
      )
    }

    if (visType === 'line') {
      return (
        <LineChart {...commonProps}>
          <CartesianGrid {...gridStyle} />
          <XAxis dataKey="year" axisLine={false} tickLine={false} tick={axisStyle} />
          <YAxis hide={false} axisLine={false} tickLine={false} tick={axisStyle} tickFormatter={formatValue} domain={[0, maxValue * 1.1]} />
          <Tooltip {...tooltipProps} cursor={{ stroke: mainColor, strokeWidth: 1, strokeDasharray: '4 4' }} />
          <Line type="monotone" dataKey={type} stroke={mainColor} strokeWidth={3} dot={{ r: 4, fill: mainColor, strokeWidth: 2, stroke: '#fff' }} />
        </LineChart>
      )
    }

    // Default Bar
    return (
      <BarChart {...commonProps}>
        <CartesianGrid {...gridStyle} />
        <XAxis dataKey="year" axisLine={false} tickLine={false} tick={axisStyle} />
        <YAxis hide={false} axisLine={false} tickLine={false} tick={axisStyle} tickFormatter={formatValue} domain={[0, maxValue * 1.1]} />
        <Tooltip {...tooltipProps} />
        <Bar dataKey={type} radius={[4, 4, 0, 0]} barSize={40}>
          {data.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={index === data.length - 1 ? currentYearColor : pastYearColor} 
              className="transition-opacity duration-300 hover:opacity-80"
            />
          ))}
        </Bar>
      </BarChart>
    )
  }

  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        {renderChart()}
      </ResponsiveContainer>
    </div>
  )
}
