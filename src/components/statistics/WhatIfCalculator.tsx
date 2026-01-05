import React, { useState, useMemo } from 'react'
import { calculateProjection } from '../../utils/predictiveCalculations'
import { calculateDetailedStats } from '../../utils/statisticsCalculations'
import { TimeEntry } from '../../types'
import { Calculator, TrendingUp, Zap, Clock } from 'lucide-react'
import { motion } from 'framer-motion'
import { subMonths, isAfter } from 'date-fns'
import { InfoTooltip } from '../ui/InfoTooltip'

interface WhatIfCalculatorProps {
  entries: TimeEntry[]
}

export const WhatIfCalculator: React.FC<WhatIfCalculatorProps> = ({
  entries,
}) => {
  const [deltaHours, setDeltaHours] = useState(0)
  const [deltaRate, setDeltaRate] = useState(0)

  // Calculate baseline from last 3 months for relevance
  const baseline = useMemo(() => {
    if (!entries || entries.length === 0) return { avgRate: 0, avgDailyHours: 0 }

    const threeMonthsAgo = subMonths(new Date(), 3)
    const recentEntries = entries.filter(e => isAfter(new Date(e.date), threeMonthsAgo))
    const dataset = recentEntries.length > 5 ? recentEntries : entries

    const stats = calculateDetailedStats(dataset, 'custom', null, null)
    const avgDailyHours = stats.daysWorked > 0 ? stats.totalHours / stats.daysWorked : 0

    return {
      avgRate: stats.avgRate,
      avgDailyHours
    }
  }, [entries])

  const { avgRate: currentAvgRate, avgDailyHours: currentAvgDailyHours } = baseline

  // Memoize projection
  const projection = useMemo(() => {
    return calculateProjection(
      currentAvgRate,
      currentAvgDailyHours,
      deltaHours,
      deltaRate
    )
  }, [currentAvgRate, currentAvgDailyHours, deltaHours, deltaRate])

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const isPositive = projection.differenceMonthly >= 0

  return (
    <div className="glass-effect rounded-xl p-6 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">What-If</h3>
        <InfoTooltip text="Двигайте ползунки, чтобы увидеть прогноз дохода." />
      </div>

      <div className="flex-1 flex flex-col justify-between gap-4">
        {/* Controls - Compact */}
        <div className="space-y-4">
            <div>
                 <div className="flex justify-between mb-1">
                  <span className="text-xs font-medium text-gray-500 flex items-center gap-1"><Zap className="w-3 h-3 text-amber-500"/> Скорость</span>
                  <span className={`text-xs font-bold ${deltaRate > 0 ? 'text-amber-500' : deltaRate < 0 ? 'text-red-500' : 'text-gray-400'}`}>{deltaRate > 0 ? '+' : ''}{deltaRate}%</span>
                 </div>
                 <input
                  type="range"
                  min="-20"
                  max="50"
                  step="5"
                  value={deltaRate}
                  onChange={(e) => setDeltaRate(Number(e.target.value))}
                  className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
            </div>
            
            <div>
                 <div className="flex justify-between mb-1">
                  <span className="text-xs font-medium text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3 text-blue-500"/> Часы/день</span>
                  <span className={`text-xs font-bold ${deltaHours > 0 ? 'text-blue-500' : deltaHours < 0 ? 'text-red-500' : 'text-gray-400'}`}>{deltaHours > 0 ? '+' : ''}{deltaHours}ч</span>
                 </div>
                 <input
                  type="range"
                  min="-2"
                  max="4"
                  step="0.5"
                  value={deltaHours}
                  onChange={(e) => setDeltaHours(Number(e.target.value))}
                  className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
            </div>
        </div>

        {/* Result - Compact */}
        <div className="pt-3 border-t border-gray-100 dark:border-gray-700/50">
           <div className="flex justify-between items-end">
               <div>
                   <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Прогноз в месяц</p>
                   <p className="text-xl font-black text-gray-900 dark:text-white leading-none">
                       {formatMoney(projection.monthlyIncome)}
                   </p>
               </div>
               <div className={`px-2 py-1 rounded-lg text-xs font-bold ${isPositive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                   {isPositive ? '+' : ''}{formatMoney(projection.differenceMonthly)}
               </div>
           </div>
        </div>
      </div>
    </div>
  )
}
