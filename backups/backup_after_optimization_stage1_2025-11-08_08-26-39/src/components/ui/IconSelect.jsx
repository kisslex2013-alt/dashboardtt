import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, Loader2 } from 'lucide-react';
import { Code, TrendingUp, Palette, Users, MessageCircle, BookOpen, MoreHorizontal, Grid, Activity, Calendar, Clock, DollarSign, Settings, Play, CheckCircle, Bell, Upload, Download, Database, Folder, FileText } from 'lucide-react';
import { Icon } from '@iconify/react';
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
  const searchInputRef = useRef(null);
  
  // Состояния для поиска по Iconify
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef(null);
  const abortControllerRef = useRef(null);
  
  // Базовая коллекция Lucide React иконок
  const lucideIcons = [
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
  
  // Популярные Iconify иконки (Material Design Icons, Carbon, Heroicons)
  const iconifyIcons = [
    { name: 'iconify:mdi:code-tags', label: 'Code Tags' },
    { name: 'iconify:mdi:trending-up', label: 'Trending Up' },
    { name: 'iconify:mdi:palette', label: 'Palette' },
    { name: 'iconify:mdi:account-group', label: 'Users' },
    { name: 'iconify:mdi:message-text', label: 'Message' },
    { name: 'iconify:mdi:book-open-variant', label: 'Book' },
    { name: 'iconify:mdi:view-grid', label: 'Grid' },
    { name: 'iconify:mdi:chart-line', label: 'Chart' },
    { name: 'iconify:mdi:calendar', label: 'Calendar' },
    { name: 'iconify:mdi:clock-outline', label: 'Clock' },
    { name: 'iconify:mdi:currency-usd', label: 'Dollar' },
    { name: 'iconify:mdi:cog', label: 'Settings' },
    { name: 'iconify:mdi:play', label: 'Play' },
    { name: 'iconify:mdi:check-circle', label: 'Check' },
    { name: 'iconify:mdi:bell', label: 'Bell' },
    { name: 'iconify:mdi:upload', label: 'Upload' },
    { name: 'iconify:mdi:download', label: 'Download' },
    { name: 'iconify:mdi:database', label: 'Database' },
    { name: 'iconify:mdi:folder', label: 'Folder' },
    { name: 'iconify:mdi:file-document', label: 'Document' },
    { name: 'iconify:mdi:rocket-launch', label: 'Rocket' },
    { name: 'iconify:mdi:heart', label: 'Heart' },
    { name: 'iconify:mdi:lightning-bolt', label: 'Lightning' },
    { name: 'iconify:mdi:fire', label: 'Fire' },
    { name: 'iconify:mdi:chart-bar', label: 'Bar Chart' },
    { name: 'iconify:mdi:pin', label: 'Pin' },
    { name: 'iconify:mdi:layers', label: 'Layers' },
    { name: 'iconify:mdi:archive', label: 'Archive' },
    { name: 'iconify:mdi:undo', label: 'Undo' },
    { name: 'iconify:mdi:redo', label: 'Redo' },
    { name: 'iconify:mdi:list', label: 'List' },
    { name: 'iconify:mdi:magnify', label: 'Search' },
    { name: 'iconify:carbon:analytics', label: 'Analytics' },
    { name: 'iconify:carbon:chart-line', label: 'Line Chart' },
    { name: 'iconify:carbon:user-multiple', label: 'Users' },
    { name: 'iconify:carbon:code', label: 'Code' },
    { name: 'iconify:heroicons:rocket-launch', label: 'Rocket' },
    { name: 'iconify:heroicons:chart-bar', label: 'Chart Bar' },
    { name: 'iconify:heroicons:heart', label: 'Heart' },
  ];
  
  // Объединяем все иконки
  const iconOptions = [
    ...lucideIcons.map(icon => ({ ...icon, type: 'lucide' })),
    ...iconifyIcons.map(icon => ({ ...icon, type: 'iconify' }))
  ];
  
  // Определяем выбранную иконку: сначала в iconOptions, потом в searchResults, потом дефолт
  const selectedIcon = iconOptions.find(opt => opt.name === value) 
    || searchResults.find(opt => opt.name === value)
    || iconOptions.find(opt => opt.name === 'Folder');
  
  // Если value это Iconify иконка, но её нет в списках, создаем объект для отображения
  const getSelectedIconDisplay = () => {
    if (!value) {
      return { name: 'Folder', component: Folder, type: 'lucide', label: 'Folder' };
    }
    
    // Проверяем, есть ли в iconOptions или searchResults
    const found = iconOptions.find(opt => opt.name === value) 
      || searchResults.find(opt => opt.name === value);
    
    if (found) {
      return found;
    }
    
    // Если value начинается с "iconify:", создаем объект для отображения
    if (value.startsWith('iconify:')) {
      const iconifyId = value.replace('iconify:', '');
      const parts = iconifyId.split(':');
      const name = parts[1] || iconifyId;
      const label = name.replace(/-/g, ' ').replace(/_/g, ' ');
      
      return {
        name: value,
        label: label.charAt(0).toUpperCase() + label.slice(1),
        type: 'iconify'
      };
    }
    
    // Дефолт
    return { name: 'Folder', component: Folder, type: 'lucide', label: 'Folder' };
  };
  
  const selectedIconDisplay = getSelectedIconDisplay();
  const SelectedIconComponent = selectedIconDisplay.type === 'iconify'
    ? () => <Icon icon={selectedIconDisplay.name.replace('iconify:', '')} width={16} height={16} />
    : (selectedIconDisplay.component || Folder);

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
        const dropdownMaxHeight = 384; // max-h-96 = 384px (увеличено для поля поиска)
        const dropdownWidth = 320; // Увеличено для удобства поиска
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
  
  // Функция поиска по Iconify API с debounce и отменой предыдущих запросов
  const searchIconifyIcons = useCallback(async (query) => {
    if (!query || query.trim().length < 3) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    
    // Отменяем предыдущий запрос, если он еще выполняется
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Создаем новый AbortController для этого запроса
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://api.iconify.design/search?query=${encodeURIComponent(query.trim())}&limit=50`,
        { signal: abortController.signal }
      );
      
      if (!response.ok) {
        throw new Error('Ошибка поиска иконок');
      }
      
      const data = await response.json();
      
      // Проверяем, не был ли запрос отменен
      if (abortController.signal.aborted) {
        return;
      }
      
      if (data.icons && Array.isArray(data.icons)) {
        const icons = data.icons.map(iconId => {
          const parts = iconId.split(':');
          const collection = parts[0] || '';
          const name = parts[1] || iconId;
          const label = name.replace(/-/g, ' ').replace(/_/g, ' ');
          
          return {
            name: `iconify:${iconId}`,
            label: label.charAt(0).toUpperCase() + label.slice(1),
            type: 'iconify',
            collection: collection
          };
        });
        
        setSearchResults(icons);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      // Игнорируем ошибку отмены запроса
      if (error.name === 'AbortError') {
        return;
      }
      console.error('Ошибка поиска иконок Iconify:', error);
      setSearchResults([]);
    } finally {
      // Обновляем состояние только если запрос не был отменен
      if (!abortController.signal.aborted) {
        setIsSearching(false);
      }
    }
  }, []);
  
  // Обработчик изменения поискового запроса с debounce
  useEffect(() => {
    // Отменяем предыдущий таймаут
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Отменяем предыдущий запрос, если он еще выполняется
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    if (searchQuery.trim().length >= 3) {
      // Увеличиваем debounce для снижения нагрузки и минимальную длину запроса
      searchTimeoutRef.current = setTimeout(() => {
        searchIconifyIcons(searchQuery);
      }, 800); // Debounce 800ms (увеличено для стабильности)
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      // Отменяем запрос при размонтировании
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [searchQuery, searchIconifyIcons]);
  
  // Фокус на поле поиска при открытии dropdown
  useEffect(() => {
    if (isOpen && shouldMount && searchInputRef.current) {
      // Небольшая задержка для завершения анимации
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, shouldMount]);
  
  // Сброс поиска при закрытии dropdown (но сохраняем выбранную иконку)
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      // Сохраняем выбранную иконку в searchResults, если она из Iconify
      if (value && value.startsWith('iconify:')) {
        const iconifyId = value.replace('iconify:', '');
        const parts = iconifyId.split(':');
        const collection = parts[0] || '';
        const name = parts[1] || iconifyId;
        const label = name.replace(/-/g, ' ').replace(/_/g, ' ');
        
        setSearchResults([{
          name: value,
          label: label.charAt(0).toUpperCase() + label.slice(1),
          type: 'iconify',
          collection: collection
        }]);
      } else {
        setSearchResults([]);
      }
      setIsSearching(false);
    }
  }, [isOpen, value]);
  
  const handleSelect = (iconName) => {
    onChange(iconName);
    setIsOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };
  
  // Определяем, какие иконки показывать
  const iconsToShow = searchQuery.trim().length >= 3 
    ? searchResults 
    : iconOptions;
  
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
          {selectedIconDisplay.type === 'iconify' ? (
            <Icon 
              icon={selectedIconDisplay.name.replace('iconify:', '')} 
              width={14} 
              height={14}
              style={{ color }}
            />
          ) : (
            <SelectedIconComponent 
              className="w-3.5 h-3.5 flex-shrink-0" 
              style={{ color }}
            />
          )}
          <span className="text-xs text-gray-700 dark:text-gray-300 truncate flex-1 text-left">
            {selectedIconDisplay.label || selectedIconDisplay.name || 'Folder'}
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
          className={`fixed z-[999999] glass-effect rounded-lg border-2 border-gray-300 dark:border-gray-600 shadow-2xl max-h-96 overflow-hidden bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg flex flex-col ${
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
            minWidth: '320px',
            maxHeight: '384px' // max-h-96
          }}
        >
          {/* Поле поиска */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchQuery ? "Поиск..." : "Поиск по 100,000+ иконкам (минимум 3 символа)..."}
                className="w-full pl-10 pr-10 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-normal"
                onKeyDown={(e) => {
                  // Предотвращаем закрытие dropdown при нажатии Enter
                  if (e.key === 'Enter') {
                    e.preventDefault();
                  }
                  // Закрытие по Escape
                  if (e.key === 'Escape') {
                    setIsOpen(false);
                  }
                }}
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 animate-spin" />
              )}
            </div>
            {searchQuery && searchQuery.trim().length >= 3 && !isSearching && searchResults.length === 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 px-1">
                Иконки не найдены
              </p>
            )}
            {searchQuery && searchQuery.trim().length > 0 && searchQuery.trim().length < 3 && (
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2 px-1">
                Введите минимум 3 символа для поиска
              </p>
            )}
            {searchQuery && searchQuery.trim().length >= 3 && searchResults.length > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 px-1">
                Найдено: {searchResults.length} {searchResults.length === 1 ? 'иконка' : searchResults.length < 5 ? 'иконки' : 'иконок'}
              </p>
            )}
          </div>
          
          {/* Список иконок с прокруткой */}
          <div className="flex-1 overflow-y-auto p-2">
            {iconsToShow.length === 0 && !isSearching ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500 dark:text-gray-400">
                <Search className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm">Начните вводить запрос для поиска</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {/* Ограничиваем количество отображаемых иконок для производительности */}
                {iconsToShow.slice(0, 100).map((option) => {
              const isSelected = option.name === value;
              const isIconify = option.type === 'iconify';
              
              return (
                <button
                  key={option.name}
                  type="button"
                  onClick={() => handleSelect(option.name)}
                  className={`
                    p-1.5 rounded transition-all flex items-center justify-center
                    ${isSelected 
                      ? 'bg-blue-100 dark:bg-blue-900/30 ring-1 ring-blue-500' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }
                  `}
                  title={option.label || option.name}
                >
                  {isIconify ? (
                    <Icon 
                      icon={option.name.replace('iconify:', '')} 
                      width={16} 
                      height={16}
                      style={{ color: color }}
                    />
                  ) : (
                    <option.component 
                      className="w-4 h-4" 
                      style={{ color: color }}
                    />
                  )}
                </button>
              );
            })}
              </div>
            )}
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

