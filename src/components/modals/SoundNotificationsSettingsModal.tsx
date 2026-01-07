import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence } from 'framer-motion'
import { Palette, Settings as SettingsIcon, Play, Bell, Timer, Trash2, BotMessageSquare, CalendarDays, Clock, Plus, HardDrive, Folder, Archive, Upload, Edit2, Star, CreditCard, User, Keyboard } from '../../utils/icons'
import { BaseModal } from '../ui/BaseModal'
import { SettingsNavItem } from './settings/SettingsNavItem'
import { NestedModal } from './about/NestedModal'
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
  useCustomWorkDates
} from '../../store/useSettingsStore'
import { useSoundManager } from '../../hooks/useSound'
import { useNotifications } from '../../hooks/useNotifications'
import { useShowSuccess } from '../../store/useUIStore'
import { Notification } from '../ui/Notification'
import { useIsMobile } from '../../hooks/useIsMobile'
import { Toggle } from '../ui/Toggle'
import type { NotificationType, NotificationPriority } from '../../types/aiNotifications'
import { PaymentDate, Category, WorkScheduleTemplate } from '../../types'
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
import { handleError } from '../../utils/errorHandler'
import { logger } from '../../utils/logger'
import { Button } from '../ui/Button'
import { IconSelect } from '../ui/IconSelect'
import { getIcon } from '../../utils/iconHelper'
import { useAINotificationsStore } from '../../store/useAINotificationsStore'
import { APP_VERSION_FULL } from '../../config/appVersion'
import { NotificationsTab, ProductivityTab, PersonalizationTab, FinanceTab, BackupsTab, WorkScheduleTab, CategoriesTab, AITab, AccountTab, KeyboardShortcutsTab } from '../settings/tabs'

/**
 * Компонент карточки предпросмотра анимации фавикона
 */

interface SoundNotificationsSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  initialTab?: string | null
}

export function SoundNotificationsSettingsModal({ isOpen, onClose, initialTab = null }: SoundNotificationsSettingsModalProps) {
  // ✅ ОПТИМИЗАЦИЯ: Используем атомарные селекторы для минимизации ре-рендеров
  const notifications = useNotificationsSettings()
  const dailyHours = useDailyHours()
  const pomodoroSettings = usePomodoroSettings()
  const updateSettings = useUpdateSettings()
  const soundManager = useSoundManager()
  const showSuccess = useShowSuccess()
  const { showWarning, showError } = useNotifications()
  const isMobile = useIsMobile()
  const aiEnabled = useAINotificationsStore((state) => state.enabled)

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
  const [customIntervalMinutes, setCustomIntervalMinutes] = useState<number | null>(null)

  // Состояние для активного таба (вариант 4: вертикальные табы)
  // null = показываем приветственный экран
  const [activeTab, setActiveTab] = useState<string | null>(initialTab || null)

  // Обновление активного таба при открытии модального окна или изменении initialTab
  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab)
    } else if (isOpen && !initialTab) {
      // Если модальное окно открывается без указания таба, показываем приветствие
      setActiveTab(null)
    }
  }, [isOpen, initialTab])

  // Состояние для раздела Выплаты
  const savedPaymentDates = usePaymentDates()
  const addPaymentDate = useAddPaymentDate()
  const updatePaymentDate = useUpdatePaymentDate()
  const deletePaymentDate = useDeletePaymentDate()
  const reorderPaymentDates = useReorderPaymentDates()
  const [paymentDates, setPaymentDates] = useState<PaymentDate[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
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

  // Состояние для раздела Категории перенесено в CategoriesTab




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

  // ✅ Автосохранение настроек фавикона при изменении
  useEffect(() => {
    if (isOpen) {
      updateSettings({
        notifications: {
          ...notifications,
          faviconAnimationStyle,
          faviconAnimationColor,
          faviconAnimationSpeed,
          faviconAnimationEnabled,
        }
      })
    }
  }, [faviconAnimationStyle, faviconAnimationColor, faviconAnimationSpeed, faviconAnimationEnabled])

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
    (id: string, start: number, end: number, periodMonth?: number) => {
      setPaymentDates(prev =>
        prev.map(p => {
          if (p.id === id) {
            return {
              ...p,
              period: {
                start: start || 0,
                end: end || 0,
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
    (id: string, day: number, month?: number) => {
      const targetMonth = month !== undefined ? month : calendar.currentMonth
      const monthStr = (targetMonth + 1).toString().padStart(2, '0')
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
    (day: number) => {
      return !!paymentDates.find(payment => {
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
    (day: number) => {
      return paymentDates.find(payment => {
        const periodMonth = getPeriodMonth(payment)
        if (periodMonth !== calendar.currentMonth) {
          return false
        }
        return day >= payment.period.start && day <= payment.period.end
      }) || null
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
  const [testNotification, setTestNotification] = useState<any>(null)
  const testNotificationTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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



  // Данные для карточек настроек с группировкой
  const settingsGroups = [
    {
      id: 'profile',
      title: 'Профиль',
      items: [
        {
          id: 'account',
          icon: User,
          title: 'Аккаунт',
          subtitle: 'Профиль и план',

          accentClass: 'slate-500', 
        },
      ]
    },
    {
      id: 'app',
      title: 'Приложение',
      items: [
        {
          id: 'personalization',
          icon: Palette,
          title: 'Персонализация',
          subtitle: 'Тема и иконки',

          accentClass: 'violet-500', 
        },
        {
          id: 'shortcuts',
          icon: Keyboard,
          title: 'Горячие клавиши',
          subtitle: 'Быстрый доступ',

          accentClass: 'sky-500', 
        },
        {
          id: 'backups',
          icon: HardDrive,
          title: 'Данные',
          subtitle: 'Бэкап и сброс',

          accentClass: 'cyan-500',
        },
      ]
    },
    {
      id: 'work',
      title: 'Работа',
      items: [
        {
          id: 'workSchedule',
          icon: CalendarDays,
          title: 'График работы',
          subtitle: 'Дни и часы',

          accentClass: 'blue-500', 
        },
        {
          id: 'categories',
          icon: Folder,
          title: 'Категории',
          subtitle: 'Теги и цвета',

          accentClass: 'indigo-500', 
        },
        {
          id: 'finance',
          icon: CreditCard,
          title: 'Финансы',
          subtitle: 'Даты выплат',

          accentClass: 'emerald-500', 
        },
      ]
    },
    {
      id: 'alerts',
      title: 'Оповещения',
      items: [
        {
          id: 'notifications',
          icon: Bell,
          title: 'Уведомления',
          subtitle: 'Звуки и алерты',

          accentClass: 'amber-500', 
        },
        {
          id: 'productivity',
          icon: Timer,
          title: 'Продуктивность',
          subtitle: 'Помодоро и перерывы',

          accentClass: 'rose-500', 
        },
        {
          id: 'ai',
          icon: BotMessageSquare,
          title: 'AI Ассистент',
          subtitle: 'Умные функции',

          accentClass: 'fuchsia-500', 
        },
      ]
    },
  ]

  // Плоский массив карточек для поиска активной
  const gridCards = settingsGroups.flatMap(group => group.items)

  // Сбрасываем выбранную секцию при закрытии
  useEffect(() => {
    if (!isOpen) { 
      // При открытии initialTab обрабатывается в другом эффекте
    }
  }, [isOpen])

  // Текущая активная карточка
  const activeCard = gridCards.find(c => c.id === activeTab)

  return (
    <>
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        title="Настройки"
        size="large"
        className={`transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] md:!max-w-6xl md:!w-[95vw] md:!h-[90vh]`}
        closeOnOverlayClick={false}
        disableContentScroll={true}
        footer={null}
      >
        <div className="flex flex-col md:flex-row h-full overflow-hidden">
          {/* Левая колонка (Меню) */}
          <div className={`
            flex flex-col h-full overflow-y-auto custom-scrollbar transition-all duration-300 overflow-x-hidden
            md:w-[25%] md:border-r md:border-gray-100 dark:md:border-gray-800 md:pr-4
          `}>
            {/* Навигация с группировкой */}
            <div className="flex flex-col gap-2 mb-6 px-1">
              {settingsGroups.map((group, groupIndex) => (
                <div key={group.id}>
                  {/* Заголовок группы — стили как у subtitle */}
                  <div className={`
                    px-3 text-sm text-gray-500 dark:text-gray-400 font-medium
                    pb-3
                    ${groupIndex > 0 ? 'mt-4 pt-3 border-t border-gray-100 dark:border-gray-800' : ''}
                  `}>
                    {group.title}
                  </div>
                  {/* Элементы группы */}
                  <div className="flex flex-col gap-2">
                    {group.items.map(card => (
                      <SettingsNavItem
                        key={card.id}
                        icon={card.icon}
                        title={card.title}
                        subtitle={card.subtitle}

                        accentClass={card.accentClass}
                        onClick={() => setActiveTab(card.id)}
                        isActive={activeTab === card.id}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Дополнительная инфо или кнопки внизу сайдбара */}
            <div className="mt-auto hidden md:block opacity-60 hover:opacity-100 transition-opacity">
               <p className="text-xs text-center text-gray-400">
                  {APP_VERSION_FULL}
               </p>
            </div>
          </div>

          {/* Правая колонка (Контент) */}
          <div className="hidden md:block md:w-[75%] h-full pl-6 overflow-hidden relative">
            <AnimatePresence mode="wait">
              {activeTab === null ? (
                /* Приветственный экран */
                <div className="h-full flex flex-col items-center justify-center text-center px-8">
                  {/* Анимированная иконка */}
                  <div className="relative mb-6">
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 dark:from-blue-500/10 dark:to-purple-500/10 flex items-center justify-center animate-pulse">
                      <SettingsIcon className="w-12 h-12 text-blue-500 dark:text-blue-400" />
                    </div>
                    {/* Декоративные элементы */}
                    <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-green-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <div className="absolute -bottom-1 -left-1 w-3 h-3 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0.4s' }} />
                  </div>
                  
                  {/* Заголовок */}
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">
                    Добро пожаловать в настройки
                  </h2>
                  
                  {/* Описание */}
                  <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
                    Выберите раздел слева, чтобы настроить приложение под свои задачи и предпочтения
                  </p>
                  
                  {/* Декоративные элементы или пустой блок если нужно */}
                </div>
              ) : (
              <NestedModal
                key={activeTab}
                isOpen={true}
                onClose={() => {}}
                title={activeCard?.title || 'Настройки'}
                icon={activeCard?.icon || SettingsIcon}
                embedded={true}
              >
                <div className="pb-20">
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
                        setFaviconStyle={(val) => setFaviconAnimationStyle(val as any)}
                        faviconColor={faviconAnimationColor}
                        setFaviconColor={setFaviconAnimationColor}
                        faviconSpeed={faviconAnimationSpeed}
                        setFaviconSpeed={(val) => setFaviconAnimationSpeed(val as any)}
                      />
                    )}
                     {activeTab === 'finance' && (
                      <FinanceTab
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
                      />
                    )}
                    {activeTab === 'backups' && (
                      <BackupsTab />
                    )}
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
                    {activeTab === 'categories' && (
                      <CategoriesTab />
                    )}
                    {activeTab === 'ai' && (
                      <AITab />
                    )}
                    {activeTab === 'account' && (
                      <AccountTab />
                    )}
                    {activeTab === 'shortcuts' && (
                      <KeyboardShortcutsTab />
                    )}
                </div>
              </NestedModal>
              )}
            </AnimatePresence>
          </div>

          {/* Мобильная версия NestedModal (Overlay) */}
          <AnimatePresence>
            {isOpen && activeTab && (
               <div className="md:hidden">
                 <NestedModal
                    isOpen={true}
                    onClose={() => {
                        // На мобильном: закрываем модалку настроек полностью или делаем "Назад"?
                        // В AboutModal мы делали setActiveSection(null).
                        // Но здесь activeTab всегда установлен.
                        // Если мы хотим "свернуть", то нужно состояние "мобильное меню активно".
                        // Пока просто закроем всё модальное окно, как и было.
                        onClose()
                    }}
                    title={activeCard?.title || ''}
                    icon={activeCard?.icon || SettingsIcon}
                    embedded={false}
                  >
                    <div className="pb-20">
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
                        setFaviconStyle={(val) => setFaviconAnimationStyle(val as any)}
                        faviconColor={faviconAnimationColor}
                        setFaviconColor={setFaviconAnimationColor}
                        faviconSpeed={faviconAnimationSpeed}
                        setFaviconSpeed={(val) => setFaviconAnimationSpeed(val as any)}
                      />
                    )}
                     {activeTab === 'finance' && (
                      <FinanceTab
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
                      />
                    )}
                    {activeTab === 'backups' && (
                      <BackupsTab />
                    )}
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
                    {activeTab === 'categories' && (
                      <CategoriesTab />
                    )}
                    {activeTab === 'ai' && (
                      <AITab />
                    )}
                    {activeTab === 'account' && (
                      <AccountTab />
                    )}
                    {activeTab === 'shortcuts' && (
                      <KeyboardShortcutsTab />
                    )}
                    </div>
                  </NestedModal>
               </div>
            )}
          </AnimatePresence>
        </div>

        {/* Портал для уведомлений */}
        {testNotification && createPortal(
          <div className="fixed bottom-4 right-4 z-[999999] pointer-events-auto">
             <Notification
              notification={testNotification}
              onClose={() => setTestNotification(null)}
            />
          </div>,
          document.body
        )}
  

      </BaseModal>
    </>
  )
}
