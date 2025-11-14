import { motion } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';

/**
 * 💫 Компонент для анимации текста в стиле каскадного падения
 * 
 * Буквы падают сверху с эффектом гравитации, отскока и случайными задержками
 * Основан на варианте 5 из primer/matrix-text-animations
 * 
 * @param {string} text - Текст для анимации
 * @param {string} className - CSS классы
 * @param {boolean} shouldAnimate - Запускать ли анимацию
 * @param {number} delay - Задержка анимации в секундах
 * @param {number} letterDelay - Задержка между буквами в секундах
 * @param {boolean} cascade - Использовать каскадный эффект (случайные задержки и повороты)
 */
export function AnimatedCascadeDrop({ 
  text, 
  className = '', 
  shouldAnimate = true,
  delay = 0,
  letterDelay = 0.05,
  cascade = true
}) {
  const isFirstMountRef = useRef(true);
  const previousShouldAnimateRef = useRef(shouldAnimate);
  const [shouldStartAnimation, setShouldStartAnimation] = useState(false);
  const [letterData, setLetterData] = useState([]);

  // Генерируем случайные данные для каждой буквы (каскадный эффект)
  useEffect(() => {
    if (text && shouldAnimate) {
      const letters = text.split('');
      const data = letters.map((_, index) => ({
        index,
        dropHeight: cascade ? Math.random() * 100 + 50 : 80,
        bounceDelay: cascade ? Math.random() * 0.3 : 0,
        rotation: cascade ? Math.random() * 20 - 10 : 0
      }));
      setLetterData(data);
    }
  }, [text, cascade, shouldAnimate]);

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
      }, delay * 1000 + 50);
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

  const letters = text.split('');

  return (
    <span className={className}>
      {letters.map((letter, index) => {
        const data = letterData[index] || { dropHeight: 80, bounceDelay: 0, rotation: 0 };
        const animationDelay = shouldStartAnimation ? (index * letterDelay) + data.bounceDelay : 0;
        
        return (
          <motion.span
            key={index}
            initial={{
              opacity: 0,
              y: -data.dropHeight,
              rotate: data.rotation,
              scale: 0.5
            }}
            animate={shouldStartAnimation ? {
              opacity: 1,
              y: 0,
              rotate: 0,
              scale: 1
            } : {
              opacity: 0,
              y: -data.dropHeight,
              rotate: data.rotation,
              scale: 0.5
            }}
            transition={{
              duration: 0.6,
              delay: animationDelay,
              ease: [0.68, -0.55, 0.265, 1.55], // cubic-bezier для эффекта отскока
              opacity: {
                duration: 0.3,
                delay: animationDelay,
                ease: 'easeOut'
              },
              y: {
                duration: 0.6,
                delay: animationDelay,
                ease: [0.68, -0.55, 0.265, 1.55]
              },
              rotate: {
                duration: 0.6,
                delay: animationDelay,
                ease: [0.68, -0.55, 0.265, 1.55]
              },
              scale: {
                duration: 0.6,
                delay: animationDelay,
                ease: [0.68, -0.55, 0.265, 1.55]
              }
            }}
            style={{ display: 'inline-block' }}
          >
            <motion.span
              initial={{ y: 0, scale: 1 }}
              animate={shouldStartAnimation ? {
                y: [0, -3, 0],
                scale: [1, 1.05, 1]
              } : { y: 0, scale: 1 }}
              transition={{
                duration: 0.4,
                delay: animationDelay + 0.6,
                times: [0, 0.5, 1],
                ease: 'easeOut'
              }}
            >
              {letter === ' ' ? '\u00A0' : letter}
            </motion.span>
          </motion.span>
        );
      })}
    </span>
  );
}

