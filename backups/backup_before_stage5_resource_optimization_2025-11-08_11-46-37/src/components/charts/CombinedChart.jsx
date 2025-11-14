import { useState, useMemo } from 'react';
import { ComposedChart, Line, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartTypeSwitcher } from '../ui/ChartTypeSwitcher';
import { useSettingsStore } from '../../store/useSettingsStore';
import { format, parseISO, startOfMonth, endOfMonth, startOfYear, endOfYear, eachDayOfInterval, subDays } from 'date-fns';
import { InfoTooltip } from '../ui/InfoTooltip';
import { calculateDuration } from '../../utils/calculations';

/**
 * 📊 Объединенный график динамики доходов и ставки
 * 
 * Показывает доход и почасовую ставку на одном графике с двумя осями Y
 * 
 * @param {Array} entries - Отфильтрованные записи
 * @param {string} dateFilter - Фильтр периода
 * @param {Object} customDateRange - Кастомный диапазон дат
 */
export function CombinedChart({ entries, dateFilter = 'month', customDateRange = { start: '', end: '' }, chartVisibility }) {
  const { theme, combinedDynamicsType, combinedRateType, updateSettings } = useSettingsStore();

  // Подготовка данных для графика (аналогично DynamicsChart, но с добавлением avgRate)
  const chartData = useMemo(() => {
    if (!entries || entries.length === 0) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let startDate, endDate, days;

    // Определяем диапазон дат
    switch (dateFilter) {
      case 'today': {
        const hourlyData = [];
        for (let hour = 0; hour < 24; hour++) {
          hourlyData.push({
            time: `${hour.toString().padStart(2, '0')}:00`,
            date: format(today, 'yyyy-MM-dd'),
            earned: 0,
            hours: 0,
            avgRate: 0,
          });
        }
        
        entries.forEach((entry) => {
          if (entry.date === format(today, 'yyyy-MM-dd')) {
            const startHour = entry.start ? parseInt(entry.start.split(':')[0]) : 0;
            const earned = parseFloat(entry.earned) || 0;
            const duration = parseFloat(entry.duration) || (entry.start && entry.end ? calculateDuration(entry.start, entry.end) : 0);
            
            if (hourlyData[startHour]) {
              hourlyData[startHour].earned += earned;
              hourlyData[startHour].hours += duration;
            }
          }
        });
        
        // Рассчитываем avgRate
        hourlyData.forEach((hour) => {
          if (hour.hours > 0) {
            hour.avgRate = hour.earned / hour.hours;
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
        const entryDates = entries.map(e => new Date(e.date));
        startDate = new Date(Math.min(...entryDates));
        endDate = new Date(Math.max(...entryDates));
        break;
      }
      case 'custom': {
        if (customDateRange.start && customDateRange.end) {
          startDate = parseISO(customDateRange.start);
          endDate = parseISO(customDateRange.end);
        } else {
          return [];
        }
        break;
      }
      default:
        return [];
    }

    days = eachDayOfInterval({ start: startDate, end: endDate });
    
    // Группируем записи по дням
    const dailyData = days.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayEntries = entries.filter(e => e.date === dateStr);
      
      const earned = dayEntries.reduce((sum, e) => sum + (parseFloat(e.earned) || 0), 0);
      const hours = dayEntries.reduce((sum, e) => {
        if (e.duration) return sum + parseFloat(e.duration);
        if (e.start && e.end) return sum + calculateDuration(e.start, e.end);
        return sum;
      }, 0);
      
      const avgRate = hours > 0 ? earned / hours : 0;
      
      return {
        date: dateStr,
        dateLabel: format(date, 'dd MMM', { locale: { localize: { month: (n) => ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'][n] } } }),
        earned,
        hours,
        avgRate,
      };
    });

    return dailyData;
  }, [entries, dateFilter, customDateRange]);

  if (chartData.length === 0) {
    return (
      <div className="glass-effect rounded-xl p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold">Общая динамика</h2>
            <InfoTooltip text="Совмещенный график дохода и почасовой ставки для сравнения." />
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
          <p className="text-sm">Нет данных для отображения</p>
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
          <p className="font-semibold text-sm mb-2">
            {dateFilter === 'today' ? data.time : data.dateLabel}
          </p>
          {payload.map((item, index) => {
            if (item.dataKey === 'earned') {
              return (
                <p key={index} className="text-sm" style={{ color: item.color }}>
                  Доход: <span className="font-medium">{item.value.toLocaleString('ru-RU')} ₽</span>
                </p>
              );
            }
            if (item.dataKey === 'avgRate') {
              return (
                <p key={index} className="text-sm" style={{ color: item.color }}>
                  Ставка: <span className="font-medium">{Math.round(item.value)} ₽/ч</span>
                </p>
              );
            }
            return null;
          })}
        </div>
      );
    }
    return null;
  };

  const xAxisDataKey = dateFilter === 'today' ? 'time' : 'dateLabel';

  return (
    <div className="glass-effect rounded-xl p-6 mb-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold">Общая динамика</h2>
          <InfoTooltip text="Совмещенный график дохода и почасовой ставки для сравнения." />
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm">Доход:</span>
            <ChartTypeSwitcher 
              currentType={combinedDynamicsType} 
              onChange={(type) => updateSettings({ combinedDynamicsType: type })} 
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">Ставка:</span>
            <ChartTypeSwitcher 
              currentType={combinedRateType} 
              onChange={(type) => updateSettings({ combinedRateType: type })} 
            />
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <ComposedChart data={chartData}>
          <defs>
            <linearGradient id="colorEarnedCombined" x1="0" y1="0" x2="0" y2="1">
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
            yAxisId="left"
            orientation="left"
            stroke="#3B82F6"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            stroke="#8B5CF6"
            style={{ fontSize: '12px' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          
          {/* Доход - в режиме совместно показываем всегда, если включен хотя бы один из графиков */}
          {(chartVisibility?.dynamics || chartVisibility?.rateDistribution) && combinedDynamicsType === 'area' && (
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="earned"
              name="Доход"
              stroke="#3B82F6"
              fillOpacity={1}
              fill="url(#colorEarnedCombined)"
            />
          )}
          {(chartVisibility?.dynamics || chartVisibility?.rateDistribution) && combinedDynamicsType === 'line' && (
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="earned"
              name="Доход"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={{ fill: '#3B82F6', r: 3 }}
            />
          )}
          {(chartVisibility?.dynamics || chartVisibility?.rateDistribution) && combinedDynamicsType === 'bar' && (
            <Bar
              yAxisId="left"
              dataKey="earned"
              name="Доход"
              fill="#3B82F6"
              radius={[4, 4, 0, 0]}
            />
          )}
          
          {/* Ставка - в режиме совместно показываем всегда, если включен хотя бы один из графиков */}
          {(chartVisibility?.dynamics || chartVisibility?.rateDistribution) && combinedRateType === 'line' && (
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="avgRate"
              name="Ставка"
              stroke="#8B5CF6"
              strokeWidth={3}
              dot={{ fill: '#8B5CF6', r: 3 }}
            />
          )}
          {(chartVisibility?.dynamics || chartVisibility?.rateDistribution) && combinedRateType === 'area' && (
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="avgRate"
              name="Ставка"
              stroke="#8B5CF6"
              fill="#8B5CF6"
              fillOpacity={0.3}
            />
          )}
          {(chartVisibility?.dynamics || chartVisibility?.rateDistribution) && combinedRateType === 'bar' && (
            <Bar
              yAxisId="right"
              dataKey="avgRate"
              name="Ставка"
              fill="#8B5CF6"
              radius={[4, 4, 0, 0]}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
