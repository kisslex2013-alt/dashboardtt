import React from 'react'
import { WeekStats } from '../../utils/comparativeCalculations'
import { TrendingUp, TrendingDown, Calendar, Clock, DollarSign } from 'lucide-react'
import { InfoTooltip } from '../ui/InfoTooltip'

interface BestWorstPeriodsProps {
  bestWeeks: WeekStats[]
  worstWeeks: WeekStats[]
  type: 'income' | 'hours'
}

export function BestWorstPeriods({ bestWeeks, worstWeeks, type }: BestWorstPeriodsProps) {
  const formatValue = (week: WeekStats) => {
    if (type === 'income') return week.income.toLocaleString('ru-RU') + ' ₽'
    return week.hours.toFixed(1) + ' ч'
  }

  const renderList = (weeks: WeekStats[], isBest: boolean) => (
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-4">
        {isBest ? (
          <TrendingUp className="w-5 h-5 text-green-500" />
        ) : (
          <TrendingDown className="w-5 h-5 text-red-500" />
        )}
        <h4 className="font-semibold text-gray-800 dark:text-gray-200 text-xs xl:text-sm whitespace-nowrap">
          {isBest ? 'Лучшие недели' : 'Худшие недели'}
        </h4>
        <InfoTooltip text={isBest ? "Топ-5 недель с самым высоким доходом/часами" : "Топ-5 недель с самыми низкими показателями"} />
      </div>

      <div className="space-y-3">
        {weeks.map((week, index) => (
          <div key={`${week.year}-${week.weekStart}`} className="flex items-center justify-between p-2.5 rounded bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors gap-2">
             <div className="flex items-center gap-2 overflow-hidden flex-1">
               <span className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold shrink-0 ${
                 isBest ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
               }`}>
                 {index + 1}
               </span>
               <div className="min-w-0 flex-1">
                 <div className="text-xs text-gray-900 dark:text-gray-100 truncate">
                   {week.weekStart} - {week.weekEnd}
                 </div>
               </div>
             </div>
             <div className="text-right shrink-0">
               <div className="text-xs font-bold text-gray-900 dark:text-white whitespace-nowrap">
                 {formatValue(week)}
               </div>
             </div>
          </div>
        ))}
         
        {weeks.length === 0 && (
            <div className="text-center py-4 text-gray-500 text-xs">
                Нет данных
            </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      {renderList(bestWeeks, true)}
      {renderList(worstWeeks, false)}
    </div>
  )
}
