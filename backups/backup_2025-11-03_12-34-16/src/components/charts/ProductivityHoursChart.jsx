import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useEntriesStore } from '../../store/useEntriesStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { InfoTooltip } from '../ui/InfoTooltip';

/**
 * График продуктивности по часам дня
 * Показывает суммарный заработок в разные часы дня
 * Помогает определить самые продуктивные часы
 */
export function ProductivityHoursChart({ entries: entriesProp }) {
  const { entries: entriesStore } = useEntriesStore();
  const entries = entriesProp || entriesStore;
  const { theme } = useSettingsStore();

  // Подготовка данных
  const prepareChartData = () => {
    // Создаем массив для 24 часов
    const hourlyData = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      hourLabel: `${i.toString().padStart(2, '0')}:00`,
      earned: 0,
      count: 0, // Количество записей в этот час
    }));

    // Агрегируем данные по часам
    entries.forEach((entry) => {
      const start = entry.start || '00:00';
      const end = entry.end || '00:00';
      const earned = parseFloat(entry.earned) || 0;

      // Получаем часы начала и окончания
      const [startHour] = start.split(':').map(Number);
      const [endHour] = end.split(':').map(Number);

      // Если работа в пределах одного часа
      if (startHour === endHour) {
        hourlyData[startHour].earned += earned;
        hourlyData[startHour].count += 1;
      } else {
        // Распределяем заработок пропорционально между часами
        const duration = parseFloat(entry.duration) || 0;
        const earnedPerHour = duration > 0 ? earned / duration : 0;

        for (let h = startHour; h <= endHour && h < 24; h++) {
          hourlyData[h].earned += earnedPerHour;
          hourlyData[h].count += 1;
        }
      }
    });

    // Округляем значения
    return hourlyData.map(item => ({
      ...item,
      earned: parseFloat(item.earned.toFixed(2)),
    }));
  };

  const chartData = prepareChartData();
  const maxEarned = Math.max(...chartData.map(d => d.earned));
  const totalEarned = chartData.reduce((sum, d) => sum + d.earned, 0);

  // Функция для определения цвета столбца
  const getBarColor = (value) => {
    const intensity = maxEarned > 0 ? value / maxEarned : 0;
    if (intensity > 0.7) return '#10B981'; // Зеленый - высокая продуктивность
    if (intensity > 0.4) return '#3B82F6'; // Синий - средняя
    if (intensity > 0.1) return '#F59E0B'; // Желтый - низкая
    return '#9CA3AF'; // Серый - нет данных
  };

  // Пустое состояние
  if (totalEarned === 0) {
    return (
      <div className="glass-effect rounded-xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-xl font-bold">Продуктивность по часам</h2>
          <InfoTooltip text="Показывает суммарный заработок в разные часы дня. Помогает определить самые продуктивные часы для работы." />
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
      const percentage = totalEarned > 0 ? ((data.earned / totalEarned) * 100).toFixed(1) : 0;

      return (
        <div className="glass-effect rounded-lg p-3 shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-semibold text-sm mb-2">{data.hourLabel}</p>
          <div className="space-y-1">
            <p className="text-sm flex items-center justify-between gap-4">
              <span className="text-gray-600 dark:text-gray-400">Заработано:</span>
              <span className="font-medium">{data.earned.toFixed(2)} ₽</span>
            </p>
            <p className="text-sm flex items-center justify-between gap-4">
              <span className="text-gray-600 dark:text-gray-400">Доля:</span>
              <span className="font-medium">{percentage}%</span>
            </p>
            <p className="text-sm flex items-center justify-between gap-4">
              <span className="text-gray-600 dark:text-gray-400">Записей:</span>
              <span className="font-medium">{data.count}</span>
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
        <h2 className="text-xl font-bold">Продуктивность по часам</h2>
        <InfoTooltip text="Показывает суммарный заработок в разные часы дня. Помогает определить самые продуктивные часы для работы." />
      </div>

      {/* Сумма */}
      <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        Всего заработано: <span className="font-semibold text-gray-900 dark:text-white">{totalEarned.toFixed(2)} ₽</span>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart 
          data={chartData}
          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke={theme === 'dark' ? '#374151' : '#E5E7EB'}
            vertical={false}
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
            stroke="#6B7280"
            style={{ fontSize: '12px' }}
            label={{ value: 'Заработок (₽)', angle: -90, position: 'insideLeft', fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: theme === 'dark' ? 'rgba(55, 65, 81, 0.3)' : 'rgba(229, 231, 235, 0.5)' }} />
          <Bar 
            dataKey="earned" 
            radius={[8, 8, 0, 0]}
            animationDuration={800}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.earned)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Легенда */}
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
    </div>
  );
}

