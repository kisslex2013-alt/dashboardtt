import { memo } from 'react';
import { AnimatedCounter } from '../ui/AnimatedCounter';
import { ComparisonStat } from './ComparisonStat';

/**
 * 📊 Карточка статистики с анимированным счетчиком
 * 
 * Отображает одну метрику статистики:
 * - Заголовок (title)
 * - Анимированное числовое значение через AnimatedCounter
 * - Иконку в правом нижнем углу с градиентным фоном
 * - Опциональное сравнение с предыдущим периодом
 * 
 * Оптимизирован с React.memo для предотвращения пересоздания при каждом рендере родителя
 * 
 * @param {string} title - Заголовок карточки
 * @param {string} value - Строковое значение (для обратной совместимости)
 * @param {number} numericValue - Числовое значение для анимации
 * @param {string} suffix - Суффикс после значения (например, " ч.", " ₽")
 * @param {number} decimals - Количество знаков после запятой
 * @param {Component} icon - React компонент иконки
 * @param {string} gradient - CSS класс градиента фона
 * @param {string} accentClass - Класс цвета акцента (для определения цвета иконки)
 * @param {string} glowClass - CSS класс эффекта свечения
 * @param {string} titleColorClass - CSS класс цвета заголовка
 * @param {string} iconOpacity - Прозрачность иконки (по умолчанию '0.3')
 * @param {Object} comparison - Объект сравнения {current, previous}
 * @param {string} periodFilter - Текущий фильтр периода (не используется, но передается)
 * @param {boolean} immediate - Флаг для немедленного обновления без анимации
 */
export const StatCard = memo(function StatCard({ 
  title, 
  value, 
  numericValue, 
  suffix, 
  decimals = 0, 
  icon: Icon, 
  gradient, 
  accentClass, 
  glowClass, 
  titleColorClass, 
  iconOpacity = '0.3', 
  comparison, 
  periodFilter, 
  immediate 
}) {
  // Определяем inline style для иконки с нужной прозрачностью
  const iconColor = accentClass === 'blue-500' ? 'rgba(59, 130, 246, ' + iconOpacity + ')' :
                    accentClass === 'teal-500' ? 'rgba(20, 184, 166, ' + iconOpacity + ')' :
                    accentClass === 'green-500' ? 'rgba(16, 185, 129, ' + iconOpacity + ')' :
                    accentClass === 'purple-500' ? 'rgba(139, 92, 246, ' + iconOpacity + ')' :
                    accentClass === 'orange-500' ? 'rgba(249, 115, 22, ' + iconOpacity + ')' :
                    accentClass === 'yellow-500' ? 'rgba(251, 191, 36, ' + iconOpacity + ')' :
                    'rgba(156, 163, 175, ' + iconOpacity + ')';
  
  // Поддержка обратной совместимости: если передано value (строка), парсим его
  let finalNumericValue = numericValue;
  let finalSuffix = suffix || '';
  let finalDecimals = decimals;
  
  if (value && !numericValue) {
    // Парсим строку (поддержка старого формата)
    const numStr = value.replace(/[^\d.,]/g, '').replace(',', '.');
    finalNumericValue = parseFloat(numStr) || 0;
    
    const suffixMatch = value.match(/(?:\d+[.,]\d+|\d+)\s*(.+)/);
    finalSuffix = suffixMatch ? suffixMatch[1].trim() : '';
    
    const decimalsMatch = value.match(/[\d.,]+/);
    if (decimalsMatch) {
      const numStrMatch = decimalsMatch[0].replace(',', '.');
      const parts = numStrMatch.split('.');
      finalDecimals = parts.length > 1 ? parts[1].length : 0;
    }
  }
  
  // ✅ ИСПРАВЛЕНИЕ: Принудительно округляем значение, если decimals === 0
  if (finalDecimals === 0 && finalNumericValue !== undefined && finalNumericValue !== null) {
    finalNumericValue = Math.round(finalNumericValue);
  }
  
  // Определяем цвет для hover эффектов на основе accentClass
  const getHoverBorderClass = () => {
    if (accentClass === 'blue-500') return 'hover:border-blue-500 dark:hover:border-blue-400';
    if (accentClass === 'teal-500') return 'hover:border-teal-500 dark:hover:border-teal-400';
    if (accentClass === 'green-500') return 'hover:border-green-500 dark:hover:border-green-400';
    if (accentClass === 'purple-500') return 'hover:border-purple-500 dark:hover:border-purple-400';
    if (accentClass === 'orange-500') return 'hover:border-orange-500 dark:hover:border-orange-400';
    if (accentClass === 'yellow-500') return 'hover:border-yellow-500 dark:hover:border-yellow-400';
    return 'hover:border-gray-500 dark:hover:border-gray-400';
  };
  
  const getHoverShadowClass = () => {
    if (accentClass === 'blue-500') return 'hover:shadow-lg hover:shadow-blue-500/20';
    if (accentClass === 'teal-500') return 'hover:shadow-lg hover:shadow-teal-500/20';
    if (accentClass === 'green-500') return 'hover:shadow-lg hover:shadow-green-500/20';
    if (accentClass === 'purple-500') return 'hover:shadow-lg hover:shadow-purple-500/20';
    if (accentClass === 'orange-500') return 'hover:shadow-lg hover:shadow-orange-500/20';
    if (accentClass === 'yellow-500') return 'hover:shadow-lg hover:shadow-yellow-500/20';
    return 'hover:shadow-lg hover:shadow-gray-500/20';
  };
  
  const getIconHoverClass = () => {
    if (accentClass === 'blue-500') return 'group-hover:text-blue-500/80 dark:group-hover:text-blue-400/70 group-hover:scale-110';
    if (accentClass === 'teal-500') return 'group-hover:text-teal-500/80 dark:group-hover:text-teal-400/70 group-hover:scale-110';
    if (accentClass === 'green-500') return 'group-hover:text-green-500/80 dark:group-hover:text-green-400/70 group-hover:scale-110';
    if (accentClass === 'purple-500') return 'group-hover:text-purple-500/80 dark:group-hover:text-purple-400/70 group-hover:scale-110';
    if (accentClass === 'orange-500') return 'group-hover:text-orange-500/80 dark:group-hover:text-orange-400/70 group-hover:scale-110';
    if (accentClass === 'yellow-500') return 'group-hover:text-yellow-500/80 dark:group-hover:text-yellow-400/70 group-hover:scale-110';
    return 'group-hover:text-gray-500/80 dark:group-hover:text-gray-400/70 group-hover:scale-110';
  };
  
  const getIconBaseClass = () => {
    if (accentClass === 'blue-500') return 'text-blue-500/50 dark:text-blue-400/40';
    if (accentClass === 'teal-500') return 'text-teal-500/50 dark:text-teal-400/40';
    if (accentClass === 'green-500') return 'text-green-500/50 dark:text-green-400/40';
    if (accentClass === 'purple-500') return 'text-purple-500/50 dark:text-purple-400/40';
    if (accentClass === 'orange-500') return 'text-orange-500/50 dark:text-orange-400/40';
    if (accentClass === 'yellow-500') return 'text-yellow-500/50 dark:text-yellow-400/40';
    return 'text-gray-500/50 dark:text-gray-400/40';
  };
  
  // Определяем цвет границы на основе accentClass
  const getBorderColor = () => {
    if (accentClass === 'blue-500') return 'rgba(59, 130, 246, 0.4)';
    if (accentClass === 'teal-500') return 'rgba(20, 184, 166, 0.4)';
    if (accentClass === 'green-500') return 'rgba(34, 197, 94, 0.4)';
    if (accentClass === 'purple-500') return 'rgba(168, 85, 247, 0.4)';
    if (accentClass === 'orange-500') return 'rgba(249, 115, 22, 0.4)';
    if (accentClass === 'yellow-500') return 'rgba(251, 191, 36, 0.4)';
    return 'rgba(156, 163, 175, 0.4)';
  };

  return (
    <div 
      className={`glass-card relative rounded-2xl p-4 overflow-hidden ${glowClass} ${gradient} border border-transparent hover:border-opacity-100 ${getHoverBorderClass()} ${getHoverShadowClass()} transition-all duration-300 group`}
      style={{ borderColor: getBorderColor() }}
    >
      {/* Процент сравнения в нижнем правом углу */}
      {comparison && (
        <div className="absolute bottom-2 right-2 z-20">
          <ComparisonStat current={comparison.current} previous={comparison.previous} />
        </div>
      )}
      
      <div className="relative z-10">
        <p className={`text-xs font-semibold mb-1 uppercase tracking-wide ${titleColorClass}`}>{title}</p>
        {numericValue !== undefined ? (
          <AnimatedCounter 
            value={finalNumericValue}
            suffix={finalSuffix}
            decimals={finalDecimals}
            className="text-2xl font-bold text-gray-900 dark:text-white leading-tight"
            style={{ whiteSpace: 'nowrap', wordBreak: 'keep-all', overflow: 'hidden', textOverflow: 'ellipsis' }}
            immediate={immediate}
          />
        ) : (
          <p className="text-2xl font-bold text-gray-900 dark:text-white leading-tight" style={{ whiteSpace: 'nowrap', wordBreak: 'keep-all', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</p>
        )}
      </div>
      
      {Icon && (
        <Icon 
          className={`absolute -right-5 -bottom-5 w-24 h-24 pointer-events-none transition-all duration-300 ${getIconBaseClass()} ${getIconHoverClass()}`}
          size={96}
          strokeWidth={2}
          fill="none"
        />
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // ✅ ИСПРАВЛЕНИЕ: Кастомная функция сравнения для React.memo
  // Сравниваем только примитивные значения, игнорируя объекты (comparison)
  // Это гарантирует, что компонент обновится при изменении numericValue или immediate
  return (
    prevProps.title === nextProps.title &&
    prevProps.value === nextProps.value &&
    prevProps.numericValue === nextProps.numericValue &&
    prevProps.suffix === nextProps.suffix &&
    prevProps.decimals === nextProps.decimals &&
    prevProps.icon === nextProps.icon &&
    prevProps.gradient === nextProps.gradient &&
    prevProps.accentClass === nextProps.accentClass &&
    prevProps.glowClass === nextProps.glowClass &&
    prevProps.titleColorClass === nextProps.titleColorClass &&
    prevProps.iconOpacity === nextProps.iconOpacity &&
    prevProps.periodFilter === nextProps.periodFilter &&
    prevProps.immediate === nextProps.immediate &&
    // Сравниваем comparison только по значениям, не по ссылке
    (prevProps.comparison === nextProps.comparison ||
     (prevProps.comparison?.current === nextProps.comparison?.current &&
      prevProps.comparison?.previous === nextProps.comparison?.previous) ||
     (!prevProps.comparison && !nextProps.comparison))
  );
});
