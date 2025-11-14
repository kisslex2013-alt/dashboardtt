import { useState, useEffect } from 'react';

/**
 * 🎨 Хук для задержки размонтирования компонента после закрытия
 * 
 * Используется для модальных окон с lazy loading, чтобы анимация исчезновения
 * успела проиграться до размонтирования компонента.
 * 
 * @param {boolean} isOpen - Открыт ли компонент
 * @param {number} delay - Задержка в миллисекундах (по умолчанию 350ms - длительность анимации + запас)
 * @returns {boolean} shouldRender - Нужно ли рендерить компонент
 * 
 * @example
 * const shouldRender = useDelayedUnmount(isOpen, 350);
 * return shouldRender && <Modal isOpen={isOpen} />;
 */
export function useDelayedUnmount(isOpen, delay = 350) {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Когда открывается - сразу показываем
      setShouldRender(true);
    } else {
      // Когда закрывается - ждем задержку перед размонтированием
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [isOpen, delay]);

  return shouldRender;
}

