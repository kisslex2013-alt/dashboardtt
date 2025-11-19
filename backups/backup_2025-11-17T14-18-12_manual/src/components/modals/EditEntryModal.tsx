/**
 * 📝 Модальное окно для создания/редактирования записи времени
 * - Форма с валидацией
 * - Выбор категории из списка
 * - Автоматический расчет длительности и заработка
 * - Поддержка создания новой записи и редактирования существующей
 *
 * ✅ ОПТИМИЗАЦИЯ: Компонент разбит на подкомпоненты и хуки для улучшения читаемости
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Loader2 } from '../../utils/icons'
import { useHapticFeedback } from '../../hooks/useHapticFeedback'
import { useOptimisticUpdate } from '../../hooks/useOptimisticUpdate'
import { BaseModal } from '../ui/BaseModal'
import { ConfirmModal } from './ConfirmModal'
import { CategoriesModal } from './CategoriesModal'
import { EntryFormFields } from '../entries/EntryFormFields'
import { EntryFormActions } from '../entries/EntryFormActions'
import { DailyEarningsDisplay } from '../entries/DailyEarningsDisplay'
import { useCategories } from '../../store/useSettingsStore'
import { useEntries } from '../../store/useEntriesStore'
import { useConfirmModal } from '../../hooks/useConfirmModal'
import { useIsMobile } from '../../hooks/useIsMobile'
import { useEntryForm } from '../../hooks/useEntryForm'
import { useEntryValidation } from '../../hooks/useEntryValidation'
import { calculateDuration } from '../../utils/calculations'
import { getTodayString } from '../../utils/dateHelpers'
import type { EditEntryModalProps } from '../../types'

export function EditEntryModal({ isOpen, onClose, entry, onSave }: EditEntryModalProps) {
  // ✅ ОПТИМИЗАЦИЯ: Используем атомарные селекторы для минимизации ре-рендеров
  const categories = useCategories()
  const entries = useEntries()
  const { confirmConfig, openConfirm } = useConfirmModal()
  const isMobile = useIsMobile()
  const triggerHaptic = useHapticFeedback() // ✅ UX: Haptic feedback для мобильных устройств

  // 🎯 OPTIMISTIC UI: Состояние сохранения
  const {
    value: savedData,
    isPending: isSaving,
    error: saveError,
    update: optimisticSave,
    reset: resetSaveState,
  } = useOptimisticUpdate<any>(null)

  // ✅ ИСПРАВЛЕНО: Синхронизируем entry с актуальной записью из store при открытии модального окна
  // Это гарантирует, что мы используем актуальные данные после обновления записи через updateEntry
  const syncedEntry = useMemo(() => {
    if (!entry?.id || !isOpen) return entry
    
    // Ищем актуальную запись в store по ID
    const entryIdString = String(entry.id)
    const storeEntry = entries.find(e => String(e.id) === entryIdString)
    
    // Используем запись из store, если она найдена (она содержит актуальные данные)
    // Иначе используем переданную entry (fallback)
    return storeEntry || entry
  }, [entry, entries, isOpen])

  // ✅ ОПТИМИЗАЦИЯ: Используем кастомный хук для управления формой
  const { formData, setFormData, setField, effectiveEntry } = useEntryForm(
    syncedEntry,
    categories,
    isOpen
  )

  // ✅ ОПТИМИЗАЦИЯ: Используем кастомный хук для валидации
  const { errors, validateForm, validateTime, clearErrors, setError } = useEntryValidation(
    formData,
    entries,
    effectiveEntry
  )

  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false)
  const [pendingNewCategoryName, setPendingNewCategoryName] = useState(null)

  // Обработчик изменения обычного поля
  const handleFieldChange = useCallback(
    (field, value) => {
      setField(field, value)
      // Очищаем ошибку при изменении поля
      if (errors[field]) {
        clearErrors([field])
      }
    },
    [setField, errors, clearErrors]
  )

  // Обработчик изменения времени с валидацией в реальном времени
  const handleTimeChange = useCallback(
    (field, value) => {
      setField(field, value)

      // Очищаем ошибки времени при изменении
      if (errors.start || errors.end) {
        clearErrors(['start', 'end'])
      }

      // Валидация в реальном времени
      if (field === 'start' && value && formData.end) {
        validateTime(value, formData.end, formData.date || effectiveEntry?.date)
      } else if (field === 'end' && value && formData.start) {
        validateTime(formData.start, value, formData.date || effectiveEntry?.date)
      }
    },
    [setField, formData, effectiveEntry, errors, clearErrors, validateTime]
  )

  // Обновление категории
  const handleCategoryChange = useCallback(
    categoryName => {
      setField('category', categoryName)
    },
    [setField]
  )

  // Обработка закрытия модального окна категорий
  const handleCategoriesModalClose = useCallback(() => {
    setIsCategoriesModalOpen(false)
  }, [])

  // Открытие модального окна категорий
  const handleOpenCategoriesModal = useCallback(() => {
    setIsCategoriesModalOpen(true)
  }, [])

  // Слушаем изменения категорий для установки новой категории
  useEffect(() => {
    if (pendingNewCategoryName) {
      const newCategory = categories.find(c => c.name === pendingNewCategoryName)
      if (newCategory) {
        // Небольшая задержка для корректной работы после закрытия модального окна
        setTimeout(() => {
          handleCategoryChange(newCategory.name)
          setPendingNewCategoryName(null)
        }, 200)
      }
    }
  }, [categories, pendingNewCategoryName, handleCategoryChange])

  // Расчет заработка за день
  const getDailyEarnings = useCallback(() => {
    const dateToCheck = formData.date || effectiveEntry?.date || getTodayString()
    if (!dateToCheck) return 0

    // Получаем все записи за день, исключая текущую редактируемую (если она уже сохранена)
    // ✅ СТАНДАРТИЗАЦИЯ ID: Конвертируем в строку для корректного сравнения
    const excludeIdString = effectiveEntry?.id ? String(effectiveEntry.id) : null
    const dayEntries = entries.filter(
      e => e.date === dateToCheck && (excludeIdString ? String(e.id) !== excludeIdString : true)
    )

    // Суммируем заработок из сохраненных записей (исключая текущую редактируемую)
    const totalEarnedFromEntries = dayEntries.reduce(
      (sum, e) => sum + (parseFloat(e.earned) || 0),
      0
    )

    // ✅ ИСПРАВЛЕНО: Используем актуальное значение заработка из effectiveEntry (если запись уже сохранена)
    // или из formData (если запись новая или еще не сохранена)
    // effectiveEntry содержит актуальные данные из store, formData может быть еще не синхронизирован
    const currentEntryEarned = effectiveEntry?.earned != null 
      ? parseFloat(effectiveEntry.earned) || 0
      : parseFloat(formData.earned) || 0

    return totalEarnedFromEntries + currentEntryEarned
  }, [formData, effectiveEntry, entries])

  // Получаем дату для отображения заработка
  const getDateForEarnings = useCallback(() => {
    return formData.date || effectiveEntry?.date || getTodayString()
  }, [formData, effectiveEntry])

  // Обработчик сохранения
  const handleSave = useCallback(async () => {
    // Проверяем валидность формы перед сохранением
    if (!validateForm()) {
      return
    }

    // Дополнительная проверка заработка перед сохранением
    const earnedValue = parseFloat(formData.earned) || 0
    if (earnedValue <= 0) {
      setError('earned', 'Заработок должен быть больше 0')
      return
    }

    // Расчет duration и rate на основе времени и заработка
    const duration = calculateDuration(formData.start, formData.end)
    const rate = earnedValue / parseFloat(duration)

    // Находим ID категории по названию
    let categoryId = formData.category
    const foundCategory = categories.find(c => c.name === formData.category)
    if (foundCategory) {
      categoryId = foundCategory.id
    }

    // Подготавливаем данные для сохранения
    const saveData = {
      date: formData.date || effectiveEntry?.date || getTodayString(),
      start: formData.start,
      end: formData.end,
      category: formData.category,
      categoryId,
      description: formData.description || '',
      duration: parseFloat(duration),
      earned: earnedValue,
      rate: parseFloat(rate.toFixed(2)),
      isManual: true,
    }

    // Добавляем id и createdAt ТОЛЬКО если это существующая запись
    if (effectiveEntry?.id) {
      saveData.id = String(effectiveEntry.id)
      saveData.createdAt = effectiveEntry.createdAt
      saveData.updatedAt = new Date().toISOString()
    }

    try {
      // 🎯 OPTIMISTIC UI: Сразу показываем изменения, затем сохраняем в фоне
      await optimisticSave(saveData, async () => {
        // Оборачиваем синхронный onSave в Promise
        return new Promise<typeof saveData>((resolve) => {
          onSave(saveData)
          // Даем время на обновление store
          setTimeout(() => resolve(saveData), 50)
        })
      })

      triggerHaptic('success') // ✅ UX: Вибрация успеха при сохранении
      onClose()
      resetSaveState() // Сбрасываем состояние после закрытия
    } catch (error) {
      // ❌ Если сохранение провалилось, данные откатятся автоматически
      console.error('Ошибка при сохранении записи:', error)
      triggerHaptic('error')
      // Не закрываем модальное окно, чтобы пользователь мог попробовать снова
    }
  }, [
    formData,
    effectiveEntry,
    categories,
    validateForm,
    setError,
    onSave,
    onClose,
    triggerHaptic,
    optimisticSave,
    resetSaveState,
  ])

  // Обработчик удаления
  const handleDelete = useCallback(() => {
    triggerHaptic('error') // ✅ UX: Вибрация при попытке удаления
    openConfirm({
      title: 'Удалить запись?',
      message: 'Вы уверены, что хотите удалить эту запись? Это действие нельзя отменить.',
      onConfirm: () => {
        triggerHaptic('heavy') // ✅ UX: Сильная вибрация при подтверждении удаления
        onSave({ ...effectiveEntry, _delete: true })
        onClose()
      },
      confirmText: 'Удалить',
      cancelText: 'Отмена',
    })
  }, [effectiveEntry, openConfirm, onSave, onClose, triggerHaptic])

  // Определяем заголовок модального окна
  const modalTitle = effectiveEntry?.id ? 'Редактировать запись' : 'Новая запись'

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      size={isMobile ? 'full' : 'small'}
      footer={
        <EntryFormActions
          onSave={handleSave}
          onClose={onClose}
          onDelete={handleDelete}
          effectiveEntry={effectiveEntry}
          isSaving={isSaving} // 🎯 OPTIMISTIC UI: Передаем статус сохранения
        />
      }
    >
      <div className="space-y-4">
        {/* ✅ ОПТИМИЗАЦИЯ: Используем подкомпонент для полей формы */}
        <EntryFormFields
          formData={formData}
          onFieldChange={handleFieldChange}
          onTimeChange={handleTimeChange}
          onCategoryChange={handleCategoryChange}
          errors={errors}
          categories={categories}
          onOpenCategoriesModal={handleOpenCategoriesModal}
          effectiveEntry={effectiveEntry}
          disabled={isSaving} // 🎯 OPTIMISTIC UI: Блокируем форму при сохранении
        />

        {/* ✅ ОПТИМИЗАЦИЯ: Используем подкомпонент для отображения заработка */}
        <DailyEarningsDisplay dailyEarnings={getDailyEarnings()} date={getDateForEarnings()} />

        {/* 🎯 OPTIMISTIC UI: Индикатор сохранения */}
        {isSaving && (
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm font-medium">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Сохранение...</span>
          </div>
        )}

        {/* 🎯 OPTIMISTIC UI: Ошибка сохранения */}
        {saveError && (
          <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">
              ❌ Не удалось сохранить запись. Проверьте данные и попробуйте снова.
            </p>
          </div>
        )}
      </div>

      {/* Модальное окно категорий */}
      <CategoriesModal
        isOpen={isCategoriesModalOpen}
        onClose={handleCategoriesModalClose}
        autoOpenAddForm={true}
        onCategoryAdded={categoryName => {
          setPendingNewCategoryName(categoryName)
        }}
      />

      <ConfirmModal {...confirmConfig} />
    </BaseModal>
  )
}
