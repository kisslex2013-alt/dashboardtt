import { useState, useEffect } from 'react'

/**
 * 🎨 Хук для задержки размонтирования компонента после закрытия
 *
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 *
 * Этот хук используется для модальных окон и других компонентов с анимацией закрытия.
 * Когда компонент закрывается, он не удаляется сразу из DOM, а остается на время анимации.
 * Это позволяет анимации исчезновения проиграться полностью.
 *
 * Используется для модальных окон с lazy loading, чтобы анимация исчезновения
 * успела проиграться до размонтирования компонента.
 *
 * @param isOpen - Открыт ли компонент (true = показывать, false = скрывать)
 * @param delay - Задержка в миллисекундах перед размонтированием (по умолчанию 350ms)
 * @returns shouldRender - Нужно ли рендерить компонент в DOM
 *
 * @example
 * function Modal({ isOpen, onClose }) {
 *   const shouldRender = useDelayedUnmount(isOpen, 350);
 *
 *   if (!shouldRender) return null;
 *
 *   return (
 *     <BaseModal isOpen={isOpen} onClose={onClose}>
 *       Содержимое модального окна
 *     </BaseModal>
 *   );
 * }
 */
export function useDelayedUnmount(isOpen: boolean, delay: number = 350): boolean {
  const [shouldRender, setShouldRender] = useState<boolean>(false)

  useEffect(() => {
    if (isOpen) {
      // Когда открывается - сразу показываем
      setShouldRender(true)
    } else {
      // Когда закрывается - ждем задержку перед размонтированием
      const timer = setTimeout(() => {
        setShouldRender(false)
      }, delay)

      return () => clearTimeout(timer)
    }
  }, [isOpen, delay])

  return shouldRender
}
