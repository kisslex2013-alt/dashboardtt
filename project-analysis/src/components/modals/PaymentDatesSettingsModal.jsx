import { useState, useEffect } from 'react'
import { BaseModal } from '../ui/BaseModal'
import {
  usePaymentDates,
  useAddPaymentDate,
  useUpdatePaymentDate,
  useDeletePaymentDate,
  useReorderPaymentDates,
} from '../../store/useSettingsStore'
import { useUIStore } from '../../store/useUIStore'
import { generateUUID } from '../../utils/uuid'
import { validatePaymentDate } from '../../utils/paymentCalculations'
import { Plus, Trash2, Edit2, GripVertical, X, Save } from 'lucide-react'
import { logger } from '../../utils/logger'

/**
 * Модальное окно настройки дат выплат
 * - Добавление новых выплат
 * - Редактирование существующих выплат
 * - Удаление выплат
 * - Изменение порядка выплат
 * - Настройка дат, периодов и цветов
 */
export function PaymentDatesSettingsModal({ isOpen, onClose }) {
  // ✅ ОПТИМИЗАЦИЯ: Используем атомарные селекторы для минимизации ре-рендеров
  const savedPaymentDates = usePaymentDates()
  const addPaymentDate = useAddPaymentDate()
  const updatePaymentDate = useUpdatePaymentDate()
  const deletePaymentDate = useDeletePaymentDate()
  const reorderPaymentDates = useReorderPaymentDates()

  const { showSuccess, showError } = useUIStore()

  const [paymentDates, setPaymentDates] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [draggedId, setDraggedId] = useState(null)

  // Загружаем сохраненные настройки при открытии
  useEffect(() => {
    if (isOpen) {
      setPaymentDates([...savedPaymentDates])
      setEditingId(null)
    }
  }, [isOpen, savedPaymentDates])

  // Цвета по умолчанию для выбора
  const defaultColors = [
    '#10B981', // Зеленый
    '#06B6D4', // Голубой
    '#3B82F6', // Синий
    '#8B5CF6', // Фиолетовый
    '#F59E0B', // Оранжевый
    '#EF4444', // Красный
    '#EC4899', // Розовый
    '#14B8A6', // Бирюзовый
  ]

  // Создание новой выплаты
  const handleAddPayment = () => {
    const newPayment = {
      id: generateUUID(),
      name: 'Новая выплата',
      day: 25,
      monthOffset: 0,
      customDate: '', // Конкретная дата выплаты (ДД.ММ)
      period: { start: 1, end: 15 },
      color: defaultColors[paymentDates.length % defaultColors.length],
      order: paymentDates.length + 1,
      enabled: true,
    }
    setPaymentDates([...paymentDates, newPayment])
    setEditingId(newPayment.id)
  }

  // Начало редактирования
  const handleStartEdit = id => {
    setEditingId(id)
  }

  // Сохранение изменений
  const handleSaveEdit = id => {
    const payment = paymentDates.find(p => p.id === id)
    if (!payment) return

    // Валидация
    const validation = validatePaymentDate(
      payment,
      paymentDates.filter(p => p.id !== id)
    )
    if (!validation.isValid) {
      showError(validation.errors.join(', '))
      return
    }

    // Обновляем в store
    if (savedPaymentDates.find(p => p.id === id)) {
      updatePaymentDate(id, payment)
    } else {
      addPaymentDate(payment)
    }

    setEditingId(null)
    showSuccess('Выплата сохранена')
  }

  // Отмена редактирования
  const handleCancelEdit = () => {
    setPaymentDates([...savedPaymentDates])
    setEditingId(null)
  }

  // Удаление выплаты
  const handleDelete = id => {
    if (!confirm('Вы уверены, что хотите удалить эту выплату?')) return

    deletePaymentDate(id)
    setPaymentDates(paymentDates.filter(p => p.id !== id))
    showSuccess('Выплата удалена')
  }

  // Обновление поля выплаты
  const handleUpdateField = (id, field, value) => {
    setPaymentDates(paymentDates.map(p => (p.id === id ? { ...p, [field]: value } : p)))
  }

  // Обновление периода
  const handleUpdatePeriod = (id, field, value) => {
    setPaymentDates(
      paymentDates.map(p =>
        p.id === id ? { ...p, period: { ...p.period, [field]: parseInt(value) || 0 } } : p
      )
    )
  }

  // Сохранение всех изменений
  const handleSaveAll = () => {
    // Валидируем все выплаты
    const errors = []
    paymentDates.forEach(payment => {
      const validation = validatePaymentDate(
        payment,
        paymentDates.filter(p => p.id !== payment.id)
      )
      if (!validation.isValid) {
        errors.push(`${payment.name}: ${validation.errors.join(', ')}`)
      }
    })

    if (errors.length > 0) {
      showError(errors.join('; '))
      return
    }

    // Сохраняем все выплаты
    paymentDates.forEach(payment => {
      if (savedPaymentDates.find(p => p.id === payment.id)) {
        updatePaymentDate(payment.id, payment)
      } else {
        addPaymentDate(payment)
      }
    })

    // Удаляем выплаты, которых больше нет
    savedPaymentDates.forEach(saved => {
      if (!paymentDates.find(p => p.id === saved.id)) {
        deletePaymentDate(saved.id)
      }
    })

    showSuccess('Настройки выплат сохранены')
    onClose()
  }

  // Переключение enabled
  const handleToggleEnabled = id => {
    const payment = paymentDates.find(p => p.id === id)
    if (!payment) return

    handleUpdateField(id, 'enabled', !payment.enabled)
  }

  // Обработчики drag and drop
  const handleDragStart = (e, id) => {
    setDraggedId(id)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', id)
    // Находим элемент по ID и делаем его полупрозрачным
    const element = e.currentTarget
    if (element) {
      element.style.opacity = '0.5'
    }
  }

  const handleDragEnd = e => {
    const element = e.currentTarget
    if (element) {
      element.style.opacity = '1'
    }
    setDraggedId(null)
  }

  const handleDragOver = e => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move'
    }
  }

  const handleDragEnter = e => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e, targetId) => {
    e.preventDefault()
    e.stopPropagation()
    
    const draggedIdFromData = e.dataTransfer.getData('text/plain')
    if (!draggedIdFromData || draggedIdFromData === targetId) {
      setDraggedId(null)
      return
    }

    const draggedIndex = paymentDates.findIndex(p => p.id === draggedIdFromData)
    const targetIndex = paymentDates.findIndex(p => p.id === targetId)

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedId(null)
      return
    }

    const newPaymentDates = [...paymentDates]
    const [draggedItem] = newPaymentDates.splice(draggedIndex, 1)
    newPaymentDates.splice(targetIndex, 0, draggedItem)

    // Обновляем порядок
    const reordered = newPaymentDates.map((p, index) => ({
      ...p,
      order: index + 1,
    }))

    setPaymentDates(reordered)
    
    // Сохраняем новый порядок в store
    const newOrder = reordered.map(p => p.id)
    reorderPaymentDates(newOrder)
    
    setDraggedId(null)
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Настройка дат выплат"
      subtitle="Настройте даты, периоды и названия ваших выплат"
      size="large"
      footer={
        <div className="flex gap-2 sm:gap-3">
          <button
            onClick={onClose}
            className="px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg sm:rounded-xl font-semibold text-gray-800 dark:text-gray-200 transition-normal hover-lift-scale click-shrink"
          >
            Отмена
          </button>
          <button
            onClick={handleSaveAll}
            className="flex-1 px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg sm:rounded-xl font-semibold transition-normal hover-lift-scale click-shrink shadow-lg shadow-blue-500/50"
          >
            Сохранить все
          </button>
        </div>
      }
      className="flex flex-col max-h-[90vh]"
    >
      <div className="flex-1 overflow-y-auto pr-1 sm:pr-2 -mr-1 sm:-mr-2">
        {/* Список выплат */}
        <div className="space-y-3 mb-4">
          {paymentDates.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p className="text-sm mb-2">Нет настроенных выплат</p>
              <p className="text-xs">Добавьте первую выплату</p>
            </div>
          ) : (
            paymentDates
              .sort((a, b) => a.order - b.order)
              .map((payment, index) => {
                const isEditing = editingId === payment.id

                return (
                  <div
                    key={payment.id}
                    draggable={!isEditing}
                    onDragStart={e => {
                      if (!isEditing) {
                        handleDragStart(e, payment.id)
                      }
                    }}
                    onDragEnd={handleDragEnd}
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragEnter}
                    onDrop={e => {
                      if (!isEditing) {
                        handleDrop(e, payment.id)
                      }
                    }}
                    className={`glass-effect rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700 transition-all ${
                      draggedId === payment.id ? 'opacity-50' : ''
                    } ${!isEditing ? 'cursor-move' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      {/* Левая часть: Drag handle и порядковый номер */}
                      <div
                        className={`flex items-center gap-2 ${!isEditing ? 'cursor-move' : 'cursor-default'}`}
                        onMouseDown={e => {
                          if (!isEditing) {
                            e.preventDefault()
                          }
                        }}
                      >
                        <GripVertical className={`w-5 h-5 text-gray-400 dark:text-gray-500 ${!isEditing ? 'cursor-move' : 'cursor-default'}`} />
                        <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                          {index + 1}.
                        </span>
                      </div>

                      {/* Центральная часть: Форма редактирования или отображение */}
                      <div className="flex-1 space-y-3">
                        {isEditing ? (
                          <>
                            {/* Название */}
                            <div className="flex items-center gap-3">
                              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap min-w-[80px]">
                                Название
                              </label>
                              <input
                                type="text"
                                value={payment.name}
                                onChange={e =>
                                  handleUpdateField(payment.id, 'name', e.target.value)
                                }
                                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Например: Аванс, Зарплата"
                              />
                            </div>

                            {/* Дата выплаты */}
                            <div className="flex items-center gap-3">
                              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap min-w-[80px]">
                                Дата выплаты
                              </label>
                              <input
                                type="text"
                                value={payment.customDate || ''}
                                onChange={e => {
                                  const value = e.target.value
                                  // Разрешаем только цифры и точку, формат ДД.ММ
                                  if (value === '' || /^\d{0,2}(\.\d{0,2})?$/.test(value)) {
                                    handleUpdateField(payment.id, 'customDate', value)
                                  }
                                }}
                                placeholder="25.11 или оставьте пустым для авто-расчета"
                                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>

                            {/* Месяц, С и По в одной строке */}
                            <div className="grid grid-cols-[2fr_1fr_1fr] gap-2">
                              <div className="flex items-center gap-1.5">
                                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap w-12 flex-shrink-0">
                                  Месяц
                                </label>
                                <select
                                  value={payment.monthOffset}
                                  onChange={e =>
                                    handleUpdateField(
                                      payment.id,
                                      'monthOffset',
                                      parseInt(e.target.value)
                                    )
                                  }
                                  disabled={!!payment.customDate}
                                  className="flex-1 px-2 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <option value="0">Текущий</option>
                                  <option value="1">Следующий</option>
                                  <option value="-1">Предыдущий</option>
                                </select>
                              </div>
                              <div className="flex items-center gap-1">
                                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap w-4 flex-shrink-0 text-center">
                                  С
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  max="31"
                                  value={payment.period.start}
                                  onChange={e =>
                                    handleUpdatePeriod(payment.id, 'start', e.target.value)
                                  }
                                  className="flex-1 px-2 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                              <div className="flex items-center gap-1">
                                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap w-4 flex-shrink-0 text-center">
                                  По
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  max="31"
                                  value={payment.period.end}
                                  onChange={e =>
                                    handleUpdatePeriod(payment.id, 'end', e.target.value)
                                  }
                                  className="flex-1 px-2 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                            </div>

                            {/* Цвет */}
                            <div className="flex items-center gap-3">
                              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap min-w-[80px]">
                                Цвет
                              </label>
                              <div className="flex gap-2 flex-wrap flex-1">
                                {defaultColors.map(color => (
                                  <button
                                    key={color}
                                    type="button"
                                    onClick={() => handleUpdateField(payment.id, 'color', color)}
                                    className={`w-8 h-8 rounded-lg border-2 transition-all ${
                                      payment.color === color
                                        ? 'border-gray-900 dark:border-white scale-110'
                                        : 'border-gray-300 dark:border-gray-600 hover:scale-105'
                                    }`}
                                    style={{ backgroundColor: color }}
                                    title={color}
                                  />
                                ))}
                                <input
                                  type="color"
                                  value={payment.color}
                                  onChange={e =>
                                    handleUpdateField(payment.id, 'color', e.target.value)
                                  }
                                  className="w-8 h-8 rounded-lg border-2 border-gray-300 dark:border-gray-600 cursor-pointer"
                                  title="Выбрать цвет"
                                />
                              </div>
                            </div>

                            {/* Кнопки редактирования */}
                            <div className="flex gap-2 pt-2 justify-end">
                              <button
                                onClick={() => handleSaveEdit(payment.id)}
                                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-normal hover-lift-scale click-shrink flex items-center justify-center gap-2"
                              >
                                <Save className="w-4 h-4" />
                                Сохранить
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="px-3 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg text-sm font-medium transition-normal hover-lift-scale click-shrink flex items-center justify-center gap-2"
                              >
                                <X className="w-4 h-4" />
                                Отмена
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            {/* Отображение данных */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-4 h-4 rounded-full"
                                  style={{ backgroundColor: payment.color }}
                                />
                                <div>
                                  <p className="font-semibold text-gray-900 dark:text-white">
                                    {payment.name}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {payment.customDate
                                      ? `Дата: ${payment.customDate}`
                                      : `Дата: ${payment.day} число ${
                                          payment.monthOffset === 0
                                            ? 'текущего'
                                            : payment.monthOffset === 1
                                              ? 'следующего'
                                              : 'предыдущего'
                                        } месяца`}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Период: {payment.period.start}-{payment.period.end} число
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={payment.enabled}
                                    onChange={() => handleToggleEnabled(payment.id)}
                                    className="w-4 h-4 text-blue-500 rounded"
                                  />
                                  <span className="text-xs text-gray-600 dark:text-gray-400">
                                    Включена
                                  </span>
                                </label>
                                <button
                                  onClick={() => handleStartEdit(payment.id)}
                                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-normal"
                                  title="Редактировать"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(payment.id)}
                                  className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-normal"
                                  title="Удалить"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
          )}
        </div>

        {/* Кнопка добавления */}
        <button
          onClick={handleAddPayment}
          className="w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-normal flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">Добавить выплату</span>
        </button>
      </div>
    </BaseModal>
  )
}
