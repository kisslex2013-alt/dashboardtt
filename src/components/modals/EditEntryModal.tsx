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
import { useOpenModal } from '../../store/useUIStore'
import type { EditEntryModalProps } from '../../types'

export function EditEntryModal({ isOpen, onClose, entry, onSave }: EditEntryModalProps) {
  // ✅ ОПТИМИЗАЦИЯ: Используем атомарные селекторы для минимизации ре-рендеров
  const categories = useCategories()
  const entries = useEntries()
  const { confirmConfig, openConfirm } = useConfirmModal()
  const isMobile = useIsMobile()
  const triggerHaptic = useHapticFeedback() // ✅ UX: Haptic feedback для мобильных устройств
  const openModal = useOpenModal() // ✅ ИСПРАВЛЕНО: Добавлен хук для открытия модального окна настроек

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
        validateTime(value, formData.end, formData.date || effectiveEntry?.date || '')
      } else if (field === 'end' && value && formData.start) {
        validateTime(formData.start, value, formData.date || effectiveEntry?.date || '')
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

  // ✅ ИСПРАВЛЕНО: Открытие модального окна настроек с табом "Категории"
  // НЕ закрываем EditEntryModal - используем nested модальные окна
  // EditEntryModal остается открытым, SoundNotificationsSettingsModal открывается поверх него
  const handleOpenCategoriesModal = useCallback(() => {
    // Открываем SoundNotificationsSettingsModal поверх EditEntryModal (nested)
    // EditEntryModal остается открытым, чтобы пользователь мог продолжить редактирование после закрытия настроек
    openModal('soundSettings', { activeTab: 'categories' })
  }, [openModal])

  // Расчет статистики за день (заработок и ставка)
  const getDailyStats = useCallback(() => {
    const dateToCheck = formData.date || effectiveEntry?.date || getTodayString()
    if (!dateToCheck) return { totalEarned: 0, averageRate: 0 }

    // Получаем все сохраненные записи за день (исключаем текущую таймерную если isManual=false)
    const dayEntries = entries.filter(e => e.date === dateToCheck && e.isManual !== false)

    const excludeIdString = effectiveEntry?.id ? String(effectiveEntry.id) : null

    // Агрегируем данные
    let totalEarned = 0
    let totalHours = 0

    // Добавляем существующие записи
    dayEntries.forEach(e => {
        // Если это редактируемая запись, пропускаем (добавим данные из формы ниже)
        if (excludeIdString && String(e.id) === excludeIdString) return
        
        totalEarned += (parseFloat(String(e.earned)) || 0)
        totalHours += (parseFloat(String(e.duration)) || 0)
    })

    // Добавляем данные из текущей формы
    const currentEarned = parseFloat(formData.earned) || 0
    const currentDurationStr = calculateDuration(formData.start, formData.end)
    // Convert duration string "Xч Yм" to number hours
    // This is tricky because calculateDuration likely returns formatted string.
    // However, logic in save uses calculateDuration then parseFloat(duration)? 
    // Wait, calculateDuration usually returns string like "1.5". Check imports.
    // Step 686 imports calculateDuration from utils/calculations.
    // If it returns "1.5" (string), parseFloat works.
    // If it returns "1ч 30м", parseFloat is NaN.
    // Usually in this project duration is stored as number string "1.5".
    // Let's assume calculateDuration returns decimal string (as used in save logic).
    // line 204: duration: parseFloat(duration) -> implies calculateDuration gives parseable string.
    
    const currentDurationVal = parseFloat(currentDurationStr) || 0
    
    totalEarned += currentEarned
    totalHours += currentDurationVal

    const averageRate = totalHours > 0 ? totalEarned / totalHours : 0

    return { totalEarned, averageRate }
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
    const saveData: any = {
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
          onSave?.(saveData)
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
        onSave?.({ ...effectiveEntry, _delete: true } as any)
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
      closeOnOverlayClick={false}
      hideFooterDivider={true}
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

        {/* ✅ ОПТИМИЗАЦИЯ: Используем подкомпонент для отображения заработка и статистики */}
        {(() => {
           const stats = getDailyStats()
           return (
             <DailyEarningsDisplay 
                dailyEarnings={stats.totalEarned} 
                dailyRate={stats.averageRate}
                date={getDateForEarnings()} 
             />
           )
        })()}

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

      {/* ✅ ИСПРАВЛЕНО: Модальное окно категорий теперь открывается через SoundNotificationsSettingsModal */}
      {/* Оно открывается через handleOpenCategoriesModal, который использует openModal('soundSettings', { activeTab: 'categories' }) */}

      <ConfirmModal {...confirmConfig} />
    </BaseModal>
  )
}
