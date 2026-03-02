/**
 * 🎓 OnboardingTour Component v3
 *
 * Пошаговый тур для новых пользователей.
 * Подсвечивает элементы интерфейса и показывает объяснения.
 *
 * v3 Improvements:
 * - Множественные таргеты (выделение нескольких элементов одновременно)
 * - Элементы НЕ затемняются (используется SVG mask вместо box-shadow)
 * - Анимация закрытия
 * - Улучшенное позиционирование tooltip
 */

import { useState, useCallback, useEffect, useRef, createContext, useContext } from 'react'
import { Icon } from '@iconify/react'
import { motion, AnimatePresence } from 'framer-motion'

// ===== Types =====

export interface TourStep {
  /** Уникальный ID шага */
  id: string
  /** CSS селектор(ы) целевого элемента. Может быть строкой или массивом для множественных таргетов */
  target: string | string[]
  /** Заголовок шага */
  title: string
  /** Описание шага */
  description: string
  /** Позиция tooltip относительно элемента */
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto' | 'center'
  /** Иконка (Iconify) */
  icon?: string
  /** Действие при клике "Далее" */
  onNext?: () => void
  /** Требуется ли действие пользователя перед продолжением */
  requiresAction?: boolean
  /** Текст кнопки "Далее" */
  nextButtonText?: string
}

interface OnboardingTourProps {
  /** Массив шагов тура */
  steps?: TourStep[]
  /** Callback при завершении тура */
  onComplete?: () => void
  /** Callback при пропуске тура */
  onSkip?: () => void
  /** Показывать ли при первом входе */
  showOnFirstVisit?: boolean
  /** Ключ для localStorage (для отслеживания завершения) */
  storageKey?: string
}

interface TargetRect {
  top: number
  left: number
  width: number
  height: number
}

interface TourState {
  isActive: boolean
  currentStep: number
  targetRects: TargetRect[]
  direction: 'forward' | 'backward'
  isClosing: boolean
}

// ===== Default Tour Steps =====

export const DEFAULT_TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    target: '[data-tour="header"]',
    title: 'Добро пожаловать! 👋',
    description: 'Это ваш трекер рабочего времени. Давайте покажем основные функции.',
    position: 'bottom',
    icon: 'solar:hand-shake-linear',
    nextButtonText: 'Начнём!',
  },
  {
    id: 'timer',
    target: ['[data-tour="timer-button"]', '[data-tour="timer-bottom"]'],
    title: 'Таймер ⏱️',
    description: 'Нажмите на любую из этих кнопок, чтобы начать или остановить отсчёт времени работы.',
    position: 'auto',
    icon: 'solar:play-circle-linear',
  },
  {
    id: 'quick-add',
    target: '[data-tour="quick-add"]',
    title: 'Быстрое добавление ➕',
    description: 'Добавляйте записи вручную, если забыли включить таймер.',
    position: 'auto',
    icon: 'solar:add-circle-linear',
  },
  {
    id: 'view-modes',
    target: ['[data-tour="view-mode-focus"]', '[data-tour="view-mode-analytics"]'],
    title: 'Режимы: Focus / Analytics 🎯',
    description: 'Переключайтесь между Focus (только записи) и Analytics (полная аналитика) режимами кнопками в шапке или Ctrl+Shift+F.',
    position: 'bottom',
    icon: 'solar:focus-linear',
  },
  {
    id: 'analytics',
    target: ['[data-tour="analytics-basic"]', '[data-tour="analytics-descriptive"]', '[data-tour="analytics-predictive"]', '[data-tour="analytics-comparative"]'],
    title: 'Аналитика 📊',
    description: 'Раскройте эти секции, чтобы увидеть статистику, графики и AI-инсайты о вашей продуктивности.',
    position: 'center',
    icon: 'solar:chart-2-linear',
  },
  {
    id: 'ai-notifications',
    target: '[data-tour="ai-notifications"]',
    title: 'AI-уведомления ✨',
    description: 'Умные подсказки от AI, которые помогут улучшить вашу продуктивность.',
    position: 'bottom',
    icon: 'solar:magic-stick-3-linear',
  },
  {
    id: 'more-menu',
    target: '[data-tour="settings"]',
    title: 'Настройки и Справка ⚙️',
    description: 'В этом меню находятся настройки приложения, справочный центр (также доступен по F1) и информация о приложении.',
    position: 'auto',
    icon: 'solar:settings-linear',
    nextButtonText: 'Завершить!',
  },
]

/**
 * Получает шаги тура — всегда возвращает все шаги
 * Переключение режима для показа аналитики делается в хуке
 */
export function getTourSteps(_viewMode: 'focus' | 'analytics'): TourStep[] {
  // Всегда возвращаем все шаги — переключение режима делается динамически
  return DEFAULT_TOUR_STEPS
}

// ===== Context for external control =====

interface OnboardingTourContextValue {
  startTour: () => void
  resetTour: () => void
  isActive: boolean
  isTourCompleted: () => boolean
}

const OnboardingTourContext = createContext<OnboardingTourContextValue | null>(null)

export const useOnboardingTourContext = () => {
  const context = useContext(OnboardingTourContext)
  if (!context) {
    throw new Error('useOnboardingTourContext must be used within OnboardingTourProvider')
  }
  return context
}

// ===== Hook =====

// Импортируем viewMode из store
import { useViewMode, useSetViewMode } from '../../store/useSettingsStore'

export function useOnboardingTour({
  steps: propsSteps,
  onComplete,
  onSkip,
  showOnFirstVisit = true,
  storageKey = 'onboarding-tour-completed',
}: Partial<OnboardingTourProps> = {}) {
  // Получаем viewMode для шагов и setViewMode для переключения
  const viewMode = useViewMode()
  const setViewMode = useSetViewMode()
  
  // Сохраняем исходный режим чтобы вернуть его после шага analytics
  const originalViewModeRef = useRef<'focus' | 'analytics' | null>(null)
  
  // Используем динамические шаги на основе viewMode
  const steps = propsSteps ?? getTourSteps(viewMode)
  
  const [state, setState] = useState<TourState>({
    isActive: false,
    currentStep: 0,
    targetRects: [],
    direction: 'forward',
    isClosing: false,
  })
  
  // Автопереключение в Analytics для шага аналитики
  useEffect(() => {
    if (!state.isActive) return
    
    const currentStepData = steps[state.currentStep]
    
    if (currentStepData?.id === 'analytics') {
      // При входе на шаг аналитики — сохраняем текущий режим и переключаем в Analytics
      if (viewMode === 'focus') {
        originalViewModeRef.current = 'focus'
        setViewMode('analytics')
      }
    } else {
      // При выходе с шага аналитики — возвращаем исходный режим
      if (originalViewModeRef.current === 'focus') {
        setViewMode('focus')
        originalViewModeRef.current = null
      }
    }
  }, [state.isActive, state.currentStep, steps, viewMode, setViewMode])

  // Проверяем, был ли тур уже пройден
  const isTourCompleted = useCallback(() => {
    try {
      return localStorage.getItem(storageKey) === 'true'
    } catch {
      return false
    }
  }, [storageKey])

  // Отмечаем тур как пройденный
  const markTourCompleted = useCallback(() => {
    try {
      localStorage.setItem(storageKey, 'true')
    } catch {
      // Ignore localStorage errors
    }
  }, [storageKey])

  // Получаем позиции всех целевых элементов
  const updateTargetRects = useCallback(() => {
    if (!state.isActive || state.currentStep >= steps.length) return

    const step = steps[state.currentStep]
    const targets = Array.isArray(step.target) ? step.target : [step.target]
    
    const rects: TargetRect[] = []
    
    for (const selector of targets) {
      const element = document.querySelector(selector)
      if (element) {
        const rect = element.getBoundingClientRect()
        rects.push({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        })
      }
    }

    setState(prev => ({ ...prev, targetRects: rects }))

    // Скроллим к первому элементу если он не виден
    if (rects.length > 0) {
      const firstRect = rects[0]
      const isInViewport = (
        firstRect.top >= 0 &&
        firstRect.left >= 0 &&
        firstRect.top + firstRect.height <= window.innerHeight &&
        firstRect.left + firstRect.width <= window.innerWidth
      )
      
      if (!isInViewport) {
        const element = document.querySelector(targets[0])
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          // Обновим rect после скролла
          setTimeout(() => updateTargetRects(), 500)
        }
      }
    }
  }, [state.isActive, state.currentStep, steps])

  // Следим за изменением размеров
  useEffect(() => {
    if (state.isActive && !state.isClosing) {
      updateTargetRects()

      // Следим за изменением размеров окна
      window.addEventListener('resize', updateTargetRects)
      window.addEventListener('scroll', updateTargetRects)

      return () => {
        window.removeEventListener('resize', updateTargetRects)
        window.removeEventListener('scroll', updateTargetRects)
      }
    }
  }, [state.isActive, state.currentStep, state.isClosing, updateTargetRects])

  // Показываем тур при первом входе
  useEffect(() => {
    if (showOnFirstVisit && !isTourCompleted()) {
      // Небольшая задержка для загрузки UI
      const timer = setTimeout(() => {
        startTour()
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [showOnFirstVisit, isTourCompleted])


  // Начать тур
  const startTour = useCallback(() => {
    setState({
      isActive: true,
      currentStep: 0,
      targetRects: [],
      direction: 'forward',
      isClosing: false,
    })
  }, [])

  // Слушаем событие запуска тура из других компонентов
  useEffect(() => {
    const handleStartTour = () => {
      startTour()
    }
    window.addEventListener('start-onboarding-tour', handleStartTour)
    return () => window.removeEventListener('start-onboarding-tour', handleStartTour)
  }, [startTour])

  // Закрыть тур с анимацией
  const closeTour = useCallback((markComplete = true) => {
    setState(prev => ({ ...prev, isClosing: true }))
    
    setTimeout(() => {
      setState({ isActive: false, currentStep: 0, targetRects: [], direction: 'forward', isClosing: false })
      if (markComplete) {
        markTourCompleted()
      }
    }, 300)
  }, [markTourCompleted])

  // Следующий шаг
  const nextStep = useCallback(() => {
    const currentStepData = steps[state.currentStep]
    if (currentStepData?.onNext) {
      currentStepData.onNext()
    }

    if (state.currentStep < steps.length - 1) {
      setState(prev => ({
        ...prev,
        currentStep: prev.currentStep + 1,
        targetRects: [],
        direction: 'forward',
      }))
    } else {
      // Тур завершён
      closeTour(true)
      onComplete?.()
    }
  }, [state.currentStep, steps, closeTour, onComplete])

  // Предыдущий шаг
  const prevStep = useCallback(() => {
    if (state.currentStep > 0) {
      setState(prev => ({
        ...prev,
        currentStep: prev.currentStep - 1,
        targetRects: [],
        direction: 'backward',
      }))
    }
  }, [state.currentStep])

  // Пропустить тур
  const skipTour = useCallback(() => {
    closeTour(true)
    onSkip?.()
  }, [closeTour, onSkip])

  // Сбросить состояние тура (для повторного прохождения)
  const resetTour = useCallback(() => {
    try {
      localStorage.removeItem(storageKey)
    } catch {
      // Ignore localStorage errors
    }
  }, [storageKey])

  // Текущий шаг
  const currentStepData = steps[state.currentStep]

  return {
    // Состояние
    isActive: state.isActive,
    currentStep: state.currentStep,
    totalSteps: steps.length,
    currentStepData,
    targetRects: state.targetRects,
    direction: state.direction,
    isClosing: state.isClosing,

    // Действия
    startTour,
    nextStep,
    prevStep,
    skipTour,
    resetTour,

    // Проверки
    isTourCompleted,
    isLastStep: state.currentStep === steps.length - 1,
    isFirstStep: state.currentStep === 0,
  }
}

// ===== SVG Mask for Cutouts =====

interface SpotlightMaskProps {
  rects: TargetRect[]
  padding?: number
}

function SpotlightMask({ rects, padding = 8 }: SpotlightMaskProps) {
  const maskId = 'tour-spotlight-mask'
  
  return (
    <svg 
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 9998 }}
    >
      <defs>
        <mask id={maskId}>
          {/* Белый фон = видимая область затемнения */}
          <rect x="0" y="0" width="100%" height="100%" fill="white" />
          {/* Чёрные прямоугольники = "вырезанные" области (видимые элементы) */}
          {rects.map((rect, i) => (
            <rect
              key={i}
              x={rect.left - padding}
              y={rect.top - padding}
              width={rect.width + padding * 2}
              height={rect.height + padding * 2}
              rx={12}
              fill="black"
            />
          ))}
        </mask>
      </defs>
      {/* Затемнение с маской */}
      <rect 
        x="0" 
        y="0" 
        width="100%" 
        height="100%" 
        fill="rgba(0, 0, 0, 0.75)" 
        mask={`url(#${maskId})`}
      />
    </svg>
  )
}

// ===== Highlight Borders =====

interface HighlightBordersProps {
  rects: TargetRect[]
  padding?: number
  currentStep: number
}

function HighlightBorders({ rects, padding = 8, currentStep }: HighlightBordersProps) {
  // Для multiple targets рядом — объединяем в один bounding box
  // Для элементов далеко друг от друга — рисуем отдельно
  const areRectsAdjacent = (r1: TargetRect, r2: TargetRect, threshold = 50) => {
    const gap = Math.abs(r1.left + r1.width - r2.left)
    const verticalOverlap = !(r1.top + r1.height < r2.top || r2.top + r2.height < r1.top)
    return gap < threshold && verticalOverlap
  }
  
  // Если 2 элемента рядом — объединяем
  const shouldMerge = rects.length === 2 && areRectsAdjacent(rects[0], rects[1])
  
  const mergedRect = shouldMerge ? {
    top: Math.min(rects[0].top, rects[1].top),
    left: Math.min(rects[0].left, rects[1].left),
    width: Math.max(rects[0].left + rects[0].width, rects[1].left + rects[1].width) - Math.min(rects[0].left, rects[1].left),
    height: Math.max(rects[0].height, rects[1].height),
  } : null
  
  const displayRects = mergedRect ? [mergedRect] : rects
  
  return (
    <>
      {displayRects.map((rect, i) => (
        <motion.div
          key={`highlight-${currentStep}-${i}`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3, delay: i * 0.05 }}
          className="absolute pointer-events-none rounded-xl"
          style={{
            top: rect.top - padding,
            left: rect.left - padding,
            width: rect.width + padding * 2,
            height: rect.height + padding * 2,
            boxShadow: `
              0 0 0 3px rgba(59, 130, 246, 0.9),
              0 0 0 6px rgba(59, 130, 246, 0.4),
              0 0 20px rgba(59, 130, 246, 0.5)
            `,
          }}
        />
      ))}
      {/* Пульсирующее кольцо на первом элементе */}
      {displayRects.length > 0 && (
        <motion.div
          key={`pulse-${currentStep}`}
          className="absolute rounded-xl pointer-events-none"
          style={{
            top: displayRects[0].top - padding - 4,
            left: displayRects[0].left - padding - 4,
            width: displayRects[0].width + padding * 2 + 8,
            height: displayRects[0].height + padding * 2 + 8,
            border: '2px solid rgba(59, 130, 246, 0.5)',
          }}
          animate={{
            scale: [1, 1.03, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}
    </>
  )
}

// ===== Overlay Component =====

interface TourOverlayProps {
  isActive: boolean
  currentStep: number
  totalSteps: number
  currentStepData?: TourStep
  targetRects: TargetRect[]
  direction: 'forward' | 'backward'
  isClosing: boolean
  onNext: () => void
  onPrev: () => void
  onSkip: () => void
  isLastStep: boolean
  isFirstStep: boolean
}

export function TourOverlay({
  isActive,
  currentStep,
  totalSteps,
  currentStepData,
  targetRects,
  direction,
  isClosing,
  onNext,
  onPrev,
  onSkip,
  isLastStep,
  isFirstStep,
}: TourOverlayProps) {
  if (!isActive || !currentStepData) return null

  const padding = 12

  // Вычисляем позицию tooltip
  const getTooltipPosition = () => {
    const tooltipWidth = 340
    const tooltipHeight = 240
    const offset = 20
    const screenPadding = 16

    // Если позиция center или нет таргетов — центрируем
    if (currentStepData.position === 'center' || targetRects.length === 0) {
      return { 
        top: window.innerHeight / 2 - tooltipHeight / 2, 
        left: window.innerWidth / 2 - tooltipWidth / 2 
      }
    }

    // Берём первый rect для позиционирования
    const firstRect = targetRects[0]
    const highlightRect = {
      top: firstRect.top - padding,
      left: firstRect.left - padding,
      width: firstRect.width + padding * 2,
      height: firstRect.height + padding * 2,
    }

    let position = currentStepData.position || 'auto'

    // Auto-detect best position
    if (position === 'auto') {
      const spaceTop = highlightRect.top
      const spaceBottom = window.innerHeight - (highlightRect.top + highlightRect.height)
      const spaceLeft = highlightRect.left
      const spaceRight = window.innerWidth - (highlightRect.left + highlightRect.width)

      if (spaceBottom >= tooltipHeight + offset) {
        position = 'bottom'
      } else if (spaceTop >= tooltipHeight + offset) {
        position = 'top'
      } else if (spaceRight >= tooltipWidth + offset) {
        position = 'right'
      } else if (spaceLeft >= tooltipWidth + offset) {
        position = 'left'
      } else {
        position = 'bottom' // fallback
      }
    }

    let top: number
    let left: number

    switch (position) {
      case 'top':
        top = highlightRect.top - tooltipHeight - offset
        left = highlightRect.left + highlightRect.width / 2 - tooltipWidth / 2
        break
      case 'bottom':
        top = highlightRect.top + highlightRect.height + offset
        left = highlightRect.left + highlightRect.width / 2 - tooltipWidth / 2
        break
      case 'left':
        top = highlightRect.top + highlightRect.height / 2 - tooltipHeight / 2
        left = highlightRect.left - tooltipWidth - offset
        break
      case 'right':
        top = highlightRect.top + highlightRect.height / 2 - tooltipHeight / 2
        left = highlightRect.left + highlightRect.width + offset
        break
      default:
        top = highlightRect.top + highlightRect.height + offset
        left = highlightRect.left
    }

    // Clamp to screen bounds
    left = Math.max(screenPadding, Math.min(left, window.innerWidth - tooltipWidth - screenPadding))
    top = Math.max(screenPadding, Math.min(top, window.innerHeight - tooltipHeight - screenPadding))

    return { top, left }
  }

  const tooltipPosition = getTooltipPosition()

  // Анимации для переключения шагов
  const slideVariants = {
    enter: (dir: 'forward' | 'backward') => ({
      x: dir === 'forward' ? 50 : -50,
      opacity: 0,
      scale: 0.95,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (dir: 'forward' | 'backward') => ({
      x: dir === 'forward' ? -50 : 50,
      opacity: 0,
      scale: 0.95,
    }),
  }

  return (
    <AnimatePresence>
      {!isClosing && (
        <motion.div
          key="tour-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9999]"
          style={{ pointerEvents: 'auto' }}
        >
          {/* SVG Mask для затемнения с вырезами */}
          <SpotlightMask rects={targetRects} padding={padding} />

          {/* Кликабельная область для закрытия */}
          <div 
            className="absolute inset-0 z-[9997]" 
            onClick={onSkip}
            style={{ pointerEvents: 'auto' }}
          />

          {/* Подсветка элементов */}
          <HighlightBorders rects={targetRects} padding={padding} currentStep={currentStep} />

          {/* Tooltip с анимацией slide */}
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={`tooltip-${currentStep}`}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="absolute w-[340px] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 border border-slate-200 dark:border-slate-700 z-[10000]"
              style={{
                top: tooltipPosition.top,
                left: tooltipPosition.left,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Иконка и заголовок */}
              <motion.div 
                className="flex items-center gap-3 mb-4"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                {currentStepData.icon && (
                  <motion.div 
                    className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg"
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <Icon icon={currentStepData.icon} className="w-6 h-6 text-white" />
                  </motion.div>
                )}
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {currentStepData.title}
                </h3>
              </motion.div>

              {/* Описание */}
              <motion.p 
                className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-5"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15 }}
              >
                {currentStepData.description}
              </motion.p>

              {/* Прогресс — более красивый */}
              <motion.div 
                className="flex items-center gap-2 mb-5"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {Array.from({ length: totalSteps }).map((_, i) => (
                  <motion.div
                    key={i}
                    className={`
                      h-2 rounded-full flex-1 transition-all duration-300
                      ${i < currentStep 
                        ? 'bg-blue-500' 
                        : i === currentStep 
                          ? 'bg-gradient-to-r from-blue-500 to-blue-400' 
                          : 'bg-slate-200 dark:bg-slate-700'
                      }
                    `}
                    animate={i === currentStep ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 0.5 }}
                  />
                ))}
              </motion.div>

              {/* Кнопки */}
              <motion.div 
                className="flex items-center justify-between"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.25 }}
              >
                <button
                  onClick={onSkip}
                  className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                >
                  Пропустить
                </button>

                <div className="flex items-center gap-2">
                  {!isFirstStep && (
                    <motion.button
                      onClick={onPrev}
                      className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Назад
                    </motion.button>
                  )}
                  <motion.button
                    onClick={onNext}
                    className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg shadow-lg shadow-blue-500/25 transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {currentStepData.nextButtonText || (isLastStep ? 'Завершить' : 'Далее')}
                  </motion.button>
                </div>
              </motion.div>

              {/* Номер шага */}
              <div className="absolute top-3 right-3 text-xs text-slate-400 dark:text-slate-500 font-medium">
                {currentStep + 1} / {totalSteps}
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ===== Отдельный провайдер для доступа к функциям тура из любого места =====

let globalStartTour: (() => void) | null = null
let globalResetTour: (() => void) | null = null

export function OnboardingTourProvider({ children, ...props }: OnboardingTourProps & { children: React.ReactNode }) {
  const tour = useOnboardingTour(props)

  // Экспортируем функции глобально
  useEffect(() => {
    globalStartTour = tour.startTour
    globalResetTour = tour.resetTour
    return () => {
      globalStartTour = null
      globalResetTour = null
    }
  }, [tour.startTour, tour.resetTour])

  return (
    <OnboardingTourContext.Provider value={{
      startTour: tour.startTour,
      resetTour: tour.resetTour,
      isActive: tour.isActive,
      isTourCompleted: tour.isTourCompleted,
    }}>
      {children}
      <TourOverlay
        isActive={tour.isActive}
        currentStep={tour.currentStep}
        totalSteps={tour.totalSteps}
        currentStepData={tour.currentStepData}
        targetRects={tour.targetRects}
        direction={tour.direction}
        isClosing={tour.isClosing}
        onNext={tour.nextStep}
        onPrev={tour.prevStep}
        onSkip={tour.skipTour}
        isLastStep={tour.isLastStep}
        isFirstStep={tour.isFirstStep}
      />
    </OnboardingTourContext.Provider>
  )
}

// Глобальные функции для запуска тура из любого места
export const startOnboardingTour = () => globalStartTour?.()
export const resetOnboardingTour = () => globalResetTour?.()

// Обычный компонент (для обратной совместимости)
export function OnboardingTour(props: Partial<OnboardingTourProps>) {
  const tour = useOnboardingTour(props)

  return (
    <TourOverlay
      isActive={tour.isActive}
      currentStep={tour.currentStep}
      totalSteps={tour.totalSteps}
      currentStepData={tour.currentStepData}
      targetRects={tour.targetRects}
      direction={tour.direction}
      isClosing={tour.isClosing}
      onNext={tour.nextStep}
      onPrev={tour.prevStep}
      onSkip={tour.skipTour}
      isLastStep={tour.isLastStep}
      isFirstStep={tour.isFirstStep}
    />
  )
}

export default OnboardingTour
