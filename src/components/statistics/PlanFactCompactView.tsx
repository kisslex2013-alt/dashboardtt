import { useMemo, useEffect, useRef, useTransition, useState } from 'react'
import {
  Calendar,
  DollarSign,
  Settings,
  CheckCircle,
  Clock,
  Zap,
  Flame,
  Sliders,
  TrendingUp,
} from '../../utils/icons'
import { useEntries } from '../../store/useEntriesStore'
import {
  useDailyGoal,
  useWorkScheduleTemplate,
  useWorkScheduleStartDay,
  useCustomWorkDates,
  usePaymentDates,
} from '../../store/useSettingsStore'
import { useOpenModal } from '../../store/useUIStore'
import { InfoTooltip } from '../ui/InfoTooltip'
import { SimpleTooltip } from '../ui/SimpleTooltip'
import { AnimatedCounter } from '../ui/AnimatedCounter'
import { PlanFactIllustration, PaymentIllustration, TotalIllustration } from '../ui/illustrations'
import { TopProjectsWidget } from './TopProjectsWidget'
import {
  calculateProductivityScore,
  getScoreColor,
  getFactorProgressColor,
  getFactorTextColor,
} from '../../utils/productivityScore'
import { calculateWorkingDaysInMonth } from '../../utils/calculations'
import { format } from 'date-fns'
import {
  calculatePaymentPeriod,
  getFilteredEntriesForPayment,
  calculateWorkingDaysInPaymentPeriod,
  formatPaymentDate,
} from '../../utils/paymentCalculations'
import { useFirstVisit } from '../../hooks/useFirstVisit'
import { useIncognitoMode } from '../../hooks/useIncognitoMode'

/**
 * Расширенный виджет план/факт с 3 карточками
 *
 * Карточка 1 (синяя): План/факт - День и Месяц
 * Карточка 2 (зелёная): Выплаты - 1/2 месяца и 2/2 месяца
 * Карточка 3 (оранжевая): Общие итоги - Год и За все время
 *
 * @param {boolean} shouldAnimate - Запускать ли анимацию при раскрытии аккордеона
 * @param {boolean} shouldShow - Показывать ли содержимое (для анимации закрытия)
 */
export function PlanFactCompactView({ shouldAnimate = true, shouldShow = true }) {
  // ✅ ОПТИМИЗАЦИЯ: Используем атомарные селекторы для минимизации ре-рендеров
  const entries = useEntries()
  const dailyGoal = useDailyGoal()
  const workScheduleTemplate = useWorkScheduleTemplate()
  const workScheduleStartDay = useWorkScheduleStartDay()
  const customWorkDates = useCustomWorkDates()
  const paymentDates = usePaymentDates()
  const openModal = useOpenModal()

  // Проверяем первый визит и режим инкогнито для подсветки кнопок
  const isFirstVisit = useFirstVisit()
  const isIncognito = useIncognitoMode()

  // ✅ ИСПРАВЛЕНО: Отдельные флаги для каждой кнопки
  const [workScheduleButtonHighlighted, setWorkScheduleButtonHighlighted] = useState(() => {
    if (typeof window === 'undefined') return false
    const highlightKey = 'work_schedule_button_highlight_shown'
    return !localStorage.getItem(highlightKey)
  })

  const [paymentsButtonHighlighted, setPaymentsButtonHighlighted] = useState(() => {
    if (typeof window === 'undefined') return false
    const highlightKey = 'payments_button_highlight_shown'
    return !localStorage.getItem(highlightKey)
  })

  // Останавливаем подсветку если не первый визит и не инкогнито
  useEffect(() => {
    if (!isFirstVisit && !isIncognito) {
      setWorkScheduleButtonHighlighted(false)
      setPaymentsButtonHighlighted(false)
    }
  }, [isFirstVisit, isIncognito])

  const shouldHighlightWorkSchedule = (isFirstVisit || isIncognito) && workScheduleButtonHighlighted
  const shouldHighlightPayments = (isFirstVisit || isIncognito) && paymentsButtonHighlighted

  const handleWorkScheduleClick = () => {
    setWorkScheduleButtonHighlighted(false)
    localStorage.setItem('work_schedule_button_highlight_shown', 'true')
    openModal('soundSettings', { activeTab: 'workSchedule' })
  }

  const handlePaymentsClick = () => {
    setPaymentsButtonHighlighted(false)
    localStorage.setItem('payments_button_highlight_shown', 'true')
    openModal('soundSettings', { activeTab: 'finance' })
  }

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()
  const currentDay = now.getDate()

  // Данные для Productivity Score
  const scoreData = useMemo(() => {
    if (entries.length === 0) {
      return {
        score: 0,
        factors: {
          goalCompletion: { value: 0, max: 40, percentage: 0 },
          consistency: { value: 0, max: 25, percentage: 0 },
          focusTime: { value: 0, max: 20, percentage: 0 },
          breakBalance: { value: 0, max: 15, percentage: 0 },
        },
      }
    }
    return calculateProductivityScore(entries, dailyGoal)
  }, [entries, dailyGoal])

  const { score, factors } = scoreData
  const scoreColor = getScoreColor(score)

  // Сокращенные названия факторов
  const factorShortLabels = {
    goalCompletion: 'Цели',
    consistency: 'Регулярность',
    focusTime: 'Фокус',
    breakBalance: 'Перерывы',
  }

  const factorDescriptions = {
    goalCompletion:
      'Выполнение дневных целей по заработку. Оценивается средний процент выполнения цели за все дни с записями. Максимум 40 баллов.',
    consistency:
      'Регулярность работы. Оценивается процент дней с записями из возможных (за последние 30 дней). Максимум 25 баллов.',
    focusTime:
      'Время фокуса. Оценивается доля самой длинной непрерывной сессии от общего времени работы за день. Максимум 20 баллов.',
    breakBalance:
      'Баланс перерывов. Оценивается оптимальность перерывов между сессиями (5-30 минут - идеально). Максимум 15 баллов.',
  }

  // Функция для получения названия и иконки текущего рабочего графика
  const getWorkScheduleInfo = () => {
    // Используем customWorkDates только если выбран кастомный график
    if (
      workScheduleTemplate === 'custom' &&
      customWorkDates &&
      Object.keys(customWorkDates).length > 0
    ) {
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()

      // Считаем рабочие дни из customWorkDates
      let workDaysCount = 0
      for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        if (customWorkDates[dateKey] !== false) {
          workDaysCount++
        }
      }

      return {
        name: `Кастомный ${workDaysCount}/${daysInMonth}`,
        icon: Sliders,
        iconColor: 'text-green-600 dark:text-green-400',
      }
    }

    const templateInfo = {
      '5/2': {
        name: 'Стандартный 5/2',
        icon: CheckCircle,
        iconColor: 'text-blue-600 dark:text-blue-400',
      },
      '2/2': {
        name: 'Сменный 2/2',
        icon: Clock,
        iconColor: 'text-purple-600 dark:text-purple-400',
      },
      '3/3': {
        name: 'Сменный 3/3',
        icon: Zap,
        iconColor: 'text-orange-600 dark:text-orange-400',
      },
      '5/5': {
        name: 'Интенсивный 5/5',
        icon: Flame,
        iconColor: 'text-red-600 dark:text-red-400',
      },
    }

    return templateInfo[workScheduleTemplate] || templateInfo['5/2']
  }

  // Рассчитываем факт для каждого периода - мемоизируем для предотвращения ненужных пересчетов
  const planFactData = useMemo(() => {
    // Фильтруем записи по периодам - внутри useMemo для правильных зависимостей
    const getFilteredEntries = filter => {
      return entries.filter(entry => {
        // Проверяем, что entry.date существует
        if (!entry.date) return false

        // Парсим дату - поддерживаем разные форматы (YYYY-MM-DD, ISO string, Date object)
        let entryDate
        if ((entry.date as any) instanceof Date) {
          entryDate = entry.date
        } else if (typeof entry.date === 'string') {
          // Если дата в формате YYYY-MM-DD, создаем Date объект
          entryDate = new Date(entry.date)
          // Проверяем на валидность даты
          if (isNaN(entryDate.getTime())) return false
        } else {
          return false
        }

        const entryYear = entryDate.getFullYear()
        const entryMonth = entryDate.getMonth()
        const entryDay = entryDate.getDate()

        switch (filter) {
          case 'today':
            return (
              entryYear === currentYear && entryMonth === currentMonth && entryDay === currentDay
            )

          case 'firstHalfMonth':
            return entryYear === currentYear && entryMonth === currentMonth && entryDay <= 15

          case 'secondHalfMonth':
            return entryYear === currentYear && entryMonth === currentMonth && entryDay > 15

          case 'month':
            return entryYear === currentYear && entryMonth === currentMonth

          case 'year':
            return entryYear === currentYear

          case 'allTime':
            return true

          default:
            return false
        }
      })
    }

    const calculateFact = filter => {
      const filtered = getFilteredEntries(filter)
      const sum = filtered.reduce((sum, e) => {
        // Проверяем разные варианты поля earned
        const earned = e.earned || 0
        const numValue =
          typeof earned === 'string'
            ? parseFloat(earned.replace(/[^\d.,]/g, '').replace(',', '.')) || 0
            : typeof earned === 'number'
              ? earned
              : 0
        return sum + numValue
      }, 0)
      return sum
    }

    const result = {
      day: calculateFact('today'),
      firstHalfMonth: calculateFact('firstHalfMonth'),
      secondHalfMonth: calculateFact('secondHalfMonth'),
      month: calculateFact('month'),
      year: calculateFact('year'),
      allTime: calculateFact('allTime'),
    }

    return result
  }, [entries, currentYear, currentMonth, currentDay])

  // Рассчитываем общее количество часов и среднюю ставку
  const totalHoursAndRate = useMemo(() => {
    const totalHours = entries.reduce((sum, e) => {
      let duration = parseFloat(String(e.duration)) || 0
      if (duration === 0 && e.start && e.end) {
        try {
          const [startH, startM] = e.start.split(':').map(Number)
          const [endH, endM] = e.end.split(':').map(Number)
          const startMinutes = startH * 60 + startM
          let endMinutes = endH * 60 + endM
          if (endMinutes < startMinutes) endMinutes += 24 * 60
          duration = (endMinutes - startMinutes) / 60
        } catch {
          duration = 0
        }
      }
      return sum + duration
    }, 0)

    const totalEarned = entries.reduce((sum, e) => {
      const earned = e.earned || 0
      const numValue =
        typeof earned === 'string'
          ? parseFloat(earned.replace(/[^\d.,]/g, '').replace(',', '.')) || 0
          : typeof earned === 'number'
            ? earned
            : 0
      return sum + numValue
    }, 0)

    const averageRate = totalHours > 0 ? totalEarned / totalHours : 0

    return { totalHours, averageRate }
  }, [entries])

  // Рассчитываем планы на основе рабочих дней
  const settings = {
    workScheduleTemplate,
    workScheduleStartDay,
    customWorkDates,
  }

  // Рассчитываем рабочие дни в текущем месяце на основе настроек
  const workingDaysInMonth = calculateWorkingDaysInMonth(
    currentYear,
    currentMonth,
    1,
    null,
    settings
  )

  // Рассчитываем рабочие дни в первой и второй половине месяца
  const workingDaysFirstHalf = calculateWorkingDaysInMonth(
    currentYear,
    currentMonth,
    1,
    15,
    settings
  )
  const workingDaysSecondHalf = workingDaysInMonth - workingDaysFirstHalf

  const dailyPlanValue = typeof dailyGoal === 'number' && dailyGoal > 0 ? dailyGoal : 6000
  const monthlyPlan = Math.round(dailyPlanValue * workingDaysInMonth)
  const firstHalfPlan = Math.round(dailyPlanValue * workingDaysFirstHalf)
  const secondHalfPlan = Math.round(dailyPlanValue * workingDaysSecondHalf)

  // Рассчитываем данные для каждой выплаты (мемоизируем для производительности)
  const paymentData = useMemo(() => {
    if (!paymentDates || paymentDates.length === 0) return []

    const settings = {
      workScheduleTemplate,
      workScheduleStartDay,
      customWorkDates,
    }

    return paymentDates
      .filter(p => p.enabled) // Только включенные выплаты
      .sort((a, b) => a.order - b.order) // Сортируем по порядку
      .map(payment => {
        // Фильтруем записи для периода выплаты
        const filteredEntries = getFilteredEntriesForPayment(
          entries,
          payment,
          currentYear,
          currentMonth
        )

        // Рассчитываем фактический доход
        const earned = filteredEntries.reduce((sum, e) => {
        const earned = e.earned || 0
          const numValue =
            typeof earned === 'string'
              ? parseFloat(earned.replace(/[^\d.,]/g, '').replace(',', '.')) || 0
              : typeof earned === 'number'
                ? earned
                : 0
          return sum + numValue
        }, 0)

        // Рассчитываем план на основе рабочих дней в периоде
        const workingDays = calculateWorkingDaysInPaymentPeriod(
          payment,
          currentYear,
          currentMonth,
          settings
        )
        const plan = Math.round(dailyPlanValue * workingDays)

        // Рассчитываем период выплаты
        const period = calculatePaymentPeriod(payment, currentYear, currentMonth)

        return {
          ...payment,
          earned,
          plan,
        }
      })
  }, [
    paymentDates,
    entries,
    dailyPlanValue,
    currentYear,
    currentMonth,
    workScheduleTemplate,
    workScheduleStartDay,
    customWorkDates,
  ])

  // ✅ ИСПРАВЛЕНО: Используем напрямую planFactData для актуальных данных
  // Это гарантирует обновление данных в реальном времени и правильную работу анимации
  const { day, firstHalfMonth, secondHalfMonth, month, year, allTime } = planFactData

  // Генерируем случайные скорости для прогресс-баров (от 0.7 до 2.5 сек)
  // Важно: все скорости должны быть разными друг от друга
  const progressBarSpeeds = useMemo(() => {
    const minSpeed = 0.7
    const maxSpeed = 2.5
    const totalBars = 2 + paymentData.length // День + Месяц + Выплаты
    const speeds: number[] = []

    // Генерируем уникальные скорости
    while (speeds.length < totalBars) {
      const speed = parseFloat((Math.random() * (maxSpeed - minSpeed) + minSpeed).toFixed(2))
      // Проверяем, что скорость отличается от существующих минимум на 0.1
      const isUnique = speeds.every(existing => Math.abs(existing - speed) >= 0.1)
      if (isUnique) {
        speeds.push(speed)
      }
    }

    // Сортируем для случайного распределения
    speeds.sort(() => Math.random() - 0.5)

    return {
      day: speeds[0].toFixed(2),
      month: speeds[1].toFixed(2),
      payments: speeds.slice(2).map(s => s.toFixed(2)),
    }
  }, [shouldAnimate, paymentData.length]) // Перегенерируем при активации анимации

  // Форматируем текущий и следующий месяцы (для обратной совместимости, если нужно)
  const currentMonthStr = String(currentMonth + 1).padStart(2, '0')
  const nextMonthDate = new Date(currentYear, currentMonth + 1, 1)
  const nextMonthStr = String(nextMonthDate.getMonth() + 1).padStart(2, '0')

  // Helpers for current date display
  const today = new Date()
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
  const currentDayName = capitalize(today.toLocaleDateString('ru-RU', { weekday: 'long' }))
  const currentMonthName = capitalize(new Date(currentYear, currentMonth).toLocaleDateString('ru-RU', { month: 'long' }))

  return (
    <div className="glass-effect rounded-xl p-4 mb-4">
      {/* Заголовок */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">План/факт заработка</h3>
          <InfoTooltip text="Отслеживайте выполнение плана за день и месяц, планируйте выплаты и анализируйте общий доход за год и всё время работы. Настройте рабочий график для точного расчёта целей." />
        </div>

        {/* Productivity Score (Desktop) */}
        <div className="hidden md:flex items-center gap-2 flex-1 justify-end ml-4 group">
            <SimpleTooltip
              text="Общая оценка продуктивности от 0 до 100. Рассчитывается на основе выполнения целей (40%), регулярности работы (25%), времени фокуса (20%) и баланса перерывов (15%)."
              position="bottom"
            >
              {(() => {
                const getScoreHoverBorder = () => {
                  if (scoreColor.includes('green')) return 'hover:border-green-500 dark:hover:border-green-400'
                  if (scoreColor.includes('blue')) return 'hover:border-blue-500 dark:hover:border-blue-400'
                  if (scoreColor.includes('yellow')) return 'hover:border-yellow-500 dark:hover:border-yellow-400'
                  if (scoreColor.includes('red')) return 'hover:border-red-500 dark:hover:border-red-400'
                  return 'hover:border-gray-500 dark:hover:border-gray-400'
                }
                const getScoreHoverShadow = () => {
                  if (scoreColor.includes('green')) return 'hover:shadow-lg hover:shadow-green-500/20'
                  if (scoreColor.includes('blue')) return 'hover:shadow-lg hover:shadow-blue-500/20'
                  if (scoreColor.includes('yellow')) return 'hover:shadow-lg hover:shadow-yellow-500/20'
                  if (scoreColor.includes('red')) return 'hover:shadow-lg hover:shadow-red-500/20'
                  return 'hover:shadow-lg hover:shadow-gray-500/20'
                }
                return (
                  <div className={`flex items-center gap-1.5 cursor-help px-2 py-1 rounded-lg transition-all duration-300 hover:bg-white/10 dark:hover:bg-white/5 hover:scale-105 border border-transparent ${getScoreHoverBorder()} ${getScoreHoverShadow()}`}>
                    <TrendingUp className="w-4 h-4 text-blue-500 dark:text-blue-400 flex-shrink-0 transition-transform duration-300 group-hover:scale-110" />
                    <AnimatedCounter
                      value={score}
                      decimals={0}
                      className={`text-lg font-bold ${scoreColor}`}
                      resetAnimation={false}
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400">/100</span>
                  </div>
                )
              })()}
            </SimpleTooltip>

            {/* Разделитель */}
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 flex-shrink-0 mx-2"></div>

            {/* Факторы с названиями */}
            <div className="flex items-center gap-2 flex-1 justify-end max-w-2xl">
              {Object.keys(factors).map((factorKey) => {
                // @ts-ignore
                const factor = factors[factorKey]
                // @ts-ignore
                const shortLabel = factorShortLabels[factorKey]
                const {percentage} = factor
                const progressColor = getFactorProgressColor(percentage)
                const textColor = getFactorTextColor(percentage)

                const getFactorHoverBorder = () => {
                  if (progressColor.includes('green')) return 'hover:border-green-500 dark:hover:border-green-400'
                  if (progressColor.includes('yellow')) return 'hover:border-yellow-500 dark:hover:border-yellow-400'
                  if (progressColor.includes('red')) return 'hover:border-red-500 dark:hover:border-red-400'
                  return 'hover:border-gray-500 dark:hover:border-gray-400'
                }
                const getFactorHoverShadow = () => {
                  if (progressColor.includes('green')) return 'hover:shadow-lg hover:shadow-green-500/20'
                  if (progressColor.includes('yellow')) return 'hover:shadow-lg hover:shadow-yellow-500/20'
                  if (progressColor.includes('red')) return 'hover:shadow-lg hover:shadow-red-500/20'
                  return 'hover:shadow-lg hover:shadow-gray-500/20'
                }
                const getProgressBarShadow = () => {
                  if (progressColor.includes('green')) return 'group-hover:shadow-lg group-hover:shadow-green-500/50'
                  if (progressColor.includes('yellow')) return 'group-hover:shadow-lg group-hover:shadow-yellow-500/50'
                  if (progressColor.includes('red')) return 'group-hover:shadow-lg group-hover:shadow-red-500/50'
                  return 'group-hover:shadow-lg group-hover:shadow-gray-500/50'
                }

                return (
                  <SimpleTooltip
                    key={factorKey}
                    // @ts-ignore
                    text={factorDescriptions[factorKey]}
                    position="bottom"
                  >
                    <div className={`flex items-center gap-1.5 cursor-help min-w-0 px-2 py-1 rounded-lg transition-all duration-300 hover:bg-white/10 dark:hover:bg-white/5 hover:scale-105 group border border-transparent ${getFactorHoverBorder()} ${getFactorHoverShadow()}`}>
                      <span className="text-xs text-gray-500 dark:text-gray-300 whitespace-nowrap flex-shrink-0">
                        {shortLabel}
                      </span>
                      <div className="w-12 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex-shrink-0">
                        <div
                          className={`h-full ${progressColor} rounded-full transition-all duration-300 ${getProgressBarShadow()}`}
                          style={{
                            width: `${percentage}%`,
                          }}
                        />
                      </div>
                      <AnimatedCounter
                        value={factor.value}
                        decimals={0}
                        suffix={`/${factor.max}`}
                        className={`text-xs font-bold ${textColor} whitespace-nowrap flex-shrink-0`}
                        resetAnimation={false}
                      />
                    </div>
                  </SimpleTooltip>
                )
              })}
            </div>
        </div>
      </div>

      {/* Сетка из 4 карточек */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-stretch">
        {/* Карточка 1: План/факт */}
        <div
          className="glass-card glow-blue relative bg-blue-200 dark:bg-blue-500/10 border border-transparent hover:border-opacity-100 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300 group rounded-2xl p-4 overflow-hidden"
          style={{ borderColor: 'rgba(59, 130, 246, 0.4)' }}
        >
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <h4 className="font-semibold text-blue-600 dark:text-blue-400">План/факт</h4>
                {(() => {
                  const scheduleInfo = getWorkScheduleInfo()
                  const Icon = scheduleInfo.icon
                  return (
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full font-medium flex items-center gap-1.5">
                      <Icon className={`w-3.5 h-3.5 ${scheduleInfo.iconColor}`} />
                      {scheduleInfo.name}
                    </span>
                  )
                })()}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={handleWorkScheduleClick}
                  className={`p-1.5 rounded-lg hover:bg-black/10 transition-normal hover-lift-scale click-shrink text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white ${shouldHighlightWorkSchedule ? 'animate-button-highlight' : ''}`}
                  title="Настройка рабочего графика"
                  style={shouldHighlightWorkSchedule ? {
                    animation: 'buttonHighlight 1.5s ease-in-out infinite',
                    position: 'relative',
                    zIndex: 1
                  } : {}}
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>

            {day === 0 && month === 0 ? (
              <div className="flex flex-col items-center justify-center py-4">
                <div className="w-16 h-16 mb-2 flex items-center justify-center">
                  <Calendar className="w-12 h-12 text-blue-400 dark:text-blue-500 opacity-50" strokeWidth={1.5} />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Начните работу, чтобы увидеть план/факт
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {/* День */}
                <div
                  className={shouldAnimate ? 'animate-slide-up' : ''}
                  style={shouldAnimate ? { animationDelay: '0.1s', animationFillMode: 'both' } : {}}
                >
                  <div className="flex justify-between items-end mb-1">
                    <div className="flex flex-col">
                    <p
                      className={`text-gray-500 dark:text-gray-400 text-sm ${shouldAnimate ? 'opacity-0 animate-fade-in' : ''}`}
                      style={
                        shouldAnimate
                          ? { animationDelay: '0.15s', animationFillMode: 'forwards' }
                          : {}
                      }
                    >
                      День
                    </p>
                    <p className={`text-[10px] uppercase tracking-wider text-blue-600/60 dark:text-blue-400/60 font-bold mt-0.5 ${shouldAnimate ? 'opacity-0 animate-fade-in' : ''}`}
                       style={shouldAnimate ? { animationDelay: '0.2s', animationFillMode: 'forwards' } : {}}
                    >
                       {currentDayName}
                    </p>
                    </div>
                    <AnimatedCounter
                      value={day}
                      suffix=" ₽"
                      decimals={0}
                      className={`text-xl font-bold text-gray-900 dark:text-white ${shouldAnimate ? 'opacity-0 animate-fade-in' : ''}`}
                      style={
                        shouldAnimate ? { animationDelay: '0.2s', animationFillMode: 'forwards' } : {}
                      }
                      resetAnimation={shouldAnimate}
                      key={`day-${day}`}
                    />
                  </div>
                  <div className="w-full bg-gray-300 dark:bg-gray-700/50 rounded-full h-1 mt-1 mb-1 overflow-hidden">
                    <div
                      key={`day-progress-${day}`}
                      className="bg-blue-500 h-1 rounded-full transition-all duration-500"
                      style={{
                        width: `${dailyPlanValue > 0 ? Math.min(100, (day / dailyPlanValue) * 100) : 0}%`,
                        // @ts-ignore
                        '--progress-width': `${dailyPlanValue > 0 ? Math.min(100, (day / dailyPlanValue) * 100) : 0}%`,
                        // @ts-ignore
                        animation: shouldAnimate
                          ? `slideInProgress ${progressBarSpeeds.day}s cubic-bezier(0.4, 0, 0.2, 1) 0.25s both`
                          : 'none',
                      }}
                    />
                  </div>
                  <p
                    className={`text-right text-xs text-gray-700 dark:text-gray-300 font-medium mt-1 ${shouldAnimate ? 'opacity-0 animate-fade-in' : ''}`}
                    style={
                      shouldAnimate ? { animationDelay: '0.3s', animationFillMode: 'forwards' } : {}
                    }
                  >
                    План: {dailyPlanValue.toLocaleString('ru-RU')} ₽
                  </p>
                </div>

                {/* Месяц */}

                {/* Месяц */}
                <div
                  className={shouldAnimate ? 'animate-slide-up' : ''}
                  style={shouldAnimate ? { animationDelay: '0.15s', animationFillMode: 'both' } : {}}
                >
                  <div className="flex justify-between items-end mb-1">
                    <div className="flex flex-col">
                    <p
                      className={`text-gray-500 dark:text-gray-400 text-sm font-medium ${shouldAnimate ? 'opacity-0 animate-fade-in' : ''}`}
                      style={
                        shouldAnimate ? { animationDelay: '0.2s', animationFillMode: 'forwards' } : {}
                      }
                    >
                      Месяц
                    </p>
                    <p className={`text-[10px] uppercase tracking-wider text-purple-600/60 dark:text-purple-400/60 font-bold mt-0.5 ${shouldAnimate ? 'opacity-0 animate-fade-in' : ''}`}
                       style={shouldAnimate ? { animationDelay: '0.25s', animationFillMode: 'forwards' } : {}}
                    >
                       {currentMonthName}
                    </p>
                    </div>
                    <AnimatedCounter
                      value={month}
                      suffix=" ₽"
                      decimals={0}
                      className={`text-xl font-bold text-gray-900 dark:text-white ${shouldAnimate ? 'opacity-0 animate-fade-in' : ''}`}
                      style={
                        shouldAnimate
                          ? { animationDelay: '0.25s', animationFillMode: 'forwards' }
                          : {}
                      }
                      resetAnimation={shouldAnimate}
                      key={`month-${month}`}
                    />
                  </div>
                  <div className="w-full bg-gray-300 dark:bg-gray-700/50 rounded-full h-1 mt-1 mb-1 overflow-hidden">
                    <div
                      key={`month-progress-${month}`}
                      className="bg-purple-500 h-1 rounded-full transition-all duration-500"
                      style={{
                        width: `${monthlyPlan > 0 ? Math.min(100, (month / monthlyPlan) * 100) : 0}%`,
                        // @ts-ignore
                        '--progress-width': `${monthlyPlan > 0 ? Math.min(100, (month / monthlyPlan) * 100) : 0}%`,
                        // @ts-ignore
                        animation: shouldAnimate
                          ? `slideInProgress ${progressBarSpeeds.month}s cubic-bezier(0.4, 0, 0.2, 1) 0.3s both`
                          : 'none',
                      }}
                    />
                  </div>
                  <p
                    className={`text-right text-xs text-gray-700 dark:text-gray-300 font-medium mt-1 ${shouldAnimate ? 'opacity-0 animate-fade-in' : ''}`}
                    style={
                      shouldAnimate ? { animationDelay: '0.35s', animationFillMode: 'forwards' } : {}
                    }
                  >
                    План: {monthlyPlan.toLocaleString('ru-RU')} ₽
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Большая иконка */}
          <Calendar
            className="absolute -right-5 -bottom-5 w-32 h-32 pointer-events-none transition-all duration-300 text-blue-500/50 dark:text-blue-400/40 group-hover:text-blue-500/80 dark:group-hover:text-blue-400/70 group-hover:scale-110"
            strokeWidth={2}
            fill="none"
          />
        </div>

        {/* Карточка 2: Выплаты */}
        <div
          className="glass-card glow-green relative bg-green-200 dark:bg-green-500/10 border border-transparent hover:border-opacity-100 hover:border-green-500 dark:hover:border-green-400 hover:shadow-lg hover:shadow-green-500/20 transition-all duration-300 group rounded-2xl p-4 overflow-hidden"
          style={{ borderColor: 'rgba(34, 197, 94, 0.4)' }}
        >
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-semibold text-green-600 dark:text-green-400">Выплаты</h4>
              <button
                onClick={handlePaymentsClick}
                className={`p-1.5 rounded-lg hover:bg-black/10 transition-normal hover-lift-scale click-shrink text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white ${shouldHighlightPayments ? 'animate-button-highlight' : ''}`}
                title="Настройка дат выплат"
                style={shouldHighlightPayments ? {
                  animation: 'buttonHighlight 1.5s ease-in-out infinite',
                  position: 'relative',
                  zIndex: 1
                } : {}}
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>

            {paymentData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500 dark:text-gray-400">
                <p className="text-sm mb-2">Нет настроенных выплат</p>
                <button
                  onClick={() => openModal('soundSettings', { activeTab: 'payments' })}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Настроить даты выплат
                </button>
              </div>
            ) : paymentData.every(p => p.earned === 0) ? (
              <div className="flex flex-col items-center justify-center py-4">
                <div className="w-16 h-16 mb-2 text-green-400 dark:text-green-500 flex items-center justify-center">
                  <PaymentIllustration className="w-full h-full" animated={shouldAnimate} />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Начните работу, чтобы увидеть выплаты
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {paymentData.map((payment, index) => (
                  <div key={payment.id}>
                  <div
                    className={shouldAnimate ? 'animate-slide-up' : ''}
                    style={
                      shouldAnimate
                        ? {
                            animationDelay: `${0.2 + index * 0.05}s`,
                            animationFillMode: 'both',
                          }
                        : {}
                    }
                  >
                    <div className="flex justify-between items-end mb-1">
                      <div className="flex flex-col">
                        <p
                          className={`text-gray-500 dark:text-gray-400 text-sm font-medium ${shouldAnimate ? 'opacity-0 animate-fade-in' : ''}`}
                          style={
                            shouldAnimate
                              ? {
                                  animationDelay: `${0.25 + index * 0.05}s`,
                                  animationFillMode: 'forwards',
                                }
                              : {}
                          }
                        >
                          {payment.name}
                        </p>
                        <span className={`text-[10px] uppercase tracking-wider text-green-600/60 dark:text-green-400/60 font-bold mt-0.5 ${shouldAnimate ? 'opacity-0 animate-fade-in' : ''}`}
                            style={shouldAnimate ? { animationDelay: `${0.25 + index * 0.05}s`, animationFillMode: 'forwards' } : {}}
                        >
                          {formatPaymentDate(payment, currentYear, currentMonth)}
                        </span>
                      </div>
                      <AnimatedCounter
                        value={payment.earned}
                        suffix=" ₽"
                        decimals={0}
                        className={`text-xl font-bold text-gray-900 dark:text-white ${shouldAnimate ? 'opacity-0 animate-fade-in' : ''}`}
                        style={
                          shouldAnimate
                            ? {
                                animationDelay: `${0.3 + index * 0.05}s`,
                                animationFillMode: 'forwards',
                              }
                            : {}
                        }
                        resetAnimation={shouldAnimate}
                      />
                    </div>
                    <div className="w-full bg-gray-300 dark:bg-gray-700/50 rounded-full h-1 mt-1 overflow-hidden">
                      <div
                        className="h-1 rounded-full transition-normal"
                        style={{
                          backgroundColor: payment.color || '#10B981',
                          width: `${payment.plan > 0 ? Math.min(100, (payment.earned / payment.plan) * 100) : 0}%`,
                          // @ts-ignore
                          '--progress-width': `${payment.plan > 0 ? Math.min(100, (payment.earned / payment.plan) * 100) : 0}%`,
                          // @ts-ignore
                          animation: `slideInProgress ${progressBarSpeeds.payments[index] || '1.5'}s cubic-bezier(0.4, 0, 0.2, 1) ${0.35 + index * 0.05}s both`,
                        }}
                      />
                    </div>
                    <p
                      className={`text-right text-xs text-gray-700 dark:text-gray-300 font-medium mt-1 ${shouldAnimate ? 'opacity-0 animate-fade-in' : ''}`}
                      style={
                        shouldAnimate
                          ? {
                              animationDelay: `${0.4 + index * 0.05}s`,
                              animationFillMode: 'forwards',
                            }
                          : {}
                      }
                    >
                      План: {payment.plan.toLocaleString('ru-RU')} ₽
                    </p>
                  </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Большая иконка */}
          <DollarSign
            className="absolute -right-5 -bottom-5 w-32 h-32 pointer-events-none transition-all duration-300 text-green-500/50 dark:text-green-400/40 group-hover:text-green-500/80 dark:group-hover:text-green-400/70 group-hover:scale-110"
            strokeWidth={2}
            fill="none"
          />
        </div>

        {/* Карточка 3: Общие итоги */}
        <div
          className="glass-card glow-orange relative bg-orange-200 dark:bg-yellow-500/10 border border-transparent hover:border-opacity-100 hover:border-orange-500 dark:hover:border-orange-400 hover:shadow-lg hover:shadow-orange-500/20 transition-all duration-300 group rounded-2xl p-4 overflow-hidden"
          style={{ borderColor: 'rgba(249, 115, 22, 0.4)' }}
        >
          <div className="relative z-10">
            {/* Заголовок с бейджем средней ставки */}
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-orange-600 dark:text-orange-400">Общие итоги</h4>
              {totalHoursAndRate.averageRate > 0 && (
                <SimpleTooltip
                  text="Средняя ставка за час = общий заработок ÷ общее количество часов за всё время"
                  position="bottom"
                >
                  <div
                    className={`flex items-center gap-1.5 px-2 py-1 bg-orange-500/10 dark:bg-orange-500/20 rounded-md border border-orange-500/20 cursor-help ${shouldAnimate ? 'animate-slide-up opacity-0 animate-fade-in' : ''}`}
                    style={shouldAnimate ? { animationDelay: '0.3s', animationFillMode: 'both' } : {}}
                  >
                    <AnimatedCounter
                      value={totalHoursAndRate.averageRate}
                      suffix=" ₽/ч"
                      decimals={0}
                      className="text-xs font-bold text-orange-600 dark:text-orange-400"
                      resetAnimation={shouldAnimate}
                    />
                  </div>
                </SimpleTooltip>
              )}
            </div>

            {year === 0 && allTime === 0 ? (
              <div className="flex flex-col items-center justify-center py-4">
                <div className="w-16 h-16 mb-2 text-orange-400 dark:text-orange-500 flex items-center justify-center">
                  <TotalIllustration className="w-full h-full" animated={shouldAnimate} />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Начните работу, чтобы увидеть итоги
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Год */}
                <div
                  className={`border-l-4 border-orange-400 pl-4 ${shouldAnimate ? 'animate-slide-up opacity-0 animate-fade-in' : ''}`}
                  style={shouldAnimate ? { animationDelay: '0.3s', animationFillMode: 'both' } : {}}
                >
                  <p
                    className={`text-gray-500 dark:text-gray-400 text-sm ${shouldAnimate ? 'opacity-0 animate-fade-in' : ''}`}
                    style={
                      shouldAnimate ? { animationDelay: '0.35s', animationFillMode: 'forwards' } : {}
                    }
                  >
                    Год
                  </p>
                  <AnimatedCounter
                    value={year}
                    suffix=" ₽"
                    decimals={0}
                    className={`text-3xl font-bold text-gray-900 dark:text-white ${shouldAnimate ? 'opacity-0 animate-fade-in' : ''}`}
                    style={
                      shouldAnimate ? { animationDelay: '0.4s', animationFillMode: 'forwards' } : {}
                    }
                    resetAnimation={shouldAnimate}
                  />
                </div>

                {/* За все время */}
                <div
                  className={`border-l-4 border-red-400 pl-4 ${shouldAnimate ? 'animate-slide-up opacity-0 animate-fade-in' : ''}`}
                  style={shouldAnimate ? { animationDelay: '0.35s', animationFillMode: 'both' } : {}}
                >
                  <p
                    className={`text-gray-500 dark:text-gray-400 text-sm ${shouldAnimate ? 'opacity-0 animate-fade-in' : ''}`}
                    style={
                      shouldAnimate ? { animationDelay: '0.4s', animationFillMode: 'forwards' } : {}
                    }
                  >
                    За все время
                  </p>
                  <AnimatedCounter
                    value={allTime}
                    suffix=" ₽"
                    decimals={0}
                    className={`text-3xl font-bold text-gray-900 dark:text-white ${shouldAnimate ? 'opacity-0 animate-fade-in' : ''}`}
                    style={
                      shouldAnimate ? { animationDelay: '0.45s', animationFillMode: 'forwards' } : {}
                    }
                    resetAnimation={shouldAnimate}
                  />
                </div>


              </div>
            )}
          </div>

          {/* Большая иконка */}
          <DollarSign
            className="absolute -right-5 -bottom-5 w-32 h-32 pointer-events-none transition-all duration-300 text-orange-500/50 dark:text-orange-400/40 group-hover:text-orange-500/80 dark:group-hover:text-orange-400/70 group-hover:scale-110"
            strokeWidth={2}
            fill="none"
          />
        </div>

        {/* Карточка 4: Топ проекты (Новая) */}
        <TopProjectsWidget shouldAnimate={shouldAnimate} />
      </div>
    </div>
  )
}
