import { motion, useSpring, useTransform } from 'framer-motion';
import { useMemo, useEffect, useState, useRef } from 'react';

/**
 * 📊 Компонент для анимированного отображения чисел
 * 
 * ✅ FRAMER MOTION: Простая и надежная анимация
 * Автоматически анимирует изменение числовых значений.
 * 
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 * 
 * Этот компонент плавно анимирует изменение числового значения.
 * Когда число меняется, оно плавно "пересчитывается" от старого значения к новому.
 * 
 * Например, если было 100, а стало 200, то число будет плавно меняться:
 * 100 → 101 → 102 → ... → 199 → 200
 * 
 * Используется библиотека framer-motion для плавных анимаций.
 * 
 * @param {number|string} value - Числовое значение для отображения
 * @param {string} format - Формат отображения (не используется, оставлен для совместимости)
 * @param {function} formatter - Кастомная функция форматирования
 * @param {string} locale - Локаль для форматирования (по умолчанию 'ru-RU')
 * @param {object|string} springConfig - Конфигурация анимации (не используется, оставлен для совместимости)
 * @param {string} className - CSS классы для контейнера
 * @param {number} decimals - Количество знаков после запятой (по умолчанию 0)
 * @param {string} suffix - Суффикс после числа (например, '₽', 'ч.', 'д.')
 * @param {string} prefix - Префикс перед числом
 * @param {object} style - Инлайн стили
 * @param {boolean} immediate - Пропустить анимацию (для принудительного мгновенного обновления)
 * @param {number} duration - Длительность анимации в секундах (по умолчанию 0.8)
 * @param {boolean|string} resetAnimation - Перезапустить анимацию (для запуска анимации при загрузке/раскрытии)
 * 
 * @example
 * // Простое число
 * <AnimatedCounter value={1234} />
 * 
 * // Валюта
 * <AnimatedCounter value={5000} suffix=" ₽" />
 * 
 * // Часы с 2 знаками после запятой
 * <AnimatedCounter value={8.5} decimals={2} suffix=" ч." />
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
  duration = 0.8,
  resetAnimation = false,
}) {
  // ✅ Парсим значение один раз через useMemo для оптимизации
  const numericValue = useMemo(() => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const cleaned = value.replace(/[^\d.,-]/g, '');
      const parsed = parseFloat(cleaned.replace(',', '.'));
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }, [value]);

  // ✅ Framer Motion useSpring для плавной анимации чисел
  // Создаем spring, который будет анимировать изменение значения
  // Используем начальное значение 0 для анимации при загрузке/раскрытии
  const isFirstMountRef = useRef(true);
  const previousResetAnimationRef = useRef(resetAnimation);
  const springValue = useSpring(0, {
    stiffness: 100,      // Жесткость пружины (выше = быстрее)
    damping: 30,        // Демпфирование (выше = меньше колебаний)
    duration: forceImmediate ? 0 : duration,  // Длительность анимации
  });

  // ✅ Запускаем анимацию при первом монтировании или при изменении resetAnimation
  useEffect(() => {
    // Проверяем, нужно ли перезапустить анимацию
    // resetAnimation может быть булевым значением или строкой
    const resetChanged = String(resetAnimation) !== String(previousResetAnimationRef.current);
    const shouldReset = isFirstMountRef.current || (resetAnimation && resetChanged);
    
    if (shouldReset) {
      // Сбрасываем анимацию для перезапуска
      springValue.set(0);
      // Запускаем анимацию после небольшой задержки
      const timer = setTimeout(() => {
        springValue.set(numericValue);
        isFirstMountRef.current = false;
        previousResetAnimationRef.current = resetAnimation;
      }, 100);
      return () => clearTimeout(timer);
    } else if (!isFirstMountRef.current) {
      // При изменении значения обновляем spring (только если уже не первый рендер)
      // ✅ ИСПРАВЛЕНО: Всегда обновляем значение при изменении, даже если не первый рендер
      springValue.set(numericValue);
    }
  }, [numericValue, springValue, resetAnimation]);

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

  // ✅ Преобразуем spring в отформатированное значение для отображения
  // useTransform автоматически отслеживает изменения springValue и обновляет отформатированное значение
  const displayValue = useTransform(springValue, (latest) => {
    const formatted = formatValue(latest);
    return prefix ? `${prefix}${formatted}${suffix}` : `${formatted}${suffix}`;
  });

  // ✅ Рендерим анимированное значение через motion.span
  return (
    <motion.span 
      className={className} 
      style={{
        ...style,
        display: 'inline-block',
        whiteSpace: style?.whiteSpace || 'nowrap',
        wordBreak: style?.wordBreak || 'keep-all'
      }}
    >
      {displayValue}
    </motion.span>
  );
}

// Вспомогательная функция для форматирования числа
function formatNumber(num, decimals, locale, formatter) {
  if (formatter) {
    return formatter(num);
  }
  
  return num.toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}
