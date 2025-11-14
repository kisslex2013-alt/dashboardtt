import { useMemo, useTransition, useState, useRef, useEffect } from 'react';
import { Clock, DollarSign, TrendingUp, TrendingDown, Calendar, Moon, Minus } from 'lucide-react';
import { useEntriesStore } from '../../store/useEntriesStore';
import { calculateDuration } from '../../utils/calculations';
import { timeToMinutes } from '../../utils/dateHelpers';
import { useWorkerCalculation } from '../../hooks/useWorkerCalculation';
import { SkeletonGrid } from '../ui/SkeletonCard';
import { AnimatedCounter } from '../ui/AnimatedCounter';

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
  customDateTo = null
}) {
  // Оптимизированный селектор Zustand - только entries
  const entries = useEntriesStore(state => state.entries);

  /**
   * Фильтрует записи по заданному периоду
   */
  const getFilteredEntries = (filter, dateFrom, dateTo) => {
    const now = new Date();
    
    return entries.filter(entry => {
      const entryDate = new Date(entry.date);
      
      switch (filter) {
        case 'today': {
          return entryDate.toDateString() === now.toDateString();
        }
        
        case 'week': {
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Понедельник
          startOfWeek.setHours(0, 0, 0, 0);
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6);
          endOfWeek.setHours(23, 59, 59, 999);
          return entryDate >= startOfWeek && entryDate <= endOfWeek;
        }
        
        case 'month': {
          return entryDate.getFullYear() === now.getFullYear() && 
                 entryDate.getMonth() === now.getMonth();
        }
        
        case 'year': {
          return entryDate.getFullYear() === now.getFullYear();
        }
        
        case 'custom': {
          if (!dateFrom || !dateTo) return true;
          const from = new Date(dateFrom);
          from.setHours(0, 0, 0, 0);
          const to = new Date(dateTo);
          to.setHours(23, 59, 59, 999);
          return entryDate >= from && entryDate <= to;
        }
        
        default:
          return true;
      }
    });
  };

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
        daysOff: 0
      };
    }

    // Общие часы и заработок
    const totalHours = data.reduce((sum, e) => {
      if (!e.start || !e.end) return sum;
      return sum + parseFloat(calculateDuration(e.start, e.end));
    }, 0);
    
    const totalEarned = data.reduce((sum, e) => sum + (parseFloat(e.earned) || 0), 0);

    // Расчет перерывов между сессиями
    const breaksByDay = data.reduce((acc, entry) => {
      if (!acc[entry.date]) {
        acc[entry.date] = [];
      }
      acc[entry.date].push(entry);
      return acc;
    }, {});

    let totalBreakMinutes = 0;
    Object.values(breaksByDay).forEach(dayEntries => {
      const sorted = [...dayEntries].sort((a, b) => a.start.localeCompare(b.start));
      for (let i = 1; i < sorted.length; i++) {
        const prevEnd = timeToMinutes(sorted[i - 1].end);
        const currentStart = timeToMinutes(sorted[i].start);
        const breakMinutes = (currentStart + 24 * 60 - prevEnd) % (24 * 60);
        if (breakMinutes > 0 && breakMinutes < 12 * 60) { // Игнорируем перерывы > 12 часов
          totalBreakMinutes += breakMinutes;
        }
      }
    });

    // Вычисляем рабочие дни (уникальные даты с записями)
    const workedDays = new Set(data.map(e => e.date));
    const daysWorked = workedDays.size;

    // Вычисляем выходные дни (дни БЕЗ записей в периоде)
    let daysOff = 0;
    const now = new Date();

    if (filter === 'today') {
      daysOff = data.length === 0 ? 1 : 0;
    } else if (filter === 'week') {
      // Текущая неделя (понедельник-воскресенье)
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay() + 1);
      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        if (!workedDays.has(dateStr)) {
          daysOff++;
        }
      }
    } else if (filter === 'month') {
      // Текущий месяц
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(now.getFullYear(), now.getMonth(), i);
        const dateStr = date.toISOString().split('T')[0];
        if (!workedDays.has(dateStr)) {
          daysOff++;
        }
      }
    } else if (filter === 'year') {
      // Текущий год
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const endOfYear = new Date(now.getFullYear(), 11, 31);
      const daysInYear = Math.ceil((endOfYear - startOfYear) / (1000 * 60 * 60 * 24)) + 1;
      for (let i = 0; i < daysInYear; i++) {
        const date = new Date(startOfYear);
        date.setDate(startOfYear.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        if (!workedDays.has(dateStr)) {
          daysOff++;
        }
      }
    } else if (filter === 'custom' && customDateFrom && customDateTo) {
      // Кастомный период
      const from = new Date(customDateFrom);
      const to = new Date(customDateTo);
      const daysInRange = Math.ceil((to - from) / (1000 * 60 * 60 * 24)) + 1;
      for (let i = 0; i < daysInRange; i++) {
        const date = new Date(from);
        date.setDate(from.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        if (!workedDays.has(dateStr)) {
          daysOff++;
        }
      }
    } else {
      // Все время
      if (data.length > 0) {
        const firstDate = new Date(Math.min(...data.map(e => new Date(e.date))));
        const today = new Date();
        const daysInRange = Math.ceil((today - firstDate) / (1000 * 60 * 60 * 24)) + 1;
        for (let i = 0; i < daysInRange; i++) {
          const date = new Date(firstDate);
          date.setDate(firstDate.getDate() + i);
          const dateStr = date.toISOString().split('T')[0];
          if (!workedDays.has(dateStr) && date <= today) {
            daysOff++;
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
      daysOff
    };
  };

  // Получаем статистику для текущего периода (мемоизировано для оптимизации)
  const filtered = useMemo(() => 
    getFilteredEntries(periodFilter, customDateFrom, customDateTo),
    [entries, periodFilter, customDateFrom, customDateTo]
  );
  
  // ОПТИМИЗАЦИЯ: Используем Web Worker для тяжелых вычислений при большом количестве записей
  // Если записей меньше 500, используем синхронный расчет (быстрее для малых данных)
  const shouldUseWorker = filtered.length > 500;
  const { result: workerStats, isLoading: workerLoading } = useWorkerCalculation(
    shouldUseWorker ? filtered : [],
    'statistics',
    periodFilter
  );
  
  // ✅ ПОПЫТКА 14: Использовать startTransition вместо useDeferredValue для батчинга обновлений
  // startTransition позволяет React батчить обновления и приоритизировать рендеринг
  const [isPending, startPendingTransition] = useTransition();
  const [isFilterChanging, setIsFilterChanging] = useState(false);
  const previousPeriodFilter = useRef(periodFilter);
  const isInitialMount = useRef(true);

  // Вычисляем статистику
  const currentStats = useMemo(() => {
    if (shouldUseWorker) {
      return workerStats || {
        totalHours: 0,
        totalEarned: 0,
        avgRate: 0,
        daysWorked: 0,
        totalBreaks: 0,
        daysOff: 0
      };
    } else {
      return calculateDetailedStats(filtered, periodFilter);
    }
  }, [shouldUseWorker, workerStats, filtered, periodFilter]);

  // ✅ Оборачиваем обновление статистики в startTransition для батчинга
  const [statsForDisplay, setStatsForDisplay] = useState(currentStats);

  useEffect(() => {
    // При первом рендере сразу устанавливаем значения без transition
    if (isInitialMount.current) {
      isInitialMount.current = false;
      setStatsForDisplay(currentStats);
      return;
    }

    // Проверяем смену фильтра
    if (previousPeriodFilter.current !== periodFilter) {
      previousPeriodFilter.current = periodFilter;
      setIsFilterChanging(true);
      
      // Оборачиваем обновление в transition для батчинга
      startPendingTransition(() => {
        setStatsForDisplay(currentStats);
      });
      
      // Восстанавливаем анимацию после завершения перехода
      setTimeout(() => setIsFilterChanging(false), 100);
    } else {
      // Для обычных обновлений также используем transition
      startPendingTransition(() => {
        setStatsForDisplay(currentStats);
      });
    }
  }, [currentStats, periodFilter, startPendingTransition]);

  // Получаем статистику для предыдущего периода (если включен режим сравнения)
  const previousStats = useMemo(() => {
    if (!compareMode) return null;
    
    const now = new Date();
    let prevFrom, prevTo;

    if (periodFilter === 'today') {
      const yesterday = new Date();
      yesterday.setDate(now.getDate() - 1);
      prevFrom = prevTo = yesterday.toISOString().split('T')[0];
    } else if (periodFilter === 'week') {
      // Предыдущая неделя
      const lastWeek = new Date(now);
      lastWeek.setDate(now.getDate() - 7);
      const monday = new Date(lastWeek);
      monday.setDate(lastWeek.getDate() - lastWeek.getDay() + 1);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      prevFrom = monday.toISOString().split('T')[0];
      prevTo = sunday.toISOString().split('T')[0];
    } else if (periodFilter === 'month') {
      // Предыдущий месяц
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      prevFrom = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), 1).toISOString().split('T')[0];
      prevTo = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0).toISOString().split('T')[0];
    } else if (periodFilter === 'year') {
      // Предыдущий год
      const prevYear = now.getFullYear() - 1;
      prevFrom = `${prevYear}-01-01`;
      prevTo = `${prevYear}-12-31`;
    }

    if (prevFrom && prevTo) {
      const previousFiltered = getFilteredEntries('custom', prevFrom, prevTo);
      return calculateDetailedStats(previousFiltered, 'custom');
    }
    
    return null;
  }, [compareMode, periodFilter, entries, getFilteredEntries]);

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
    );
  }

  // Компонент карточки статистики
  const StatCard = ({ title, value, numericValue, suffix, decimals = 0, icon: Icon, gradient, accentClass, glowClass, titleColorClass, iconOpacity = '0.3', comparison, periodFilter, immediate }) => {
    // Определяем inline style для иконки с нужной прозрачностью
    const iconColor = accentClass === 'blue-500' ? 'rgba(59, 130, 246, ' + iconOpacity + ')' :
                      accentClass === 'teal-500' ? 'rgba(20, 184, 166, ' + iconOpacity + ')' :
                      accentClass === 'green-500' ? 'rgba(16, 185, 129, ' + iconOpacity + ')' :
                      accentClass === 'purple-500' ? 'rgba(139, 92, 246, ' + iconOpacity + ')' :
                      accentClass === 'orange-500' ? 'rgba(249, 115, 22, ' + iconOpacity + ')' :
                      accentClass === 'yellow-500' ? 'rgba(251, 191, 36, ' + iconOpacity + ')' :
                      'rgba(156, 163, 175, ' + iconOpacity + ')';
    
    // Поддержка обратной совместимости: если передано value (строка), парсим его
    let finalNumericValue = numericValue;
    let finalSuffix = suffix || '';
    let finalDecimals = decimals;
    
    if (value && !numericValue) {
      // Парсим строку (поддержка старого формата)
      const numStr = value.replace(/[^\d.,]/g, '').replace(',', '.');
      finalNumericValue = parseFloat(numStr) || 0;
      
      const suffixMatch = value.match(/(?:\d+[.,]\d+|\d+)\s*(.+)/);
      finalSuffix = suffixMatch ? suffixMatch[1].trim() : '';
      
      const decimalsMatch = value.match(/[\d.,]+/);
      if (decimalsMatch) {
        const numStrMatch = decimalsMatch[0].replace(',', '.');
        const parts = numStrMatch.split('.');
        finalDecimals = parts.length > 1 ? parts[1].length : 0;
      }
    }
    
    // ✅ ИСПРАВЛЕНИЕ: Принудительно округляем значение, если decimals === 0
    if (finalDecimals === 0 && finalNumericValue !== undefined && finalNumericValue !== null) {
      finalNumericValue = Math.round(finalNumericValue);
    }
    
    return (
      <div className={`glass-card relative rounded-2xl p-4 overflow-hidden ${glowClass} ${gradient}`}>
        {/* Процент сравнения в нижнем правом углу */}
        {comparison && (
          <div className="absolute bottom-2 right-2 z-20">
            <ComparisonStat current={comparison.current} previous={comparison.previous} />
          </div>
        )}
        
        <div className="relative z-10">
          <p className={`text-xs font-semibold mb-1 uppercase tracking-wide ${titleColorClass}`}>{title}</p>
          {numericValue !== undefined ? (
            <AnimatedCounter 
              value={finalNumericValue}
              suffix={finalSuffix}
              decimals={finalDecimals}
              className="text-2xl font-bold text-gray-900 dark:text-white leading-tight"
              style={{ whiteSpace: 'nowrap', wordBreak: 'keep-all', overflow: 'hidden', textOverflow: 'ellipsis' }}
              immediate={immediate}
            />
                     ) : (
             <p className="text-2xl font-bold text-gray-900 dark:text-white leading-tight" style={{ whiteSpace: 'nowrap', wordBreak: 'keep-all', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</p>
           )}
         </div>
        
        {Icon && (
          <Icon 
            className="absolute -right-5 -bottom-5 w-24 h-24 pointer-events-none" 
            size={96}
            style={{ color: iconColor }}
          />
        )}
      </div>
    );
  };

  // Компонент сравнения со статистикой
  const ComparisonStat = ({ current, previous }) => {
    if (previous === null || previous === undefined) return null;
    
    const diff = current - previous;
    const percentDiff = previous !== 0 ? ((diff / previous) * 100).toFixed(1) : 0;
    const isPositive = diff > 0;
    const isNeutral = diff === 0;

    return (
      <div 
        className={`
          flex items-center justify-end gap-1 text-xs font-bold whitespace-nowrap
          px-2 py-1 rounded-md
          backdrop-blur-sm
          ${isNeutral 
            ? 'text-gray-700 dark:text-gray-300 bg-gray-500/20 dark:bg-gray-500/30' 
            : isPositive 
              ? 'text-green-700 dark:text-green-200 bg-green-500/20 dark:bg-green-500/30' 
              : 'text-red-700 dark:text-red-200 bg-red-500/20 dark:bg-red-500/30'
          }
        `}
        style={{ 
          textShadow: '0 1px 3px rgba(0,0,0,0.5), 0 0 8px rgba(0,0,0,0.3)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1), inset 0 1px 1px rgba(255,255,255,0.1)'
        }}
      >
        {isNeutral ? (
          <Minus className="w-3.5 h-3.5 flex-shrink-0" />
        ) : isPositive ? (
          <TrendingUp className="w-3.5 h-3.5 flex-shrink-0" />
        ) : (
          <TrendingDown className="w-3.5 h-3.5 flex-shrink-0" />
        )}
        <span>
          {isPositive && '+'}{percentDiff}%
        </span>
      </div>
    );
  };

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
        comparison={compareMode ? { current: statsForDisplay.totalHours, previous: previousStats?.totalHours } : null}
        periodFilter={periodFilter}
        immediate={isFilterChanging}
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
        comparison={compareMode ? { current: statsForDisplay.totalBreaks, previous: previousStats?.totalBreaks } : null}
        periodFilter={periodFilter}
        immediate={isFilterChanging}
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
        comparison={compareMode ? { current: statsForDisplay.totalEarned, previous: previousStats?.totalEarned } : null}
        periodFilter={periodFilter}
        immediate={isFilterChanging}
      />

      {/* Карточка 4: Ставка */}
      <StatCard
        title="Ставка"
        numericValue={statsForDisplay.avgRate}
        suffix=" ₽/ч"
        decimals={0}
        icon={TrendingUp}
        gradient="bg-gradient-to-br from-purple-500/80 to-gray-900/20 dark:from-purple-500/20 dark:to-gray-900/20"
        accentClass="purple-500"
        glowClass="glow-purple"
        titleColorClass="text-purple-600 dark:text-purple-400"
        iconOpacity="0.4"
        comparison={compareMode ? { current: statsForDisplay.avgRate, previous: previousStats?.avgRate } : null}
        periodFilter={periodFilter}
        immediate={isFilterChanging}
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
        comparison={compareMode ? { current: statsForDisplay.daysWorked, previous: previousStats?.daysWorked } : null}
        periodFilter={periodFilter}
        immediate={isFilterChanging}
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
        comparison={compareMode ? { current: statsForDisplay.daysOff || 0, previous: previousStats?.daysOff || 0 } : null}
        periodFilter={periodFilter}
        immediate={isFilterChanging}
      />
    </div>
  );
}
