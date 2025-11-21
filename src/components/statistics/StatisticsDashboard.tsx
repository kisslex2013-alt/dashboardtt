import { useMemo, useDeferredValue } from 'react'
import { Clock, DollarSign, TrendingUp, Calendar, Moon } from '../../utils/icons'
import { useEntries } from '../../store/useEntriesStore'
import { useIsMobile } from '../../hooks/useIsMobile'
import { calculateDuration } from '../../utils/calculations'
import { timeToMinutes } from '../../utils/dateHelpers'
import { useWorkerCalculation } from '../../hooks/useWorkerCalculation'
import { SkeletonGrid } from '../ui/SkeletonCard'
import { StatCard } from './StatCard'

/**
 * 📊 Расширенная панель статистики с 6 карточками показателей
 *
 * Показывает:
 * - Затрачено часов (с учетом перерывов)
 * - Перерывы между сессиями
 * - Заработано
 * - Средняя ставка
 * - Рабочих дней
 * - Выходных дней
 *
 * Поддерживает режим сравнения с предыдущим периодом
 *
 * @param {boolean} compareMode - включить режим сравнения
 * @param {string} periodFilter - текущий фильтр периода ('today', 'week', 'month', 'year', 'all')
 * @param {string} customDateFrom - начальная дата для кастомного периода
 * @param {string} customDateTo - конечная дата для кастомного периода
 */
export function StatisticsDashboard({
  compareMode = false,
  periodFilter = 'month',
  customDateFrom = null,
  customDateTo = null,
}) {
  // ✅ ОПТИМИЗАЦИЯ: Используем атомарный селектор для минимизации ре-рендеров
  const entries = useEntries()
  const isMobile = useIsMobile()

  /**
   * Фильтрует записи по заданному периоду
   */
  const getFilteredEntries = (filter, dateFrom, dateTo) => {
    const now = new Date()

    return entries.filter(entry => {
      const entryDate = new Date(entry.date)

      switch (filter) {
        case 'today': {
          return entryDate.toDateString() === now.toDateString()
        }

        case 'week': {
          const startOfWeek = new Date(now)
          startOfWeek.setDate(now.getDate() - now.getDay() + 1) // Понедельник
          startOfWeek.setHours(0, 0, 0, 0)
          const endOfWeek = new Date(startOfWeek)
          endOfWeek.setDate(startOfWeek.getDate() + 6)
          endOfWeek.setHours(23, 59, 59, 999)
          return entryDate >= startOfWeek && entryDate <= endOfWeek
        }

        case 'month': {
          return (
            entryDate.getFullYear() === now.getFullYear() && entryDate.getMonth() === now.getMonth()
          )
        }

        case 'year': {
          return entryDate.getFullYear() === now.getFullYear()
        }

        case 'custom': {
          if (!dateFrom || !dateTo) return true
          const from = new Date(dateFrom)
          from.setHours(0, 0, 0, 0)
          const to = new Date(dateTo)
          to.setHours(23, 59, 59, 999)
          return entryDate >= from && entryDate <= to
        }

        default:
          return true
      }
    })
  }

  /**
   * Рассчитывает детальную статистику для массива записей
   */
  const calculateDetailedStats = (data, filter) => {
    if (data.length === 0) {
      return {
        totalHours: 0,
        totalEarned: 0,
        avgRate: 0,
        daysWorked: 0,
        totalBreaks: 0,
        daysOff: 0,
      }
    }

    // Общие часы и заработок
    const totalHours = data.reduce((sum, e) => {
      if (!e.start || !e.end) return sum
      return sum + parseFloat(calculateDuration(e.start, e.end))
    }, 0)

    const totalEarned = data.reduce((sum, e) => sum + (parseFloat(e.earned) || 0), 0)

    // Расчет перерывов между сессиями
    const breaksByDay = data.reduce((acc, entry) => {
      if (!acc[entry.date]) {
        acc[entry.date] = []
      }
      acc[entry.date].push(entry)
      return acc
    }, {})

    let totalBreakMinutes = 0
    Object.values(breaksByDay).forEach(dayEntries => {
      const sorted = [...dayEntries].sort((a, b) => a.start.localeCompare(b.start))
      for (let i = 1; i < sorted.length; i++) {
        const prevEnd = timeToMinutes(sorted[i - 1].end)
        const currentStart = timeToMinutes(sorted[i].start)
        const breakMinutes = (currentStart + 24 * 60 - prevEnd) % (24 * 60)
        if (breakMinutes > 0 && breakMinutes < 12 * 60) {
          // Игнорируем перерывы > 12 часов
          totalBreakMinutes += breakMinutes
        }
      }
    })

    // Вычисляем рабочие дни (уникальные даты с записями)
    const workedDays = new Set(data.map(e => e.date))
    const daysWorked = workedDays.size

    // Вычисляем выходные дни (дни БЕЗ записей в периоде)
    let daysOff = 0
    const now = new Date()

    if (filter === 'today') {
      daysOff = data.length === 0 ? 1 : 0
    } else if (filter === 'week') {
      // Текущая неделя (понедельник-воскресенье)
      const startOfWeek = new Date(now)
      startOfWeek.setDate(now.getDate() - now.getDay() + 1)
      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek)
        date.setDate(startOfWeek.getDate() + i)
        const dateStr = date.toISOString().split('T')[0]
        if (!workedDays.has(dateStr)) {
          daysOff++
        }
      }
    } else if (filter === 'month') {
      // Текущий месяц
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
      for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(now.getFullYear(), now.getMonth(), i)
        const dateStr = date.toISOString().split('T')[0]
        if (!workedDays.has(dateStr)) {
          daysOff++
        }
      }
    } else if (filter === 'year') {
      // Текущий год
      const startOfYear = new Date(now.getFullYear(), 0, 1)
      const endOfYear = new Date(now.getFullYear(), 11, 31)
      const daysInYear = Math.ceil((endOfYear - startOfYear) / (1000 * 60 * 60 * 24)) + 1
      for (let i = 0; i < daysInYear; i++) {
        const date = new Date(startOfYear)
        date.setDate(startOfYear.getDate() + i)
        const dateStr = date.toISOString().split('T')[0]
        if (!workedDays.has(dateStr)) {
          daysOff++
        }
      }
    } else if (filter === 'custom' && customDateFrom && customDateTo) {
      // Кастомный период
      const from = new Date(customDateFrom)
      const to = new Date(customDateTo)
      const daysInRange = Math.ceil((to - from) / (1000 * 60 * 60 * 24)) + 1
      for (let i = 0; i < daysInRange; i++) {
        const date = new Date(from)
        date.setDate(from.getDate() + i)
        const dateStr = date.toISOString().split('T')[0]
        if (!workedDays.has(dateStr)) {
          daysOff++
        }
      }
    } else {
      // Все время
      if (data.length > 0) {
        const firstDate = new Date(Math.min(...data.map(e => new Date(e.date))))
        const today = new Date()
        const daysInRange = Math.ceil((today - firstDate) / (1000 * 60 * 60 * 24)) + 1
        for (let i = 0; i < daysInRange; i++) {
          const date = new Date(firstDate)
          date.setDate(firstDate.getDate() + i)
          const dateStr = date.toISOString().split('T')[0]
          if (!workedDays.has(dateStr) && date <= today) {
            daysOff++
          }
        }
      }
    }

    return {
      totalHours,
      totalEarned,
      avgRate: totalHours > 0 ? totalEarned / totalHours : 0,
      daysWorked,
      totalBreaks: totalBreakMinutes / 60,
      daysOff,
    }
  }

  // Получаем статистику для текущего периода (мемоизировано для оптимизации)
  const filtered = useMemo(
    () => getFilteredEntries(periodFilter, customDateFrom, customDateTo),
    [entries, periodFilter, customDateFrom, customDateTo]
  )

  // ОПТИМИЗАЦИЯ: Используем Web Worker для тяжелых вычислений при большом количестве записей
  // Если записей меньше 500, используем синхронный расчет (быстрее для малых данных)
  const shouldUseWorker = filtered.length > 500
  const { result: workerStats, isLoading: workerLoading } = useWorkerCalculation(
    shouldUseWorker ? filtered : [],
    'statistics',
    periodFilter
  )

  // ✅ УПРОЩЕННАЯ ВЕРСИЯ: Без useTransition - убрана логика переходов, вызывавшая мерцание
  // Используем currentStats напрямую, без промежуточных состояний
  const currentStats = useMemo(() => {
    if (shouldUseWorker) {
      return (
        workerStats || {
          totalHours: 0,
          totalEarned: 0,
          avgRate: 0,
          daysWorked: 0,
          totalBreaks: 0,
          daysOff: 0,
        }
      )
    } else {
      return calculateDetailedStats(filtered, periodFilter)
    }
  }, [shouldUseWorker, workerStats, filtered, periodFilter])

  // ✅ ИСПРАВЛЕНИЕ: Используем useDeferredValue для отложенного обновления при большом объеме данных
  // Это предотвращает мерцание при переключении на период "ГОД" с большим количеством записей
  // useDeferredValue откладывает обновление, позволяя React не блокировать UI
  const deferredStats = useDeferredValue(currentStats)

  // Используем deferredStats для отображения, чтобы избежать блокировки UI
  const statsForDisplay = filtered.length > 200 ? deferredStats : currentStats

  // Получаем статистику для предыдущего периода (если включен режим сравнения)
  const previousStats = useMemo(() => {
    if (!compareMode) return null

    const now = new Date()
    let prevFrom, prevTo

    if (periodFilter === 'today') {
      const yesterday = new Date()
      yesterday.setDate(now.getDate() - 1)
      prevFrom = prevTo = yesterday.toISOString().split('T')[0]
    } else if (periodFilter === 'week') {
      // Предыдущая неделя
      const lastWeek = new Date(now)
      lastWeek.setDate(now.getDate() - 7)
      const monday = new Date(lastWeek)
      monday.setDate(lastWeek.getDate() - lastWeek.getDay() + 1)
      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 6)
      prevFrom = monday.toISOString().split('T')[0]
      prevTo = sunday.toISOString().split('T')[0]
    } else if (periodFilter === 'month') {
      // Предыдущий месяц
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      prevFrom = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), 1)
        .toISOString()
        .split('T')[0]
      prevTo = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0)
        .toISOString()
        .split('T')[0]
    } else if (periodFilter === 'year') {
      // Предыдущий год
      const prevYear = now.getFullYear() - 1
      prevFrom = `${prevYear}-01-01`
      prevTo = `${prevYear}-12-31`
    }

    if (prevFrom && prevTo) {
      const previousFiltered = getFilteredEntries('custom', prevFrom, prevTo)
      return calculateDetailedStats(previousFiltered, 'custom')
    }

    return null
  }, [compareMode, periodFilter, entries, getFilteredEntries])

  // ВИЗУАЛ: Skeleton Loading States вместо спиннера
  if (shouldUseWorker && workerLoading && !workerStats) {
    return (
      <div className="mb-6">
        <SkeletonGrid
          count={6}
          variant="statistic"
          columns={3}
          className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
        />
      </div>
    )
  }

  // На мобильных устройствах используем вертикальную сетку (2 колонки)
  if (isMobile) {
    return (
      <div className="mb-6 px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-4">
          {/* Карточка 1: Затрачено */}
          <StatCard
            title="Затрачено"
            numericValue={Math.round(statsForDisplay.totalHours)}
            suffix=" ч."
            decimals={0}
            icon={Clock}
            gradient="bg-gradient-to-br from-blue-500/80 to-gray-900/20 dark:from-blue-500/20 dark:to-gray-900/20"
            accentClass="blue-500"
            glowClass="glow-blue"
            titleColorClass="text-blue-600 dark:text-blue-400"
            comparison={
              compareMode
                ? { current: statsForDisplay.totalHours, previous: previousStats?.totalHours }
                : null
            }
            periodFilter={periodFilter}
          />

          {/* Карточка 2: Перерывы */}
          <StatCard
            title="Перерывы"
            numericValue={statsForDisplay.totalBreaks}
            suffix=" ч."
            decimals={2}
            icon={Clock}
            gradient="bg-gradient-to-br from-teal-500/80 to-gray-900/20 dark:from-teal-500/20 dark:to-gray-900/20"
            accentClass="teal-500"
            glowClass="glow-teal"
            titleColorClass="text-teal-600 dark:text-teal-400"
            comparison={
              compareMode
                ? { current: statsForDisplay.totalBreaks, previous: previousStats?.totalBreaks }
                : null
            }
            periodFilter={periodFilter}
          />

          {/* Карточка 3: Заработано */}
          <StatCard
            title="Заработано"
            numericValue={statsForDisplay.totalEarned}
            suffix=" ₽"
            decimals={0}
            icon={DollarSign}
            gradient="bg-gradient-to-br from-green-500/80 to-gray-900/20 dark:from-green-500/20 dark:to-gray-900/20"
            accentClass="green-500"
            glowClass="glow-green"
            titleColorClass="text-green-600 dark:text-green-400"
            iconOpacity="0.4"
            comparison={
              compareMode
                ? { current: statsForDisplay.totalEarned, previous: previousStats?.totalEarned }
                : null
            }
            periodFilter={periodFilter}
          />

          {/* Карточка 4: Ставка */}
          <StatCard
            title="СТАВКА"
            numericValue={statsForDisplay.avgRate}
            suffix=" ₽/ч"
            decimals={0}
            icon={TrendingUp}
            gradient="bg-gradient-to-br from-purple-500/80 to-gray-900/20 dark:from-purple-500/20 dark:to-gray-900/20"
            accentClass="purple-500"
            glowClass="glow-purple"
            titleColorClass="text-purple-600 dark:text-purple-400"
            iconOpacity="0.4"
            comparison={
              compareMode
                ? { current: statsForDisplay.avgRate, previous: previousStats?.avgRate }
                : null
            }
            periodFilter={periodFilter}
          />

          {/* Карточка 5: Рабочих дней */}
          <StatCard
            title="Рабочих дней"
            numericValue={statsForDisplay.daysWorked}
            suffix=" д."
            decimals={0}
            icon={Calendar}
            gradient="bg-gradient-to-br from-orange-500/80 to-gray-900/20 dark:from-orange-500/20 dark:to-gray-900/20"
            accentClass="orange-500"
            glowClass="glow-orange"
            titleColorClass="text-orange-600 dark:text-orange-400"
            comparison={
              compareMode
                ? { current: statsForDisplay.daysWorked, previous: previousStats?.daysWorked }
                : null
            }
            periodFilter={periodFilter}
          />

          {/* Карточка 6: Выходных */}
          <StatCard
            title="Выходных"
            numericValue={statsForDisplay.daysOff || 0}
            suffix=" д."
            decimals={0}
            icon={Moon}
            gradient="bg-gradient-to-br from-yellow-500/80 to-gray-900/20 dark:from-yellow-500/20 dark:to-gray-900/20"
            accentClass="yellow-500"
            glowClass="glow-yellow"
            titleColorClass="text-yellow-600 dark:text-yellow-400"
            comparison={
              compareMode
                ? { current: statsForDisplay.daysOff || 0, previous: previousStats?.daysOff || 0 }
                : null
            }
            periodFilter={periodFilter}
          />
        </div>
      </div>
    )
  }

  // Десктопная версия: обычная сетка
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-6 px-6">
      {/* Карточка 1: Затрачено */}
      <StatCard
        title="Затрачено"
        numericValue={Math.round(statsForDisplay.totalHours)}
        suffix=" ч."
        decimals={0}
        icon={Clock}
        gradient="bg-gradient-to-br from-blue-500/80 to-gray-900/20 dark:from-blue-500/20 dark:to-gray-900/20"
        accentClass="blue-500"
        glowClass="glow-blue"
        titleColorClass="text-blue-600 dark:text-blue-400"
        comparison={
          compareMode
            ? { current: statsForDisplay.totalHours, previous: previousStats?.totalHours }
            : null
        }
        periodFilter={periodFilter}
      />

      {/* Карточка 2: Перерывы */}
      <StatCard
        title="Перерывы"
        numericValue={statsForDisplay.totalBreaks}
        suffix=" ч."
        decimals={2}
        icon={Clock}
        gradient="bg-gradient-to-br from-teal-500/80 to-gray-900/20 dark:from-teal-500/20 dark:to-gray-900/20"
        accentClass="teal-500"
        glowClass="glow-teal"
        titleColorClass="text-teal-600 dark:text-teal-400"
        comparison={
          compareMode
            ? { current: statsForDisplay.totalBreaks, previous: previousStats?.totalBreaks }
            : null
        }
        periodFilter={periodFilter}
      />

      {/* Карточка 3: Заработано */}
      <StatCard
        title="Заработано"
        numericValue={statsForDisplay.totalEarned}
        suffix=" ₽"
        decimals={0}
        icon={DollarSign}
        gradient="bg-gradient-to-br from-green-500/80 to-gray-900/20 dark:from-green-500/20 dark:to-gray-900/20"
        accentClass="green-500"
        glowClass="glow-green"
        titleColorClass="text-green-600 dark:text-green-400"
        iconOpacity="0.4"
        comparison={
          compareMode
            ? { current: statsForDisplay.totalEarned, previous: previousStats?.totalEarned }
            : null
        }
        periodFilter={periodFilter}
      />

      {/* Карточка 4: Ставка */}
      <StatCard
        title="СТАВКА"
        numericValue={statsForDisplay.avgRate}
        suffix=" ₽/ч"
        decimals={0}
        icon={TrendingUp}
        gradient="bg-gradient-to-br from-purple-500/80 to-gray-900/20 dark:from-purple-500/20 dark:to-gray-900/20"
        accentClass="purple-500"
        glowClass="glow-purple"
        titleColorClass="text-purple-600 dark:text-purple-400"
        iconOpacity="0.4"
        comparison={
          compareMode
            ? { current: statsForDisplay.avgRate, previous: previousStats?.avgRate }
            : null
        }
        periodFilter={periodFilter}
      />

      {/* Карточка 5: Рабочих дней */}
      <StatCard
        title="Рабочих дней"
        numericValue={statsForDisplay.daysWorked}
        suffix=" д."
        decimals={0}
        icon={Calendar}
        gradient="bg-gradient-to-br from-orange-500/80 to-gray-900/20 dark:from-orange-500/20 dark:to-gray-900/20"
        accentClass="orange-500"
        glowClass="glow-orange"
        titleColorClass="text-orange-600 dark:text-orange-400"
        comparison={
          compareMode
            ? { current: statsForDisplay.daysWorked, previous: previousStats?.daysWorked }
            : null
        }
        periodFilter={periodFilter}
      />

      {/* Карточка 6: Выходных */}
      <StatCard
        title="Выходных"
        numericValue={statsForDisplay.daysOff || 0}
        suffix=" д."
        decimals={0}
        icon={Moon}
        gradient="bg-gradient-to-br from-yellow-500/80 to-gray-900/20 dark:from-yellow-500/20 dark:to-gray-900/20"
        accentClass="yellow-500"
        glowClass="glow-yellow"
        titleColorClass="text-yellow-600 dark:text-yellow-400"
        comparison={
          compareMode
            ? { current: statsForDisplay.daysOff || 0, previous: previousStats?.daysOff || 0 }
            : null
        }
        periodFilter={periodFilter}
      />
    </div>
  )
}
