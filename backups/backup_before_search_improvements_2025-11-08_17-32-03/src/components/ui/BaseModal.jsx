// import PropTypes from 'prop-types'; // Временно отключено для отладки lazy loading
import { Dialog } from '@headlessui/react';
import { X } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';

/**
 * 🎨 Базовый компонент модального окна с анимацией resize
 * 
 * Устраняет дублирование кода во всех модальных окнах.
 * Предоставляет единообразную структуру и поведение.
 * 
 * НОВОЕ: Добавлена плавная анимация при изменении размера окна браузера
 * Использует CSS переменные + ResizeObserver для отслеживания изменений viewport
 * 
 * @param {boolean} isOpen - Открыто ли модальное окно
 * @param {function} onClose - Функция закрытия модального окна
 * @param {string} title - Заголовок модального окна (только строка, не JSX!)
 * @param {React.Component} titleIcon - Иконка для заголовка (опционально)
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
  titleIcon: TitleIcon, // Иконка для заголовка (опционально)
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
  
  // НОВОЕ: Состояния для анимации resize
  const [isResizing, setIsResizing] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 'auto', height: 'auto' });
  
  const panelRef = useRef(null);
  const overlayRef = useRef(null);
  const resizeTimeoutRef = useRef(null);
  const dimensionsRef = useRef({ width: 0, height: 0 });

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
      setIsExiting(true);
    }
  }, [isOpen, shouldMount, isExiting]);

  // Слушатель окончания анимации исчезновения
  useEffect(() => {
    if (isExiting && panelRef.current) {
      const handleAnimationEnd = (e) => {
        // Проверяем, что это именно наша exit анимация (slideDownOut или fadeOut)
        if (
          e.animationName === 'slideDownOut' ||
          e.animationName === 'fadeOut' ||
          e.animationName.includes('slideOut') ||
          e.animationName.includes('fadeOut')
        ) {
          // Сбрасываем все состояния после завершения анимации
          setIsAnimating(false);
          setIsExiting(false);
          setShouldMount(false);
        }
      };

      // Fallback на случай, если событие не сработает (например, при lazy loading)
      const fallbackTimer = setTimeout(() => {
        setIsAnimating(false);
        setIsExiting(false);
        setShouldMount(false);
      }, 350); // Немного больше длительности анимации (300ms + запас)

      const panel = panelRef.current;
      panel.addEventListener('animationend', handleAnimationEnd);

      return () => {
        clearTimeout(fallbackTimer);
        panel?.removeEventListener('animationend', handleAnimationEnd);
      };
    }
  }, [isExiting]);

  // НОВОЕ: ResizeObserver для отслеживания изменений размера при window resize
  useEffect(() => {
    if (!isOpen || !panelRef.current) return;

    const panel = panelRef.current;
    
    // Инициализация начальных размеров
    const initDimensions = () => {
      const rect = panel.getBoundingClientRect();
      dimensionsRef.current = { 
        width: rect.width, 
        height: rect.height 
      };
    };

    initDimensions();

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        
        // Проверяем, действительно ли размеры изменились
        if (
          Math.abs(width - dimensionsRef.current.width) > 1 ||
          Math.abs(height - dimensionsRef.current.height) > 1
        ) {
          // Фиксируем текущие размеры для начала анимации
          setDimensions({
            width: `${dimensionsRef.current.width}px`,
            height: `${dimensionsRef.current.height}px`
          });
          setIsResizing(true);

          // Очищаем предыдущий таймер
          if (resizeTimeoutRef.current) {
            clearTimeout(resizeTimeoutRef.current);
          }

          // Запускаем анимацию к новым размерам
          requestAnimationFrame(() => {
            setDimensions({
              width: `${width}px`,
              height: `${height}px`
            });

            // После завершения анимации возвращаем auto
            resizeTimeoutRef.current = setTimeout(() => {
              setDimensions({ width: 'auto', height: 'auto' });
              setIsResizing(false);
              dimensionsRef.current = { width, height };
            }, 300); // Длительность transition
          });
        }
      }
    });

    resizeObserver.observe(panel);

    return () => {
      resizeObserver.disconnect();
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, [isOpen]);

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
            max-h-[90vh] pointer-events-auto
            ${!isAnimating && !isExiting ? 'opacity-0 scale-95 translate-y-4' : ''}
            ${isAnimating && !isExiting ? 'animate-slide-up' : ''}
            ${isExiting ? 'animate-slide-out' : ''}
            ${sizeClasses[size]}
            ${className}
          `}
          style={{
            // НОВОЕ: CSS переменные для управления размерами
            '--panel-width': dimensions.width,
            '--panel-height': dimensions.height,
            width: isResizing ? 'var(--panel-width)' : undefined,
            height: isResizing ? 'var(--panel-height)' : undefined,
            transition: isResizing 
              ? 'width 300ms cubic-bezier(0.4, 0, 0.2, 1), height 300ms cubic-bezier(0.4, 0, 0.2, 1)' 
              : undefined,
            willChange: isResizing ? 'width, height' : undefined,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Заголовок */}
          {(title || showCloseButton) && (
            <div className={`flex items-start justify-between ${subtitle ? 'mb-2' : 'mb-6'}`}>
              {title && (
                <div className="flex-1 pr-4">
                  <Dialog.Title className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    {TitleIcon && (
                      <TitleIcon className="w-6 h-6 text-blue-500 dark:text-blue-400 flex-shrink-0" />
                    )}
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
                  data-icon-id="modal-close"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          )}

          {/* Контент */}
          <div className="modal-content overflow-y-auto max-h-[calc(90vh-180px)] custom-scrollbar">
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

