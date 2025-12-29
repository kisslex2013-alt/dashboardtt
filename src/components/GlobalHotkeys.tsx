/**
 * 🎹 Global Keyboard Shortcuts Manager
 * Handles application-wide hotkeys like theme toggling, search, etc.
 */

import { useHotkeys } from '../hooks/useHotkeys'
import { useTheme, useSetTheme } from '../store/useSettingsStore'
import { useOpenModal, useCloseAllModals } from '../store/useUIStore'

export function GlobalHotkeys() {
  const theme = useTheme()
  const setTheme = useSetTheme()
  const openModal = useOpenModal()
  const closeAllModals = useCloseAllModals() // Initializes the hook

  const handleToggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  useHotkeys({
    // 🌓 Theme: Ctrl/Cmd + D (or Cmd+Shift+L)
    'ctrl+d': (e) => {
      e.preventDefault()
      handleToggleTheme()
    },

    // ➕ New Entry: Ctrl/Cmd + K or N (if not typing)
    'ctrl+k': (e) => {
       e.preventDefault()
       openModal('editEntry')
    },
    'n': (e) => {
       // useHotkeys automatically ignores if typing in input
       e.preventDefault()
       openModal('editEntry')
    },

    // 🔍 Search: Ctrl/Cmd + F
    'ctrl+f': (e) => {
      e.preventDefault()
      // Dispatch a custom event that the search component can listen to
      // or focus specific ID if known.
      const searchInput = document.getElementById('global-search-input')
      if (searchInput) {
        searchInput.focus()
      } else {
         console.log('Search input not found')
      }
    },

    // ⚙️ Settings: S
    's': (e) => {
       e.preventDefault()
       openModal('settings')
    },

    // ❓ Help: Shift + ?
    'shift+slash': (e) => {
      e.preventDefault()
      openModal('tutorial')
    },

    // ❌ Close Modals: Escape
    'Escape': (e) => {
      e.preventDefault()
       // We can iterate or close specific active ones, or close all.
       // Since useUIStore has closeAllModals, let's use that.
       // However, we need to import it.
       // But wait, the hook usage above: const openModal = useOpenModal()
       // We need useCloseAllModals()
       closeAllModals()
    }
  })

  return null
}
