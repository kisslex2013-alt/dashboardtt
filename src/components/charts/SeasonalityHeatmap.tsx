import React, { useMemo } from 'react'
import { TimeEntry } from '../../types'
import { parseISO, getMonth, getYear, getDaysInMonth } from 'date-fns'
import { useTheme, useDailyGoal } from '../../store/useSettingsStore'
import { InfoTooltip } from '../ui/InfoTooltip'
import { calculateDuration } from '../../utils/calculations'

interface SeasonalityHeatmapProps {
  entries: TimeEntry[]
}

const MONTHS = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек']
const MONTHS_FULL = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']

interface MonthData {
  income: number
  hours: number
  daysWorked: number
}

export const SeasonalityHeatmap: React.FC<SeasonalityHeatmapProps> = ({ entries }) => {
  const theme = useTheme()
  const dailyGoal = useDailyGoal()
  const validDailyGoal = typeof dailyGoal === 'number' && dailyGoal > 0 ? dailyGoal : 6000

  const { years, maxIncome, data } = useMemo(() => {
    if (!entries.length) return { years: [], maxIncome: 0, data: {} as Record<number, MonthData[]> }

    const data: Record<number, MonthData[]> = {}
    // Для подсчёта уникальных дней работы
    const workedDays: Record<string, Set<string>> = {}
    let maxIncome = 0
    let minYear = Infinity
    let maxYear = -Infinity

    // Группируем записи по году и месяцу
    entries.forEach(entry => {
      const date = parseISO(entry.date)
      const year = getYear(date)
      const month = getMonth(date) // 0-11
      const income = parseFloat(String(entry.earned)) || 0
      
      // Рассчитываем часы из start/end если есть, иначе используем duration
      let duration = 0
      if (entry.start && entry.end) {
        duration = parseFloat(calculateDuration(entry.start, entry.end)) || 0
      } else if (entry.duration) {
        duration = parseFloat(String(entry.duration)) || 0
      }

      if (!data[year]) {
        data[year] = Array.from({ length: 12 }, () => ({ income: 0, hours: 0, daysWorked: 0 }))
      }
      
      // Ключ для уникального дня
      const dayKey = `${year}-${month}`
      if (!workedDays[dayKey]) {
        workedDays[dayKey] = new Set()
      }
      workedDays[dayKey].add(entry.date)
      
      data[year][month].income += income
      data[year][month].hours += duration
      
      maxIncome = Math.max(maxIncome, data[year][month].income)
      minYear = Math.min(minYear, year)
      maxYear = Math.max(maxYear, year)
    })
    
    // Обновляем количество уникальных дней
    Object.entries(workedDays).forEach(([key, dates]) => {
      const [yearStr, monthStr] = key.split('-')
      const year = parseInt(yearStr)
      const month = parseInt(monthStr)
      if (data[year]) {
        data[year][month].daysWorked = dates.size
      }
    })

    const years: number[] = []
    if (minYear !== Infinity) {
        for (let y = maxYear; y >= minYear; y--) {
            years.push(y)
        }
    }

    return { years, maxIncome, data }
  }, [entries])

  // Стиль ячейки как в CalendarMonth: прозрачные градиенты с borders
  const getCellStyle = (value: number): { className: string; style: React.CSSProperties } => {
    if (value === 0) {
      // Пустая ячейка - как calendar-day-empty
      return {
        className: 'calendar-day-empty',
        style: {}
      }
    }
    
    const intensity = Math.max(0, Math.min(1, value / maxIncome))
    
    // Определяем статус по интенсивности (как в CalendarMonth)
    if (intensity >= 0.7) {
      // Зелёный (высокий доход) - success
      return {
        className: 'calendar-day-success',
        style: {}
      }
    } else if (intensity >= 0.3) {
      // Жёлтый (средний доход) - warning
      return {
        className: 'calendar-day-warning',
        style: {}
      }
    } else {
      // Красный (низкий доход) - danger
      return {
        className: 'calendar-day-danger',
        style: {}
      }
    }
  }
  
  const formatMoneyCompact = (amount: number): string => {
    if (amount === 0) return ''
    if (amount >= 1000000) return (amount / 1000000).toFixed(1) + 'M'
    if (amount >= 1000) return Math.round(amount / 1000) + 'k'
    return amount.toString()
  }

  if (years.length === 0) return null

  return (
    <div className="glass-effect rounded-xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Сезонность доходов</h3>
        <InfoTooltip text="Тепловая карта показывает распределение доходов по месяцам и годам. Цвет от красного (минимум) к зелёному (максимум)." />
      </div>

      {/* Grid container without scrollbars */}
      <div className="w-full">
        {/* Header - месяцы */}
        <div className="grid gap-1 mb-2" style={{ gridTemplateColumns: '50px repeat(12, minmax(0, 1fr))' }}>
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 text-center self-end pb-1">Год</div>
          {MONTHS.map(m => (
            <div key={m} className="text-xs font-medium text-gray-500 dark:text-gray-400 text-center pb-1 truncate">{m}</div>
          ))}
        </div>

        {/* Rows - годы */}
        <div className="space-y-1">
          {years.map(year => (
            <div key={year} className="grid gap-1" style={{ gridTemplateColumns: '50px repeat(12, minmax(0, 1fr))' }}>
              <div className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center justify-center">
                {year}
              </div>
              {data[year]?.map((monthData, monthIndex) => {
                const cellStyle = getCellStyle(monthData.income)
                const hasData = monthData.income > 0
                
                // Расчёт % плана: доход / (дневная цель * кол-во рабочих дней в этом месяце)
                // Используем реальное количество рабочих дней пользователя
                const monthPlan = validDailyGoal * monthData.daysWorked
                const planPercent = monthPlan > 0 ? Math.round((monthData.income / monthPlan) * 100) : 0
                
                return (
                  <div 
                    key={monthIndex}
                    tabIndex={hasData ? 0 : -1}
                    className={`
                      relative aspect-square flex items-center justify-center rounded-md transition-all duration-200 text-xs sm:text-sm font-medium cursor-default group
                      ${cellStyle.className}
                      ${hasData ? 'text-white' : ''}
                    `}
                    style={cellStyle.style}
                  >
                    <span>{formatMoneyCompact(monthData.income)}</span>
                    {/* Tooltip с расширенной информацией */}
                    {hasData && (
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-50 whitespace-nowrap bg-gray-900 dark:bg-gray-700 text-white text-xs px-3 py-2 rounded-lg shadow-lg pointer-events-none">
                        <div>Заработано: <span className="text-green-400">{monthData.income.toLocaleString('ru-RU')} ₽</span></div>
                        <div>Выполнено плана: <span className={planPercent >= 100 ? 'text-green-400' : planPercent >= 50 ? 'text-yellow-400' : 'text-red-400'}>{planPercent}%</span></div>
                        <div>Отработано: <span className="text-blue-400">{monthData.hours.toFixed(1)} ч</span></div>
                        <div>Рабочих дней: <span className="text-gray-300">{monthData.daysWorked}</span></div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
        
        {/* Легенда */}
        <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: 'rgb(239, 68, 68)' }}></div>
            <span>Мин</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: 'rgb(234, 179, 75)' }}></div>
            <span>Сред</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: 'rgb(34, 197, 94)' }}></div>
            <span>Макс</span>
          </div>
        </div>
      </div>
    </div>
  )
}

