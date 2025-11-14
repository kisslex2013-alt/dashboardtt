import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useEntriesStore } from '../../store/useEntriesStore';
import { subDays, format, eachDayOfInterval, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { InfoTooltip } from '../ui/InfoTooltip';

/**
 * Мультилинейный график трендов
 * - Заработок
 * - Часы работы
 * - Средняя ставка
 * - Переключатель метрик
 * @param {Array} entries - Отфильтрованные записи (опционально, если не передано - берет из store)
 */
export function TrendsChart({ entries: entriesProp }) {
  const { entries: entriesStore } = useEntriesStore();
  const entries = entriesProp || entriesStore; // Используем переданные или из store
  const [visibleMetrics, setVisibleMetrics] = useState({
    earned: true,
    hours: true,
    rate: true,
  });

  // Подготовка данных за последние 30 дней
  const prepareChartData = () => {
    const today = new Date();
    const startDate = subDays(today, 29); // 30 дней включая сегодня
    const days = eachDayOfInterval({ start: startDate, end: today });

    // Инициализируем данные для каждого дня
    const data = days.map((day) => ({
      date: format(day, 'd MMM', { locale: ru }),
      fullDate: format(day, 'yyyy-MM-dd'),
      earned: 0,
      hours: 0,
      rate: 0,
    }));

    // Заполняем данные из entries
    entries.forEach((entry) => {
      const entryDate = format(parseISO(entry.date), 'yyyy-MM-dd');
      const dayIndex = data.findIndex((d) => d.fullDate === entryDate);

      if (dayIndex !== -1) {
        const earned = parseFloat(entry.earned) || 0;
        const duration = parseFloat(entry.duration) || 0;

        data[dayIndex].earned += earned;
        data[dayIndex].hours += duration;
      }
    });

    // Рассчитываем среднюю ставку для каждого дня
    data.forEach((day) => {
      if (day.hours > 0) {
        day.rate = day.earned / day.hours;
      }
    });

    return data;
  };

  const chartData = prepareChartData();

  // Пустое состояние
  if (chartData.every((day) => day.earned === 0 && day.hours === 0)) {
    return (
      <div className="glass-effect rounded-xl p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Тренды за 30 дней</h2>
        <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
          <p className="text-sm">Нет данных за последние 30 дней</p>
          <p className="text-xs mt-2">Добавьте записи времени</p>
        </div>
      </div>
    );
  }

  // Переключатель метрик
  const toggleMetric = (metric) => {
    setVisibleMetrics((prev) => ({
      ...prev,
      [metric]: !prev[metric],
    }));
  };

  // Кастомный tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-effect rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-sm mb-2">{label}</p>
          {payload.map((item, index) => (
            <div key={index} className="flex justify-between gap-4 text-sm">
              <span style={{ color: item.color }}>{item.name}:</span>
              <span className="font-medium">
                {item.dataKey === 'earned' && `${item.value.toFixed(2)} ₽`}
                {item.dataKey === 'hours' && `${item.value.toFixed(1)} ч`}
                {item.dataKey === 'rate' && `${item.value.toFixed(0)} ₽/ч`}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-effect rounded-xl p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold">Тренды за 30 дней</h2>
          <InfoTooltip text="Совмещенный график дохода, часов работы и почасовой ставки для сравнения трендов за последние 30 дней." />
        </div>
        
        {/* Переключатель метрик */}
        <div className="flex gap-2">
          <label className="flex items-center gap-1 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={visibleMetrics.earned}
              onChange={() => toggleMetric('earned')}
              className="w-4 h-4 text-blue-500"
            />
            <span className="text-blue-500">Заработок</span>
          </label>
          <label className="flex items-center gap-1 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={visibleMetrics.hours}
              onChange={() => toggleMetric('hours')}
              className="w-4 h-4 text-green-500"
            />
            <span className="text-green-500">Часы</span>
          </label>
          <label className="flex items-center gap-1 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={visibleMetrics.rate}
              onChange={() => toggleMetric('rate')}
              className="w-4 h-4 text-yellow-500"
            />
            <span className="text-yellow-500">Ставка</span>
          </label>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="date" 
            stroke="#6B7280"
            style={{ fontSize: '11px' }}
            interval="preserveStartEnd"
          />
          <YAxis 
            yAxisId="left"
            stroke="#6B7280"
            style={{ fontSize: '12px' }}
            label={{ value: '₽ / ч', angle: -90, position: 'insideLeft' }}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            stroke="#6B7280"
            style={{ fontSize: '12px' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ fontSize: '12px' }}
            iconType="line"
          />
          
          {visibleMetrics.earned && (
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="earned"
              stroke="#3B82F6"
              strokeWidth={2}
              name="Заработок (₽)"
              dot={{ fill: '#3B82F6', r: 3 }}
              activeDot={{ r: 5 }}
            />
          )}
          
          {visibleMetrics.hours && (
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="hours"
              stroke="#10B981"
              strokeWidth={2}
              name="Часы работы"
              dot={{ fill: '#10B981', r: 3 }}
              activeDot={{ r: 5 }}
            />
          )}
          
          {visibleMetrics.rate && (
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="rate"
              stroke="#F59E0B"
              strokeWidth={2}
              name="Средняя ставка (₽/ч)"
              dot={{ fill: '#F59E0B', r: 3 }}
              activeDot={{ r: 5 }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

