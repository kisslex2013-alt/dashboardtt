import { useState, useEffect, useRef } from 'react';
import { Moon, Sun, Info, HelpCircle, GitCompare, ChevronDown, Volume2, Smartphone, Menu, Sparkles } from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useIsMobile } from '../../hooks/useIsMobile';
import { StatisticsDashboard } from '../statistics/StatisticsDashboard';
import { MobileMenu } from './MobileMenu';

/**
 * Шапка приложения с переключателем темы и быстрыми действиями
 * - Показывает название
 * - Переключает светлую/тёмную тему
 * - Экспорт/Импорт данных
 * - Открывает обучалку и окно "О приложении"
 * - Переключение режима сравнения периодов
 * - Отображает статистику с выбором периода
 * 
 * АДАПТИВНОСТЬ: На мобильных устройствах использует hamburger menu для дополнительных действий
 */
export function Header({ 
  onShowTutorial, 
  onShowAbout,
  onShowSoundSettings,
  onShowFloatingPanelSettings,
  compareMode,
  onToggleCompare
}) {
  const { theme, setTheme } = useSettingsStore();
  const isMobile = useIsMobile();
  const [comparePeriod, setComparePeriod] = useState('month');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // Три состояния для контроля анимаций (Three-State Animation Control)
  const [shouldMountDropdown, setShouldMountDropdown] = useState(false);
  const [isAnimatingDropdown, setIsAnimatingDropdown] = useState(false);
  const [isExitingDropdown, setIsExitingDropdown] = useState(false);
  const dropdownRef = useRef(null);

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
  };


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
    <>
      <header className="glass-effect rounded-xl p-4 sm:p-6 mb-6">
        {/* Верхняя строка с названием и кнопками */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
            {/* Логотип приложения с анимацией Data Pulse */}
            <div className="flex-shrink-0 logo-wrapper">
              <img 
                src="/logo-4-data-pulse.svg" 
                alt="Time Tracker Logo" 
                className="w-8 h-8 sm:w-12 sm:h-12 object-contain logo-data-pulse"
                style={{ 
                  animation: 'data-pulse-logo 2s ease-in-out infinite',
                  willChange: 'transform, opacity, filter'
                }}
              />
            </div>
            {/* Блок с текстом с анимацией при наведении */}
            <div className="transition-all duration-300 hover:translate-x-1 hover:scale-[1.02] cursor-default min-w-0 flex-1">
              <div className="flex items-center gap-2 sm:gap-3">
                <h1 className="text-lg sm:text-2xl font-bold transition-all duration-300 hover:text-blue-600 dark:hover:text-blue-400 truncate">
                  {isMobile ? 'Time Tracker' : 'Time Tracker Dashboard'}
                </h1>
                {/* Кнопка промо-страницы */}
                <button
                  onClick={() => {
                    // Добавляем анимацию fade-out
                    document.body.style.transition = 'opacity 0.5s ease-out';
                    document.body.style.opacity = '0';
                    
                    // Переходим на промо-страницу после анимации
                    setTimeout(() => {
                      window.location.href = '/promo/time-tracker-promo-variant-2.html';
                    }, 500);
                  }}
                  className="glass-button p-1.5 sm:p-2 rounded-lg transition-normal hover-lift-scale click-shrink touch-manipulation"
                  style={{ minWidth: isMobile ? '36px' : 'auto', minHeight: isMobile ? '36px' : 'auto' }}
                  title="Открыть промо-страницу"
                  aria-label="Открыть промо-страницу"
                  data-icon-id="header-promo"
                >
                  <Sparkles className={isMobile ? "w-4 h-4" : "w-5 h-5"} />
                </button>
              </div>
              {!isMobile && (
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 transition-all duration-300 hover:text-gray-700 dark:hover:text-gray-300">
                  Умный учет рабочего времени
                </p>
              )}
            </div>
          </div>

          {/* Кнопки действий */}
          <div className="flex gap-2 items-center flex-shrink-0">
            {/* Мобильное меню (hamburger) - только на мобильных */}
            {isMobile ? (
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="glass-button p-2 rounded-lg transition-normal hover-lift-scale click-shrink"
                aria-label="Открыть меню"
                style={{ minWidth: '44px', minHeight: '44px' }}
                data-icon-id="header-mobile-menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            ) : (
              <>
                {/* Выбор периода для сравнения (только если режим сравнения включен) - только на десктопе */}
                {compareMode && (
                  <div className="relative">
                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="glass-button px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-normal hover-lift-scale click-shrink"
                      title="Выбрать период для сравнения"
                      data-icon-id="header-compare-period"
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
                
                {/* Режим сравнения - только на десктопе */}
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
                    data-icon-id="header-compare"
                  >
                    <GitCompare className="w-5 h-5" />
                  </button>
                )}
                
                {/* Тема - всегда видна */}
                <button
                  aria-label="Переключить тему"
                  onClick={toggleTheme}
                  className="glass-button p-2 rounded-lg transition-normal hover-lift-scale click-shrink"
                  data-icon-id={theme === 'light' ? "header-theme-light" : "header-theme-dark"}
                >
                  {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                </button>

                {/* Звуки и анимация - только на десктопе */}
                {onShowSoundSettings && (
                  <button
                    aria-label="Настройки звуков и анимации"
                    onClick={onShowSoundSettings}
                    className="glass-button p-2 rounded-lg transition-normal hover-lift-scale click-shrink"
                    title="Настройки звуков и анимации"
                    data-icon-id="header-sound-settings"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                )}

                {/* Настройки плавающей панели - только на десктопе */}
                {onShowFloatingPanelSettings && (
                  <button
                    aria-label="Настройки плавающей панели"
                    onClick={onShowFloatingPanelSettings}
                    className="glass-button p-2 rounded-lg transition-normal hover-lift-scale click-shrink"
                    title="Настройки плавающей панели таймера"
                    data-icon-id="header-floating-panel-settings"
                  >
                    <Smartphone className="w-5 h-5" />
                  </button>
                )}

                {/* Tutorial и About - только на десктопе */}
                <button
                  aria-label="Открыть обучалку"
                  onClick={onShowTutorial}
                  className="glass-button p-2 rounded-lg transition-normal hover-lift-scale click-shrink"
                  data-icon-id="header-tutorial"
                >
                  <HelpCircle className="w-5 h-5" />
                </button>

                <button
                  aria-label="О приложении"
                  onClick={onShowAbout}
                  className="glass-button p-2 rounded-lg transition-normal hover-lift-scale click-shrink"
                  data-icon-id="header-about"
                >
                  <Info className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Статистика */}
        <StatisticsDashboard 
          compareMode={compareMode}
          periodFilter={comparePeriod}
        />
      </header>

      {/* Мобильное меню */}
      {isMobile && (
        <MobileMenu
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          theme={theme}
          onToggleTheme={toggleTheme}
          onShowTutorial={onShowTutorial}
          onShowAbout={onShowAbout}
          onShowSoundSettings={onShowSoundSettings}
          onShowFloatingPanelSettings={onShowFloatingPanelSettings}
          compareMode={compareMode}
          onToggleCompare={onToggleCompare}
          comparePeriod={comparePeriod}
          onComparePeriodChange={setComparePeriod}
          periodOptions={periodOptions}
        />
      )}
    </>
  );
}


