import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Palette, Settings as SettingsIcon, Play, Bell, Timer, Trash2, BotMessageSquare, CalendarDays, Clock, Plus, HardDrive, Folder, Archive, Upload, Edit2, Star } from '../../utils/icons'
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
import { backupManager } from '../../utils/backupManager'
import { useCreateManualBackup, useRestoreFromBackup, useEntries } from '../../store/useEntriesStore'
import { useConfirmModal } from '../../hooks/useConfirmModal'
import { ConfirmModal } from './ConfirmModal'
import { handleError } from '../../utils/errorHandler'
import { logger } from '../../utils/logger'
import { Button } from '../ui/Button'
import { IconSelect } from '../ui/IconSelect'
import { getIcon } from '../../utils/iconHelper'

/**
 * Компонент карточки предпросмотра анимации фавикона
 */
function FaviconPreviewCard({ style, isSelected, color, speed, onClick }) {
  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  const logoImageRef = useRef(null)
  const [isHovered, setIsHovered] = useState(false)

  // Загружаем логотип для data-pulse
  useEffect(() => {
    if (style.value === 'data-pulse' && !logoImageRef.current) {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        logoImageRef.current = img
        // Перезапускаем анимацию после загрузки логотипа (только если наведено)
        if (canvasRef.current && isHovered) {
          const canvas = canvasRef.current
          const ctx = canvas.getContext('2d')
          const speedMap = { slow: 4000, normal: 2000, fast: 1000 }
          const animationSpeed = speedMap[speed] || 2000
          const time = Date.now() / animationSpeed
          const pulseTime = time * 1.5
          const dataPulseValue = 0.5 + Math.sin(pulseTime * Math.PI * 2) * 0.5

          ctx.clearRect(0, 0, 32, 32)
          ctx.save()
          const scale = 0.9 + dataPulseValue * 0.1
          const alpha = 0.8 + dataPulseValue * 0.2
          ctx.globalAlpha = alpha
          ctx.translate(16, 16)
          ctx.scale(scale, scale)
          ctx.translate(-16, -16)
          ctx.drawImage(img, 0, 0, 32, 32)
          ctx.restore()
        }
      }
      img.onerror = () => {
        console.warn('Не удалось загрузить логотип для data-pulse')
      }
      img.src = '/logo-4-data-pulse.svg'
    }
  }, [style.value, isHovered, speed])

  // Инициализация статичного фавикона и анимация при наведении
  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    // Анимация запускается только при наведении (для всех стилей, включая data-pulse)
    if (!isHovered) {
      ctx.clearRect(0, 0, 32, 32)

      // Для data-pulse показываем статичный логотип (если загружен), иначе круг
      if (style.value === 'data-pulse' && logoImageRef.current) {
        ctx.drawImage(logoImageRef.current, 0, 0, 32, 32)
      } else {
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(16, 16, 14, 0, 2 * Math.PI)
        ctx.fill()
      }

      // Останавливаем анимацию, если она была запущена
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
      return
    }

    // Если наведено, запускаем анимацию
    const speedMap = { slow: 4000, normal: 2000, fast: 1000 }
    const animationSpeed = speedMap[speed] || 2000

    const draw = () => {
      ctx.clearRect(0, 0, 32, 32)

      // Используем тот же алгоритм расчета времени, что и в useFavicon.js
      const time = Date.now() / animationSpeed

      switch (style.value) {
        case 'pulse': {
          // Pulse: быстрое увеличение и уменьшение с резкими переходами
          const pulseValue = 0.5 + Math.sin(time * Math.PI * 4) * 0.5 // Более быстрая пульсация
          ctx.fillStyle = color
          ctx.beginPath()
          const pulseRadius = 8 + pulseValue * 8 // От 8 до 16
          ctx.arc(16, 16, pulseRadius, 0, 2 * Math.PI)
          ctx.fill()
          // Добавляем внешнее кольцо для пульсации
          ctx.strokeStyle = color
          ctx.globalAlpha = 0.3 * (1 - pulseValue)
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.arc(16, 16, pulseRadius + 4, 0, 2 * Math.PI)
          ctx.stroke()
          ctx.globalAlpha = 1
          break
        }
        case 'blink': {
          const blinkValue = Math.floor(time) % 2 === 0 ? 1 : 0.2
          ctx.globalAlpha = blinkValue
          ctx.fillStyle = color
          ctx.beginPath()
          ctx.arc(16, 16, 14, 0, 2 * Math.PI)
          ctx.fill()
          ctx.globalAlpha = 1
          break
        }
        case 'rotate':
          ctx.save()
          ctx.translate(16, 16)
          ctx.rotate(((time * 0.5) % 1) * Math.PI * 2)
          ctx.translate(-16, -16)
          ctx.fillStyle = color
          ctx.beginPath()
          ctx.arc(16, 16, 14, 0, 2 * Math.PI)
          ctx.fill()
          ctx.fillStyle = '#ffffff'
          ctx.beginPath()
          ctx.moveTo(16, 4)
          ctx.lineTo(12, 12)
          ctx.lineTo(20, 12)
          ctx.closePath()
          ctx.fill()
          ctx.restore()
          break
        case 'wave': {
          // Wave: несколько концентрических колец, расходящихся от центра
          ctx.strokeStyle = color
          ctx.lineWidth = 2
          for (let i = 0; i < 5; i++) {
            const waveProgress = (time * 1.5 + i * 0.3) % 1
            ctx.globalAlpha = (1 - waveProgress) * 0.8
            ctx.beginPath()
            const waveRadius = 4 + waveProgress * 12 // От 4 до 16
            ctx.arc(16, 16, waveRadius, 0, 2 * Math.PI)
            ctx.stroke()
          }
          // Центральный круг
          ctx.globalAlpha = 1
          ctx.fillStyle = color
          ctx.beginPath()
          ctx.arc(16, 16, 4, 0, 2 * Math.PI)
          ctx.fill()
          ctx.globalAlpha = 1
          break
        }
        case 'gradient': {
          const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 14)
          const hue = (((time * 0.3) % 1) * 360) % 360
          gradient.addColorStop(0, `hsl(${hue}, 70%, 50%)`)
          gradient.addColorStop(1, `hsl(${hue}, 70%, 30%)`)
          ctx.fillStyle = gradient
          ctx.beginPath()
          ctx.arc(16, 16, 14, 0, 2 * Math.PI)
          ctx.fill()
          break
        }
        case 'morph': {
          // Morph: превращение квадрат → круг → треугольник
          const morphTime = (time * 0.8) % 3 // 0-1: квадрат→круг, 1-2: круг→треугольник, 2-3: треугольник→квадрат
          ctx.fillStyle = color
          ctx.save()
          ctx.translate(16, 16)

          if (morphTime < 1) {
            // Фаза 1: Квадрат → Круг (0.0 → 1.0)
            const progress = morphTime // 0 → 1
            const size = 14

            if (progress < 0.5) {
              // Ближе к квадрату
              const cornerRadius = (1 - progress * 2) * 7 // От 7 до 0
              ctx.beginPath()
              ctx.moveTo(-size + cornerRadius, -size)
              ctx.lineTo(size - cornerRadius, -size)
              ctx.quadraticCurveTo(size, -size, size, -size + cornerRadius)
              ctx.lineTo(size, size - cornerRadius)
              ctx.quadraticCurveTo(size, size, size - cornerRadius, size)
              ctx.lineTo(-size + cornerRadius, size)
              ctx.quadraticCurveTo(-size, size, -size, size - cornerRadius)
              ctx.lineTo(-size, -size + cornerRadius)
              ctx.quadraticCurveTo(-size, -size, -size + cornerRadius, -size)
              ctx.closePath()
            } else {
              // Ближе к кругу
              const circleProgress = (progress - 0.5) * 2 // 0 → 1
              const cornerRadius = circleProgress * 7 // От 0 до 7
              ctx.beginPath()
              ctx.moveTo(-size + cornerRadius, -size)
              ctx.lineTo(size - cornerRadius, -size)
              ctx.quadraticCurveTo(size, -size, size, -size + cornerRadius)
              ctx.lineTo(size, size - cornerRadius)
              ctx.quadraticCurveTo(size, size, size - cornerRadius, size)
              ctx.lineTo(-size + cornerRadius, size)
              ctx.quadraticCurveTo(-size, size, -size, size - cornerRadius)
              ctx.lineTo(-size, -size + cornerRadius)
              ctx.quadraticCurveTo(-size, -size, -size + cornerRadius, -size)
              ctx.closePath()
            }
            ctx.fill()
          } else if (morphTime < 2) {
            // Фаза 2: Круг → Треугольник (1.0 → 2.0)
            const progress = morphTime - 1 // 0 → 1
            const size = 14

            if (progress < 0.5) {
              // Ближе к кругу
              const circleProgress = 1 - progress * 2 // 1 → 0
              const cornerRadius = circleProgress * 7 // От 7 до 0
              ctx.beginPath()
              ctx.moveTo(-size + cornerRadius, -size)
              ctx.lineTo(size - cornerRadius, -size)
              ctx.quadraticCurveTo(size, -size, size, -size + cornerRadius)
              ctx.lineTo(size, size - cornerRadius)
              ctx.quadraticCurveTo(size, size, size - cornerRadius, size)
              ctx.lineTo(-size + cornerRadius, size)
              ctx.quadraticCurveTo(-size, size, -size, size - cornerRadius)
              ctx.lineTo(-size, -size + cornerRadius)
              ctx.quadraticCurveTo(-size, -size, -size + cornerRadius, -size)
              ctx.closePath()
              ctx.fill()
            } else {
              // Ближе к треугольнику
              const triangleProgress = (progress - 0.5) * 2 // 0 → 1
              const triangleY = size * (1 - triangleProgress * 0.3) // Постепенно поднимаем центр

              ctx.beginPath()
              ctx.moveTo(0, -size) // Верхняя вершина
              ctx.lineTo(size * 0.866, triangleY) // Правая нижняя
              ctx.lineTo(-size * 0.866, triangleY) // Левая нижняя
              ctx.closePath()
              ctx.fill()
            }
          } else {
            // Фаза 3: Треугольник → Квадрат (2.0 → 3.0)
            const progress = morphTime - 2 // 0 → 1
            const size = 14

            if (progress < 0.5) {
              // Ближе к треугольнику
              const triangleProgress = 1 - progress * 2 // 1 → 0
              const triangleY = size * (1 - triangleProgress * 0.3)

              ctx.beginPath()
              ctx.moveTo(0, -size)
              ctx.lineTo(size * 0.866, triangleY)
              ctx.lineTo(-size * 0.866, triangleY)
              ctx.closePath()
              ctx.fill()
            } else {
              // Ближе к квадрату
              const squareProgress = (progress - 0.5) * 2 // 0 → 1
              const cornerRadius = squareProgress * 7 // От 0 до 7

              ctx.beginPath()
              ctx.moveTo(-size + cornerRadius, -size)
              ctx.lineTo(size - cornerRadius, -size)
              ctx.quadraticCurveTo(size, -size, size, -size + cornerRadius)
              ctx.lineTo(size, size - cornerRadius)
              ctx.quadraticCurveTo(size, size, size - cornerRadius, size)
              ctx.lineTo(-size + cornerRadius, size)
              ctx.quadraticCurveTo(-size, size, -size, size - cornerRadius)
              ctx.lineTo(-size, -size + cornerRadius)
              ctx.quadraticCurveTo(-size, -size, -size + cornerRadius, -size)
              ctx.closePath()
              ctx.fill()
            }
          }

          ctx.restore()
          break
        }
        case 'particles': {
          ctx.fillStyle = color
          ctx.beginPath()
          ctx.arc(16, 16, 14, 0, 2 * Math.PI)
          ctx.fill()
          ctx.fillStyle = '#ffffff'
          for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2 + ((time * 0.8) % 1) * Math.PI * 2
            const particleX = 16 + Math.cos(angle) * 22
            const particleY = 16 + Math.sin(angle) * 22
            ctx.globalAlpha = 0.8
            ctx.beginPath()
            ctx.arc(particleX, particleY, 4, 0, 2 * Math.PI)
            ctx.fill()
          }
          ctx.globalAlpha = 1
          break
        }
        case 'breathe': {
          // Breathe: очень медленное и плавное дыхание с изменением прозрачности
          const breatheProgress = 0.5 + Math.sin(time * Math.PI * 0.5) * 0.5 // Медленнее в 4 раза
          ctx.globalAlpha = 0.7 + breatheProgress * 0.3 // Прозрачность тоже меняется
          ctx.fillStyle = color
          ctx.beginPath()
          const breatheRadius = 10 + Math.sin(breatheProgress * Math.PI * 2) * 6 // От 10 до 16, более плавно
          ctx.arc(16, 16, breatheRadius, 0, 2 * Math.PI)
          ctx.fill()
          // Добавляем мягкое свечение
          ctx.globalAlpha = 0.2 * breatheProgress
          ctx.beginPath()
          ctx.arc(16, 16, breatheRadius + 2, 0, 2 * Math.PI)
          ctx.fill()
          ctx.globalAlpha = 1
          break
        }
        case 'data-pulse': {
          // Data Pulse: пульсация данных и времени с концентрическими кругами, волной и часами
          // Используем ту же логику, что и в useFavicon.js
          const pulseValue = 0.5 + Math.sin(time * 1.5 * Math.PI * 2) * 0.5

          // Концентрические круги с пульсирующей анимацией
          const circles = [
            { r: 12, color: '#3B82F6', opacity: 0.2 },
            { r: 10, color: '#10B981', opacity: 0.3 },
            { r: 8, color: '#F59E0B', opacity: 0.4 },
          ]

          circles.forEach((circle, i) => {
            const scale = 1 + (pulseValue * 0.15 * (i + 1)) / 3 // Разные масштабы для каждого круга
            ctx.strokeStyle = circle.color
            ctx.globalAlpha = circle.opacity * (0.7 + pulseValue * 0.3)
            ctx.lineWidth = 1.5
            ctx.beginPath()
            ctx.arc(16, 16, circle.r * scale, 0, 2 * Math.PI)
            ctx.stroke()
          })

          // Волна данных с анимацией
          ctx.strokeStyle = color
          ctx.lineWidth = 2
          ctx.globalAlpha = 0.8
          ctx.beginPath()
          const waveOffset = (time * 1.5 * 0.3) % 1 // Смещение волны
          const wavePoints = 8
          for (let i = 0; i <= wavePoints; i++) {
            const x = 4 + (i / wavePoints) * 24
            const y = 16 + Math.sin((i / wavePoints + waveOffset) * Math.PI * 2) * 4 * pulseValue
            if (i === 0) {
              ctx.moveTo(x, y)
            } else {
              ctx.lineTo(x, y)
            }
          }
          ctx.stroke()

          // Цветные точки на волне с пульсацией
          const points = [
            { x: 8, y: 10, color: '#3B82F6' },
            { x: 12, y: 22, color: '#10B981' },
            { x: 20, y: 8, color: '#F59E0B' },
            { x: 24, y: 18, color: '#10B981' },
          ]

          points.forEach((point, i) => {
            const pointPulse = 0.5 + Math.sin(time * 1.5 * Math.PI * 2 + i * 0.5) * 0.5
            ctx.fillStyle = point.color
            ctx.globalAlpha = 0.7 + pointPulse * 0.3
            ctx.beginPath()
            ctx.arc(point.x, point.y, 1.5 * (0.8 + pointPulse * 0.4), 0, 2 * Math.PI)
            ctx.fill()
          })

          // Центральные часы со стрелками
          ctx.strokeStyle = '#3B82F6'
          ctx.lineWidth = 2
          ctx.globalAlpha = 1
          ctx.beginPath()
          ctx.arc(16, 16, 3, 0, 2 * Math.PI)
          ctx.stroke()

          // Вращающиеся стрелки
          ctx.save()
          ctx.translate(16, 16)
          const hourAngle = ((time * 1.5 * 0.1) % 1) * Math.PI * 2
          const minuteAngle = ((time * 1.5 * 0.5) % 1) * Math.PI * 2

          // Часовая стрелка
          ctx.strokeStyle = '#3B82F6'
          ctx.lineWidth = 1.5
          ctx.rotate(hourAngle)
          ctx.beginPath()
          ctx.moveTo(0, 0)
          ctx.lineTo(0, -2.5)
          ctx.stroke()
          ctx.rotate(-hourAngle) // Возвращаем обратно

          // Минутная стрелка
          ctx.strokeStyle = '#10B981'
          ctx.lineWidth = 1.5
          ctx.rotate(minuteAngle)
          ctx.beginPath()
          ctx.moveTo(0, 0)
          ctx.lineTo(2, 0)
          ctx.stroke()

          // Центр часов
          ctx.fillStyle = '#F59E0B'
          ctx.beginPath()
          ctx.arc(0, 0, 0.8, 0, 2 * Math.PI)
          ctx.fill()

          ctx.restore()
          ctx.globalAlpha = 1
          break
        }
        default:
          ctx.fillStyle = color
          ctx.beginPath()
          ctx.arc(16, 16, 14, 0, 2 * Math.PI)
          ctx.fill()
      }
    }

    const animate = () => {
      draw()
      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [style.value, color, speed, isHovered])

  return (
    <div
      className={`p-2 rounded-lg border-2 cursor-pointer transition-all hover:scale-105 relative ${
        isSelected
          ? 'border-blue-500 bg-blue-500/10'
          : 'border-gray-700 dark:border-gray-600 hover:border-blue-500'
      }`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <canvas
        ref={canvasRef}
        width={32}
        height={32}
        className="w-8 h-8 rounded mx-auto mb-1 border border-gray-300 dark:border-gray-600"
        style={{ imageRendering: 'pixelated' }}
      />
      <div className="text-[10px] text-white dark:text-gray-300 text-center">{style.label}</div>
    </div>
  )
}

/**
 * Модальное окно настроек звуковых уведомлений и анимации фавикона
 */
export function SoundNotificationsSettingsModal({ isOpen, onClose, initialTab = null }) {
  // ✅ ОПТИМИЗАЦИЯ: Используем атомарные селекторы для минимизации ре-рендеров
  const notifications = useNotificationsSettings()
  const dailyHours = useDailyHours()
  const pomodoroSettings = usePomodoroSettings()
  const updateSettings = useUpdateSettings()
  const { playSound } = useSoundManager()
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
  
  // Состояние для раздела Бэкапы
  const createManualBackup = useCreateManualBackup()
  const restoreFromBackup = useRestoreFromBackup()
  const [backups, setBackups] = useState([])
  const [loadingBackups, setLoadingBackups] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const deleteBackupConfirm = useConfirmModal()
  const restoreBackupConfirm = useConfirmModal()
  
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
  
  // AI-уведомления: состояние из store
  const aiStore = useAINotificationsStore()
  const {
    enabled: aiEnabled,
    frequencyMode,
    showInInsights,
    showBrowserNotifications,
    showToasts,
    enableSounds: aiEnableSounds,
    enabledTypes,
    quietHours,
    testStats,
    addNotification,
    clearTestNotifications,
    updateTestStats,
  } = aiStore

  // AI-уведомления: локальное состояние для расширенного режима тестирования
  const [advancedTestType, setAdvancedTestType] = useState<NotificationType>('productivity-pattern')
  const [advancedTestPriority, setAdvancedTestPriority] = useState<NotificationPriority>('normal')
  const [advancedTestPush, setAdvancedTestPush] = useState(false)
  const [advancedTestToast, setAdvancedTestToast] = useState(true)
  const [advancedTestSound, setAdvancedTestSound] = useState(false)

  // AI-уведомления: статус разрешений Browser Push
  const [pushPermission, setPushPermission] = useState<NotificationPermission>(
    BrowserPushService.getPermission()
  )

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

    const settingsToSave = {
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
  
  // Обработчики для бэкапов
  const loadBackups = useCallback(async () => {
    setLoadingBackups(true)
    try {
      const backupList = await backupManager.listBackups()
      setBackups(backupList)
    } catch (error) {
      const errorMessage = handleError(error, { operation: 'Загрузка списка бэкапов' })
      logger.error('❌ Ошибка загрузки списка бэкапов:', error)
      showError(errorMessage)
    } finally {
      setLoadingBackups(false)
    }
  }, [showError])
  
  // Используем useRef для хранения актуальной версии loadBackups, чтобы избежать бесконечного цикла
  const loadBackupsRef = useRef(loadBackups)
  loadBackupsRef.current = loadBackups
  
  // Используем useLayoutEffect для синхронной загрузки бэкапов при открытии таба
  useLayoutEffect(() => {
    if (isOpen && activeTab === 'backups') {
      // Загружаем бэкапы синхронно при открытии таба
      loadBackupsRef.current()
    }
  }, [isOpen, activeTab])
  
  useEffect(() => {
    if (isOpen && activeTab === 'backups') {
      const unsubscribeBackupChanges = backupManager.onBackupChange(() => {
        if (isOpen && activeTab === 'backups') {
          loadBackupsRef.current()
        }
      })
      
      return () => {
        if (unsubscribeBackupChanges) {
          unsubscribeBackupChanges()
        }
      }
    }
  }, [isOpen, activeTab])
  
  const handleCreateBackup = async () => {
    setIsCreating(true)
    try {
      const result = await createManualBackup()
      if (result.success) {
        showSuccess('Резервная копия успешно создана')
        setTimeout(() => {
          loadBackups()
        }, 100)
      } else {
        showError('Не удалось создать резервную копию')
      }
    } catch (error) {
      const errorMessage = handleError(error, { operation: 'Создание резервной копии' })
      logger.error('❌ Ошибка создания бэкапа:', error)
      showError(errorMessage)
    } finally {
      setIsCreating(false)
    }
  }
  
  const handleRestoreBackup = timestamp => {
    restoreBackupConfirm.openConfirm({
      title: 'Восстановить данные?',
      message: 'Вы уверены, что хотите восстановить данные из этого бэкапа? Текущие данные будут заменены.',
      confirmText: 'Восстановить',
      cancelText: 'Отмена',
      onConfirm: async () => {
        setIsRestoring(true)
        try {
          const success = await restoreFromBackup(timestamp)
          if (success) {
            showSuccess('Данные успешно восстановлены')
            onClose()
          } else {
            showError('Не удалось восстановить данные')
          }
        } catch (error) {
          const errorMessage = handleError(error, { operation: 'Восстановление из бэкапа', timestamp })
          logger.error('❌ Ошибка восстановления:', error)
          showError(errorMessage)
        } finally {
          setIsRestoring(false)
        }
      },
    })
  }
  
  const handleDeleteBackup = timestamp => {
    deleteBackupConfirm.openConfirm({
      title: 'Удалить резервную копию?',
      message: 'Вы уверены, что хотите удалить этот бэкап? Это действие нельзя отменить.',
      confirmText: 'Удалить',
      cancelText: 'Отмена',
      onConfirm: async () => {
        try {
          const success = await backupManager.deleteBackup(timestamp)
          if (success) {
            showSuccess('Бэкап успешно удален')
            await loadBackups()
          } else {
            showError('Не удалось удалить бэкап')
          }
        } catch (error) {
          const errorMessage = handleError(error, { operation: 'Удаление бэкапа', timestamp })
          logger.error('❌ Ошибка удаления бэкапа:', error)
          showError(errorMessage)
        }
      },
    })
  }
  
  const formatBackupDate = timestamp => {
    const date = new Date(timestamp)
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }
  
  const formatBackupRelativeTime = timestamp => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    
    if (minutes < 1) return 'только что'
    if (minutes < 60) return `${minutes} ${minutes === 1 ? 'минуту' : minutes < 5 ? 'минуты' : 'минут'} назад`
    if (hours < 24) return `${hours} ${hours === 1 ? 'час' : hours < 5 ? 'часа' : 'часов'} назад`
    return `${days} ${days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'} назад`
  }
  
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
    playSound(soundType)
  }

  // Состояние для тестового уведомления (чтобы показать его поверх модального окна)
  const [testNotification, setTestNotification] = useState(null)
  const testNotificationTimeoutRef = useRef(null)

  // Тест напоминания о перерыве
  const handleTestBreakReminder = () => {
    const hoursWorked = breakReminderInterval
    const message = `⏸️ Пора сделать перерыв! Вы работаете уже ${hoursWorked} ${hoursWorked === 1 ? 'час' : hoursWorked < 5 ? 'часа' : 'часов'}. Рекомендуется сделать перерыв для поддержания продуктивности.`
    
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
    const message = `🍅 Pomodoro завершен! Пора сделать перерыв.`
    
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
      message = `🚨 Критическая переработка! Вы работаете уже ${totalHours.toFixed(1)} ${totalHours === 1 ? 'час' : totalHours < 5 ? 'часа' : 'часов'} (норма: ${dailyHours || 8} ч). Превышение: ${overtimeHours.toFixed(1)} ${overtimeHours === 1 ? 'час' : overtimeHours < 5 ? 'часа' : 'часов'}. Рекомендуется сделать перерыв и отдохнуть.`
    } else {
      message = `⚠️ Переработка! Вы работаете уже ${totalHours.toFixed(1)} ${totalHours === 1 ? 'час' : totalHours < 5 ? 'часа' : 'часов'} (норма: ${dailyHours || 8} ч). Превышение: ${overtimeHours.toFixed(1)} ${overtimeHours === 1 ? 'час' : overtimeHours < 5 ? 'часа' : 'часов'}. Рекомендуется сделать перерыв.`
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

  // AI-уведомления: обработчики изменения настроек
  const handleFrequencyChange = (mode: 'minimal' | 'balanced' | 'maximum') => (e: React.MouseEvent) => {
    e.stopPropagation()
    useAINotificationsStore.setState({ frequencyMode: mode })
  }

  const handleQuietHoursStartChange = (value: string) => {
    useAINotificationsStore.setState({
      quietHours: {
        ...quietHours,
        start: value,
      },
    })
  }

  const handleQuietHoursEndChange = (value: string) => {
    useAINotificationsStore.setState({
      quietHours: {
        ...quietHours,
        end: value,
      },
    })
  }

  // AI-уведомления: быстрые тесты
  const handleQuickTest = (type: NotificationType) => () => {
    const notification = AINotificationService.generateTestNotification(type)
    addNotification(notification)
    updateTestStats()
  }

  // AI-уведомления: расширенный тест
  const handleAdvancedTest = () => {
    const notification = AINotificationService.generateAdvancedTest({
      type: advancedTestType,
      priority: advancedTestPriority,
      showBrowserNotification: advancedTestPush,
      showToast: advancedTestToast,
      playSound: advancedTestSound,
    })
    addNotification(notification)
    updateTestStats()
  }

  // AI-уведомления: массовый тест
  const handleBulkTest = (count: number) => () => {
    const notifications = AINotificationService.generateBulkTestNotifications(count)
    notifications.forEach((notification) => addNotification(notification))
    updateTestStats()
  }

  // AI-уведомления: очистка тестовых
  const handleClearTests = () => {
    clearTestNotifications()
  }

  // AI-уведомления: запрос разрешений Browser Push
  const handleRequestPushPermission = async () => {
    const result = await BrowserPushService.requestPermission()
    setPushPermission(result)
  }

  // AI-уведомления: получение всех типов и приоритетов
  const allTypes = AINotificationService.getAllTypes()
  const allPriorities = AINotificationService.getAllPriorities()

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
      className="flex flex-col max-w-6xl"
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
              onClick={() => setActiveTab('pomodoro')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === 'pomodoro'
                  ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 border border-transparent'
              }`}
            >
              <Timer className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium text-sm">Pomodoro</span>
              <span className={`ml-auto px-2 py-0.5 rounded-md text-xs font-semibold ${
                pomodoroEnabled
                  ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                  : 'bg-gray-500/20 text-gray-600 dark:text-gray-400'
              }`}>
                {pomodoroEnabled ? 'ВКЛ' : 'ВЫКЛ'}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('favicon')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === 'favicon'
                  ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 border border-transparent'
              }`}
            >
              <Palette className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium text-sm">Фавикон</span>
              <span className={`ml-auto px-2 py-0.5 rounded-md text-xs font-semibold ${
                faviconAnimationEnabled
                  ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                  : 'bg-gray-500/20 text-gray-600 dark:text-gray-400'
              }`}>
                {faviconAnimationEnabled ? 'ВКЛ' : 'ВЫКЛ'}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('ai')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === 'ai'
                  ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 border border-transparent'
              }`}
            >
              <BotMessageSquare className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium text-sm">AI-подсказки</span>
              <span className={`ml-auto px-2 py-0.5 rounded-md text-xs font-semibold ${
                aiEnabled
                  ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                  : 'bg-gray-500/20 text-gray-600 dark:text-gray-400'
              }`}>
                {aiEnabled ? 'ВКЛ' : 'ВЫКЛ'}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('payments')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === 'payments'
                  ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 border border-transparent'
              }`}
            >
              <CalendarDays className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium text-sm">Выплаты</span>
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
                onClick={() => setActiveTab('pomodoro')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                  activeTab === 'pomodoro'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-700'
                }`}
              >
                <Timer className="w-4 h-4" />
                <span className="text-sm font-medium">Pomodoro</span>
              </button>
              <button
                onClick={() => setActiveTab('favicon')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                  activeTab === 'favicon'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-700'
                }`}
              >
                <Palette className="w-4 h-4" />
                <span className="text-sm font-medium">Фавикон</span>
              </button>
              <button
                onClick={() => setActiveTab('ai')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                  activeTab === 'ai'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-700'
                }`}
              >
                <BotMessageSquare className="w-4 h-4" />
                <span className="text-sm font-medium">AI-подсказки</span>
              </button>
              <button
                onClick={() => setActiveTab('payments')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                  activeTab === 'payments'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-700'
                }`}
              >
                <CalendarDays className="w-4 h-4" />
                <span className="text-sm font-medium">Выплаты</span>
              </button>
              <button
                onClick={() => setActiveTab('workSchedule')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                  activeTab === 'workSchedule'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-700'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">График</span>
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
              <button
                onClick={() => setActiveTab('categories')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                  activeTab === 'categories'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-700'
                }`}
              >
                <Folder className="w-4 h-4" />
                <span className="text-sm font-medium">Категории</span>
              </button>
            </div>
          </div>
        )}

        {/* Основной контент */}
        <div className="flex-1 min-h-0 p-6 overflow-y-auto custom-scrollbar">
          <AnimatedModalContent contentKey={`${activeTab}-${isOpen}`}>
            {/* Таб: Уведомления */}
            {activeTab === 'notifications' && (
            <>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Уведомления</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Настройте звуковые уведомления и напоминания о перерывах</p>
          </div>

          {/* Звуковые уведомления и Предупреждения о переработке */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {/* Звуковые уведомления */}
          <div className="glass-effect rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Звуковые уведомления
              </h3>
              <button
                onClick={() => setSoundNotificationsEnabled(!soundNotificationsEnabled)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  soundNotificationsEnabled ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    soundNotificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {soundNotificationsEnabled && (
              <div className="space-y-4">
                {/* Интервал уведомлений */}
                <div>
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                      Интервал
                    </label>
                    <div className="flex gap-2 flex-1">
                      <div className="flex-1 relative">
                        <select
                          value={notificationInterval === -1 ? 'custom' : notificationInterval}
                          onChange={e => {
                            if (e.target.value === 'custom') {
                              setNotificationInterval(-1)
                              // Устанавливаем значение по умолчанию для кастомного интервала
                              if (!customIntervalMinutes) {
                                setCustomIntervalMinutes(30)
                              }
                            } else {
                              setNotificationInterval(Number(e.target.value))
                              setCustomIntervalMinutes(null)
                            }
                          }}
                          className="w-full px-3 py-2 bg-gray-800 dark:bg-gray-700 border border-gray-700 dark:border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer"
                          style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 0.75rem center',
                          }}
                        >
                          <option value={15}>15 минут</option>
                          <option value={30}>30 минут</option>
                          <option value={45}>45 минут</option>
                          <option value={60}>1 час</option>
                          <option value={120}>2 часа</option>
                          <option value="custom">
                            Кастомное{' '}
                            {notificationInterval === -1 && customIntervalMinutes
                              ? `(${customIntervalMinutes} мин)`
                              : ''}
                          </option>
                        </select>
                      </div>
                      {notificationInterval === -1 && (
                        <input
                          type="number"
                          min="1"
                          max="1440"
                          placeholder="Минут"
                          value={customIntervalMinutes || ''}
                          onChange={e => {
                            const value = parseInt(e.target.value)
                            if (value >= 1 && value <= 1440) {
                              setCustomIntervalMinutes(value)
                            } else if (e.target.value === '' || value === 0) {
                              // Разрешаем пустое значение для ввода
                              setCustomIntervalMinutes(null)
                            }
                          }}
                          onBlur={e => {
                            // При потере фокуса, если значение некорректно, устанавливаем минимальное
                            const value = parseInt(e.target.value)
                            if (!value || value < 1) {
                              setCustomIntervalMinutes(30)
                            } else if (value > 1440) {
                              setCustomIntervalMinutes(1440)
                            }
                          }}
                          className="w-24 px-3 py-2 text-sm border border-gray-700 dark:border-gray-600 bg-gray-800 dark:bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Тип звука */}
                <div>
                  <label className="block text-xs font-semibold text-gray-900 dark:text-white mb-2">
                    Тип звука
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {soundTypes.map(sound => (
                      <button
                        key={sound.value}
                        onClick={() => setNotificationSound(sound.value)}
                        className={`p-2 rounded-lg border-2 transition-all hover:scale-105 text-xs font-semibold ${
                          notificationSound === sound.value
                            ? 'border-blue-500 bg-blue-500/10 text-white'
                            : 'border-gray-700 dark:border-gray-600 hover:border-blue-500 text-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="truncate">{sound.label}</span>
                          <div
                            onClick={e => {
                              e.stopPropagation()
                              handleTestSound(sound.value)
                            }}
                            className="ml-2 p-1 rounded hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors flex-shrink-0 cursor-pointer"
                            title="Прослушать звук"
                            role="button"
                            tabIndex={0}
                            aria-label="Прослушать звук"
                            onKeyDown={e => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                e.stopPropagation()
                                handleTestSound(sound.value)
                              }
                            }}
                          >
                            <Play className="w-3 h-3 text-blue-500" />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Напоминания о перерывах */}
                <div className="pt-4 border-t border-gray-700 dark:border-gray-600">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                      Напоминания о перерывах
                    </h4>
                    <button
                      onClick={() => setBreakRemindersEnabled(!breakRemindersEnabled)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${
                        breakRemindersEnabled ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                          breakRemindersEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {breakRemindersEnabled && (
                    <div>
                      <div className="flex items-center gap-3">
                        <label className="text-xs font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                          Интервал
                        </label>
                        <div className="flex-1">
                          <select
                            value={breakReminderInterval}
                            onChange={e => setBreakReminderInterval(parseInt(e.target.value))}
                            className="w-full px-3 py-2 bg-gray-800 dark:bg-gray-700 border border-gray-700 dark:border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer"
                            style={{
                              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                              backgroundRepeat: 'no-repeat',
                              backgroundPosition: 'right 0.75rem center',
                            }}
                          >
                            <option value={1}>Каждый час</option>
                            <option value={2}>Каждые 2 часа</option>
                            <option value={3}>Каждые 3 часа</option>
                            <option value={4}>Каждые 4 часа</option>
                            <option value={6}>Каждые 6 часов</option>
                          </select>
                        </div>
                        <button
                          onClick={handleTestBreakReminder}
                          className="px-3 py-2 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors whitespace-nowrap"
                        >
                          Пример
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Напоминание появится после непрерывной работы указанное количество часов
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Предупреждения о переработке */}
          <div className="glass-effect rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Предупреждения о переработке
              </h3>
              <button
                onClick={() => setOvertimeAlertsEnabled(!overtimeAlertsEnabled)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  overtimeAlertsEnabled ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    overtimeAlertsEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {overtimeAlertsEnabled && (
              <div className="space-y-4">
                {/* Порог предупреждения */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-gray-900 dark:text-white">
                      Порог предупреждения
                    </label>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {((dailyHours || 8) * overtimeWarningThreshold).toFixed(1)} ч
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={overtimeWarningThreshold}
                    onChange={e => setOvertimeWarningThreshold(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    style={{
                      background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((overtimeWarningThreshold - 0.5) / 1.5) * 100}%, #e5e7eb ${((overtimeWarningThreshold - 0.5) / 1.5) * 100}%, #e5e7eb 100%)`,
                    }}
                  />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>50%</span>
                    <span>100%</span>
                    <span>200%</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Предупреждение появится при превышении {((dailyHours || 8) * overtimeWarningThreshold).toFixed(1)} часов работы за день
                  </p>
                </div>

                {/* Порог критического предупреждения */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-gray-900 dark:text-white">
                      Порог критического предупреждения
                    </label>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {((dailyHours || 8) * overtimeCriticalThreshold).toFixed(1)} ч
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="3.0"
                    step="0.1"
                    value={overtimeCriticalThreshold}
                    onChange={e => setOvertimeCriticalThreshold(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    style={{
                      background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${((overtimeCriticalThreshold - 1.0) / 2.0) * 100}%, #e5e7eb ${((overtimeCriticalThreshold - 1.0) / 2.0) * 100}%, #e5e7eb 100%)`,
                    }}
                  />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>100%</span>
                    <span>200%</span>
                    <span>300%</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Критическое предупреждение появится при превышении {((dailyHours || 8) * overtimeCriticalThreshold).toFixed(1)} часов работы за день
                  </p>
                </div>

                {/* Звуковое уведомление */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-semibold text-gray-900 dark:text-white">
                      Звуковое уведомление
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Воспроизводить звук при предупреждении о переработке
                    </p>
                  </div>
                  <button
                    onClick={() => setOvertimeSoundAlert(!overtimeSoundAlert)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      overtimeSoundAlert ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        overtimeSoundAlert ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Кнопки тестирования */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handleTestOvertimeAlert(false)}
                    className="flex-1 px-3 py-2 text-xs font-medium rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white transition-colors"
                  >
                    Пример предупреждения
                  </button>
                  <button
                    onClick={() => handleTestOvertimeAlert(true)}
                    className="flex-1 px-3 py-2 text-xs font-medium rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
                  >
                    Пример критического
                  </button>
                </div>
              </div>
            )}
            </div>
          </div>
            </>
          )}

          {/* Таб: Pomodoro */}
          {activeTab === 'pomodoro' && (
            <>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Pomodoro таймер</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Настройте технику управления временем (25 минут работы + перерыв)</p>
          </div>

          {/* Настройки Pomodoro */}
          <div className="glass-effect rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Pomodoro таймер</h3>
              <button
                onClick={() => setPomodoroEnabled(!pomodoroEnabled)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  pomodoroEnabled ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    pomodoroEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {pomodoroEnabled && (
              <div className="space-y-4">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Техника управления временем: работа разбивается на интервалы по 25 минут (помодоро), разделенные перерывами.
                </p>

                {/* Автозапуск перерывов */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-semibold text-gray-900 dark:text-white">
                      Автоматически запускать перерывы
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      После завершения работы автоматически запускается перерыв
                    </p>
                  </div>
                  <button
                    onClick={() => setPomodoroAutoStartBreaks(!pomodoroAutoStartBreaks)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      pomodoroAutoStartBreaks ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        pomodoroAutoStartBreaks ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Автозапуск работы */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-semibold text-gray-900 dark:text-white">
                      Автоматически запускать работу
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      После завершения перерыва автоматически запускается работа
                    </p>
                  </div>
                  <button
                    onClick={() => setPomodoroAutoStartWork(!pomodoroAutoStartWork)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      pomodoroAutoStartWork ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        pomodoroAutoStartWork ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Звук при завершении */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-semibold text-gray-900 dark:text-white">
                      Звук при завершении интервала
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Воспроизводить звук при завершении работы или перерыва
                    </p>
                  </div>
                  <button
                    onClick={() => setPomodoroSoundOnComplete(!pomodoroSoundOnComplete)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      pomodoroSoundOnComplete ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        pomodoroSoundOnComplete ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Показывать уведомления */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-semibold text-gray-900 dark:text-white">
                      Показывать уведомления
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Показывать визуальные уведомления при завершении интервалов
                    </p>
                  </div>
                  <button
                    onClick={() => setPomodoroShowNotifications(!pomodoroShowNotifications)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      pomodoroShowNotifications ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        pomodoroShowNotifications ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Кнопка тестирования */}
                <div className="pt-2">
                  <button
                    onClick={handleTestPomodoroNotification}
                    className="px-3 py-2 text-xs font-medium rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors whitespace-nowrap"
                  >
                    Пример
                  </button>
                </div>
              </div>
            )}
          </div>
            </>
          )}

          {/* Таб: Фавикон */}
          {activeTab === 'favicon' && (
            <>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Анимация фавикона</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Настройте визуальный индикатор в табе браузера</p>
          </div>

          {/* Анимация фавикона */}
          <div className="glass-effect rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Анимация фавикона</h3>
              <button
                onClick={() => setFaviconAnimationEnabled(!faviconAnimationEnabled)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  faviconAnimationEnabled ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    faviconAnimationEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {faviconAnimationEnabled && (
              <div className="space-y-4">
                {/* Стиль анимации */}
                <div>
                  <div className="grid grid-cols-8 gap-2">
                    {animationStyles.map(style => (
                      <FaviconPreviewCard
                        key={style.value}
                        style={style}
                        isSelected={faviconAnimationStyle === style.value}
                        color={faviconAnimationColor}
                        speed={faviconAnimationSpeed}
                        onClick={() => setFaviconAnimationStyle(style.value)}
                      />
                    ))}
                  </div>
                </div>

                {/* Цвет */}
                <div>
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                      Цвет
                    </label>
                    <div className="grid grid-cols-8 gap-1.5 flex-1">
                      {presetColors.map(color => (
                        <button
                          key={color.value}
                          onClick={() => setFaviconAnimationColor(color.value)}
                          className={`w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 ${
                            faviconAnimationColor === color.value
                              ? 'border-blue-500 ring-2 ring-blue-500/50 scale-110'
                              : 'border-gray-700 dark:border-gray-600 hover:border-blue-500'
                          }`}
                          title={color.label}
                        >
                          <div className={`w-full h-full rounded ${color.preview}`} />
                        </button>
                      ))}
                      {/* Кастомный цвет - кнопка для выбора */}
                      <div
                        className={`w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 cursor-pointer relative ${
                          !presetColors.some(c => c.value === faviconAnimationColor)
                            ? 'border-blue-500 ring-2 ring-blue-500/50 scale-110'
                            : 'border-gray-700 dark:border-gray-600 hover:border-blue-500'
                        }`}
                        title="Кастомный цвет"
                      >
                        <input
                          type="color"
                          value={faviconAnimationColor}
                          onChange={e => setFaviconAnimationColor(e.target.value)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          title="Кастомный цвет"
                        />
                        <div className="w-full h-full rounded bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Скорость */}
                <div>
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                      Скорость
                    </label>
                    <div className="grid grid-cols-3 gap-2 flex-1">
                      {animationSpeeds.map(speed => (
                        <button
                          key={speed.value}
                          onClick={() => setFaviconAnimationSpeed(speed.value)}
                          className={`p-2 rounded-lg border-2 transition-all hover:scale-105 text-xs ${
                            faviconAnimationSpeed === speed.value
                              ? 'border-blue-500 bg-blue-500/10 text-white font-semibold'
                              : 'border-gray-700 dark:border-gray-600 hover:border-blue-500 text-gray-300'
                          }`}
                        >
                          {speed.label.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
            </>
          )}

          {/* Таб: AI */}
          {activeTab === 'ai' && (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">AI-уведомления</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Настройте интеллектуальные уведомления и подсказки</p>
              </div>

              {/* 1, 2 и 3. Общие настройки + Способы отображения + Типы уведомлений (в три колонки) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
              {/* 1. Общие настройки */}
                <div className="glass-effect rounded-xl p-4">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <span className="inline-flex h-2.5 w-2.5 rounded-full bg-blue-500" />
                  Общие настройки
                </h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <span className="text-xs font-semibold text-gray-900 dark:text-white">
                      Включить AI-уведомления
                    </span>
                    <Toggle
                      checked={aiEnabled}
                      onChange={(checked) => {
                        useAINotificationsStore.setState({ enabled: checked })
                      }}
                      size="sm"
                    />
                  </div>

                  <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <span className="text-xs font-semibold text-gray-900 dark:text-white">
                      Включить тихие часы
                    </span>
                    <Toggle
                      checked={quietHours.enabled}
                      onChange={(checked) => {
                        useAINotificationsStore.setState({
                          quietHours: {
                            ...quietHours,
                            enabled: checked,
                          },
                        })
                      }}
                      size="sm"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Режим частоты уведомлений
                    </label>
                      <div className="grid grid-cols-3 gap-1.5 w-full">
                    <button
                      type="button"
                      onClick={handleFrequencyChange('minimal')}
                        className={`px-2 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        frequencyMode === 'minimal'
                          ? 'bg-blue-500 text-white shadow-md'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                        Мин
                    </button>
                    <button
                      type="button"
                      onClick={handleFrequencyChange('balanced')}
                        className={`px-2 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        frequencyMode === 'balanced'
                          ? 'bg-blue-500 text-white shadow-md'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                        Сред
                    </button>
                    <button
                      type="button"
                      onClick={handleFrequencyChange('maximum')}
                        className={`px-2 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        frequencyMode === 'maximum'
                          ? 'bg-blue-500 text-white shadow-md'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                        Макс
                    </button>
                    </div>
                  </div>
                </div>

                {quietHours.enabled && (
                  <div className="space-y-2 mt-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Начало
                        </label>
                        <input
                          type="time"
                          value={quietHours.start}
                          onChange={(e) => handleQuietHoursStartChange(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Конец
                        </label>
                        <input
                          type="time"
                          value={quietHours.end}
                          onChange={(e) => handleQuietHoursEndChange(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-900 dark:text-white">
                      <Toggle
                        checked={quietHours.weekendsOnly}
                        onChange={(checked) => {
                          useAINotificationsStore.setState({
                            quietHours: {
                              ...quietHours,
                              weekendsOnly: checked,
                            },
                          })
                        }}
                        size="sm"
                      />
                      <span>Только по выходным</span>
                    </div>
                  </div>
                )}
              </div>
                {/* 2. Способы отображения */}
                <div className="glass-effect rounded-xl p-4">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="inline-flex h-2.5 w-2.5 rounded-full bg-blue-500" />
                    Способы отображения
                  </h3>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <span className="text-xs font-semibold text-gray-900 dark:text-white">
                      Показывать в блоке инсайтов
                    </span>
                    <Toggle
                      checked={showInInsights}
                      onChange={(checked) => {
                        useAINotificationsStore.setState({ showInInsights: checked })
                      }}
                      size="sm"
                    />
                  </div>

                  <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <span className="text-xs font-semibold text-gray-900 dark:text-white">
                      Browser Push (только критические)
                    </span>
                    <Toggle
                      checked={showBrowserNotifications}
                      onChange={(checked) => {
                        useAINotificationsStore.setState({ showBrowserNotifications: checked })
                      }}
                      size="sm"
                    />
                  </div>

                  <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <span className="text-xs font-semibold text-gray-900 dark:text-white">
                      Toast-уведомления
                    </span>
                    <Toggle
                      checked={showToasts}
                      onChange={(checked) => {
                        useAINotificationsStore.setState({ showToasts: checked })
                      }}
                      size="sm"
                    />
                  </div>

                  <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <span className="text-xs font-semibold text-gray-900 dark:text-white">
                      Звуковые эффекты
                    </span>
                    <Toggle
                      checked={aiEnableSounds}
                      onChange={(checked) => {
                        useAINotificationsStore.setState({ enableSounds: checked })
                      }}
                      size="sm"
                    />
                  </div>

                  {/* Кнопка запроса разрешений Browser Push */}
                  {showBrowserNotifications && BrowserPushService.isSupported() && (
                    <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-900 dark:text-white mb-0.5">
                            Разрешения браузера
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {pushPermission === 'granted' && 'Разрешено'}
                            {pushPermission === 'denied' && 'Отклонено'}
                            {pushPermission === 'default' && 'Не запрошено'}
                          </p>
                        </div>
                        {pushPermission !== 'granted' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRequestPushPermission()
                            }}
                            className="px-2.5 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-medium transition-colors"
                          >
                            Запросить
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                </div>

                {/* 3. Типы уведомлений */}
                <div className="glass-effect rounded-xl p-4">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="inline-flex h-2.5 w-2.5 rounded-full bg-blue-500" />
                    Типы уведомлений
                  </h3>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <span className="text-xs font-semibold text-gray-900 dark:text-white">
                      Предупреждения о выгорании
                    </span>
                    <Toggle
                      checked={enabledTypes.burnoutWarning}
                      onChange={(checked) => {
                        useAINotificationsStore.setState({
                          enabledTypes: {
                            ...enabledTypes,
                            burnoutWarning: checked,
                          },
                        })
                      }}
                      size="sm"
                    />
                  </div>

                  <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <span className="text-xs font-semibold text-gray-900 dark:text-white">
                      Паттерны продуктивности
                    </span>
                    <Toggle
                      checked={enabledTypes.productivityPatterns}
                      onChange={(checked) => {
                        useAINotificationsStore.setState({
                          enabledTypes: {
                            ...enabledTypes,
                            productivityPatterns: checked,
                          },
                        })
                      }}
                      size="sm"
                    />
                  </div>

                  <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <span className="text-xs font-semibold text-gray-900 dark:text-white">
                      Прогноз месяца
                    </span>
                    <Toggle
                      checked={enabledTypes.monthlyForecast}
                      onChange={(checked) => {
                        useAINotificationsStore.setState({
                          enabledTypes: {
                            ...enabledTypes,
                            monthlyForecast: checked,
                          },
                        })
                      }}
                      size="sm"
                    />
                  </div>

                  <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <span className="text-xs font-semibold text-gray-900 dark:text-white">
                      Неэффективные категории
                    </span>
                    <Toggle
                      checked={enabledTypes.inefficientCategories}
                      onChange={(checked) => {
                        useAINotificationsStore.setState({
                          enabledTypes: {
                            ...enabledTypes,
                            inefficientCategories: checked,
                          },
                        })
                      }}
                      size="sm"
                    />
                  </div>

                  <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <span className="text-xs font-semibold text-gray-900 dark:text-white">
                      Достижения
                    </span>
                    <Toggle
                      checked={enabledTypes.achievements}
                      onChange={(checked) => {
                        useAINotificationsStore.setState({
                          enabledTypes: {
                            ...enabledTypes,
                            achievements: checked,
                          },
                        })
                      }}
                      size="sm"
                    />
                  </div>
                </div>
                </div>
              </div>

              {/* 4. Режим тестирования */}
              <div className="border border-purple-200 dark:border-purple-800 rounded-xl p-4 bg-purple-50 dark:bg-purple-900/10">
                <h3 className="text-sm font-bold text-purple-900 dark:text-purple-300 mb-4 flex items-center gap-2">
                  <span className="inline-flex h-2.5 w-2.5 rounded-full bg-purple-500" />
                  Режим тестирования
                </h3>

                {/* Быстрые тесты */}
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-gray-900 dark:text-white mb-2">
                    Быстрые тесты
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={handleQuickTest('burnout-warning')}
                      className="px-2 py-1.5 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 rounded text-xs font-medium transition-colors"
                    >
                      Выгорание
                    </button>
                    <button
                      type="button"
                      onClick={handleQuickTest('goal-risk')}
                      className="px-2 py-1.5 bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300 rounded text-xs font-medium transition-colors"
                    >
                      Риск цели
                    </button>
                    <button
                      type="button"
                      onClick={handleQuickTest('monthly-forecast')}
                      className="px-2 py-1.5 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded text-xs font-medium transition-colors"
                    >
                      Прогноз
                    </button>
                    <button
                      type="button"
                      onClick={handleQuickTest('productivity-pattern')}
                      className="px-2 py-1.5 bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded text-xs font-medium transition-colors"
                    >
                      Паттерн
                    </button>
                    <button
                      type="button"
                      onClick={handleQuickTest('achievement')}
                      className="px-2 py-1.5 bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 text-green-700 dark:text-green-300 rounded text-xs font-medium transition-colors"
                    >
                      Достижение
                    </button>
                    <button
                      type="button"
                      onClick={handleQuickTest('anomaly')}
                      className="px-2 py-1.5 bg-orange-100 dark:bg-orange-900/30 hover:bg-orange-200 dark:hover:bg-orange-900/50 text-orange-700 dark:text-orange-300 rounded text-xs font-medium transition-colors"
                    >
                      Аномалия
                    </button>
                  </div>
                </div>

                {/* Расширенный режим */}
                <div className="mb-4 p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <h4 className="text-xs font-semibold text-gray-900 dark:text-white mb-2">
                    Расширенный режим
                  </h4>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Тип
                        </label>
                        <select
                          value={advancedTestType}
                          onChange={(e) => setAdvancedTestType(e.target.value as NotificationType)}
                          onClick={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                        >
                          {allTypes.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Приоритет
                        </label>
                        <select
                          value={advancedTestPriority}
                          onChange={(e) => setAdvancedTestPriority(e.target.value as NotificationPriority)}
                          onClick={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                        >
                          {allPriorities.map((priority) => (
                            <option key={priority.value} value={priority.value}>
                              {priority.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <div className="flex items-center gap-1.5 text-xs text-gray-900 dark:text-white">
                        <Toggle
                          checked={advancedTestPush}
                          onChange={(checked) => setAdvancedTestPush(checked)}
                          size="sm"
                        />
                        <span>Browser Push</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-900 dark:text-white">
                        <Toggle
                          checked={advancedTestToast}
                          onChange={(checked) => setAdvancedTestToast(checked)}
                          size="sm"
                        />
                        <span>Toast</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-900 dark:text-white">
                        <Toggle
                          checked={advancedTestSound}
                          onChange={(checked) => setAdvancedTestSound(checked)}
                          size="sm"
                        />
                        <span>Звук</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleAdvancedTest}
                      className="w-full px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-xs font-medium transition-colors"
                    >
                      Создать тест
                    </button>
                  </div>
                </div>

                {/* Массовый тест */}
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-gray-900 dark:text-white mb-2">
                    Массовый тест
                  </h4>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={handleBulkTest(3)}
                      className="flex-1 px-2.5 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-xs font-medium transition-colors"
                    >
                      Создать 3
                    </button>
                    <button
                      type="button"
                      onClick={handleBulkTest(5)}
                      className="flex-1 px-2.5 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-xs font-medium transition-colors"
                    >
                      Создать 5
                    </button>
                    <button
                      type="button"
                      onClick={handleBulkTest(10)}
                      className="flex-1 px-2.5 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-xs font-medium transition-colors"
                    >
                      Создать 10
                    </button>
                  </div>
                </div>

                {/* Управление и статистика */}
                <div className="space-y-2">
                  {testStats.currentCount > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleClearTests()
                      }}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-medium transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Очистить все тестовые ({testStats.currentCount})
                    </button>
                  )}

                  {testStats.totalCreated > 0 && (
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <p className="text-xs text-purple-900 dark:text-purple-300">
                        <strong>Статистика:</strong> Создано тестовых: {testStats.totalCreated}, Текущих: {testStats.currentCount}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Таб: Выплаты */}
          {activeTab === 'payments' && (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Настройка дат выплат</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Настройте даты, периоды и названия ваших выплат</p>
              </div>

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
            </>
          )}

          {/* Таб: Рабочий график */}
          {activeTab === 'workSchedule' && (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Рабочий график</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Выберите оптимальный режим работы</p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {/* Карточки шаблонов */}
                {scheduleTemplates.map((template, index) => (
                  <ScheduleTemplateCard
                    key={template.id}
                    template={template}
                    isSelected={selectedTemplate === template.id}
                    onSelect={handleTemplateSelect}
                    onCustomDayToggle={handleCustomDayToggle}
                    getIconColorClasses={getIconColorClasses}
                    getEfficiencyColor={getEfficiencyColor}
                    animationDelay={`${index * 0.08}s`}
                  />
                ))}

                {/* Карточка настроек */}
                <ScheduleSettingsCard
                  selectedSchedule={selectedSchedule}
                  selectedTemplate={selectedTemplate}
                  dailyPlan={dailyPlan}
                  monthlyPlan={monthlyPlan}
                  weekStart={weekStart}
                  animateStats={animateStats}
                  onDailyPlanChange={setDailyPlan}
                  onWeekStartChange={setWeekStart}
                  getIconColorClasses={getIconColorClasses}
                />
              </div>
            </>
          )}

          {/* Таб: Бэкапы */}
          {activeTab === 'backups' && (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Управление резервными копиями</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Создавайте, восстанавливайте и управляйте резервными копиями данных</p>
              </div>

              <div className="mb-4">
                <Button
                  onClick={handleCreateBackup}
                  disabled={isCreating}
                  variant="primary"
                  icon={Archive}
                  className="w-full"
                  iconId="backup-create"
                >
                  {isCreating ? 'Создание...' : 'Создать резервную копию'}
                </Button>
              </div>

              <div className="space-y-2">
                {loadingBackups ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-gray-500 dark:text-gray-400">Загрузка...</div>
                  </div>
                ) : backups.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Archive className="w-12 h-12 text-gray-400 dark:text-gray-600 mb-2" />
                    <p className="text-gray-500 dark:text-gray-400">Резервные копии отсутствуют</p>
                    <p className="text-sm text-gray-400 dark:text-gray-300 mt-1">
                      Создайте первую резервную копию, чтобы сохранить ваши данные
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {backups.map(backup => (
                      <div
                        key={backup.timestamp}
                        className="glass-effect rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {formatBackupDate(backup.timestamp)}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                ({formatBackupRelativeTime(backup.timestamp)})
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                              <span>Записей: {backup.entriesCount}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 ml-4">
                            <Button
                              onClick={() => handleRestoreBackup(backup.timestamp)}
                              disabled={isRestoring}
                              variant="secondary"
                              icon={Upload}
                              size="sm"
                              title="Восстановить"
                              iconId="backup-restore"
                            >
                              Восстановить
                            </Button>
                            <Button
                              onClick={() => handleDeleteBackup(backup.timestamp)}
                              variant="danger"
                              icon={Trash2}
                              iconId="backup-delete"
                              size="sm"
                              title="Удалить"
                            >
                              Удалить
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Резервные копии автоматически создаются при изменениях данных. Хранится максимум 10 последних копий.
                </p>
              </div>
            </>
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
                            className="w-8 h-7 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
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
      <ConfirmModal {...deleteBackupConfirm.confirmConfig} />
      <ConfirmModal {...restoreBackupConfirm.confirmConfig} />
      <ConfirmModal {...categoryDeleteConfirm.confirmConfig} />
    </BaseModal>
    </>
  )
}
