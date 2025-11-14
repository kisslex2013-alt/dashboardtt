/**
 * 📝 Модальное окно для создания/редактирования записи времени
 * - Форма с валидацией
 * - Выбор категории из списка
 * - Автоматический расчет длительности и заработка
 * - Поддержка создания новой записи и редактирования существующей
 * 
 * ✅ ОПТИМИЗАЦИЯ: Компонент разбит на подкомпоненты и хуки для улучшения читаемости
 */

import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { BaseModal } from '../ui/BaseModal';
import { ConfirmModal } from './ConfirmModal';
import { CategoriesModal } from './CategoriesModal';
import { EntryFormFields } from '../entries/EntryFormFields';
import { EntryFormActions } from '../entries/EntryFormActions';
import { DailyEarningsDisplay } from '../entries/DailyEarningsDisplay';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useEntriesStore } from '../../store/useEntriesStore';
import { useConfirmModal } from '../../hooks/useConfirmModal';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useEntryForm } from '../../hooks/useEntryForm';
import { useEntryValidation } from '../../hooks/useEntryValidation';
import { calculateDuration } from '../../utils/calculations';
import { getTodayString } from '../../utils/dateHelpers';

export function EditEntryModal({ isOpen, onClose, entry, onSave }) {
  const { categories } = useSettingsStore();
  const { entries } = useEntriesStore();
  const { confirmConfig, openConfirm } = useConfirmModal();
  const isMobile = useIsMobile();
  
  // ✅ ОПТИМИЗАЦИЯ: Используем кастомный хук для управления формой
  const { formData, setFormData, setField, effectiveEntry } = useEntryForm(entry, categories, isOpen);
  
  // ✅ ОПТИМИЗАЦИЯ: Используем кастомный хук для валидации
  const { errors, validateForm, validateTime, clearErrors, setError } = useEntryValidation(formData, entries, effectiveEntry);
  
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
  const [pendingNewCategoryName, setPendingNewCategoryName] = useState(null);

  // Обработчик изменения обычного поля
  const handleFieldChange = useCallback((field, value) => {
    setField(field, value);
    // Очищаем ошибку при изменении поля
    if (errors[field]) {
      clearErrors([field]);
    }
  }, [setField, errors, clearErrors]);

  // Обработчик изменения времени с валидацией в реальном времени
  const handleTimeChange = useCallback((field, value) => {
    setField(field, value);
    
    // Очищаем ошибки времени при изменении
    if (errors.start || errors.end) {
      clearErrors(['start', 'end']);
    }
    
    // Валидация в реальном времени
    if (field === 'start' && value && formData.end) {
      validateTime(value, formData.end, formData.date || effectiveEntry?.date);
    } else if (field === 'end' && value && formData.start) {
      validateTime(formData.start, value, formData.date || effectiveEntry?.date);
    }
  }, [setField, formData, effectiveEntry, errors, clearErrors, validateTime]);

  // Обновление категории
  const handleCategoryChange = useCallback((categoryName) => {
    setField('category', categoryName);
  }, [setField]);

  // Обработка закрытия модального окна категорий
  const handleCategoriesModalClose = useCallback(() => {
    setIsCategoriesModalOpen(false);
  }, []);

  // Открытие модального окна категорий
  const handleOpenCategoriesModal = useCallback(() => {
    setIsCategoriesModalOpen(true);
  }, []);

  // Слушаем изменения категорий для установки новой категории
  useEffect(() => {
    if (pendingNewCategoryName) {
      const newCategory = categories.find(c => c.name === pendingNewCategoryName);
      if (newCategory) {
        // Небольшая задержка для корректной работы после закрытия модального окна
        setTimeout(() => {
          handleCategoryChange(newCategory.name);
          setPendingNewCategoryName(null);
        }, 200);
      }
    }
  }, [categories, pendingNewCategoryName, handleCategoryChange]);

  // Расчет заработка за день
  const getDailyEarnings = useCallback(() => {
    const dateToCheck = formData.date || effectiveEntry?.date || getTodayString();
    if (!dateToCheck) return 0;
    
    // Получаем все записи за день, исключая текущую редактируемую (если она уже сохранена)
    // ✅ СТАНДАРТИЗАЦИЯ ID: Конвертируем в строку для корректного сравнения
    const excludeIdString = effectiveEntry?.id ? String(effectiveEntry.id) : null;
    const dayEntries = entries.filter(e => 
      e.date === dateToCheck && 
      (excludeIdString ? String(e.id) !== excludeIdString : true)
    );
    
    // Суммируем заработок из сохраненных записей
    const totalEarnedFromEntries = dayEntries.reduce((sum, e) => sum + (parseFloat(e.earned) || 0), 0);
    
    // Добавляем заработок из текущей редактируемой записи (из формы)
    const currentEntryEarned = parseFloat(formData.earned) || 0;
    
    return totalEarnedFromEntries + currentEntryEarned;
  }, [formData, effectiveEntry, entries]);

  // Получаем дату для отображения заработка
  const getDateForEarnings = useCallback(() => {
    return formData.date || effectiveEntry?.date || getTodayString();
  }, [formData, effectiveEntry]);

  // Обработчик сохранения
  const handleSave = useCallback(() => {
    // Проверяем валидность формы перед сохранением
    if (!validateForm()) {
      return;
    }
    
    // Дополнительная проверка заработка перед сохранением
    const earnedValue = parseFloat(formData.earned) || 0;
    if (earnedValue <= 0) {
      setError('earned', 'Заработок должен быть больше 0');
      return;
    }
    
    // Расчет duration и rate на основе времени и заработка
    const duration = calculateDuration(formData.start, formData.end);
    const rate = earnedValue / parseFloat(duration);
    
    // Находим ID категории по названию
    let categoryId = formData.category;
    const foundCategory = categories.find(c => c.name === formData.category);
    if (foundCategory) {
      categoryId = foundCategory.id;
    }
    
    // Подготавливаем данные для сохранения
    const saveData = {
      date: formData.date || effectiveEntry?.date || getTodayString(),
      start: formData.start,
      end: formData.end,
      category: formData.category,
      categoryId: categoryId,
      description: formData.description || '',
      duration: parseFloat(duration),
      earned: earnedValue,
      rate: parseFloat(rate.toFixed(2)),
      isManual: true,
    };
    
    // Добавляем id и createdAt ТОЛЬКО если это существующая запись
    if (effectiveEntry?.id) {
      saveData.id = String(effectiveEntry.id);
      saveData.createdAt = effectiveEntry.createdAt;
      saveData.updatedAt = new Date().toISOString();
    }
    
    onSave(saveData);
    onClose();
  }, [formData, effectiveEntry, categories, validateForm, onSave, onClose]);
  
  // Обработчик удаления
  const handleDelete = useCallback(() => {
    openConfirm({
      title: 'Удалить запись?',
      message: 'Вы уверены, что хотите удалить эту запись? Это действие нельзя отменить.',
      onConfirm: () => {
        onSave({ ...effectiveEntry, _delete: true });
        onClose();
      },
      confirmText: 'Удалить',
      cancelText: 'Отмена'
    });
  }, [effectiveEntry, openConfirm, onSave, onClose]);

  // Определяем заголовок модального окна
  const modalTitle = effectiveEntry?.id ? 'Редактировать запись' : 'Новая запись';
  
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      size={isMobile ? "full" : "small"}
      footer={
        <EntryFormActions
          onSave={handleSave}
          onClose={onClose}
          onDelete={handleDelete}
          effectiveEntry={effectiveEntry}
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
        />
        
        {/* ✅ ОПТИМИЗАЦИЯ: Используем подкомпонент для отображения заработка */}
        <DailyEarningsDisplay
          dailyEarnings={getDailyEarnings()}
          date={getDateForEarnings()}
        />
      </div>
      
      {/* Модальное окно категорий */}
      <CategoriesModal
        isOpen={isCategoriesModalOpen}
        onClose={handleCategoriesModalClose}
        autoOpenAddForm={true}
        onCategoryAdded={(categoryName) => {
          setPendingNewCategoryName(categoryName);
        }}
      />
      
      <ConfirmModal {...confirmConfig} />
    </BaseModal>
  );
}

EditEntryModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  entry: PropTypes.shape({
    id: PropTypes.string,
    date: PropTypes.string,
    start: PropTypes.string,
    end: PropTypes.string,
    category: PropTypes.string,
    description: PropTypes.string,
    rate: PropTypes.number,
    earned: PropTypes.number
  }),
  onSave: PropTypes.func.isRequired
};
