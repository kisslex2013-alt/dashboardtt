import { useHotkeys } from '../hooks/useHotkeys'
import { useTheme, useSetTheme } from '../store/useSettingsStore'
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
  const openModal = useOpenModal()
  const closeAllModals = useCloseAllModals()

  const handleToggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  useHotkeys({
    // 🌓 Theme: Ctrl/Cmd + D
    'ctrl+d': (e) => {
      e.preventDefault()
      handleToggleTheme()
    },

    // ➕ New Entry: Ctrl/Cmd + N
    'ctrl+n': (e) => {
       e.preventDefault()
       onNewEntry()
    },

    // ⏱️ Timer: Ctrl/Cmd + T
    'ctrl+t': (e) => {
      e.preventDefault()
      onToggleTimer()
    },

    // ⚙️ Settings: Ctrl/Cmd + , (Comma)
    'ctrl+comma': (e) => {
       e.preventDefault()
       onSettings()
    },

    // ❓ Shortcuts/Help: Ctrl/Cmd + / (Slash)
    'ctrl+slash': (e) => {
      e.preventDefault()
      onHelp()
    },

    // 🔍 Search: Ctrl/Cmd + F
    'ctrl+f': (e) => {
      e.preventDefault()
      window.dispatchEvent(new CustomEvent('global-search-focus'))
    },

    // 🎨 Command Palette: Ctrl/Cmd + K
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
