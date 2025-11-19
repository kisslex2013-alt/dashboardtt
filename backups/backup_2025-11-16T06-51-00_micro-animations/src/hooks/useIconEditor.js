import { useCallback } from 'react'
import { useIconEditorStore } from '../store/useIconEditorStore'

/**
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 *
 * Хук для управления режимом редактирования иконок.
 * Упрощает работу с store, предоставляя удобные методы.
 *
 * Использование:
 * const { isEditMode, toggleEditMode, replaceIcon } = useIconEditor();
 */

export function useIconEditor() {
  const isEditMode = useIconEditorStore(state => state.isEditMode)
  const toggleEditMode = useIconEditorStore(state => state.toggleEditMode)
  const setEditMode = useIconEditorStore(state => state.setEditMode)
  const replaceIcon = useIconEditorStore(state => state.replaceIcon)
  const removeReplacement = useIconEditorStore(state => state.removeReplacement)
  const resetAllReplacements = useIconEditorStore(state => state.resetAllReplacements)
  const getIconReplacement = useIconEditorStore(state => state.getIconReplacement)

  /**
   * Заменяет иконку для компонента (обертка с проверкой)
   * @param {string} componentId - уникальный ID компонента
   * @param {string} iconName - имя иконки
   */
  const handleReplaceIcon = useCallback(
    (componentId, iconName) => {
      if (!componentId) {
        console.warn('useIconEditor: componentId is required')
        return
      }
      replaceIcon(componentId, iconName)
    },
    [replaceIcon]
  )

  /**
   * Удаляет замену иконки (обертка с проверкой)
   * @param {string} componentId - уникальный ID компонента
   */
  const handleRemoveReplacement = useCallback(
    componentId => {
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
