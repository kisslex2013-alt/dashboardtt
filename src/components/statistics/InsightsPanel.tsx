import { useMemo, useRef, useState, useEffect } from 'react'
import {
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  HelpCircle,
  BarChart2,
} from '../../utils/icons'
import { useEntries, useEntriesStore } from '../../store/useEntriesStore'
import { InfoTooltip } from '../ui/InfoTooltip'
import { InsightCard } from './InsightCard'
import { EmptyState } from '../ui/EmptyState'
import { AnalyticsIllustration } from '../ui/illustrations'
import {
  calculateBestWeekday,
  calculatePeakProductivity,
  calculateEarningsTrend,
  calculateLongestSession,
  calculateTodayAnomaly,
} from '../../utils/insightsCalculations'
import { useWorkerCalculation } from '../../hooks/useWorkerCalculation'
import { SkeletonList } from '../ui/SkeletonCard'

/**
 * 🧠 Панель автоматических инсайтов
 *
 * Анализирует данные пользователя и показывает умные подсказки:
 * - Лучший день недели для работы
 * - Часы с максимальной ставкой
 * - Тренд заработка
 * - Самая длинная сессия
 * - Аномалии текущего дня
 *
 * Показывается только при наличии >= 30 записей
 *
 * @param {boolean} shouldAnimate - Запускать ли анимацию при раскрытии аккордеона
 */
export function InsightsPanel({ shouldAnimate = true }) {
  // ✅ ОПТИМИЗАЦИЯ: Используем атомарный селектор для минимизации ре-рендеров
  const entries = useEntries()

  // ✅ ИСПРАВЛЕНО: Упрощенная проверка загрузки данных
  // Используем ref для отслеживания, чтобы избежать бесконечных обновлений
  const isDataLoadedRef = useRef(false)
  const [isDataLoaded, setIsDataLoaded] = useState(() => {
    // Проверяем синхронно при первом рендере
    const storeEntries = useEntriesStore.getState().entries
    if (storeEntries && storeEntries.length > 0) {
      isDataLoadedRef.current = true
      return true
    }
    return false
  })

  // ✅ ИСПРАВЛЕНО: Отслеживаем загрузку данных из persist (только один раз)
  // Используем entries из хука вместо getState() для оптимизации
  useEffect(() => {
    // Если уже загружено, не делаем ничего
    if (isDataLoadedRef.current) {
      return
    }

    // Используем entries из хука (реактивно)
    // Если entries не пустой, данные загружены
    if (entries && entries.length > 0) {
      isDataLoadedRef.current = true
      setIsDataLoaded(true)
      return
    }

    // Даем время на загрузку данных из persist (только один раз)
    const timer = setTimeout(() => {
      // Используем entries из хука вместо getState()
      if (entries && entries.length > 0) {
        isDataLoadedRef.current = true
        setIsDataLoaded(true)
      } else {
        // Если данных нет, все равно помечаем как загруженное, чтобы показать EmptyState
        isDataLoadedRef.current = true
        setIsDataLoaded(true)
      }
    }, 200)

    return () => clearTimeout(timer)
  }, [entries]) // ✅ ИСПРАВЛЕНО: Зависимость от entries - реагируем на изменения данных

  // ✅ ИСПРАВЛЕНО: Фильтруем только завершенные записи (с временем окончания)
  // Это предотвращает обновление инсайтов при запуске таймера (создается незавершенная запись)
  const completedEntries = useMemo(() => {
    if (!entries || !isDataLoaded) return []
    return entries.filter(entry => entry && entry.end) // Только записи с временем окончания
  }, [entries, isDataLoaded])

  // ✅ ИСПРАВЛЕНО: Отслеживаем предыдущие завершенные записи для предотвращения лишних пересчетов
  // Сравниваем по ID завершенных записей, а не по ссылке на массив
  const previousCompletedIdsRef = useRef(null)
  const previousCompletedEntriesRef = useRef(null)
  const stableCompletedEntries = useMemo(() => {
    if (!completedEntries || completedEntries.length === 0) {
      previousCompletedIdsRef.current = null
      previousCompletedEntriesRef.current = completedEntries
      return completedEntries
    }

    // Создаем строку из ID завершенных записей для сравнения
    const currentIds = completedEntries
      .map(entry => entry.id)
      .filter(Boolean)
      .sort()
      .join(',')

    // Если ID не изменились, возвращаем предыдущий массив (та же ссылка = нет пересчета)
    if (previousCompletedIdsRef.current === currentIds && previousCompletedEntriesRef.current) {
      return previousCompletedEntriesRef.current
    }

    // ID изменились - обновляем ref и возвращаем новый массив
    previousCompletedIdsRef.current = currentIds
    previousCompletedEntriesRef.current = completedEntries
    return completedEntries
  }, [completedEntries])

  // ✅ ОПТИМИЗАЦИЯ: Используем Web Worker для тяжелых вычислений при большом количестве записей
  // Расширено использование Web Workers для всех тяжелых вычислений
  const shouldUseWorker = stableCompletedEntries && stableCompletedEntries.length > 500
  const { result: workerBestWeekday, isLoading: workerBestWeekdayLoading } = useWorkerCalculation(
    shouldUseWorker ? stableCompletedEntries : [],
    'bestWeekday',
    'all'
  )
  const { result: workerPeakProductivity, isLoading: workerPeakProductivityLoading } =
    useWorkerCalculation(shouldUseWorker ? stableCompletedEntries : [], 'peakProductivity', 'all')
  const { result: workerEarningsTrend, isLoading: workerEarningsTrendLoading } = useWorkerCalculation(
    shouldUseWorker ? stableCompletedEntries : [],
    'earningsTrend',
    'all'
  )
  const { result: workerLongestSession, isLoading: workerLongestSessionLoading } = useWorkerCalculation(
    shouldUseWorker ? stableCompletedEntries : [],
    'longestSession',
    'all'
  )

  // Генерация всех инсайтов с мемоизацией
  const insights = useMemo(() => {
    // Показываем инсайты только при >= 30 завершенных записях
    if (!stableCompletedEntries || stableCompletedEntries.length < 30) {
      return null
    }

    // Показываем индикатор загрузки если Worker еще обрабатывает данные
    if (
      shouldUseWorker &&
      (workerBestWeekdayLoading ||
        workerPeakProductivityLoading ||
        workerEarningsTrendLoading ||
        workerLongestSessionLoading)
    ) {
      return 'loading'
    }

    const insightsArray = []

    // 1️⃣ Лучший день недели
    const bestDay =
      shouldUseWorker && workerBestWeekday
        ? workerBestWeekday
        : calculateBestWeekday(stableCompletedEntries)
    insightsArray.push({
      id: 'best-weekday',
      title: 'Лучший день недели',
      description: `Вы зарабатываете больше всего по ${bestDay.day} — в среднем ${bestDay.avg.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽ в день.`,
      icon: Calendar,
      gradient:
        'bg-gradient-to-br from-blue-500/80 to-gray-900/20 dark:from-blue-500/20 dark:to-gray-900/20',
      borderColor: 'rgba(59, 130, 246, 0.4)',
      iconColor: 'rgba(59, 130, 246, 0.3)',
      glowClass: 'glow-blue',
      highlightColorClass: 'text-blue-600 dark:text-blue-400',
    })

    // 2️⃣ Пик продуктивности
    const peak =
      shouldUseWorker && workerPeakProductivity
        ? workerPeakProductivity
        : calculatePeakProductivity(stableCompletedEntries)
    insightsArray.push({
      id: 'peak-productivity',
      title: 'Пик продуктивности',
      description: `Ваша средняя ставка максимальна с ${peak.start}:00 до ${peak.end}:00 — ${Math.round(peak.rate)} ₽/ч.`,
      icon: Clock,
      gradient:
        'bg-gradient-to-br from-purple-500/80 to-gray-900/20 dark:from-purple-500/20 dark:to-gray-900/20',
      borderColor: 'rgba(168, 85, 247, 0.4)',
      iconColor: 'rgba(168, 85, 247, 0.3)',
      glowClass: 'glow-purple',
      highlightColorClass: 'text-purple-600 dark:text-purple-400',
    })

    // 3️⃣ Тренд заработка
    const trend =
      shouldUseWorker && workerEarningsTrend
        ? workerEarningsTrend
        : calculateEarningsTrend(stableCompletedEntries)
    let trendIcon = BarChart2
    let trendGradient =
      'bg-gradient-to-br from-blue-500/80 to-gray-900/20 dark:from-blue-500/20 dark:to-gray-900/20'
    let trendAccent = 'blue-500'
    let trendGlow = 'glow-blue'
    let trendHighlight = 'text-blue-600 dark:text-blue-400'

    if (trend.trend === 'растёт') {
      trendIcon = TrendingUp
      trendGradient =
        'bg-gradient-to-br from-green-500/80 to-gray-900/20 dark:from-green-500/20 dark:to-gray-900/20'
      trendAccent = 'green-500'
      trendGlow = 'glow-green'
      trendHighlight = 'text-green-600 dark:text-green-400'
    } else if (trend.trend === 'падает') {
      trendIcon = TrendingDown
      trendGradient =
        'bg-gradient-to-br from-red-500/80 to-gray-900/20 dark:from-red-500/20 dark:to-gray-900/20'
      trendAccent = 'red-500'
      trendGlow = 'glow-red'
      trendHighlight = 'text-red-600 dark:text-red-400'
    } else if (trend.trend === 'недостаточно данных') {
      trendIcon = AlertTriangle
      trendGradient =
        'bg-gradient-to-br from-gray-500/80 to-gray-900/20 dark:from-gray-500/20 dark:to-gray-900/20'
      trendAccent = 'gray-500'
      trendGlow = ''
      trendHighlight = 'text-gray-600 dark:text-gray-400'
    }

    let trendBorder = 'rgba(59, 130, 246, 0.4)'
    let trendIconColor = 'rgba(59, 130, 246, 0.3)'

    if (trend.trend === 'растёт') {
      trendBorder = 'rgba(34, 197, 94, 0.4)'
      trendIconColor = 'rgba(34, 197, 94, 0.3)'
    } else if (trend.trend === 'падает') {
      trendBorder = 'rgba(239, 68, 68, 0.4)'
      trendIconColor = 'rgba(239, 68, 68, 0.3)'
    } else if (trend.trend === 'недостаточно данных') {
      trendBorder = 'rgba(107, 114, 128, 0.4)'
      trendIconColor = 'rgba(107, 114, 128, 0.3)'
    }

    insightsArray.push({
      id: 'earnings-trend',
      title: 'Тренд заработка',
      description: (
        <>
          За последний месяц ваш заработок{' '}
          <span
            className={`font-bold ${trendHighlight} group-hover:drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)] group-hover:brightness-110 transition-all duration-300`}
          >
            {trend.trend}
          </span>
          .
        </>
      ),
      icon: trendIcon,
      gradient: trendGradient,
      borderColor: trendBorder,
      iconColor: trendIconColor,
      glowClass: trendGlow,
      highlightColorClass: trendHighlight,
    })

    // 4️⃣ Самая длинная сессия
    const longest =
      shouldUseWorker && workerLongestSession
        ? workerLongestSession
        : calculateLongestSession(stableCompletedEntries)
    if (longest) {
      const dateFormatted = new Date(longest.date).toLocaleDateString('ru-RU')
      const durationFormatted = `${longest.duration.toFixed(2)} ч`
      const earnedFormatted = `${longest.earned.toLocaleString('ru-RU')} ₽`
      insightsArray.push({
        id: 'longest-session',
        title: 'Самая длинная сессия',
        description: (
          <>
            Самая продолжительная сессия была{' '}
            <span className="font-bold text-orange-600 dark:text-orange-400">{dateFormatted}</span>
            {' — '}
            <span className="font-bold text-orange-600 dark:text-orange-400">
              {durationFormatted}
            </span>
            {' ('}
            <span className="font-bold text-orange-600 dark:text-orange-400">
              {earnedFormatted}
            </span>
            ).
          </>
        ),
        icon: Activity,
        gradient:
          'bg-gradient-to-br from-orange-500/80 to-gray-900/20 dark:from-orange-500/20 dark:to-gray-900/20',
        borderColor: 'rgba(249, 115, 22, 0.4)',
        iconColor: 'rgba(249, 115, 22, 0.3)',
        glowClass: 'glow-orange',
        highlightColorClass: 'text-orange-600 dark:text-orange-400',
      })
    } else {
      // Заглушка для 4-го инсайта
      insightsArray.push({
        id: 'longest-session-placeholder',
        title: 'Самая длинная сессия',
        description: 'Здесь будет информация о самой длительной рабочей сессии.',
        icon: HelpCircle,
        gradient:
          'bg-gradient-to-br from-gray-500/80 to-gray-900/20 dark:from-gray-500/20 dark:to-gray-900/20',
        borderColor: 'rgba(107, 114, 128, 0.4)',
        iconColor: 'rgba(107, 114, 128, 0.3)',
        glowClass: '',
        highlightColorClass: 'text-gray-600 dark:text-gray-400',
      })
    }

    // 5️⃣ Аномалия сегодня
    const anomaly = calculateTodayAnomaly(stableCompletedEntries)
    if (anomaly) {
      insightsArray.push({
        id: 'today-anomaly',
        title: 'Аномалия сегодня',
        description: `Сегодня вы заработали ${anomaly.type} среднего на ${anomaly.percent}% (${anomaly.total.toLocaleString('ru-RU')} ₽).`,
        icon: anomaly.type === 'выше' ? TrendingUp : TrendingDown,
        gradient:
          anomaly.type === 'выше'
            ? 'bg-gradient-to-br from-green-500/80 to-gray-900/20 dark:from-green-500/20 dark:to-gray-900/20'
            : 'bg-gradient-to-br from-red-500/80 to-gray-900/20 dark:from-red-500/20 dark:to-gray-900/20',
        borderColor: anomaly.type === 'выше' ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)',
        iconColor: anomaly.type === 'выше' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)',
        glowClass: anomaly.type === 'выше' ? 'glow-green' : 'glow-red',
        highlightColorClass:
          anomaly.type === 'выше'
            ? 'text-green-600 dark:text-green-400'
            : 'text-red-600 dark:text-red-400',
      })
    } else {
      // Заглушка для 5-го инсайта
      insightsArray.push({
        id: 'today-anomaly-placeholder',
        title: 'Аномалия сегодня',
        description: 'Здесь появится уведомление, если доход сильно отличается от вашего среднего.',
        icon: HelpCircle,
        gradient:
          'bg-gradient-to-br from-gray-500/80 to-gray-900/20 dark:from-gray-500/20 dark:to-gray-900/20',
        borderColor: 'rgba(107, 114, 128, 0.4)',
        iconColor: 'rgba(107, 114, 128, 0.3)',
        glowClass: '',
        highlightColorClass: 'text-gray-600 dark:text-gray-400',
      })
    }

    return insightsArray
  }, [
    stableCompletedEntries,
    shouldUseWorker,
    workerBestWeekday,
    workerPeakProductivity,
    workerEarningsTrend,
    workerLongestSession,
    workerBestWeekdayLoading,
    workerPeakProductivityLoading,
    workerEarningsTrendLoading,
    workerLongestSessionLoading,
  ])

  // ✅ ИСПРАВЛЕНО: Отслеживаем предыдущие инсайты для предотвращения повторной анимации
  const previousInsightsRef = useRef(null)
  const shouldTriggerAnimation = useMemo(() => {
    if (!insights || insights === 'loading') {
      previousInsightsRef.current = insights
      return shouldAnimate
    }

    // Сравниваем текущие инсайты с предыдущими по содержимому
    if (previousInsightsRef.current && Array.isArray(previousInsightsRef.current)) {
      const previousIds = previousInsightsRef.current
        .map(i => i.id)
        .sort()
        .join(',')
      const currentIds = insights
        .map(i => i.id)
        .sort()
        .join(',')

      // Если ID инсайтов не изменились, не запускаем анимацию
      if (previousIds === currentIds) {
        return false
      }
    }

    // Инсайты изменились - обновляем ref и разрешаем анимацию
    previousInsightsRef.current = insights
    return shouldAnimate
  }, [insights, shouldAnimate])

  // ВИЗУАЛ: Skeleton Loading States вместо спиннера
  // Показываем skeleton если данные еще загружаются или Worker обрабатывает данные
  if (!isDataLoaded || insights === 'loading') {
    return (
      <div className="mb-6">
        <SkeletonList count={5} variant="default" />
      </div>
    )
  }

  // Если инсайтов нет (меньше 30 записей), показываем сообщение
  if (!insights || insights === null) {
    return (
      <div className="glass-effect rounded-xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Инсайты</h2>
          <InfoTooltip text="Инсайты — это автоматически генерируемые выводы на основе ваших записей. Система анализирует ваши данные и выделяет ключевые закономерности: лучшие дни недели для работы, часы с максимальной ставкой, текущий тренд заработка и аномалии. Это помогает вам лучше понимать свою продуктивность и принимать более осознанные решения." />
        </div>
        <EmptyState
          illustration={AnalyticsIllustration}
          title="Для отображения инсайтов необходимо минимум 30 завершенных записей"
          description={`Текущее количество: ${completedEntries.length} ${completedEntries.length === 1 ? 'запись' : completedEntries.length < 5 ? 'записи' : 'записей'}`}
          variant="compact"
        />
      </div>
    )
  }

  return (
    <div className="glass-effect rounded-xl p-6 mb-6">
      {/* Заголовок с информационной иконкой */}
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Инсайты</h2>
        <InfoTooltip text="Инсайты — это автоматически генерируемые выводы на основе ваших записей. Система анализирует ваши данные и выделяет ключевые закономерности: лучшие дни недели для работы, часы с максимальной ставкой, текущий тренд заработка и аномалии. Это помогает вам лучше понимать свою продуктивность и принимать более осознанные решения." />
      </div>

      {/* Сетка инсайтов */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {insights.map((insight, index) => (
          <div
            key={insight.id}
            className={shouldTriggerAnimation ? 'animate-slide-up' : ''}
            style={
              shouldTriggerAnimation
                ? { animationDelay: `${0.1 + index * 0.05}s`, animationFillMode: 'both' }
                : {}
            }
          >
            <InsightCard
              title={insight.title}
              description={insight.description}
              icon={insight.icon}
              gradient={insight.gradient}
              borderColor={insight.borderColor}
              iconColor={insight.iconColor}
              glowClass={insight.glowClass}
              highlightColorClass={insight.highlightColorClass}
              animationDelay={index * 0.05}
              shouldAnimate={shouldTriggerAnimation}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
