import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useEntriesStore } from '../../store/useEntriesStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { InfoTooltip } from '../ui/InfoTooltip';

/**
 * Горизонтальная диаграмма распределения времени по категориям
 * - Показывает часы по каждой категории
 * - Цвета берутся из настроек категорий
 * @param {Array} entries - Отфильтрованные записи (опционально, если не передано - берет из store)
 */
export function CategoryDistribution({ entries: entriesProp }) {
  const { entries: entriesStore } = useEntriesStore();
  const { categories, theme } = useSettingsStore();
  
  // Используем переданные entries если они переданы, иначе используем store
  // Если передан пустой массив, но store не пустой - используем store (fallback)
  const entries = entriesProp !== undefined && entriesProp !== null
    ? (entriesProp.length > 0 ? entriesProp : (entriesStore.length > 0 ? entriesStore : entriesProp))
    : entriesStore;

  // Подготовка данных для диаграммы (мемоизирована для производительности)
  const chartData = useMemo(() => {
    if (!entries || entries.length === 0) return [];
    
    // Группируем записи по категориям и считаем общее время
    const categoryTotals = {};

    entries.forEach((entry) => {
      const category = entry.category || 'Другое';
      // Пробуем получить duration, если его нет - вычисляем из start/end
      let duration = parseFloat(entry.duration) || 0;
      
      // Если duration = 0, пробуем вычислить из start и end
      if (duration === 0 && entry.start && entry.end) {
        try {
          const [startH, startM] = entry.start.split(':').map(Number);
          const [endH, endM] = entry.end.split(':').map(Number);
          const startMinutes = startH * 60 + startM;
          let endMinutes = endH * 60 + endM;
          if (endMinutes < startMinutes) endMinutes += 24 * 60;
          duration = (endMinutes - startMinutes) / 60;
        } catch (e) {
          duration = 0;
        }
      }

      if (!categoryTotals[category]) {
        categoryTotals[category] = 0;
      }
      categoryTotals[category] += duration;
    });

    // Преобразуем в массив для recharts
    const data = Object.keys(categoryTotals).map((category) => {
      const categoryData = categories.find((cat) => cat.name === category);
      return {
        name: category,
        hours: parseFloat(categoryTotals[category].toFixed(2)),
        color: categoryData?.color || '#6B7280',
      };
    });

    // Сортируем по убыванию значения
    return data.sort((a, b) => b.hours - a.hours);
  }, [entries, categories]);
  
  const totalHours = useMemo(() => {
    return chartData.reduce((sum, item) => sum + item.hours, 0);
  }, [chartData]);

  // Пустое состояние - проверяем и длину массива, и общее количество часов
  if (chartData.length === 0 || totalHours === 0) {
    return (
      <div className="glass-effect rounded-xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-xl font-bold">Распределение по категориям</h2>
          <InfoTooltip text="Показывает распределение времени по категориям работы. Помогает понять, на какие категории тратится больше всего времени." />
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
          <p className="text-sm">Нет данных для отображения</p>
          <p className="text-xs mt-2">Добавьте записи времени</p>
        </div>
      </div>
    );
  }

  // Кастомный tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = ((data.hours / totalHours) * 100).toFixed(1);

      return (
        <div className="glass-effect rounded-lg p-3 shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-semibold text-sm mb-2" style={{ color: data.color }}>
            {data.name}
          </p>
          <div className="space-y-1">
            <p className="text-sm flex items-center justify-between gap-4">
              <span className="text-gray-600 dark:text-gray-400">Часов:</span>
              <span className="font-medium">{data.hours.toFixed(2)} ч</span>
            </p>
            <p className="text-sm flex items-center justify-between gap-4">
              <span className="text-gray-600 dark:text-gray-400">Процент:</span>
              <span className="font-medium">{percentage}%</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-effect rounded-xl p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-xl font-bold">Распределение по категориям</h2>
        <InfoTooltip text="Показывает распределение времени по категориям работы. Помогает понять, на какие категории тратится больше всего времени." />
      </div>
      
      {/* Сумма часов */}
      <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">
        Всего: <span className="font-semibold text-gray-900 dark:text-white">{totalHours.toFixed(1)} часов</span>
      </div>
      
      <ResponsiveContainer width="100%" height={Math.max(250, chartData.length * 50)}>
        <BarChart 
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke={theme === 'dark' ? '#374151' : '#E5E7EB'}
            horizontal={true}
            vertical={false}
          />
          <XAxis 
            type="number"
            stroke="#6B7280"
            style={{ fontSize: '12px' }}
            label={{ value: 'Часы', position: 'insideBottom', offset: -5, fontSize: 12 }}
          />
          <YAxis 
            type="category"
            dataKey="name"
            stroke="#6B7280"
            style={{ fontSize: '12px' }}
            width={100}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: theme === 'dark' ? 'rgba(55, 65, 81, 0.3)' : 'rgba(229, 231, 235, 0.5)' }} />
          <Bar 
            dataKey="hours" 
            radius={[0, 8, 8, 0]}
            animationDuration={800}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      
      {/* Легенда внизу */}
      <div className="mt-2 flex flex-wrap gap-1.5 justify-center">
        {chartData.map((item, index) => {
          const percentage = ((item.hours / totalHours) * 100).toFixed(1);
          return (
            <div key={index} className="flex items-center gap-1.5 text-sm">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: item.color }}
              />
              <span className="text-gray-700 dark:text-gray-300">
                {item.name}: <span className="font-semibold">{percentage}%</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
