import { memo } from 'react'

/**
 * 📅 Карточка шаблона рабочего графика
 *
 * Отображает один из шаблонов графика:
 * - 5/2, 2/2, 3/3, 5/5, Custom
 * - Мини-календарь с рабочими днями
 * - Прогресс-бар и эффективность
 */
export const ScheduleTemplateCard = memo(
  ({
    template,
    isSelected,
    onSelect,
    onCustomDayToggle,
    getIconColorClasses,
    getEfficiencyColor,
    animationDelay,
  }) => {
    const Icon = template.icon

    return (
      <div
        onClick={() => onSelect(template.id)}
        className={`dashboard-card p-3 sm:p-4 border-2 rounded-xl bg-white dark:bg-gray-800 transition-all duration-200 ${
          isSelected
            ? 'selected border-blue-500 pulse-ring'
            : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md'
        }`}
        style={{ animationDelay }}
      >
        {/* Header с иконкой и текстом */}
        <div className="flex items-start gap-2 sm:gap-3 mb-2 sm:mb-3">
          {/* Icon */}
          <div
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br ${getIconColorClasses(template.iconColor)} flex items-center justify-center flex-shrink-0`}
          >
            <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>

          {/* Заголовок и описание */}
          <div className="flex-1 min-w-0">
            <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100 mb-0.5 sm:mb-1 leading-tight">
              {template.title}
            </h3>
            <p className="text-[9px] sm:text-[10px] text-gray-600 dark:text-gray-400 line-clamp-2 leading-tight">
              {template.description}
            </p>
          </div>
        </div>

        {/* Mini Calendar */}
        <div className="grid grid-cols-7 gap-0.5 mb-2 sm:mb-3">
          {/* Заголовки дней недели */}
          {(template.id === 'custom' ? ['П', 'В', 'С', 'Ч', 'П', 'С', 'В'] : template.weekDays).map(
            (dayName, idx) => (
              <div
                key={`header-${idx}`}
                className="text-[8px] text-center text-gray-500 dark:text-gray-400 font-medium pb-0.5"
              >
                {dayName}
              </div>
            )
          )}

          {/* Дни месяца */}
          {template.calendar.map((calendarItem, idx) => {
            if (calendarItem.day === null) {
              return <div key={`empty-${idx}`} className="w-4 h-4 sm:w-5 sm:h-5 opacity-0" />
            }
            return (
              <button
                key={`day-${idx}`}
                type="button"
                onClick={e => {
                  if (template.id === 'custom') {
                    // Для кастомного режима переключаем дни
                    e.stopPropagation()
                    onCustomDayToggle(calendarItem)
                  }
                  // Для остальных режимов клик по дню выбирает шаблон (propagation не останавливаем)
                }}
                className={`day-dot w-4 h-4 sm:w-5 sm:h-5 text-[9px] sm:text-[10px] flex items-center justify-center ${
                  calendarItem.isWorkDay ? 'day-work' : 'day-off'
                } ${
                  template.id === 'custom'
                    ? 'hover-lift-scale click-shrink'
                    : '' // Кликабельно, но клик идет на родителя
                } transition-normal`}
              >
                {calendarItem.day}
              </button>
            )
          })}
        </div>

        {/* Progress Bar */}
        <div className="mb-2">
          <div className="flex justify-between text-[10px] text-gray-600 dark:text-gray-400 mb-1">
            <span>Дней</span>
            <span className="font-semibold">{template.monthlyDays}/31</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
            <div className="stat-bar h-full" style={{ width: `${template.efficiency}%` }} />
          </div>
        </div>

        {/* Efficiency */}
        <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-100 dark:border-gray-700">
          <span className="text-gray-600 dark:text-gray-400">Эффект:</span>
          <span className={`font-bold ${getEfficiencyColor(template.iconColor)}`}>
            {template.efficiency}%
          </span>
        </div>
      </div>
    )
  }
)
