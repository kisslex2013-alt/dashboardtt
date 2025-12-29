import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Palette, Settings as SettingsIcon, Play, Bell, Timer, Trash2, BotMessageSquare, CalendarDays, Clock, Plus, HardDrive, Folder, Archive, Upload, Edit2, Star, CreditCard } from '../../utils/icons'
import { BaseModal } from '../ui/BaseModal'
import { AnimatedModalContent } from '../ui/AnimatedModalContent'
import {
  useNotificationsSettings,
  useUpdateSettings,
  useDailyHours,
  usePomodoroSettings,
  usePaymentDates,
  useAddPaymentDate,
  useUpdatePaymentDate,
  useDeletePaymentDate,
  useReorderPaymentDates,
  useWorkScheduleTemplate,
  useDailyGoal,
  useWorkScheduleStartDay,
  useCustomWorkDates,
  useCategories,
  useAddCategory,
  useUpdateCategory,
  useDeleteCategory,
  useDefaultCategory,
  useSetDefaultCategory
} from '../../store/useSettingsStore'
import { useSoundManager } from '../../hooks/useSound'
import { useNotifications } from '../../hooks/useNotifications'
import { useShowSuccess } from '../../store/useUIStore'
import { Notification } from '../ui/Notification'
import { useIsMobile } from '../../hooks/useIsMobile'
import { Toggle } from '../ui/Toggle'
import { useAINotificationsStore } from '../../store/useAINotificationsStore'
import { AINotificationService } from '../../services/aiNotificationService'
import { BrowserPushService } from '../../services/browserPushService'
import type { NotificationType, NotificationPriority } from '../../types/aiNotifications'
import { PaymentCalendar } from './PaymentDatesSettingsModal/PaymentCalendar'
import { PaymentDateItem } from './PaymentDatesSettingsModal/PaymentDateItem'
import { usePaymentCalendar } from './PaymentDatesSettingsModal/hooks/usePaymentCalendar'
import { usePaymentSelection } from './PaymentDatesSettingsModal/hooks/usePaymentSelection'
import { usePaymentValidation } from './PaymentDatesSettingsModal/hooks/usePaymentValidation'
import { getPaymentMonth, getPeriodMonth } from './PaymentDatesSettingsModal/utils/calendarHelpers'
import { defaultColors } from './PaymentDatesSettingsModal/utils/paymentFormatters'
import { generateUUID } from '../../utils/uuid'
import { ScheduleTemplateCard } from './work-schedule/ScheduleTemplateCard'
import { ScheduleSettingsCard } from './work-schedule/ScheduleSettingsCard'
import { useScheduleTemplates } from './work-schedule/useScheduleTemplates'
import { getIconColorClasses, getEfficiencyColor } from './work-schedule/scheduleUtils'

import { useEntries } from '../../store/useEntriesStore'
import { useConfirmModal } from '../../hooks/useConfirmModal'
import { ConfirmModal } from './ConfirmModal'
import { handleError } from '../../utils/errorHandler'
import { logger } from '../../utils/logger'
import { Button } from '../ui/Button'
import { IconSelect } from '../ui/IconSelect'
import { getIcon } from '../../utils/iconHelper'
import { NotificationsTab, ProductivityTab, PersonalizationTab, FinanceTab, BackupsTab, WorkScheduleTab, CategoriesTab } from '../settings/tabs'

/**
 * Компонент карточки предпросмотра анимации фавикона
 */

export function SoundNotificationsSettingsModal({ isOpen, onClose, initialTab = null }) {
  // ✅ ОПТИМИЗАЦИЯ: Используем атомарные селекторы для минимизации ре-рендеров
  const notifications = useNotificationsSettings()
  const dailyHours = useDailyHours()
  const pomodoroSettings = usePomodoroSettings()
  const updateSettings = useUpdateSettings()
  const soundManager = useSoundManager()
  const showSuccess = useShowSuccess()
  const { showWarning, showError } = useNotifications()
  const isMobile = useIsMobile()

  // Инициализация состояния с использованием текущих настроек
  const getInitialState = () => ({
    soundNotificationsEnabled: notifications.soundNotificationsEnabled ?? true,
    notificationInterval: notifications.notificationInterval ?? 30,
    notificationSound: notifications.notificationSound ?? 'chime',
    faviconAnimationEnabled: notifications.faviconAnimationEnabled ?? true,
    faviconAnimationStyle: notifications.faviconAnimationStyle ?? 'pulse',
    faviconAnimationColor: notifications.faviconAnimationColor ?? '#3b82f6',
    faviconAnimationSpeed: notifications.faviconAnimationSpeed ?? 'normal',
    breakRemindersEnabled: notifications.breakRemindersEnabled ?? true,
    breakReminderInterval: notifications.breakReminderInterval ?? 2,
    overtimeAlertsEnabled: notifications.overtimeAlertsEnabled ?? true,
    overtimeWarningThreshold: notifications.overtimeWarningThreshold ?? 1.0,
    overtimeCriticalThreshold: notifications.overtimeCriticalThreshold ?? 1.5,
    overtimeSoundAlert: notifications.overtimeSoundAlert ?? true,
    pomodoroEnabled: pomodoroSettings?.enabled ?? false,
    pomodoroAutoStartBreaks: pomodoroSettings?.autoStartBreaks ?? true,
    pomodoroAutoStartWork: pomodoroSettings?.autoStartWork ?? false,
    pomodoroSoundOnComplete: pomodoroSettings?.soundOnComplete ?? true,
    pomodoroShowNotifications: pomodoroSettings?.showNotifications ?? true,
  })

  const [soundNotificationsEnabled, setSoundNotificationsEnabled] = useState(
    () => getInitialState().soundNotificationsEnabled
  )
  const [notificationInterval, setNotificationInterval] = useState(
    () => getInitialState().notificationInterval
  )
  const [notificationSound, setNotificationSound] = useState(
    () => getInitialState().notificationSound
  )
  const [faviconAnimationEnabled, setFaviconAnimationEnabled] = useState(
    () => getInitialState().faviconAnimationEnabled
  )
  const [faviconAnimationStyle, setFaviconAnimationStyle] = useState(
    () => getInitialState().faviconAnimationStyle
  )
  const [faviconAnimationColor, setFaviconAnimationColor] = useState(
    () => getInitialState().faviconAnimationColor
  )
  const [faviconAnimationSpeed, setFaviconAnimationSpeed] = useState(
    () => getInitialState().faviconAnimationSpeed
  )
  const [breakRemindersEnabled, setBreakRemindersEnabled] = useState(
    () => getInitialState().breakRemindersEnabled
  )
  const [breakReminderInterval, setBreakReminderInterval] = useState(
    () => getInitialState().breakReminderInterval
  )
  const [overtimeAlertsEnabled, setOvertimeAlertsEnabled] = useState(
    () => getInitialState().overtimeAlertsEnabled
  )
  const [overtimeWarningThreshold, setOvertimeWarningThreshold] = useState(
    () => getInitialState().overtimeWarningThreshold
  )
  const [overtimeCriticalThreshold, setOvertimeCriticalThreshold] = useState(
    () => getInitialState().overtimeCriticalThreshold
  )
  const [overtimeSoundAlert, setOvertimeSoundAlert] = useState(
    () => getInitialState().overtimeSoundAlert
  )
  const [pomodoroEnabled, setPomodoroEnabled] = useState(
    () => getInitialState().pomodoroEnabled
  )
  const [pomodoroAutoStartBreaks, setPomodoroAutoStartBreaks] = useState(
    () => getInitialState().pomodoroAutoStartBreaks
  )
  const [pomodoroAutoStartWork, setPomodoroAutoStartWork] = useState(
    () => getInitialState().pomodoroAutoStartWork
  )
  const [pomodoroSoundOnComplete, setPomodoroSoundOnComplete] = useState(
    () => getInitialState().pomodoroSoundOnComplete
  )
  const [pomodoroShowNotifications, setPomodoroShowNotifications] = useState(
    () => getInitialState().pomodoroShowNotifications
  )
  const [customIntervalMinutes, setCustomIntervalMinutes] = useState(null)

  // Состояние для активного таба (вариант 4: вертикальные табы)
  const [activeTab, setActiveTab] = useState(initialTab || 'notifications')

  // Обновление активного таба при открытии модального окна или изменении initialTab
  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab)
    } else if (isOpen && !initialTab) {
      // Если модальное окно открывается без указания таба, используем дефолтный
      setActiveTab('notifications')
    }
  }, [isOpen, initialTab])

  // Состояние для раздела Выплаты
  const savedPaymentDates = usePaymentDates()
  const addPaymentDate = useAddPaymentDate()
  const updatePaymentDate = useUpdatePaymentDate()
  const deletePaymentDate = useDeletePaymentDate()
  const reorderPaymentDates = useReorderPaymentDates()
  const [paymentDates, setPaymentDates] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [draggedId, setDraggedId] = useState(null)
  const now = new Date()
  const calendar = usePaymentCalendar(now.getFullYear(), now.getMonth())
  const { validatePayment, validateAll } = usePaymentValidation(paymentDates)

  // Состояние для раздела Рабочий график
  const workScheduleTemplate = useWorkScheduleTemplate()
  const dailyGoal = useDailyGoal()
  const workScheduleStartDay = useWorkScheduleStartDay()
  const savedCustomWorkDates = useCustomWorkDates()
  const [selectedTemplate, setSelectedTemplate] = useState(workScheduleTemplate || '5/2')
  const [dailyPlan, setDailyPlan] = useState(dailyGoal || 6000)
  const [weekStart, setWeekStart] = useState(workScheduleStartDay || 1)
  const [customDays, setCustomDays] = useState([true, false, true, true, true, false, false])
  const [customWorkDates, setCustomWorkDates] = useState(savedCustomWorkDates || {})
  const [animateStats, setAnimateStats] = useState(false)
  const scheduleTemplates = useScheduleTemplates(customDays, weekStart, customWorkDates)
  const selectedSchedule = scheduleTemplates.find(t => t.id === selectedTemplate) || scheduleTemplates[0]
  const monthlyPlan = dailyPlan * selectedSchedule.monthlyDays

  // Состояние для раздела Категории
  const categories = useCategories()
  const addCategory = useAddCategory()
  const updateCategory = useUpdateCategory()
  const deleteCategory = useDeleteCategory()
  const entries = useEntries()
  const defaultCategory = useDefaultCategory()
  const setDefaultCategory = useSetDefaultCategory()
  const categoryDeleteConfirm = useConfirmModal()
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [editingCategoryId, setEditingCategoryId] = useState(null)
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    color: '#3B82F6',
    icon: 'Folder',
  })
  const [categoryError, setCategoryError] = useState('')
  const categoryNameInputRef = useRef(null)




  // Обновление состояния при открытии модального окна
  useEffect(() => {
    if (isOpen) {
      const initialState = getInitialState()
      setSoundNotificationsEnabled(initialState.soundNotificationsEnabled)
      setNotificationInterval(initialState.notificationInterval)
      setNotificationSound(initialState.notificationSound)
      setFaviconAnimationEnabled(initialState.faviconAnimationEnabled)
      setFaviconAnimationStyle(initialState.faviconAnimationStyle)
      setFaviconAnimationColor(initialState.faviconAnimationColor)
      setFaviconAnimationSpeed(initialState.faviconAnimationSpeed)
      setBreakRemindersEnabled(initialState.breakRemindersEnabled)
      setBreakReminderInterval(initialState.breakReminderInterval)
      setOvertimeAlertsEnabled(initialState.overtimeAlertsEnabled)
      setOvertimeWarningThreshold(initialState.overtimeWarningThreshold)
      setOvertimeCriticalThreshold(initialState.overtimeCriticalThreshold)
      setOvertimeSoundAlert(initialState.overtimeSoundAlert)
      setPomodoroEnabled(initialState.pomodoroEnabled)
      setPomodoroAutoStartBreaks(initialState.pomodoroAutoStartBreaks)
      setPomodoroAutoStartWork(initialState.pomodoroAutoStartWork)
      setPomodoroSoundOnComplete(initialState.pomodoroSoundOnComplete)
      setPomodoroShowNotifications(initialState.pomodoroShowNotifications)

      // Если интервал не входит в стандартные значения, считаем его кастомным
      const standardIntervals = [15, 30, 45, 60, 120]
      if (!standardIntervals.includes(initialState.notificationInterval)) {
        setCustomIntervalMinutes(initialState.notificationInterval)
        setNotificationInterval(-1)
      } else {
        setCustomIntervalMinutes(null)
      }

      // Загрузка данных выплат
      setPaymentDates([...savedPaymentDates])
      setEditingId(null)
      const now = new Date()
      calendar.setCurrentYear(now.getFullYear())
      calendar.setCurrentMonth(now.getMonth())

      // Загрузка данных рабочего графика
      setCustomWorkDates(savedCustomWorkDates || {})
      setSelectedTemplate(workScheduleTemplate || '5/2')
      setDailyPlan(dailyGoal || 6000)
      setWeekStart(workScheduleStartDay || 1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, savedPaymentDates, savedCustomWorkDates, workScheduleTemplate, dailyGoal, workScheduleStartDay])

  // Типы звуков (компактный список - только основные)
  const soundTypes = [
    { value: 'chime', label: 'Мелодия', description: 'Мелодичное уведомление' },
    { value: 'alert', label: 'Предупреждение', description: 'Короткое предупреждение' },
    { value: 'phone', label: 'Звонок', description: 'Звук телефонного звонка' },
    { value: 'doorbell', label: 'Дверной звонок', description: 'Многотональный звонок' },
    { value: 'alarm', label: 'Тревога', description: 'Повторяющийся сигнал' },
    { value: 'notification', label: 'Уведомление', description: 'Стандартное уведомление' },
    { value: 'bell', label: 'Колокол', description: 'Колокольный звон' },
    { value: 'beep', label: 'Сигнал', description: 'Короткий сигнал' },
    { value: 'ping', label: 'Пинг', description: 'Мягкий короткий сигнал' },
    // Новые звуки для продуктивности и фокуса
    { value: 'gentle', label: 'Нежный', description: 'Мягкий, ненавязчивый звук' },
    { value: 'soft', label: 'Мягкий', description: 'Приглушенный, успокаивающий' },
    { value: 'zen', label: 'Дзен', description: 'Медитативный, спокойный' },
    { value: 'focus', label: 'Фокус', description: 'Помогает концентрироваться' },
    { value: 'breeze', label: 'Легкий ветерок', description: 'Воздушный, легкий' },
    { value: 'crystal', label: 'Кристалл', description: 'Чистый, прозрачный' },
    { value: 'harmony', label: 'Гармония', description: 'Гармоничный, приятный' },
    { value: 'whisper', label: 'Шепот', description: 'Тихий, ненавязчивый' },
    { value: 'bloom', label: 'Цветение', description: 'Мягкий, восходящий' },
  ]

  // Стили анимации (компактный список - только основные)
  const animationStyles = [
    { value: 'pulse', label: 'Пульсация', description: 'Плавное увеличение и уменьшение' },
    { value: 'blink', label: 'Мигание', description: 'Быстрое мигание' },
    { value: 'rotate', label: 'Вращение', description: 'Вращение с индикатором' },
    { value: 'breathe', label: 'Дыхание', description: 'Плавное дыхание' },
    { value: 'wave', label: 'Волна', description: 'Расходящиеся волны' },
    { value: 'gradient', label: 'Градиент', description: 'Изменение цвета' },
    { value: 'data-pulse', label: 'Data Pulse', description: 'Пульсация данных и времени' },
    { value: 'particles', label: 'Частицы', description: 'Вращающиеся частицы' },
  ]

  // Скорости анимации
  const animationSpeeds = [
    { value: 'slow', label: 'Медленно (4000ms)' },
    { value: 'normal', label: 'Обычно (2000ms)' },
    { value: 'fast', label: 'Быстро (1000ms)' },
  ]

  // Предустановленные цвета (7 основных цветов)
  const presetColors = [
    { value: '#3b82f6', label: 'Синий', preview: 'bg-blue-500' },
    { value: '#22c55e', label: 'Зеленый', preview: 'bg-green-500' },
    { value: '#f97316', label: 'Оранжевый', preview: 'bg-orange-500' },
    { value: '#ef4444', label: 'Красный', preview: 'bg-red-500' },
    { value: '#8b5cf6', label: 'Фиолетовый', preview: 'bg-purple-500' },
    { value: '#06b6d4', label: 'Голубой', preview: 'bg-cyan-500' },
    { value: '#fbbf24', label: 'Желтый', preview: 'bg-yellow-500' },
  ]

  // Сохранение настроек
  const handleSave = () => {
    // Если выбран кастомный интервал, используем его значение
    const finalInterval =
      notificationInterval === -1 ? customIntervalMinutes || 30 : notificationInterval

    const settingsToSave: any = {
      notifications: {
        ...notifications,
        soundNotificationsEnabled,
        notificationInterval: finalInterval,
        notificationSound,
        faviconAnimationEnabled,
        faviconAnimationStyle,
        faviconAnimationColor,
        faviconAnimationSpeed,
        breakRemindersEnabled,
        breakReminderInterval,
        overtimeAlertsEnabled,
        overtimeWarningThreshold,
        overtimeCriticalThreshold,
        overtimeSoundAlert,
      },
      pomodoro: {
        ...pomodoroSettings,
        enabled: pomodoroEnabled,
        autoStartBreaks: pomodoroAutoStartBreaks,
        autoStartWork: pomodoroAutoStartWork,
        soundOnComplete: pomodoroSoundOnComplete,
        showNotifications: pomodoroShowNotifications,
      },
    }

    // Сохранение выплат, если активен раздел выплат
    if (activeTab === 'payments') {
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
    }

    // Сохранение рабочего графика, если активен раздел рабочего графика
    if (activeTab === 'workSchedule') {
      settingsToSave.workScheduleTemplate = selectedTemplate
      settingsToSave.dailyGoal = dailyPlan
      settingsToSave.workScheduleStartDay = weekStart
      if (selectedTemplate === 'custom') {
        settingsToSave.customWorkDates = customWorkDates
      }
    }

    updateSettings(settingsToSave)
    showSuccess('Настройки сохранены')
    onClose()
  }

  // Обработчики для выплат
  const handleUpdateField = useCallback((id, field, value) => {
    setPaymentDates(prev => prev.map(p => (p.id === id ? { ...p, [field]: value } : p)))
  }, [])

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

  const selection = usePaymentSelection(
    handleUpdatePeriodBoth,
    handleUpdateField,
    showSuccess,
    calendar.currentMonth
  )

  // Обновление selection при изменении месяца
  useEffect(() => {
    if (selection.selectingMode) {
      selection.resetSelection()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calendar.currentMonth])

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

  const handleStartEdit = useCallback(
    id => {
      setEditingId(id)
      selection.resetSelection()
    },
    [selection]
  )

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

  const handleCancelEdit = useCallback(() => {
    setPaymentDates([...savedPaymentDates])
    setEditingId(null)
    selection.resetSelection()
  }, [savedPaymentDates, selection])

  const handleDelete = useCallback(
    id => {
      if (!confirm('Вы уверены, что хотите удалить эту выплату?')) return
      deletePaymentDate(id)
      setPaymentDates(paymentDates.filter(p => p.id !== id))
      showSuccess('Выплата удалена')
    },
    [paymentDates, deletePaymentDate, showSuccess]
  )

  const handleToggleRepeat = useCallback(
    id => {
      const payment = paymentDates.find(p => p.id === id)
      if (!payment) return
      handleUpdateField(id, 'enabled', !payment.enabled)
    },
    [paymentDates, handleUpdateField]
  )

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

  // Обработчики для рабочего графика
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

  // Триггер анимации статистики при смене шаблона
  useEffect(() => {
    if (isOpen && activeTab === 'workSchedule') {
      setAnimateStats(true)
      const timer = setTimeout(() => setAnimateStats(false), 500)
      return () => clearTimeout(timer)
    }
  }, [selectedTemplate, dailyPlan, isOpen, activeTab])



  // Обработчики для категорий
  const getCategoryUsageCount = category => {
    const count = entries.filter(entry => {
      if (!entry.category || entry.category === undefined || entry.category === null) {
        return category.id === 'remix' || category.name === 'remix'
      }
      if (typeof entry.category === 'string') {
        return entry.category === category.id || entry.category === category.name || entry.category.toLowerCase() === category.name.toLowerCase()
      }
      return entry.category === category.id || entry.category === category.name
    }).length
    return count
  }

  const handleAddCategory = () => {
    if (!categoryFormData.name.trim()) {
      setCategoryError('Введите название категории')
      return
    }

    const exists = categories.some(c => c.name.toLowerCase() === categoryFormData.name.trim().toLowerCase())
    if (exists) {
      setCategoryError('Категория с таким названием уже существует')
      return
    }

    addCategory({
      name: categoryFormData.name.trim(),
      color: categoryFormData.color,
      icon: categoryFormData.icon,
    })

    setCategoryFormData({ name: '', color: '#3B82F6', icon: 'Folder' })
    setCategoryError('')
    setIsAddingCategory(false)
  }

  const handleCancelAddCategory = () => {
    setCategoryFormData({ name: '', color: '#3B82F6', icon: 'Folder' })
    setCategoryError('')
    setIsAddingCategory(false)
  }

  const handleEditCategory = category => {
    setEditingCategoryId(category.id)
    setCategoryFormData({
      name: category.name,
      color: category.color,
      icon: category.icon || 'Folder',
    })
    setCategoryError('')
  }

  const handleSaveCategory = () => {
    if (!categoryFormData.name.trim()) {
      setCategoryError('Введите название категории')
      return
    }

    updateCategory(editingCategoryId, {
      name: categoryFormData.name.trim(),
      color: categoryFormData.color,
      icon: categoryFormData.icon,
    })

    setCategoryFormData({ name: '', color: '#3B82F6', icon: 'Folder' })
    setEditingCategoryId(null)
    setCategoryError('')
  }

  const handleCancelEditCategory = () => {
    setCategoryFormData({ name: '', color: '#3B82F6', icon: 'Folder' })
    setEditingCategoryId(null)
    setCategoryError('')
  }

  const handleDeleteCategory = categoryId => {
    categoryDeleteConfirm.openConfirm({
      title: 'Удалить категорию?',
      message: 'Вы уверены, что хотите удалить эту категорию?\n\nВнимание: все записи с этой категорией останутся, но категория будет удалена из списка.',
      onConfirm: () => deleteCategory(categoryId),
      confirmText: 'Удалить',
      cancelText: 'Отмена',
    })
  }

  // Используем useLayoutEffect для синхронного фокуса на поле ввода категории
  useLayoutEffect(() => {
    if (isOpen && activeTab === 'categories' && isAddingCategory && categoryNameInputRef.current) {
      // Используем requestAnimationFrame для гарантированного фокуса после рендера
      requestAnimationFrame(() => {
        categoryNameInputRef.current?.focus()
      })
    }
  }, [isOpen, activeTab, isAddingCategory])

  const selectionState = {
    selectingMode: selection.selectingMode,
    selectingPaymentId: selection.selectingPaymentId,
    periodSelectionStart: selection.periodSelectionStart,
    selectionDays: selection.selectionDays,
    hoveredDay: selection.hoveredDay,
  }

  // Тест звука
  const handleTestSound = soundType => {
    soundManager.playSound(soundType as any)
  }

  // Состояние для тестового уведомления (чтобы показать его поверх модального окна)
  const [testNotification, setTestNotification] = useState(null)
  const testNotificationTimeoutRef = useRef(null)

  // Тест напоминания о перерыве
  const handleTestBreakReminder = () => {
    const hoursWorked = breakReminderInterval
    const message = `Пора сделать перерыв! Вы работаете уже ${hoursWorked} ${hoursWorked === 1 ? 'час' : hoursWorked < 5 ? 'часа' : 'часов'}. Рекомендуется сделать перерыв для поддержания продуктивности.`

    // Показываем уведомление через портал поверх модального окна
    const notificationId = Date.now() + Math.random()
    setTestNotification({
      id: notificationId,
      message,
      type: 'warning',
      duration: 10000,
      timestamp: Date.now(),
    })

    // Автоматически скрываем через 10 секунд
    if (testNotificationTimeoutRef.current) {
      clearTimeout(testNotificationTimeoutRef.current)
    }
    testNotificationTimeoutRef.current = setTimeout(() => {
      setTestNotification(null)
    }, 10000)
  }

  // Тест уведомления Pomodoro
  const handleTestPomodoroNotification = () => {
    const message = `Pomodoro завершен! Пора сделать перерыв.`

    // Показываем уведомление через портал поверх модального окна
    const notificationId = Date.now() + Math.random()
    setTestNotification({
      id: notificationId,
      message,
      type: 'success',
      duration: 10000,
      timestamp: Date.now(),
    })

    // Автоматически скрываем через 10 секунд
    if (testNotificationTimeoutRef.current) {
      clearTimeout(testNotificationTimeoutRef.current)
    }
    testNotificationTimeoutRef.current = setTimeout(() => {
      setTestNotification(null)
    }, 10000)
  }

  // Тест предупреждения о переработке
  const handleTestOvertimeAlert = (isCritical = false) => {
    const threshold = isCritical ? overtimeCriticalThreshold : overtimeWarningThreshold
    const totalHours = (dailyHours || 8) * threshold
    const overtimeHours = totalHours - (dailyHours || 8)

    let message
    if (isCritical) {
      message = `Критическая переработка! Вы работаете уже ${totalHours.toFixed(1)} ${totalHours === 1 ? 'час' : totalHours < 5 ? 'часа' : 'часов'} (норма: ${dailyHours || 8} ч). Превышение: ${overtimeHours.toFixed(1)} ${overtimeHours === 1 ? 'час' : overtimeHours < 5 ? 'часа' : 'часов'}. Рекомендуется сделать перерыв и отдохнуть.`
    } else {
      message = `Переработка! Вы работаете уже ${totalHours.toFixed(1)} ${totalHours === 1 ? 'час' : totalHours < 5 ? 'часа' : 'часов'} (норма: ${dailyHours || 8} ч). Превышение: ${overtimeHours.toFixed(1)} ${overtimeHours === 1 ? 'час' : overtimeHours < 5 ? 'часа' : 'часов'}. Рекомендуется сделать перерыв.`
    }

    // Показываем уведомление через портал поверх модального окна
    const notificationId = Date.now() + Math.random()
    setTestNotification({
      id: notificationId,
      message,
      type: isCritical ? 'error' : 'warning',
      duration: isCritical ? 15000 : 12000,
      timestamp: Date.now(),
    })

    // Автоматически скрываем
    if (testNotificationTimeoutRef.current) {
      clearTimeout(testNotificationTimeoutRef.current)
    }
    testNotificationTimeoutRef.current = setTimeout(() => {
      setTestNotification(null)
    }, isCritical ? 15000 : 12000)
  }

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      if (testNotificationTimeoutRef.current) {
        clearTimeout(testNotificationTimeoutRef.current)
      }
    }
  }, [])



  return (
    <>
      {/* Тестовое уведомление через портал поверх модального окна */}
      {testNotification &&
        createPortal(
          <div className="fixed top-4 right-4 z-[99999999] pointer-events-auto">
            <Notification
              notification={testNotification}
              onClose={() => setTestNotification(null)}
            />
          </div>,
          document.body
        )}

      <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Настройки"
      titleIcon={SettingsIcon}
      size="full"
      closeOnOverlayClick={false}
      fixedHeight={true}
      nested={true}
      footer={
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors font-semibold"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold transition-colors"
          >
            Сохранить
          </button>
        </div>
      }
      className="flex flex-col max-w-7xl"
    >
      {/* Split View: Sidebar + Content */}
      <div className={`flex flex-1 min-h-0 gap-0 -mx-6 ${isMobile ? 'flex-col' : ''}`}>
        {/* Боковая навигация */}
        {!isMobile && (
        <div className="w-72 bg-gray-100/50 dark:bg-gray-800/50 border-r border-gray-200 dark:border-gray-700 pt-6 px-4 pb-4 sticky top-0 self-start">
          <div className="space-y-2">
            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === 'notifications'
                  ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 border border-transparent'
              }`}
            >
              <Bell className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium text-sm">Уведомления</span>
              <span className={`ml-auto px-2 py-0.5 rounded-md text-xs font-semibold ${
                soundNotificationsEnabled || breakRemindersEnabled || overtimeAlertsEnabled
                  ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                  : 'bg-gray-500/20 text-gray-600 dark:text-gray-400'
              }`}>
                {soundNotificationsEnabled || breakRemindersEnabled || overtimeAlertsEnabled ? 'ВКЛ' : 'ВЫКЛ'}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('productivity')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === 'productivity'
                  ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 border border-transparent'
              }`}
            >
              <Timer className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium text-sm">Продуктивность</span>
              <span className={`ml-auto px-2 py-0.5 rounded-md text-xs font-semibold ${
                pomodoroEnabled
                  ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                  : 'bg-gray-500/20 text-gray-600 dark:text-gray-400'
              }`}>
                {pomodoroEnabled ? 'ВКЛ' : 'ВЫКЛ'}
              </span>
            </button>

                        <button
              onClick={() => setActiveTab('personalization')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === 'personalization'
                  ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 border border-transparent'
              }`}
            >
              <Palette className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium text-sm">Персонализация</span>
            </button>



                        <button
              onClick={() => setActiveTab('finance')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === 'finance'
                  ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 border border-transparent'
              }`}
            >
              <CreditCard className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium text-sm">Финансы</span>
            </button>

            <button
              onClick={() => setActiveTab('workSchedule')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === 'workSchedule'
                  ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 border border-transparent'
              }`}
            >
              <Clock className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium text-sm">Рабочий график</span>
            </button>

            <button
              onClick={() => setActiveTab('categories')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === 'categories'
                  ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 border border-transparent'
              }`}
            >
              <Folder className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium text-sm">Категории</span>
            </button>

            <button
              onClick={() => setActiveTab('backups')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === 'backups'
                  ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 border border-transparent'
              }`}
            >
              <HardDrive className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium text-sm">Бэкапы</span>
            </button>


          </div>
        </div>
        )}

        {/* Мобильная навигация */}
        {isMobile && (
          <div className="bg-gray-100/50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 pt-6 px-3 pb-3">
            <div className="flex gap-2 overflow-x-auto">
              <button
                onClick={() => setActiveTab('notifications')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                  activeTab === 'notifications'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-700'
                }`}
              >
                <Bell className="w-4 h-4" />
                <span className="text-sm font-medium">Уведомления</span>
              </button>
                          <button
              onClick={() => setActiveTab('productivity')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === 'productivity'
                  ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 border border-transparent'
              }`}
            >
              <Timer className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium text-sm">Продуктивность</span>
              <span className={`ml-auto px-2 py-0.5 rounded-md text-xs font-semibold ${
                pomodoroEnabled
                  ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                  : 'bg-gray-500/20 text-gray-600 dark:text-gray-400'
              }`}>
                {pomodoroEnabled ? 'ВКЛ' : 'ВЫКЛ'}
              </span>
            </button>
                          <button
              onClick={() => setActiveTab('personalization')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === 'personalization'
                  ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 border border-transparent'
              }`}
            >
              <Palette className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium text-sm">Персонализация</span>
            </button>

                          <button
              onClick={() => setActiveTab('finance')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === 'finance'
                  ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 border border-transparent'
              }`}
            >
              <CreditCard className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium text-sm">Финансы</span>
            </button>

            <button
              onClick={() => setActiveTab('workSchedule')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === 'workSchedule'
                  ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 border border-transparent'
              }`}
            >
              <Clock className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium text-sm">Рабочий график</span>
            </button>

            <button
              onClick={() => setActiveTab('categories')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === 'categories'
                  ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 border border-transparent'
              }`}
            >
              <Folder className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium text-sm">Категории</span>
            </button>

              <button
                onClick={() => setActiveTab('backups')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                  activeTab === 'backups'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-700'
                }`}
              >
                <HardDrive className="w-4 h-4" />
                <span className="text-sm font-medium">Бэкапы</span>
              </button>

            </div>
          </div>
        )}

        {/* Основной контент */}
        <div className="flex-1 min-h-0 p-6 overflow-y-auto custom-scrollbar">
          <AnimatedModalContent contentKey={`${activeTab}-${isOpen}`}>
            {/* Таб: Уведомления */}
            {activeTab === 'notifications' && (
              <NotificationsTab
                soundNotificationsEnabled={soundNotificationsEnabled}
                setSoundNotificationsEnabled={setSoundNotificationsEnabled}
                notificationSound={notificationSound}
                setNotificationSound={(val) => setNotificationSound(val as any)}
                notificationInterval={notificationInterval}
                setNotificationInterval={setNotificationInterval}
                customIntervalMinutes={customIntervalMinutes}
                setCustomIntervalMinutes={setCustomIntervalMinutes}
                breakRemindersEnabled={breakRemindersEnabled}
                setBreakRemindersEnabled={setBreakRemindersEnabled}
                breakReminderInterval={breakReminderInterval}
                setBreakReminderInterval={setBreakReminderInterval}
                overtimeAlertsEnabled={overtimeAlertsEnabled}
                setOvertimeAlertsEnabled={setOvertimeAlertsEnabled}
                overtimeWarningThreshold={overtimeWarningThreshold}
                setOvertimeWarningThreshold={setOvertimeWarningThreshold}
                overtimeCriticalThreshold={overtimeCriticalThreshold}
                setOvertimeCriticalThreshold={setOvertimeCriticalThreshold}
                overtimeSoundEnabled={overtimeSoundAlert}
                setOvertimeSoundEnabled={setOvertimeSoundAlert}
                dailyHours={dailyHours || 8}
                onTestSound={handleTestSound}
                onTestBreakReminder={handleTestBreakReminder}
                onTestOvertimeAlert={handleTestOvertimeAlert}
              />
            )}

                      {activeTab === 'productivity' && (
              <ProductivityTab
                pomodoroEnabled={pomodoroEnabled}
                setPomodoroEnabled={setPomodoroEnabled}
                pomodoroAutoStartBreaks={pomodoroAutoStartBreaks}
                setPomodoroAutoStartBreaks={setPomodoroAutoStartBreaks}
                pomodoroAutoStartWork={pomodoroAutoStartWork}
                setPomodoroAutoStartWork={setPomodoroAutoStartWork}
                pomodoroSoundOnComplete={pomodoroSoundOnComplete}
                setPomodoroSoundOnComplete={setPomodoroSoundOnComplete}
                pomodoroShowNotifications={pomodoroShowNotifications}
                setPomodoroShowNotifications={setPomodoroShowNotifications}
                onTestPomodoroNotification={handleTestPomodoroNotification}
              />
            )}

            {activeTab === 'personalization' && (
              <PersonalizationTab
                faviconEnabled={faviconAnimationEnabled}
                setFaviconEnabled={setFaviconAnimationEnabled}
                faviconStyle={faviconAnimationStyle}
                setFaviconStyle={setFaviconAnimationStyle}
                faviconColor={faviconAnimationColor}
                setFaviconColor={setFaviconAnimationColor}
                faviconSpeed={faviconAnimationSpeed}
                setFaviconSpeed={setFaviconAnimationSpeed}
              />
            )}

            {activeTab === 'finance' && (
              <FinanceTab
                // Payments
                paymentDates={paymentDates}
                calendar={calendar}
                isPaymentDay={isPaymentDay}
                isInPeriod={isInPeriod}
                selectionState={selectionState}
                handleDayClick={handleDayClick}
                selection={selection}
                editingId={editingId}
                handleStartEdit={handleStartEdit}
                handleUpdateField={handleUpdateField}
                handleUpdatePeriodBoth={handleUpdatePeriodBoth}
                handleSaveEdit={handleSaveEdit}
                handleDeletePayment={handleDelete}
                handleCancelEdit={handleCancelEdit}
                handleToggleRepeat={handleToggleRepeat}
                handleUpdatePaymentDay={handleUpdatePaymentDay}
                draggedId={draggedId}
                handleDragStart={handleDragStart}
                handleDragEnd={handleDragEnd}
                handleDragOver={handleDragOver}
                handleDragEnter={handleDragEnter}
                handleDrop={handleDrop}
                handleAddPayment={handleAddPayment}

                // Categories
                categories={categories}
                entries={entries}
                isAddingCategory={isAddingCategory}
                setIsAddingCategory={setIsAddingCategory}
                editingCategoryId={editingCategoryId}
                categoryFormData={categoryFormData}
                setCategoryFormData={setCategoryFormData}
                categoryError={categoryError}
                handleAddCategory={handleAddCategory}
                handleCancelAddCategory={handleCancelAddCategory}
                handleEditCategory={handleEditCategory}
                handleSaveCategory={handleSaveCategory}
                handleCancelEditCategory={handleCancelEditCategory}
                handleDeleteCategory={handleDeleteCategory}
                defaultCategory={defaultCategory}
                setDefaultCategory={setDefaultCategory}
                categoryNameInputRef={categoryNameInputRef}
              />
            )}

          {/* Таб: Рабочий график */}
          {activeTab === 'workSchedule' && (
            <WorkScheduleTab
              scheduleTemplates={scheduleTemplates}
              selectedTemplate={selectedTemplate}
              onSelectTemplate={handleTemplateSelect}
              onCustomDayToggle={handleCustomDayToggle}
              selectedSchedule={selectedSchedule}
              dailyPlan={dailyPlan}
              monthlyPlan={monthlyPlan}
              weekStart={weekStart}
              onDailyPlanChange={setDailyPlan}
              onWeekStartChange={setWeekStart}
              animateStats={animateStats}
            />
          )}

          {/* Таб: Бэкапы */}
          {activeTab === 'backups' && (
            <BackupsTab />
          )}

          {/* Таб: Категории */}
          {activeTab === 'categories' && (
            <div key="categories-tab" className="space-y-4">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Категории работ</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Управление категориями для учета времени</p>
              </div>

              {!isAddingCategory && !editingCategoryId && (
                <div className="mb-3">
                  <button
                    onClick={() => setIsAddingCategory(true)}
                    className="w-full bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-normal hover-lift-scale click-shrink font-medium text-sm flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Добавить категорию
                  </button>
                </div>
              )}

              {(isAddingCategory || editingCategoryId) && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-3">
                  <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {editingCategoryId ? 'Редактировать категорию' : 'Добавить новую категорию'}
                  </h3>
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-end gap-2">
                      <div className="flex-1 min-w-[150px]">
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-0.5">
                          Название
                        </label>
                        <input
                          ref={categoryNameInputRef}
                          type="text"
                          placeholder="Разработка"
                          value={categoryFormData.name}
                          onChange={e => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                          className="w-full px-2 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-200 dark:focus:ring-blue-800 outline-none"
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              editingCategoryId ? handleSaveCategory() : handleAddCategory()
                            }
                          }}
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-0.5">
                          Цвет
                        </label>
                        <div className="flex gap-0.5">
                          <input
                            type="color"
                            value={categoryFormData.color}
                            onChange={e => setCategoryFormData({ ...categoryFormData, color: e.target.value })}
                            className="w-8 h-7 rounded border border-gray-300 dark:border-gray-600"
                          />
                          <input
                            type="text"
                            value={categoryFormData.color}
                            onChange={e => setCategoryFormData({ ...categoryFormData, color: e.target.value })}
                            className="w-20 px-1.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-200 dark:focus:ring-blue-800 outline-none font-mono uppercase"
                            maxLength={7}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-0.5">
                          Иконка
                        </label>
                        <IconSelect
                          value={categoryFormData.icon}
                          onChange={icon => setCategoryFormData({ ...categoryFormData, icon })}
                          color={categoryFormData.color}
                        />
                      </div>

                      <div className="flex items-center gap-1.5">
                        {editingCategoryId ? (
                          <>
                            <button
                              onClick={handleSaveCategory}
                              className="bg-blue-600 text-white px-2 py-1.5 rounded-lg hover:bg-blue-700 transition-normal hover-lift-scale click-shrink font-medium text-xs whitespace-nowrap"
                            >
                              Сохранить
                            </button>
                            <button
                              onClick={handleCancelEditCategory}
                              className="px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-normal hover-lift-scale click-shrink font-medium text-xs whitespace-nowrap"
                            >
                              Отмена
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={handleAddCategory}
                              disabled={!categoryFormData.name.trim()}
                              className="bg-blue-500 text-white px-2 py-1.5 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-normal hover-lift-scale click-shrink font-medium text-xs whitespace-nowrap"
                            >
                              Добавить
                            </button>
                            <button
                              onClick={handleCancelAddCategory}
                              className="px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-normal hover-lift-scale click-shrink font-medium text-xs whitespace-nowrap"
                            >
                              Отмена
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {categoryError && (
                    <div className="mt-3 p-2 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg text-sm text-red-700 dark:text-red-400">
                      {categoryError}
                    </div>
                  )}
                </div>
              )}

              <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr className="text-xs text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 px-3 font-semibold w-12 text-xs">Цвет</th>
                      <th className="text-left py-2 px-3 font-semibold text-xs">Название</th>
                      <th className="text-center py-2 px-3 font-semibold w-32 text-xs">Использовано</th>
                      <th className="text-center py-2 px-3 font-semibold w-20 text-xs">По умолч.</th>
                      <th className="text-center py-2 px-3 font-semibold w-28 text-xs">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900">
                    {categories.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="text-center py-6 text-sm text-gray-500 dark:text-gray-400"
                        >
                          Нет категорий. Добавьте первую категорию.
                        </td>
                      </tr>
                    ) : (
                      categories.map((category, index) => {
                        const usageCount = getCategoryUsageCount(category)
                        const uniqueKey = category.id || `category-${index}`
                        return (
                          <tr
                            key={uniqueKey}
                            className={`${
                              index < categories.length - 1
                                ? 'border-b border-gray-100 dark:border-gray-800'
                                : ''
                            } hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                              editingCategoryId === category.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                            }`}
                          >
                            <td className="py-2 px-3">
                              {category.icon ? (
                                (() => {
                                  const CategoryIcon = getIcon(category.icon)
                                  if (CategoryIcon) {
                                    return (
                                      <CategoryIcon
                                        className="w-5 h-5"
                                        style={{ color: category.color }}
                                      />
                                    )
                                  }
                                  return (
                                    <div
                                      className="w-5 h-5 rounded-full"
                                      style={{ background: category.color }}
                                    />
                                  )
                                })()
                              ) : (
                                <div
                                  className="w-5 h-5 rounded-full"
                                  style={{ background: category.color }}
                                />
                              )}
                            </td>

                            <td className="py-2 px-3">
                              <span className="font-medium text-sm text-gray-800 dark:text-white">
                                {category.name}
                              </span>
                            </td>

                            <td className="py-2 px-3 text-center">
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                {usageCount}{' '}
                                {usageCount === 1
                                  ? 'раз'
                                  : usageCount > 1 && usageCount < 5
                                    ? 'раза'
                                    : 'раз'}
                              </span>
                            </td>

                            <td className="py-2 px-3 text-center">
                              <button
                                onClick={() => setDefaultCategory(category.id)}
                                className={`p-1 rounded transition-colors hover-lift-scale click-shrink ${
                                  defaultCategory === category.id || defaultCategory === category.name
                                    ? 'text-yellow-500 dark:text-yellow-400'
                                    : 'text-gray-300 dark:text-gray-600 hover:text-yellow-400 dark:hover:text-yellow-500'
                                }`}
                                title={
                                  defaultCategory === category.id || defaultCategory === category.name
                                    ? 'Категория по умолчанию'
                                    : 'Сделать категорией по умолчанию'
                                }
                              >
                                <Star
                                  className="w-4 h-4"
                                  fill={
                                    defaultCategory === category.id || defaultCategory === category.name
                                      ? 'currentColor'
                                      : 'none'
                                  }
                                />
                              </button>
                            </td>

                            <td className="py-2 px-3">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleEditCategory(category)}
                                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors p-1 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded hover-lift-scale click-shrink"
                                  title="Редактировать"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteCategory(category.id)}
                                  className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors p-1 hover:bg-red-50 dark:hover:bg-red-900/30 rounded hover-lift-scale click-shrink"
                                  title="Удалить"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-800 dark:text-blue-300">
                  💡 <strong>Подсказка:</strong> Категории используются для группировки записей времени.
                </p>
              </div>
            </div>
          )}
      </AnimatedModalContent>
        </div>
      </div>

      {/* Модальные окна подтверждения */}

      <ConfirmModal {...categoryDeleteConfirm.confirmConfig} />
    </BaseModal>
    </>
  )
}
