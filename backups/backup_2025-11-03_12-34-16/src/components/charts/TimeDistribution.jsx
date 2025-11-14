import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useEntriesStore } from '../../store/useEntriesStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { InfoTooltip } from '../ui/InfoTooltip';

/**
 * Столбчатая диаграмма распределения часов по дням недели
 * - Показывает часы работы по каждому дню
 * - Цветовая кодировка по категориям (stacked bar)
 * - Средняя линия
 * @param {Array} entries - Отфильтрованные записи (опционально, если не передано - берет из store)
 */
export function TimeDistribution({ entries: entriesProp }) {
  const { entries: entriesStore } = useEntriesStore();
  const { categories } = useSettingsStore();
  
  // Логика выбора данных:
  // 1. Если entriesProp не передан (undefined или null) - используем store
  // 2. Если entriesProp передан и не пустой - используем его
  // 3. Если entriesProp пустой массив [], но в store есть данные - используем store (fallback для отладки)
  // 4. Если entriesProp пустой и store пустой - используем пустой массив
  const entries = entriesProp !== undefined && entriesProp !== null
    ? (entriesProp.length > 0 ? entriesProp : (entriesStore.length > 0 ? entriesStore : entriesProp))
    : entriesStore;

  // Подготовка данных для столбчатой диаграммы (мемоизирована для производительности)
  const chartData = useMemo(() => {
    if (!entries || entries.length === 0) return [];
    
    // Инициализируем данные для каждого дня недели (Пн-Вс)
    const daysOfWeek = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    const data = daysOfWeek.map((day, index) => {
      const dayData = {
        day,
        dayIndex: index, // 0 = Понедельник, 6 = Воскресенье
        total: 0,
      };

      // Добавляем поля для каждой категории
      categories.forEach((category) => {
        dayData[category.name] = 0;
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

      data[dayOfWeek][category] = (data[dayOfWeek][category] || 0) + duration;
      data[dayOfWeek].total += duration;
    });

    return data;
  }, [entries, categories]);
  
  const totalHours = useMemo(() => {
    return chartData.reduce((sum, day) => sum + day.total, 0);
  }, [chartData]);
  const averageHours = totalHours > 0 ? totalHours / 7 : 0;

  // Пустое состояние
  if (totalHours === 0) {
    return (
      <div className="glass-effect rounded-xl p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold">Распределение по дням недели</h2>
            <InfoTooltip text="Показывает распределение времени по дням недели с разбивкой по категориям. Помогает увидеть, какие дни недели наиболее продуктивны." />
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
      const total = payload.reduce((sum, item) => sum + (item.value || 0), 0);

      return (
        <div className="glass-effect rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-sm mb-2">{label}</p>
          {payload
            .filter((item) => item.value > 0)
            .map((item, index) => (
              <div key={index} className="flex justify-between gap-4 text-sm">
                <span style={{ color: item.color }}>{item.name}:</span>
                <span className="font-medium">{item.value.toFixed(1)}ч</span>
              </div>
            ))}
          <div className="border-t border-gray-300 dark:border-gray-600 mt-2 pt-2 flex justify-between gap-4 text-sm">
            <span className="font-semibold">Всего:</span>
            <span className="font-semibold">{total.toFixed(1)}ч</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-effect rounded-xl p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold">Распределение по дням недели</h2>
          <InfoTooltip text="Показывает распределение времени по дням недели с разбивкой по категориям. Помогает увидеть, какие дни недели наиболее продуктивны." />
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Среднее: <span className="font-semibold">{averageHours.toFixed(1)} ч/день</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="day" 
            stroke="#6B7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#6B7280"
            style={{ fontSize: '12px' }}
            label={{ value: 'Часы', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="middle" 
            align="right"
            layout="vertical"
            wrapperStyle={{ fontSize: '12px', paddingLeft: '20px' }}
            iconType="square"
          />
          <ReferenceLine 
            y={averageHours} 
            stroke="#F59E0B" 
            strokeDasharray="5 5"
            label={{ value: 'Среднее', position: 'right', fill: '#F59E0B', fontSize: 12 }}
          />
          
          {/* Bars для каждой категории */}
          {categories.map((category) => (
            <Bar
              key={category.name}
              dataKey={category.name}
              stackId="a"
              fill={category.color}
              name={category.name}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

