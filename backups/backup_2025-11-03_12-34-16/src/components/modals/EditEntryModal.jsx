import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Input } from '../ui/Input';
import { TimeInput } from '../ui/TimeInput';
import { CategorySelect } from '../ui/CategorySelect';
import { CustomDatePicker } from '../ui/CustomDatePicker';
import { Button } from '../ui/Button';
import { BaseModal } from '../ui/BaseModal';
import { ConfirmModal } from './ConfirmModal';
import { CategoriesModal } from './CategoriesModal';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useEntriesStore } from '../../store/useEntriesStore';
import { useConfirmModal } from '../../hooks/useConfirmModal';
import { calculateDuration, calculateEarned } from '../../utils/calculations';
import { validateEntryForm } from '../../utils/validators';
import { getIcon } from '../../utils/iconHelper';
import { timeToMinutes } from '../../utils/dateHelpers'; // ИСПРАВЛЕНО: Импорт для проверки пересечений

/**
 * 📝 Модальное окно для создания/редактирования записи времени
 * - Форма с валидацией
 * - Выбор категории из списка
 * - Автоматический расчет длительности и заработка
 * - Поддержка создания новой записи и редактирования существующей
 */
export function EditEntryModal({ isOpen, onClose, entry, onSave }) {
  const { categories, addCategory } = useSettingsStore();
  const { entries } = useEntriesStore();
  const { confirmConfig, openConfirm } = useConfirmModal();
  
  const [formData, setFormData] = useState(entry || {
    date: new Date().toISOString().split('T')[0],
    start: '',
    end: '',
    category: '',
    description: '',
    earned: 0,
  });
  
  const [errors, setErrors] = useState({});
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
  const [pendingNewCategoryName, setPendingNewCategoryName] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const dateInputRef = useRef(null);
  // ИСПРАВЛЕНО: Refs для автоматического перехода фокуса
  const startTimeRef = useRef(null);
  const endTimeRef = useRef(null);
  const earnedInputRef = useRef(null);
  
  // Обновляем formData когда entry изменяется
  useEffect(() => {
    if (entry) {
      // Конвертируем categoryId в название категории, если необходимо
      let categoryName = entry.category;
      
      // Если category - это ID, ищем по ID
      if (entry.categoryId && !entry.category) {
        const foundCategory = categories.find(c => c.id === entry.categoryId);
        categoryName = foundCategory ? foundCategory.name : categories[0]?.name || 'Разработка';
      } else if (entry.category) {
        // Проверяем, является ли entry.category ID или name
        const foundById = categories.find(c => c.id === entry.category);
        const foundByName = categories.find(c => c.name === entry.category);
        
        if (foundById) {
          categoryName = foundById.name;
        } else if (foundByName) {
          categoryName = foundByName.name;
        } else {
          // Если категория не найдена, используем первую доступную
          categoryName = categories[0]?.name || 'Разработка';
        }
      }
      
      setFormData({
        ...entry,
        category: categoryName,
      });
    } else {
      setFormData({
        date: new Date().toISOString().split('T')[0],
        start: '',
        end: '',
        category: categories[0]?.name || 'Разработка',
        description: '',
        earned: 0,
      });
    }
  }, [entry, categories]);
  
  // ИСПРАВЛЕНО: Функция для проверки пересечений временных промежутков
  const checkTimeOverlap = (start, end, date) => {
    if (!start || !end || !date) return null;
    
    const startMinutes = timeToMinutes(start);
    const endMinutes = timeToMinutes(end);
    
    // Получаем записи за ту же дату, исключая текущую редактируемую
    const sameDayEntries = entries.filter(e => 
      e.date === date && 
      e.id !== entry?.id && 
      e.start && 
      e.end
    );
    
    if (sameDayEntries.length === 0) return null;
    
    // Проверяем пересечение с каждой записью
    for (const otherEntry of sameDayEntries) {
      const otherStart = timeToMinutes(otherEntry.start);
      const otherEnd = timeToMinutes(otherEntry.end);
      
      // ИСПРАВЛЕНО: Проверка пересечения интервалов (start < otherEnd) && (end > otherStart)
      if (startMinutes < otherEnd && endMinutes > otherStart) {
        return `Время пересекается с записью ${otherEntry.start} → ${otherEntry.end}`;
      }
    }
    
    return null;
  };

  // Валидация формы (используем общую утилиту)
  const validateForm = () => {
    // Расширяем валидацию для проверки заработка
    const validation = validateEntryForm(formData);
    
    // ИСПРАВЛЕНО: Проверка заработка (с учетом, что значение может быть 0 или пустой строкой)
    const earnedValue = parseFloat(formData.earned) || 0;
    if (!earnedValue || earnedValue <= 0) {
      validation.errors.earned = 'Заработок должен быть больше 0';
      validation.isValid = false;
    }
    
    // ИСПРАВЛЕНО: Проверка времени (start < end)
    if (formData.start && formData.end) {
      const [startH, startM] = formData.start.split(':').map(Number);
      const [endH, endM] = formData.end.split(':').map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      
      if (startMinutes >= endMinutes) {
        validation.errors.start = 'Время начала должно быть раньше времени окончания';
        validation.errors.end = 'Время окончания должно быть позже времени начала';
        validation.isValid = false;
      } else {
        // ИСПРАВЛЕНО: Проверка пересечений с другими записями
        const overlapError = checkTimeOverlap(
          formData.start, 
          formData.end, 
          formData.date || entry?.date
        );
        if (overlapError) {
          validation.errors.start = overlapError;
          validation.errors.end = overlapError;
          validation.isValid = false;
        }
      }
    }
    
    setErrors(validation.errors);
    return validation.isValid;
  };
  
  const handleSave = () => {
    // ИСПРАВЛЕНО: Проверяем валидность формы перед сохранением
    if (!validateForm()) {
      // Показываем ошибки валидации
      return;
    }
    
    // ИСПРАВЛЕНО: Дополнительная проверка заработка перед сохранением
    const earnedValue = parseFloat(formData.earned) || 0;
    if (earnedValue <= 0) {
      setErrors(prev => ({ ...prev, earned: 'Заработок должен быть больше 0' }));
      return;
    }
    
    // Расчет duration и rate на основе времени и заработка
    const duration = calculateDuration(formData.start, formData.end);
    const rate = earnedValue / parseFloat(duration);
    
    // Подготавливаем данные для сохранения
    const saveData = {
      ...formData,
      date: formData.date || entry?.date || new Date().toISOString().split('T')[0],
      duration: parseFloat(duration),
      earned: earnedValue,
      rate: parseFloat(rate.toFixed(2)),
      isManual: true,
    };
    
    // Добавляем id и createdAt ТОЛЬКО если это существующая запись
    if (entry?.id) {
      saveData.id = entry.id;
      saveData.createdAt = entry.createdAt;
    }
    
    onSave(saveData);
    
    onClose();
    setErrors({});
  };
  
  const handleDelete = () => {
    openConfirm({
      title: 'Удалить запись?',
      message: 'Вы уверены, что хотите удалить эту запись? Это действие нельзя отменить.',
      onConfirm: () => {
        onSave({ ...entry, _delete: true });
        onClose();
      },
      confirmText: 'Удалить',
      cancelText: 'Отмена'
    });
  };
  
  // Обновление категории
  const handleCategoryChange = (categoryName) => {
    setFormData({
      ...formData,
      category: categoryName,
    });
  };
  
  // Обработка закрытия модального окна категорий
  const handleCategoriesModalClose = () => {
    setIsCategoriesModalOpen(false);
  };
  
  // Открытие модального окна категорий с активной формой добавления
  const handleOpenCategoriesModal = () => {
    setIsCategoriesModalOpen(true);
  };
  
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
  }, [categories, pendingNewCategoryName]);
  
  // Расчет заработка за день
  const getDailyEarnings = () => {
    const dateToCheck = formData.date || entry?.date || new Date().toISOString().split('T')[0];
    if (!dateToCheck) return 0;
    
    const dayEntries = entries.filter(e => e.date === dateToCheck);
    const totalEarned = dayEntries.reduce((sum, e) => sum + (parseFloat(e.earned) || 0), 0);
    return totalEarned;
  };
  
  // Получаем дату для отображения заработка
  const getDateForEarnings = () => {
    return formData.date || entry?.date || new Date().toISOString().split('T')[0];
  };
  
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={entry ? 'Редактировать запись' : 'Новая запись'}
      size="small"
      footer={
        <div className="flex justify-between gap-2">
          {entry && (
            <Button variant="danger" onClick={handleDelete}>
              Удалить
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button variant="secondary" onClick={onClose} type="button">
              Отмена
            </Button>
            {/* ИСПРАВЛЕНО: Добавлен type="button" для предотвращения submit формы */}
            <Button onClick={handleSave} type="button">
              Сохранить
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
            {/* Поле даты - только при создании новой записи */}
            {!entry && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Дата <span className="text-red-500">*</span>
                </label>
                <input
                  ref={dateInputRef}
                  type="text"
                  readOnly
                  value={formData.date ? (() => {
                    const [year, month, day] = formData.date.split('-');
                    return `${day}/${month}/${year}`;
                  })() : ''}
                  onFocus={() => setShowDatePicker(true)}
                  placeholder="дд/мм/гггг"
                  className="w-full px-4 py-2 glass-effect rounded-lg border-2 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/80 dark:bg-gray-800/80 cursor-pointer"
                />
                {showDatePicker && (
                  <CustomDatePicker
                    value={formData.date}
                    onChange={(date) => {
                      setFormData({ ...formData, date });
                      setShowDatePicker(false);
                    }}
                    onClose={() => setShowDatePicker(false)}
                    inputRef={dateInputRef}
                  />
                )}
                {errors.date && (
                  <p className="text-red-500 text-sm mt-1">{errors.date}</p>
                )}
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Время начала <span className="text-red-500">*</span>
                </label>
                <TimeInput
                  ref={startTimeRef}
                  value={formData.start}
                  onChange={(value) => {
                    setFormData({ ...formData, start: value });
                    // ИСПРАВЛЕНО: Очищаем ошибку времени при изменении
                    if (errors.start || errors.end) {
                      setErrors(prev => ({ ...prev, start: undefined, end: undefined }));
                    }
                    // ИСПРАВЛЕНО: Валидация в реальном времени
                    if (value && formData.end) {
                      const [startH, startM] = value.split(':').map(Number);
                      const [endH, endM] = formData.end.split(':').map(Number);
                      const startMinutes = startH * 60 + startM;
                      const endMinutes = endH * 60 + endM;
                      if (startMinutes >= endMinutes) {
                        setErrors(prev => ({ 
                          ...prev, 
                          start: 'Время начала должно быть раньше времени окончания',
                          end: 'Время окончания должно быть позже времени начала'
                        }));
                      } else {
                        // ИСПРАВЛЕНО: Проверка пересечений в реальном времени
                        const overlapError = checkTimeOverlap(
                          value, 
                          formData.end, 
                          formData.date || entry?.date
                        );
                        if (overlapError) {
                          setErrors(prev => ({ 
                            ...prev, 
                            start: overlapError,
                            end: overlapError
                          }));
                        }
                      }
                    }
                  }}
                  placeholder="чч:мм"
                  error={errors.start}
                  onComplete={() => {
                    // ИСПРАВЛЕНО: Автоматический переход на поле "Время окончания"
                    endTimeRef.current?.focus();
                  }}
                />
                {errors.start && (
                  <p className="text-red-500 text-sm mt-1">{errors.start}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Время окончания <span className="text-red-500">*</span>
                </label>
                <TimeInput
                  ref={endTimeRef}
                  value={formData.end}
                  onChange={(value) => {
                    setFormData({ ...formData, end: value });
                    // ИСПРАВЛЕНО: Очищаем ошибку времени при изменении
                    if (errors.start || errors.end) {
                      setErrors(prev => ({ ...prev, start: undefined, end: undefined }));
                    }
                    // ИСПРАВЛЕНО: Валидация в реальном времени
                    if (value && formData.start) {
                      const [startH, startM] = formData.start.split(':').map(Number);
                      const [endH, endM] = value.split(':').map(Number);
                      const startMinutes = startH * 60 + startM;
                      const endMinutes = endH * 60 + endM;
                      if (startMinutes >= endMinutes) {
                        setErrors(prev => ({ 
                          ...prev, 
                          start: 'Время начала должно быть раньше времени окончания',
                          end: 'Время окончания должно быть позже времени начала'
                        }));
                      } else {
                        // ИСПРАВЛЕНО: Проверка пересечений в реальном времени
                        const overlapError = checkTimeOverlap(
                          formData.start, 
                          value, 
                          formData.date || entry?.date
                        );
                        if (overlapError) {
                          setErrors(prev => ({ 
                            ...prev, 
                            start: overlapError,
                            end: overlapError
                          }));
                        }
                      }
                    }
                  }}
                  placeholder="чч:мм"
                  error={errors.end}
                  onComplete={() => {
                    // ИСПРАВЛЕНО: Автоматический переход на поле "Заработок"
                    earnedInputRef.current?.focus();
                  }}
                />
                {errors.end && (
                  <p className="text-red-500 text-sm mt-1">{errors.end}</p>
                )}
              </div>
            </div>
            
            {/* Кастомный Select для категории с иконками */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Категория <span className="text-red-500">*</span>
              </label>
              <CategorySelect
                value={formData.category}
                onChange={handleCategoryChange}
                options={categories}
                onAddNew={handleOpenCategoriesModal}
                error={errors.category}
              />
              {errors.category && (
                <p className="text-red-500 text-sm mt-1">{errors.category}</p>
              )}
            </div>
            
            {/* Заработок и Описание в одной строке */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                ref={earnedInputRef}
                label="Заработок (₽)"
                type="number"
                value={formData.earned}
                onChange={(value) => setFormData({ ...formData, earned: parseFloat(value) || 0 })}
                error={errors.earned}
                placeholder="Введите сумму заработка"
                required
              />
              
              <Input
                label="Описание"
                type="text"
                value={formData.description}
                onChange={(value) => setFormData({ ...formData, description: value })}
                placeholder="Что вы делали?"
              />
            </div>
            
            {/* Заработок за день */}
            {getDateForEarnings() && (
              <div className="py-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Заработок за день:
                    </span>
                  </div>
                  <span className="text-lg font-bold text-green-600 dark:text-green-400">
                    {getDailyEarnings().toLocaleString('ru-RU')} ₽
                  </span>
                </div>
              </div>
            )}
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

