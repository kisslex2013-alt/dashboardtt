import { useState, useRef, useEffect, useMemo } from 'react';
import { parseISO, startOfDay } from 'date-fns';
import { ChevronDown as ChevronDownIcon, ChevronUp, BarChart3, Pin, Settings } from 'lucide-react';
import { CategoryDistribution } from '../charts/CategoryDistribution';
import { WeekdayAnalysisChart } from '../charts/WeekdayAnalysisChart';
import { TrendsChart } from '../charts/TrendsChart';
import { DynamicsChart } from '../charts/DynamicsChart';
import { RateDistributionChart } from '../charts/RateDistributionChart';
import { HoursVsEarningsChart } from '../charts/ScatterChart';
import { HourAnalysisChart } from '../charts/HourAnalysisChart';
import { ForecastChart } from '../charts/ForecastChart';
import { CalendarHeatmap } from '../charts/CalendarHeatmap';
import { CategoryEfficiencyChart } from '../charts/CategoryEfficiencyChart';
import { CombinedChart } from '../charts/CombinedChart';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useEntriesStore } from '../../store/useEntriesStore';
import { useUIStore } from '../../store/useUIStore';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useDelayedUnmount } from '../../hooks/useDelayedUnmount';
import { logger } from '../../utils/logger';

/**
 * Секция аналитики со всеми графиками
 * - Сворачиваемая секция
 * - Содержит все графики: CategoryDistribution, TimeDistribution, TrendsChart
 * - Адаптивная сетка (2 колонки на desktop, 1 на mobile)
 * - Фильтр периода для всех графиков
 */
export function AnalyticsSection() {
  const isMobile = useIsMobile();
  const [isExpanded, setIsExpanded] = useState(false); // По умолчанию свернуто
  
  // ✨ ИСПРАВЛЕНИЕ: Используем useDelayedUnmount для плавной анимации закрытия
  const shouldRenderContent = useDelayedUnmount(isExpanded, 300);
  const contentRef = useRef(null);
  const { 
    defaultAnalyticsFilter, 
    setDefaultAnalyticsFilter, 
    chartVisibility, 
    updateChartVisibility,
    defaultChartVisibility,
    setDefaultChartVisibility,
    chartDisplay,
    updateSettings,
    combinedDynamicsType,
    combinedRateType,
  } = useSettingsStore();
  
  // ИСПРАВЛЕНО: Применяем дефолтную конфигурацию при изменении defaultChartVisibility
  // Если defaultChartVisibility = null, оставляем текущую конфигурацию (пользователь может изменить)
  useEffect(() => {
    // ИСПРАВЛЕНО: При первом открытии (defaultChartVisibility === null) не применяем автоматически
    // Пользователь может изменить видимость графиков по своему усмотрению
    if (defaultChartVisibility && typeof defaultChartVisibility === 'object') {
      const hasDefaults = Object.values(defaultChartVisibility).some(v => v === true);
      if (hasDefaults) {
        // Применяем дефолтную конфигурацию к текущей видимости графиков только если она установлена пользователем
        updateChartVisibility(defaultChartVisibility);
      }
    }
    // Если defaultChartVisibility === null, ничего не делаем - пользователь работает с текущей конфигурацией
  }, [defaultChartVisibility]); // Выполняем при изменении defaultChartVisibility
  
  
  const { entries } = useEntriesStore();
  const { showSuccess } = useUIStore();
  const [isVisibilityMenuOpen, setIsVisibilityMenuOpen] = useState(false);
  // Три состояния для контроля анимаций (Three-State Animation Control)
  const [shouldMountVisibilityMenu, setShouldMountVisibilityMenu] = useState(false);
  const [isAnimatingVisibilityMenu, setIsAnimatingVisibilityMenu] = useState(false);
  const [isExitingVisibilityMenu, setIsExitingVisibilityMenu] = useState(false);
  const visibilityMenuRef = useRef(null);
  const visibilityButtonRef = useRef(null);
  
  // Мапинг из внутренних значений в текстовые для фильтра
  const filterTextMapping = {
    'today': 'Сегодня',
    'halfMonth1': '1/2 месяца',
    'halfMonth2': '2/2 месяца',
    'month': 'Месяц',
    'year': 'Год',
    'all': 'Все записи',
    'custom': 'Выбор даты'
  };
  
  // Обратный мапинг
  const filterValueMapping = {
    'Сегодня': 'today',
    '1/2 месяца': 'halfMonth1',
    '2/2 месяца': 'halfMonth2',
    'Месяц': 'month',
    'Год': 'year',
    'Все записи': 'all',
    'Выбор даты': 'custom'
  };
  
  // Используем сохраненный фильтр по умолчанию для блока "Аналитика"
  const [dateFilter, setDateFilter] = useState(filterTextMapping[defaultAnalyticsFilter] || 'Месяц');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  // Три состояния для контроля анимаций (Three-State Animation Control)
  const [shouldMountFilterDropdown, setShouldMountFilterDropdown] = useState(false);
  const [isAnimatingFilterDropdown, setIsAnimatingFilterDropdown] = useState(false);
  const [isExitingFilterDropdown, setIsExitingFilterDropdown] = useState(false);
  // ИСПРАВЛЕНО: Убраны состояния позиции - больше не нужны при absolute позиционировании
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  // Логика открытия visibility menu
  // ИСПРАВЛЕНО: упрощена логика - убрана необходимость вычисления позиции (absolute позиционирование)
  useEffect(() => {
    if (isVisibilityMenuOpen) {
      setShouldMountVisibilityMenu(true);
      setIsExitingVisibilityMenu(false);
      // Для обычных dropdown используем один RAF
      const rafId = requestAnimationFrame(() => {
        setIsAnimatingVisibilityMenu(true);
      });
      return () => cancelAnimationFrame(rafId);
    }
  }, [isVisibilityMenuOpen]);

  // Логика закрытия visibility menu с guard для предотвращения двойного срабатывания
  useEffect(() => {
    if (!isVisibilityMenuOpen && shouldMountVisibilityMenu && !isExitingVisibilityMenu && isAnimatingVisibilityMenu) {
      setIsAnimatingVisibilityMenu(false);
      // RAF для синхронизации перед началом exit анимации
      const rafId = requestAnimationFrame(() => {
        setIsExitingVisibilityMenu(true);
      });
      return () => cancelAnimationFrame(rafId);
    }
  }, [isVisibilityMenuOpen, shouldMountVisibilityMenu, isExitingVisibilityMenu, isAnimatingVisibilityMenu]);

  // Слушатель окончания анимации исчезновения visibility menu
  useEffect(() => {
    if (isExitingVisibilityMenu && visibilityMenuRef.current) {
      const element = visibilityMenuRef.current;
      
      const handleAnimationEnd = (e) => {
        // Проверяем, что событие относится к нашему элементу и это exit анимация
        // ИСПРАВЛЕНО: Добавлены дополнительные проверки для надежности
        if (
          e.target === element &&
          (
            e.animationName === 'slideDownOut' ||
            e.animationName === 'slideUpOut' ||
            e.animationName === 'slideOut' ||
            e.animationName === 'fadeOut' ||
            e.animationName.includes('slideOut') ||
            e.animationName.includes('slide-out') ||
            e.animationName.includes('fadeOut')
          )
        ) {
          setIsExitingVisibilityMenu(false);
          // Небольшая задержка перед размонтированием для гарантии завершения анимации
          setTimeout(() => {
            setShouldMountVisibilityMenu(false);
          }, 50);
        }
      };

      // Fallback на случай, если событие не сработает (200ms анимация + запас)
      const fallbackTimer = setTimeout(() => {
        if (isExitingVisibilityMenu) {
          setIsExitingVisibilityMenu(false);
          setShouldMountVisibilityMenu(false);
        }
      }, 300);

      element.addEventListener('animationend', handleAnimationEnd);

      return () => {
        clearTimeout(fallbackTimer);
        element.removeEventListener('animationend', handleAnimationEnd);
      };
    }
  }, [isExitingVisibilityMenu]);

  // Логика открытия filter dropdown
  // ИСПРАВЛЕНО: упрощена логика - убрана необходимость вычисления позиции (absolute позиционирование)
  useEffect(() => {
    if (isFilterDropdownOpen) {
      setShouldMountFilterDropdown(true);
      setIsExitingFilterDropdown(false);
      // Для обычных dropdown используем один RAF
      const rafId = requestAnimationFrame(() => {
        setIsAnimatingFilterDropdown(true);
      });
      return () => cancelAnimationFrame(rafId);
    }
  }, [isFilterDropdownOpen]);

  // Логика закрытия filter dropdown с guard для предотвращения двойного срабатывания
  useEffect(() => {
    if (!isFilterDropdownOpen && shouldMountFilterDropdown && !isExitingFilterDropdown && isAnimatingFilterDropdown) {
      setIsAnimatingFilterDropdown(false);
      // RAF для синхронизации перед началом exit анимации
      const rafId = requestAnimationFrame(() => {
        setIsExitingFilterDropdown(true);
      });
      return () => cancelAnimationFrame(rafId);
    }
  }, [isFilterDropdownOpen, shouldMountFilterDropdown, isExitingFilterDropdown, isAnimatingFilterDropdown]);

  // Слушатель окончания анимации исчезновения filter dropdown
  useEffect(() => {
    if (isExitingFilterDropdown && dropdownRef.current) {
      const element = dropdownRef.current;
      
      const handleAnimationEnd = (e) => {
        // Проверяем, что событие относится к нашему элементу и это exit анимация
        // ИСПРАВЛЕНО: Добавлены дополнительные проверки для надежности
        if (
          e.target === element &&
          (
            e.animationName === 'slideDownOut' ||
            e.animationName === 'slideUpOut' ||
            e.animationName === 'slideOut' ||
            e.animationName === 'fadeOut' ||
            e.animationName.includes('slideOut') ||
            e.animationName.includes('slide-out') ||
            e.animationName.includes('fadeOut')
          )
        ) {
          setIsExitingFilterDropdown(false);
          // Небольшая задержка перед размонтированием для гарантии завершения анимации
          setTimeout(() => {
            setShouldMountFilterDropdown(false);
          }, 50);
        }
      };

      // Fallback на случай, если событие не сработает (200ms анимация + запас)
      const fallbackTimer = setTimeout(() => {
        if (isExitingFilterDropdown) {
          setIsExitingFilterDropdown(false);
          setShouldMountFilterDropdown(false);
        }
      }, 300);

      element.addEventListener('animationend', handleAnimationEnd);

      return () => {
        clearTimeout(fallbackTimer);
        element.removeEventListener('animationend', handleAnimationEnd);
      };
    }
  }, [isExitingFilterDropdown]);
  
  // ИСПРАВЛЕНО: Убраны функции обновления позиции - больше не нужны при absolute позиционировании
  // Dropdown автоматически следует за кнопкой при absolute позиционировании относительно relative контейнера
  
  // Закрытие dropdown при клике вне его
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          buttonRef.current && !buttonRef.current.contains(event.target)) {
        setIsFilterDropdownOpen(false);
      }
      if (visibilityMenuRef.current && !visibilityMenuRef.current.contains(event.target) &&
          visibilityButtonRef.current && !visibilityButtonRef.current.contains(event.target)) {
        setIsVisibilityMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const filterOptions = [
    'Сегодня',
    '1/2 месяца',
    '2/2 месяца',
    'Месяц',
    'Год',
    'Все записи',
    'Выбор даты'
  ];
  
  // Фильтрация записей (полностью мемоизирована для производительности)
  const filteredEntries = useMemo(() => {
    if (!entries || entries.length === 0) return [];
    
    const today = startOfDay(new Date());
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    return entries.filter((entry) => {
      if (!entry || !entry.date) return false;
      
      // Используем parseISO для консистентности с другими компонентами
      let entryDate;
      try {
        // Пробуем parseISO сначала
        entryDate = parseISO(entry.date);
        if (isNaN(entryDate.getTime())) {
          // Fallback на обычный парсинг если parseISO не сработал
          entryDate = new Date(entry.date);
          if (isNaN(entryDate.getTime())) {
            return false; // Некорректная дата
          }
        }
      } catch (e) {
        // Если parseISO выбросил ошибку, пробуем обычный Date
        entryDate = new Date(entry.date);
        if (isNaN(entryDate.getTime())) {
          return false; // Некорректная дата
        }
      }
      
      // Нормализуем время для сравнения
      entryDate = startOfDay(entryDate);
      
      switch (dateFilter) {
        case 'Сегодня':
          return entryDate.getTime() === today.getTime();
        
        case '1/2 месяца': {
          const monthStart = new Date(currentYear, currentMonth, 1);
          const monthMid = new Date(currentYear, currentMonth, 15);
          monthMid.setHours(23, 59, 59);
          return entryDate >= monthStart && entryDate <= monthMid;
        }
        
        case '2/2 месяца': {
          const monthMid = new Date(currentYear, currentMonth, 16);
          const monthEnd = new Date(currentYear, currentMonth + 1, 0);
          monthEnd.setHours(23, 59, 59);
          return entryDate >= monthMid && entryDate <= monthEnd;
        }
        
        case 'Месяц':
          return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
        
        case 'Год':
          // Сравниваем только год
          return entryDate.getFullYear() === currentYear;
        
        case 'Выбор даты':
          if (!customDateRange.start || !customDateRange.end) return false;
          try {
            const startDate = startOfDay(parseISO(customDateRange.start));
            const endDate = new Date(customDateRange.end);
            endDate.setHours(23, 59, 59);
            return entryDate >= startDate && entryDate <= endDate;
          } catch (e) {
            return false;
          }
        
        case 'Все записи':
        default:
          return true;
      }
    });
  }, [entries, dateFilter, customDateRange.start, customDateRange.end]);
  
  // Получаем ключ фильтра для передачи в графики
  const filterKey = filterValueMapping[dateFilter] || 'month';

  // Метки графиков для управления видимостью
  const chartLabels = {
    dynamics: 'Динамика доходов',
    trends: 'Тренды',
    categoryDistribution: 'Распределение по категориям',
    weekdayAnalysis: 'Анализ дней недели',
    rateDistribution: 'Распределение ставок',
    scatter: 'Часы vs Доход',
    hourAnalysis: 'Анализ часов дня',
    forecast: 'Прогноз заработка',
    calendar: 'Календарь доходов',
    categoryEfficiency: 'Доходы по категориям',
  };

  // Переключение видимости графика
  const toggleChartVisibility = (chartKey) => {
    updateChartVisibility({
      [chartKey]: !chartVisibility[chartKey],
    });
  };

  return (
    // ИСПРАВЛЕНО: Убираем mb-6 когда контент закрыт или закрывается, чтобы не было пустого пространства
    <div className={`${isExpanded ? 'mb-6' : 'mb-0'} relative`}>
      {/* Заголовок секции с кнопкой сворачивания и фильтром */}
      {/* ИСПРАВЛЕНО: Уменьшен z-index с z-[100] до z-40, чтобы не перекрывать модальные окна (z-[999999]) */}
      <div className={`glass-effect rounded-xl p-4 mb-4 overflow-visible ${isExpanded ? 'sticky top-0 z-40 backdrop-blur-xl bg-white/90 dark:bg-gray-800/90 shadow-lg transition-normal' : ''}`}>
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-3 hover:opacity-80 transition-normal"
          >
            <BarChart3 className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-bold">Графики</h2>
          </button>
          
          <div className={`flex items-center ${isMobile ? 'gap-2 flex-wrap' : 'gap-3'}`}>
            {/* Режим отображения графиков */}
            {isExpanded && (
              <div className={`flex items-center ${isMobile ? 'gap-1' : 'gap-2'}`}>
                {!isMobile && <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Режим:</span>}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateSettings({ chartDisplay: 'separate' })}
                    className={`${isMobile ? 'px-2 py-1 text-xs' : 'px-3 py-1 text-xs'} font-medium rounded-md transition-all touch-manipulation ${
                      chartDisplay === 'separate'
                        ? 'glass-button text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-300/50 dark:hover:bg-gray-700/50'
                    }`}
                    style={isMobile ? { minHeight: '36px' } : {}}
                  >
                    {isMobile ? 'Раздел' : 'Раздельно'}
                  </button>
                  <button
                    onClick={() => updateSettings({ chartDisplay: 'combined' })}
                    className={`${isMobile ? 'px-2 py-1 text-xs' : 'px-3 py-1 text-xs'} font-medium rounded-md transition-all touch-manipulation ${
                      chartDisplay === 'combined'
                        ? 'glass-button text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-300/50 dark:hover:bg-gray-700/50'
                    }`}
                    style={isMobile ? { minHeight: '36px' } : {}}
                  >
                    {isMobile ? 'Совмест' : 'Совместно'}
                  </button>
                </div>
              </div>
            )}
          
          {/* Фильтр периода - кастомный dropdown с Pin иконками */}
          {isExpanded && (
            <div className={`flex items-center ${isMobile ? 'gap-1' : 'gap-2'}`}>
              {!isMobile && <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Период:</span>}
              {/* ИСПРАВЛЕНО: Используем relative контейнер для absolute позиционирования */}
              <div className="relative">
                {/* Кнопка dropdown */}
                <button
                  ref={buttonRef}
                  onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                  className={`glass-effect ${isMobile ? 'px-3 py-1.5 pr-8 text-xs min-w-[120px]' : 'px-4 py-2 pr-10 text-sm min-w-[180px]'} rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer font-medium text-left transition-normal hover-lift-scale click-shrink touch-manipulation`}
                  style={isMobile ? { minHeight: '36px' } : {}}
                >
                  {dateFilter}
                  <ChevronDownIcon className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 transition-transform duration-200 ${isFilterDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Dropdown меню - absolute позиционирование относительно кнопки, открывается ВНИЗ */}
                {shouldMountFilterDropdown && (
                  <div 
                    ref={dropdownRef}
                    className={`absolute right-0 mt-2 w-64 glass-effect rounded-lg border border-gray-300 dark:border-gray-600 shadow-xl z-[9999] backdrop-blur-lg bg-white/95 dark:bg-gray-800/95 ${
                      !isAnimatingFilterDropdown && !isExitingFilterDropdown ? 'opacity-0 -translate-y-4' : ''
                    } ${
                      isAnimatingFilterDropdown ? 'animate-slide-down' : ''
                    } ${
                      isExitingFilterDropdown ? 'animate-slide-up-out' : ''
                    }`}
                    style={{
                      maxHeight: 'calc(100vh - 100px)',
                      overflowY: 'auto',
                      scrollBehavior: 'smooth',
                    }}
                  >
                    {filterOptions.map((option) => {
                      const filterKey = filterValueMapping[option];
                      // ИСПРАВЛЕНО: Проверка учитывает null (нет дефолтного фильтра)
                      const isDefault = defaultAnalyticsFilter !== null && defaultAnalyticsFilter === filterKey;
                      const isCurrent = dateFilter === option;
                      
                      return (
                        <div
                          key={option}
                          className={`flex items-center justify-between px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-700 last:border-b-0 ${
                            isCurrent ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                          }`}
                        >
                          {/* Текст периода - кликабельный для выбора */}
                          <span
                            onClick={() => {
                              setDateFilter(option);
                              setIsFilterDropdownOpen(false);
                              
                              if (option === 'Выбор даты') {
                                setShowDatePicker(true);
                              } else {
                                setShowDatePicker(false);
                                setCustomDateRange({ start: '', end: '' });
                              }
                            }}
                            className="flex-1 text-sm"
                          >
                            {option}
                          </span>
                          
                          {/* ИСПРАВЛЕНО: Иконка Pin с логикой переключения */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              // ИСПРАВЛЕНО: Если это уже дефолтный фильтр - сбрасываем его, иначе устанавливаем
                              if (isDefault) {
                                setDefaultAnalyticsFilter(null);
                                showSuccess('Фильтр по умолчанию сброшен');
                                logger.log('📌 Дефолтный фильтр сброшен');
                              } else {
                                setDefaultAnalyticsFilter(filterKey);
                                showSuccess(`"${option}" установлен по умолчанию для Аналитики`);
                                logger.log('📌 Дефолтный фильтр (Аналитика):', filterKey);
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
                      );
                    })}
                  </div>
                )}
              </div>
              
              {/* Кнопка управления видимостью графиков - унифицирована с другими dropdown */}
              {/* ИСПРАВЛЕНО: Используем relative контейнер для absolute позиционирования */}
              <div className="relative">
                <button
                  ref={visibilityButtonRef}
                  onClick={() => setIsVisibilityMenuOpen(!isVisibilityMenuOpen)}
                  className={`glass-effect ${isMobile ? 'px-2 py-1 pr-6 text-xs min-w-[80px]' : 'px-4 py-2 pr-10 text-sm min-w-[180px]'} rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer font-medium text-left transition-normal hover-lift-scale click-shrink touch-manipulation`}
                  style={isMobile ? { minHeight: '32px' } : {}}
                  title="Управление видимостью графиков"
                >
                  <span className="flex items-center gap-1.5">
                    <Settings className={isMobile ? "w-3.5 h-3.5" : "w-4 h-4"} />
                    {!isMobile && <span>Графики</span>}
                  </span>
                  <ChevronDownIcon className={`absolute ${isMobile ? 'right-1.5' : 'right-3'} top-1/2 -translate-y-1/2 ${isMobile ? 'w-3 h-3' : 'w-4 h-4'} text-gray-500 transition-transform duration-200 ${isVisibilityMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Dropdown меню - absolute позиционирование относительно кнопки, открывается ВНИЗ */}
                {shouldMountVisibilityMenu && (
                  <div
                    ref={visibilityMenuRef}
                    className={`absolute right-0 mt-2 w-64 glass-effect rounded-lg border border-gray-300 dark:border-gray-600 shadow-xl z-[9999] backdrop-blur-lg bg-white/95 dark:bg-gray-800/95 ${
                      !isAnimatingVisibilityMenu && !isExitingVisibilityMenu ? 'opacity-0 -translate-y-4' : ''
                    } ${
                      isAnimatingVisibilityMenu ? 'animate-slide-down' : ''
                    } ${
                      isExitingVisibilityMenu ? 'animate-slide-up-out' : ''
                    }`}
                    style={{
                      maxHeight: 'calc(100vh - 100px)',
                      overflowY: 'auto',
                      scrollBehavior: 'smooth',
                    }}
                  >
                    {Object.entries(chartLabels).map(([key, label]) => {
                      const isVisible = chartVisibility[key];
                      
                      // ИСПРАВЛЕНО: Проверяем, установлен ли этот конкретный график как видимый по умолчанию
                      // Каждый график имеет свой собственный флаг в defaultChartVisibility
                      const isDefaultForChart = defaultChartVisibility && 
                        defaultChartVisibility[key] === true;
                      
                      return (
                        <div
                          key={key}
                          className="flex items-center justify-between px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                        >
                          {/* Текст графика - кликабельный для переключения видимости */}
                          <span
                            onClick={() => toggleChartVisibility(key)}
                            className="flex-1 text-sm text-gray-900 dark:text-white"
                          >
                            {label}
                          </span>
                          
                          {/* ИСПРАВЛЕНО: Иконка Pin для индивидуального выбора графика */}
                          {/* PIN синий только если этот конкретный график включен по умолчанию */}
                          {/* При клике: переключаем видимость только этого графика по умолчанию */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              
                              // ИСПРАВЛЕНО: Переключаем видимость только этого конкретного графика по умолчанию
                              const currentDefaults = defaultChartVisibility || {};
                              const newDefaults = {
                                ...currentDefaults,
                                [key]: !isDefaultForChart, // Переключаем: если был включен - выключаем, иначе включаем
                              };
                              
                              // Если все графики выключены по умолчанию - сбрасываем в null
                              const hasAnyDefault = Object.values(newDefaults).some(v => v === true);
                              if (!hasAnyDefault) {
                                setDefaultChartVisibility(null);
                                // ИСПРАВЛЕНО: Скрываем все графики когда снимаем последний PIN
                                const allHidden = Object.keys(chartLabels).reduce((acc, key) => {
                                  acc[key] = false;
                                  return acc;
                                }, {});
                                updateChartVisibility(allHidden);
                                showSuccess(`График "${label}" убран из умолчания. Все графики скрыты.`);
                                logger.log('📌 Дефолтная конфигурация графиков сброшена (все выключены)');
                              } else {
                                setDefaultChartVisibility(newDefaults);
                                // ИСПРАВЛЕНО: Применяем новую конфигурацию сразу
                                updateChartVisibility(newDefaults);
                                showSuccess(
                                  isDefaultForChart 
                                    ? `График "${label}" убран из умолчания`
                                    : `График "${label}" установлен как видимый по умолчанию`
                                );
                                logger.log('📌 Дефолтная конфигурация графиков:', newDefaults);
                              }
                            }}
                            className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors hover-lift-scale click-shrink ${
                              isDefaultForChart ? 'text-blue-500' : 'text-gray-400'
                            }`}
                            title={isDefaultForChart ? `График "${label}" включен по умолчанию (клик - выключить)` : `График "${label}" выключен по умолчанию (клик - включить)`}
                          >
                            <Pin className={`w-4 h-4 ${isDefaultForChart ? 'fill-current' : ''}`} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              
              {/* ИСПРАВЛЕНО: Стрелка аккордеона справа от кнопки "Графики" */}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-normal hover-lift-scale click-shrink"
                title={isExpanded ? 'Свернуть' : 'Развернуть'}
                aria-label={isExpanded ? 'Свернуть аккордеон' : 'Развернуть аккордеон'}
              >
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                )}
              </button>
            </div>
          )}
          
          {/* ИСПРАВЛЕНО: Стрелка аккордеона в правом углу, когда аккордеон закрыт */}
          {!isExpanded && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-normal hover-lift-scale click-shrink ml-auto"
              title="Развернуть"
              aria-label="Развернуть аккордеон"
            >
              <ChevronDownIcon className="w-5 h-5 text-gray-500" />
            </button>
          )}
          </div>
        </div>
        
        {/* Выбор даты (если активен) */}
        {isExpanded && showDatePicker && dateFilter === 'Выбор даты' && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">С даты:</label>
                <input
                  type="date"
                  value={customDateRange.start}
                  onChange={(e) => setCustomDateRange({ ...customDateRange, start: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">По дату:</label>
                <input
                  type="date"
                  value={customDateRange.end}
                  onChange={(e) => setCustomDateRange({ ...customDateRange, end: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={() => {
                  setCustomDateRange({ start: '', end: '' });
                  setShowDatePicker(false);
                  setDateFilter('Все записи');
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
      {shouldRenderContent && (
        <div 
          ref={contentRef}
          className={isExpanded ? 'animate-slide-up' : 'animate-slide-out'}
        >
          {/* Объединенный график в режиме combined - скрыт на мобильных */}
          {/* ИСПРАВЛЕНО: Убраны отдельные анимации fade-out - графики анимируются вместе с контейнером через slide-out */}
          {!isMobile && chartDisplay === 'combined' && (chartVisibility.dynamics || chartVisibility.rateDistribution) && (
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
            {chartVisibility.categoryDistribution && (
              <CategoryDistribution entries={filteredEntries} />
            )}
            {chartVisibility.weekdayAnalysis && (
              <WeekdayAnalysisChart entries={filteredEntries} />
            )}
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
            {chartVisibility.hourAnalysis && (
              <HourAnalysisChart entries={filteredEntries} />
            )}
            {chartVisibility.categoryEfficiency && (
              <CategoryEfficiencyChart entries={filteredEntries} />
            )}
          </div>

          {/* Прогноз заработка - во всю ширину */}
          {chartVisibility.forecast && (
            <ForecastChart 
              entries={filteredEntries} 
              dateFilter={filterKey}
            />
          )}

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
  );
}

// Default export для React.lazy()
export default AnalyticsSection;
