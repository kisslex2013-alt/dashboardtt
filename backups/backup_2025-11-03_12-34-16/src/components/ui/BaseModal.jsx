// import PropTypes from 'prop-types'; // Временно отключено для отладки lazy loading
import { Dialog } from '@headlessui/react';
import { X } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';

/**
 * 🎨 Базовый компонент модального окна
 * 
 * Устраняет дублирование кода во всех модальных окнах.
 * Предоставляет единообразную структуру и поведение.
 * 
 * @param {boolean} isOpen - Открыто ли модальное окно
 * @param {function} onClose - Функция закрытия модального окна
 * @param {string} title - Заголовок модального окна
 * @param {string} subtitle - Подзаголовок (опционально)
 * @param {React.ReactNode} children - Контент модального окна
 * @param {string} size - Размер модального окна: 'small' | 'medium' | 'large' | 'full'
 * @param {boolean} showCloseButton - Показывать ли кнопку закрытия (по умолчанию true)
 * @param {boolean} closeOnOverlayClick - Закрывать ли при клике на overlay (по умолчанию true)
 * @param {string} className - Дополнительные классы для панели
 * @param {React.ReactNode} footer - Футер модального окна (опционально)
 */

const sizeClasses = {
  small: 'max-w-md',
  medium: 'max-w-lg',
  large: 'max-w-2xl',
  full: 'max-w-4xl',
};

export function BaseModal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  size = 'medium',
  showCloseButton = true,
  closeOnOverlayClick = true,
  className = '',
  footer,
}) {
  // Три состояния для контроля анимаций (Three-State Animation Control)
  const [shouldMount, setShouldMount] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const panelRef = useRef(null);
  const overlayRef = useRef(null);

  // Логика открытия
  useEffect(() => {
    if (isOpen) {
      setShouldMount(true);
      setIsExiting(false);
      // Для модальных окон используем одинарный RAF - двойной вызывает дергание
      const rafId = requestAnimationFrame(() => {
        setIsAnimating(true);
      });
      return () => cancelAnimationFrame(rafId);
    }
  }, [isOpen]);

  // Логика закрытия
  useEffect(() => {
    if (!isOpen && shouldMount && !isExiting) {
      // ИСПРАВЛЕНО: Сначала устанавливаем isExiting, затем убираем isAnimating для предотвращения мерцания
      // Это предотвращает промежуточное состояние без анимации
      setIsExiting(true);
      // Небольшая задержка перед отключением isAnimating для плавности
      const rafId = requestAnimationFrame(() => {
        setIsAnimating(false);
      });
      return () => cancelAnimationFrame(rafId);
    }
  }, [isOpen, shouldMount, isExiting]);

  // Слушатель окончания анимации исчезновения
  useEffect(() => {
    if (isExiting && panelRef.current) {
      const handleAnimationEnd = (e) => {
        // Проверяем, что это именно наша exit анимация
        if (
          e.animationName === 'slideDownOut' ||
          e.animationName.includes('slideOut')
        ) {
          setIsExiting(false);
          setShouldMount(false);
        }
      };

      // Fallback на случай, если событие не сработает
      const fallbackTimer = setTimeout(() => {
        setIsExiting(false);
        setShouldMount(false);
      }, 300); // Немного больше длительности анимации (200ms)

      panelRef.current.addEventListener('animationend', handleAnimationEnd);

      return () => {
        clearTimeout(fallbackTimer);
        panelRef.current?.removeEventListener('animationend', handleAnimationEnd);
      };
    }
  }, [isExiting]);

  // Закрытие по Escape (обрабатывается Dialog автоматически)
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEscape = (e) => {
      if (e.key === 'Escape' && closeOnOverlayClick) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, closeOnOverlayClick]);

  if (!shouldMount) return null;

  return (
    // ИСПРАВЛЕНО: Увеличен z-index для модальных окон, чтобы они были выше аккордеонов
    <Dialog 
      open={shouldMount} 
      onClose={closeOnOverlayClick ? onClose : () => {}}
      className="relative z-[999999]"
    >
      {/* Overlay с backdrop blur - унифицированная анимация появления/исчезновения */}
      <div 
        ref={overlayRef}
        className={`fixed inset-0 bg-black/30 backdrop-blur-sm ${
          !isAnimating && !isExiting ? 'opacity-0' : ''
        } ${
          isAnimating ? 'animate-fade-in' : ''
        } ${
          isExiting ? 'animate-fade-out' : ''
        }`}
        aria-hidden="true"
        onClick={closeOnOverlayClick ? onClose : undefined}
      />

      {/* Центрирование */}
      <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto pointer-events-none">
        <Dialog.Panel 
          ref={panelRef}
          className={`
            glass-effect rounded-xl p-6 w-full shadow-2xl 
            max-h-[90vh] overflow-y-auto pointer-events-auto
            ${!isAnimating && !isExiting ? 'opacity-0 scale-95 translate-y-4' : ''}
            ${isAnimating && !isExiting ? 'animate-slide-up' : ''}
            ${isExiting ? 'animate-slide-out' : ''}
            ${sizeClasses[size]}
            ${className}
          `}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Заголовок */}
          {(title || showCloseButton) && (
            <div className={`flex items-start justify-between ${subtitle ? 'mb-2' : 'mb-6'}`}>
              {title && (
                <div className="flex-1 pr-4">
                  <Dialog.Title className="text-2xl font-bold text-gray-900 dark:text-white">
                    {title}
                  </Dialog.Title>
                  {subtitle && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-0">
                      {subtitle}
                    </p>
                  )}
                </div>
              )}
              
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="glass-button p-1 rounded-lg flex-shrink-0 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors hover-lift-scale click-shrink"
                  aria-label="Закрыть модальное окно"
                  title="Закрыть (Escape)"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          )}

          {/* Контент */}
          <div className="modal-content">
            {children}
          </div>

          {/* Футер (опционально) */}
          {footer && (
            <div className="mt-0 pt-4 border-t border-gray-200 dark:border-gray-700">
              {footer}
            </div>
          )}
          </Dialog.Panel>
      </div>
    </Dialog>
  );
}

// Временно отключено для отладки lazy loading
// BaseModal.propTypes = {
//   isOpen: PropTypes.bool.isRequired,
//   onClose: PropTypes.func.isRequired,
//   title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
//   subtitle: PropTypes.string,
//   children: PropTypes.node.isRequired,
//   size: PropTypes.oneOf(['small', 'medium', 'large', 'full']),
//   showCloseButton: PropTypes.bool,
//   closeOnOverlayClick: PropTypes.bool,
//   className: PropTypes.string,
//   footer: PropTypes.node
// };

