import { Calendar, Search, Clock, FilterX } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useEntriesStore } from '../../store/useEntriesStore';
import { useTimer } from '../../hooks/useTimer';
import { useUIStore } from '../../store/useUIStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useConfirmModal } from '../../hooks/useConfirmModal';
import { ConfirmModal } from '../modals/ConfirmModal';
import { ListView } from './views/ListView';
import { useDebounce } from '../../hooks/useDebounce';
// ОПТИМИЗАЦИЯ: Убрали VirtualizedListView - для аккордеонов с динамической высотой виртуализация неэффективна
// import { VirtualizedListView } from './views/VirtualizedListView';
import { GridView } from './views/GridView';
import { TimelineView } from './views/TimelineView';
import { CategoriesModal } from '../modals/CategoriesModal';
import { BulkActionsPanel } from './BulkActionsPanel';
import { BulkCategoryModal } from '../modals/BulkCategoryModal';
import { BackupModal } from '../modals/BackupModal';
import { EntriesListHeader } from './EntriesListHeader';
import { EntriesListFooter } from './EntriesListFooter';
import { exportToJSON } from '../../utils/exportImport';
import { EmptyState } from '../ui/EmptyState';

/**
 * 📋 Список записей времени с поиском, фильтрацией и группировкой
 * - Поиск по описанию и категории
 * - Фильтры по датам (сегодня, месяц, год и т.д.)
 * - Группировка по датам
 * - Итоги за каждый день
 * - Кнопки добавления записи и запуска таймера
 * - Очистка базы данных
 */
export function EntriesList({ onAddNew, onStartTimer, onEditEntry, onUndo, onRedo, canUndo = false, canRedo = false, onExport, onImport }) {
  const { entries, clearEntries, bulkUpdateCategory, bulkDeleteEntries, getEntriesByIds } = useEntriesStore();
  const { categories, listView, setListView, defaultEntriesFilter, setDefaultEntriesFilter } = useSettingsStore();
  const { showSuccess, showError } = useUIStore();
  const timer = useTimer();
  const { confirmConfig, openConfirm } = useConfirmModal();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  
  // ✨ ОПТИМИЗАЦИЯ: Debounce для поиска (задержка 300мс)
  // Это уменьшает количество пересчетов при быстром вводе
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  // Состояние для массовых операций
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedEntries, setSelectedEntries] = useState(new Set());
  const [showBulkCategoryModal, setShowBulkCategoryModal] = useState(false);
  
  // Мапинг из внутренних значений в текстовые для фильтра
  const filterTextMapping = {
    'today': 'Сегодня',
    'halfMonth1': '1/2 месяца',
    'halfMonth2': '2/2 месяца',
    'month': 'Месяц',
    'year': 'Год',
    'all': 'Все записи',
    'custom': 'Выбор даты'
  };
  
  // Обратный мапинг из текста в внутренние значения
  const filterValueMapping = {
    'Сегодня': 'today',
    '1/2 месяца': 'halfMonth1',
    '2/2 месяца': 'halfMonth2',
    'Месяц': 'month',
    'Год': 'year',
    'Все записи': 'all',
    'Выбор даты': 'custom'
  };
  
  // Используем сохраненный фильтр по умолчанию для блока "Записи времени"
  const [dateFilter, setDateFilter] = useState(filterTextMapping[defaultEntriesFilter] || 'Месяц');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  
  // Фильтры по датам
  const filterOptions = [
    'Сегодня',
    '1/2 месяца',
    '2/2 месяца',
    'Месяц',
    'Год',
    'Все записи',
    'Выбор даты'
  ];
  
  // Функция для получения названия категории по ID
  const getCategoryName = (categoryId) => {
    if (typeof categoryId === 'string') return categoryId; // Уже строка
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Без категории';
  };
  
  // Функция фильтрации по дате
  const filterByDate = (entry) => {
    const entryDate = new Date(entry.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    switch (dateFilter) {
      case 'Сегодня':
        return entryDate.toDateString() === today.toDateString();
      
      case '1/2 месяца': {
        const monthStart = new Date(currentYear, currentMonth, 1);
        const monthMid = new Date(currentYear, currentMonth, 15);
        return entryDate >= monthStart && entryDate <= monthMid;
      }
      
      case '2/2 месяца': {
        const monthMid = new Date(currentYear, currentMonth, 16);
        const monthEnd = new Date(currentYear, currentMonth + 1, 0);
        return entryDate >= monthMid && entryDate <= monthEnd;
      }
      
      case 'Месяц':
        return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
      
      case 'Год':
        return entryDate.getFullYear() === currentYear;
      
      case 'Выбор даты':
        // Если не выбраны обе даты - не показываем записи (возвращаем false)
        // Это предотвращает загрузку всех записей при выборе фильтра
        if (!customDateRange.start || !customDateRange.end) return false;
        const startDate = new Date(customDateRange.start);
        const endDate = new Date(customDateRange.end);
        endDate.setHours(23, 59, 59);
        return entryDate >= startDate && entryDate <= endDate;
      
      case 'Все записи':
      default:
        return true;
    }
  };
  
  // ✨ ОПТИМИЗАЦИЯ: Мемоизация отфильтрованных записей
  // Используем debouncedSearchQuery для уменьшения пересчетов
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
    // Получаем название категории (поддержка как category, так и categoryId)
    const categoryName = getCategoryName(entry.category || entry.categoryId);
    
      // Фильтр по поиску (используем debounced значение!)
      const matchesSearch = !debouncedSearchQuery || 
        entry.description?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        categoryName.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
    
    // Фильтр по дате
    const matchesDate = filterByDate(entry);
    
    return matchesSearch && matchesDate;
  });
  }, [entries, debouncedSearchQuery, dateFilter, customDateRange, categories]);
  
  // Функции для массовых операций
  const toggleSelection = (entryId) => {
    setSelectedEntries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(entryId)) {
        newSet.delete(entryId);
      } else {
        newSet.add(entryId);
      }
      return newSet;
    });
  };

  const selectAllEntries = () => {
    const allEntryIds = filteredEntries.map(entry => entry.id);
    setSelectedEntries(new Set(allEntryIds));
  };

  const clearSelection = () => {
    setSelectedEntries(new Set());
    setSelectionMode(false);
  };

  const handleBulkCategory = () => {
    if (selectedEntries.size > 0) {
      setShowBulkCategoryModal(true);
    }
  };

  const handleBulkCategoryConfirm = (categoryId) => {
    const selectedIds = Array.from(selectedEntries);
    bulkUpdateCategory(selectedIds, categoryId);
    showSuccess(`Категория изменена для ${selectedIds.length} записей`);
    clearSelection();
  };

  const handleBulkExport = async () => {
    const selectedIds = Array.from(selectedEntries);
    const selectedEntriesData = getEntriesByIds(selectedIds);

    try {
      await exportToJSON(selectedEntriesData, categories, useSettingsStore.getState(), {
        filename: `selected_entries_${new Date().toISOString().split('T')[0]}.json`
      });
      showSuccess(`Экспортировано ${selectedIds.length} записей`);
      clearSelection();
    } catch (error) {
      showError('Ошибка экспорта: ' + error.message);
    }
  };

  const handleBulkDelete = () => {
    const selectedIds = Array.from(selectedEntries);
    openConfirm({
      title: 'Удалить записи?',
      message: `Удалить ${selectedIds.length} записей? Это действие нельзя отменить.`,
      onConfirm: () => {
        bulkDeleteEntries(selectedIds);
        showSuccess(`Удалено ${selectedIds.length} записей`);
        clearSelection();
      },
      confirmText: 'Удалить',
      cancelText: 'Отмена'
    });
  };

  return (
    <div className="glass-effect rounded-xl p-6">
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
        onOpenCategories={() => setIsCategoriesModalOpen(true)}
        onOpenBackups={() => setIsBackupModalOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchExpandedChange={setIsSearchExpanded}
      />
      
      {/* Модальное окно категорий */}
      <CategoriesModal
        isOpen={isCategoriesModalOpen}
        onClose={() => setIsCategoriesModalOpen(false)}
      />
      
      {/* Модальное окно массового изменения категории */}
      <BulkCategoryModal
        isOpen={showBulkCategoryModal}
        onClose={() => setShowBulkCategoryModal(false)}
        selectedCount={selectedEntries.size}
        onConfirm={handleBulkCategoryConfirm}
      />
      
      {/* Модальное окно управления бэкапами */}
      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
      />
      
      {/* Панель массовых действий */}
      {selectionMode && selectedEntries.size > 0 && (
        <BulkActionsPanel
          selectedCount={selectedEntries.size}
          onSelectAll={selectAllEntries}
          onDeselectAll={() => setSelectedEntries(new Set())}
          onBulkCategory={handleBulkCategory}
          onBulkExport={handleBulkExport}
          onBulkDelete={handleBulkDelete}
        />
      )}
      
      {/* ✨ ОТСТУП: Промежуточное расстояние между поиском и списком записей */}
      {/* Показываем отступ когда поле поиска открыто (даже если пустое) */}
      {isSearchExpanded && (
        <div className="mb-4 animate-fade-in">
          {searchQuery ? (
            <div className="text-sm text-gray-500 dark:text-gray-400 px-2">
              Найдено записей: <span className="font-semibold text-gray-700 dark:text-gray-300">{filteredEntries.length}</span>
            </div>
          ) : (
            <div className="text-sm text-gray-400 dark:text-gray-500 px-2">
              Введите текст для поиска...
            </div>
          )}
        </div>
      )}
      
      {/* Отображение записей в зависимости от выбранного вида */}
      <div className={`${filteredEntries.length > 10 ? 'max-h-[858px] overflow-y-auto pr-2 snap-y snap-mandatory' : ''}`}>
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
            icon={Clock}
            title="Нет записей времени"
            description="Начните отслеживать свое рабочее время, добавив первую запись или запустив таймер"
            action={{
              label: "Добавить запись",
              onClick: onAddNew
            }}
            variant="large"
            className="mb-6"
          />
        )}
        
        {/* Рендеринг в зависимости от выбранного вида с анимацией переключения */}
        {filteredEntries.length > 0 && (
          <div 
            key={`${listView}-${debouncedSearchQuery}`} 
            className="animate-search-results-fade-in"
          >
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
                selectedEntries={selectedEntries}
                onToggleSelection={toggleSelection}
              />
            )}
            
            {listView === 'grid' && (
              <GridView 
                entries={filteredEntries} 
                onEdit={onEditEntry}
                selectionMode={selectionMode}
                selectedEntries={selectedEntries}
                onToggleSelection={toggleSelection}
              />
            )}
            
            {listView === 'timeline' && (
              <TimelineView 
                entries={filteredEntries} 
                onEdit={onEditEntry}
                selectionMode={selectionMode}
                selectedEntries={selectedEntries}
                onToggleSelection={toggleSelection}
              />
            )}
          </div>
        )}
        
        {/* Информационное сообщение для больших списков */}
        {filteredEntries.length > 100 && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              💡 Показано {filteredEntries.length} записей. Для лучшей производительности используйте фильтры для уменьшения количества записей.
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
  );
}

