import { useState } from 'react';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ChartTypeSwitcher } from '../ui/ChartTypeSwitcher';
import { useSettingsStore } from '../../store/useSettingsStore';
import { format, parseISO, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { ru } from 'date-fns/locale';
import { InfoTooltip } from '../ui/InfoTooltip';

/**
 * 📊 График доходов по дням недели
 * 
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 * 
 * Этот график показывает суммарный заработок за каждый день недели.
 * Помогает определить самые продуктивные дни (например, больше всего зарабатываете в понедельник).
 * 
 * Можно переключать тип отображения:
 * - Bar (столбцы) - хорошо показывает сравнение дней
 * - Line (линия) - показывает тренд по дням недели
 * - Area (область) - визуально выделяет дни с большим заработком
 * 
 * @param {Array} entries - Отфильтрованные записи
 */
export function WeekdayChart({ entries }) {
  const { theme } = useSettingsStore();
  const [chartType, setChartType] = useState('bar');

  // Цвета для каждого дня недели
  const weekdayColors = [
    '#3B82F6', // Понедельник - синий
    '#10B981', // Вторник - зеленый
    '#EF4444', // Среда - красный
    '#F97316', // Четверг - оранжевый
    '#8B5CF6', // Пятница - фиолетовый
    '#EAB308', // Суббота - желтый
    '#6B7280', // Воскресенье - серый
  ];

  // Подготовка данных для графика
  const prepareChartData = () => {
    if (!entries || entries.length === 0) return [];

    // Получаем дни недели для текущей недели (для структуры)
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Понедельник
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 }); // Воскресенье
    const daysOfWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

    // Создаем объект для подсчета заработка по дням недели
    const weekdayTotals = {
      0: 0, // Воскресенье (getDay() возвращает 0 для воскресенья)
      1: 0, // Понедельник
      2: 0, // Вторник
      3: 0, // Среда
      4: 0, // Четверг
      5: 0, // Пятница
      6: 0, // Суббота
    };

    // Подсчитываем заработок для каждого дня недели
    entries.forEach((entry) => {
      const entryDate = parseISO(entry.date);
      const dayOfWeek = entryDate.getDay(); // 0 = воскресенье, 1 = понедельник, ...
      const earned = parseFloat(entry.earned) || 0;
      weekdayTotals[dayOfWeek] += earned;
    });

    // Преобразуем в массив, начиная с понедельника
    const weekdayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    const data = [];
    
    // Проходим по дням недели с понедельника до воскресенья
    for (let i = 1; i <= 6; i++) {
      data.push({
        day: weekdayNames[i - 1],
        dayIndex: i,
        earned: weekdayTotals[i],
      });
    }
    // Добавляем воскресенье в конец
    data.push({
      day: weekdayNames[6],
      dayIndex: 0,
      earned: weekdayTotals[0],
    });

    return data;
  };

  const chartData = prepareChartData();

  // Пустое состояние
  if (chartData.length === 0 || chartData.every((day) => day.earned === 0)) {
    return (
      <div className="glass-effect rounded-xl p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Доход по дням недели</h2>
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
      const value = payload[0].value;
      return (
        <div className="glass-effect rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-sm mb-2">{payload[0].payload.day}</p>
          <p className="text-sm">
            <span className="text-blue-600 dark:text-blue-400">Заработано: </span>
            <span className="font-medium">{value.toLocaleString('ru-RU')} ₽</span>
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
          <h2 className="text-xl font-bold">Доход по дням недели</h2>
          <InfoTooltip text="Суммарный заработок за каждый день недели. Помогает определить самые продуктивные дни." />
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
              dataKey="day"
              stroke="#6B7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#6B7280"
              style={{ fontSize: '12px' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="earned" 
              name="Заработано"
              radius={[4, 4, 0, 0]}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={weekdayColors[index]} />
              ))}
            </Bar>
          </BarChart>
        ) : chartType === 'area' ? (
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorWeekdayArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
            </defs>
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
              stroke="#6B7280"
              style={{ fontSize: '12px' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="earned" 
              name="Заработано" 
              stroke="#3B82F6" 
              fillOpacity={0.3} 
              fill="url(#colorWeekdayArea)"
            />
          </AreaChart>
        ) : (
          <LineChart data={chartData}>
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
              stroke="#6B7280"
              style={{ fontSize: '12px' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="earned" 
              name="Заработано" 
              stroke="#3B82F6"
              strokeWidth={2}
              dot={{ fill: '#3B82F6', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
