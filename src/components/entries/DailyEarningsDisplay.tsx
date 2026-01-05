import { DollarSign } from '../../utils/icons'

export function DailyEarningsDisplay({ dailyEarnings, date, dailyRate }) {
  if (!date) return null

  return (
    <div className="bg-white/40 dark:bg-gray-800/40 border border-white/20 dark:border-white/10 rounded-xl p-3 flex items-center justify-between shadow-sm backdrop-blur-md">
      <div className="flex items-center gap-3">
         <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
            <DollarSign className="w-4 h-4" />
         </div>
         <div className="flex flex-col">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Итого за сегодня</span>
            <span className="text-base font-bold text-gray-900 dark:text-gray-100">
               {dailyEarnings.toLocaleString('ru-RU')} ₽
            </span>
         </div>
      </div>

      {dailyRate && dailyRate > 0 && (
         <div className="flex items-center gap-2 pl-4 border-l border-gray-200 dark:border-gray-700/50">
            <div className="flex flex-col items-end">
               <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Ставка</span>
               <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  {Math.round(dailyRate).toLocaleString('ru-RU')} ₽/ч
               </span>
            </div>
         </div>
      )}
    </div>
  )
}
