import { create } from 'zustand'
import { shouldShowNotification } from '../utils/notificationHelpers'
import { useSettingsStore } from './useSettingsStore'

/**
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 *
 * Это хранилище управляет состоянием пользовательского интерфейса:
 * - Уведомления (toast сообщения)
 * - Модальные окна (открыты/закрыты)
 * - Состояние загрузки
 * - Ошибки и предупреждения
 *
 * НЕ сохраняется в localStorage, так как это временное состояние UI.
 */

export const useUIStore = create((set, get) => ({
  // Массив активных уведомлений
  notifications: [],

  // Состояние модальных окон
  modals: {
    editEntry: { isOpen: false, entry: null },
    import: { isOpen: false },
    tutorial: { isOpen: false },
    about: { isOpen: false },
    workSchedule: { isOpen: false },
    categoryManager: { isOpen: false },
    confirmModal: { isOpen: false, title: '', message: '', onConfirm: null },
    batchEdit: { isOpen: false, selectedEntries: [] },
    backup: { isOpen: false },
    settings: { isOpen: false, activeTab: 'general' },
    notificationsDisplay: { isOpen: false },
    floatingPanelSettings: { isOpen: false },
    paymentDatesSettings: { isOpen: false },
    soundSettings: { isOpen: false, activeTab: null },
  },

  // Состояние загрузки
  loading: {
    entries: false,
    statistics: false,
    export: false,
    import: false,
  },

  // Состояние ошибок
  errors: {
    entries: null,
    statistics: null,
    export: null,
    import: null,
  },

  // Состояние поиска и фильтров
  filters: {
    searchQuery: '',
    dateRange: { start: null, end: null },
    categories: [],
    showManualOnly: false,
    showTimerOnly: false,
  },

  // Состояние сортировки
  sorting: {
    field: 'date', // date, category, duration, earned
    direction: 'desc', // asc, desc
  },

  // Состояние выбранных записей для batch операций
  selectedEntries: [],

  /**
   * Добавляет новое уведомление
   * @param {Object} notification - объект уведомления
   * @param {string} notification.message - текст сообщения
   * @param {string} notification.type - тип: 'success', 'error', 'warning', 'info'
   * @param {number} notification.duration - длительность показа в мс (0 = бесконечно)
   * @param {Object} notification.action - опциональное действие
   */
  addNotification: notification => {
    const id = Date.now() + Math.random()
    const newNotification = {
      id,
      message: notification.message,
      type: notification.type || 'info',
      duration: notification.duration || 3000,
      action: notification.action || null,
      timestamp: Date.now(),
    }

    set(state => ({
      notifications: [...state.notifications, newNotification],
    }))

    // ✨ ИСПРАВЛЕНИЕ: Убрали setTimeout отсюда
    // Теперь компонент Notification.jsx полностью управляет закрытием
    // Это позволяет паузе на hover работать корректно

    return id
  },

  /**
   * Удаляет уведомление по ID
   * @param {number} id - ID уведомления
   */
  removeNotification: id =>
    set(state => ({
      notifications: state.notifications.filter(n => n.id !== id),
    })),

  /**
   * Очищает все уведомления
   */
  clearNotifications: () => set({ notifications: [] }),

  /**
   * Открывает модальное окно
   * @param {string} modalName - название модального окна
   * @param {Object} data - дополнительные данные
   */
  openModal: (modalName, data = null) =>
    set(state => ({
      modals: {
        ...state.modals,
        [modalName]: { isOpen: true, ...data },
      },
    })),

  /**
   * Закрывает модальное окно
   * @param {string} modalName - название модального окна
   */
  closeModal: modalName =>
    set(state => {
      // Получаем текущее состояние модального окна
      const currentModal = state.modals[modalName]

      // Определяем начальное состояние для каждого типа модального окна
      const initialStates = {
        editEntry: { isOpen: false, entry: null },
        import: { isOpen: false },
        tutorial: { isOpen: false },
        about: { isOpen: false },
        workSchedule: { isOpen: false },
        categoryManager: { isOpen: false },
        confirmModal: { isOpen: false, title: '', message: '', onConfirm: null },
        batchEdit: { isOpen: false, selectedEntries: [] },
    backup: { isOpen: false },
    soundSettings: { isOpen: false, activeTab: null },
    floatingPanelSettings: { isOpen: false },
        paymentDatesSettings: { isOpen: false },
        notificationsDisplay: { isOpen: false },
      }

      // Возвращаем модальное окно к начальному состоянию
      const initialState = initialStates[modalName] || { isOpen: false }
      return {
        modals: {
          ...state.modals,
          [modalName]: initialState,
        },
      }
    }),

  /**
   * Закрывает все модальные окна
   */
  closeAllModals: () =>
    set(state => {
      const closedModals = {}
      Object.keys(state.modals).forEach(key => {
        closedModals[key] = { isOpen: false }
      })
      return { modals: closedModals }
    }),

  /**
   * Устанавливает состояние загрузки
   * @param {string} key - ключ загрузки
   * @param {boolean} isLoading - состояние загрузки
   */
  setLoading: (key, isLoading) =>
    set(state => ({
      loading: {
        ...state.loading,
        [key]: isLoading,
      },
    })),

  /**
   * Устанавливает ошибку
   * @param {string} key - ключ ошибки
   * @param {string|null} error - текст ошибки или null для очистки
   */
  setError: (key, error) =>
    set(state => ({
      errors: {
        ...state.errors,
        [key]: error,
      },
    })),

  /**
   * Очищает все ошибки
   */
  clearErrors: () =>
    set({
      errors: {
        entries: null,
        statistics: null,
        export: null,
        import: null,
      },
    }),

  /**
   * Обновляет фильтры
   * @param {Object} newFilters - новые фильтры
   */
  updateFilters: newFilters =>
    set(state => ({
      filters: {
        ...state.filters,
        ...newFilters,
      },
    })),

  /**
   * Сбрасывает фильтры к дефолтным
   */
  resetFilters: () =>
    set({
      filters: {
        searchQuery: '',
        dateRange: { start: null, end: null },
        categories: [],
        showManualOnly: false,
        showTimerOnly: false,
      },
    }),

  /**
   * Устанавливает сортировку
   * @param {string} field - поле для сортировки
   * @param {string} direction - направление: 'asc' или 'desc'
   */
  setSorting: (field, direction = 'desc') =>
    set({
      sorting: { field, direction },
    }),

  /**
   * Переключает направление сортировки для поля
   * @param {string} field - поле для сортировки
   */
  toggleSorting: field => {
    const { sorting } = get()
    const newDirection = sorting.field === field && sorting.direction === 'desc' ? 'asc' : 'desc'
    set({ sorting: { field, direction: newDirection } })
  },

  /**
   * Добавляет запись к выбранным
   * @param {string} entryId - ID записи
   */
  selectEntry: entryId =>
    set(state => ({
      selectedEntries: [...state.selectedEntries, entryId],
    })),

  /**
   * Убирает запись из выбранных
   * @param {string} entryId - ID записи
   */
  deselectEntry: entryId =>
    set(state => ({
      selectedEntries: state.selectedEntries.filter(id => id !== entryId),
    })),

  /**
   * Переключает выбор записи
   * @param {string} entryId - ID записи
   */
  toggleEntrySelection: entryId => {
    const { selectedEntries } = get()
    if (selectedEntries.includes(entryId)) {
      get().deselectEntry(entryId)
    } else {
      get().selectEntry(entryId)
    }
  },

  /**
   * Выбирает все записи
   * @param {Array} allEntryIds - массив всех ID записей
   */
  selectAllEntries: allEntryIds =>
    set({
      selectedEntries: [...allEntryIds],
    }),

  /**
   * Очищает выбор записей
   */
  clearSelection: () =>
    set({
      selectedEntries: [],
    }),

  /**
   * Проверяет, выбрана ли запись
   * @param {string} entryId - ID записи
   * @returns {boolean} true если запись выбрана
   */
  isEntrySelected: entryId => {
    return get().selectedEntries.includes(entryId)
  },

  /**
   * Получает количество выбранных записей
   * @returns {number} количество выбранных записей
   */
  getSelectedCount: () => {
    return get().selectedEntries.length
  },

  /**
   * Показывает модальное окно подтверждения
   * @param {string} title - заголовок
   * @param {string} message - сообщение
   * @param {Function} onConfirm - функция подтверждения
   */
  showConfirmModal: (title, message, onConfirm) => {
    get().openModal('confirmModal', {
      title,
      message,
      onConfirm,
    })
  },

  /**
   * Скрывает модальное окно подтверждения
   */
  hideConfirmModal: () => {
    get().closeModal('confirmModal')
  },

  /**
   * Показывает уведомление об успехе
   * @param {string} message - сообщение
   * @param {number} duration - длительность показа
   */
  showSuccess: (message, duration = 3000, context) => {
    const displaySettings = useSettingsStore.getState().notifications.display
    if (!shouldShowNotification(message, 'success', displaySettings, context)) {
      return null
    }
    return get().addNotification({
      message,
      type: 'success',
      duration,
    })
  },

  /**
   * Показывает уведомление об ошибке
   * @param {string} message - сообщение
   * @param {number} duration - длительность показа
   */
  showError: (message, duration = 5000, context) => {
    const displaySettings = useSettingsStore.getState().notifications.display
    if (!shouldShowNotification(message, 'error', displaySettings, context)) {
      return null
    }
    return get().addNotification({
      message,
      type: 'error',
      duration,
    })
  },

  /**
   * Показывает предупреждение
   * @param {string} message - сообщение
   * @param {number} duration - длительность показа
   */
  showWarning: (message, duration = 4000, context) => {
    const displaySettings = useSettingsStore.getState().notifications.display
    if (!shouldShowNotification(message, 'warning', displaySettings, context)) {
      return null
    }
    return get().addNotification({
      message,
      type: 'warning',
      duration,
    })
  },

  /**
   * Показывает информационное уведомление
   * @param {string} message - сообщение
   * @param {number} duration - длительность показа
   */
  showInfo: (message, duration = 3000, context) => {
    const displaySettings = useSettingsStore.getState().notifications.display
    if (!shouldShowNotification(message, 'info', displaySettings, context)) {
      return null
    }
    return get().addNotification({
      message,
      type: 'info',
      duration,
    })
  },
}))

// ===== Атомарные селекторы (рекомендуемое использование) =====
// ✅ КРИТИЧНО: Используй эти селекторы вместо прямого доступа к store
// Это предотвращает лишние ре-рендеры при изменении неиспользуемых полей

// State селекторы
export const useNotifications = () => useUIStore(state => state.notifications)
export const useModals = () => useUIStore(state => state.modals)
export const useLoading = () => useUIStore(state => state.loading)
export const useErrors = () => useUIStore(state => state.errors)
export const useFilters = () => useUIStore(state => state.filters)
export const useSorting = () => useUIStore(state => state.sorting)
export const useSelectedEntries = () => useUIStore(state => state.selectedEntries)

// Actions селекторы
export const useAddNotification = () => useUIStore(state => state.addNotification)
export const useRemoveNotification = () => useUIStore(state => state.removeNotification)
export const useClearNotifications = () => useUIStore(state => state.clearNotifications)
export const useOpenModal = () => useUIStore(state => state.openModal)
export const useCloseModal = () => useUIStore(state => state.closeModal)
export const useCloseAllModals = () => useUIStore(state => state.closeAllModals)
export const useSetLoading = () => useUIStore(state => state.setLoading)
export const useSetError = () => useUIStore(state => state.setError)
export const useClearErrors = () => useUIStore(state => state.clearErrors)
export const useUpdateFilters = () => useUIStore(state => state.updateFilters)
export const useResetFilters = () => useUIStore(state => state.resetFilters)
export const useSetSorting = () => useUIStore(state => state.setSorting)
export const useToggleSorting = () => useUIStore(state => state.toggleSorting)
export const useSelectEntry = () => useUIStore(state => state.selectEntry)
export const useDeselectEntry = () => useUIStore(state => state.deselectEntry)
export const useToggleEntrySelection = () => useUIStore(state => state.toggleEntrySelection)
export const useSelectAllEntries = () => useUIStore(state => state.selectAllEntries)
export const useClearSelection = () => useUIStore(state => state.clearSelection)

// ⚠️ ВАЖНО: Эти методы НЕ должны быть хуками, так как они возвращают функции
// Используй их напрямую через useUIStore.getState()
// Пример: useUIStore.getState().isEntrySelected(id)
// export const useIsEntrySelected = () => useUIStore(state => state.isEntrySelected)
// export const useGetSelectedCount = () => useUIStore(state => state.getSelectedCount)

export const useShowConfirmModal = () => useUIStore(state => state.showConfirmModal)
export const useHideConfirmModal = () => useUIStore(state => state.hideConfirmModal)
export const useShowSuccess = () => useUIStore(state => state.showSuccess)
export const useShowError = () => useUIStore(state => state.showError)
export const useShowWarning = () => useUIStore(state => state.showWarning)
export const useShowInfo = () => useUIStore(state => state.showInfo)
