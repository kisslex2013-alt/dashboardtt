import { useState, useEffect, useCallback } from 'react'
import { BaseModal } from '../../ui/BaseModal'
import {
  usePaymentDates,
  useAddPaymentDate,
  useUpdatePaymentDate,
  useDeletePaymentDate,
  useReorderPaymentDates,
} from '../../../store/useSettingsStore'
import { useUIStore } from '../../../store/useUIStore'
import { generateUUID } from '../../../utils/uuid'
import { Plus } from '../../../utils/icons'
import { PaymentCalendar } from './PaymentCalendar'
import { PaymentDateItem } from './PaymentDateItem'
import { usePaymentCalendar } from './hooks/usePaymentCalendar'
import { usePaymentSelection } from './hooks/usePaymentSelection'
import { usePaymentValidation } from './hooks/usePaymentValidation'
import { getPaymentMonth, getPeriodMonth } from './utils/calendarHelpers'
import { defaultColors } from './utils/paymentFormatters'

/**
 * Модальное окно настройки дат выплат с календарным видом
 * - Добавление новых выплат
 * - Редактирование существующих выплат
 * - Удаление выплат
 * - Изменение порядка выплат
 * - Настройка дат, периодов и цветов
 * - Календарный выбор дня выплаты и периода
 */
export function PaymentDatesSettingsModal({ isOpen, onClose }) {
  const savedPaymentDates = usePaymentDates()
  const addPaymentDate = useAddPaymentDate()
  const updatePaymentDate = useUpdatePaymentDate()
  const deletePaymentDate = useDeletePaymentDate()
  const reorderPaymentDates = useReorderPaymentDates()
  const { showSuccess, showError } = useUIStore()

  const [paymentDates, setPaymentDates] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [draggedId, setDraggedId] = useState(null)

  // Инициализация календаря
  const now = new Date()
  const calendar = usePaymentCalendar(now.getFullYear(), now.getMonth())

  // Валидация
  const { validatePayment, validateAll } = usePaymentValidation(paymentDates)

  // Обновление поля выплаты
  const handleUpdateField = useCallback((id, field, value) => {
    setPaymentDates(prev => prev.map(p => (p.id === id ? { ...p, [field]: value } : p)))
  }, [])

  // Обновление периода (оба поля одновременно)
  const handleUpdatePeriodBoth = useCallback(
    (id, start, end, periodMonth) => {
      setPaymentDates(prev =>
        prev.map(p => {
          if (p.id === id) {
            return {
              ...p,
              period: {
                start: parseInt(start) || 0,
                end: parseInt(end) || 0,
                periodMonth: periodMonth !== undefined ? periodMonth : p.period?.periodMonth,
              },
            }
          }
          return p
        })
      )
    },
    []
  )

  // Обновление дня выплаты
  const handleUpdatePaymentDay = useCallback(
    (id, day, month) => {
      const monthStr = (month + 1).toString().padStart(2, '0')
      const dayStr = day.toString().padStart(2, '0')
      handleUpdateField(id, 'customDate', `${dayStr}.${monthStr}`)
      handleUpdateField(id, 'day', day)
      handleUpdateField(id, 'monthOffset', 0)
    },
    [handleUpdateField]
  )

  // Выбор дат и периодов
  const selection = usePaymentSelection(
    handleUpdatePeriodBoth,
    handleUpdateField,
    showSuccess,
    calendar.currentMonth
  )

  // Загружаем сохраненные настройки при открытии
  useEffect(() => {
    if (isOpen) {
      setPaymentDates([...savedPaymentDates])
      setEditingId(null)
      selection.resetSelection()
      const now = new Date()
      calendar.setCurrentYear(now.getFullYear())
      calendar.setCurrentMonth(now.getMonth())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, savedPaymentDates])

  // Проверка, является ли день днем выплаты
  const isPaymentDay = useCallback(
    day => {
      return paymentDates.find(payment => {
        if (payment.customDate) {
          const [d, m] = payment.customDate.split('.')
          const paymentMonth = parseInt(m) - 1
          return parseInt(d) === day && paymentMonth === calendar.currentMonth
        }
        if (payment.day === day) {
          const paymentMonth = getPaymentMonth(payment)
          return paymentMonth === calendar.currentMonth
        }
        return false
      })
    },
    [paymentDates, calendar.currentMonth]
  )

  // Проверка, находится ли день в периоде
  const isInPeriod = useCallback(
    day => {
      return paymentDates.find(payment => {
        const periodMonth = getPeriodMonth(payment)
        if (periodMonth !== calendar.currentMonth) {
          return false
        }
        return day >= payment.period.start && day <= payment.period.end
      })
    },
    [paymentDates, calendar.currentMonth]
  )

  // Обработчик клика по дню календаря
  const handleDayClick = useCallback(
    day => {
      if (selection.selectingMode === 'period') {
        return
      }

      if (selection.selectingMode === 'payment') {
        selection.handleDayClick(day, handleUpdatePaymentDay)
      } else if (!selection.selectingMode) {
        const payment = paymentDates.find(p => {
          if (p.customDate) {
            const [d, m] = p.customDate.split('.')
            return parseInt(d) === day && parseInt(m) === calendar.currentMonth + 1
          }
          return p.day === day && p.monthOffset === 0
        })
        if (payment) {
          setEditingId(payment.id)
        }
      }
    },
    [selection, paymentDates, calendar.currentMonth, handleUpdatePaymentDay]
  )

  // Создание новой выплаты
  const handleAddPayment = useCallback(() => {
    const newPayment = {
      id: generateUUID(),
      name: 'Новая выплата',
      day: 25,
      monthOffset: 0,
      customDate: '',
      period: { start: 1, end: 15, periodMonth: calendar.currentMonth },
      color: defaultColors[paymentDates.length % defaultColors.length],
      order: paymentDates.length + 1,
      enabled: true,
    }
    setPaymentDates([...paymentDates, newPayment])
    setEditingId(newPayment.id)
  }, [paymentDates, calendar.currentMonth])

  // Начало редактирования
  const handleStartEdit = useCallback(
    id => {
      setEditingId(id)
      selection.resetSelection()
    },
    [selection]
  )

  // Сохранение изменений
  const handleSaveEdit = useCallback(
    id => {
      const payment = paymentDates.find(p => p.id === id)
      if (!payment) return

      const validation = validatePayment(payment, id)
      if (!validation.isValid) {
        showError(validation.errors.join(', '))
        return
      }

      if (savedPaymentDates.find(p => p.id === id)) {
        updatePaymentDate(id, payment)
      } else {
        addPaymentDate(payment)
      }

      setEditingId(null)
      selection.resetSelection()
      showSuccess('Выплата сохранена')
    },
    [paymentDates, savedPaymentDates, validatePayment, updatePaymentDate, addPaymentDate, showError, showSuccess, selection]
  )

  // Отмена редактирования
  const handleCancelEdit = useCallback(() => {
    setPaymentDates([...savedPaymentDates])
    setEditingId(null)
    selection.resetSelection()
  }, [savedPaymentDates, selection])

  // Удаление выплаты
  const handleDelete = useCallback(
    id => {
      if (!confirm('Вы уверены, что хотите удалить эту выплату?')) return

      deletePaymentDate(id)
      setPaymentDates(paymentDates.filter(p => p.id !== id))
      showSuccess('Выплата удалена')
    },
    [paymentDates, deletePaymentDate, showSuccess]
  )

  // Сохранение всех изменений
  const handleSaveAll = useCallback(() => {
    const validation = validateAll()
    if (!validation.isValid) {
      const errors = validation.errors.map(e => `${e.name}: ${e.errors.join(', ')}`)
      showError(errors.join('; '))
      return
    }

    paymentDates.forEach(payment => {
      if (savedPaymentDates.find(p => p.id === payment.id)) {
        updatePaymentDate(payment.id, payment)
      } else {
        addPaymentDate(payment)
      }
    })

    savedPaymentDates.forEach(saved => {
      if (!paymentDates.find(p => p.id === saved.id)) {
        deletePaymentDate(saved.id)
      }
    })

    showSuccess('Настройки выплат сохранены')
    onClose()
  }, [paymentDates, savedPaymentDates, validateAll, updatePaymentDate, addPaymentDate, deletePaymentDate, showSuccess, onClose])

  // Переключение repeat
  const handleToggleRepeat = useCallback(
    id => {
      const payment = paymentDates.find(p => p.id === id)
      if (!payment) return
      handleUpdateField(id, 'enabled', !payment.enabled)
    },
    [paymentDates, handleUpdateField]
  )

  // Обработчики drag and drop
  const handleDragStart = useCallback((e, id) => {
    setDraggedId(id)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', id)
    const element = e.currentTarget
    if (element) {
      element.style.opacity = '0.5'
    }
  }, [])

  const handleDragEnd = useCallback(e => {
    const element = e.currentTarget
    if (element) {
      element.style.opacity = '1'
    }
    setDraggedId(null)
  }, [])

  const handleDragOver = useCallback(e => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move'
    }
  }, [])

  const handleDragEnter = useCallback(e => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    (e, targetId) => {
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

      const reordered = newPaymentDates.map((p, index) => ({
        ...p,
        order: index + 1,
      }))

      setPaymentDates(reordered)
      const newOrder = reordered.map(p => p.id)
      reorderPaymentDates(newOrder)
      setDraggedId(null)
    },
    [paymentDates, reorderPaymentDates]
  )

  // Состояние выбора для передачи в компоненты
  const selectionState = {
    selectingMode: selection.selectingMode,
    selectingPaymentId: selection.selectingPaymentId,
    periodSelectionStart: selection.periodSelectionStart,
    selectionDays: selection.selectionDays,
    hoveredDay: selection.hoveredDay,
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Настройка дат выплат"
      subtitle="Настройте даты, периоды и названия ваших выплат"
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
            onClick={handleSaveAll}
            className="glass-button flex-1 px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base bg-blue-600 hover:bg-blue-700 text-white rounded-lg sm:rounded-xl font-semibold transition-normal hover-lift-scale click-shrink"
          >
            Сохранить все
          </button>
        </div>
      }
      className="flex flex-col max-h-[90vh]"
    >
      <div className="flex-1 overflow-y-auto overflow-x-hidden pr-1 sm:pr-2 -mr-1 sm:-mr-2">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-w-0">
          {/* Левая часть: Календарь */}
          <div className="lg:col-span-2">
            <PaymentCalendar
              currentYear={calendar.currentYear}
              currentMonth={calendar.currentMonth}
              daysInMonth={calendar.daysInMonth}
              firstDay={calendar.firstDay}
              changeMonth={calendar.changeMonth}
              paymentDates={paymentDates}
              isPaymentDay={isPaymentDay}
              isInPeriod={isInPeriod}
              selectionState={selectionState}
              onDayClick={handleDayClick}
              onMouseDown={selection.handleMouseDown}
              onMouseEnter={selection.handleMouseEnter}
              onMouseUp={selection.handleMouseUp}
            />
          </div>

          {/* Правая часть: Список выплат */}
          <div className="lg:col-span-1 space-y-3 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Выплаты</h3>

            {paymentDates.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p className="text-sm mb-2">Нет настроенных выплат</p>
                <p className="text-xs">Добавьте первую выплату</p>
              </div>
            ) : (
              paymentDates
                .sort((a, b) => a.order - b.order)
                .map(payment => (
                  <PaymentDateItem
                    key={payment.id}
                    payment={payment}
                    isEditing={editingId === payment.id}
                    currentMonth={calendar.currentMonth}
                    selectionState={selectionState}
                    onStartEdit={handleStartEdit}
                    onUpdateField={handleUpdateField}
                    onUpdatePeriod={handleUpdatePeriodBoth}
                    onStartSelectPaymentDay={selection.startSelectPaymentDay}
                    onStartSelectPeriod={selection.startSelectPeriod}
                    onSave={handleSaveEdit}
                    onDelete={handleDelete}
                    onCancel={handleCancelEdit}
                    onToggleRepeat={handleToggleRepeat}
                    onUpdatePaymentDay={handleUpdatePaymentDay}
                    draggedId={draggedId}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragEnter}
                    onDrop={handleDrop}
                  />
                ))
            )}

            {/* Кнопка добавления */}
            <button
              onClick={handleAddPayment}
              className="glass-button w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-normal hover-lift-scale click-shrink flex items-center justify-center gap-2 mt-4"
            >
              <Plus className="w-4 h-4" />
              Добавить выплату
            </button>
          </div>
        </div>
      </div>
    </BaseModal>
  )
}

