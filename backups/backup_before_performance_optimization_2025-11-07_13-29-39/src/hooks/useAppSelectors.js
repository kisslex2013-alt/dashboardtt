import { useUIStore } from '../store/useUIStore';
import { useEntriesStore } from '../store/useEntriesStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useHistoryStore } from '../store/useHistoryStore';

/**
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 * 
 * Этот хук оптимизирует использование Zustand stores.
 * Вместо множества отдельных вызовов useStore, мы группируем все селекторы
 * в один хук, что уменьшает количество re-renders компонента.
 * 
 * Важно: Zustand автоматически мемоизирует селекторы, поэтому отдельные вызовы
 * не вызывают проблемы. Группировка нужна для удобства, а не для производительности.
 */

/**
 * Хук для оптимизированного доступа к состояниям всех stores
 * Группирует селекторы для удобства использования
 * @returns {Object} объект со всеми нужными данными и методами из stores
 */
export function useAppSelectors() {
  // Используем отдельные селекторы - Zustand автоматически оптимизирует подписки
  // Функции из store стабильны и не вызывают лишних re-renders
  const modals = useUIStore(state => state.modals);
  const openModal = useUIStore(state => state.openModal);
  const closeModal = useUIStore(state => state.closeModal);
  const showSuccess = useUIStore(state => state.showSuccess);
  const showError = useUIStore(state => state.showError);
  
  const entries = useEntriesStore(state => state.entries);
  const addEntry = useEntriesStore(state => state.addEntry);
  const updateEntry = useEntriesStore(state => state.updateEntry);
  const deleteEntry = useEntriesStore(state => state.deleteEntry);
  const importEntries = useEntriesStore(state => state.importEntries);
  const restoreEntries = useEntriesStore(state => state.restoreEntries);
  
  const categories = useSettingsStore(state => state.categories);
  
  const canUndo = useHistoryStore(state => state.canUndo);
  const canRedo = useHistoryStore(state => state.canRedo);
  const undo = useHistoryStore(state => state.undo);
  const redo = useHistoryStore(state => state.redo);
  
  // Возвращаем простой объект - Zustand уже оптимизировал каждую подписку
  return {
    modals,
    openModal,
    closeModal,
    showSuccess,
    showError,
    entries,
    addEntry,
    updateEntry,
    deleteEntry,
    importEntries,
    restoreEntries,
    categories,
    canUndo,
    canRedo,
    undo,
    redo,
  };
}

