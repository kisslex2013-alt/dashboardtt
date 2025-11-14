import { useMemo, memo, useCallback, useState } from 'react';
import { useSettingsStore } from '../../../store/useSettingsStore';
import { getDayMetrics } from '../../../utils/dayMetrics';
import { getIcon } from '../../../utils/iconHelper';
import { CheckCircle2, XCircle, AlertCircle, Clock } from 'lucide-react';

/**
 * 📋 Вид сеткой - Dashboard Style
 * - Градиентные заголовки по статусу дня
 * - Крупные метрики в бейджах (часы, ставка, задачи)
 * - Прогресс-бар с градиентом
 * - Компактные карточки записей с hover-эффектом
 * - Статусные иконки в заголовке
 * 
 * ✅ ОПТИМИЗАЦИЯ: Обернут в React.memo для предотвращения лишних ре-рендеров
 */
export const GridView = memo(function GridView({ entries, onEdit, selectionMode = false, selectedEntries = new Set(), onToggleSelection }) {
  const { categories, dailyGoal } = useSettingsStore();
  
  // ✅ ОПТИМИЗАЦИЯ: Инкрементальная загрузка - показываем по 30 дней
  const [visibleCount, setVisibleCount] = useState(30);
  
  // Группировка записей по датам (мемоизировано для оптимизации)
  const groupedEntries = useMemo(() => entries.reduce((acc, entry) => {
    if (!acc[entry.date]) {
      acc[entry.date] = [];
    }
    acc[entry.date].push(entry);
    return acc;
  }, {}), [entries]);
  
  // ✅ ОПТИМИЗАЦИЯ: Мемоизация сортированных дат
  const sortedDates = useMemo(() => {
    return Object.keys(groupedEntries).sort((a, b) => new Date(b) - new Date(a));
  }, [groupedEntries]);
  
  // ✅ ОПТИМИЗАЦИЯ: Ограничиваем отображаемые даты
  const visibleDates = useMemo(() => {
    return sortedDates.slice(0, visibleCount);
  }, [sortedDates, visibleCount]);
  
  // ✅ ОПТИМИЗАЦИЯ: Кнопка "Показать еще" с плавной загрузкой
  const handleLoadMore = useCallback(() => {
    requestAnimationFrame(() => {
      setVisibleCount(prev => Math.min(prev + 30, sortedDates.length));
    });
  }, [sortedDates.length]);
  
  const hasMore = visibleCount < sortedDates.length;
  const remainingCount = sortedDates.length - visibleCount;
  
  // ✅ ОПТИМИЗАЦИЯ: Мемоизированные функции для получения категорий
  const getCategory = useCallback((categoryId) => {
    if (typeof categoryId === 'string') {
      return categories.find(c => c.name === categoryId || c.id === categoryId) || null;
    }
    return categories.find(c => c.id === categoryId) || null;
  }, [categories]);
  
  const getCategoryName = useCallback((categoryIdOrName) => {
    if (typeof categoryIdOrName === 'string') {
      const categoryById = getCategory(categoryIdOrName);
      if (categoryById) {
        return categoryById.name;
      }
      return categoryIdOrName;
    }
    return 'remix';
  }, [getCategory]);
  
  // Функция для получения градиента заголовка по статусу (темные цвета)
  const getHeaderGradient = (status) => {
    if (!status || !status.status) {
      return 'bg-gradient-to-r from-gray-600 to-gray-700';
    }
    
    switch (status.status) {
      case 'success':
        return 'bg-gradient-to-r from-green-600 to-green-700';
      case 'warning':
        return 'bg-gradient-to-r from-yellow-600 to-yellow-700';
      case 'danger':
        return 'bg-gradient-to-r from-red-600 to-red-700';
      default:
        return 'bg-gradient-to-r from-gray-600 to-gray-700';
    }
  };
  
  // Функция для получения цвета текста статуса в бейджах
  const getStatColor = (type, status) => {
    if (!status || !status.status) {
      return type === 'hours' ? 'text-gray-600 dark:text-gray-400' : 
             type === 'rate' ? 'text-blue-600 dark:text-blue-400' : 
             'text-purple-600 dark:text-purple-400';
    }
    
    if (type === 'hours') {
      switch (status.status) {
        case 'success':
          return 'text-green-600 dark:text-green-400';
        case 'warning':
          return 'text-yellow-600 dark:text-yellow-400';
        case 'danger':
          return 'text-red-600 dark:text-red-400';
        default:
          return 'text-gray-600 dark:text-gray-400';
      }
    }
    
    if (type === 'rate') {
      return 'text-blue-600 dark:text-blue-400';
    }
    
    return 'text-purple-600 dark:text-purple-400';
  };
  
  // Функция для получения градиента прогресс-бара
  const getProgressGradient = (status) => {
    if (!status || !status.status) {
      return 'bg-gradient-to-r from-gray-400 via-gray-500 to-gray-600';
    }
    
    switch (status.status) {
      case 'success':
        return 'bg-gradient-to-r from-green-400 via-emerald-500 to-green-600';
      case 'warning':
        return 'bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600';
      case 'danger':
        return 'bg-gradient-to-r from-red-400 via-rose-500 to-red-600';
      default:
        return 'bg-gradient-to-r from-gray-400 via-gray-500 to-gray-600';
    }
  };
  
  // Функция для получения цвета границы итого
  const getTotalBorderColor = (status) => {
    if (!status || !status.status) {
      return 'border-gray-200 dark:border-gray-700';
    }
    
    switch (status.status) {
      case 'success':
        return 'border-green-200 dark:border-green-800';
      case 'warning':
        return 'border-yellow-200 dark:border-yellow-800';
      case 'danger':
        return 'border-red-200 dark:border-red-800';
      default:
        return 'border-gray-200 dark:border-gray-700';
    }
  };
  
  // Функция для получения цвета итого
  const getTotalTextColor = (status) => {
    if (!status || !status.status) {
      return 'text-gray-600 dark:text-gray-400';
    }
    
    switch (status.status) {
      case 'success':
        return 'text-green-600 dark:text-green-400';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'danger':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };
  
  // Функция для получения иконки статуса
  const getStatusIcon = (status) => {
    if (!status || !status.status) {
      return <Clock className="w-6 h-6" />;
    }
    
    switch (status.status) {
      case 'success':
        return <CheckCircle2 className="w-6 h-6" />;
      case 'warning':
        return <AlertCircle className="w-6 h-6" />;
      case 'danger':
        return <XCircle className="w-6 h-6" />;
      default:
        return <Clock className="w-6 h-6" />;
    }
  };
  
  // Функция для получения процента прогресса с учетом превышения
  const getProgressPercent = (earned, plan) => {
    if (!plan || plan === 0) return 0;
    const percent = Math.round((earned / plan) * 100);
    return Math.min(percent, 100); // Ограничиваем до 100% для визуализации
  };
  
  // Функция для получения процента прогресса для отображения (может быть > 100%)
  const getProgressPercentDisplay = (earned, plan) => {
    if (!plan || plan === 0) return 0;
    return Math.round((earned / plan) * 100);
  };
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleDates.map((date) => {
          const dateEntries = groupedEntries[date];
          // Используем getDayMetrics для получения всех метрик
          const metrics = getDayMetrics(dateEntries, dailyGoal);
          
          const dateObj = new Date(date);
          // Форматируем дату: "28 Октября"
          const day = dateObj.getDate();
          const month = dateObj.toLocaleDateString('ru-RU', { month: 'long' });
          const formattedDate = `${day} ${month.charAt(0).toUpperCase() + month.slice(1)}`;
          
          // День недели
          const weekday = dateObj.toLocaleDateString('ru-RU', { weekday: 'long' });
          const weekdayFormatted = weekday.charAt(0).toUpperCase() + weekday.slice(1);
          
          const progressPercent = getProgressPercent(metrics.totalEarned, dailyGoal);
          const progressPercentDisplay = getProgressPercentDisplay(metrics.totalEarned, dailyGoal);
          
          // Средняя ставка (из метрик)
          const averageRate = metrics.averageRate || 0;
          
          // Количество задач (записей)
          const tasksCount = dateEntries.length;
          
          // Самая длинная пауза (из метрик)
          const longestBreak = metrics.longestBreak || '0:00';
          
          return (
            <div 
              key={date} 
              className="glass-effect entry-card rounded-2xl overflow-hidden hover:shadow-2xl hover:border-blue-300 dark:hover:border-blue-600 transition-normal shadow-xl snap-start hover-lift-scale"
            >
              {/* Заголовок с градиентом */}
              <div className={`${getHeaderGradient(metrics.status)} p-3 text-white`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold">{formattedDate}</h3>
                    <span className="text-sm opacity-90">{weekdayFormatted}</span>
                  </div>
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    {getStatusIcon(metrics.status)}
                  </div>
                </div>
              </div>
              
              {/* Статистика */}
              <div className="p-4">
                {/* Статистические бейджи (компактные) */}
                <div className="flex items-center gap-2 mb-3">
                  {/* Часы */}
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs border ${
                    metrics.status?.status === 'success' ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700' :
                    metrics.status?.status === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700' :
                    metrics.status?.status === 'danger' ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700' :
                    'bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600'
                  }`}>
                    <span className="text-[10px] opacity-75">Часы:</span>
                    <span className="font-medium whitespace-nowrap">{metrics.totalHours.toFixed(1)}</span>
                  </div>
                  
                  {/* Ставка */}
                  <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 text-xs">
                    <span className="text-[10px] opacity-75">Ставка:</span>
                    <span className="font-medium whitespace-nowrap">{averageRate} ₽/ч</span>
                  </div>
                  
                  {/* Задачи */}
                  <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700 text-xs">
                    <span className="text-[10px] opacity-75">Задач:</span>
                    <span className="font-medium">{tasksCount}</span>
                  </div>
                  
                  {/* Макс. пауза */}
                  <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-700 text-xs">
                    <span className="text-[10px] opacity-75">Пауза:</span>
                    <span className="font-medium">{longestBreak}</span>
                  </div>
                </div>
                
                {/* Прогресс-бар */}
                {dailyGoal > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-600 dark:text-gray-400">Прогресс дня</span>
                      <span className={`font-bold ${getStatColor('hours', metrics.status)}`}>
                        {progressPercentDisplay}%
                      </span>
                    </div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${getProgressGradient(metrics.status)} transition-normal`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                )}
                
                {/* Записи */}
                <div className="space-y-2">
                  {dateEntries.map(entry => {
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
                    
                    // Получаем категорию для названия и иконки
                    const categoryValue = entry.category || entry.categoryId;
                    const category = getCategory(categoryValue) || 
                      (typeof categoryValue === 'string' ? categories.find(c => c.name === categoryValue) : null);
                    
                    const categoryName = getCategoryName(categoryValue);
                    const CategoryIcon = category && category.icon ? getIcon(category.icon) : null;
                    const categoryColor = category && category.color ? category.color : '#6B7280';
                    const rate = duration > 0 ? Math.round(earned / parseFloat(duration)) : 0;
                    
                    return (
                      <div 
                        key={entry.id}
                        onClick={() => onEdit && onEdit(entry)}
                        className={`
                          bg-white/50 dark:bg-gray-700/50 rounded-lg p-2 
                          hover:bg-white/80 dark:hover:bg-gray-600/50 
                          transition-colors cursor-pointer
                          ${selectionMode ? 'relative' : ''}
                        `}
                      >
                        {/* Чекбокс для выбора (если включен режим выбора) */}
                        {selectionMode && (
                          <div 
                            className="absolute top-2 left-2 z-10"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleSelection && onToggleSelection(entry.id);
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={selectedEntries.has(entry.id)}
                              onChange={() => {}}
                              className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                            />
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between mb-1">
                          <div className={`flex items-center gap-1.5 ${selectionMode ? 'ml-6' : ''}`}>
                            {CategoryIcon && (
                              <CategoryIcon 
                                className="w-3.5 h-3.5 flex-shrink-0" 
                                style={{ color: categoryColor }}
                              />
                            )}
                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                              {categoryName}
                            </span>
                          </div>
                          <span className="text-sm font-bold text-gray-800 dark:text-gray-100">
                            {earned} ₽
                          </span>
                        </div>
                        {timeRange && (
                          <div className="flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-400">
                            <span>{timeRange}</span>
                            <span>{parseFloat(duration).toFixed(1)} часа • {rate} ₽/ч</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {/* Итого */}
                <div className={`mt-4 pt-3 border-t-2 ${getTotalBorderColor(metrics.status)}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">ИТОГО ЗА ДЕНЬ:</span>
                    <span className={`text-2xl font-bold ${getTotalTextColor(metrics.status)}`}>
                      {metrics.totalEarned} ₽
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* ✅ ОПТИМИЗАЦИЯ: Кнопка "Показать еще" */}
      {hasMore && (
        <div className="flex justify-center py-4">
          <button
            onClick={handleLoadMore}
            className="glass-button px-6 py-3 rounded-lg font-semibold text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300 hover:scale-105 active:scale-95"
          >
            Показать еще {Math.min(30, remainingCount)} дней (осталось {remainingCount})
          </button>
        </div>
      )}
    </div>
  );
});
