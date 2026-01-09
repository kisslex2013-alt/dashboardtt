/**
 * Типы для useUIStore
 * Вынесены в отдельный файл для чистоты кода
 */

// ===== Notification Types =====
export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export interface NotificationAction {
  label: string
  onClick: () => void
}

export interface Notification {
  id: number
  message: string
  type: NotificationType
  duration: number
  action: NotificationAction | null
  timestamp: number
}

export interface NotificationInput {
  message: string
  type?: NotificationType
  duration?: number
  action?: NotificationAction | null
}

/** Контекст для проверки условий показа уведомления */
export interface NotificationContext {
  duration?: number
  value?: number
  isWorkDay?: boolean
  isActiveWork?: boolean
}


// ===== Modal Types =====
export interface EditEntryModal {
  isOpen: boolean
  entry: unknown | null
}

export interface ConfirmModal {
  isOpen: boolean
  title: string
  message: string
  onConfirm: (() => void) | null
}

export interface BatchEditModal {
  isOpen: boolean
  selectedEntries: string[]
}

export interface SettingsModal {
  isOpen: boolean
  activeTab: string
}

export interface SoundSettingsModal {
  isOpen: boolean
  activeTab: string | null
}

export interface SimpleModal {
  isOpen: boolean
}

export interface ModalsState {
  editEntry: EditEntryModal
  import: SimpleModal
  tutorial: SimpleModal
  about: SimpleModal
  workSchedule: SimpleModal
  categoryManager: SimpleModal
  confirmModal: ConfirmModal
  batchEdit: BatchEditModal
  backup: SimpleModal
  settings: SettingsModal
  notificationsDisplay: SimpleModal
  floatingPanelSettings: SimpleModal
  paymentDatesSettings: SimpleModal
  soundSettings: SoundSettingsModal
  commandPalette: SimpleModal
  auth: SimpleModal
  aiNotifications: SimpleModal
}

// ===== Loading/Errors Types =====
export interface LoadingState {
  entries: boolean
  statistics: boolean
  export: boolean
  import: boolean
  [key: string]: boolean
}

export interface ErrorsState {
  entries: string | null
  statistics: string | null
  export: string | null
  import: string | null
  [key: string]: string | null
}

// ===== Filters/Sorting Types =====
export interface DateRange {
  start: Date | null
  end: Date | null
}

export interface FiltersState {
  searchQuery: string
  dateRange: DateRange
  activeFilter: string // 'Сегодня', 'Месяц' и т.д.
  customDateRange: { start: string; end: string }
  categories: string[]
  showManualOnly: boolean
  showTimerOnly: boolean
}

export type SortField = 'date' | 'category' | 'duration' | 'earned'
export type SortDirection = 'asc' | 'desc'

export interface SortingState {
  field: SortField
  direction: SortDirection
}

// ===== Main UIState Interface =====
export interface UIState {
  // State
  notifications: Notification[]
  modals: ModalsState
  loading: LoadingState
  errors: ErrorsState
  filters: FiltersState
  sorting: SortingState
  selectedEntries: string[]

  // Notification Actions
  addNotification: (notification: NotificationInput) => number
  removeNotification: (id: number) => void
  clearNotifications: () => void

  // Modal Actions
  openModal: (modalName: keyof ModalsState, data?: Record<string, unknown> | null) => void
  closeModal: (modalName: keyof ModalsState) => void
  closeAllModals: () => void

  // Loading/Error Actions
  setLoading: (key: string, isLoading: boolean) => void
  setError: (key: string, error: string | null) => void
  clearErrors: () => void

  // Filter Actions
  updateFilters: (newFilters: Partial<FiltersState>) => void
  resetFilters: () => void

  // Sorting Actions
  setSorting: (field: SortField, direction?: SortDirection) => void
  toggleSorting: (field: SortField) => void

  // Selection Actions
  selectEntry: (entryId: string) => void
  deselectEntry: (entryId: string) => void
  toggleEntrySelection: (entryId: string) => void
  selectAllEntries: (allEntryIds: string[]) => void
  clearSelection: () => void
  isEntrySelected: (entryId: string) => boolean
  getSelectedCount: () => number

  // Confirm Modal Actions
  showConfirmModal: (title: string, message: string, onConfirm: () => void) => void
  hideConfirmModal: () => void

  // Toast Actions
  showSuccess: (message: string, duration?: number, context?: NotificationContext) => number | null
  showError: (message: string, duration?: number, context?: NotificationContext) => number | null
  showWarning: (message: string, duration?: number, context?: NotificationContext) => number | null
  showInfo: (message: string, duration?: number, context?: NotificationContext) => number | null
}
