import { useState, useEffect } from 'react'
import { BaseModal } from '../ui/BaseModal'
import {
  useWorkScheduleTemplate,
  useDailyGoal,
  useWorkScheduleStartDay,
  useCustomWorkDates,
  useUpdateSettings,
} from '../../store/useSettingsStore'
import { useShowSuccess } from '../../store/useUIStore'
import { ScheduleTemplateCard } from './work-schedule/ScheduleTemplateCard'
import { ScheduleSettingsCard } from './work-schedule/ScheduleSettingsCard'
import { useScheduleTemplates } from './work-schedule/useScheduleTemplates'
import { getIconColorClasses, getEfficiencyColor } from './work-schedule/scheduleUtils'

/**
 * Модальное окно настройки рабочего графика (Variant 5: Modern Dashboard - Compact)
 * - Выбор шаблона графика (5/2, 2/2, 3/3, 5/5, Кастомный)
 * - Интерактивные календари с переключением дней
 * - Динамическое обновление статистики
 * - Адаптивный дизайн для мобильных
 * - Улучшенные анимации и переходы
 */
export function WorkScheduleModal({ isOpen, onClose }) {
  // ✅ ОПТИМИЗАЦИЯ: Используем атомарные селекторы для минимизации ре-рендеров
  const workScheduleTemplate = useWorkScheduleTemplate()
  const dailyGoal = useDailyGoal()
  const workScheduleStartDay = useWorkScheduleStartDay()
  const savedCustomWorkDates = useCustomWorkDates()
  const updateSettings = useUpdateSettings()

  const showSuccess = useShowSuccess()

  const [selectedTemplate, setSelectedTemplate] = useState(workScheduleTemplate || '5/2')
  const [dailyPlan, setDailyPlan] = useState(dailyGoal || 6000)
  const [weekStart, setWeekStart] = useState(workScheduleStartDay || 1)
  const [customDays, setCustomDays] = useState([true, false, true, true, true, false, false])
  const [customWorkDates, setCustomWorkDates] = useState(savedCustomWorkDates || {})
  const [animateStats, setAnimateStats] = useState(false)

  // Загружаем сохраненные настройки при открытии модального окна
  useEffect(() => {
    if (isOpen) {
      setCustomWorkDates(savedCustomWorkDates || {})
    }
  }, [isOpen, savedCustomWorkDates])

  // Триггер анимации статистики при смене шаблона
  useEffect(() => {
    if (isOpen) {
      setAnimateStats(true)
      const timer = setTimeout(() => setAnimateStats(false), 500)
      return () => clearTimeout(timer)
    }
  }, [selectedTemplate, dailyPlan, isOpen])

  // Используем хук для генерации шаблонов
  const scheduleTemplates = useScheduleTemplates(customDays, weekStart, customWorkDates)

  const selectedSchedule =
    scheduleTemplates.find(t => t.id === selectedTemplate) || scheduleTemplates[0]
  const monthlyPlan = dailyPlan * selectedSchedule.monthlyDays

  // Обработчики
  const handleTemplateSelect = templateId => {
    setSelectedTemplate(templateId)
  }

  const handleCustomDayToggle = calendarItem => {
    if (selectedTemplate === 'custom' && calendarItem.dateKey) {
      setCustomWorkDates(prev => ({
        ...prev,
        [calendarItem.dateKey]: !calendarItem.isWorkDay,
      }))
    }
  }

  const handleSave = () => {
    const settingsToSave = {
      workScheduleTemplate: selectedTemplate,
      dailyGoal: dailyPlan,
      workScheduleStartDay: weekStart,
    }

    if (selectedTemplate === 'custom') {
      settingsToSave.customWorkDates = customWorkDates
    }

    updateSettings(settingsToSave)
    showSuccess('Рабочий график сохранен!')
    onClose()
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Рабочий график"
      subtitle="Выберите оптимальный режим работы"
      size="full"
      closeOnOverlayClick={false}
      footer={
        <div className="flex gap-2 sm:gap-3">
          <button
            onClick={onClose}
            className="px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg sm:rounded-xl font-semibold text-gray-800 dark:text-gray-200 transition-normal hover-lift-scale click-shrink"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg sm:rounded-xl font-semibold transition-normal hover-lift-scale click-shrink shadow-lg shadow-blue-500/50"
          >
            Сохранить
          </button>
        </div>
      }
      className="flex flex-col max-h-[95vh]"
    >
      {/* Content */}
      <div className="flex-1 overflow-y-auto pr-1 sm:pr-2 -mr-1 sm:-mr-2">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* Карточки шаблонов */}
          {scheduleTemplates.map((template, index) => (
            <ScheduleTemplateCard
              key={template.id}
              template={template}
              isSelected={selectedTemplate === template.id}
              onSelect={handleTemplateSelect}
              onCustomDayToggle={handleCustomDayToggle}
              getIconColorClasses={getIconColorClasses}
              getEfficiencyColor={getEfficiencyColor}
              animationDelay={`${index * 0.08}s`}
            />
          ))}

          {/* Карточка настроек */}
          <ScheduleSettingsCard
            selectedSchedule={selectedSchedule}
            selectedTemplate={selectedTemplate}
            dailyPlan={dailyPlan}
            monthlyPlan={monthlyPlan}
            weekStart={weekStart}
            animateStats={animateStats}
            onDailyPlanChange={setDailyPlan}
            onWeekStartChange={setWeekStart}
            getIconColorClasses={getIconColorClasses}
          />
        </div>
      </div>
    </BaseModal>
  )
}
