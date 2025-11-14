import { useRef, useEffect, useState } from 'react';

/**
 * ✨ Компонент для анимации текста с эффектом мерцания
 * 
 * Буквы мерцают при появлении с эффектом свечения
 * Основан на варианте 4 из primer/matrix-text-animations/matrix-animation-variant-4-flicker.html
 * 
 * @param {string} text - Текст для анимации
 * @param {string} className - CSS классы
 * @param {boolean} shouldAnimate - Запускать ли анимацию
 * @param {number} delay - Задержка анимации в секундах
 * @param {number} letterDelay - Задержка между буквами в секундах
 * @param {boolean} hasGlow - Использовать эффект свечения
 * @param {boolean} longFlicker - Длительное мерцание (больше циклов)
 */
export function AnimatedFlicker({ 
  text, 
  className = '', 
  shouldAnimate = true,
  delay = 0,
  letterDelay = 0.05,
  hasGlow = false,
  longFlicker = false
}) {
  const isFirstMountRef = useRef(true);
  const previousShouldAnimateRef = useRef(shouldAnimate);
  const [letterStates, setLetterStates] = useState({});

  useEffect(() => {
    const shouldReset = isFirstMountRef.current || 
      (shouldAnimate && String(shouldAnimate) !== String(previousShouldAnimateRef.current));
    
    if (!shouldAnimate) {
      // Если анимация отключена, показываем текст сразу
      const letters = text.split('');
      const immediateStates = {};
      letters.forEach((_, index) => {
        immediateStates[index] = {
          opacity: 1,
          brightness: 1,
          transform: 'translateY(0) scale(1)',
          hasGlow: false
        };
      });
      setLetterStates(immediateStates);
      isFirstMountRef.current = false;
      previousShouldAnimateRef.current = shouldAnimate;
      return;
    }

    if (shouldReset) {
      // Сбрасываем состояния (буквы будут невидимыми до начала анимации)
      setLetterStates({});
      isFirstMountRef.current = false;
      previousShouldAnimateRef.current = shouldAnimate;
      
      // Запускаем анимации для каждой буквы
      const letters = text.split('');
      const flickerCount = longFlicker ? 5 : 3;
      const timers = [];
      const intervals = [];
      
      letters.forEach((_, index) => {
        const startTime = delay * 1000 + (index * letterDelay * 1000);
        let flickerIndex = 0;
        
        const timer = setTimeout(() => {
          const flickerInterval = setInterval(() => {
            if (flickerIndex < flickerCount) {
              setLetterStates(prev => ({
                ...prev,
                [index]: {
                  opacity: flickerIndex % 2 === 0 ? 0.3 : 1,
                  brightness: flickerIndex % 2 === 0 ? 2 : 1,
                  transform: 'translateY(10px) scale(0.8)',
                  hasGlow: false
                }
              }));
              flickerIndex++;
            } else {
              clearInterval(flickerInterval);
              setLetterStates(prev => ({
                ...prev,
                [index]: {
                  opacity: 1,
                  brightness: 1,
                  transform: 'translateY(0) scale(1)',
                  hasGlow: hasGlow
                }
              }));
            }
          }, 100);
          
          intervals.push(flickerInterval);
          
          // Очищаем интервал через максимальное время
          const cleanupTimer = setTimeout(() => {
            clearInterval(flickerInterval);
          }, flickerCount * 100 + 300);
          timers.push(cleanupTimer);
        }, startTime);
        
        timers.push(timer);
      });
      
      // Очистка всех таймеров и интервалов
      return () => {
        timers.forEach(timer => clearTimeout(timer));
        intervals.forEach(interval => clearInterval(interval));
      };
    }
  }, [shouldAnimate, delay, text, letterDelay, longFlicker, hasGlow]);

  // Если анимация отключена, просто показываем текст
  if (!shouldAnimate) {
    return <span className={className}>{text}</span>;
  }

  const letters = text.split('');

  return (
    <span className={className}>
      {letters.map((letter, index) => {
        const state = letterStates[index];
        
        // Если состояние еще не установлено, показываем букву с начальной анимацией
        // Это гарантирует, что буквы видны, даже если анимация еще не запустилась
        const defaultState = {
          opacity: 0.3, // Начальная видимость для мерцания
          brightness: 2,
          transform: 'translateY(10px) scale(0.8)',
          hasGlow: false
        };
        
        const finalState = state || defaultState;

        // Определяем эффект свечения
        const glowStyle = finalState.hasGlow 
          ? {
              textShadow: '0 0 5px currentColor, 0 0 10px currentColor',
              animation: 'glow 2s ease-in-out infinite'
            }
          : {};

        return (
          <span
            key={index}
            style={{
              display: 'inline-block',
              opacity: finalState.opacity,
              filter: `brightness(${finalState.brightness})`,
              transform: finalState.transform,
              transition: 'all 0.1s ease-in-out',
              ...glowStyle
            }}
          >
            {letter === ' ' ? '\u00A0' : letter}
          </span>
        );
      })}
    </span>
  );
}

