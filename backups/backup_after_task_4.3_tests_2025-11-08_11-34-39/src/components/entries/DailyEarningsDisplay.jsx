/**
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 * 
 * Этот компонент отображает заработок за день.
 * Он разделен из EditEntryModal для улучшения читаемости.
 */

/**
 * Компонент отображения заработка за день
 * @param {Object} props - Пропсы компонента
 * @param {number} props.dailyEarnings - Заработок за день
 * @param {string} props.date - Дата для отображения
 */
export function DailyEarningsDisplay({ dailyEarnings, date }) {
  if (!date) return null;

  return (
    <div className="py-3 border-t border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Заработок за день:
          </span>
        </div>
        <span className="text-lg font-bold text-green-600 dark:text-green-400">
          {dailyEarnings.toLocaleString('ru-RU')} ₽
        </span>
      </div>
    </div>
  );
}

