import { useState, useEffect, useCallback, useRef } from 'react'
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
import { Plus, Trash2, Edit2, GripVertical, X, Save, Calendar, ChevronLeft, ChevronRight, DollarSign, BarChart3, Palette, CalendarDays, Repeat, CalendarX } from 'lucide-react'
import { logger } from '../../utils/logger'

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
  
  // Календарь
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  
  // Режимы выбора
  const [selectingMode, setSelectingMode] = useState(null) // 'payment' или 'period'
  const [selectingPaymentId, setSelectingPaymentId] = useState(null)
  const [periodSelectionStart, setPeriodSelectionStart] = useState(null)
  const [isMouseDown, setIsMouseDown] = useState(false)
  const [selectionDays, setSelectionDays] = useState(new Set())
  const [hoveredDay, setHoveredDay] = useState(null) // Для live обновления лейблов
  const calendarContainerRef = useRef(null)

  const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

  // Загружаем сохраненные настройки при открытии
  useEffect(() => {
    if (isOpen) {
      setPaymentDates([...savedPaymentDates])
      setEditingId(null)
      setSelectingMode(null)
      setSelectingPaymentId(null)
      setHoveredDay(null)
      const now = new Date()
      setCurrentYear(now.getFullYear())
      setCurrentMonth(now.getMonth())
    }
  }, [isOpen, savedPaymentDates])

  // Анимация календаря при смене месяца
  useEffect(() => {
    if (calendarContainerRef.current) {
      calendarContainerRef.current.classList.add('calendar-animate')
      const timer = setTimeout(() => {
        if (calendarContainerRef.current) {
          calendarContainerRef.current.classList.remove('calendar-animate')
        }
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [currentMonth, currentYear])

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

  // Вспомогательные функции для календаря
  const getDaysInMonth = useCallback((year, month) => {
    return new Date(year, month + 1, 0).getDate()
  }, [])

  const getFirstDayOfMonth = useCallback((year, month) => {
    const day = new Date(year, month, 1).getDay()
    return day === 0 ? 6 : day - 1 // Понедельник = 0
  }, [])

  const formatDate = useCallback((day, month) => {
    return `${day}.${(month + 1).toString().padStart(2, '0')}`
  }, [])

  // Получение месяца выплаты для отображения (фиксированный, не зависит от currentMonth)
  const getPaymentMonth = useCallback((payment) => {
    if (payment.customDate) {
      const [d, m] = payment.customDate.split('.')
      return parseInt(m) - 1
    }
    // Если нет customDate, используем месяц из day и monthOffset
    // day - это день выплаты (1-31), monthOffset - смещение относительно текущего месяца
    // Для отображения нужно определить, в каком месяце находится выплата
    // Если monthOffset === 0, выплата в текущем месяце
    // Если monthOffset === -1, выплата в предыдущем месяце
    // Если monthOffset === 1, выплата в следующем месяце
    // Но для фиксированного отображения используем текущий месяц как базовый
    // Проблема: это будет меняться каждый месяц
    // Решение: нужно хранить месяц выплаты в данных, но пока используем текущий месяц
    const now = new Date()
    const baseMonth = now.getMonth()
    // Если monthOffset === 0, выплата в текущем месяце
    // Если monthOffset === -1, выплата в предыдущем месяце
    // Если monthOffset === 1, выплата в следующем месяце
    const paymentMonth = baseMonth + (payment.monthOffset || 0)
    if (paymentMonth > 11) return paymentMonth - 12
    if (paymentMonth < 0) return paymentMonth + 12
    return paymentMonth
  }, [])

  // Получение месяца периода для отображения
  const getPeriodMonth = useCallback((payment) => {
    // Если период имеет сохраненный месяц, используем его
    if (payment.period && payment.period.periodMonth !== undefined) {
      return payment.period.periodMonth
    }
    
    // Иначе используем старую логику через monthOffset
    const paymentMonth = getPaymentMonth(payment)
    if (payment.monthOffset === -1) {
      // Период в предыдущем месяце относительно месяца выплаты
      return paymentMonth === 0 ? 11 : paymentMonth - 1
    }
    // Период в месяце выплаты
    return paymentMonth
  }, [getPaymentMonth])

  // Навигация по месяцам
  const changeMonth = useCallback((delta) => {
    setCurrentMonth(prev => {
      let newMonth = prev + delta
      if (newMonth > 11) {
        setCurrentYear(prev => prev + 1)
        return 0
      } else if (newMonth < 0) {
        setCurrentYear(prev => prev - 1)
        return 11
      }
      return newMonth
    })
    // Сбрасываем hover при смене месяца
    setHoveredDay(null)
  }, [])

  // Проверка, является ли день днем выплаты
  const isPaymentDay = useCallback((day) => {
    return paymentDates.find(payment => {
      // Убрали проверку enabled - выплаты отображаются в календаре даже при деактивации
      // Проверяем customDate
      if (payment.customDate) {
        const [d, m] = payment.customDate.split('.')
        const paymentMonth = parseInt(m) - 1
        // Проверяем, что отображается правильный месяц
        return parseInt(d) === day && paymentMonth === currentMonth
      }
      // Проверяем day - день выплаты должен отображаться в месяце выплаты
      if (payment.day === day) {
        const paymentMonth = getPaymentMonth(payment)
        // Проверяем, что отображается правильный месяц
        return paymentMonth === currentMonth
      }
      return false
    })
  }, [paymentDates, currentMonth, getPaymentMonth])

  // Проверка, находится ли день в периоде
  const isInPeriod = useCallback((day) => {
    return paymentDates.find(payment => {
      // Убрали проверку enabled - периоды отображаются в календаре даже при деактивации
      
      // Определяем месяц периода на основе месяца выплаты (фиксированный, не зависит от currentMonth)
      const periodMonth = getPeriodMonth(payment)
      
      // Проверяем, что отображается правильный месяц
      if (periodMonth !== currentMonth) {
        return false
      }
      
      // Проверяем, что день в диапазоне периода
      return day >= payment.period.start && day <= payment.period.end
    })
  }, [paymentDates, currentMonth, getPeriodMonth])

  // Live обновление лейбла дня выплаты
  const updatePaymentDayLabelLive = useCallback((day) => {
    if (selectingMode === 'payment') {
      setHoveredDay(day)
    }
  }, [selectingMode])

  // Live обновление лейбла периода
  const updatePeriodLabelLive = useCallback((start, end) => {
    if (selectingMode === 'period' && start && end) {
      // Обновление происходит через состояние selectionDays
      // Лейбл обновляется автоматически через selectionDays в JSX
    }
  }, [selectingMode])

  // Обновление поля выплаты
  const handleUpdateField = (id, field, value) => {
    setPaymentDates(prev => prev.map(p => (p.id === id ? { ...p, [field]: value } : p)))
  }

  // Обновление периода (одно поле)
  const handleUpdatePeriod = (id, field, value) => {
    setPaymentDates(prev => 
      prev.map(p => {
        if (p.id === id) {
          // Сохраняем periodMonth при обновлении, если его еще нет - используем текущий месяц календаря
          const periodMonth = p.period?.periodMonth !== undefined 
            ? p.period.periodMonth 
            : currentMonth
          return { 
            ...p, 
            period: { 
              ...p.period, 
              [field]: parseInt(value) || 0,
              periodMonth: periodMonth
            } 
          }
        }
        return p
      })
    )
  }

  // Обновление периода (оба поля одновременно)
  const handleUpdatePeriodBoth = useCallback((id, start, end, periodMonth) => {
    setPaymentDates(prev => 
      prev.map(p => {
        if (p.id === id) {
          // Сохраняем месяц периода напрямую в объект period
          return { 
            ...p, 
            period: { 
              start: parseInt(start) || 0, 
              end: parseInt(end) || 0,
              periodMonth: periodMonth !== undefined ? periodMonth : (p.period?.periodMonth !== undefined ? p.period.periodMonth : undefined)
            }
          }
        }
        return p
      })
    )
  }, [])

  // Обработчики мыши для выбора периода
  const handleMouseDown = useCallback((day, e) => {
    if (e) {
      e.preventDefault() // Предотвращаем выделение текста
      e.stopPropagation()
    }
    if (selectingMode === 'period') {
      setIsMouseDown(true)
      setSelectionDays(new Set([day]))
      setPeriodSelectionStart(day)
    }
  }, [selectingMode])

  const handleMouseEnter = useCallback((day) => {
    if (isMouseDown && selectingMode === 'period' && periodSelectionStart !== null) {
      const start = Math.min(periodSelectionStart, day)
      const end = Math.max(periodSelectionStart, day)
      const newSelection = new Set()
      for (let i = start; i <= end; i++) {
        newSelection.add(i)
      }
      setSelectionDays(newSelection)
      updatePeriodLabelLive(start, end)
    }
    // Live обновление для выбора дня выплаты
    if (selectingMode === 'payment') {
      updatePaymentDayLabelLive(day)
    }
  }, [isMouseDown, selectingMode, periodSelectionStart, updatePaymentDayLabelLive, updatePeriodLabelLive])

  const handleMouseUp = useCallback((day, e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation() // Предотвращаем всплытие события
    }
    
    if (isMouseDown && selectingMode === 'period' && periodSelectionStart !== null && selectingPaymentId) {
      const start = Math.min(periodSelectionStart, day)
      const end = Math.max(periodSelectionStart, day)
      
      // Обновляем период одновременно (start и end) с указанием месяца периода
      handleUpdatePeriodBoth(selectingPaymentId, start, end, currentMonth)
      
      // Форматируем даты для сообщения
      const startStr = start.toString().padStart(2, '0')
      const endStr = end.toString().padStart(2, '0')
      const monthStr = (currentMonth + 1).toString().padStart(2, '0')
      
      // Сбрасываем состояние
      setIsMouseDown(false)
      setSelectingMode(null)
      setSelectingPaymentId(null)
      setPeriodSelectionStart(null)
      setSelectionDays(new Set())
      setHoveredDay(null)
      showSuccess(`Период установлен: ${startStr}.${monthStr}-${endStr}.${monthStr}`)
    }
  }, [isMouseDown, selectingMode, selectingPaymentId, periodSelectionStart, handleUpdatePeriodBoth, showSuccess, currentMonth])

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      // Сбрасываем isMouseDown только если не в режиме выбора периода
      // В режиме выбора периода handleMouseUp на элементе календаря обработает событие
      if (selectingMode !== 'period') {
        setIsMouseDown(false)
      }
    }
    document.addEventListener('mouseup', handleGlobalMouseUp)
    return () => document.removeEventListener('mouseup', handleGlobalMouseUp)
  }, [selectingMode])

  // Обработчик клика по дню календаря
  const handleDayClick = useCallback((day) => {
    // Не обрабатываем клик, если мы в режиме выбора периода (период выбирается через drag)
    if (selectingMode === 'period') {
      return
    }
    
    if (selectingMode === 'payment') {
      const payment = paymentDates.find(p => p.id === selectingPaymentId)
      if (payment) {
        // Устанавливаем день выплаты с указанием месяца через customDate
        const monthStr = (currentMonth + 1).toString().padStart(2, '0')
        const dayStr = day.toString().padStart(2, '0')
        handleUpdateField(payment.id, 'customDate', `${dayStr}.${monthStr}`)
        handleUpdateField(payment.id, 'day', day)
        handleUpdateField(payment.id, 'monthOffset', 0)
        setSelectingMode(null)
        setSelectingPaymentId(null)
        setHoveredDay(null)
        showSuccess('День выплаты установлен')
      }
    } else if (!selectingMode) {
      // Клик по существующей выплате для редактирования
      const payment = paymentDates.find(p => {
        if (p.customDate) {
          const [d, m] = p.customDate.split('.')
          return parseInt(d) === day && parseInt(m) === currentMonth + 1
        }
        return p.day === day && p.monthOffset === 0
      })
      if (payment) {
        setEditingId(payment.id)
      }
    }
  }, [selectingMode, selectingPaymentId, paymentDates, currentMonth])

  // Начало выбора дня выплаты
  const startSelectPaymentDay = useCallback((id) => {
    setSelectingMode('payment')
    setSelectingPaymentId(id)
    showSuccess('Выберите день выплаты в календаре')
  }, [])

  // Начало выбора периода
  const startSelectPeriod = useCallback((id) => {
    setSelectingMode('period')
    setSelectingPaymentId(id)
    setPeriodSelectionStart(null)
    setSelectionDays(new Set())
    showSuccess('Зажмите мышь и выделите период')
  }, [])

  // Создание новой выплаты
  const handleAddPayment = () => {
    const newPayment = {
      id: generateUUID(),
      name: 'Новая выплата',
      day: 25,
      monthOffset: 0,
      customDate: '', // Конкретная дата выплаты (ДД.ММ)
      period: { start: 1, end: 15, periodMonth: currentMonth }, // Сохраняем текущий месяц календаря как месяц периода
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
    setSelectingMode(null)
    setSelectingPaymentId(null)
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
    setSelectingMode(null)
    setSelectingPaymentId(null)
    setHoveredDay(null)
    setSelectionDays(new Set())
    showSuccess('Выплата сохранена')
  }

  // Отмена редактирования
  const handleCancelEdit = () => {
    setPaymentDates([...savedPaymentDates])
    setEditingId(null)
    setSelectingMode(null)
    setSelectingPaymentId(null)
    setHoveredDay(null)
    setSelectionDays(new Set())
  }

  // Удаление выплаты
  const handleDelete = id => {
    if (!confirm('Вы уверены, что хотите удалить эту выплату?')) return

    deletePaymentDate(id)
    setPaymentDates(paymentDates.filter(p => p.id !== id))
    showSuccess('Выплата удалена')
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

  // Переключение repeat (для toggle switch)
  const handleToggleRepeat = id => {
    const payment = paymentDates.find(p => p.id === id)
    if (!payment) return

    // Используем enabled как repeat для совместимости
    handleUpdateField(id, 'enabled', !payment.enabled)
  }

  // Обработчики drag and drop
  const handleDragStart = (e, id) => {
    setDraggedId(id)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', id)
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

  // Рендер календаря
  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth)
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth)
    const days = []

    // Пустые дни в начале
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square"></div>)
    }

    // Дни месяца
    for (let day = 1; day <= daysInMonth; day++) {
      const payment = isPaymentDay(day)
      
      const inPeriod = isInPeriod(day)
      const isSelecting = selectionDays.has(day)
      const isStartOrEnd = periodSelectionStart === day || (isSelecting && selectionDays.size > 0 && (day === Math.min(...Array.from(selectionDays)) || day === Math.max(...Array.from(selectionDays))))
      
      // Проверка для визуализации выбора дня выплаты
      const isHoveredForPayment = selectingMode === 'payment' && selectingPaymentId && hoveredDay === day

      let dayClasses = 'calendar-day rounded-lg flex items-center justify-center text-sm relative cursor-pointer'
      let dayStyles = {}
      let content = day

      if (payment) {
        dayClasses += ' font-bold border-2 text-gray-900 dark:text-white'
        dayStyles = {
          backgroundColor: `${payment.color}15`,
          borderColor: `${payment.color}80`,
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
        }
        content = (
          <>
            {day}
            <div 
              className="payment-marker"
              style={{ backgroundColor: payment.color }}
            />
            {payment.enabled ? (
              <Repeat className="w-3 h-3 absolute top-0.5 right-0.5" style={{ color: payment.color }} />
            ) : (
              <CalendarX className="w-3 h-3 absolute top-0.5 right-0.5" style={{ color: payment.color }} />
            )}
          </>
        )
      } else if (isSelecting && selectingMode === 'period') {
        // Визуализация выбора периода
        if (isStartOrEnd) {
          dayClasses += ' selecting'
          dayStyles = {
            background: 'rgba(59, 130, 246, 0.3)',
            border: '2px solid #3B82F6'
          }
        } else {
          dayClasses += ' in-selection'
          dayStyles = {
            background: 'rgba(59, 130, 246, 0.2)'
          }
        }
      } else if (isHoveredForPayment) {
        // Визуализация выбора дня выплаты при наведении
        dayClasses += ' font-medium border-2 text-gray-900 dark:text-white'
        dayStyles = {
          background: 'rgba(59, 130, 246, 0.15)',
          borderColor: 'rgba(59, 130, 246, 0.6)',
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
        }
      } else if (inPeriod) {
        // Отображение периода выбранным цветом
        dayClasses += ' text-gray-900 dark:text-white font-medium'
        dayStyles = {
          background: `${inPeriod.color}20`,
          border: `1px solid ${inPeriod.color}40`,
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
        }
      } else {
        dayClasses += ' bg-gray-100 dark:bg-gray-700/30 text-gray-900 dark:text-gray-400 border border-gray-300 dark:border-transparent shadow-sm dark:shadow-none'
        dayStyles = {
          ...dayStyles,
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
        }
      }

      days.push(
        <div
          key={day}
          data-day={day}
          onMouseDown={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleMouseDown(day, e)
          }}
          onMouseEnter={() => handleMouseEnter(day)}
          onMouseUp={(e) => {
            e.stopPropagation()
            handleMouseUp(day, e)
          }}
          onClick={(e) => {
            e.stopPropagation()
            handleDayClick(day)
          }}
          className={dayClasses}
          style={dayStyles}
        >
          {content}
        </div>
      )
    }

    return days
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
            {/* Навигация по месяцам */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => changeMonth(-1)}
                className="glass-button p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-normal hover-lift-scale click-shrink"
                title="Предыдущий месяц"
              >
                <ChevronLeft className="w-5 h-5 text-gray-400" />
              </button>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white transition-all">
                {monthNames[currentMonth]} {currentYear}
              </h3>
              <button
                onClick={() => changeMonth(1)}
                className="glass-button p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-normal hover-lift-scale click-shrink"
                title="Следующий месяц"
              >
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Календарная сетка */}
            <div className="glass-effect rounded-xl p-4">
              {/* Заголовки дней недели */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {weekDays.map(day => (
                  <div key={day} className="text-center text-xs font-medium text-gray-900 dark:text-gray-400">
                    {day}
                  </div>
                ))}
              </div>

              {/* Дни месяца */}
              <div ref={calendarContainerRef} className="grid grid-cols-7 gap-2">
                {renderCalendar()}
              </div>
            </div>

            {/* Легенда */}
            <div className="flex items-center gap-6 mt-4 text-sm flex-wrap">
              {paymentDates.filter(p => p.enabled).map(payment => (
                <div key={payment.id} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: payment.color }}
                  />
                  <span className="text-gray-600 dark:text-gray-500">{payment.name}</span>
                </div>
              ))}
            </div>
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
                      className={`payment-card payment-list-item glass-effect rounded-xl p-3 border-l-4 min-w-0 ${
                        draggedId === payment.id ? 'opacity-50' : ''
                      } ${!isEditing ? 'cursor-move hover:bg-white/20 dark:hover:bg-gray-800/70 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600' : ''} ${isEditing ? 'payment-card-enter' : ''}`}
                      style={{ borderColor: payment.color }}
                    >
                      {isEditing ? (
                        <div className="space-y-3">
                          {/* Название */}
                          <input
                            type="text"
                            value={payment.name}
                            onChange={e =>
                              handleUpdateField(payment.id, 'name', e.target.value)
                            }
                            className="w-full px-2 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Название выплаты"
                          />

                          {/* День выплаты */}
                          <div className="flex items-center gap-2">
                            <label 
                              id={`payment-day-label-live-${payment.id}`}
                              className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap flex items-center gap-1"
                              style={selectingMode === 'payment' && selectingPaymentId === payment.id && hoveredDay ? { color: '#3B82F6', fontWeight: 'bold' } : {}}
                            >
                              Дата выплаты: {selectingMode === 'payment' && selectingPaymentId === payment.id && hoveredDay 
                                ? formatDate(hoveredDay, currentMonth)
                                : payment.customDate || formatDate(payment.day, getPaymentMonth(payment))}
                            </label>
                            <button
                              onClick={() => startSelectPaymentDay(payment.id)}
                              className="glass-button flex-1 py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-normal hover-lift-scale click-shrink flex items-center justify-center gap-1"
                            >
                              <Calendar className="w-3 h-3 flex-shrink-0" />
                              Выбрать
                            </button>
                          </div>

                          {/* Период */}
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label 
                                id={`period-label-live-${payment.id}`}
                                className="text-xs text-gray-500 dark:text-gray-400 mb-1 block flex items-center gap-1"
                                style={selectingMode === 'period' && selectingPaymentId === payment.id && selectionDays.size > 0 ? { color: '#3B82F6', fontWeight: 'bold' } : {}}
                              >
                                Период: {selectingMode === 'period' && selectingPaymentId === payment.id && selectionDays.size > 0
                                  ? `${formatDate(Math.min(...Array.from(selectionDays)), currentMonth)}-${formatDate(Math.max(...Array.from(selectionDays)), currentMonth)}`
                                  : (() => {
                                      const periodMonth = getPeriodMonth(payment)
                                      return `${formatDate(payment.period.start, periodMonth)}-${formatDate(payment.period.end, periodMonth)}`
                                    })()}
                              </label>
                              <button
                                onClick={() => startSelectPeriod(payment.id)}
                                className="glass-button w-full py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-normal hover-lift-scale click-shrink flex items-center justify-center"
                              >
                                Выбрать
                              </button>
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block flex items-center gap-1">
                                <Palette className="w-3 h-3" />
                                Цвет
                              </label>
                              <input
                                type="color"
                                value={payment.color}
                                onChange={e =>
                                  handleUpdateField(payment.id, 'color', e.target.value)
                                }
                                className="w-full h-7 bg-white dark:bg-gray-700 rounded cursor-pointer border border-gray-300 dark:border-gray-600"
                              />
                            </div>
                          </div>


                          {/* Переключатель repeat */}
                          <div className="flex items-center justify-between mb-3 px-1">
                            <span className="text-xs text-gray-500 dark:text-gray-300 flex items-center gap-1">
                              {payment.enabled ? (
                                <>
                                  <Repeat className="w-3 h-3" />
                                  Повторять каждый месяц
                                </>
                              ) : (
                                <>
                                  <CalendarX className="w-3 h-3" />
                                  Единоразовая выплата
                                </>
                              )}
                            </span>
                            <div 
                              onClick={() => handleToggleRepeat(payment.id)}
                              className={`toggle-switch ${payment.enabled ? 'active' : ''}`}
                            />
                          </div>

                          {/* Кнопки */}
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleSaveEdit(payment.id)}
                              className="glass-button flex-1 py-2 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-normal hover-lift-scale click-shrink flex items-center justify-center"
                              title="Сохранить"
                            >
                              <Save className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(payment.id)}
                              className="glass-button flex-1 py-2 px-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium transition-normal hover-lift-scale click-shrink flex items-center justify-center"
                              title="Удалить"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="glass-button flex-1 py-2 px-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-xs font-medium transition-normal hover-lift-scale click-shrink flex items-center justify-center"
                              title="Отмена"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-gray-900 dark:text-white font-medium text-sm drop-shadow-sm" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)' }}>
                              {payment.name}
                            </span>
                            <button
                              onClick={() => handleStartEdit(payment.id)}
                              className="glass-button p-1.5 hover:bg-gray-700 rounded-lg transition-normal hover-lift-scale click-shrink"
                              title="Редактировать"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-gray-400 hover:text-white transition-colors" />
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1 drop-shadow-sm">
                            Дата выплаты: {payment.customDate || formatDate(payment.day, getPaymentMonth(payment))}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-500 mb-1 flex items-center gap-1 drop-shadow-sm">
                            Период расчета: {(() => {
                              const periodMonth = getPeriodMonth(payment)
                              return `${formatDate(payment.period.start, periodMonth)}-${formatDate(payment.period.end, periodMonth)}`
                            })()}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              {payment.monthOffset === -1 ? (
                                <>
                                  <CalendarDays className="w-3 h-3" />
                                  Пред.
                                </>
                              ) : (
                                <>
                                  <Calendar className="w-3 h-3" />
                                  Тек.
                                </>
                              )}
                            </span>
                            {payment.enabled ? (
                              <span className="text-xs bg-green-500/15 dark:bg-green-500/20 text-green-600 dark:text-green-400 px-2 py-0.5 rounded flex items-center gap-1 drop-shadow-sm">
                                <Repeat className="w-3 h-3" />
                                Повторяется
                              </span>
                            ) : (
                              <span className="text-xs bg-orange-500/15 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded flex items-center gap-1 drop-shadow-sm">
                                <CalendarX className="w-3 h-3" />
                                Единоразовая
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })
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
