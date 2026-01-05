import { Calendar, Search, Clock, FilterX, Info } from '../../utils/icons'
import { useState, useMemo, useCallback, useEffect } from 'react'
import {
  useEntries,
  useClearEntries,
  useBulkUpdateCategory,
  useBulkDeleteEntries,
  useGetEntriesByIds,
} from '../../store/useEntriesStore'
import { useTimer } from '../../hooks/useTimer'
import { useShowSuccess, useShowError, useOpenModal, useUIStore } from '../../store/useUIStore'
import {
  useListView,
  useSetListView,
  useDefaultEntriesFilter,
  useSetDefaultEntriesFilter,
  useSettingsStore,
} from '../../store/useSettingsStore'
import { useConfirmModal } from '../../hooks/useConfirmModal'
import { useCategory } from '../../hooks/useCategory'
import { ConfirmModal } from '../modals/ConfirmModal'
import { ListView } from './views/ListView'
import { GridView } from './views/GridView'
import { TimelineView } from './views/TimelineView'
import { EntriesCalendarView } from './views/EntriesCalendarView'
import { lazy, Suspense } from 'react'
import { BulkActionsPanel } from './BulkActionsPanel'

// ✅ ОПТИМИЗАЦИЯ: Lazy loading для модальных окон
const BulkCategoryModal = lazy(() =>
  import('../modals/BulkCategoryModal').then(module => ({ default: module.BulkCategoryModal }))
)
import { EntriesListHeader } from './EntriesListHeader'
import { EntriesListFooter } from './EntriesListFooter'
import { exportToJSON } from '../../utils/exportImport'
import { EmptyState } from '../ui/EmptyState'
import { ClockIllustration, FilterIllustration } from '../ui/illustrations'
import { handleError } from '../../utils/errorHandler'

/**
 * 📋 Список записей времени с поиском, фильтрацией и группировкой
 * - Поиск по описанию и категории
 * - Фильтры по датам (сегодня, месяц, год и т.д.)
 * - Группировка по датам
 * - Итоги за каждый день
 * - Кнопки добавления записи и запуска таймера
 * - Очистка базы данных
 */
export function EntriesList({
  onAddNew,
  onStartTimer,
  onEditEntry,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onExport,
  onImport,
}) {
  // ✅ ОПТИМИЗАЦИЯ: Используем атомарные селекторы для минимизации ре-рендеров
  const entries = useEntries()
  const clearEntries = useClearEntries()
  const bulkUpdateCategory = useBulkUpdateCategory()
  const bulkDeleteEntries = useBulkDeleteEntries()
  const getEntriesByIds = useGetEntriesByIds()

  const listView = useListView()
  const setListView = useSetListView()
  const defaultEntriesFilter = useDefaultEntriesFilter()
  const setDefaultEntriesFilter = useSetDefaultEntriesFilter()

  const { categories } = useCategory() // ✅ ОПТИМИЗАЦИЯ: Используем централизованный хук
  const showSuccess = useShowSuccess()
  const showError = useShowError()
  const timer = useTimer()
  const { confirmConfig, openConfirm } = useConfirmModal()
  const openModal = useOpenModal()
  
  // --- RESTORED FILTER LOGIC ---
  const { filters, updateFilters } = useUIStore()
  const searchQuery = filters.searchQuery || ''
  const dateFilter = filters.activeFilter || 'Месяц'
  const customDateRange = filters.customDateRange || { start: '', end: '' }

  const setSearchQuery = (q) => updateFilters({ searchQuery: q })
  const setDateFilter = (f) => updateFilters({ activeFilter: f })
  const setCustomDateRange = (r) => updateFilters({ customDateRange: r })

  const { getCategoryNameById } = useCategory({ defaultName: 'Без категории' })
  const getCategoryName = useCallback(id => getCategoryNameById(id, 'Без категории'), [getCategoryNameById])

  const filterTextMapping = useMemo(
    () => ({
      today: 'Сегодня',
      halfMonth1: '1/2 месяца',
      halfMonth2: '2/2 месяца',
      month: 'Месяц',
      year: 'Год',
      all: 'Все записи',
      custom: 'Выбор даты',
    }),
    []
  )

  const filterValueMapping = useMemo(
    () => ({
      Сегодня: 'today',
      '1/2 месяца': 'halfMonth1',
      '2/2 месяца': 'halfMonth2',
      Месяц: 'month',
      Год: 'year',
      'Все записи': 'all',
      'Выбор даты': 'custom',
    }),
    []
  )

  const filterOptions = useMemo(
    () => ['Сегодня', '1/2 месяца', '2/2 месяца', 'Месяц', 'Год', 'Все записи', 'Выбор даты'],
    []
  )

  const filterByDate = useCallback(
    entry => {
      const entryDate = new Date(entry.date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const currentMonth = today.getMonth()
      const currentYear = today.getFullYear()

      switch (dateFilter) {
        case 'Сегодня':
          return entryDate.toDateString() === today.toDateString()

        case '1/2 месяца': {
          const monthStart = new Date(currentYear, currentMonth, 1)
          const monthMid = new Date(currentYear, currentMonth, 15)
          return entryDate >= monthStart && entryDate <= monthMid
        }

        case '2/2 месяца': {
          const monthMid = new Date(currentYear, currentMonth, 16)
          const monthEnd = new Date(currentYear, currentMonth + 1, 0)
          return entryDate >= monthMid && entryDate <= monthEnd
        }

        case 'Месяц':
          return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear

        case 'Год':
          return entryDate.getFullYear() === currentYear

        case 'Выбор даты': {
          if (!customDateRange.start || !customDateRange.end) return false
          const startDate = new Date(customDateRange.start)
          const endDate = new Date(customDateRange.end)
          endDate.setHours(23, 59, 59)
          return entryDate >= startDate && entryDate <= endDate
        }

        case 'Все записи':
        default:
          return true
      }
    },
    [dateFilter, customDateRange]
  )

  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const categoryName = getCategoryName(entry.category || entry.categoryId)
      const matchesSearch =
        !searchQuery ||
        entry.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        categoryName.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesDate = filterByDate(entry)
      return matchesSearch && matchesDate
    })
  }, [entries, searchQuery, filterByDate, getCategoryName])
  // --- END RESTORED LOGIC ---

  // Состояние для массовых операций
  const [selectionMode, setSelectionMode] = useState(false)
  
  const [showBulkCategoryModal, setShowBulkCategoryModal] = useState(false)
  const selectedEntries = useUIStore(state => state.selectedEntries)
  const { toggleEntrySelection, selectAllEntries: selectAllInStore, clearSelection: clearSelectionInStore } = useUIStore()

  // Мемоизируем Set для передачи в дочерние компоненты (совместимость)
  const selectedEntriesSet = useMemo(() => new Set(selectedEntries), [selectedEntries])

  // ✅ ОПТИМИЗАЦИЯ: Мемоизированные функции для массовых операций
  const toggleSelection = useCallback(entryId => {
    toggleEntrySelection(String(entryId))
  }, [toggleEntrySelection])

  const selectAllEntries = useCallback(() => {
    const allEntryIds = filteredEntries.map(entry => String(entry.id))
    selectAllInStore(allEntryIds)
  }, [filteredEntries, selectAllInStore])

  const clearSelection = useCallback(() => {
    clearSelectionInStore()
    setSelectionMode(false)
  }, [clearSelectionInStore])

  const handleBulkCategory = useCallback(() => {
    if (selectedEntries.length > 0) {
      setShowBulkCategoryModal(true)
    }
  }, [selectedEntries.length])

  const handleBulkCategoryConfirm = useCallback(
    categoryId => {
      bulkUpdateCategory(selectedEntries, categoryId)
      showSuccess(`Категория изменена для ${selectedEntries.length} записей`)
      clearSelection()
    },
    [selectedEntries, bulkUpdateCategory, showSuccess, clearSelection]
  )

  const handleBulkExport = useCallback(async () => {
    const selectedEntriesData = getEntriesByIds(selectedEntries)

    try {
      await exportToJSON(selectedEntriesData, categories, useSettingsStore.getState(), {
        filename: `selected_entries_${new Date().toISOString().split('T')[0]}.json`,
      })
      showSuccess(`Экспортировано ${selectedEntries.length} записей`)
      clearSelection()
    } catch (error) {
      // ИСПРАВЛЕНО: Используем централизованную обработку ошибок
      const errorMessage = handleError(error as Error, {
        operation: 'Экспорт записей',
        count: selectedEntries.length,
      })
      showError(errorMessage)
    }
  }, [selectedEntries, getEntriesByIds, categories, showSuccess, showError, clearSelection])

  const handleBulkDelete = useCallback(() => {
    openConfirm({
      title: 'Удалить записи?',
      message: `Удалить ${selectedEntries.length} записей? Это действие нельзя отменить.`,
      onConfirm: () => {
        bulkDeleteEntries(selectedEntries)
        showSuccess(`Удалено ${selectedEntries.length} записей`)
        clearSelection()
      },
      confirmText: 'Удалить',
      cancelText: 'Отмена',
    })
  }, [selectedEntries, openConfirm, bulkDeleteEntries, showSuccess, clearSelection])

  return (
    <div className="glass-effect rounded-xl p-6 relative z-10">
      {/* Заголовок и кнопки */}
      <EntriesListHeader
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={onUndo}
        onRedo={onRedo}
        listView={listView}
        setListView={setListView}
        selectionMode={selectionMode}
        onToggleSelectionMode={() => setSelectionMode(!selectionMode)}
        onAddNew={onAddNew}
        onStartTimer={onStartTimer}
        timer={timer}
        onExport={onExport}
        onImport={onImport}
        onOpenCategories={() => openModal('soundSettings', { activeTab: 'categories' })}
        onOpenBackups={() => openModal('soundSettings', { activeTab: 'backups' })}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* ✅ ОПТИМИЗАЦИЯ: Lazy loading для модальных окон */}
      <Suspense fallback={null}>
        {/* Модальное окно массового изменения категории */}
        {showBulkCategoryModal && (
          <BulkCategoryModal
            isOpen={showBulkCategoryModal}
            onClose={() => setShowBulkCategoryModal(false)}
            selectedCount={selectedEntries.length}
            onConfirm={handleBulkCategoryConfirm}
          />
        )}
      </Suspense>

      {/* Панель массовых действий */}
      {selectionMode && selectedEntries.length > 0 && (
        <BulkActionsPanel
          selectedCount={selectedEntries.length}
          onSelectAll={selectAllEntries}
          onDeselectAll={() => clearSelectionInStore()}
          onBulkCategory={handleBulkCategory}
          onBulkExport={handleBulkExport}
          onBulkDelete={handleBulkDelete}
        />
      )}

      {/* Отображение записей в зависимости от выбранного вида */}
      <div
        className={`${filteredEntries.length > 10 ? 'max-h-[858px] overflow-y-auto pr-2 snap-y snap-mandatory' : ''}`}
      >
        {/* ВИЗУАЛ: Empty States для разных ситуаций */}
        {filteredEntries.length === 0 && entries.length > 0 && (
          <EmptyState
            icon={FilterX}
            title="Нет записей для выбранного фильтра"
            description="Попробуйте изменить фильтр по дате или поисковый запрос, чтобы найти нужные записи"
            variant="default"
            className="mb-6"
          />
        )}

        {filteredEntries.length === 0 && entries.length === 0 && (
          <EmptyState
            illustration={ClockIllustration}
            title="Нет записей времени"
            description="Начните отслеживать свое рабочее время, добавив первую запись или запустив таймер"
            action={{
              label: 'Добавить запись',
              onClick: onAddNew,
            }}
            variant="default"
            className="mb-6"
          />
        )}

        {/* Рендеринг в зависимости от выбранного вида с анимацией переключения */}
        {filteredEntries.length > 0 && (
          <div key={listView} className="animate-fade-in">
            {listView === 'list' && (
              // ОПТИМИЗАЦИЯ: Используем только оптимизированный ListView с инкрементальной загрузкой
              // VirtualizedListView удален - для аккордеонов с динамической высотой виртуализация неэффективна
              // Вместо этого ListView теперь использует:
              // - Инкрементальную загрузку (показываем по 50 дней, остальные по кнопке "Показать еще")
              // - React.memo для компонентов дня
              // - useMemo для группировки и кэширования метрик
              // - CSS optimization (contain, content-visibility)
              <ListView
                entries={filteredEntries}
                onEdit={onEditEntry}
                selectionMode={selectionMode}
                selectedEntries={selectedEntriesSet}
                onToggleSelection={toggleSelection}
              />
            )}

            {listView === 'grid' && (
              <GridView
                entries={filteredEntries}
                onEdit={onEditEntry}
                selectionMode={selectionMode}
                selectedEntries={selectedEntriesSet}
                onToggleSelection={toggleSelection}
              />
            )}

            {listView === 'timeline' && (
              <TimelineView
                entries={filteredEntries}
                onEdit={onEditEntry}
                selectionMode={selectionMode}
                selectedEntries={selectedEntriesSet}
                onToggleSelection={toggleSelection}
              />
            )}
          </div>
        )}

        {/* Календарь рендерится отдельно, вне условия filteredEntries */}
        {listView === 'calendar' && entries.length > 0 && (
          <div className="animate-fade-in">
            <EntriesCalendarView
              entries={entries}
              onDaySelect={() => {}}
              selectedDate={null}
              onEditEntry={onEditEntry}
            />
          </div>
        )}

        {/* Информационное сообщение для больших списков */}
        {filteredEntries.length > 100 && (
          <div className="mt-4 p-4 rounded-xl border border-blue-200/50 dark:border-blue-800/50 bg-blue-50/50 dark:bg-blue-900/10 backdrop-blur-sm flex items-start gap-3 transition-all hover:bg-blue-50 dark:hover:bg-blue-900/20">
            <div className="shrink-0 mt-0.5">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
              Показано <span className="font-semibold">{filteredEntries.length}</span> записей. Для лучшей производительности
              используйте фильтры для уменьшения количества записей.
            </p>
          </div>
        )}
      </div>

      {/* Футер с кнопкой очистки и фильтром */}
      <EntriesListFooter
        entriesCount={entries.length}
        filteredCount={filteredEntries.length}
        onClearDatabase={clearEntries}
        dateFilter={dateFilter}
        onDateFilterChange={setDateFilter}
        filterOptions={filterOptions}
        filterValueMapping={filterValueMapping}
        defaultEntriesFilter={defaultEntriesFilter}
        onSetDefaultFilter={setDefaultEntriesFilter}
        customDateRange={customDateRange}
        onCustomDateRangeChange={setCustomDateRange}
        showDatePicker={dateFilter === 'Выбор даты'}
      />

      <ConfirmModal {...confirmConfig} />
    </div>
  )
}
