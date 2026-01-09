import { useHotkeys } from '../hooks/useHotkeys'
import { useTheme, useSetTheme, useToggleViewMode } from '../store/useSettingsStore'
import { useOpenModal, useCloseAllModals } from '../store/useUIStore'

interface GlobalHotkeysProps {
  onToggleTimer: () => void
  onNewEntry: () => void
  onSettings: () => void
  onHelp: () => void
}

export function GlobalHotkeys({ 
  onToggleTimer, 
  onNewEntry, 
  onSettings, 
  onHelp 
}: GlobalHotkeysProps) {
  const theme = useTheme()
  const setTheme = useSetTheme()
  const toggleViewMode = useToggleViewMode()
  const openModal = useOpenModal()
  const closeAllModals = useCloseAllModals()

  const handleToggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  useHotkeys({
    // 🌓 Theme: Ctrl+Shift+D (избегаем Ctrl+D — закладки браузера)
    'ctrl+shift+d': (e) => {
      e.preventDefault()
      handleToggleTheme()
    },

    // 🎯 View Mode: Ctrl+Shift+F — переключение Focus/Analytics
    'ctrl+shift+f': (e) => {
      e.preventDefault()
      toggleViewMode()
    },

    // ➕ New Entry: Ctrl+Shift+N или N (Vim-стиль)
    'ctrl+shift+n': (e) => {
       e.preventDefault()
       onNewEntry()
    },
    'n': (e) => {
       e.preventDefault()
       onNewEntry()
    },

    // ⏱️ Timer: Ctrl+Shift+T или T (Vim-стиль)
    'ctrl+shift+t': (e) => {
      e.preventDefault()
      onToggleTimer()
    },
    't': (e) => {
      e.preventDefault()
      onToggleTimer()
    },

    // ⚙️ Settings: Ctrl/Cmd + , (Comma) — работает
    'ctrl+comma': (e) => {
       e.preventDefault()
       onSettings()
    },

    // ❓ Shortcuts/Help: Ctrl/Cmd + / (Slash) — работает
    'ctrl+slash': (e) => {
      e.preventDefault()
      onHelp()
    },

    // 📚 Help: F1 — Справка
    'f1': (e) => {
      e.preventDefault()
      onHelp()
    },

    // 🔍 Search: / (слэш без модификаторов, как в GitHub/YouTube)
    'slash': (e) => {
      e.preventDefault()
      window.dispatchEvent(new CustomEvent('global-search-focus'))
    },

    // 🎨 Command Palette: Ctrl/Cmd + K — работает
    'ctrl+k': (e) => {
       e.preventDefault()
       openModal('commandPalette')
    },

    // ❌ Close Modals: Escape
    'escape': (e) => {
      // closeAllModals handles logic to close active modals
      closeAllModals()
    }
  })

  return null
}

