import { useState, useMemo } from 'react';
import { ComposedChart, Bar, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { ChartTypeSwitcher } from '../ui/ChartTypeSwitcher';
import { useEntriesStore } from '../../store/useEntriesStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { InfoTooltip } from '../ui/InfoTooltip';

/**
 * 📊 Объединенный график анализа часов дня
 * 
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 * 
 * Этот график объединяет два вида анализа:
 * - Доход по часам дня (столбцы)
 * - Средняя ставка по часам дня (линия)
 * 
 * Помогает увидеть связь между доходом и ставкой в разные часы дня.
 * 
 * @param {Array} entries - Отфильтрованные записи (опционально, если не передано - берет из store)
 */
export function HourAnalysisChart({ entries: entriesProp }) {
  const { entries: entriesStore } = useEntriesStore();
  const { theme } = useSettingsStore();
  const [metricType, setMetricType] = useState('both'); // 'earned', 'rate', 'both'
  const [chartType, setChartType] = useState('bar'); // Для доходов: bar/area

  // Логика выбора данных
  const entries = entriesProp !== undefined && entriesProp !== null
    ? (entriesProp.length > 0 ? entriesProp : (entriesStore.length > 0 ? entriesStore : entriesProp))
    : entriesStore;

  // Подготовка данных для графика (мемоизирована для производительности)
  const chartData = useMemo(() => {
    if (!entries || entries.length === 0) return [];

    // Инициализируем данные для каждого часа (0-23)
    const hourlyData = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      hourLabel: `${i.toString().padStart(2, '0')}:00`,
      earned: 0,
      totalHours: 0,
      totalEarned: 0,
      entryCount: 0,
      avgRate: 0,
    }));

    // Агрегируем данные по часам
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
        // Для дохода: распределяем пропорционально, если работа длится несколько часов
        const earnedPerHour = duration > 0 ? earned / duration : 0;
        const endHour = entry.end ? parseInt(entry.end.split(':')[0]) : startHour;
        
        // Если работа в пределах одного часа
        if (startHour === endHour) {
          hourlyData[startHour].earned += earned;
          hourlyData[startHour].totalHours += duration;
          hourlyData[startHour].totalEarned += earned;
          hourlyData[startHour].entryCount += 1;
        } else {
          // Распределяем заработок пропорционально между часами
          for (let h = startHour; h <= endHour && h < 24; h++) {
            hourlyData[h].earned += earnedPerHour;
            hourlyData[h].totalHours += duration;
            hourlyData[h].totalEarned += earned;
            hourlyData[h].entryCount += 1;
          }
        }
      }
    });

    // Рассчитываем среднюю ставку для каждого часа
    hourlyData.forEach((hourData) => {
      if (hourData.totalHours > 0) {
        hourData.avgRate = hourData.totalEarned / hourData.totalHours;
      }
    });

    // Округляем значения
    return hourlyData.map(item => ({
      ...item,
      earned: parseFloat(item.earned.toFixed(2)),
      avgRate: parseFloat(item.avgRate.toFixed(0)),
    }));
  }, [entries]);

  const maxEarned = Math.max(...chartData.map(d => d.earned), 0);
  const maxRate = Math.max(...chartData.map(d => d.avgRate), 0);
  const totalEarned = chartData.reduce((sum, d) => sum + d.earned, 0);

  // Функция для определения цвета столбца (для дохода)
  const getBarColor = (value) => {
    const intensity = maxEarned > 0 ? value / maxEarned : 0;
    if (intensity > 0.7) return '#10B981'; // Зеленый - высокая продуктивность
    if (intensity > 0.4) return '#3B82F6'; // Синий - средняя
    if (intensity > 0.1) return '#F59E0B'; // Желтый - низкая
    return '#9CA3AF'; // Серый - нет данных
  };

  // Пустое состояние
  if (totalEarned === 0 && chartData.every(h => h.avgRate === 0)) {
    return (
      <div className="glass-effect rounded-xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-xl font-bold">Анализ часов дня</h2>
          <InfoTooltip text="Показывает доход и среднюю ставку по часам дня. Помогает увидеть связь между доходом и ставкой в разные часы." />
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
      const earnedItem = payload.find(item => item.dataKey === 'earned');
      const rateItem = payload.find(item => item.dataKey === 'avgRate');
      const percentage = totalEarned > 0 && earnedItem ? ((earnedItem.value / totalEarned) * 100).toFixed(1) : 0;

      return (
        <div className="glass-effect rounded-lg p-3 shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-semibold text-sm mb-2">{data.hourLabel}</p>
          <div className="space-y-1">
            {earnedItem && (
              <>
                <p className="text-sm flex items-center justify-between gap-4">
                  <span className="text-gray-600 dark:text-gray-400">Заработано:</span>
                  <span className="font-medium">{earnedItem.value.toFixed(2)} ₽</span>
                </p>
                <p className="text-sm flex items-center justify-between gap-4">
                  <span className="text-gray-600 dark:text-gray-400">Доля:</span>
                  <span className="font-medium">{percentage}%</span>
                </p>
              </>
            )}
            {rateItem && (
              <p className="text-sm flex items-center justify-between gap-4">
                <span className="text-gray-600 dark:text-gray-400">Средняя ставка:</span>
                <span className="font-medium">{rateItem.value.toFixed(0)} ₽/ч</span>
              </p>
            )}
            <p className="text-sm flex items-center justify-between gap-4">
              <span className="text-gray-600 dark:text-gray-400">Записей:</span>
              <span className="font-medium">{data.entryCount}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-effect rounded-xl p-6 mb-6">
      <div className="flex flex-col gap-2 mb-4">
        {/* Заголовок и переключатели */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold">Анализ часов дня</h2>
            <InfoTooltip text="Показывает доход и среднюю ставку по часам дня. Помогает увидеть связь между доходом и ставкой в разные часы." />
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            {/* Переключатель метрик - компактный */}
            <select
              value={metricType}
              onChange={(e) => setMetricType(e.target.value)}
              className="glass-effect px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="both">Оба</option>
              <option value="earned">Доход</option>
              <option value="rate">Ставка</option>
            </select>
            
            {/* Переключатель типа графика (только для дохода) */}
            {(metricType === 'earned' || metricType === 'both') && (
              <ChartTypeSwitcher 
                currentType={chartType} 
                onChange={(type) => setChartType(type)} 
              />
            )}
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <ComposedChart data={chartData}>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke={theme === 'dark' ? '#374151' : '#E5E7EB'} 
          />
          <XAxis 
            dataKey="hourLabel"
            stroke="#6B7280"
            style={{ fontSize: '11px' }}
            interval={1}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            yAxisId="left"
            stroke="#6B7280"
            style={{ fontSize: '12px' }}
            label={{ value: 'Доход (₽)', angle: -90, position: 'insideLeft', fontSize: 12 }}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            stroke="#F59E0B"
            style={{ fontSize: '12px' }}
            label={{ value: 'Ставка (₽/ч)', angle: 90, position: 'insideRight', fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="top"
            wrapperStyle={{ fontSize: '12px', paddingBottom: '10px' }}
            iconType="square"
          />
          
          {/* Доход - Bar, Line или Area */}
          {(metricType === 'earned' || metricType === 'both') && chartType === 'bar' && (
            <Bar 
              yAxisId="left"
              dataKey="earned" 
              name="Доход"
              radius={[8, 8, 0, 0]}
              animationDuration={800}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.earned)} />
              ))}
            </Bar>
          )}
          
          {(metricType === 'earned' || metricType === 'both') && chartType === 'line' && (
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="earned"
              name="Доход"
              stroke="#3B82F6"
              strokeWidth={3}
              dot={{ fill: '#3B82F6', r: 4 }}
              activeDot={{ r: 6 }}
            />
          )}
          
          {(metricType === 'earned' || metricType === 'both') && chartType === 'area' && (
            <Area 
              yAxisId="left"
              type="monotone"
              dataKey="earned"
              name="Доход"
              stroke="#3B82F6"
              fill="#3B82F6"
              fillOpacity={0.6}
            />
          )}
          
          {/* Ставка - Line */}
          {(metricType === 'rate' || metricType === 'both') && (
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="avgRate"
              name="Средняя ставка"
              stroke="#F59E0B"
              strokeWidth={3}
              dot={{ fill: '#F59E0B', r: 4 }}
              activeDot={{ r: 6 }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
      
      {/* Легенда (только для дохода) */}
      {(metricType === 'earned' || metricType === 'both') && chartType === 'bar' && (
        <div className="mt-4 flex flex-wrap gap-3 justify-center text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>Высокая продуктивность</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span>Средняя</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span>Низкая</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-400" />
            <span>Нет данных</span>
          </div>
        </div>
      )}
    </div>
  );
}

