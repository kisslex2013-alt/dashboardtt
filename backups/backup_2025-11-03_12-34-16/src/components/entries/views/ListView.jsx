import { ChevronDown, Clock, AlertTriangle, DollarSign, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { useSettingsStore } from '../../../store/useSettingsStore';
import { getDayMetrics } from '../../../utils/dayMetrics';
import { getIcon } from '../../../utils/iconHelper';
import { formatHoursToTime } from '../../../utils/formatting';

/**
 * 📋 Вид списком - Вариант 2: Плотный аккордеон
 * - Максимально компактный аккордеон - минимум пустого пространства
 * - Однострочный заголовок с датой, статусом и итогом
 * - Встроенный прогресс-бар в заголовке (фон)
 * - Компактная таблица записей без лишних отступов
 * - Минимальные отступы между элементами
 * - Инсайты в виде компактных значков
 */
export function ListView({ entries, onEdit, selectionMode = false, selectedEntries = new Set(), onToggleSelection }) {
  const { categories, dailyGoal } = useSettingsStore();
  
  // Группировка записей по датам
  const groupedEntries = entries.reduce((acc, entry) => {
    if (!acc[entry.date]) {
      acc[entry.date] = [];
    }
    acc[entry.date].push(entry);
    return acc;
  }, {});
  
  // Функция для получения категории (полного объекта) по ID или имени
  const getCategory = (categoryIdOrName) => {
    if (typeof categoryIdOrName === 'string') {
      return categories.find(c => c.name === categoryIdOrName || c.id === categoryIdOrName) || null;
    }
    return categories.find(c => c.id === categoryIdOrName) || null;
  };
  
  // Функция для получения названия категории по ID
  const getCategoryName = (categoryIdOrName) => {
    if (typeof categoryIdOrName === 'string') {
      const categoryById = categories.find(c => c.id === categoryIdOrName);
      if (categoryById) {
        return categoryById.name;
      }
      return categoryIdOrName;
    }
    return 'remix';
  };
  
  // Функция для получения цвета прогресс-бара по статусу
  const getProgressBarColor = (status) => {
    if (!status || !status.status) return 'bg-gray-400';
    
    switch (status.status) {
      case 'success':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'danger':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };
  
  // Функция для получения цвета текста статуса
  const getStatusTextColor = (status) => {
    if (!status || !status.status) return 'text-gray-600';
    
    switch (status.status) {
      case 'success':
        return 'text-green-600 dark:text-green-400';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'danger':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600';
    }
  };
  
  // Функция для получения иконки статуса
  const getStatusIcon = (status) => {
    if (!status || !status.status) return null;
    
    switch (status.status) {
      case 'success':
        return <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />;
      case 'warning':
        return <AlertCircle className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />;
      case 'danger':
        return <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />;
      default:
        return null;
    }
  };
  
  // Функция для расчета перерыва между записями
  const calculateBreak = (entryEnd, nextEntryStart) => {
    if (!entryEnd || !nextEntryStart) return null;
    
    const [endH, endM] = entryEnd.split(':').map(Number);
    const [startH, startM] = nextEntryStart.split(':').map(Number);
    
    const endMinutes = endH * 60 + endM;
    const startMinutes = startH * 60 + startM;
    
    let breakMinutes = startMinutes - endMinutes;
    if (breakMinutes < 0) {
      breakMinutes += 24 * 60; // Работа через полночь
    }
    
    const hours = Math.floor(breakMinutes / 60);
    const minutes = breakMinutes % 60;
    
    if (hours === 0 && minutes === 0) return null;
    if (hours === 0 && minutes < 30) return null; // Перерыв меньше 30 минут не показываем
    
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };
  
  // Используем общую утилиту форматирования (formatHoursToTime импортирована)
  
  return (
    <div className="space-y-2">
      {Object.entries(groupedEntries)
        .sort(([dateA], [dateB]) => new Date(dateB) - new Date(dateA))
        .map(([date, dateEntries], idx) => {
          const metrics = getDayMetrics(dateEntries, dailyGoal);
          const dateObj = new Date(date);
          
          // Форматируем дату в коротком формате: "29 Окт ПН"
          const day = dateObj.getDate();
          const month = dateObj.toLocaleDateString('ru-RU', { month: 'short' });
          const weekdayShort = dateObj.toLocaleDateString('ru-RU', { weekday: 'short' }).toUpperCase();
          const formattedDate = `${day} ${month} ${weekdayShort}`;
          
          // Процент выполнения плана
          const progressPercent = dailyGoal > 0 
            ? Math.min(Math.round((metrics.totalEarned / dailyGoal) * 100), 100)
            : 0;
          
          // Сортируем записи по времени начала (от новых к старым - от конца дня к началу)
          const sortedEntries = [...dateEntries].sort((a, b) => {
            if (!a.start || !b.start) return 0;
            return b.start.localeCompare(a.start); // Обратная сортировка: от конца дня к началу
          });
          
          return (
            <details 
              key={date} 
              open={idx === 0}
              className="glass-effect rounded-lg overflow-hidden snap-start"
            >
              <summary className="cursor-pointer relative overflow-hidden list-none">
                {/* Фоновый прогресс-бар */}
                <div 
                  className={`absolute inset-0 opacity-10 ${getProgressBarColor(metrics.status)}`}
                  style={{ width: `${Math.min(progressPercent, 100)}%` }}
                />
                
                {/* Содержимое summary */}
                <div className="relative px-3 py-2 flex items-center justify-between gap-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                  {/* Левая часть: Дата и статус */}
                  <div className="flex items-center gap-2 min-w-0">
                    <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 chevron-icon flex-shrink-0" />
                    <span className="font-semibold text-gray-800 dark:text-white whitespace-nowrap">
                      {formattedDate}
                    </span>
                    {metrics.status && metrics.status.status && (
                      <>
                        {getStatusIcon(metrics.status)}
                        <span className={`text-xs font-medium whitespace-nowrap ${getStatusTextColor(metrics.status)}`}>
                          {progressPercent}%
                        </span>
                      </>
                    )}
                  </div>
                  
                  {/* Центр: Компактные инсайты */}
                  <div className="hidden md:flex items-center gap-2 text-xs">
                    <span 
                      title="Общее время работы" 
                      className="flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700"
                    >
                      <Clock className="w-3 h-3 flex-shrink-0" />
                      <span className="font-medium">{metrics.totalWorkTime || formatHoursToTime(metrics.totalHours)}</span>
                    </span>
                    <span 
                      title="Всего перерывов" 
                      className="flex items-center gap-1 px-2 py-1 rounded-md bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-700"
                    >
                      <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                      <span className="font-medium">{metrics.totalBreaks || '0:00'}</span>
                    </span>
                    <span 
                      title="Ср. ставка" 
                      className="flex items-center gap-1 px-2 py-1 rounded-md bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700"
                    >
                      <DollarSign className="w-3 h-3 flex-shrink-0" />
                      <span className="font-medium">{metrics.averageRate}₽</span>
                    </span>
                  </div>
                  
                  {/* Правая часть: Итого */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {metrics.totalHours.toFixed(2)}ч
                    </span>
                    <span className={`text-lg font-bold ${getStatusTextColor(metrics.status)}`}>
                      {metrics.totalEarned}₽
                    </span>
                  </div>
                </div>
              </summary>
              
              {/* Содержимое аккордеона */}
              <div className="border-t border-gray-200 dark:border-gray-700">
                <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
                  {selectionMode && (
                    <thead>
                      <tr>
                        <th className="px-3 py-1.5 w-10"></th>
                        <th className="px-3 py-1.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Время</th>
                        <th className="px-3 py-1.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Категория</th>
                        <th className="px-3 py-1.5 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Часы</th>
                        <th className="px-3 py-1.5 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Доход</th>
                      </tr>
                    </thead>
                  )}
                  <tbody>
                    {sortedEntries.map((entry, entryIdx) => {
                      const duration = entry.duration 
                        ? parseFloat(entry.duration).toFixed(2)
                        : (() => {
                            if (entry.start && entry.end) {
                              const [startH, startM] = entry.start.split(':').map(Number);
                              const [endH, endM] = entry.end.split(':').map(Number);
                              const minutes = (endH * 60 + endM) - (startH * 60 + startM);
                              return (minutes / 60).toFixed(2);
                            }
                            return '0.00';
                          })();
                      
                      const earned = Math.round(parseFloat(entry.earned) || 0);
                      const timeRange = entry.start && entry.end 
                        ? `${entry.start} - ${entry.end}`
                        : '';
                      
                      // Получаем категорию для иконки и цвета
                      const categoryValue = entry.category || entry.categoryId;
                      const category = getCategory(categoryValue);
                      const CategoryIcon = category && category.icon ? getIcon(category.icon) : null;
                      const categoryColor = category && category.color ? category.color : '#6B7280';
                      const categoryName = getCategoryName(categoryValue);
                      
                      // Рассчитываем перерыв (ищем следующую запись по времени начала, а не по индексу)
                      // Т.к. записи отсортированы от конца к началу, нужно найти запись с start > entry.end
                      let nextEntryByTime = null;
                      if (entry.end) {
                        for (let i = 0; i < sortedEntries.length; i++) {
                          const potentialNext = sortedEntries[i];
                          if (potentialNext.start && potentialNext.start > entry.end) {
                            nextEntryByTime = potentialNext;
                            break;
                          }
                        }
                      }
                      const breakTime = calculateBreak(entry.end, nextEntryByTime?.start);
                      
                      return (
                        <tr
                          key={entry.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-300 border-b border-gray-100 dark:border-gray-700 last:border-b-0 cursor-pointer group"
                          style={{ 
                            transform: 'translateY(0) translateZ(0)',
                            willChange: 'transform',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-3px) translateZ(0)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0) translateZ(0)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                          onDoubleClick={() => onEdit && onEdit(entry)}
                          title="Двойной клик для редактирования"
                        >
                          {/* Чекбокс для выбора (если включен режим выбора) */}
                          {selectionMode && (
                            <td className="px-3 py-1.5 align-middle" style={{ verticalAlign: 'middle', width: '40px' }}>
                              <input
                                type="checkbox"
                                checked={selectedEntries.has(entry.id)}
                                onChange={() => onToggleSelection && onToggleSelection(entry.id)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                              />
                            </td>
                          )}
                          
                          <td className="px-3 py-1.5 align-middle font-mono text-xs text-gray-600 dark:text-gray-400" style={{ verticalAlign: 'middle' }}>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span>{timeRange}</span>
                              {breakTime && (
                                <span className="text-[10px] px-1 py-0.5 rounded bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 font-medium">
                                  ⚠ {breakTime}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-1.5 align-middle" style={{ verticalAlign: 'middle' }}>
                            <div className="flex items-center gap-1 text-xs">
                              {CategoryIcon && (
                                <CategoryIcon 
                                  className="w-3 h-3 flex-shrink-0" 
                                  style={{ color: categoryColor }}
                                />
                              )}
                              <span className="text-gray-700 dark:text-gray-300">
                                {categoryName}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-1.5 align-middle text-right text-xs text-gray-500 dark:text-gray-400" style={{ verticalAlign: 'middle' }}>
                            {duration}ч
                          </td>
                          <td className="px-3 py-1.5 align-middle text-right font-semibold text-gray-800 dark:text-gray-200" style={{ verticalAlign: 'middle' }}>
                            {earned}₽
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </details>
          );
        })}
    </div>
  );
}
