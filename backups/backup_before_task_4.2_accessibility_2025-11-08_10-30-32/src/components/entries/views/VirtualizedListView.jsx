import { useMemo, useRef, useState, useCallback, useEffect } from 'react';
// react-window 2.2.2 использует новый API - List вместо VariableSizeList
import { List, useDynamicRowHeight } from 'react-window';
import { ChevronDown, Clock, AlertTriangle, DollarSign, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { useSettingsStore } from '../../../store/useSettingsStore';
import { getDayMetrics } from '../../../utils/dayMetrics';
import { getIcon } from '../../../utils/iconHelper';
import { formatHoursToTime } from '../../../utils/formatting';

/**
 * 📋 Виртуализированный вид списком
 * - Использует react-window для оптимизации больших списков
 * - Виртуализирует группы дней (не отдельные записи)
 * - Автоматически вычисляет высоту каждой группы
 * - Поддерживает аккордеоны с динамической высотой
 */
export function VirtualizedListView({ entries, onEdit, selectionMode = false, selectedEntries = new Set(), onToggleSelection }) {
  const { categories, dailyGoal } = useSettingsStore();
  const listRef = useRef(null);
  const [openGroups, setOpenGroups] = useState(new Set()); // Отслеживаем открытые аккордеоны
  
  // Группировка записей по датам (мемоизировано)
  const groupedEntriesArray = useMemo(() => {
    const grouped = entries.reduce((acc, entry) => {
      if (!acc[entry.date]) {
        acc[entry.date] = [];
      }
      acc[entry.date].push(entry);
      return acc;
    }, {});
    
    // Преобразуем в массив и сортируем
    return Object.entries(grouped)
      .sort(([dateA], [dateB]) => new Date(dateB) - new Date(dateA));
  }, [entries]);
  
  // Используем useDynamicRowHeight для динамического вычисления высоты строк
  // ИСПРАВЛЕНО: Убрали openGroups.size из key - это вызывало пересоздание объекта при каждом открытии/закрытии аккордеона
  // Это было основной причиной тормозов при больших списках
  const dynamicRowHeight = useDynamicRowHeight({ 
    defaultRowHeight: 60, // Минимальная высота закрытого аккордеона
    key: `virtualized-${groupedEntriesArray.length}` // Только длина массива, не состояние открытых групп
  });
  
  // Функция для получения категории
  const getCategory = useCallback((categoryIdOrName) => {
    if (typeof categoryIdOrName === 'string') {
      // ✅ СТАНДАРТИЗАЦИЯ ID: Конвертируем в строку для корректного сравнения
      return categories.find(c => c.name === categoryIdOrName || String(c.id) === categoryIdOrName) || null;
    }
    // ✅ СТАНДАРТИЗАЦИЯ ID: Конвертируем в строку для корректного сравнения
    const categoryIdString = String(categoryIdOrName);
    return categories.find(c => String(c.id) === categoryIdString) || null;
  }, [categories]);
  
  const getCategoryName = useCallback((categoryIdOrName) => {
    if (typeof categoryIdOrName === 'string') {
      // ✅ СТАНДАРТИЗАЦИЯ ID: Конвертируем в строку для корректного сравнения
      const categoryById = categories.find(c => String(c.id) === categoryIdOrName);
      if (categoryById) {
        return categoryById.name;
      }
      return categoryIdOrName;
    }
    return 'remix';
  }, [categories]);
  
  // Вычисление высоты группы
  // Используется для инициализации и обновления динамической высоты
  const getItemSize = useCallback((index, rowProps = {}) => {
    // Защита от пустого массива или неверного индекса
    if (!groupedEntriesArray || index >= groupedEntriesArray.length || index < 0) {
      return 60; // Минимальная высота
    }
    
    const group = groupedEntriesArray[index];
    if (!group) {
      return 60; // Минимальная высота
    }
    
    const [date, dateEntries] = group;
    if (!date || !dateEntries) {
      return 60; // Минимальная высота
    }
    
    const isOpen = openGroups.has(date);
    
    // Базовая высота заголовка аккордеона
    const headerHeight = 60;
    
    if (!isOpen) {
      return headerHeight;
    }
    
    // Высота открытого аккордеона = заголовок + высота таблицы
    const tableHeaderHeight = selectionMode ? 40 : 0; // Заголовок таблицы если есть
    const rowHeight = 48; // Высота одной строки записи
    const tablePadding = 16; // Отступы таблицы
    
    const entriesHeight = dateEntries.length * rowHeight;
    return headerHeight + tableHeaderHeight + entriesHeight + tablePadding;
  }, [groupedEntriesArray, openGroups, selectionMode]);
  
  // ИСПРАВЛЕНО: Оптимизированная инициализация с батчингом для больших списков
  // Обновляем высоты порциями, чтобы не блокировать UI
  const heightsInitialized = useRef(false);
  useEffect(() => {
    if (groupedEntriesArray && groupedEntriesArray.length > 0) {
      heightsInitialized.current = false;
      
      // Батчинг обновлений высот для производительности
      const batchSize = 50; // Обновляем по 50 строк за раз
      let currentIndex = 0;
      
      const updateBatch = () => {
        const endIndex = Math.min(currentIndex + batchSize, groupedEntriesArray.length);
        for (let i = currentIndex; i < endIndex; i++) {
          const height = getItemSize(i);
          dynamicRowHeight.setRowHeight(i, height);
        }
        currentIndex = endIndex;
        
        if (currentIndex < groupedEntriesArray.length) {
          requestAnimationFrame(updateBatch);
        } else {
          heightsInitialized.current = true;
        }
      };
      
      requestAnimationFrame(updateBatch);
    }
  }, [groupedEntriesArray.length, dynamicRowHeight, getItemSize]); // Только при изменении количества групп
  
  // Оптимизированное переключение открытия/закрытия группы
  const toggleGroup = useCallback((date) => {
    setOpenGroups(prev => {
      const newSet = new Set(prev);
      const wasOpen = newSet.has(date);
      
      if (wasOpen) {
        newSet.delete(date);
      } else {
        newSet.add(date);
      }
      
      // Используем requestAnimationFrame для оптимизации обновления высоты
      // Это решает проблему с тормозами при больших списках
      requestAnimationFrame(() => {
        const index = groupedEntriesArray.findIndex(([d]) => d === date);
        if (index >= 0) {
          // Вычисляем новую высоту для этой строки
          const newHeight = getItemSize(index, {});
          if (newHeight) {
            dynamicRowHeight.setRowHeight(index, newHeight);
          }
        }
      });
      
      return newSet;
    });
  }, [groupedEntriesArray, dynamicRowHeight, getItemSize]);
  
  // Функция для получения цвета прогресс-бара
  const getProgressBarColor = (status) => {
    if (!status || !status.status) return 'bg-gray-400';
    switch (status.status) {
      case 'success': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'danger': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };
  
  const getStatusTextColor = (status) => {
    if (!status || !status.status) return 'text-gray-600';
    switch (status.status) {
      case 'success': return 'text-green-600 dark:text-green-400';
      case 'warning': return 'text-yellow-600 dark:text-yellow-400';
      case 'danger': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600';
    }
  };
  
  const getStatusIcon = (status) => {
    if (!status || !status.status) return null;
    switch (status.status) {
      case 'success': return <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />;
      case 'warning': return <AlertCircle className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />;
      case 'danger': return <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />;
      default: return null;
    }
  };
  
  // Расчет перерыва между записями
  const calculateBreak = (entryEnd, nextEntryStart) => {
    if (!entryEnd || !nextEntryStart) return null;
    const [endH, endM] = entryEnd.split(':').map(Number);
    const [startH, startM] = nextEntryStart.split(':').map(Number);
    const endMinutes = endH * 60 + endM;
    const startMinutes = startH * 60 + startM;
    let breakMinutes = startMinutes - endMinutes;
    if (breakMinutes < 0) breakMinutes += 24 * 60;
    const hours = Math.floor(breakMinutes / 60);
    const minutes = breakMinutes % 60;
    if (hours === 0 && minutes === 0) return null;
    if (hours === 0 && minutes < 30) return null;
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };
  
  // ИСПРАВЛЕНО: Кэширование вычислений метрик для каждой группы
  // Это критично для производительности при больших списках
  const groupMetricsCache = useRef(new Map());
  
  const getGroupMetrics = useCallback((dateEntries) => {
    // Создаем ключ кэша из ID записей
    const cacheKey = dateEntries.map(e => e.id).join(',');
    
    if (groupMetricsCache.current.has(cacheKey)) {
      return groupMetricsCache.current.get(cacheKey);
    }
    
    // Вычисляем метрики и сортируем записи только один раз
    const metrics = getDayMetrics(dateEntries, dailyGoal);
    const sortedEntries = [...dateEntries].sort((a, b) => {
      if (!a.start || !b.start) return 0;
      return b.start.localeCompare(a.start);
    });
    
    const result = { metrics, sortedEntries };
    groupMetricsCache.current.set(cacheKey, result);
    
    // Ограничиваем размер кэша (максимум 1000 записей)
    if (groupMetricsCache.current.size > 1000) {
      const firstKey = groupMetricsCache.current.keys().next().value;
      groupMetricsCache.current.delete(firstKey);
    }
    
    return result;
  }, [dailyGoal]);
  
  // Очистка кэша при изменении entries
  useEffect(() => {
    groupMetricsCache.current.clear();
  }, [entries.length]);
  
  // Оптимизированный обработчик редактирования записи
  const handleEdit = useCallback((entry) => {
    if (onEdit) {
      // Используем requestAnimationFrame для оптимизации
      requestAnimationFrame(() => {
        onEdit(entry);
      });
    }
  }, [onEdit]);
  
  // Рендер одного элемента списка (группы дня)
  // react-window 2.2.2 использует новый API с rowComponent
  // Row получает: { index, style, ariaAttributes }
  const Row = useCallback(({ index, style }) => {
    // Защита от пустого массива или неверного индекса
    if (!groupedEntriesArray || index >= groupedEntriesArray.length || index < 0) {
      return null;
    }
    
    const group = groupedEntriesArray[index];
    if (!group) {
      return null;
    }
    
    const [date, dateEntries] = group;
    if (!date || !dateEntries || !Array.isArray(dateEntries)) {
      return null;
    }
    
    // ИСПРАВЛЕНО: Используем кэшированные вычисления вместо повторных расчетов
    const { metrics, sortedEntries } = getGroupMetrics(dateEntries);
    const dateObj = new Date(date);
    const isOpen = openGroups.has(date);
    
    const day = dateObj.getDate();
    const month = dateObj.toLocaleDateString('ru-RU', { month: 'short' });
    const weekdayShort = dateObj.toLocaleDateString('ru-RU', { weekday: 'short' }).toUpperCase();
    const formattedDate = `${day} ${month} ${weekdayShort}`;
    
    const progressPercent = dailyGoal > 0 
      ? Math.min(Math.round((metrics.totalEarned / dailyGoal) * 100), 100)
      : 0;
    
    return (
      <div style={style}>
        <details 
          open={isOpen}
          className="glass-effect rounded-lg overflow-hidden snap-start mb-2"
        >
          <summary 
            className="cursor-pointer relative overflow-hidden list-none"
            onClick={(e) => {
              e.preventDefault();
              toggleGroup(date);
            }}
          >
            {/* Фоновый прогресс-бар */}
            <div 
              className={`absolute inset-0 opacity-10 ${getProgressBarColor(metrics.status)}`}
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
            
            {/* Содержимое summary */}
            <div className="relative px-3 py-2 flex items-center justify-between gap-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
              {/* Левая часть: Дата и статус */}
              <div className="flex items-center gap-2 min-w-0">
                <ChevronDown className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
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
          {isOpen && (
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
                  {sortedEntries.map((entry) => {
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
                    const timeRange = entry.start 
                      ? entry.end 
                        ? `${entry.start} - ${entry.end}`
                        : `${entry.start} (в процессе)`
                      : '';
                    
                    const categoryValue = entry.category || entry.categoryId;
                    const category = getCategory(categoryValue);
                    const CategoryIcon = category && category.icon ? getIcon(category.icon) : null;
                    const categoryColor = category && category.color ? category.color : '#6B7280';
                    const categoryName = getCategoryName(categoryValue);
                    
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
                        onDoubleClick={(e) => {
                          // Оптимизированный обработчик двойного клика
                          e.stopPropagation();
                          e.preventDefault();
                          handleEdit(entry);
                        }}
                        title="Двойной клик для редактирования"
                      >
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
          )}
        </details>
      </div>
    );
  }, [groupedEntriesArray, openGroups, categories, dailyGoal, getCategory, getCategoryName, handleEdit, selectionMode, selectedEntries, onToggleSelection, toggleGroup, getGroupMetrics]);
  
  // Высота контейнера для виртуализации (858px из EntriesList)
  const containerHeight = 858;
  
  // Порог включения виртуализации: >100 групп или >500 записей
  // Повышен порог для уменьшения задержек на небольших списках
  const shouldVirtualize = (groupedEntriesArray && groupedEntriesArray.length > 100) || entries.length > 500;
  
  if (!shouldVirtualize) {
    // Если не нужно виртуализировать, возвращаем null
    // EntriesList автоматически использует обычный ListView как fallback
    return null;
  }
  
  // Защита от пустого массива
  if (!groupedEntriesArray || groupedEntriesArray.length === 0) {
    return null;
  }
  
  return (
    <div className="virtualized-list-container">
      <List
        listRef={listRef}
        height={containerHeight}
        rowCount={groupedEntriesArray.length}
        rowHeight={dynamicRowHeight} // Используем динамическую высоту вместо функции
        width="100%"
        className="custom-scrollbar"
        overscanCount={3} // Уменьшено для улучшения производительности
        rowComponent={Row}
        rowProps={{}} // Обязательный проп для react-window 2.2.2
      />
      
      {/* Информация о виртуализации */}
      <div className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">
        Виртуализация активна: показано {groupedEntriesArray.length} групп из {entries.length} записей
      </div>
    </div>
  );
}
