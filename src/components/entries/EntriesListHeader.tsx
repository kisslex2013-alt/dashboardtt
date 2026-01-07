/**
 * 🎯 Заголовок списка записей с кнопками управления
 *
 * Отвечает за:
 * - Отображение заголовка
 * - Кнопки Undo/Redo
 * - Переключатель видов отображения
 * - Кнопки действий (Выбрать, Новая запись, Таймер, Экспорт, Импорт и т.д.)
 * - Поле поиска (минималистичное с анимацией)
 */

import { useState, useEffect } from 'react'
import {
  Undo,
  Redo,
  List,
  Grid,
  Clock,
  Calendar,
  Plus,
  Play,
  Square,
  Download,
  Upload,
  Folder,
  HardDrive,
  CheckSquare,
  X,
  Search,
  ChevronUp,
  Database,
} from '../../utils/icons'
import { useIsMobile } from '../../hooks/useIsMobile'
import { usePomodoroIsRunning } from '../../store/usePomodoroStore'
import { IconButton } from '../ui/IconButton'

export function EntriesListHeader({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  listView,
  setListView,
  selectionMode,
  onToggleSelectionMode,
  onAddNew,
  onStartTimer,
  timer,
  onExport,
  onImport,
  onOpenCategories,
  onOpenBackups,
  searchQuery,
  onSearchChange,
}) {
  const isMobile = useIsMobile()
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const pomodoroIsRunning = usePomodoroIsRunning() // ✅ ИНТЕГРАЦИЯ: проверка Pomodoro
  
  // 🎹 Слушаем глобальный хоткей поиска (Ctrl+F)
  useEffect(() => {
    const handleGlobalSearch = () => {
      setIsSearchExpanded(true)
      setIsSearchFocused(true)
      // Даем React время на рендер инпута, если он был скрыт
      setTimeout(() => {
        const input = document.querySelector('input[type="text"][placeholder*="Поиск"]') as HTMLInputElement
        if (input) {
          input.focus()
          input.select()
        }
      }, 50)
    }

    window.addEventListener('global-search-focus', handleGlobalSearch)
    return () => window.removeEventListener('global-search-focus', handleGlobalSearch)
  }, [])

  return (
    <>
      <div
        className={`${isMobile ? 'flex flex-col gap-3' : 'flex items-center justify-between'} mb-4`}
      >
        {/* Первая строка: Заголовок и переключатель видов */}
        <div className={`flex items-center ${isMobile ? 'justify-between' : 'gap-2'}`}>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-500" />
            База данных
          </h2>

          {/* Undo/Redo рядом с заголовком - скрыты на мобильных */}
          {!isMobile && (
            <>
              <button
                aria-label="Отменить действие"
                onClick={onUndo}
                disabled={!canUndo}
                className="glass-button p-1.5 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-normal hover-lift-scale click-shrink"
                title="Отменить (Ctrl+Z)"
                data-icon-id="header-undo"
              >
                <Undo className="w-4 h-4" />
              </button>

              <button
                aria-label="Повторить действие"
                onClick={onRedo}
                disabled={!canRedo}
                className="glass-button p-1.5 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-normal hover-lift-scale click-shrink"
                title="Повторить (Ctrl+Y)"
                data-icon-id="header-redo"
              >
                <Redo className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Переключатель видов отображения */}
          <div className={`flex items-center gap-1 ${isMobile ? 'ml-0' : 'ml-2'}`}>
            {/* === ДЕСКТОПНЫЕ ВИДЫ === */}
            {/* Кнопка "Список" - только десктоп */}
            {!isMobile && (
              <button
                onClick={() => setListView('list')}
                className={`p-2 rounded-lg transition-normal hover-lift-scale click-shrink ${
                  listView === 'list'
                    ? 'text-blue-500 bg-blue-500/10'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-500/10'
                }`}
                title="Список"
                aria-label="Вид списком"
                data-icon-id="view-list"
              >
                <List className="w-4 h-4" />
              </button>
            )}

            {/* Кнопка "Сетка" - доступна везде */}
            <button
              onClick={() => setListView('grid')}
              className={`${isMobile ? 'p-2.5' : 'p-2'} rounded-lg transition-normal hover-lift-scale click-shrink touch-manipulation ${
                listView === 'grid'
                  ? 'text-blue-500 bg-blue-500/10'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-500/10'
              }`}
              style={{
                minWidth: isMobile ? '44px' : 'auto',
                minHeight: isMobile ? '44px' : 'auto',
              }}
              title="Сетка"
              aria-label="Вид сеткой"
              data-icon-id="view-grid"
            >
              <Grid className={isMobile ? 'w-5 h-5' : 'w-4 h-4'} />
            </button>

            {/* Кнопка "Таймлайн" - только десктоп */}
            {!isMobile && (
              <button
                onClick={() => setListView('timeline')}
                className={`p-2 rounded-lg transition-normal hover-lift-scale click-shrink ${
                  listView === 'timeline'
                    ? 'text-blue-500 bg-blue-500/10'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-500/10'
                }`}
                title="Таймлайн"
                aria-label="Вид таймлайном"
                data-icon-id="view-timeline"
              >
                <Clock className="w-4 h-4" />
              </button>
            )}

            {/* Кнопка "Календарь" - только десктоп */}
            {!isMobile && (
              <button
                onClick={() => setListView('calendar')}
                className={`p-2 rounded-lg transition-normal hover-lift-scale click-shrink ${
                  listView === 'calendar'
                    ? 'text-blue-500 bg-blue-500/10'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-500/10'
                }`}
                title="Календарь"
                aria-label="Вид календарём"
                data-icon-id="view-calendar"
              >
                <Calendar className="w-4 h-4" />
              </button>
            )}

            {/* === МОБИЛЬНЫЕ ВИДЫ === */}
            {/* Кнопка "Agenda" - только мобильные */}
            {isMobile && (
              <button
                onClick={() => setListView('agenda')}
                className={`p-2.5 rounded-lg transition-normal hover-lift-scale click-shrink touch-manipulation ${
                  listView === 'agenda'
                    ? 'text-blue-500 bg-blue-500/10'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-500/10'
                }`}
                style={{ minWidth: '44px', minHeight: '44px' }}
                title="Agenda"
                aria-label="Вид агендой"
                data-icon-id="view-agenda"
              >
                <List className="w-5 h-5" />
              </button>
            )}

            {/* Кнопка "Cards" - только мобильные */}
            {isMobile && (
              <button
                onClick={() => setListView('cards')}
                className={`p-2.5 rounded-lg transition-normal hover-lift-scale click-shrink touch-manipulation ${
                  listView === 'cards'
                    ? 'text-blue-500 bg-blue-500/10'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-500/10'
                }`}
                style={{ minWidth: '44px', minHeight: '44px' }}
                title="Cards"
                aria-label="Вид карточками"
                data-icon-id="view-cards"
              >
                <Clock className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Кнопки в правом углу (десктоп) */}
        {!isMobile && (
          <div className="flex items-center gap-2 flex-wrap">
            {/* Поле поиска - минималистичное с анимацией (слева от Выбрать) */}
            <div className="relative">
              {!isSearchExpanded ? (
                <button
                  onClick={() => {
                    setIsSearchExpanded(true)
                    setTimeout(() => setIsSearchFocused(true), 50)
                  }}
                  className="glass-button w-10 h-10 p-0 rounded-lg transition-normal hover-lift-scale click-shrink flex items-center justify-center"
                  title="Поиск"
                  aria-label="Поиск"
                  data-icon-id="header-search"
                >
                  <Search className="w-5 h-5" />
                </button>
              ) : null}
            </div>

            {/* Кнопка режима выбора - минималистичная с анимацией */}
            {!selectionMode ? (
              <IconButton
                onClick={onToggleSelectionMode}
                className="glass-button h-10 min-w-[2.5rem] px-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg overflow-hidden group relative transition-normal hover-lift-scale click-shrink flex items-center justify-center"
                title="Выбрать"
                aria-label="Выбрать"
                style={{ width: 'auto' }}
                iconId="header-select"
                defaultIcon={CheckSquare}
              >
                <span className="ml-0 pr-0 opacity-0 max-w-0 group-hover:opacity-100 group-hover:max-w-xs group-hover:ml-2 group-hover:pr-4 transition-normal whitespace-nowrap overflow-hidden">
                  Выбрать
                </span>
              </IconButton>
            ) : (
              <button
                onClick={onToggleSelectionMode}
                className="glass-button h-10 min-w-[2.5rem] px-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg overflow-hidden group relative transition-normal hover-lift-scale click-shrink flex items-center justify-center"
                title="Отменить"
                aria-label="Отменить"
                style={{ width: 'auto' }}
                data-icon-id="header-select-cancel"
              >
                <X className="w-5 h-5 flex-shrink-0" />
                <span className="ml-0 pr-0 opacity-0 max-w-0 group-hover:opacity-100 group-hover:max-w-xs group-hover:ml-2 group-hover:pr-4 transition-normal whitespace-nowrap overflow-hidden">
                  Отменить
                </span>
              </button>
            )}

            {/* Новая запись - минималистичная с анимацией */}
            <IconButton
              onClick={onAddNew}
              className="glass-button h-10 min-w-[2.5rem] px-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg overflow-hidden group relative transition-normal hover-lift-scale click-shrink flex items-center justify-center"
              title="Новая запись"
              aria-label="Новая запись"
              style={{ width: 'auto' }}
              iconId="header-add-new"
              defaultIcon={Plus}
            >
              <span className="ml-0 pr-0 opacity-0 max-w-0 group-hover:opacity-100 group-hover:max-w-xs group-hover:ml-2 group-hover:pr-4 transition-normal whitespace-nowrap overflow-hidden">
                Новая запись
              </span>
            </IconButton>

            {/* Таймер - минималистичная с анимацией и пульсацией при активности */}
            <div className="flex items-center gap-2">
              <div className="relative">
                {/* Пульсирующее кольцо при активном таймере */}
                {timer.isRunning && (
                  <div className="absolute -inset-1 rounded-lg bg-red-500/30 animate-ping" />
                )}
                <IconButton
                  onClick={onStartTimer}
                  className={`relative glass-button h-10 min-w-[2.5rem] px-2.5 ${
                    timer.isRunning ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30' : 'bg-green-500 hover:bg-green-600'
                  } text-white rounded-lg overflow-hidden group transition-normal hover-lift-scale click-shrink flex items-center justify-center`}
                  title="Таймер"
                  aria-label="Таймер"
                  style={{ width: 'auto' }}
                  iconId={timer.isRunning ? 'header-timer-stop' : 'header-timer-start'}
                  defaultIcon={timer.isRunning ? Square : Play}
                >
                  <span className="ml-0 pr-0 opacity-0 max-w-0 group-hover:opacity-100 group-hover:max-w-xs group-hover:ml-2 group-hover:pr-4 transition-normal whitespace-nowrap overflow-hidden">
                    Таймер
                  </span>
                </IconButton>
              </div>

              {/* ✅ ИНТЕГРАЦИЯ: Индикатор одновременной работы таймеров */}
              {timer.isRunning && pomodoroIsRunning && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 animate-pulse">
                  <span className="text-[10px] font-semibold text-yellow-700 dark:text-yellow-400">
                    🍅+⏱️
                  </span>
                  <span className="text-[9px] text-yellow-600 dark:text-yellow-500 hidden sm:inline">
                    Интеграция
                  </span>
                </div>
              )}
            </div>

            {/* Импорт, Экспорт, Категории, Бэкапы - скрыты на мобильных */}
            {/* Импорт - минималистичная с анимацией (нейтральный стиль) */}
            <IconButton
              aria-label="Импорт данных"
              onClick={onImport}
              className="glass-button h-10 min-w-[2.5rem] px-2.5 rounded-lg overflow-hidden group relative transition-normal hover-lift-scale click-shrink flex items-center justify-center"
              title="Импорт из JSON"
              style={{ width: 'auto' }}
              iconId="header-import"
              defaultIcon={Download}
            >
              <span className="ml-0 pr-0 opacity-0 max-w-0 group-hover:opacity-100 group-hover:max-w-xs group-hover:ml-2 group-hover:pr-4 transition-normal whitespace-nowrap overflow-hidden">
                Импорт
              </span>
            </IconButton>

            {/* Экспорт - минималистичная с анимацией (нейтральный стиль) */}
            <IconButton
              aria-label="Экспорт данных"
              onClick={onExport}
              className="glass-button h-10 min-w-[2.5rem] px-2.5 rounded-lg overflow-hidden group relative transition-normal hover-lift-scale click-shrink flex items-center justify-center"
              title="Экспорт в JSON"
              style={{ width: 'auto' }}
              iconId="header-export"
              defaultIcon={Upload}
            >
              <span className="ml-0 pr-0 opacity-0 max-w-0 group-hover:opacity-100 group-hover:max-w-xs group-hover:ml-2 group-hover:pr-4 transition-normal whitespace-nowrap overflow-hidden">
                Экспорт
              </span>
            </IconButton>

            {/* Управление категориями - минималистичная с анимацией (нейтральный стиль) */}
            <IconButton
              aria-label="Управление категориями"
              onClick={onOpenCategories}
              className="glass-button h-10 min-w-[2.5rem] px-2.5 rounded-lg overflow-hidden group relative transition-normal hover-lift-scale click-shrink flex items-center justify-center"
              title="Управление категориями"
              style={{ width: 'auto' }}
              iconId="header-categories"
              defaultIcon={Folder}
            >
              <span className="ml-0 pr-0 opacity-0 max-w-0 group-hover:opacity-100 group-hover:max-w-xs group-hover:ml-2 group-hover:pr-4 transition-normal whitespace-nowrap overflow-hidden">
                Категории
              </span>
            </IconButton>

            {/* Управление бэкапами - минималистичная с анимацией (нейтральный стиль) */}
            <IconButton
              aria-label="Управление резервными копиями"
              onClick={onOpenBackups}
              className="glass-button h-10 min-w-[2.5rem] px-2.5 rounded-lg overflow-hidden group relative transition-normal hover-lift-scale click-shrink flex items-center justify-center"
              title="Управление резервными копиями"
              style={{ width: 'auto' }}
              iconId="header-backups"
              defaultIcon={HardDrive}
            >
              <span className="ml-0 pr-0 opacity-0 max-w-0 group-hover:opacity-100 group-hover:max-w-xs group-hover:ml-2 group-hover:pr-4 transition-normal whitespace-nowrap overflow-hidden">
                Бэкапы
              </span>
            </IconButton>
          </div>
        )}

        {/* Вторая строка на мобильных: Кнопки действий */}
        {isMobile ? (
          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 pb-2 scrollbar-hide">
            <div className="flex items-center gap-2 min-w-max">
              {/* Поле поиска - минималистичное с анимацией (слева от Выбрать) */}
              <div className="relative">
                {!isSearchExpanded ? (
                  <button
                    onClick={() => {
                      setIsSearchExpanded(true)
                      setTimeout(() => setIsSearchFocused(true), 50)
                    }}
                    className={`glass-button ${isMobile ? 'w-11 h-11' : 'w-10 h-10'} p-0 rounded-lg transition-normal hover-lift-scale click-shrink flex items-center justify-center touch-manipulation`}
                    style={{
                      minWidth: isMobile ? '44px' : 'auto',
                      minHeight: isMobile ? '44px' : 'auto',
                    }}
                    title="Поиск"
                    aria-label="Поиск"
                    data-icon-id="header-search"
                  >
                    <Search className={isMobile ? 'w-6 h-6' : 'w-5 h-5'} />
                  </button>
                ) : null}
              </div>

              {/* Кнопка режима выбора - минималистичная с анимацией */}
              {!selectionMode ? (
                <IconButton
                  onClick={onToggleSelectionMode}
                  className={`glass-button ${isMobile ? 'h-11' : 'h-10'} min-w-[2.5rem] px-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg overflow-hidden group relative transition-normal hover-lift-scale click-shrink flex items-center justify-center touch-manipulation`}
                  style={{
                    minWidth: isMobile ? '44px' : 'auto',
                    minHeight: isMobile ? '44px' : 'auto',
                  }}
                  title="Выбрать"
                  aria-label="Выбрать"
                  iconId="header-select"
                  defaultIcon={CheckSquare}
                ></IconButton>
              ) : (
                <button
                  onClick={onToggleSelectionMode}
                  className="glass-button h-11 min-w-[2.5rem] px-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg overflow-hidden group relative transition-normal hover-lift-scale click-shrink flex items-center justify-center touch-manipulation"
                  style={{ minWidth: '44px', minHeight: '44px' }}
                  title="Отменить"
                  aria-label="Отменить"
                  data-icon-id="header-select-cancel"
                >
                  <X className="w-6 h-6 flex-shrink-0" />
                </button>
              )}

              {/* Новая запись - минималистичная с анимацией */}
              <IconButton
                onClick={onAddNew}
                className="glass-button h-11 min-w-[2.5rem] px-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg overflow-hidden group relative transition-normal hover-lift-scale click-shrink flex items-center justify-center touch-manipulation"
                style={{ minWidth: '44px', minHeight: '44px' }}
                title="Новая запись"
                aria-label="Новая запись"
                iconId="header-add-new"
                defaultIcon={Plus}
              ></IconButton>

              {/* Таймер - минималистичная с анимацией и пульсацией при активности */}
              <div className="relative">
                {/* Пульсирующее кольцо при активном таймере */}
                {timer.isRunning && (
                  <div className="absolute -inset-1 rounded-lg bg-red-500/30 animate-ping" />
                )}
                <IconButton
                  onClick={onStartTimer}
                  className={`relative glass-button h-11 min-w-[2.5rem] px-2.5 ${
                    timer.isRunning
                      ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30'
                      : 'bg-green-500 hover:bg-green-600'
                  } text-white rounded-lg overflow-hidden group transition-normal hover-lift-scale click-shrink flex items-center justify-center touch-manipulation`}
                  style={{ minWidth: '44px', minHeight: '44px' }}
                  title="Таймер"
                  aria-label="Таймер"
                  iconId={timer.isRunning ? 'header-timer-stop' : 'header-timer-start'}
                  defaultIcon={timer.isRunning ? Square : Play}
                ></IconButton>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Поле поиска - расширенное, сдвигается вниз с анимацией */}
      {isSearchExpanded && (
        <div
          className={`mt-4 mb-4 transition-all duration-300 ease-in-out ${
            isSearchFocused ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
          }`}
          style={{
            animation: isSearchFocused ? 'slideDown 0.3s ease-out' : 'none',
          }}
        >
          <div className="relative">
            <input
              type="text"
              placeholder="Поиск по описанию или категории..."
              value={searchQuery || ''}
              onChange={e => onSearchChange?.(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={e => {
                if (!e.target.value) {
                  setIsSearchFocused(false)
                  setTimeout(() => {
                    if (!e.target.value) setIsSearchExpanded(false)
                  }, 300)
                }
              }}
              className="w-full px-4 py-2 pl-10 pr-10 glass-effect rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
              autoFocus
              style={{
                animation: isSearchFocused ? 'expandWidth 0.3s ease-out' : 'none',
              }}
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />

            {/* Кнопка очистки (крестик) - показывается когда есть текст */}
            {searchQuery && searchQuery.trim().length > 0 && (
              <button
                onClick={e => {
                  e.stopPropagation()
                  onSearchChange?.('')
                  const input = e.target.closest('.relative')?.querySelector('input')
                  if (input) {
                    input.focus()
                  }
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                title="Очистить поиск"
                aria-label="Очистить поиск"
                type="button"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Кнопка возврата (стрелка вверх) - показывается когда строка пуста */}
            {(!searchQuery || searchQuery.trim().length === 0) && (
              <button
                onClick={e => {
                  e.stopPropagation()
                  setIsSearchFocused(false)
                  setTimeout(() => {
                    setIsSearchExpanded(false)
                  }, 300)
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                title="Свернуть поиск"
                aria-label="Свернуть поиск"
                type="button"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      <style>{`
      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      @keyframes expandWidth {
        from {
          width: 2.5rem;
        }
        to {
          width: 100%;
        }
      }
    `}</style>
    </>
  )
}
