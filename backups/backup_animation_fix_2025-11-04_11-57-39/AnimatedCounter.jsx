import { useSpring, animated, config } from '@react-spring/web';
import { useRef, useMemo } from 'react';

/**
 * 📊 Компонент для анимированного отображения чисел
 * 
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 * 
 * Этот компонент плавно анимирует изменение числового значения.
 * Когда число меняется, оно плавно "пересчитывается" от старого значения к новому.
 * 
 * Например, если было 100, а стало 200, то число будет плавно меняться:
 * 100 → 101 → 102 → ... → 199 → 200
 * 
 * Используется библиотека react-spring для плавных анимаций.
 * 
 * @param {number|string} value - Числовое значение для отображения
 * @param {string} format - Формат отображения ('number' | 'currency' | 'hours' | 'custom')
 * @param {function} formatter - Кастомная функция форматирования (для format='custom')
 * @param {string} locale - Локаль для форматирования (по умолчанию 'ru-RU')
 * @param {object|string} springConfig - Конфигурация анимации или пресет ('default', 'slow', 'gentle', etc.)
 * @param {string} className - CSS классы для контейнера
 * @param {number} decimals - Количество знаков после запятой (по умолчанию 0)
 * @param {string} suffix - Суффикс после числа (например, '₽', 'ч.', 'д.')
 * @param {string} prefix - Префикс перед числом
 * @param {object} style - Инлайн стили
 * @param {boolean} immediate - Пропустить анимацию (для принудительного мгновенного обновления)
 * 
 * @example
 * // Простое число
 * <AnimatedCounter value={1234} />
 * 
 * // Валюта
 * <AnimatedCounter value={5000} format="currency" suffix="₽" />
 * 
 * // Часы с 2 знаками после запятой
 * <AnimatedCounter value={8.5} format="hours" decimals={2} suffix=" ч." />
 */
export function AnimatedCounter({
  value,
  format = 'number',
  formatter,
  locale = 'ru-RU',
  springConfig = { duration: 800, tension: 120, friction: 14 },
  className = '',
  decimals = 0,
  suffix = '',
  prefix = '',
  style,
  immediate: forceImmediate = false,
}) {
  // ✅ ПРАВИЛЬНЫЙ ПОДХОД: Мемоизация парсинга значения
  const numericValue = useMemo(() => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const cleaned = value.replace(/[^\d.,-]/g, '');
      const parsed = parseFloat(cleaned.replace(',', '.'));
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }, [value]);

  // ✅ ИСПРАВЛЕНИЕ: Используем ref для отслеживания первого рендера
  // Это нужно только для пропуска анимации при первом рендере
  const isFirstRender = useRef(true);
  const previousValue = useRef(numericValue);
  
  // ✅ ПРАВИЛЬНЫЙ ПОДХОД: Мемоизация конфигурации анимации
  const effectiveConfig = useMemo(() => {
    if (typeof springConfig === 'string') {
      switch (springConfig) {
        case 'slow':
          return config.slow;
        case 'molasses':
          return config.molasses;
        case 'gentle':
          return config.gentle;
        case 'wobbly':
          return config.wobbly;
        case 'stiff':
          return config.stiff;
        default:
          return config.default;
      }
    }
    return springConfig;
  }, [springConfig]);

  // ✅ УПРОЩЕННЫЙ ПОДХОД: useSpring автоматически отслеживает изменения numericValue
  // Используем объектную форму - React Spring автоматически анимирует изменения
  const shouldBeImmediate = forceImmediate || isFirstRender.current;
  
  // Логируем начало анимации перед обновлением предыдущего значения
  if (!isFirstRender.current && previousValue.current !== numericValue && !forceImmediate) {
    if (process.env.NODE_ENV === 'development') {
      console.log('🎬 AnimatedCounter - Animation started:', {
        from: previousValue.current,
        to: numericValue
      });
    }
  }
  
  // Обновляем предыдущее значение после логирования
  if (previousValue.current !== numericValue) {
    previousValue.current = numericValue;
  }
  
  // После первого рендера сбрасываем флаг
  if (isFirstRender.current) {
    isFirstRender.current = false;
  }
  
  const { number } = useSpring({
    number: numericValue,
    config: effectiveConfig,
    immediate: shouldBeImmediate,
    onRest: () => {
      if (process.env.NODE_ENV === 'development' && !shouldBeImmediate) {
        console.log('✅ AnimatedCounter - Animation completed:', numericValue);
      }
    }
  });

  // Форматирование значения
  const formatValue = (n) => {
    if (isNaN(n) || n === undefined || n === null || !isFinite(n)) {
      return formatNumber(0, decimals, locale, formatter);
    }
    
    const rounded = decimals === 0 
      ? Math.round(n)
      : Number(n.toFixed(decimals));
    
    return formatNumber(rounded, decimals, locale, formatter);
  };

  // Форматируем значение через number.to() для анимации
  // Используем animated.span для правильного рендеринга интерполированного значения
  return (
    <animated.span 
      className={className} 
      style={{
        ...style,
        display: 'inline-block',
        whiteSpace: style?.whiteSpace || 'nowrap',
        wordBreak: style?.wordBreak || 'keep-all'
      }}
    >
      {number.to((n) => {
        const formatted = formatValue(n);
        // Возвращаем полную строку с префиксом и суффиксом
        return prefix ? `${prefix}${formatted}${suffix}` : `${formatted}${suffix}`;
      })}
    </animated.span>
  );
}

// Вспомогательная функция для форматирования числа
function formatNumber(num, decimals, locale, formatter) {
  if (formatter) {
    return formatter(num);
  }
  
  // ✅ ИСПРАВЛЕНИЕ: Явно указываем дробные знаки даже для decimals === 0
  // Это предотвращает автоматическое добавление десятичных знаков в зависимости от локали
  return num.toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}
