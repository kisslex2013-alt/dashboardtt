import { useState, useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartTypeSwitcher } from '../ui/ChartTypeSwitcher';
import { useSettingsStore } from '../../store/useSettingsStore';
import { InfoTooltip } from '../ui/InfoTooltip';

/**
 * 📊 График "Идеальный час" - средняя ставка по часам суток
 * 
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 * 
 * Этот график показывает среднюю почасовую ставку для каждого часа суток (0-23).
 * Помогает определить самые выгодные часы для работы.
 * 
 * Например, если в 10:00 утра средняя ставка 1500₽/ч, а в 22:00 - 800₽/ч,
 * значит лучше работать утром.
 * 
 * Можно переключать тип отображения:
 * - Bar (столбцы) - хорошо показывает сравнение часов
 * - Line (линия) - показывает тренд в течение дня
 * - Area (область) - визуально выделяет продуктивные часы
 * 
 * @param {Array} entries - Отфильтрованные записи
 */
export function IdealDayChart({ entries }) {
  const { theme } = useSettingsStore();
  const [chartType, setChartType] = useState('bar');

  // Подготовка данных для графика
  const chartData = useMemo(() => {
    if (!entries || entries.length === 0) return [];

    // Инициализируем данные для каждого часа (0-23)
    const hourlyStats = Array.from({ length: 24 }, (_, hour) => ({
      hour: hour.toString().padStart(2, '0'),
      totalHours: 0,
      totalEarned: 0,
      entryCount: 0,
      avgRate: 0,
    }));

    // Проходим по всем записям и группируем по часу начала работы
    entries.forEach((entry) => {
      if (!entry.start) return;

      const startHour = parseInt(entry.start.split(':')[0]);
      if (isNaN(startHour) || startHour < 0 || startHour > 23) return;

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

      if (duration > 0) {
        hourlyStats[startHour].totalHours += duration;
        hourlyStats[startHour].totalEarned += earned;
        hourlyStats[startHour].entryCount += 1;
      }
    });

    // Рассчитываем среднюю ставку для каждого часа
    hourlyStats.forEach((hourData) => {
      if (hourData.totalHours > 0) {
        hourData.avgRate = hourData.totalEarned / hourData.totalHours;
      }
    });

    // Фильтруем только часы с данными
    return hourlyStats.filter((hourData) => hourData.entryCount > 0);
  }, [entries]);

  // Пустое состояние
  if (chartData.length === 0) {
    return (
      <div className="glass-effect rounded-xl p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Идеальный час</h2>
          <ChartTypeSwitcher currentType={chartType} onChange={setChartType} />
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
      return (
        <div className="glass-effect rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-sm mb-2">{data.hour}:00</p>
          <p className="text-sm">
            <span className="text-yellow-600 dark:text-yellow-400">Средняя ставка: </span>
            <span className="font-medium">{Math.round(data.avgRate)} ₽/ч</span>
          </p>
          <p className="text-sm">
            <span className="text-gray-600 dark:text-gray-400">Всего часов: </span>
            <span className="font-medium">{data.totalHours.toFixed(1)}</span>
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
          <h2 className="text-xl font-bold">Идеальный час</h2>
          <InfoTooltip text="Средняя почасовая ставка для каждого часа суток. Помогает определить самые выгодные часы для работы." />
        </div>
        <ChartTypeSwitcher currentType={chartType} onChange={setChartType} />
      </div>

      <ResponsiveContainer width="100%" height={350}>
        {chartType === 'bar' ? (
          <BarChart data={chartData}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke={theme === 'dark' ? '#374151' : '#E5E7EB'} 
            />
            <XAxis 
              dataKey="hour"
              stroke="#6B7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#6B7280"
              style={{ fontSize: '12px' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="avgRate" 
              name="Средняя ставка" 
              fill="#F59E0B"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        ) : chartType === 'area' ? (
          <AreaChart data={chartData}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke={theme === 'dark' ? '#374151' : '#E5E7EB'} 
            />
            <XAxis 
              dataKey="hour"
              stroke="#6B7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#6B7280"
              style={{ fontSize: '12px' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="avgRate" 
              name="Средняя ставка" 
              stroke="#F59E0B" 
              fill="#F59E0B" 
              fillOpacity={0.3}
            />
          </AreaChart>
        ) : (
          <LineChart data={chartData}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke={theme === 'dark' ? '#374151' : '#E5E7EB'} 
            />
            <XAxis 
              dataKey="hour"
              stroke="#6B7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#6B7280"
              style={{ fontSize: '12px' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="avgRate" 
              name="Средняя ставка" 
              stroke="#F59E0B"
              strokeWidth={2}
              dot={{ fill: '#F59E0B', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
