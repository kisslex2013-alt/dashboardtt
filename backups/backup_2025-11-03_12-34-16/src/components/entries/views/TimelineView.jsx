import { useSettingsStore } from '../../../store/useSettingsStore';
import { getDayMetrics } from '../../../utils/dayMetrics';
import { getIcon } from '../../../utils/iconHelper';
import { CheckCircle2, XCircle, AlertCircle, Clock, AlertTriangle, DollarSign } from 'lucide-react';

/**
 * 📋 Вид таймлайном с вертикальной линией времени
 * - Вертикальная линия с точками для каждого дня
 * - Карточки справа от линии с записями
 * - Хронологическое отображение
 */
export function TimelineView({ entries, onEdit, selectionMode = false, selectedEntries = new Set(), onToggleSelection }) {
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
    // Если это уже строка-название, возвращаем как есть
    if (typeof categoryIdOrName === 'string') {
      // Проверяем, есть ли категория с таким ID
      const categoryById = categories.find(c => c.id === categoryIdOrName);
      if (categoryById) {
        return categoryById.name;
      }
      // Иначе это уже название категории
      return categoryIdOrName;
    }
    
    // Если undefined - дефолт
    return 'remix';
  };
  
  // Иконка статуса дня
  const getStatusIcon = (status) => {
    if (!status || !status.status) return null;
    switch (status.status) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'danger':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };
  
  return (
    <div className="timeline">
      {Object.entries(groupedEntries)
        .sort(([dateA], [dateB]) => new Date(dateB) - new Date(dateA))
        .map(([date, dateEntries], index) => {
          const metrics = getDayMetrics(dateEntries, dailyGoal);
          const dateObj = new Date(date);
          // Формат: "29 Октября 2025 Г. СР"
          const day = dateObj.getDate();
          const month = dateObj.toLocaleDateString('ru-RU', { month: 'long' });
          const year = dateObj.getFullYear();
          const weekdayShort = dateObj.toLocaleDateString('ru-RU', { weekday: 'short' }).toUpperCase();
          const formattedDate = `${day} ${month.charAt(0).toUpperCase() + month.slice(1)} ${year} Г. ${weekdayShort}`;
          
          return (
            <div key={date} className="timeline-item relative mb-8 overflow-visible snap-start">
              {/* Точка на линии времени */}
              <div className="timeline-dot" />

              {/* Сначала основной блок дня — чтобы ряд и точка якорились по нему */}
              <div className="timeline-main w-[45%] overflow-visible">
                <div className="glass-effect rounded-xl overflow-hidden hover-lift-scale transition-normal timeline-main-card">
                  {/* Заголовок со статусом и суммой */}
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                        {formattedDate}
                      </h3>
                      {getStatusIcon(metrics.status)}
                      {metrics.status && metrics.status.status && (
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          metrics.status.color === 'green' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' :
                          metrics.status.color === 'yellow' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400' :
                          'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                        }`}>
                          {metrics.status.label}
                        </span>
                      )}
                    </div>
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {metrics.totalEarned} ₽
                    </span>
                  </div>
                  
                  {/* Таблица записей */}
                  <div className="px-4 py-3">
                    <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
                      <thead>
                        <tr className="text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                          {selectionMode && (
                            <th className="text-center py-2 pr-1 font-medium" style={{ width: '32px', minWidth: '32px' }}></th>
                          )}
                          <th className="text-left py-2 pr-1 font-medium" style={{ width: selectionMode ? '105px' : '110px' }}>Время</th>
                          <th className="text-center py-2 px-1 font-medium" style={{ width: '70px' }}>Перерыв</th>
                          <th className="text-left py-2 pl-1 font-medium" style={{ width: 'auto' }}>Категория</th>
                          <th className="text-right py-2 pr-1 font-medium" style={{ width: '50px' }}>Часы</th>
                          <th className="text-right py-2 font-medium" style={{ width: '80px' }}>Заработок</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
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
                          
                          // Получаем категорию для иконки и цвета
                          const categoryValue = entry.category || entry.categoryId;
                          const category = getCategory(categoryValue);
                          const CategoryIcon = category && category.icon ? getIcon(category.icon) : null;
                          const categoryColor = category && category.color ? category.color : '#6B7280';
                          
                               return (
                                 <tr 
                                   key={entry.id}
                                   className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-300 cursor-pointer group"
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
                                     <td className="py-2 pr-1 text-center" style={{ width: '32px', minWidth: '32px', padding: '8px 4px' }}>
                                       <input
                                         type="checkbox"
                                         checked={selectedEntries.has(entry.id)}
                                         onChange={() => onToggleSelection && onToggleSelection(entry.id)}
                                         onClick={(e) => e.stopPropagation()}
                                         className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                       />
                                     </td>
                                   )}
                                   
                                   <td className="py-2 pr-1 font-mono text-xs text-gray-700 dark:text-gray-300">
                                     {timeRange}
                                   </td>
                                   <td className="py-2 px-1 text-center">
                                     {entry.breakAfter ? (
                                       <span className="text-xs px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400 font-medium">
                                         {entry.breakAfter}
                                       </span>
                                     ) : (
                                       <span className="text-gray-400 dark:text-gray-600">—</span>
                                     )}
                                  </td>
                                  <td className="py-2 pl-1 text-xs text-gray-700 dark:text-gray-300">
                                    <div className="flex items-center gap-1">
                                      {CategoryIcon && (
                                        <CategoryIcon 
                                          className="w-3 h-3 flex-shrink-0" 
                                          style={{ color: categoryColor }}
                                        />
                                      )}
                                      <span className="truncate">
                                        {getCategoryName(entry.category || entry.categoryId)}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-2 pr-1 text-right text-xs text-gray-600 dark:text-gray-400">
                                     {duration} ч
                                   </td>
                                   <td className="py-2 text-right font-semibold text-blue-600 dark:text-blue-400">
                                     {earned} ₽
                                   </td>
                                 </tr>
                               );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-gray-300 dark:border-gray-600 font-bold">
                          <td className="py-3 text-gray-700 dark:text-gray-300" colSpan={selectionMode ? 4 : 3}>
                            Итого за день
                          </td>
                          <td className="py-3 text-right text-gray-700 dark:text-gray-300">
                            {metrics.totalHours.toFixed(2)} ч
                          </td>
                          <td className="py-3 text-right text-blue-600 dark:text-blue-400">
                            {metrics.totalEarned} ₽
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>

              {/* Блок инсайтов на противоположной стороне */}
              <div className={`timeline-side w-[45%] overflow-visible flex ${index % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                <div className="glass-effect rounded-lg p-3 space-y-2 hover:shadow-[0_0_20px_2px_rgba(59,130,246,0.25)] transition-normal hover-lift-scale timeline-side-card w-[50%]">
                  {/* Макс. сессия */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <Clock size={16} className="text-purple-500 dark:text-purple-400" />
                      Макс. сессия
                    </span>
                    <strong className="font-mono text-gray-800 dark:text-white">{metrics.longestSession}</strong>
                  </div>
                  
                  {/* Макс. перерыв */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <AlertTriangle size={16} className="text-orange-500 dark:text-orange-400" />
                      Макс. перерыв
                    </span>
                    <strong className="font-mono text-gray-800 dark:text-white">{metrics.longestBreak}</strong>
                  </div>
                  
                  {/* Средняя ставка */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <DollarSign size={16} className="text-teal-500 dark:text-teal-400" />
                      Сред. ставка
                    </span>
                    <strong className="font-mono text-gray-800 dark:text-white">{metrics.averageRate}</strong>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
    </div>
  );
}

