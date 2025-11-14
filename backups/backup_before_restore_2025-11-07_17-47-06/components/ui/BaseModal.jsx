import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

/**
 * 🎨 Базовый компонент модального окна с правильными анимациями
 * 
 * ✅ ИСПРАВЛЕНО: Используем встроенные transitions от HeadlessUI
 * - Анимации открытия и закрытия работают корректно
 * - Dialog правильно управляет жизненным циклом
 * - Окно остается видимым после анимации открытия
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
  titleIcon: TitleIcon,
  subtitle,
  children,
  size = 'medium',
  showCloseButton = true,
  closeOnOverlayClick = true,
  className = '',
  footer,
}) {
  // Состояния для анимации resize
  const [isResizing, setIsResizing] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 'auto', height: 'auto' });
  
  const panelRef = useRef(null);
  const resizeTimeoutRef = useRef(null);
  const dimensionsRef = useRef({ width: 0, height: 0 });

  // ResizeObserver для отслеживания изменений размера при window resize
  useEffect(() => {
    if (!isOpen || !panelRef.current) return;

    const panel = panelRef.current;
    
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
        
        if (
          Math.abs(width - dimensionsRef.current.width) > 1 ||
          Math.abs(height - dimensionsRef.current.height) > 1
        ) {
          setDimensions({
            width: `${dimensionsRef.current.width}px`,
            height: `${dimensionsRef.current.height}px`
          });
          setIsResizing(true);

          if (resizeTimeoutRef.current) {
            clearTimeout(resizeTimeoutRef.current);
          }

          requestAnimationFrame(() => {
            setDimensions({
              width: `${width}px`,
              height: `${height}px`
            });

            resizeTimeoutRef.current = setTimeout(() => {
              setDimensions({ width: 'auto', height: 'auto' });
              setIsResizing(false);
              dimensionsRef.current = { width, height };
            }, 300);
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

  // Закрытие по Escape (Dialog делает это автоматически, но оставим для совместимости)
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

  return (
    <Dialog 
      open={isOpen} 
      onClose={closeOnOverlayClick ? onClose : () => {}}
      className="relative z-[999999]"
    >
      {/* ✨ ИСПРАВЛЕНИЕ: Используем DialogBackdrop с transition */}
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-all duration-[500ms] ease-out opacity-0 data-[enter]:opacity-100 data-[closed]:opacity-0"
        onClick={closeOnOverlayClick ? onClose : undefined}
        style={{ pointerEvents: closeOnOverlayClick ? 'auto' : 'none' }}
      />

      {/* Центрирование */}
      <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto pointer-events-none">
        {/* ✨ ИСПРАВЛЕНИЕ: Используем DialogPanel с transition */}
        <DialogPanel
          ref={panelRef}
          transition
          className={`
            glass-effect rounded-xl p-6 w-full shadow-2xl 
            max-h-[90vh] pointer-events-auto
            transition-all duration-[500ms] ease-out
            opacity-0 scale-[0.95] translate-y-4
            data-[enter]:opacity-100 data-[enter]:scale-100 data-[enter]:translate-y-0
            data-[closed]:opacity-0 data-[closed]:scale-[0.95] data-[closed]:translate-y-8
            ${sizeClasses[size]}
            ${className}
          `}
          style={{
            '--panel-width': dimensions.width,
            '--panel-height': dimensions.height,
            width: isResizing ? 'var(--panel-width)' : undefined,
            height: isResizing ? 'var(--panel-height)' : undefined,
            // ✨ ИСПРАВЛЕНИЕ: Используем transitionProperty для разделения transitions
            // При resize анимируем только width и height, не трогая opacity и transform
            transitionProperty: isResizing ? 'width, height' : undefined,
            transitionDuration: isResizing ? '300ms' : undefined,
            transitionTimingFunction: isResizing ? 'cubic-bezier(0.4, 0, 0.2, 1)' : undefined,
            willChange: isResizing ? 'width, height' : undefined,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Заголовок */}
          {(title || showCloseButton) && (
            <div className={`flex items-start justify-between ${subtitle ? 'mb-2' : 'mb-6'}`}>
              {title && (
                <div className="flex-1 pr-4">
                  <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    {TitleIcon && (
                      <TitleIcon className="w-6 h-6 text-blue-500 dark:text-blue-400 flex-shrink-0" />
                    )}
                    {title}
                  </DialogTitle>
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

          {/* Футер */}
          {footer && (
            <div className="mt-0 pt-4 border-t border-gray-200 dark:border-gray-700">
              {footer}
            </div>
          )}
        </DialogPanel>
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

