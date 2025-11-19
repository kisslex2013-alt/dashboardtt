import { memo } from 'react'
import { Settings as SettingsIcon } from '../../../utils/icons'

/**
 * ⚙️ Карточка настроек рабочего графика
 *
 * Отображает:
 * - Статистику выбранного графика
 * - Дневной план заработка
 * - Начало недели (для не-кастомных графиков)
 */
export const ScheduleSettingsCard = memo(
  ({
    selectedSchedule,
    selectedTemplate,
    dailyPlan,
    monthlyPlan,
    weekStart,
    animateStats,
    onDailyPlanChange,
    onWeekStartChange,
    getIconColorClasses,
  }) => {
    return (
      <div
        key="settings"
        className="dashboard-card p-3 sm:p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-600"
        style={{ animationDelay: '0.4s' }}
      >
        {/* Header */}
        <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
          <div
            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br ${getIconColorClasses('blue')} flex items-center justify-center`}
          >
            <SettingsIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100">
            Настройки
          </h3>
        </div>

        {/* Статистика */}
        <div
          className={`grid grid-cols-2 gap-1.5 sm:gap-2 mb-2 sm:mb-3 transition-normal ${animateStats ? 'scale-105' : 'scale-100'}`}
        >
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-1.5 sm:p-2 animate-slide-up">
            <div className="text-[9px] font-medium text-blue-600 dark:text-blue-400 mb-0.5">
              ВЫБРАНО
            </div>
            <div className="text-sm sm:text-base font-bold text-blue-900 dark:text-blue-100">
              {selectedTemplate}
            </div>
            <div className="text-[9px] text-blue-600 dark:text-blue-400 truncate">
              {selectedSchedule.title.split(' ')[0]}
            </div>
          </div>
          <div
            className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-1.5 sm:p-2 animate-slide-up"
            style={{ animationDelay: '0.05s' }}
          >
            <div className="text-[9px] font-medium text-green-600 dark:text-green-400 mb-0.5">
              РАБОЧИХ
            </div>
            <div className="text-sm sm:text-base font-bold text-green-900 dark:text-green-100">
              {selectedSchedule.monthlyDays}
            </div>
            <div className="text-[9px] text-green-600 dark:text-green-400">дней</div>
          </div>
          <div
            className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-1.5 sm:p-2 animate-slide-up"
            style={{ animationDelay: '0.1s' }}
          >
            <div className="text-[9px] font-medium text-purple-600 dark:text-purple-400 mb-0.5">
              ПЛАН/ДЕНЬ
            </div>
            <div className="text-sm sm:text-base font-bold text-purple-900 dark:text-purple-100">
              {(dailyPlan / 1000).toFixed(0)}K ₽
            </div>
            <div className="text-[9px] text-purple-600 dark:text-purple-400">цель</div>
          </div>
          <div
            className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-1.5 sm:p-2 animate-slide-up"
            style={{ animationDelay: '0.15s' }}
          >
            <div className="text-[9px] font-medium text-blue-600 dark:text-blue-400 mb-0.5">
              ПЛАН/МЕС
            </div>
            <div className="text-sm sm:text-base font-bold text-blue-900 dark:text-blue-100">
              {(monthlyPlan / 1000).toFixed(0)}K ₽
            </div>
            <div className="text-[9px] text-blue-600 dark:text-blue-400">авто</div>
          </div>
        </div>

        {/* Настройки */}
        <div
          className={`flex gap-2 sm:gap-3 ${selectedTemplate === 'custom' ? '' : 'grid grid-cols-2'}`}
        >
          <div className={selectedTemplate === 'custom' ? 'flex-1' : ''}>
            <label className="block text-[9px] sm:text-[10px] font-semibold text-gray-600 dark:text-gray-400 mb-1 sm:mb-1.5 uppercase tracking-wide">
              Дневной план
            </label>
            <div className="flex items-center gap-1 sm:gap-1.5">
              <input
                type="number"
                value={dailyPlan}
                onChange={e => onDailyPlanChange(Number(e.target.value))}
                className="w-20 sm:w-24 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-semibold transition-normal"
              />
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">
                ₽
              </span>
            </div>
          </div>

          {/* Начало недели - скрыто для кастомного */}
          {selectedTemplate !== 'custom' && (
            <div>
              <label className="block text-[9px] sm:text-[10px] font-semibold text-gray-600 dark:text-gray-400 mb-1 sm:mb-1.5 uppercase tracking-wide">
                Начало недели
              </label>
              <select
                value={weekStart}
                onChange={e => onWeekStartChange(Number(e.target.value))}
                className="w-full px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-semibold transition-normal"
              >
                <option value={1}>Понедельник</option>
                <option value={2}>Вторник</option>
                <option value={3}>Среда</option>
                <option value={4}>Четверг</option>
                <option value={5}>Пятница</option>
                <option value={6}>Суббота</option>
                <option value={7}>Воскресенье</option>
              </select>
            </div>
          )}
        </div>
      </div>
    )
  }
)
