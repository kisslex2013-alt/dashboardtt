import React, { useMemo } from 'react'
import { BarChart, Bar, AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { CategoryTrendPoint } from '../../utils/comparativeCalculations'
import { Category } from '../../types'

export type CategoryTrendChartType = 'bar' | 'area' | 'line'

interface CategoryTrendChartProps {
  data: CategoryTrendPoint[]
  categories: Category[]
  visType?: CategoryTrendChartType
}

export function CategoryTrendChart({ data, categories, visType = 'bar' }: CategoryTrendChartProps) {
  // Filter categories that actually appear in the data
  const activeCategories = useMemo(() => categories.filter(cat => {
    return data.some(point => {
        const val = point[cat.name]
        return typeof val === 'number' && val > 0
    })
  }), [categories, data])

  // Clean data: remove empty months
  const cleanData = useMemo(() => data.filter(point => {
     return Object.keys(point).some(key => !['date', 'monthName', 'fullDate'].includes(key) && typeof point[key] === 'number' && point[key] > 0)
  }), [data])

  // For Line Chart, we need pre-calculated percentages because Recharts LineChart doesn't support stackOffset="expand"
  const percentData = useMemo(() => {
    if (visType !== 'line') return cleanData
    
    return cleanData.map(point => {
      const newPoint: any = { ...point }
      const total = Object.keys(point).reduce((sum, key) => {
         if (!['date', 'monthName', 'fullDate'].includes(key) && typeof point[key] === 'number') {
           return sum + (point[key] as number)
         }
         return sum
      }, 0)

      if (total > 0) {
        Object.keys(point).forEach(key => {
           if (!['date', 'monthName', 'fullDate'].includes(key) && typeof point[key] === 'number') {
             newPoint[key] = parseFloat(((point[key] as number) / total * 100).toFixed(1))
           }
        })
      }
      return newPoint
    })
  }, [cleanData, visType])

  const toPercent = (decimal: number) => {
      // For Line chart, data is already 0-100
      if (visType === 'line') return `${decimal}%`
      // For Bar/Area with "expand", data is 0-1
      return `${(decimal * 100).toFixed(0)}%`
  }

  const renderTooltipContent = (o: any) => {
    const { payload, label } = o
    // Total calculation depends on data type
    const total = visType === 'line' 
        ? 100 // Normalized
        : payload?.reduce((sum: number, entry: any) => sum + (entry.value || 0), 0) || 0

    return (
      <div className="bg-gray-900/95 border border-gray-700 rounded-xl p-3 text-white text-xs shadow-xl">
        <p className="font-bold mb-2">{payload?.[0]?.payload?.fullDate || label}</p>
        <div className="space-y-1">
            {payload?.map((entry: any, index: number) => {
                let percent = '0'
                let rawValue = entry.value
                
                if (visType === 'line') {
                    percent = typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value
                    rawValue = null 
                } else {
                     percent = total > 0 ? ((entry.value / total) * 100).toFixed(1) : '0'
                }

                return (
                    <div key={`item-${index}`} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                        <span className="flex-1">{entry.name}:</span>
                        <span className="font-bold">{percent}%</span>
                        {rawValue !== null && <span className="text-gray-400 text-[10px] ml-1">({rawValue}ч)</span>}
                    </div>
                )
            })}
        </div>
      </div>
    )
  }

  const commonProps = {
    data: visType === 'line' ? percentData : cleanData,
    margin: { top: 10, right: 30, left: 0, bottom: 0 },
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        {visType === 'bar' ? (
            <BarChart {...commonProps} stackOffset="expand" barCategoryGap={20}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                <YAxis tickFormatter={toPercent} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                <Tooltip content={renderTooltipContent} cursor={{ fill: 'rgba(255,255,255, 0.05)' }} />
                {activeCategories.map((cat) => (
                    <Bar key={cat.id} dataKey={cat.name} stackId="a" fill={cat.color} radius={0} strokeWidth={0} />
                ))}
                 <Bar key="uncategorized" dataKey="Без категории" stackId="a" fill="#9CA3AF" />
            </BarChart>
        ) : visType === 'area' ? (
            <AreaChart {...commonProps} stackOffset="expand">
                 <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                <YAxis tickFormatter={toPercent} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                <Tooltip content={renderTooltipContent} />
                {activeCategories.map((cat) => (
                    <Area key={cat.id} type="monotone" dataKey={cat.name} stackId="1" stroke={cat.color} fill={cat.color} fillOpacity={0.8} />
                ))}
                <Area key="uncategorized" type="monotone" dataKey="Без категории" stackId="1" stroke="#9CA3AF" fill="#9CA3AF" fillOpacity={0.5} />
            </AreaChart>
        ) : (
            <LineChart {...commonProps}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                <YAxis tickFormatter={toPercent} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} domain={[0, 100]} />
                <Tooltip content={renderTooltipContent} />
                {activeCategories.map((cat) => (
                    <Line key={cat.id} type="monotone" dataKey={cat.name} stroke={cat.color} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                ))}
                <Line key="uncategorized" type="monotone" dataKey="Без категории" stroke="#9CA3AF" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}
