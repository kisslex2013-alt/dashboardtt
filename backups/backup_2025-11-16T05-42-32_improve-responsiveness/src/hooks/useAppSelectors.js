import { useUIStore } from '../store/useUIStore'
import { useEntriesStore } from '../store/useEntriesStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { useHistoryStore } from '../store/useHistoryStore'

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
 * 🎯 Хук для оптимизированного доступа к состояниям всех stores
 *
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 *
 * Этот хук группирует все необходимые данные и методы из разных Zustand stores
 * в один объект. Это упрощает использование и делает код более читаемым.
 *
 * Zustand автоматически оптимизирует подписки, поэтому каждый селектор
 * обновляется только при изменении соответствующей части состояния.
 *
 * @returns {Object} объект со всеми нужными данными и методами из stores:
 * @returns {Object} returns.modals - состояние модальных окон
 * @returns {Function} returns.openModal - функция открытия модального окна
 * @returns {Function} returns.closeModal - функция закрытия модального окна
 * @returns {Function} returns.showSuccess - функция показа уведомления об успехе
 * @returns {Function} returns.showError - функция показа уведомления об ошибке
 * @returns {Array} returns.entries - массив записей времени
 * @returns {Function} returns.addEntry - функция добавления записи
 * @returns {Function} returns.updateEntry - функция обновления записи
 * @returns {Function} returns.deleteEntry - функция удаления записи
 * @returns {Function} returns.importEntries - функция импорта записей
 * @returns {Function} returns.restoreEntries - функция восстановления записей
 * @returns {Array} returns.categories - массив категорий
 * @returns {boolean} returns.canUndo - можно ли отменить действие
 * @returns {boolean} returns.canRedo - можно ли повторить действие
 * @returns {Function} returns.undo - функция отмены действия
 * @returns {Function} returns.redo - функция повтора действия
 *
 * @example
 * function MyComponent() {
 *   const { entries, addEntry, showSuccess } = useAppSelectors();
 *
 *   const handleAdd = () => {
 *     addEntry(newEntry);
 *     showSuccess('Запись добавлена');
 *   };
 * }
 */
export function useAppSelectors() {
  // Используем отдельные селекторы - Zustand автоматически оптимизирует подписки
  // Функции из store стабильны и не вызывают лишних re-renders
  const modals = useUIStore(state => state.modals)
  const openModal = useUIStore(state => state.openModal)
  const closeModal = useUIStore(state => state.closeModal)
  const showSuccess = useUIStore(state => state.showSuccess)
  const showError = useUIStore(state => state.showError)

  const entries = useEntriesStore(state => state.entries)
  const addEntry = useEntriesStore(state => state.addEntry)
  const updateEntry = useEntriesStore(state => state.updateEntry)
  const deleteEntry = useEntriesStore(state => state.deleteEntry)
  const importEntries = useEntriesStore(state => state.importEntries)
  const restoreEntries = useEntriesStore(state => state.restoreEntries)

  const categories = useSettingsStore(state => state.categories)

  const canUndo = useHistoryStore(state => state.canUndo)
  const canRedo = useHistoryStore(state => state.canRedo)
  const undo = useHistoryStore(state => state.undo)
  const redo = useHistoryStore(state => state.redo)

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
  }
}
