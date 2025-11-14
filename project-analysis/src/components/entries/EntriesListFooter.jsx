/**
 * 🔧 Футер списка записей с действиями
 *
 * Отвечает за:
 * - Кнопку очистки базы данных
 * - Дополнительные действия
 */

import { Trash2, ChevronDown, Pin } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useUIStore } from '../../store/useUIStore'
import { useConfirmModal } from '../../hooks/useConfirmModal'
import { ConfirmModal } from '../modals/ConfirmModal'
import { CustomDatePicker } from '../ui/CustomDatePicker'

export function EntriesListFooter({
  entriesCount,
  filteredCount,
  onClearDatabase,
  dateFilter,
  onDateFilterChange,
  filterOptions,
  filterValueMapping,
  defaultEntriesFilter,
  onSetDefaultFilter,
  customDateRange,
  onCustomDateRangeChange,
  showDatePicker,
}) {
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false)
  // Три состояния для контроля анимаций (Three-State Animation Control)
  const [shouldMountFilterDropdown, setShouldMountFilterDropdown] = useState(false)
  const [isAnimatingFilterDropdown, setIsAnimatingFilterDropdown] = useState(false)
  const [isExitingFilterDropdown, setIsExitingFilterDropdown] = useState(false)
  const [isStartDatePickerOpen, setIsStartDatePickerOpen] = useState(false)
  const [isEndDatePickerOpen, setIsEndDatePickerOpen] = useState(false)
  const dropdownContainerRef = useRef(null)
  const dropdownMenuRef = useRef(null)
  const startDateInputRef = useRef(null)
  const endDateInputRef = useRef(null)
  const { showSuccess, showError } = useUIStore()
  const firstConfirm = useConfirmModal()
  const secondConfirm = useConfirmModal()

  // Логика открытия
  useEffect(() => {
    if (isFilterDropdownOpen) {
      setShouldMountFilterDropdown(true)
      setIsExitingFilterDropdown(false)
      // Для обычных dropdown используем один RAF - двойной вызывает задваивание
      const rafId = requestAnimationFrame(() => {
        setIsAnimatingFilterDropdown(true)
      })
      return () => cancelAnimationFrame(rafId)
    }
  }, [isFilterDropdownOpen])

  // Логика закрытия
  useEffect(() => {
    if (!isFilterDropdownOpen && shouldMountFilterDropdown && !isExitingFilterDropdown) {
      setIsAnimatingFilterDropdown(false)
      // RAF для синхронизации перед началом exit анимации
      const rafId = requestAnimationFrame(() => {
        setIsExitingFilterDropdown(true)
      })
      return () => cancelAnimationFrame(rafId)
    }
  }, [isFilterDropdownOpen, shouldMountFilterDropdown, isExitingFilterDropdown])

  // Слушатель окончания анимации исчезновения
  useEffect(() => {
    if (isExitingFilterDropdown && dropdownMenuRef.current) {
      const handleAnimationEnd = e => {
        // Проверяем, что это именно наша exit анимация
        if (
          e.animationName === 'slideDownOut' ||
          e.animationName === 'slideUpOut' ||
          e.animationName.includes('slideOut')
        ) {
          setIsExitingFilterDropdown(false)
          setShouldMountFilterDropdown(false)
        }
      }

      // Fallback на случай, если событие не сработает
      const fallbackTimer = setTimeout(() => {
        setIsExitingFilterDropdown(false)
        setShouldMountFilterDropdown(false)
      }, 300) // Немного больше длительности анимации (200ms)

      dropdownMenuRef.current.addEventListener('animationend', handleAnimationEnd)

      return () => {
        clearTimeout(fallbackTimer)
        dropdownMenuRef.current?.removeEventListener('animationend', handleAnimationEnd)
      }
    }
  }, [isExitingFilterDropdown])

  // Закрытие dropdown при клике вне его
  useEffect(() => {
    const handleClickOutside = event => {
      const clickedInsideContainer = dropdownContainerRef.current?.contains(event.target)
      const clickedInsideMenu = dropdownMenuRef.current?.contains(event.target)

      if (!clickedInsideContainer && !clickedInsideMenu) {
        setIsFilterDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleClearDatabase = () => {
    // Первое предупреждение
    firstConfirm.openConfirm({
      title: '⚠️ ВНИМАНИЕ!',
      message: `Вы уверены, что хотите удалить ВСЕ записи?\n\nБудет удалено записей: ${entriesCount}\n\nЭто действие НЕОБРАТИМО!\n\nРекомендуется сначала экспортировать данные.`,
      onConfirm: () => {
        // Второе (последнее) предупреждение - открываем после закрытия первой
        setTimeout(() => {
          secondConfirm.openConfirm({
            title: '❗ ПОСЛЕДНЕЕ ПРЕДУПРЕЖДЕНИЕ!',
            message:
              'Вы ДЕЙСТВИТЕЛЬНО хотите удалить все записи?\n\nОтменить это действие будет НЕВОЗМОЖНО!',
            onConfirm: () => {
              try {
                onClearDatabase()
                showSuccess(`Удалено ${entriesCount} записей. База данных очищена.`)
              } catch (error) {
                showError('Ошибка при очистке базы: ' + error.message)
              }
            },
            confirmText: 'ДА, УДАЛИТЬ ВСЁ',
            cancelText: 'Отмена',
          })
        }, 100) // Небольшая задержка для закрытия первой модалки
      },
      confirmText: 'Продолжить',
      cancelText: 'Отмена',
    })
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={handleClearDatabase}
          disabled={entriesCount === 0}
          className="glass-button px-4 py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-500/10 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-normal hover-lift-scale click-shrink"
          title={entriesCount === 0 ? 'База данных пуста' : 'Удалить все записи'}
        >
          <Trash2 className="w-4 h-4" />
          Очистить базу ({entriesCount})
        </button>

        {/* Блок выбора даты - в одной строке с футером */}
        <div
          className={`transition-all duration-300 ease-in-out overflow-hidden ${
            showDatePicker
              ? 'opacity-100 max-h-96 translate-y-0'
              : 'opacity-0 max-h-0 -translate-y-2 pointer-events-none'
          }`}
        >
          {showDatePicker && (
            <div className="glass-effect p-3 rounded-lg flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 relative">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">
                  С даты:
                </label>
                <div className="relative">
                  <input
                    ref={startDateInputRef}
                    type="text"
                    value={
                      customDateRange.start
                        ? customDateRange.start.split('-').reverse().join('/')
                        : ''
                    }
                    onFocus={() => setIsStartDatePickerOpen(true)}
                    readOnly
                    className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 glass-effect w-32 cursor-pointer"
                    placeholder="дд/мм/гггг"
                  />
                  {isStartDatePickerOpen && (
                    <CustomDatePicker
                      value={customDateRange.start}
                      onChange={date => {
                        onCustomDateRangeChange({ ...customDateRange, start: date })
                        setIsStartDatePickerOpen(false)
                      }}
                      onClose={() => setIsStartDatePickerOpen(false)}
                      placeholder="дд/мм/гггг"
                      inputRef={startDateInputRef}
                    />
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 relative">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">
                  По дату:
                </label>
                <div className="relative">
                  <input
                    ref={endDateInputRef}
                    type="text"
                    value={
                      customDateRange.end ? customDateRange.end.split('-').reverse().join('/') : ''
                    }
                    onFocus={() => setIsEndDatePickerOpen(true)}
                    readOnly
                    className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 glass-effect w-32 cursor-pointer"
                    placeholder="дд/мм/гггг"
                  />
                  {isEndDatePickerOpen && (
                    <CustomDatePicker
                      value={customDateRange.end}
                      onChange={date => {
                        onCustomDateRangeChange({ ...customDateRange, end: date })
                        setIsEndDatePickerOpen(false)
                      }}
                      onClose={() => setIsEndDatePickerOpen(false)}
                      placeholder="дд/мм/гггг"
                      inputRef={endDateInputRef}
                    />
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  onCustomDateRangeChange({ start: '', end: '' })
                  onDateFilterChange('Все записи')
                }}
                className="glass-button px-3 py-1.5 text-sm rounded-lg whitespace-nowrap transition-normal hover-lift-scale click-shrink"
              >
                Сбросить
              </button>
            </div>
          )}
        </div>

        {/* Информация о фильтрации */}
        {filteredCount < entriesCount && (
          <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
            Записей:{' '}
            <span className="font-semibold text-gray-700 dark:text-gray-300">{filteredCount}</span>{' '}
            из{' '}
            <span className="font-semibold text-gray-700 dark:text-gray-300">{entriesCount}</span>
          </span>
        )}
      </div>

      {/* Фильтр в правом углу - кастомный dropdown с Pin иконками */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Фильтр:</span>

        <div className="relative" ref={dropdownContainerRef}>
          {/* Кнопка dropdown */}
          <button
            onClick={e => {
              e.stopPropagation()
              setIsFilterDropdownOpen(prev => !prev)
            }}
            className="glass-effect px-4 py-2 pr-10 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer font-medium min-w-[180px] text-left transition-normal hover-lift-scale click-shrink"
          >
            {dateFilter}
            <ChevronDown
              className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 transition-transform duration-200 ${isFilterDropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Dropdown меню - открывается ВВЕРХ с анимациями */}
          {shouldMountFilterDropdown && (
            <div
              ref={dropdownMenuRef}
              className={`absolute right-0 bottom-full mb-2 w-64 glass-effect rounded-lg border border-gray-300 dark:border-gray-600 shadow-xl z-[9999] max-h-96 overflow-y-auto bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg ${
                !isAnimatingFilterDropdown && !isExitingFilterDropdown
                  ? 'opacity-0 -translate-y-4'
                  : ''
              } ${isAnimatingFilterDropdown ? 'animate-slide-down' : ''} ${
                isExitingFilterDropdown ? 'animate-slide-up-out' : ''
              }`}
            >
              {filterOptions.map(option => {
                const filterKey = filterValueMapping[option]
                const isDefault = defaultEntriesFilter === filterKey
                const isCurrent = dateFilter === option

                return (
                  <div
                    key={option}
                    className={`flex items-center justify-between px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-700 last:border-b-0 ${
                      isCurrent ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    {/* Текст периода - кликабельный для выбора */}
                    <span
                      onClick={() => {
                        onDateFilterChange(option)
                        setIsFilterDropdownOpen(false)
                      }}
                      className="flex-1 text-sm"
                    >
                      {option}
                    </span>

                    {/* Иконка Pin для сохранения как дефолтный */}
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        onSetDefaultFilter(filterKey)
                        showSuccess(`"${option}" установлен по умолчанию`)
                      }}
                      className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors hover-lift-scale click-shrink ${
                        isDefault ? 'text-blue-500' : 'text-gray-400'
                      }`}
                      title={isDefault ? 'Текущий по умолчанию' : 'Установить по умолчанию'}
                    >
                      <Pin className={`w-4 h-4 ${isDefault ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <ConfirmModal {...firstConfirm.confirmConfig} />
      <ConfirmModal {...secondConfirm.confirmConfig} />
    </div>
  )
}
