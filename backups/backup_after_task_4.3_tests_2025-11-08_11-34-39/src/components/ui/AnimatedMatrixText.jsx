import { motion } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';

/**
 * 🎬 Компонент для анимации текста в стиле матрицы
 * 
 * Каждая буква появляется постепенно с небольшой задержкой
 * 
 * @param {string} text - Текст для анимации
 * @param {string} className - CSS классы
 * @param {boolean} shouldAnimate - Запускать ли анимацию
 * @param {number} delay - Задержка анимации в секундах
 * @param {number} letterDelay - Задержка между буквами в секундах
 */
export function AnimatedMatrixText({ 
  text, 
  className = '', 
  shouldAnimate = true,
  delay = 0,
  letterDelay = 0.05
}) {
  const isFirstMountRef = useRef(true);
  const previousShouldAnimateRef = useRef(shouldAnimate);
  const [shouldStartAnimation, setShouldStartAnimation] = useState(false);

  useEffect(() => {
    const shouldReset = isFirstMountRef.current || 
      (shouldAnimate && String(shouldAnimate) !== String(previousShouldAnimateRef.current));
    
    if (shouldReset && shouldAnimate) {
      // Сбрасываем анимацию
      setShouldStartAnimation(false);
      // Запускаем анимацию после задержки
      const timer = setTimeout(() => {
        setShouldStartAnimation(true);
        isFirstMountRef.current = false;
        previousShouldAnimateRef.current = shouldAnimate;
      }, delay * 1000 + 50); // Небольшая дополнительная задержка для надежности
      return () => clearTimeout(timer);
    } else if (!shouldAnimate) {
      // Если анимация отключена, сразу показываем текст
      setShouldStartAnimation(false);
      isFirstMountRef.current = false;
      previousShouldAnimateRef.current = shouldAnimate;
    } else {
      // Если shouldAnimate уже true, но не первый рендер, просто запускаем анимацию
      if (!isFirstMountRef.current && shouldAnimate) {
        setShouldStartAnimation(true);
      }
    }
  }, [shouldAnimate, delay]);

  // Если анимация отключена, просто показываем текст
  if (!shouldAnimate) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={className}>
      {text.split('').map((letter, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={shouldStartAnimation ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{
            duration: 0.3,
            delay: shouldStartAnimation ? index * letterDelay : 0,
            ease: 'easeOut'
          }}
          style={{ display: 'inline-block' }}
        >
          {letter === ' ' ? '\u00A0' : letter}
        </motion.span>
      ))}
    </span>
  );
}

