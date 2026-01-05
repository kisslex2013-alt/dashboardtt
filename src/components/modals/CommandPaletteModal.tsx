import React, { useState, useEffect, useRef, useMemo } from 'react'
import { BaseModal } from '../ui/BaseModal'
import { useSetTheme, useTheme } from '../../store/useSettingsStore'
import { useUIStore } from '../../store/useUIStore'
import {
  Search,
  Command,
  Plus,
  Play,
  Settings,
  HelpCircle,
  Moon,
  Sun,
  Database,
  Download,
  Upload,
  Keyboard,
  Archive,
  Folder
} from '../../utils/icons'
import { useAppHandlers } from '../../hooks/useAppHandlers'
import { StaggeredItem } from '../ui/StaggeredList'
import { APP_VERSION_FULL } from '../../config/appVersion'

export function CommandPaletteModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const isThemeDark = useTheme() === 'dark'
  
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  
  const handlers = useAppHandlers()
  const setTheme = useSetTheme()

  // Сброс при открытии
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Список команд
  const commands = useMemo(() => [
    {
      id: 'new-entry',
      label: 'Создать запись',
      icon: Plus,
      shortcut: 'Ctrl+N',
      action: handlers.handleShowEditEntry,
      keywords: ['new', 'create', 'add', 'entry', 'новая', 'создать', 'добавить']
    },
    {
      id: 'toggle-timer',
      label: 'Старт / Стоп таймера',
      icon: Play,
      shortcut: 'Ctrl+T',
      action: handlers.handleTimerToggle,
      keywords: ['timer', 'start', 'stop', 'pause', 'таймер', 'старт', 'стоп', 'пауза']
    },
    {
      id: 'search',
      label: 'Поиск глобальный',
      icon: Search,
      shortcut: 'Ctrl+F',
      action: () => {
        onClose()
        window.dispatchEvent(new CustomEvent('global-search-focus'))
      },
      keywords: ['search', 'find', 'поиск', 'найти']
    },
    {
      id: 'settings',
      label: 'Настройки',
      icon: Settings,
      shortcut: 'Ctrl+,',
      action: handlers.handleShowSoundSettings,
      keywords: ['settings', 'config', 'настройки', 'конфигурация']
    },
    {
        id: 'theme',
        label: isThemeDark ? 'Светлая тема' : 'Темная тема',
        icon: isThemeDark ? Sun : Moon,
        shortcut: 'Ctrl+D',
        action: () => setTheme(isThemeDark ? 'light' : 'dark'),
        keywords: ['theme', 'dark', 'light', 'mode', 'тема', 'темная', 'светлая']
    },
    {
      id: 'export',
      label: 'Экспорт данных',
      icon: Download,
      action: handlers.handleExport,
      keywords: ['export', 'save', 'backup', 'экспорт', 'сохранить', 'бэкап']
    },
    {
      id: 'import',
      label: 'Импорт данных',
      icon: Upload,
      action: handlers.handleShowImport,
      keywords: ['import', 'load', 'restore', 'импорт', 'загрузить', 'восстановить']
    },
    {
      id: 'categories',
      label: 'Категории',
      icon: Folder,
      action: handlers.handleOpenCategories,
      keywords: ['categories', 'tags', 'категории', 'теги']
    },
    {
      id: 'backups',
      label: 'Бэкапы',
      icon: Archive,
      action: handlers.handleOpenBackups,
      keywords: ['backups', 'snapshots', 'бэкапы', 'копии']
    },
    {
      id: 'help',
      label: 'Справка / Туториал',
      icon: HelpCircle,
      shortcut: 'Ctrl+/',
      action: handlers.handleShowTutorial,
      keywords: ['help', 'tutorial', 'faq', 'справка', 'помощь', 'инструкция']
    }
  ], [handlers, isThemeDark, setTheme, onClose])


  // Filtering
  const filteredCommands = useMemo(() => {
    if (!query) return commands
    const lowerQuery = query.toLowerCase()
    return commands.filter(cmd => 
      cmd.label.toLowerCase().includes(lowerQuery) || 
      cmd.keywords?.some(k => k.toLowerCase().includes(lowerQuery))
    )
  }, [query, commands])

  // Reset selected index on filter change
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % filteredCommands.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (filteredCommands[selectedIndex]) {
          handleSelect(filteredCommands[selectedIndex])
        }
      }
    }

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, filteredCommands, selectedIndex])

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
        const activeItem = listRef.current.children[selectedIndex] as HTMLElement
        if (activeItem) {
            activeItem.scrollIntoView({ block: 'nearest' })
        }
    }
  }, [selectedIndex])

  // Action Handler
  const handleSelect = (command) => {
    command.action()
    onClose()
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      // title undefined to hide header if showCloseButton is also false?
      // BaseModal logic: if (title || showCloseButton)
      // So undefined title + false showCloseButton = no header.
      title="" 
      showCloseButton={false} // No X button
      size="medium"
      className="!p-0 overflow-hidden" // Remove padding, handle overflow
    >
      <div className="flex flex-col h-[50vh] max-h-[500px]">
        {/* Search Input */}
        <div className="flex items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <Search className="w-5 h-5 text-gray-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-lg text-gray-900 dark:text-white placeholder-gray-400"
            placeholder="Введите команду..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="text-xs text-gray-400 border border-gray-200 dark:border-gray-700 px-1.5 py-0.5 rounded">
            Esc
          </div>
        </div>

        {/* Commands List */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-2 custom-scrollbar">
          {filteredCommands.length > 0 ? (
            filteredCommands.map((command, index) => (
              <StaggeredItem key={command.id} index={index} staggerDelay={30}>
                <button
                  onClick={() => handleSelect(command)}
                  className={`w-full flex items-center justify-between px-3 py-3 rounded-lg transition-colors group ${
                    index === selectedIndex
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-md ${
                      index === selectedIndex
                        ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 group-hover:bg-gray-200 dark:group-hover:bg-gray-700'
                    }`}>
                      <command.icon className="w-5 h-5" />
                    </div>
                    <span className="font-medium">{command.label}</span>
                  </div>
                  
                  {command.shortcut && (
                    <div className="flex gap-1">
                       {command.shortcut.split('+').map(key => (
                           <span key={key} className="text-xs bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-1.5 py-0.5 rounded text-gray-500 dark:text-gray-400 min-w-[20px] text-center">
                               {key}
                           </span>
                       ))}
                    </div>
                  )}
                </button>
              </StaggeredItem>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 py-8">
              <Command className="w-8 h-8 mb-2 opacity-50" />
              <p>Команды не найдены</p>
            </div>
          )}
        </div>
        
        {/* Footer Hint */}
        <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-between text-xs text-gray-500 dark:text-gray-400">
             <div className="flex gap-3">
                 <span className="flex items-center gap-1"><Keyboard className="w-3 h-3"/> <span>Навигация</span></span>
                 <span className="flex items-center gap-1">↵ <span>Выбор</span></span>
             </div>
             <div>
                 Time Tracker {APP_VERSION_FULL}
             </div>
        </div>
      </div>
    </BaseModal>
  )
}
