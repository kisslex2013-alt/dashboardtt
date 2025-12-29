import { useUIStore } from '../store/useUIStore'
import { useEntriesStore } from '../store/useEntriesStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { useHistoryStore } from '../store/useHistoryStore'
import type { TimeEntry, Category } from '../types'

interface ModalsState {
  [key: string]: boolean | { isOpen: boolean; data?: unknown }
}

interface UseAppSelectorsReturn {
  modals: ModalsState
  openModal: (name: string, data?: unknown) => void
  closeModal: (name: string) => void
  showSuccess: (message: string) => void
  showError: (message: string) => void
  entries: TimeEntry[]
  addEntry: (entry: Partial<TimeEntry>) => void
  updateEntry: (id: string, updates: Partial<TimeEntry>) => void
  deleteEntry: (id: string) => void
  importEntries: (entries: TimeEntry[]) => void
  restoreEntries: (entries: TimeEntry[]) => void
  categories: Category[]
  canUndo: boolean
  canRedo: boolean
  undo: () => void
  redo: () => void
}

/**
 * 🎯 Хук для оптимизированного доступа к состояниям всех stores
 */
export function useAppSelectors(): UseAppSelectorsReturn {
  const modals = useUIStore(state => state.modals) as ModalsState
  const openModal = useUIStore(state => state.openModal)
  const closeModal = useUIStore(state => state.closeModal)
  const showSuccess = useUIStore(state => state.showSuccess)
  const showError = useUIStore(state => state.showError)

  const entries = useEntriesStore(state => state.entries) as TimeEntry[]
  const addEntry = useEntriesStore(state => state.addEntry)
  const updateEntry = useEntriesStore(state => state.updateEntry)
  const deleteEntry = useEntriesStore(state => state.deleteEntry)
  const importEntries = useEntriesStore(state => state.importEntries)
  const restoreEntries = useEntriesStore(state => state.restoreEntries)

  const categories = useSettingsStore(state => state.categories) as Category[]

  const canUndo = useHistoryStore(state => state.canUndo)
  const canRedo = useHistoryStore(state => state.canRedo)
  const undo = useHistoryStore(state => state.undo)
  const redo = useHistoryStore(state => state.redo)

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
