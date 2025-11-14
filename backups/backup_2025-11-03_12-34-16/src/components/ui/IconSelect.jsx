import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import { Code, TrendingUp, Palette, Users, MessageCircle, BookOpen, MoreHorizontal, Grid, Activity, Calendar, Clock, DollarSign, Settings, Play, CheckCircle, Bell, Upload, Download, Database, Folder, FileText } from 'lucide-react';
import PropTypes from 'prop-types';

/**
 * 🎯 Выпадающий селект для выбора иконки
 */
export function IconSelect({ 
  value, 
  onChange, 
  color = '#3B82F6'
}) {
  const [isOpen, setIsOpen] = useState(false);
  // Три состояния для контроля анимаций (Three-State Animation Control)
  const [shouldMount, setShouldMount] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const selectRef = useRef(null);
  const dropdownRef = useRef(null);
  
  const iconOptions = [
    { name: 'Code', component: Code },
    { name: 'TrendingUp', component: TrendingUp },
    { name: 'Palette', component: Palette },
    { name: 'Users', component: Users },
    { name: 'MessageCircle', component: MessageCircle },
    { name: 'BookOpen', component: BookOpen },
    { name: 'MoreHorizontal', component: MoreHorizontal },
    { name: 'Grid', component: Grid },
    { name: 'Activity', component: Activity },
    { name: 'Calendar', component: Calendar },
    { name: 'Clock', component: Clock },
    { name: 'DollarSign', component: DollarSign },
    { name: 'Settings', component: Settings },
    { name: 'Play', component: Play },
    { name: 'CheckCircle', component: CheckCircle },
    { name: 'Bell', component: Bell },
    { name: 'Upload', component: Upload },
    { name: 'Download', component: Download },
    { name: 'Database', component: Database },
    { name: 'Folder', component: Folder },
    { name: 'FileText', component: FileText },
  ];
  
  const selectedIcon = iconOptions.find(opt => opt.name === value) || iconOptions.find(opt => opt.name === 'Folder');
  const SelectedIconComponent = selectedIcon?.component || Folder;

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
        const dropdownMaxHeight = 192; // max-h-48 = 192px
        const dropdownWidth = 280;
        const offset = 4;
        
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
          top = viewportHeight - dropdownMaxHeight - offset;
        }
        if (top < 0) {
          top = offset;
        }
        
        // Корректируем по горизонтали
        if (left + dropdownWidth > viewportWidth) {
          left = viewportWidth - dropdownWidth - offset;
        }
        if (left < 0) {
          left = offset;
        }
        
        // Для порталов используем фиксированное позиционирование без scrollY/scrollX
        setPosition({
          top: top,
          left: left,
          width: Math.max(rect.width, dropdownWidth)
        });
      };
      
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      
      return () => {
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
  
  const handleSelect = (iconName) => {
    onChange(iconName);
    setIsOpen(false);
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
          className="flex-1 px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 flex items-center gap-1.5 cursor-pointer hover:border-blue-500 transition-colors"
        >
          <SelectedIconComponent 
            className="w-3.5 h-3.5 flex-shrink-0" 
            style={{ color }}
          />
          <span className="text-xs text-gray-700 dark:text-gray-300 truncate flex-1 text-left">
            {selectedIcon?.name || 'Folder'}
          </span>
          <ChevronDown 
            className={`w-3 h-3 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
      </div>
      
      {/* Dropdown список с анимациями появления/исчезновения */}
      {shouldMount && createPortal(
        <div
          ref={dropdownRef}
          className={`fixed z-[999999] glass-effect rounded-lg border-2 border-gray-300 dark:border-gray-600 shadow-2xl max-h-48 overflow-y-auto bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg p-2 ${
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
            minWidth: '280px'
          }}
        >
          <div className="flex flex-wrap gap-1.5">
            {iconOptions.map((option) => {
              const IconComponent = option.component;
              const isSelected = option.name === value;
              return (
                <button
                  key={option.name}
                  type="button"
                  onClick={() => handleSelect(option.name)}
                  className={`
                    p-1.5 rounded transition-all
                    ${isSelected 
                      ? 'bg-blue-100 dark:bg-blue-900/30 ring-1 ring-blue-500' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }
                  `}
                  title={option.name}
                >
                  <IconComponent 
                    className="w-4 h-4" 
                    style={{ color: isSelected ? color : '#6B7280' }}
                  />
                </button>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

IconSelect.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  color: PropTypes.string
};

