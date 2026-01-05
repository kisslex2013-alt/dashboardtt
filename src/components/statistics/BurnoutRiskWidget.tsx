import { memo, useMemo } from 'react'
import { Flame, Clock, Calendar, Moon, AlertTriangle, CheckCircle, Info } from 'lucide-react'
import { useEntries } from '../../store/useEntriesStore'
import { useDailyHours } from '../../store/useSettingsStore'
import { calculateBurnoutRisk } from '../../utils/insightsCalculations'
import { InfoTooltip } from '../ui/InfoTooltip'

export const BurnoutRiskWidget = memo(() => {
  const entries = useEntries()
  const dailyHoursLimit = useDailyHours() || 8

  const { level, score, factors, factorDetails, message } = useMemo(() => {
    return calculateBurnoutRisk(entries, dailyHoursLimit)
  }, [entries, dailyHoursLimit])

  // Colors based on risk level
  const colors = {
    low: {
      bg: 'bg-green-100 dark:bg-green-900/20',
      text: 'text-green-800 dark:text-green-200',
      border: 'border-green-200 dark:border-green-800',
      icon: 'text-green-500',
      bar: 'bg-green-500',
    },
    medium: {
      bg: 'bg-yellow-100 dark:bg-yellow-900/20',
      text: 'text-yellow-800 dark:text-yellow-200',
      border: 'border-yellow-200 dark:border-yellow-800',
      icon: 'text-yellow-500',
      bar: 'bg-yellow-500',
    },
    high: {
      bg: 'bg-red-100 dark:bg-red-900/20',
      text: 'text-red-800 dark:text-red-200',
      border: 'border-red-200 dark:border-red-800',
      icon: 'text-red-500',
      bar: 'bg-red-500',
    },
  }[level]

  return (
    <div className="glass-effect rounded-xl p-6 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Прогноз выгорания</h3>
        <InfoTooltip text="Риск рассчитывается на основе переработок, отсутствия выходных, длительности сессий и ночной работы." />
      </div>

      {/* Main Score Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-end mb-2">
          <span className={`text-sm font-semibold ${colors.text}`}>{message}</span>
          <span className={`text-2xl font-bold ${colors.icon}`}>{score}%</span>
        </div>
        <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ${colors.bar}`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      {/* Risk Factors Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div 
          className={`p-3 rounded-lg border relative group ${factors.overwork ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30' : 'bg-gray-50 dark:bg-gray-800/50 border-transparent'}`}
        >
            <div className="flex items-center gap-2">
                <Clock className={`w-4 h-4 ${factors.overwork ? 'text-red-500' : 'text-gray-400'}`} />
                <span className={`text-xs font-semibold ${factors.overwork ? 'text-red-700 dark:text-red-300' : 'text-gray-600 dark:text-gray-400'}`}>Переработки</span>
            </div>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 dark:bg-gray-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
              {factorDetails.overwork}
            </div>
        </div>

        <div 
          className={`p-3 rounded-lg border relative group ${factors.noDaysOff ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30' : 'bg-gray-50 dark:bg-gray-800/50 border-transparent'}`}
        >
            <div className="flex items-center gap-2">
                <Calendar className={`w-4 h-4 ${factors.noDaysOff ? 'text-red-500' : 'text-gray-400'}`} />
                <span className={`text-xs font-semibold ${factors.noDaysOff ? 'text-red-700 dark:text-red-300' : 'text-gray-600 dark:text-gray-400'}`}>Выходные</span>
            </div>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 dark:bg-gray-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
              {factorDetails.noDaysOff}
            </div>
        </div>

        <div 
          className={`p-3 rounded-lg border relative group ${factors.longSessions ? 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-100 dark:border-yellow-900/30' : 'bg-gray-50 dark:bg-gray-800/50 border-transparent'}`}
        >
            <div className="flex items-center gap-2">
                <AlertTriangle className={`w-4 h-4 ${factors.longSessions ? 'text-yellow-500' : 'text-gray-400'}`} />
                <span className={`text-xs font-semibold ${factors.longSessions ? 'text-yellow-700 dark:text-yellow-300' : 'text-gray-600 dark:text-gray-400'}`}>Сессии</span>
            </div>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 dark:bg-gray-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
              {factorDetails.longSessions}
            </div>
        </div>

        <div 
          className={`p-3 rounded-lg border relative group ${factors.nightWork ? 'bg-purple-50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-900/30' : 'bg-gray-50 dark:bg-gray-800/50 border-transparent'}`}
        >
            <div className="flex items-center gap-2">
                <Moon className={`w-4 h-4 ${factors.nightWork ? 'text-purple-500' : 'text-gray-400'}`} />
                <span className={`text-xs font-semibold ${factors.nightWork ? 'text-purple-700 dark:text-purple-300' : 'text-gray-600 dark:text-gray-400'}`}>Режим</span>
            </div>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 dark:bg-gray-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
              {factorDetails.nightWork}
            </div>
        </div>
      </div>
    </div>
  )
})
