import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import { getIcon } from '../../utils/iconHelper';
import PropTypes from 'prop-types';

/**
 * 🎯 Кастомный select для категорий с иконками
 * - Показывает иконки во всем dropdown списке
 * - Поддерживает поиск (опционально)
 * - Стилизован в стиле проекта
 */
export function CategorySelect({
  value,
  onChange,
  options,
  onAddNew,
  placeholder = "Выберите категорию",
  error
}) {
  const [isOpen, setIsOpen] = useState(false);
  // Три состояния для контроля анимаций (Three-State Animation Control)
  const [shouldMount, setShouldMount] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const selectRef = useRef(null);
  const dropdownRef = useRef(null);
  
  const selectedCategory = options.find(c => c.name === value);

  // Логика открытия
  useEffect(() => {
    if (isOpen) {
      setShouldMount(true);
      setIsExiting(false);
      // Для portal элементов используем один RAF - двойной вызывает задваивание
      const rafId = requestAnimationFrame(() => {
        setIsAnimating(true);
      });
      return () => cancelAnimationFrame(rafId);
    }
  }, [isOpen]);

  // Логика закрытия
  useEffect(() => {
    if (!isOpen && shouldMount && !isExiting) {
      setIsAnimating(false);
      // RAF для синхронизации перед началом exit анимации
      const rafId = requestAnimationFrame(() => {
        setIsExiting(true);
      });
      return () => cancelAnimationFrame(rafId);
    }
  }, [isOpen, shouldMount, isExiting]);

  // Слушатель окончания анимации исчезновения
  useEffect(() => {
    if (isExiting && dropdownRef.current) {
      const handleAnimationEnd = (e) => {
        // Проверяем, что это именно наша exit анимация
        if (
          e.animationName === 'slideDownOut' ||
          e.animationName === 'slideUpOut' ||
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

      dropdownRef.current.addEventListener('animationend', handleAnimationEnd);

      return () => {
        clearTimeout(fallbackTimer);
        dropdownRef.current?.removeEventListener('animationend', handleAnimationEnd);
      };
    }
  }, [isExiting]);
  
  // Вычисление позиции dropdown
  useEffect(() => {
    if (shouldMount && selectRef.current) {
      const updatePosition = () => {
        const rect = selectRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        const dropdownMaxHeight = 256; // max-h-64 = 256px
        const offset = 8;
        
        // Используем getBoundingClientRect напрямую без scrollY для правильного позиционирования в порталах
        let top = rect.bottom + offset;
        let left = rect.left;
        
        // Проверяем, помещается ли dropdown снизу
        const spaceBelow = viewportHeight - rect.bottom;
        const spaceAbove = rect.top;
        
        // Если снизу не хватает места и сверху есть больше места, открываем вверх
        if (spaceBelow < dropdownMaxHeight + offset && spaceAbove > dropdownMaxHeight + offset) {
          top = rect.top - dropdownMaxHeight - offset;
        }
        
        // Корректируем позицию по вертикали (если dropdown выходит за экран)
        if (top + dropdownMaxHeight > viewportHeight) {
          top = Math.max(offset, viewportHeight - dropdownMaxHeight - offset);
        }
        if (top < 0) {
          top = offset;
        }
        
        // Корректируем по горизонтали
        if (left + rect.width > viewportWidth) {
          left = Math.max(offset, viewportWidth - rect.width - offset);
        }
        if (left < 0) {
          left = offset;
        }
        
        // Для порталов используем фиксированное позиционирование без scrollY/scrollX
        setPosition({
          top: top,
          left: left,
          width: rect.width
        });
      };
      
      updatePosition();
      // Используем requestAnimationFrame для более точного позиционирования
      const rafId = requestAnimationFrame(updatePosition);
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      
      return () => {
        cancelAnimationFrame(rafId);
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [shouldMount]);
  
  // Закрытие при клике вне
  useEffect(() => {
    if (!shouldMount) return;
    
    const handleClickOutside = (event) => {
      if (
        selectRef.current && 
        !selectRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);
  
  const handleSelect = (categoryName) => {
    if (categoryName === '__add_new__') {
      setIsOpen(false);
      onAddNew && onAddNew();
    } else {
      onChange(categoryName);
      setIsOpen(false);
    }
  };
  
  return (
    <>
      <div 
        ref={selectRef}
        className="relative"
      >
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`
            w-full px-4 py-2 pl-10 glass-effect rounded-lg border-2 
            ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
            focus:outline-none focus:ring-2 focus:ring-blue-500 
            bg-white/80 dark:bg-gray-800/80 appearance-none cursor-pointer
            flex items-center justify-between
            transition-colors
          `}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {/* Иконка выбранной категории */}
            {selectedCategory && selectedCategory.icon && (() => {
              const CategoryIcon = getIcon(selectedCategory.icon);
              if (CategoryIcon) {
                return (
                  <CategoryIcon 
                    className="w-4 h-4 flex-shrink-0" 
                    style={{ color: selectedCategory.color }}
                  />
                );
              }
              return null;
            })()}
            <span className="truncate">
              {selectedCategory ? selectedCategory.name : placeholder}
            </span>
          </div>
          <ChevronDown 
            className={`w-4 h-4 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
      </div>
      
      {/* Dropdown список с анимациями появления/исчезновения */}
      {shouldMount && createPortal(
        <div
          ref={dropdownRef}
          className={`fixed z-[999999] glass-effect rounded-lg border-2 border-gray-300 dark:border-gray-600 shadow-2xl max-h-64 overflow-y-auto bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg ${
            !isAnimating && !isExiting ? 'opacity-0 translate-y-4' : ''
          } ${
            isAnimating ? 'animate-slide-up' : ''
          } ${
            isExiting ? 'animate-slide-out' : ''
          }`}
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            width: `${position.width}px`,
            minWidth: '200px'
          }}
        >
          {options.map((category) => {
            const CategoryIcon = category.icon ? getIcon(category.icon) : null;
            const isSelected = category.name === value;
            
            return (
              <button
                key={category.id || category.name}
                type="button"
                onClick={() => handleSelect(category.name)}
                className={`
                  w-full px-4 py-2 flex items-center gap-2 text-left
                  transition-colors
                  ${isSelected 
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100'
                  }
                  ${category.name !== options[options.length - 1]?.name ? 'border-b border-gray-200 dark:border-gray-700' : ''}
                `}
              >
                {CategoryIcon && (
                  <CategoryIcon 
                    className="w-4 h-4 flex-shrink-0" 
                    style={{ color: category.color }}
                  />
                )}
                <span className="flex-1">{category.name}</span>
                {isSelected && (
                  <span className="text-blue-600 dark:text-blue-400">✓</span>
                )}
              </button>
            );
          })}
          
          {/* Кнопка добавления новой категории */}
          {onAddNew && (
            <>
              <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
              <button
                type="button"
                onClick={() => handleSelect('__add_new__')}
                className="w-full px-4 py-2 flex items-center gap-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-600 dark:text-blue-400 transition-colors"
              >
                <span className="text-lg">+</span>
                <span>Добавить новую категорию</span>
              </button>
            </>
          )}
        </div>,
        document.body
      )}
    </>
  );
}

CategorySelect.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string.isRequired,
    icon: PropTypes.string,
    color: PropTypes.string
  })).isRequired,
  onAddNew: PropTypes.func,
  placeholder: PropTypes.string,
  error: PropTypes.string
};

