import { useCallback } from 'react'
import { useIconEditorStore } from '../store/useIconEditorStore'

interface UseIconEditorReturn {
  isEditMode: boolean
  toggleEditMode: () => void
  setEditMode: (mode: boolean) => void
  replaceIcon: (componentId: string, iconName: string) => void
  removeReplacement: (componentId: string) => void
  resetAllReplacements: () => void
  getIconReplacement: (componentId: string) => string | null
}

/**
 * 🎓 Хук для управления режимом редактирования иконок.
 * Упрощает работу с store, предоставляя удобные методы.
 */
export function useIconEditor(): UseIconEditorReturn {
  const isEditMode = useIconEditorStore(state => state.isEditMode)
  const toggleEditMode = useIconEditorStore(state => state.toggleEditMode)
  const setEditMode = useIconEditorStore(state => state.setEditMode)
  const replaceIcon = useIconEditorStore(state => state.replaceIcon)
  const removeReplacement = useIconEditorStore(state => state.removeReplacement)
  const resetAllReplacements = useIconEditorStore(state => state.resetAllReplacements)
  const getIconReplacement = useIconEditorStore(state => state.getIconReplacement)

  const handleReplaceIcon = useCallback(
    (componentId: string, iconName: string): void => {
      if (!componentId) {
        console.warn('useIconEditor: componentId is required')
        return
      }
      replaceIcon(componentId, iconName)
    },
    [replaceIcon]
  )

  const handleRemoveReplacement = useCallback(
    (componentId: string): void => {
      if (!componentId) {
        console.warn('useIconEditor: componentId is required')
        return
      }
      removeReplacement(componentId)
    },
    [removeReplacement]
  )

  return {
    isEditMode,
    toggleEditMode,
    setEditMode,
    replaceIcon: handleReplaceIcon,
    removeReplacement: handleRemoveReplacement,
    resetAllReplacements,
    getIconReplacement,
  }
}
