import { useState, useEffect, useRef } from 'react';
import { X, Smartphone } from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore';

/**
 * 🎨 Модальное окно настроек плавающей панели таймера
 * 
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 * 
 * Это модальное окно позволяет настраивать:
 * - Включение/выключение плавающей панели
 * - Размер панели (компактный/расширенный)
 * - Тему оформления (стеклянная/твердая/минимальная)
 * - Сброс позиции панели на экране
 * 
 * Все настройки сохраняются автоматически в localStorage.
 */
export function FloatingPanelSettingsModal({ isOpen, onClose }) {
  const { floatingPanel, updateSettings } = useSettingsStore();
  
  // Три состояния для контроля анимаций (Three-State Animation Control)
  const [shouldMount, setShouldMount] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const panelRef = useRef(null);
  const overlayRef = useRef(null);
  
  // Используем значения по умолчанию если floatingPanel не инициализирован
  const panelSettings = floatingPanel || {
    enabled: false, // ИЗМЕНЕНО: По умолчанию выключена
    size: 'compact',
    theme: 'glass',
    position: { x: 20, y: 20 }
  };

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
      // ИСПРАВЛЕНО: Сначала устанавливаем isExiting для запуска анимации исчезновения
      setIsExiting(true);
      // Важно: НЕ убираем isAnimating сразу, чтобы анимация исчезновения успела запуститься
      // isAnimating будет сброшен после завершения анимации в handleAnimationEnd
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

  // Отключение скролла фона при открытом модальном окне
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Закрытие по Escape
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleClose = () => {
    onClose();
  };

  if (!shouldMount) return null;

  const handleTogglePanel = () => {
    updateSettings({
      floatingPanel: {
        ...panelSettings,
        enabled: !panelSettings.enabled
      }
    });
  };

  const handleSizeChange = (size) => {
    updateSettings({
      floatingPanel: {
        ...panelSettings,
        size
      }
    });
  };

  const handleThemeChange = (theme) => {
    updateSettings({
      floatingPanel: {
        ...panelSettings,
        theme
      }
    });
  };

  const handleResetPosition = () => {
    updateSettings({
      floatingPanel: {
        ...panelSettings,
        position: { x: 20, y: 20 }
      }
    });
  };

  return (
    <div
      ref={overlayRef}
      className={`
        fixed inset-0 z-50 p-4
        ${!isAnimating && !isExiting ? 'opacity-0' : ''}
        ${isAnimating ? 'animate-fade-in' : ''}
        ${isExiting ? 'animate-fade-out' : ''}
      `}
      style={{
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={handleClose}
      aria-hidden="true"
    >
      {/* Центрирование */}
      <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto pointer-events-none">
        <div
          ref={panelRef}
          className={`
            glass-effect rounded-xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700
            pointer-events-auto
            ${!isAnimating && !isExiting ? 'opacity-0 scale-95 translate-y-4' : ''}
            ${isAnimating && !isExiting ? 'animate-slide-up' : ''}
            ${isExiting ? 'animate-slide-out' : ''}
          `}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            {/* Заголовок */}
            <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-white" />
              </div>
              Настройки плавающей панели
              </h2>
              <button
                onClick={handleClose}
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                aria-label="Закрыть"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Основные настройки */}
            <div className="space-y-6">
              {/* Включение/выключение */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Включить панель
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Показывать плавающую панель на экране
                  </p>
                </div>
                <button
                  onClick={handleTogglePanel}
                  className={`
                    relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                    ${panelSettings.enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}
                  `}
                  aria-label={panelSettings.enabled ? 'Выключить панель' : 'Включить панель'}
                >
                  <span
                    className={`
                      inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                      ${panelSettings.enabled ? 'translate-x-6' : 'translate-x-1'}
                    `}
                  />
                </button>
              </div>

              {/* Размер панели */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Размер панели
                </h3>
                <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleSizeChange('compact')}
                  className={`
                    p-3 rounded-lg border transition-colors
                    ${panelSettings.size === 'compact'
                      ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-300'
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                    }
                  `}
                >
                  <div className="text-center">
                    <div className="text-sm font-medium">Компактный</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      200×100px
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => handleSizeChange('expanded')}
                  className={`
                    p-3 rounded-lg border transition-colors
                    ${panelSettings.size === 'expanded'
                      ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-300'
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                    }
                  `}
                >
                  <div className="text-center">
                    <div className="text-sm font-medium">Расширенный</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      320×180px
                    </div>
                  </div>
                </button>
                </div>
              </div>
            </div>

            {/* Тема панели */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Тема панели
              </h3>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleThemeChange('glass')}
                  className={`
                    p-3 rounded-lg border transition-colors
                    ${panelSettings.theme === 'glass'
                      ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500'
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                    }
                  `}
                >
                  <div className="text-center">
                    <div className="text-sm font-medium">Стеклянная</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Размытие
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => handleThemeChange('solid')}
                  className={`
                    p-3 rounded-lg border transition-colors
                    ${panelSettings.theme === 'solid'
                      ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500'
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                    }
                  `}
                >
                  <div className="text-center">
                    <div className="text-sm font-medium">Твердая</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Непрозрачная
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => handleThemeChange('minimal')}
                  className={`
                    p-3 rounded-lg border transition-colors
                    ${panelSettings.theme === 'minimal'
                      ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500'
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                    }
                  `}
                >
                  <div className="text-center">
                    <div className="text-sm font-medium">Минимальная</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Простая
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Дополнительные действия */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleResetPosition}
                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
              >
                Сбросить позицию
              </button>
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Готово
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

