/**
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 *
 * Этот компонент содержит все поля формы записи времени.
 * Он разделен из EditEntryModal для улучшения читаемости и поддерживаемости.
 *
 * Компонент получает данные формы и обработчики изменений через пропсы.
 */

import { useState, useRef } from 'react'
import { Input } from '../ui/Input'
import { TimeInput } from '../ui/TimeInput'
import { CategorySelect } from '../ui/CategorySelect'
import { CustomDatePicker } from '../ui/CustomDatePicker'
import { useIsMobile } from '../../hooks/useIsMobile'
import { calculateDuration } from '../../utils/calculations'
import { Clock, Calendar, AlertCircle } from 'lucide-react' // Assuming lucide-react or similar icons are available, otherwise stick to reliable ones or project utils

// Fallback icons if lucide-react is not available or we prefer project icons
// Adjust imports based on available icon sets in the project
// For now, I'll use simple SVGs or check project utils in next step if these break.
// Actually, looking at imports in other files, 'utils/icons' is used.
import { Clock as ClockIcon, Calendar as CalendarIcon, Tag, DollarSign, FileText } from '../../utils/icons'

// Helper for duration bubble
const DurationBubble = ({ start, end }) => {
  const duration = calculateDuration(start, end)
  if (!duration || duration === '0ч 00м') return null
  
  return (
    <div className="flex items-center justify-center">
      <div className="bg-blue-500/10 text-blue-500 dark:text-blue-400 text-xs font-medium px-2 py-0.5 rounded-full border border-blue-500/20 shadow-sm whitespace-nowrap">
        {duration}
      </div>
    </div>
  )
}

export function EntryFormFields({
  formData,
  onFieldChange,
  onTimeChange,
  onCategoryChange,
  errors,
  categories,
  onOpenCategoriesModal,
  effectiveEntry,
  disabled
}) {
  const isMobile = useIsMobile()
  const [showDatePicker, setShowDatePicker] = useState(false)
  const dateInputRef = useRef<HTMLInputElement>(null)
  const startTimeRef = useRef<HTMLInputElement>(null)
  const endTimeRef = useRef<HTMLInputElement>(null)
  const earnedInputRef = useRef<HTMLInputElement>(null)

  // Calcluate duration for display
  const durationDisplay = calculateDuration(formData.start, formData.end)

  // Check for time overlap (simplified visual check, validation logic is in hook)
  const hasTimeError = errors.start || errors.end
  
  // Logic to check for overlap (simplified for visual indicator)
  // We can use a simplified check or pass 'isOverlap' prop if calculated in parent/hook. 
  // For now, let's assume if there is a specific time error not related to format, it might be overlap.
  // Or better, let's check against effectiveEntry if provided, or leave as false if complex logic is needed.
  // The user requirement "Imp: Add visual conflict indicator" implied we should have it.
  // I will check if errors.start or errors.end contains "пересекается" (overlap) text if possible, 
  // or just rely on hasTimeError for the red line (which I am doing below).
  const isOverlap = (errors.start && errors.start.includes('пересекается')) || (errors.end && errors.end.includes('пересекается'))

  return (
    <div className="space-y-6">
      {/* --- TIME SECTION --- */}
      <div className={`
        relative overflow-hidden
        bg-gray-50 dark:bg-gray-800/50 
        border ${hasTimeError ? 'border-red-500/50' : 'border-gray-200 dark:border-gray-700'} 
        rounded-xl p-4
        transition-all duration-300
      `}>
        {hasTimeError && (
           <div className="absolute top-0 left-0 w-full h-1 bg-red-500/50" />
        )}
        
        <div className="flex items-center gap-2 mb-3 text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wider">
          <ClockIcon className="w-3.5 h-3.5" />
          <span>Время работы</span>
          {/* Date Picker Button (Small) */}
          <button 
             type="button"
             onClick={() => setShowDatePicker(true)}
             className="ml-auto hover:text-blue-500 transition-colors flex items-center gap-1"
          >
             {formData.date ? (() => {
                  const [year, month, day] = formData.date.split('-')
                  return `${day}.${month}`
             })() : 'Сегодня'}
             <CalendarIcon className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Date Picker Modal/Popover */}
        {showDatePicker && (
            <CustomDatePicker
              value={formData.date}
              onChange={date => {
                onFieldChange('date', date)
                setShowDatePicker(false)
              }}
              onClose={() => setShowDatePicker(false)}
              inputRef={dateInputRef} 
            />
        )}

        <div className="flex items-center justify-between relative z-10">
          <div className="w-24">
             <label className="text-xs text-gray-500 font-medium mb-1.5 ml-1 block">Начало</label>
             <TimeInput
               ref={startTimeRef}
               value={formData.start}
               onChange={(v) => onTimeChange('start', v)}
               onComplete={() => endTimeRef.current?.focus()}
               error={errors.start}
               hideErrorText={true}
               className="text-lg font-bold bg-transparent border-none p-0 !px-0 focus:ring-0 w-full"
               placeholder="09:00"
             />
          </div>

             <div className="flex flex-col items-center justify-center w-full relative">
               <div className={`text-sm font-bold -mb-1 ${
                 hasTimeError ? 'text-red-500' : 'text-blue-500 dark:text-blue-400'
               }`}>
                 {durationDisplay}
               </div>
               
               {/* Arrow Visual */}
               <div className="w-full h-4 flex items-center justify-center relative my-1">
                  <div className={`w-full h-[2px] ${hasTimeError ? 'bg-red-500/50' : 'bg-blue-500'} relative rounded-full`}>
                    <div className={`absolute right-[-1px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-[4px] border-t-transparent border-l-[8px] ${hasTimeError ? 'border-l-red-500/50' : 'border-l-blue-500'} border-b-[4px] border-b-transparent`} />
                  </div>
                  
                   {/* Conflict Indicator */}
                   {isOverlap && (
                     <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[2px] bg-red-500/50 animate-pulse rounded-full" />
                   )}
               </div>

               <div className="text-xs text-gray-500 font-medium -mt-0.5">
                 Длительность
               </div>
             </div>

          <div className="w-24 text-right">
             <label className="text-xs text-gray-500 font-medium mb-1.5 mr-1 block">Конец</label>
             <TimeInput
               ref={endTimeRef}
               value={formData.end}
               onChange={(v) => onTimeChange('end', v)}
               error={errors.end}
               hideErrorText={true}
               className="text-lg font-bold bg-transparent border-none p-0 !px-0 focus:ring-0 w-full text-right"
               placeholder="18:00"
             />
          </div>
        </div>
        {/* Error Message Footer */}
        {hasTimeError && (
          <div className="mt-3 text-center text-xs text-red-500 font-medium bg-red-500/10 py-1 px-2 rounded">
             {errors.start || errors.end}
          </div>
        )}
      </div>

      {/* 2. Category Block */}
      <div className="space-y-1">
         <label className="text-xs text-gray-500 font-medium ml-1">Категория</label>
         <CategorySelect
           value={formData.category} // Pass the category NAME
           onChange={onCategoryChange}
           options={categories}
           onAddNew={onOpenCategoriesModal}
           className="w-full"
           placeholder="Выберите категорию"
           error={errors.category}
         />
      </div>

      {/* 3. Earnings Block */}
      <div className="space-y-1">
         <label className="text-xs text-gray-500 font-medium ml-1">Заработок</label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <DollarSign className="w-4 h-4" />
            </div>
              <Input
                ref={earnedInputRef}
                type="number"
                value={formData.earned != null ? String(formData.earned) : ''}
                onChange={(v) => onFieldChange('earned', v)}
                placeholder="0"
                className="pl-10 w-full bg-white/40 dark:bg-gray-800/40 border-white/20 dark:border-white/10 rounded-xl hover:bg-white/60 dark:hover:bg-gray-800/60 transition-colors focus:ring-2 focus:ring-blue-500/50 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                error={errors.earned}
              />
             <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">
               ₽
             </div>
          </div>
      </div>
    </div>
  )
}
