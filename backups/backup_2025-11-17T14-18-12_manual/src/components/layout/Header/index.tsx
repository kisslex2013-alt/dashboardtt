import { useState, useCallback } from 'react'
import { Info, HelpCircle, Volume2, Menu, Sparkles } from '../../../utils/icons'
import { useTheme, useSetTheme, useThemeTransitionType } from '../../../store/useSettingsStore'
import { useIsMobile } from '../../../hooks/useIsMobile'
import { StatisticsDashboard } from '../../statistics/StatisticsDashboard'
import { MobileMenu } from '../MobileMenu'
import { AppLogo } from './components/AppLogo'
import { ThemeToggle } from './components/ThemeToggle'
import { ColorSchemeSelector } from './components/ColorSchemeSelector'
import { QuickStartPanel } from './components/QuickStartPanel'
import { ComparisonControls } from './components/ComparisonControls'
import { AINotificationsButton } from './components/AINotificationsButton'

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
  compareMode,
  onToggleCompare,
  onOpenCategories,
  onOpenBackups,
  onExport,
  onImport,
}) {
  const theme = useTheme()
  const setTheme = useSetTheme()
  const themeTransitionType = useThemeTransitionType()
  const isMobile = useIsMobile()
  const [comparePeriod, setComparePeriod] = useState('month')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Функция для переключения темы (используется в MobileMenu)
  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    document.documentElement.classList.toggle('dark')
  }, [theme, setTheme])

  const periodOptions = [
    { value: 'today', label: 'Сегодня' },
    { value: 'week', label: 'Неделя' },
    { value: 'month', label: 'Месяц' },
    { value: 'year', label: 'Год' },
  ]

  return (
    <>
      <header className="glass-effect rounded-xl p-4 sm:p-6 mb-0 relative z-10" role="banner">
        {/* Верхняя строка с названием и кнопками */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
            {/* Логотип приложения */}
            <AppLogo />

            {/* Блок с текстом с анимацией при наведении */}
            <div className="transition-all duration-300 hover:translate-x-1 hover:scale-[1.02] cursor-default min-w-0 flex-1">
              <div className="flex items-center gap-2 sm:gap-3">
                {/* ✅ A11Y: Улучшаем контраст для темной темы */}
                <h1 className="text-lg sm:text-2xl font-bold transition-all duration-300 hover:text-blue-600 dark:hover:text-blue-400 truncate text-gray-900 dark:text-white">
                  {isMobile ? 'Time Tracker' : 'Time Tracker Dashboard'}
                </h1>
                {/* Кнопка промо-страницы */}
                <button
                  onClick={() => {
                    // Добавляем анимацию fade-out
                    document.body.style.transition = 'opacity 0.5s ease-out'
                    document.body.style.opacity = '0'

                    // Переходим на промо-страницу после анимации
                    setTimeout(() => {
                      window.location.href = '/promo/time-tracker-promo-variant-2.html'
                    }, 500)
                  }}
                  className="glass-button p-1.5 sm:p-2 rounded-lg transition-normal hover-lift-scale click-shrink touch-manipulation"
                  style={{
                    minWidth: isMobile ? '36px' : 'auto',
                    minHeight: isMobile ? '36px' : 'auto',
                  }}
                  title="Открыть промо-страницу"
                  aria-label="Открыть промо-страницу"
                  data-icon-id="header-promo"
                >
                  <Sparkles className={isMobile ? 'w-4 h-4' : 'w-5 h-5'} />
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
                {/* Контролы сравнения */}
                <ComparisonControls
                  compareMode={compareMode}
                  onToggleCompare={onToggleCompare}
                  comparePeriod={comparePeriod}
                  onComparePeriodChange={setComparePeriod}
                />

                {/* Quick Start - быстрый запуск таймера */}
                <QuickStartPanel />

                {/* AI-уведомления */}
                <AINotificationsButton />

                {/* Цветовая схема - скрыта */}
                {/* <ColorSchemeSelector /> */}

                {/* Тема - всегда видна */}
                <ThemeToggle />

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
        <StatisticsDashboard compareMode={compareMode} periodFilter={comparePeriod} />
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
          compareMode={compareMode}
          onToggleCompare={onToggleCompare}
          comparePeriod={comparePeriod}
          onComparePeriodChange={setComparePeriod}
          periodOptions={periodOptions}
          onOpenCategories={onOpenCategories}
          onOpenBackups={onOpenBackups}
          onExport={onExport}
          onImport={onImport}
        />
      )}
    </>
  )
}

