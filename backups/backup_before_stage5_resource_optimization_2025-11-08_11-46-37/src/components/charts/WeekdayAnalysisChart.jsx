import { useState, useMemo } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { ChartTypeSwitcher } from '../ui/ChartTypeSwitcher';
import { useEntriesStore } from '../../store/useEntriesStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { parseISO } from 'date-fns';
import { InfoTooltip } from '../ui/InfoTooltip';

/**
 * 📊 Объединенный график анализа дней недели
 * 
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 * 
 * Этот график объединяет два вида анализа:
 * - Часы работы по дням недели (stacked bar по категориям)
 * - Доход по дням недели (линия)
 * 
 * Помогает увидеть связь между отработанными часами и доходом.
 * 
 * @param {Array} entries - Отфильтрованные записи (опционально, если не передано - берет из store)
 */
export function WeekdayAnalysisChart({ entries: entriesProp }) {
  const { entries: entriesStore } = useEntriesStore();
  const { categories, theme } = useSettingsStore();
  const [metricType, setMetricType] = useState('both'); // 'hours', 'earned', 'both'
  
  // Логика выбора данных
  const entries = entriesProp !== undefined && entriesProp !== null
    ? (entriesProp.length > 0 ? entriesProp : (entriesStore.length > 0 ? entriesStore : entriesProp))
    : entriesStore;

  // Подготовка данных для графика (мемоизирована для производительности)
  const chartData = useMemo(() => {
    if (!entries || entries.length === 0) return [];
    
    // Инициализируем данные для каждого дня недели (Пн-Вс)
    const daysOfWeek = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    const data = daysOfWeek.map((day, index) => {
      const dayData = {
        day,
        dayIndex: index, // 0 = Понедельник, 6 = Воскресенье
        totalHours: 0,
        totalEarned: 0,
      };

      // Добавляем поля для каждой категории (часы)
      categories.forEach((category) => {
        dayData[`hours_${category.name}`] = 0;
      });

      return dayData;
    });

    // Заполняем данные из entries, группируя по дням недели
    entries.forEach((entry) => {
      let entryDate;
      try {
        entryDate = parseISO(entry.date);
        if (isNaN(entryDate.getTime())) {
          entryDate = new Date(entry.date);
        }
      } catch (e) {
        entryDate = new Date(entry.date);
      }
      
      // getDay() возвращает 0 (воскресенье) - 6 (суббота)
      // Преобразуем в 0 (понедельник) - 6 (воскресенье)
      let dayOfWeek = entryDate.getDay() - 1;
      if (dayOfWeek === -1) dayOfWeek = 6; // Воскресенье
      
      const category = entry.category || 'Другое';
      
      // Считаем часы
      let duration = parseFloat(entry.duration) || 0;
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

      // Считаем доход
      const earned = parseFloat(entry.earned) || 0;

      data[dayOfWeek][`hours_${category}`] = (data[dayOfWeek][`hours_${category}`] || 0) + duration;
      data[dayOfWeek].totalHours += duration;
      data[dayOfWeek].totalEarned += earned;
    });

    return data;
  }, [entries, categories]);
  
  const totalHours = useMemo(() => {
    return chartData.reduce((sum, day) => sum + day.totalHours, 0);
  }, [chartData]);
  
  const totalEarned = useMemo(() => {
    return chartData.reduce((sum, day) => sum + day.totalEarned, 0);
  }, [chartData]);
  
  const averageHours = totalHours > 0 ? totalHours / 7 : 0;
  const averageEarned = totalEarned > 0 ? totalEarned / 7 : 0;

  // Пустое состояние
  if (totalHours === 0 && totalEarned === 0) {
    return (
      <div className="glass-effect rounded-xl p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold">Анализ дней недели</h2>
            <InfoTooltip text="Показывает часы работы и доход по дням недели с разбивкой по категориям. Помогает увидеть связь между отработанными часами и доходом." />
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
          <p className="text-sm">Нет данных для отображения</p>
          <p className="text-xs mt-2">Добавьте записи времени</p>
        </div>
      </div>
    );
  }

  // Кастомный tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const hoursData = payload.filter(item => item.dataKey && item.dataKey.startsWith('hours_'));
      const earnedData = payload.find(item => item.dataKey === 'totalEarned');
      const totalHoursValue = hoursData.reduce((sum, item) => sum + (item.value || 0), 0);

      return (
        <div className="glass-effect rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-sm mb-2">{label}</p>
          
          {/* Часы по категориям */}
          {hoursData.length > 0 && hoursData.some(item => item.value > 0) && (
            <>
              {hoursData
                .filter((item) => item.value > 0)
                .map((item, index) => (
                  <div key={index} className="flex justify-between gap-4 text-sm mb-1">
                    <span style={{ color: item.color }}>{item.name.replace('hours_', '')}:</span>
                    <span className="font-medium">{item.value.toFixed(1)}ч</span>
                  </div>
                ))}
              <div className="border-t border-gray-300 dark:border-gray-600 mt-2 pt-2 mb-2 flex justify-between gap-4 text-sm">
                <span className="font-semibold">Всего часов:</span>
                <span className="font-semibold">{totalHoursValue.toFixed(1)}ч</span>
              </div>
            </>
          )}
          
          {/* Доход */}
          {earnedData && earnedData.value > 0 && (
            <div className="flex justify-between gap-4 text-sm">
              <span className="text-blue-600 dark:text-blue-400 font-semibold">Доход:</span>
              <span className="font-semibold">{earnedData.value.toLocaleString('ru-RU')} ₽</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-effect rounded-xl p-6 mb-6">
      <div className="flex flex-col gap-2 mb-4">
        {/* Заголовок и переключатель */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold">Анализ дней недели</h2>
            <InfoTooltip text="Показывает часы работы и доход по дням недели с разбивкой по категориям. Помогает увидеть связь между отработанными часами и доходом." />
          </div>
          
          {/* Переключатель метрик - компактный */}
          <select
            value={metricType}
            onChange={(e) => setMetricType(e.target.value)}
            className="glass-effect px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="both">Оба</option>
            <option value="hours">Часы</option>
            <option value="earned">Доход</option>
          </select>
        </div>
        
        {/* Статистика - компактная, одна строка */}
        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
          {metricType !== 'earned' && (
            <span>Ср: <span className="font-semibold">{averageHours.toFixed(1)} ч</span></span>
          )}
          {metricType === 'both' && <span className="text-gray-400">•</span>}
          {metricType !== 'hours' && (
            <span>Ср: <span className="font-semibold">{averageEarned.toLocaleString('ru-RU')} ₽</span></span>
          )}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <ComposedChart data={chartData}>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke={theme === 'dark' ? '#374151' : '#E5E7EB'} 
          />
          <XAxis 
            dataKey="day" 
            stroke="#6B7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            yAxisId="left"
            stroke="#6B7280"
            style={{ fontSize: '12px' }}
            label={{ value: 'Часы', angle: -90, position: 'insideLeft', fontSize: 12 }}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            stroke="#3B82F6"
            style={{ fontSize: '12px' }}
            label={{ value: 'Доход (₽)', angle: 90, position: 'insideRight', fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="top"
            wrapperStyle={{ fontSize: '12px', paddingBottom: '10px' }}
            iconType="square"
          />
          
          {/* Reference lines */}
          {metricType !== 'earned' && (
            <ReferenceLine 
              yAxisId="left"
              y={averageHours} 
              stroke="#F59E0B" 
              strokeDasharray="5 5"
              label={{ value: 'Среднее (часы)', position: 'right', fill: '#F59E0B', fontSize: 11 }}
            />
          )}
          {metricType !== 'hours' && (
            <ReferenceLine 
              yAxisId="right"
              y={averageEarned} 
              stroke="#3B82F6" 
              strokeDasharray="5 5"
              label={{ value: 'Среднее (доход)', position: 'left', fill: '#3B82F6', fontSize: 11 }}
            />
          )}
          
          {/* Bars для каждой категории (часы) - только если нужно показать часы */}
          {(metricType === 'hours' || metricType === 'both') && categories.map((category) => (
            <Bar
              key={category.name}
              yAxisId="left"
              dataKey={`hours_${category.name}`}
              stackId="hours"
              fill={category.color}
              name={category.name}
              radius={[0, 0, 0, 0]}
            />
          ))}
          
          {/* Line для дохода - только если нужно показать доход */}
          {(metricType === 'earned' || metricType === 'both') && (
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="totalEarned"
              name="Доход"
              stroke="#3B82F6"
              strokeWidth={3}
              dot={{ fill: '#3B82F6', r: 4 }}
              activeDot={{ r: 6 }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

