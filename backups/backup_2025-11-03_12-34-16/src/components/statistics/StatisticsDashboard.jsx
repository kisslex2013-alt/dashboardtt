import { useMemo } from 'react';
import { Clock, DollarSign, TrendingUp, TrendingDown, Calendar, Moon, Minus } from 'lucide-react';
import { useEntriesStore } from '../../store/useEntriesStore';
import { calculateDuration } from '../../utils/calculations';
import { timeToMinutes } from '../../utils/dateHelpers';

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
  
  const currentStats = useMemo(() => 
    calculateDetailedStats(filtered, periodFilter),
    [filtered, periodFilter]
  );

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
  }, [compareMode, periodFilter, entries]);

  // Компонент карточки статистики
  const StatCard = ({ title, value, icon: Icon, gradient, accentClass, glowClass, titleColorClass, iconOpacity = '0.3', comparison }) => {
    // Определяем inline style для иконки с нужной прозрачностью
    const iconColor = accentClass === 'blue-500' ? 'rgba(59, 130, 246, ' + iconOpacity + ')' :
                      accentClass === 'teal-500' ? 'rgba(20, 184, 166, ' + iconOpacity + ')' :
                      accentClass === 'green-500' ? 'rgba(16, 185, 129, ' + iconOpacity + ')' :
                      accentClass === 'purple-500' ? 'rgba(139, 92, 246, ' + iconOpacity + ')' :
                      accentClass === 'orange-500' ? 'rgba(249, 115, 22, ' + iconOpacity + ')' :
                      accentClass === 'yellow-500' ? 'rgba(251, 191, 36, ' + iconOpacity + ')' :
                      'rgba(156, 163, 175, ' + iconOpacity + ')';
    
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
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
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
        value={`${currentStats.totalHours.toFixed(2)} ч.`}
        icon={Clock}
        gradient="bg-gradient-to-br from-blue-500/80 to-gray-900/20 dark:from-blue-500/20 dark:to-gray-900/20"
        accentClass="blue-500"
        glowClass="glow-blue"
        titleColorClass="text-blue-600 dark:text-blue-400"
        comparison={compareMode ? { current: currentStats.totalHours, previous: previousStats?.totalHours } : null}
      />

      {/* Карточка 2: Перерывы */}
      <StatCard
        title="Перерывы"
        value={`${currentStats.totalBreaks.toFixed(2)} ч.`}
        icon={Clock}
        gradient="bg-gradient-to-br from-teal-500/80 to-gray-900/20 dark:from-teal-500/20 dark:to-gray-900/20"
        accentClass="teal-500"
        glowClass="glow-teal"
        titleColorClass="text-teal-600 dark:text-teal-400"
        comparison={compareMode ? { current: currentStats.totalBreaks, previous: previousStats?.totalBreaks } : null}
      />

      {/* Карточка 3: Заработано */}
      <StatCard
        title="Заработано"
        value={`${currentStats.totalEarned.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽`}
        icon={DollarSign}
        gradient="bg-gradient-to-br from-green-500/80 to-gray-900/20 dark:from-green-500/20 dark:to-gray-900/20"
        accentClass="green-500"
        glowClass="glow-green"
        titleColorClass="text-green-600 dark:text-green-400"
        iconOpacity="0.4"
        comparison={compareMode ? { current: currentStats.totalEarned, previous: previousStats?.totalEarned } : null}
      />

      {/* Карточка 4: Ставка */}
      <StatCard
        title="Ставка"
        value={`${currentStats.avgRate.toFixed(0)} ₽/ч`}
        icon={TrendingUp}
        gradient="bg-gradient-to-br from-purple-500/80 to-gray-900/20 dark:from-purple-500/20 dark:to-gray-900/20"
        accentClass="purple-500"
        glowClass="glow-purple"
        titleColorClass="text-purple-600 dark:text-purple-400"
        iconOpacity="0.4"
        comparison={compareMode ? { current: currentStats.avgRate, previous: previousStats?.avgRate } : null}
      />

      {/* Карточка 5: Рабочих дней */}
      <StatCard
        title="Рабочих дней"
        value={`${currentStats.daysWorked} д.`}
        icon={Calendar}
        gradient="bg-gradient-to-br from-orange-500/80 to-gray-900/20 dark:from-orange-500/20 dark:to-gray-900/20"
        accentClass="orange-500"
        glowClass="glow-orange"
        titleColorClass="text-orange-600 dark:text-orange-400"
        comparison={compareMode ? { current: currentStats.daysWorked, previous: previousStats?.daysWorked } : null}
      />

      {/* Карточка 6: Выходных */}
      <StatCard
        title="Выходных"
        value={`${currentStats.daysOff || 0} д.`}
        icon={Moon}
        gradient="bg-gradient-to-br from-yellow-500/80 to-gray-900/20 dark:from-yellow-500/20 dark:to-gray-900/20"
        accentClass="yellow-500"
        glowClass="glow-yellow"
        titleColorClass="text-yellow-600 dark:text-yellow-400"
        comparison={compareMode ? { current: currentStats.daysOff || 0, previous: previousStats?.daysOff || 0 } : null}
      />
    </div>
  );
}
