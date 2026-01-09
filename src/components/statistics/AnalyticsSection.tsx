import { useState, useRef, useEffect, useMemo, useCallback, memo } from 'react'
import { parseISO, startOfDay, format } from 'date-fns'
import { ChevronDown as ChevronDownIcon, ChevronUp, BarChart3, Pin, Settings } from '../../utils/icons'
import { InfoTooltip } from '../ui/InfoTooltip'
import { ChartVisibilityDropdown } from '../ui/ChartVisibilityDropdown'
import { CombinedCategoryChart } from '../charts/CombinedCategoryChart'
import { WeekdayAnalysisChart } from '../charts/WeekdayAnalysisChart'
import { TrendsChart } from '../charts/TrendsChart'
import { DynamicsChart } from '../charts/DynamicsChart'
import { RateDistributionChart } from '../charts/RateDistributionChart'
import { HoursVsEarningsChart } from '../charts/ScatterChart'
import { HourAnalysisChart } from '../charts/HourAnalysisChart'
import { CalendarHeatmap } from '../charts/CalendarHeatmap'
import { CombinedChart } from '../charts/CombinedChart'
import { CustomDatePicker } from '../ui/CustomDatePicker'
import {
  useDefaultAnalyticsFilter,
  useSetDefaultAnalyticsFilter,
  useChartVisibility,
  useUpdateChartVisibility,
  useDefaultChartVisibility,
  useSetDefaultChartVisibility,
  useChartDisplay,
  useUpdateSettings,
  useCombinedDynamicsType,
  useCombinedRateType,
} from '../../store/useSettingsStore'
import { useEntries } from '../../store/useEntriesStore'
import { useShowSuccess } from '../../store/useUIStore'
import { useIsMobile } from '../../hooks/useIsMobile'
import { logger } from '../../utils/logger'

/**
 * Секция аналитики со всеми графиками
 * - Сворачиваемая секция
 * - Содержит все графики: CategoryDistribution, TimeDistribution, TrendsChart
 * - Адаптивная сетка (2 колонки на desktop, 1 на mobile)
 * - Фильтр периода для всех графиков
 */
const AnalyticsSectionComponent = memo(() => {
  const isMobile = useIsMobile()
  const [isExpanded, setIsExpanded] = useState(false) // По умолчанию свернуто

  // Три состояния для контроля анимаций контента аккордеона
  const [shouldMountContent, setShouldMountContent] = useState(false)
  const [isAnimatingContent, setIsAnimatingContent] = useState(false)
  const [isExitingContent, setIsExitingContent] = useState(false)
  const contentRef = useRef(null)

  // Логика открытия контента аккордеона
  // ИСПРАВЛЕНО: Убран setIsAnimatingContent(false) - как в StatisticsOverview
  useEffect(() => {
    if (isExpanded) {
      setShouldMountContent(true)
      setIsExitingContent(false)
      const rafId = requestAnimationFrame(() => {
        setIsAnimatingContent(true)
      })
      return () => cancelAnimationFrame(rafId)
    }
  }, [isExpanded])

  // Логика закрытия контента аккордеона
  // ИСПРАВЛЕНО: Восстановлена анимация закрытия с предотвращением пустого пространства
  useEffect(() => {
    if (!isExpanded && shouldMountContent && !isExitingContent) {
      setIsAnimatingContent(false)
      // RAF для синхронизации перед началом exit анимации
      const rafId = requestAnimationFrame(() => {
        setIsExitingContent(true)
      })
      return () => cancelAnimationFrame(rafId)
    }
  }, [isExpanded, shouldMountContent, isExitingContent])
  // ✅ ОПТИМИЗАЦИЯ: Используем атомарные селекторы для минимизации ре-рендеров
  const defaultAnalyticsFilter = useDefaultAnalyticsFilter()
  const setDefaultAnalyticsFilter = useSetDefaultAnalyticsFilter()
  const chartVisibility = useChartVisibility()
  const updateChartVisibility = useUpdateChartVisibility()
  const defaultChartVisibility = useDefaultChartVisibility()
  const setDefaultChartVisibility = useSetDefaultChartVisibility()
  const chartDisplay = useChartDisplay()
  const updateSettings = useUpdateSettings()
  const combinedDynamicsType = useCombinedDynamicsType()
  const combinedRateType = useCombinedRateType()

  // ИСПРАВЛЕНО: Применяем дефолтную конфигурацию при изменении defaultChartVisibility
  // Если defaultChartVisibility = null, оставляем текущую конфигурацию (пользователь может изменить)
  useEffect(() => {
    // ИСПРАВЛЕНО: При первом открытии (defaultChartVisibility === null) не применяем автоматически
    // Пользователь может изменить видимость графиков по своему усмотрению
    if (defaultChartVisibility && typeof defaultChartVisibility === 'object') {
      const hasDefaults = Object.values(defaultChartVisibility).some(v => v === true)
      if (hasDefaults) {
        // Применяем дефолтную конфигурацию к текущей видимости графиков только если она установлена пользователем
        updateChartVisibility(defaultChartVisibility)
      }
    }
    // Если defaultChartVisibility === null, ничего не делаем - пользователь работает с текущей конфигурацией
  }, [defaultChartVisibility]) // Выполняем при изменении defaultChartVisibility

  // Слушатель окончания анимации исчезновения контента
  // ИСПРАВЛЕНО: Добавлена проверка e.target для предотвращения задваивания анимации
  useEffect(() => {
    if (isExitingContent && contentRef.current) {
      const handleAnimationEnd = e => {
        // ИСПРАВЛЕНО: Проверяем, что событие от нашего элемента и именно наша анимация
        if (
          e.target === contentRef.current &&
          (e.animationName === 'slideDownOut' || e.animationName.includes('slideOut'))
        ) {
          setIsExitingContent(false)
          setShouldMountContent(false)
        }
      }

      // ИСПРАВЛЕНО: Задержка соответствует длительности slide-out анимации (300ms)
      const fallbackTimer = setTimeout(() => {
        if (isExitingContent) {
          setIsExitingContent(false)
          setShouldMountContent(false)
        }
      }, 300)

      contentRef.current.addEventListener('animationend', handleAnimationEnd)

      return () => {
        clearTimeout(fallbackTimer)
        contentRef.current?.removeEventListener('animationend', handleAnimationEnd)
      }
    }
  }, [isExitingContent])

  const entries = useEntries()
  const showSuccess = useShowSuccess()

  // ✅ ОПТИМИЗАЦИЯ: Мемоизация маппингов фильтров
  const filterTextMapping = useMemo(
    () => ({
      today: 'Сегодня',
      halfMonth1: '1/2 месяца',
      halfMonth2: '2/2 месяца',
      month: 'Месяц',
      year: 'Год',
      all: 'Все записи',
      custom: 'Выбор даты',
    }),
    []
  )

  // ✅ ОПТИМИЗАЦИЯ: Мемоизация обратного маппинга
  const filterValueMapping = useMemo(
    () => ({
      Сегодня: 'today',
      '1/2 месяца': 'halfMonth1',
      '2/2 месяца': 'halfMonth2',
      Месяц: 'month',
      Год: 'year',
      'Все записи': 'all',
      'Выбор даты': 'custom',
    }),
    []
  )

  // Используем сохраненный фильтр по умолчанию для блока "Аналитика"
  const [dateFilter, setDateFilter] = useState(filterTextMapping[defaultAnalyticsFilter] || 'Месяц')
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' })
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false)
  // Три состояния для контроля анимаций (Three-State Animation Control)
  const [shouldMountFilterDropdown, setShouldMountFilterDropdown] = useState(false)
  const [isAnimatingFilterDropdown, setIsAnimatingFilterDropdown] = useState(false)
  const [isExitingFilterDropdown, setIsExitingFilterDropdown] = useState(false)
  // ИСПРАВЛЕНО: Убраны состояния позиции - больше не нужны при absolute позиционировании
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Refs и состояния для кастомных date pickers
  const startDateInputRef = useRef<HTMLInputElement>(null)
  const endDateInputRef = useRef<HTMLInputElement>(null)
  const [isStartDatePickerOpen, setIsStartDatePickerOpen] = useState(false)
  const [isEndDatePickerOpen, setIsEndDatePickerOpen] = useState(false)

  // Логика открытия filter dropdown
  // ИСПРАВЛЕНО: упрощена логика - убрана необходимость вычисления позиции (absolute позиционирование)
  useEffect(() => {
    if (isFilterDropdownOpen) {
      setShouldMountFilterDropdown(true)
      setIsExitingFilterDropdown(false)
      // Для обычных dropdown используем один RAF
      const rafId = requestAnimationFrame(() => {
        setIsAnimatingFilterDropdown(true)
      })
      return () => cancelAnimationFrame(rafId)
    }
  }, [isFilterDropdownOpen])

  // Логика закрытия filter dropdown с guard для предотвращения двойного срабатывания
  useEffect(() => {
    if (
      !isFilterDropdownOpen &&
      shouldMountFilterDropdown &&
      !isExitingFilterDropdown &&
      isAnimatingFilterDropdown
    ) {
      setIsAnimatingFilterDropdown(false)
      // RAF для синхронизации перед началом exit анимации
      const rafId = requestAnimationFrame(() => {
        setIsExitingFilterDropdown(true)
      })
      return () => cancelAnimationFrame(rafId)
    }
  }, [
    isFilterDropdownOpen,
    shouldMountFilterDropdown,
    isExitingFilterDropdown,
    isAnimatingFilterDropdown,
  ])

  // Слушатель окончания анимации исчезновения filter dropdown
  useEffect(() => {
    if (isExitingFilterDropdown && dropdownRef.current) {
      const element = dropdownRef.current

      const handleAnimationEnd = e => {
        // Проверяем, что событие относится к нашему элементу и это exit анимация
        // ИСПРАВЛЕНО: Добавлены дополнительные проверки для надежности
        if (
          e.target === element &&
          (e.animationName === 'slideDownOut' ||
            e.animationName === 'slideUpOut' ||
            e.animationName === 'slideOut' ||
            e.animationName === 'fadeOut' ||
            e.animationName.includes('slideOut') ||
            e.animationName.includes('slide-out') ||
            e.animationName.includes('fadeOut'))
        ) {
          setIsExitingFilterDropdown(false)
          // Небольшая задержка перед размонтированием для гарантии завершения анимации
          setTimeout(() => {
            setShouldMountFilterDropdown(false)
          }, 50)
        }
      }

      // Fallback на случай, если событие не сработает (200ms анимация + запас)
      const fallbackTimer = setTimeout(() => {
        if (isExitingFilterDropdown) {
          setIsExitingFilterDropdown(false)
          setShouldMountFilterDropdown(false)
        }
      }, 300)

      element.addEventListener('animationend', handleAnimationEnd)

      return () => {
        clearTimeout(fallbackTimer)
        element.removeEventListener('animationend', handleAnimationEnd)
      }
    }
  }, [isExitingFilterDropdown])

  // ИСПРАВЛЕНО: Убраны функции обновления позиции - больше не нужны при absolute позиционировании
  // Dropdown автоматически следует за кнопкой при absolute позиционировании относительно relative контейнера

  // ✅ ОПТИМИЗАЦИЯ: Мемоизация обработчика клика вне dropdown
  const handleClickOutside = useCallback(event => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target) &&
      buttonRef.current &&
      !buttonRef.current.contains(event.target)
    ) {
      setIsFilterDropdownOpen(false)
    }
  }, [])

  // Закрытие dropdown при клике вне его
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [handleClickOutside])

  // ✅ ОПТИМИЗАЦИЯ: Мемоизация опций фильтра
  const filterOptions = useMemo(
    () => ['Сегодня', '1/2 месяца', '2/2 месяца', 'Месяц', 'Год', 'Все записи', 'Выбор даты'],
    []
  )

  // Фильтрация записей (полностью мемоизирована для производительности)
  const filteredEntries = useMemo(() => {
    if (!entries || entries.length === 0) return []

    const today = startOfDay(new Date())
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()

    return entries.filter(entry => {
      if (!entry || !entry.date) return false

      // Используем parseISO для консистентности с другими компонентами
      let entryDate
      try {
        // Пробуем parseISO сначала
        entryDate = parseISO(entry.date)
        if (isNaN(entryDate.getTime())) {
          // Fallback на обычный парсинг если parseISO не сработал
          entryDate = new Date(entry.date)
          if (isNaN(entryDate.getTime())) {
            return false // Некорректная дата
          }
        }
      } catch (e) {
        // Если parseISO выбросил ошибку, пробуем обычный Date
        entryDate = new Date(entry.date)
        if (isNaN(entryDate.getTime())) {
          return false // Некорректная дата
        }
      }

      // Нормализуем время для сравнения
      entryDate = startOfDay(entryDate)

      switch (dateFilter) {
        case 'Сегодня':
          return entryDate.getTime() === today.getTime()

        case '1/2 месяца': {
          const monthStart = new Date(currentYear, currentMonth, 1)
          const monthMid = new Date(currentYear, currentMonth, 15)
          monthMid.setHours(23, 59, 59)
          return entryDate >= monthStart && entryDate <= monthMid
        }

        case '2/2 месяца': {
          const monthMid = new Date(currentYear, currentMonth, 16)
          const monthEnd = new Date(currentYear, currentMonth + 1, 0)
          monthEnd.setHours(23, 59, 59)
          return entryDate >= monthMid && entryDate <= monthEnd
        }

        case 'Месяц':
          return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear

        case 'Год':
          // Сравниваем только год
          return entryDate.getFullYear() === currentYear

        case 'Выбор даты':
          if (!customDateRange.start || !customDateRange.end) return false
          try {
            const startDate = startOfDay(parseISO(customDateRange.start))
            const endDate = new Date(customDateRange.end)
            endDate.setHours(23, 59, 59)
            return entryDate >= startDate && entryDate <= endDate
          } catch (e) {
            return false
          }

        case 'Все записи':
        default:
          return true
      }
    })
  }, [entries, dateFilter, customDateRange.start, customDateRange.end])

  // Получаем ключ фильтра для передачи в графики
  const filterKey = filterValueMapping[dateFilter] || 'month'

  // ✅ ОПТИМИЗАЦИЯ: Мемоизация меток графиков
  const chartLabels = useMemo(
    () => ({
      dynamics: 'Динамика доходов',
      trends: 'Тренды',
      categoryDistribution: 'Распределение по категориям',
      weekdayAnalysis: 'Анализ дней недели',
      rateDistribution: 'Распределение ставок',
      scatter: 'Часы vs Доход',
      hourAnalysis: 'Анализ часов дня',
      calendar: 'Календарь доходов',
      categoryEfficiency: 'Доходы по категориям',
    }),
    []
  )

  // Опции для ChartVisibilityDropdown
  const visibilityOptions = useMemo(() => 
    Object.entries(chartLabels).map(([key, label]) => ({
      key,
      label,
      visible: chartVisibility[key] ?? false
    })),
    [chartLabels, chartVisibility]
  )

  // ✅ ОПТИМИЗАЦИЯ: Мемоизация функции переключения видимости графика
  const toggleChartVisibility = useCallback(
    (chartKey: string) => {
      updateChartVisibility({
        [chartKey]: !chartVisibility[chartKey],
      })
    },
    [chartVisibility, updateChartVisibility]
  )

  // ✅ ОПТИМИЗАЦИЯ: Мемоизация обработчиков событий (вынесены на верхний уровень)
  const handleToggleExpanded = useCallback(() => setIsExpanded(prev => !prev), [])
  const handleToggleFilterDropdown = useCallback(() => setIsFilterDropdownOpen(prev => !prev), [])

  return (
    <div
      className={`${isExpanded || (shouldMountContent && !isExitingContent) ? 'mb-6' : 'mb-0'} relative z-10`}
      data-tour="analytics-descriptive"
    >
      {/* Заголовок секции с кнопкой сворачивания и фильтром */}
      {/* ИСПРАВЛЕНО: Уменьшен z-index с z-[100] до z-40, чтобы не перекрывать модальные окна (z-[999999]) */}
      <div
        className={`glass-effect rounded-xl p-4 mb-4 overflow-visible ${isExpanded ? 'sticky top-0 z-40 backdrop-blur-xl bg-white/90 dark:bg-gray-800/90 shadow-lg transition-normal' : ''}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-blue-500" aria-hidden="true" />
            <h2 id="analytics-section-header" className={`font-bold ${isMobile ? 'text-base' : 'text-xl'}`}>
              Описательная аналитика
            </h2>
            {!isMobile && <InfoTooltip text="Детальный анализ динамики, структуры доходов и распределения времени по часам." />}
          </div>

          <div className={`flex items-center ${isMobile ? 'gap-1' : 'gap-3'}`}>
            {/* Режим отображения графиков - только на десктопе */}
            {isExpanded && !isMobile && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Режим:
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateSettings({ chartDisplay: 'separate' })}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                      chartDisplay === 'separate'
                        ? 'glass-button text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-300/50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    Раздельно
                  </button>
                  <button
                    onClick={() => updateSettings({ chartDisplay: 'combined' })}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                      chartDisplay === 'combined'
                        ? 'glass-button text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-300/50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    Совместно
                  </button>
                </div>
              </div>
            )}

            {/* Фильтр периода - только на десктопе в header */}
            {isExpanded && !isMobile && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Период:
                </span>
                <div className="relative">
                  <button
                    ref={buttonRef}
                    onClick={handleToggleFilterDropdown}
                    className="glass-effect px-4 py-2 pr-10 text-sm min-w-[180px] rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-left transition-normal hover-lift-scale click-shrink"
                  >
                    {dateFilter}
                    <ChevronDownIcon
                      className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 transition-transform duration-200 ${isFilterDropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {shouldMountFilterDropdown && (
                    <div
                      ref={dropdownRef}
                      className={`absolute right-0 mt-2 w-64 glass-effect rounded-lg border border-gray-300 dark:border-gray-600 shadow-xl z-[9999] backdrop-blur-lg bg-white/95 dark:bg-gray-800/95 ${
                        !isAnimatingFilterDropdown && !isExitingFilterDropdown
                          ? 'opacity-0 -translate-y-4'
                          : ''
                      } ${isAnimatingFilterDropdown ? 'animate-slide-down' : ''} ${
                        isExitingFilterDropdown ? 'animate-slide-up-out' : ''
                      }`}
                      style={{
                        maxHeight: 'calc(100vh - 100px)',
                        overflowY: 'auto',
                        scrollBehavior: 'smooth',
                      }}
                    >
                      {filterOptions.map(option => {
                        const filterKey = filterValueMapping[option]
                        const isDefault =
                          defaultAnalyticsFilter !== null && defaultAnalyticsFilter === filterKey
                        const isCurrent = dateFilter === option

                        return (
                          <div
                            key={option}
                            className={`flex items-center justify-between px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 last:border-b-0 ${
                              isCurrent ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                            }`}
                          >
                            <span
                              onClick={() => {
                                setDateFilter(option)
                                setIsFilterDropdownOpen(false)

                                if (option === 'Выбор даты') {
                                  setShowDatePicker(true)
                                } else {
                                  setShowDatePicker(false)
                                  setCustomDateRange({ start: '', end: '' })
                                }
                              }}
                              className="flex-1 text-sm"
                            >
                              {option}
                            </span>

                            <button
                              onClick={e => {
                                e.stopPropagation()
                                e.preventDefault()
                                if (isDefault) {
                                  setDefaultAnalyticsFilter(null)
                                  showSuccess('Фильтр по умолчанию сброшен')
                                  logger.log('📌 Дефолтный фильтр сброшен')
                                } else {
                                  setDefaultAnalyticsFilter(filterKey)
                                  showSuccess(`"${option}" установлен по умолчанию для Аналитики`)
                                  logger.log('📌 Дефолтный фильтр (Аналитика):', filterKey)
                                }
                              }}
                              className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors hover-lift-scale click-shrink ${
                                isDefault ? 'text-blue-500' : 'text-gray-400'
                              }`}
                              title={isDefault ? 'Убрать из умолчания' : 'Установить по умолчанию'}
                            >
                              <Pin className={`w-4 h-4 ${isDefault ? 'fill-current' : ''}`} />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                <ChartVisibilityDropdown
                  options={visibilityOptions}
                  onToggle={toggleChartVisibility}
                  buttonLabel="Графики"
                />
              </div>
            )}

          {/* Кнопка аккордеона - всегда видна, не сжимается */}
            <button
              onClick={handleToggleExpanded}
              className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-normal hover-lift-scale click-shrink focus:outline-none focus:ring-2 focus:ring-blue-500 flex-shrink-0 ml-auto"
              aria-expanded={isExpanded}
              aria-label={isExpanded ? 'Свернуть секцию графиков' : 'Развернуть секцию графиков'}
              aria-controls="analytics-section-content"
              title={isExpanded ? 'Свернуть' : 'Развернуть'}
            >
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-gray-500" aria-hidden="true" />
              ) : (
                <ChevronDownIcon className="w-5 h-5 text-gray-500" aria-hidden="true" />
              )}
            </button>
          </div>

          {/* Кнопки управления на мобильных - отдельная строка */}
          {isMobile && isExpanded && (
            <div className="flex items-center justify-end gap-2 mt-3 flex-wrap">
              {/* Режим отображения */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => updateSettings({ chartDisplay: 'separate' })}
                  className={`px-2 py-1 text-xs font-medium rounded-md transition-all touch-manipulation ${
                    chartDisplay === 'separate'
                      ? 'glass-button text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-300/50 dark:hover:bg-gray-700/50'
                  }`}
                  style={{ minHeight: '32px' }}
                >
                  Раздел
                </button>
                <button
                  onClick={() => updateSettings({ chartDisplay: 'combined' })}
                  className={`px-2 py-1 text-xs font-medium rounded-md transition-all touch-manipulation ${
                    chartDisplay === 'combined'
                      ? 'glass-button text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-300/50 dark:hover:bg-gray-700/50'
                  }`}
                  style={{ minHeight: '32px' }}
                >
                  Совмест
                </button>
              </div>

              {/* Фильтр периода */}
              <div className="relative">
                <button
                  ref={buttonRef}
                  onClick={handleToggleFilterDropdown}
                  className="glass-effect px-2 py-1 pr-6 text-xs rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-left transition-normal touch-manipulation"
                  style={{ minHeight: '32px', minWidth: '90px' }}
                >
                  {dateFilter}
                  <ChevronDownIcon
                    className={`absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 transition-transform duration-200 ${isFilterDropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Dropdown меню */}
                {shouldMountFilterDropdown && (
                  <div
                    ref={dropdownRef}
                    className={`absolute right-0 mt-2 w-56 glass-effect rounded-lg border border-gray-300 dark:border-gray-600 shadow-xl z-[9999] backdrop-blur-lg bg-white/95 dark:bg-gray-800/95 ${
                      !isAnimatingFilterDropdown && !isExitingFilterDropdown
                        ? 'opacity-0 -translate-y-4'
                        : ''
                    } ${isAnimatingFilterDropdown ? 'animate-slide-down' : ''} ${
                      isExitingFilterDropdown ? 'animate-slide-up-out' : ''
                    }`}
                    style={{
                      maxHeight: 'calc(100vh - 100px)',
                      overflowY: 'auto',
                    }}
                  >
                    {filterOptions.map(option => {
                      const filterKey = filterValueMapping[option]
                      const isDefault =
                        defaultAnalyticsFilter !== null && defaultAnalyticsFilter === filterKey
                      const isCurrent = dateFilter === option

                      return (
                        <div
                          key={option}
                          className={`flex items-center justify-between px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 last:border-b-0 ${
                            isCurrent ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                          }`}
                        >
                          <span
                            onClick={() => {
                              setDateFilter(option)
                              setIsFilterDropdownOpen(false)
                              if (option === 'Выбор даты') {
                                setShowDatePicker(true)
                              } else {
                                setShowDatePicker(false)
                                setCustomDateRange({ start: '', end: '' })
                              }
                            }}
                            className="flex-1 text-sm"
                          >
                            {option}
                          </span>
                          <button
                            onClick={e => {
                              e.stopPropagation()
                              e.preventDefault()
                              if (isDefault) {
                                setDefaultAnalyticsFilter(null)
                                showSuccess('Фильтр по умолчанию сброшен')
                              } else {
                                setDefaultAnalyticsFilter(filterKey)
                                showSuccess(`"${option}" установлен по умолчанию для Аналитики`)
                              }
                            }}
                            className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ${
                              isDefault ? 'text-blue-500' : 'text-gray-400'
                            }`}
                            title={isDefault ? 'Убрать из умолчания' : 'Установить по умолчанию'}
                          >
                            <Pin className={`w-4 h-4 ${isDefault ? 'fill-current' : ''}`} />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Кнопка видимости графиков */}
              <ChartVisibilityDropdown
                options={visibilityOptions}
                onToggle={toggleChartVisibility}
                buttonLabel=""
              />
            </div>
          )}
        </div>

        {/* Выбор даты (если активен) */}
        {isExpanded && showDatePicker && dateFilter === 'Выбор даты' && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">С даты:</label>
                <input
                  ref={startDateInputRef}
                  type="text"
                  value={customDateRange.start ? format(new Date(customDateRange.start), 'dd.MM.yyyy') : ''}
                  onClick={() => {
                    setIsEndDatePickerOpen(false)
                    setIsStartDatePickerOpen(true)
                  }}
                  readOnly
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  placeholder="день.месяц.год"
                />
                {isStartDatePickerOpen && (
                  <CustomDatePicker
                    value={customDateRange.start}
                    onChange={(value) => {
                      setCustomDateRange({ ...customDateRange, start: value })
                      setIsStartDatePickerOpen(false)
                    }}
                    onClose={() => setIsStartDatePickerOpen(false)}
                    inputRef={startDateInputRef}
                    placeholder="день.месяц.год"
                  />
                )}
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">По дату:</label>
                <input
                  ref={endDateInputRef}
                  type="text"
                  value={customDateRange.end ? format(new Date(customDateRange.end), 'dd.MM.yyyy') : ''}
                  onClick={() => {
                    setIsStartDatePickerOpen(false)
                    setIsEndDatePickerOpen(true)
                  }}
                  readOnly
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  placeholder="день.месяц.год"
                />
                {isEndDatePickerOpen && (
                  <CustomDatePicker
                    value={customDateRange.end}
                    onChange={(value) => {
                      setCustomDateRange({ ...customDateRange, end: value })
                      setIsEndDatePickerOpen(false)
                    }}
                    onClose={() => setIsEndDatePickerOpen(false)}
                    inputRef={endDateInputRef}
                    placeholder="день.месяц.год"
                  />
                )}
              </div>
              <button
                onClick={() => {
                  setCustomDateRange({ start: '', end: '' })
                  setShowDatePicker(false)
                  setDateFilter('Все записи')
                  setIsStartDatePickerOpen(false)
                  setIsEndDatePickerOpen(false)
                }}
                className="glass-button px-4 py-2 rounded-lg"
              >
                Сбросить
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Контент секции с анимацией раскрытия и сворачивания */}
      {/* ИСПРАВЛЕНО: Увеличена длительность анимации и добавлена задержка для плавного закрытия */}
      {shouldMountContent && (
        <div
          ref={contentRef}
          id="analytics-section-content"
          className={`${
            !isAnimatingContent && !isExitingContent ? 'opacity-0 -translate-y-4' : ''
          } ${isAnimatingContent ? 'animate-slide-up' : ''} ${
            isExitingContent ? 'animate-slide-out' : ''
          }`}
          role="region"
          aria-labelledby="analytics-section-header"
        >
          {/* Объединенный график в режиме combined - скрыт на мобильных */}
          {/* ИСПРАВЛЕНО: Убраны отдельные анимации fade-out - графики анимируются вместе с контейнером через slide-out */}
          {!isMobile &&
            chartDisplay === 'combined' &&
            (chartVisibility.dynamics || chartVisibility.rateDistribution) && (
              <CombinedChart
                entries={filteredEntries}
                dateFilter={filterKey}
                customDateRange={customDateRange}
                chartVisibility={chartVisibility}
              />
            )}

          {/* Раздельные графики в режиме separate */}
          {chartDisplay === 'separate' && (
            <>
              {/* Тренды - во всю ширину */}
              {chartVisibility.trends && (
                <TrendsChart
                  entries={filteredEntries}
                  dateFilter={filterKey}
                  customDateRange={customDateRange}
                />
              )}
            </>
          )}

          {/* Распределения - в сетке 2 колонки */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {(chartVisibility.categoryDistribution || chartVisibility.categoryEfficiency) && (
              <CombinedCategoryChart entries={filteredEntries} />
            )}
            {chartVisibility.weekdayAnalysis && <WeekdayAnalysisChart entries={filteredEntries} />}
          </div>

          {/* Динамика и ставки - в сетке 2 колонки (только в режиме separate) */}
          {chartDisplay === 'separate' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              {chartVisibility.dynamics && (
                <DynamicsChart
                  entries={filteredEntries}
                  dateFilter={filterKey}
                  customDateRange={customDateRange}
                />
              )}
              {chartVisibility.rateDistribution && (
                <RateDistributionChart entries={filteredEntries} />
              )}
            </div>
          )}

          {/* Остальные графики - в сетке 2 колонки */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* ScatterChart скрыт на мобильных */}
            {!isMobile && chartVisibility.scatter && (
              <HoursVsEarningsChart entries={filteredEntries} />
            )}
            {chartVisibility.hourAnalysis && <HourAnalysisChart entries={filteredEntries} />}
          </div>



          {/* Календарь доходов - скрыт на мобильных (не зависит от общего фильтра, имеет свою навигацию) */}
          {!isMobile && chartVisibility.calendar && (
            <div className="mt-6">
              <CalendarHeatmap entries={entries} />
            </div>
          )}

          {/* Сообщение если все графики скрыты */}
          {Object.values(chartVisibility).every(v => !v) && (
            <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
              <p className="text-gray-500 dark:text-gray-400">
                Выберите графики для отображения в настройках видимости
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
})

// Named export для прямого импорта
export const AnalyticsSection = AnalyticsSectionComponent

// Default export для lazy loading (React.lazy() требует default export)
export default AnalyticsSectionComponent
