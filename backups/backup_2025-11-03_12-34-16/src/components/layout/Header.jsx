import { useState, useEffect, useRef } from 'react';
import { Moon, Sun, Info, HelpCircle, GitCompare, ChevronDown, Volume2 } from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore';
import { StatisticsDashboard } from '../statistics/StatisticsDashboard';

/**
 * Шапка приложения с переключателем темы и быстрыми действиями
 * - Показывает название
 * - Переключает светлую/тёмную тему
 * - Экспорт/Импорт данных
 * - Открывает обучалку и окно "О приложении"
 * - Переключение режима сравнения периодов
 * - Отображает статистику с выбором периода
 */
export function Header({ 
  onShowTutorial, 
  onShowAbout,
  onShowSoundSettings,
  compareMode,
  onToggleCompare
}) {
  const { theme, setTheme } = useSettingsStore();
  const [comparePeriod, setComparePeriod] = useState('month');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  // Три состояния для контроля анимаций (Three-State Animation Control)
  const [shouldMountDropdown, setShouldMountDropdown] = useState(false);
  const [isAnimatingDropdown, setIsAnimatingDropdown] = useState(false);
  const [isExitingDropdown, setIsExitingDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const logoRef = useRef(null);

  // Логика открытия
  useEffect(() => {
    if (isDropdownOpen) {
      setShouldMountDropdown(true);
      setIsExitingDropdown(false);
      // Для обычных dropdown используем один RAF - двойной вызывает задваивание
      const rafId = requestAnimationFrame(() => {
        setIsAnimatingDropdown(true);
      });
      return () => cancelAnimationFrame(rafId);
    }
  }, [isDropdownOpen]);

  // Логика закрытия
  useEffect(() => {
    if (!isDropdownOpen && shouldMountDropdown && !isExitingDropdown) {
      setIsAnimatingDropdown(false);
      // RAF для синхронизации перед началом exit анимации
      const rafId = requestAnimationFrame(() => {
        setIsExitingDropdown(true);
      });
      return () => cancelAnimationFrame(rafId);
    }
  }, [isDropdownOpen, shouldMountDropdown, isExitingDropdown]);

  // Слушатель окончания анимации исчезновения
  useEffect(() => {
    if (isExitingDropdown && dropdownRef.current) {
      const handleAnimationEnd = (e) => {
        // Проверяем, что это именно наша exit анимация
        if (
          e.animationName === 'slideDownOut' ||
          e.animationName === 'slideUpOut' ||
          e.animationName.includes('slideOut')
        ) {
          setIsExitingDropdown(false);
          setShouldMountDropdown(false);
        }
      };

      // Fallback на случай, если событие не сработает
      const fallbackTimer = setTimeout(() => {
        setIsExitingDropdown(false);
        setShouldMountDropdown(false);
      }, 300); // Немного больше длительности анимации (200ms)

      dropdownRef.current.addEventListener('animationend', handleAnimationEnd);

      return () => {
        clearTimeout(fallbackTimer);
        dropdownRef.current?.removeEventListener('animationend', handleAnimationEnd);
      };
    }
  }, [isExitingDropdown]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark');
    
    // Обновляем фильтры иконки при смене темы
    if (logoRef.current) {
      const isDark = newTheme === 'dark';
      if (isDark) {
        logoRef.current.style.filter = 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3)) brightness(1.1) contrast(1.05)';
      } else {
        logoRef.current.style.filter = 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15))';
      }
    }
  };

  // Обновление фильтров иконки при изменении темы
  useEffect(() => {
    if (logoRef.current) {
      const isDark = theme === 'dark';
      if (isDark) {
        logoRef.current.style.filter = 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3)) brightness(1.1) contrast(1.05)';
      } else {
        logoRef.current.style.filter = 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15))';
      }
    }
  }, [theme]);

  const periodOptions = [
    { value: 'today', label: 'Сегодня' },
    { value: 'week', label: 'Неделя' },
    { value: 'month', label: 'Месяц' },
    { value: 'year', label: 'Год' }
  ];

  const getPeriodLabel = () => {
    return periodOptions.find(opt => opt.value === comparePeriod)?.label || 'Месяц';
  };

  return (
    <header className="glass-effect rounded-xl p-6 mb-6">
      {/* Верхняя строка с названием и кнопками */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {/* Логотип приложения с анимацией свечения */}
          <div className="flex-shrink-0 glow-blue rounded-lg p-1.5 transition-all duration-300">
            <img 
              ref={logoRef}
              src="/logo.png" 
              alt="Time Tracker Logo" 
              className="w-12 h-12 object-contain filter transition-all duration-300"
              style={{
                // Начальное значение, будет обновлено в useEffect и onLoad
                // Прозрачный фон обеспечивается через object-contain и отсутствие background
                backgroundColor: 'transparent',
                filter: theme === 'dark' 
                  ? 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3)) brightness(1.1) contrast(1.05)'
                  : 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15))',
              }}
              onLoad={(e) => {
                // Динамическая настройка в зависимости от темы при загрузке
                const isDark = theme === 'dark';
                const img = e.target;
                if (isDark) {
                  // Для темной темы - немного увеличиваем яркость и контраст
                  img.style.filter = 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3)) brightness(1.1) contrast(1.05)';
                } else {
                  // Для светлой темы - стандартные настройки
                  img.style.filter = 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15))';
                }
                // Убеждаемся что фон прозрачный
                img.style.backgroundColor = 'transparent';
              }}
            />
          </div>
          {/* Блок с текстом с анимацией при наведении */}
          <div className="transition-all duration-300 hover:translate-x-1 hover:scale-[1.02] cursor-default">
            <h1 className="text-2xl font-bold transition-all duration-300 hover:text-blue-600 dark:hover:text-blue-400">
              Time Tracker Dashboard
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 transition-all duration-300 hover:text-gray-700 dark:hover:text-gray-300">
              Умный учет рабочего времени
            </p>
          </div>
        </div>

        <div className="flex gap-2 items-center">
          {/* Выбор периода для сравнения (только если режим сравнения включен) */}
          {compareMode && (
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="glass-button px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-normal hover-lift-scale click-shrink"
                title="Выбрать период для сравнения"
              >
                <span>Период: {getPeriodLabel()}</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {shouldMountDropdown && (
                <div 
                  ref={dropdownRef}
                  className={`absolute right-0 mt-2 w-40 glass-effect rounded-lg shadow-lg z-50 py-1 ${
                    !isAnimatingDropdown && !isExitingDropdown ? 'opacity-0 -translate-y-4' : ''
                  } ${
                    isAnimatingDropdown ? 'animate-slide-down' : ''
                  } ${
                    isExitingDropdown ? 'animate-slide-up-out' : ''
                  }`}>
                  {periodOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setComparePeriod(option.value);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                        comparePeriod === option.value ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium' : ''
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Режим сравнения */}
          {onToggleCompare && (
            <button
              aria-label="Режим сравнения"
              onClick={onToggleCompare}
              className={`glass-button p-2 rounded-lg transition-normal hover-lift-scale click-shrink ${
                compareMode 
                  ? 'bg-blue-500 text-white hover:bg-blue-600' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title={compareMode ? 'Отключить сравнение' : 'Включить сравнение с предыдущим периодом'}
            >
              <GitCompare className="w-5 h-5" />
            </button>
          )}
          
          {/* Тема */}
          <button
            aria-label="Переключить тему"
            onClick={toggleTheme}
            className="glass-button p-2 rounded-lg transition-normal hover-lift-scale click-shrink"
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>

          {/* Звуки и анимация */}
          {onShowSoundSettings && (
            <button
              aria-label="Настройки звуков и анимации"
              onClick={onShowSoundSettings}
              className="glass-button p-2 rounded-lg transition-normal hover-lift-scale click-shrink"
              title="Настройки звуков и анимации"
            >
              <Volume2 className="w-5 h-5" />
            </button>
          )}

          {/* Tutorial и About */}
          <button
            aria-label="Открыть обучалку"
            onClick={onShowTutorial}
            className="glass-button p-2 rounded-lg transition-normal hover-lift-scale click-shrink"
          >
            <HelpCircle className="w-5 h-5" />
          </button>

          <button
            aria-label="О приложении"
            onClick={onShowAbout}
            className="glass-button p-2 rounded-lg transition-normal hover-lift-scale click-shrink"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Статистика */}
      <StatisticsDashboard 
        compareMode={compareMode}
        periodFilter={comparePeriod}
      />
    </header>
  );
}


