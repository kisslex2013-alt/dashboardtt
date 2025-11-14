import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Wand2, RotateCcw, Check } from 'lucide-react';
import { useIconEditor } from '../../hooks/useIconEditor';
import { IconSelect } from '../ui/IconSelect';
import { getIcon } from '../../utils/iconHelper';

/**
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 * 
 * Компонент для режима редактирования иконок.
 * Показывает overlay со списком всех кнопок с иконками на странице.
 * Позволяет быстро менять иконки во время разработки.
 * 
 * Работает только в dev режиме (import.meta.env.DEV).
 */

export function IconEditorOverlay() {
  const { isEditMode, setEditMode, replaceIcon, getIconReplacement, resetAllReplacements } = useIconEditor();
  const [buttons, setButtons] = useState([]);
  const [selectedButtonId, setSelectedButtonId] = useState(null);
  const [isSelectingIcon, setIsSelectingIcon] = useState(false);
  const overlayRef = useRef(null);
  
  // Только в dev режиме
  if (!import.meta.env.DEV) {
    return null;
  }
  
  /**
   * Находит все кнопки с иконками на странице
   */
  const findButtonsWithIcons = useCallback(() => {
    const buttonsList = [];
    
    // Находим все кнопки с data-icon-id атрибутом
    const buttonsWithId = document.querySelectorAll('[data-icon-id]');
    buttonsWithId.forEach((button) => {
      const iconId = button.getAttribute('data-icon-id');
      const text = button.textContent?.trim() || button.getAttribute('aria-label') || 'Без текста';
      const iconElement = button.querySelector('svg, [class*="Icon"]');
      
      buttonsList.push({
        id: iconId,
        element: button,
        text: text,
        hasIcon: !!iconElement,
      });
    });
    
    setButtons(buttonsList);
  }, []);
  
  /**
   * Обновляет список кнопок
   */
  useEffect(() => {
    if (isEditMode) {
      // Небольшая задержка чтобы DOM обновился
      setTimeout(() => {
        findButtonsWithIcons();
      }, 100);
      
      // Обновляем при скролле/изменениях
      const observer = new MutationObserver(() => {
        findButtonsWithIcons();
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
      });
      
      return () => observer.disconnect();
    }
  }, [isEditMode, findButtonsWithIcons]);
  
  /**
   * Обработчик клика на кнопку из списка
   */
  const handleButtonClick = useCallback((buttonId) => {
    setSelectedButtonId(buttonId);
    setIsSelectingIcon(true);
  }, []);
  
  /**
   * Обработчик выбора иконки
   */
  const handleIconSelect = useCallback((iconName) => {
    if (selectedButtonId && iconName) {
      replaceIcon(selectedButtonId, iconName);
      setIsSelectingIcon(false);
      setSelectedButtonId(null);
    }
  }, [selectedButtonId, replaceIcon]);
  
  /**
   * Закрытие селектора
   */
  const handleCloseSelector = useCallback(() => {
    setIsSelectingIcon(false);
    setSelectedButtonId(null);
  }, []);
  
  /**
   * Подсветка кнопки на странице
   */
  const highlightButton = useCallback((buttonId) => {
    const button = document.querySelector(`[data-icon-id="${buttonId}"]`);
    if (button) {
      button.style.outline = '3px solid #3B82F6';
      button.style.outlineOffset = '2px';
      button.style.transition = 'outline 0.2s';
    }
  }, []);
  
  /**
   * Убрать подсветку
   */
  const removeHighlight = useCallback((buttonId) => {
    const button = document.querySelector(`[data-icon-id="${buttonId}"]`);
    if (button) {
      button.style.outline = '';
      button.style.outlineOffset = '';
    }
  }, []);
  
  if (!isEditMode) {
    return null;
  }
  
  return (
    <>
      {/* Overlay фон */}
      <div
        className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-[99998]"
        onClick={() => setEditMode(false)}
      />
      
      {/* Панель со списком кнопок */}
      <div
        ref={overlayRef}
        className="fixed right-4 top-20 bottom-20 w-96 glass-effect rounded-xl shadow-2xl z-[99999] flex flex-col animate-slide-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Заголовок */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-bold">Редактор иконок</h3>
          </div>
          <button
            onClick={() => setEditMode(false)}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Закрыть редактор"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Инструкция */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Кликните на кнопку в списке ниже, чтобы изменить её иконку.
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Хоткей: <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 rounded text-xs font-mono">Ctrl+Shift+]</kbd>
          </p>
        </div>
        
        {/* Кнопка сброса */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => {
              if (confirm('Сбросить все замены иконок?')) {
                resetAllReplacements();
              }
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Сбросить все замены
          </button>
        </div>
        
        {/* Список кнопок */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {buttons.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p className="mb-2">Кнопки с иконками не найдены</p>
              <p className="text-xs">Добавьте атрибут data-icon-id к кнопкам</p>
            </div>
          ) : (
            buttons.map((button) => {
              const replacement = getIconReplacement(button.id);
              const ReplacementIcon = replacement ? getIcon(replacement) : null;
              
              return (
                <div
                  key={button.id}
                  className="group relative"
                  onMouseEnter={() => highlightButton(button.id)}
                  onMouseLeave={() => removeHighlight(button.id)}
                >
                  <button
                    onClick={() => handleButtonClick(button.id)}
                    className="w-full flex items-center justify-between gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Иконка */}
                      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded">
                        {ReplacementIcon ? (
                          <ReplacementIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        ) : (
                          <Wand2 className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                      
                      {/* Текст */}
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                          {button.text}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          ID: {button.id}
                        </p>
                        {replacement && (
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            Иконка: {replacement}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {replacement && (
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
      
      {/* Модальное окно выбора иконки */}
      {isSelectingIcon && selectedButtonId && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div
            className="glass-effect rounded-xl p-6 shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Выберите иконку</h3>
              <button
                onClick={handleCloseSelector}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Закрыть"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-hidden">
              <IconSelect
                value={getIconReplacement(selectedButtonId) || ''}
                onChange={(iconName) => {
                  handleIconSelect(iconName);
                  handleCloseSelector();
                }}
                color="#3B82F6"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

