import { motion, useSpring, useTransform } from 'framer-motion';
import { useRef, useEffect, useMemo } from 'react';

/**
 * 📅 Компонент для анимированной даты в формате DD.MM.YYYY
 * 
 * Анимирует каждую часть даты (день, месяц, год) от 0 до реального значения
 * 
 * @param {string} dateString - Дата в формате DD.MM.YYYY
 * @param {string} className - CSS классы
 * @param {boolean} shouldAnimate - Запускать ли анимацию
 * @param {number} delay - Задержка анимации в секундах
 */
export function AnimatedDate({ 
  dateString, 
  className = '', 
  shouldAnimate = true,
  delay = 0 
}) {
  const isFirstMountRef = useRef(true);
  const previousShouldAnimateRef = useRef(shouldAnimate);
  
  // Парсим дату
  const dateParts = useMemo(() => {
    const match = dateString.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (!match) return null;
    return {
      day: parseInt(match[1], 10),
      month: parseInt(match[2], 10),
      year: parseInt(match[3], 10)
    };
  }, [dateString]);

  if (!dateParts) {
    // Если формат некорректный, просто возвращаем строку
    return <span className={className}>{dateString}</span>;
  }

  // Создаем spring для каждой части
  const daySpring = useSpring(0, { stiffness: 100, damping: 30, duration: 0.8 });
  const monthSpring = useSpring(0, { stiffness: 100, damping: 30, duration: 0.8 });
  const yearSpring = useSpring(0, { stiffness: 100, damping: 30, duration: 0.8 });

  // Запускаем анимацию
  useEffect(() => {
    const shouldReset = isFirstMountRef.current || 
      (shouldAnimate && String(shouldAnimate) !== String(previousShouldAnimateRef.current));
    
    if (shouldReset) {
      daySpring.set(0);
      monthSpring.set(0);
      yearSpring.set(0);
      
      const timer = setTimeout(() => {
        daySpring.set(dateParts.day);
        setTimeout(() => {
          monthSpring.set(dateParts.month);
          setTimeout(() => {
            yearSpring.set(dateParts.year);
            isFirstMountRef.current = false;
            previousShouldAnimateRef.current = shouldAnimate;
          }, 100);
        }, 100);
      }, 100 + delay * 1000);
      
      return () => clearTimeout(timer);
    } else if (!isFirstMountRef.current) {
      daySpring.set(dateParts.day);
      monthSpring.set(dateParts.month);
      yearSpring.set(dateParts.year);
    }
  }, [dateParts, daySpring, monthSpring, yearSpring, shouldAnimate, delay]);

  // Форматируем значения для отображения
  const displayDay = useTransform(daySpring, (latest) => {
    return Math.round(latest).toString().padStart(2, '0');
  });

  const displayMonth = useTransform(monthSpring, (latest) => {
    return Math.round(latest).toString().padStart(2, '0');
  });

  const displayYear = useTransform(yearSpring, (latest) => {
    return Math.round(latest).toString();
  });

  return (
    <span 
      className={className}
      style={{ display: 'inline-block' }}
    >
      <motion.span style={{ display: 'inline-block' }}>{displayDay}</motion.span>.
      <motion.span style={{ display: 'inline-block' }}>{displayMonth}</motion.span>.
      <motion.span style={{ display: 'inline-block' }}>{displayYear}</motion.span>
    </span>
  );
}

