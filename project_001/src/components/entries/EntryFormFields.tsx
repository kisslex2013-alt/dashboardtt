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

/**
 * Компонент полей формы записи времени
 * @param {Object} props - Пропсы компонента
 * @param {Object} props.formData - Данные формы
 * @param {Function} props.onFieldChange - Обработчик изменения поля
 * @param {Function} props.onTimeChange - Обработчик изменения времени
 * @param {Function} props.onCategoryChange - Обработчик изменения категории
 * @param {Object} props.errors - Объект с ошибками валидации
 * @param {Array} props.categories - Список категорий
 * @param {Function} props.onOpenCategoriesModal - Обработчик открытия модального окна категорий
 * @param {Object|null} props.effectiveEntry - Текущая редактируемая запись
 */
export function EntryFormFields({
  formData,
  onFieldChange,
  onTimeChange,
  onCategoryChange,
  errors,
  categories,
  onOpenCategoriesModal,
  effectiveEntry,
}) {
  const isMobile = useIsMobile()
  const [showDatePicker, setShowDatePicker] = useState(false)
  const dateInputRef = useRef(null)
  const startTimeRef = useRef(null)
  const endTimeRef = useRef(null)
  const earnedInputRef = useRef(null)

  return (
    <div className="space-y-4">
      {/* Поле даты - только при создании новой записи */}
      {!effectiveEntry?.id && (
        <div>
          <label className="block text-sm font-medium mb-2">
            Дата <span className="text-red-500">*</span>
          </label>
          <input
            ref={dateInputRef}
            type="text"
            readOnly
            value={
              formData.date
                ? (() => {
                    const [year, month, day] = formData.date.split('-')
                    return `${day}/${month}/${year}`
                  })()
                : ''
            }
            onFocus={() => setShowDatePicker(true)}
            placeholder="дд/мм/гггг"
            className={`w-full px-4 py-2 glass-effect rounded-lg border-2 ${errors.date ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 bg-white/80 dark:bg-gray-800/80`}
            aria-label="Дата записи"
            aria-required="true"
            aria-invalid={!!errors.date}
            aria-describedby={errors.date ? 'date-error' : undefined}
            id="entry-date-input"
          />
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
          {errors.date && (
            <p
              id="date-error"
              className="text-red-500 text-sm mt-1"
              role="alert"
              aria-live="polite"
            >
              {errors.date}
            </p>
          )}
        </div>
      )}

      <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
        <div>
          <label className={`block ${isMobile ? 'text-base' : 'text-sm'} font-medium mb-2`}>
            Время начала <span className="text-red-500">*</span>
          </label>
          <TimeInput
            ref={startTimeRef}
            value={formData.start}
            onChange={value => onTimeChange('start', value)}
            placeholder="чч:мм"
            error={errors.start}
            onComplete={() => {
              // Автоматический переход на поле "Время окончания"
              endTimeRef.current?.focus()
            }}
          />
        </div>

        <div>
          <label className={`block ${isMobile ? 'text-base' : 'text-sm'} font-medium mb-2`}>
            Время окончания <span className="text-red-500">*</span>
          </label>
          <TimeInput
            ref={endTimeRef}
            value={formData.end}
            onChange={value => onTimeChange('end', value)}
            placeholder="чч:мм"
            error={errors.end}
            onComplete={() => {
              // Автоматический переход на поле "Заработок"
              earnedInputRef.current?.focus()
            }}
          />
        </div>
      </div>

      {/* Кастомный Select для категории с иконками */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Категория <span className="text-red-500">*</span>
        </label>
        <CategorySelect
          value={formData.category}
          onChange={onCategoryChange}
          options={categories}
          onAddNew={onOpenCategoriesModal}
          error={errors.category}
        />
        {errors.category && (
          <p
            id="category-select-error"
            className="text-red-500 text-sm mt-1"
            role="alert"
            aria-live="polite"
          >
            {errors.category}
          </p>
        )}
      </div>

      {/* Заработок и Описание в одной строке - на мобильных вертикально */}
      <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
        <Input
          ref={earnedInputRef}
          label="Заработок (₽)"
          type="number"
          value={formData.earned != null ? String(formData.earned) : ''}
          onChange={value => onFieldChange('earned', value)}
          error={errors.earned}
          placeholder="Введите сумму"
          required
        />

        <Input
          label="Описание"
          type="text"
          value={formData.description}
          onChange={value => onFieldChange('description', value)}
          placeholder="Что вы делали?"
        />
      </div>
    </div>
  )
}
