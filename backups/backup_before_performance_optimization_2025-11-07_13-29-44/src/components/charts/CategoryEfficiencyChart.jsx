import { useState, useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart2 } from 'lucide-react';
import { ChartTypeSwitcher } from '../ui/ChartTypeSwitcher';
import { useSettingsStore } from '../../store/useSettingsStore';
import { InfoTooltip } from '../ui/InfoTooltip';
import { EmptyState } from '../ui/EmptyState';

/**
 * 📊 График доходов по категориям
 * 
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 * 
 * Этот график показывает доходы и среднюю ставку по каждой категории.
 * Помогает определить самые прибыльные категории работы.
 * 
 * Можно переключать тип отображения:
 * - Bar (столбцы) - хорошо показывает сравнение категорий
 * - Line (линия) - показывает тренд доходов по категориям
 * - Area (область) - визуально выделяет объем доходов
 * 
 * @param {Array} entries - Отфильтрованные записи
 */
export function CategoryEfficiencyChart({ entries }) {
  const { theme, categories } = useSettingsStore();
  const [chartType, setChartType] = useState('bar');

  // Подготовка данных для графика
  const chartData = useMemo(() => {
    if (!entries || entries.length === 0) return [];

    // Группируем записи по категориям
    const categoryStats = {};

    entries.forEach((entry) => {
      const categoryName = entry.category || 'Другое';
      
      if (!categoryStats[categoryName]) {
        categoryStats[categoryName] = {
          name: categoryName,
          earned: 0,
          hours: 0,
          entryCount: 0,
          avgRate: 0,
          color: categories.find(cat => cat.name === categoryName)?.color || '#6B7280',
        };
      }

      const earned = parseFloat(entry.earned) || 0;
      let duration = 0;

      // Рассчитываем длительность
      if (entry.duration) {
        duration = parseFloat(entry.duration) || 0;
      } else if (entry.start && entry.end) {
        const [startH, startM] = entry.start.split(':').map(Number);
        const [endH, endM] = entry.end.split(':').map(Number);
        const startMinutes = startH * 60 + startM;
        let endMinutes = endH * 60 + endM;
        if (endMinutes < startMinutes) endMinutes += 24 * 60;
        duration = (endMinutes - startMinutes) / 60;
      }

      categoryStats[categoryName].earned += earned;
      categoryStats[categoryName].hours += duration;
      categoryStats[categoryName].entryCount += 1;
    });

    // Рассчитываем среднюю ставку для каждой категории
    Object.keys(categoryStats).forEach((categoryName) => {
      const stat = categoryStats[categoryName];
      stat.avgRate = stat.hours > 0 ? stat.earned / stat.hours : 0;
    });

    // Преобразуем в массив и сортируем по доходу
    return Object.values(categoryStats)
      .sort((a, b) => b.earned - a.earned);
  }, [entries, categories]);

  // ВИЗУАЛ: Empty State для графика
  if (chartData.length === 0) {
    return (
      <div className="glass-effect rounded-xl p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Доходы по категориям</h2>
          <ChartTypeSwitcher currentType={chartType} onChange={setChartType} />
        </div>
        <EmptyState
          icon={BarChart2}
          title="Нет данных для отображения"
          description="Добавьте записи времени с указанием категорий, чтобы увидеть график доходов"
          variant="compact"
        />
      </div>
    );
  }

  // Кастомный tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="glass-effect rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-sm mb-2" style={{ color: data.color }}>
            {data.name}
          </p>
          <p className="text-sm">
            <span className="text-blue-600 dark:text-blue-400">Доход: </span>
            <span className="font-medium">{data.earned.toLocaleString('ru-RU')} ₽</span>
          </p>
          <p className="text-sm">
            <span className="text-gray-600 dark:text-gray-400">Средняя ставка: </span>
            <span className="font-medium">{data.avgRate.toFixed(0)} ₽/ч</span>
          </p>
          <p className="text-sm">
            <span className="text-gray-600 dark:text-gray-400">Часов: </span>
            <span className="font-medium">{data.hours.toFixed(1)}</span>
          </p>
          <p className="text-sm">
            <span className="text-gray-600 dark:text-gray-400">Записей: </span>
            <span className="font-medium">{data.entryCount}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-effect rounded-xl p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold">Доходы по категориям</h2>
          <InfoTooltip text="Показывает доходы и среднюю ставку по каждой категории." />
        </div>
        <ChartTypeSwitcher currentType={chartType} onChange={setChartType} />
      </div>

      <ResponsiveContainer width="100%" height={350}>
        {chartType === 'bar' ? (
          <BarChart data={chartData}>
            <defs>
              <linearGradient id="colorCategoryEfficiencyBar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.3} />
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke={theme === 'dark' ? '#374151' : '#E5E7EB'} 
            />
            <XAxis 
              dataKey="name"
              stroke="#6B7280"
              style={{ fontSize: '12px' }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              stroke="#6B7280"
              style={{ fontSize: '12px' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="earned" 
              name="Доход" 
              fill="url(#colorCategoryEfficiencyBar)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        ) : chartType === 'area' ? (
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorCategoryEfficiency" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke={theme === 'dark' ? '#374151' : '#E5E7EB'} 
            />
            <XAxis 
              dataKey="name"
              stroke="#6B7280"
              style={{ fontSize: '12px' }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              stroke="#6B7280"
              style={{ fontSize: '12px' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="earned" 
              name="Доход" 
              stroke="#3B82F6" 
              fillOpacity={1} 
              fill="url(#colorCategoryEfficiency)"
            />
          </AreaChart>
        ) : (
          <LineChart data={chartData}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke={theme === 'dark' ? '#374151' : '#E5E7EB'} 
            />
            <XAxis 
              dataKey="name"
              stroke="#6B7280"
              style={{ fontSize: '12px' }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              stroke="#6B7280"
              style={{ fontSize: '12px' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="earned" 
              name="Доход" 
              stroke="#3B82F6"
              strokeWidth={3}
              dot={{ fill: '#3B82F6', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
