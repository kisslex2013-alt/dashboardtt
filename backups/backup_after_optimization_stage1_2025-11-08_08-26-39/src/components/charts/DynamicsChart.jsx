import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart3 } from 'lucide-react';
import { ChartTypeSwitcher } from '../ui/ChartTypeSwitcher';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useIsMobile } from '../../hooks/useIsMobile';
import { subDays, format, eachDayOfInterval, parseISO, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { InfoTooltip } from '../ui/InfoTooltip';
import { EmptyState } from '../ui/EmptyState';
import { ru } from 'date-fns/locale';

/**
 * 📊 График динамики заработка по дням
 * 
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 * 
 * Этот график показывает ваш ежедневный заработок за выбранный период.
 * Можно переключать тип отображения:
 * - Bar (столбцы) - хорошо показывает отдельные дни
 * - Line (линия) - показывает тренд
 * - Area (область) - визуально выделяет объем заработка
 * 
 * АДАПТИВНОСТЬ: На мобильных устройствах уменьшена высота графика и упрощена легенда
 * 
 * @param {Array} entries - Отфильтрованные записи
 * @param {string} dateFilter - Фильтр периода ('today', 'month', 'year', 'all', 'custom')
 * @param {Object} customDateRange - Кастомный диапазон дат (для 'custom')
 */
export function DynamicsChart({ entries, dateFilter = 'month', customDateRange = { start: '', end: '' } }) {
  const { theme } = useSettingsStore();
  const isMobile = useIsMobile();
  const [chartType, setChartType] = useState('line');

  // Подготовка данных для графика
  const prepareChartData = () => {
    if (!entries || entries.length === 0) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let startDate, endDate, days;

    // Определяем диапазон дат в зависимости от фильтра
    switch (dateFilter) {
      case 'today': {
        const todayStart = new Date(today);
        const todayEnd = new Date(today);
        todayEnd.setHours(23, 59, 59);
        days = eachDayOfInterval({ start: todayStart, end: todayEnd });
        
        // Для сегодняшнего дня создаем данные по часам
        const hourlyData = [];
        for (let hour = 0; hour < 24; hour++) {
          hourlyData.push({
            time: `${hour.toString().padStart(2, '0')}:00`,
            date: format(today, 'yyyy-MM-dd'),
            earned: 0,
          });
        }
        
        // Заполняем данные из entries
        entries.forEach((entry) => {
          if (entry.date === format(today, 'yyyy-MM-dd')) {
            const startHour = entry.start ? parseInt(entry.start.split(':')[0]) : 0;
            const earned = parseFloat(entry.earned) || 0;
            
            if (hourlyData[startHour]) {
              hourlyData[startHour].earned += earned;
            }
          }
        });
        
        return hourlyData;
      }

      case 'month': {
        startDate = startOfMonth(today);
        endDate = endOfMonth(today);
        break;
      }

      case 'year': {
        startDate = startOfYear(today);
        endDate = endOfYear(today);
        break;
      }

      case 'halfMonth1': {
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth(), 15);
        break;
      }

      case 'halfMonth2': {
        startDate = new Date(today.getFullYear(), today.getMonth(), 16);
        endDate = endOfMonth(today);
        break;
      }

      case 'all': {
        // Находим самый ранний и поздний день из записей
        const entryDates = entries.map(e => new Date(e.date));
        startDate = new Date(Math.min(...entryDates));
        endDate = new Date(Math.max(...entryDates));
        break;
      }

      case 'custom': {
        if (customDateRange.start && customDateRange.end) {
          startDate = new Date(customDateRange.start);
          endDate = new Date(customDateRange.end);
        } else {
          startDate = startOfMonth(today);
          endDate = endOfMonth(today);
        }
        break;
      }

      default: {
        startDate = startOfMonth(today);
        endDate = endOfMonth(today);
      }
    }

    // Создаем массив дней
    days = eachDayOfInterval({ start: startDate, end: endDate });

    // Инициализируем данные для каждого дня
    const data = days.map((day) => ({
      date: format(day, 'yyyy-MM-dd'),
      dateLabel: format(day, 'd MMM', { locale: ru }),
      earned: 0,
    }));

    // Заполняем данные из entries
    entries.forEach((entry) => {
      const entryDate = format(parseISO(entry.date), 'yyyy-MM-dd');
      const dayIndex = data.findIndex((d) => d.date === entryDate);

      if (dayIndex !== -1) {
        const earned = parseFloat(entry.earned) || 0;
        data[dayIndex].earned += earned;
      }
    });

    return data;
  };

  const chartData = prepareChartData();

  // ВИЗУАЛ: Empty State для графика
  if (chartData.length === 0 || chartData.every((day) => day.earned === 0)) {
    return (
      <div className="glass-effect rounded-xl p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold">Динамика доходов</h2>
            <InfoTooltip text="Показывает ваш ежедневный заработок за выбранный период." />
          </div>
          <ChartTypeSwitcher currentType={chartType} onChange={setChartType} />
        </div>
        <EmptyState
          icon={BarChart3}
          title="Нет данных за выбранный период"
          description="Добавьте записи времени за этот период, чтобы увидеть динамику дохода"
          variant="compact"
        />
      </div>
    );
  }

  // Кастомный tooltip с адаптивным размером для мобильных
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      return (
        <div className={`glass-effect rounded-lg shadow-lg ${isMobile ? 'p-4' : 'p-3'}`}>
          <p className={`font-semibold ${isMobile ? 'text-base mb-3' : 'text-sm mb-2'}`}>{label}</p>
          <p className={isMobile ? 'text-base' : 'text-sm'}>
            <span className="text-blue-600 dark:text-blue-400">Доход: </span>
            <span className="font-medium">{value.toLocaleString('ru-RU')} ₽</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Определяем dataKey для оси X в зависимости от фильтра
  const xAxisDataKey = dateFilter === 'today' ? 'time' : 'dateLabel';

  return (
    <div className="glass-effect rounded-xl p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold">Динамика доходов</h2>
          <InfoTooltip text="Показывает ваш ежедневный заработок за выбранный период." />
        </div>
        <ChartTypeSwitcher currentType={chartType} onChange={setChartType} />
      </div>

      <ResponsiveContainer width="100%" height={isMobile ? 280 : 350}>
        {chartType === 'bar' ? (
          <BarChart data={chartData}>
            <defs>
              <linearGradient id="colorEarnedBar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.3} />
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke={theme === 'dark' ? '#374151' : '#E5E7EB'} 
            />
            <XAxis 
              dataKey={xAxisDataKey}
              stroke="#6B7280"
              style={{ fontSize: '12px' }}
              interval={dateFilter === 'today' ? 2 : 'preserveStartEnd'}
            />
            <YAxis 
              stroke="#6B7280"
              style={{ fontSize: '12px' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="earned" 
              name="Доход" 
              fill="url(#colorEarnedBar)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        ) : chartType === 'area' ? (
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorEarnedArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke={theme === 'dark' ? '#374151' : '#E5E7EB'} 
            />
            <XAxis 
              dataKey={xAxisDataKey}
              stroke="#6B7280"
              style={{ fontSize: '12px' }}
              interval={dateFilter === 'today' ? 2 : 'preserveStartEnd'}
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
              fill="url(#colorEarnedArea)"
            />
          </AreaChart>
        ) : (
          <LineChart data={chartData}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke={theme === 'dark' ? '#374151' : '#E5E7EB'} 
            />
            <XAxis 
              dataKey={xAxisDataKey}
              stroke="#6B7280"
              style={{ fontSize: '12px' }}
              interval={dateFilter === 'today' ? 2 : 'preserveStartEnd'}
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
              strokeWidth={2}
              dot={{ fill: '#3B82F6', r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
