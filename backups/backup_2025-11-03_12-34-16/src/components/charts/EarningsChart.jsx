import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useEntriesStore } from '../../store/useEntriesStore';

/**
 * 💡 Кастомный Tooltip для графика
 * Показывает: заработок, часы, среднюю ставку
 */
function CustomTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    
    return (
      <div className="glass-effect rounded-lg p-4 shadow-lg border border-gray-700">
        <p className="font-bold text-lg mb-2">{data.date}</p>
        <div className="space-y-1">
          <p className="text-green-400">
            ⏱️ Отработано: <span className="font-semibold">{data.hours} ч</span>
          </p>
          <p className="text-blue-400">
            💰 Заработано: <span className="font-semibold">{data.earned} ₽</span>
          </p>
          <p className="text-yellow-400">
            📊 Средняя ставка: <span className="font-semibold">{data.rate} ₽/ч</span>
          </p>
        </div>
      </div>
    );
  }
  
  return null;
}

/**
 * 📊 График заработка за последние 7 дней
 * - Линейный график с данными по дням
 * - Автоматическое вычисление заработка за каждый день
 * - Адаптивный размер (ResponsiveContainer)
 * @param {Array} entries - Отфильтрованные записи (опционально, если не передано - берет из store)
 */
export function EarningsChart({ entries: entriesProp }) {
  const { entries: entriesStore } = useEntriesStore();
  const entries = entriesProp || entriesStore; // Используем переданные или из store
  
  // Подготовка данных за последние 7 дней
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date.toISOString().split('T')[0];
  }).reverse();
  
  const chartData = last7Days.map(date => {
    const dayEntries = entries.filter(e => e.date === date);
    const earned = dayEntries.reduce((sum, e) => sum + parseFloat(e.earned || 0), 0);
    const hours = dayEntries.reduce((sum, e) => sum + parseFloat(e.duration || 0), 0);
    const averageRate = hours > 0 ? earned / hours : 0;
    
    return {
      date: new Date(date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
      earned: parseFloat(earned.toFixed(2)),
      hours: parseFloat(hours.toFixed(2)),
      rate: parseFloat(averageRate.toFixed(2)),
    };
  });
  
  return (
    <div className="glass-effect rounded-xl p-6 mb-6">
      <h2 className="text-xl font-bold mb-4">График заработка</h2>
      
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis 
            dataKey="date" 
            stroke="#9CA3AF"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#9CA3AF"
            style={{ fontSize: '12px' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ fontSize: '14px', paddingTop: '10px' }}
          />
          <Line 
            type="monotone" 
            dataKey="earned" 
            stroke="#3B82F6" 
            strokeWidth={3}
            dot={{ fill: '#3B82F6', r: 5 }}
            activeDot={{ r: 7 }}
            name="Заработано (₽)"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

