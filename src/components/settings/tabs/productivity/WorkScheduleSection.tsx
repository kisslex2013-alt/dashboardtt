/**
 * 📅 WorkScheduleSection Component
 *
 * Секция настройки рабочего графика.
 * Обертка над компонентами из modals/work-schedule.
 */

import { Clock } from 'lucide-react'
import { SettingsCard } from '../../SettingsCard'
import { ScheduleTemplateCard } from '../../../modals/work-schedule/ScheduleTemplateCard'
import { ScheduleSettingsCard } from '../../../modals/work-schedule/ScheduleSettingsCard'
import { getIconColorClasses, getEfficiencyColor } from '../../../modals/work-schedule/scheduleUtils'

interface WorkScheduleSectionProps {
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

export function WorkScheduleSection({
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
}: WorkScheduleSectionProps) {
  return (
    <SettingsCard
      title="Рабочий график"
      description="Выберите оптимальный режим работы и настройте цели"
      icon={Clock}
      defaultExpanded={true}
      collapseOnDisable={false} // График всегда активен
    >
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="space-y-4">
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
        </div>

        <div>
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
    </SettingsCard>
  )
}
