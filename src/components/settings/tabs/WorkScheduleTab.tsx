/**
 * 📅 WorkScheduleTab Component
 *
 * Отдельная вкладка настройки рабочего графика.
 */

import { Clock } from 'lucide-react'
import { ScheduleTemplateCard } from '../../modals/work-schedule/ScheduleTemplateCard'
import { ScheduleSettingsCard } from '../../modals/work-schedule/ScheduleSettingsCard'
import { getIconColorClasses, getEfficiencyColor } from '../../modals/work-schedule/scheduleUtils'

interface WorkScheduleTabProps {
  scheduleTemplates: any[]
  selectedTemplate: string
  onSelectTemplate: (id: string) => void
  onCustomDayToggle: (index: number) => void
  selectedSchedule: any
  dailyPlan: number
  monthlyPlan: number
  weekStart: number
  onDailyPlanChange: (value: number) => void
  onWeekStartChange: (value: number) => void
  animateStats: boolean
}

export function WorkScheduleTab({
  scheduleTemplates,
  selectedTemplate,
  onSelectTemplate,
  onCustomDayToggle,
  selectedSchedule,
  dailyPlan,
  monthlyPlan,
  weekStart,
  onDailyPlanChange,
  onWeekStartChange,
  animateStats,
}: WorkScheduleTabProps) {
  return (
    <div className="space-y-6">

      {/* Сетка 3x2: 5 шаблонов + Настройки */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Шаблоны графиков
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {scheduleTemplates.map((template, index) => (
            <ScheduleTemplateCard
              key={template.id}
              template={template}
              isSelected={selectedTemplate === template.id}
              onSelect={onSelectTemplate}
              onCustomDayToggle={onCustomDayToggle}
              getIconColorClasses={getIconColorClasses}
              getEfficiencyColor={getEfficiencyColor}
              animationDelay={`${index * 0.08}s`}
            />
          ))}
          {/* Настройки как 6-я ячейка */}
          <ScheduleSettingsCard
            selectedSchedule={selectedSchedule}
            selectedTemplate={selectedTemplate}
            dailyPlan={dailyPlan}
            monthlyPlan={monthlyPlan}
            weekStart={weekStart}
            animateStats={animateStats}
            onDailyPlanChange={onDailyPlanChange}
            onWeekStartChange={onWeekStartChange}
            getIconColorClasses={getIconColorClasses}
          />
        </div>
      </div>
    </div>
  )
}
