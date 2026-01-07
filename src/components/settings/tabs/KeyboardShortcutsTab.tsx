/**
 * ⌨️ Вкладка "Горячие клавиши" для модального окна настроек
 * Отображает все доступные сочетания клавиш в приложении
 */

import { memo, useMemo } from 'react'
import { Keyboard, Command, Timer, Palette, Folder, Lightbulb } from '../../../utils/icons'

interface ShortcutItemProps {
  keys: string[]
  description: string
  category?: 'navigation' | 'timer' | 'data' | 'ui'
}

const ShortcutItem = memo(function ShortcutItem({ keys, description }: ShortcutItemProps) {
  const isMac = navigator.platform.toLowerCase().includes('mac')
  
  const displayKeys = keys.map(key => {
    // Заменяем Ctrl на ⌘ для Mac
    if (key === 'Ctrl') {
      return isMac ? '⌘' : 'Ctrl'
    }
    if (key === 'Alt') {
      return isMac ? '⌥' : 'Alt'
    }
    if (key === 'Shift') {
      return isMac ? '⇧' : 'Shift'
    }
    return key
  })

  return (
    <div className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
      <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors">
        {description}
      </span>
      <div className="flex items-center gap-1">
        {displayKeys.map((key, index) => (
          <span key={index}>
            <kbd className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 
              bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800
              border border-gray-300 dark:border-gray-600
              rounded-md shadow-sm
              text-xs font-medium text-gray-700 dark:text-gray-300
              font-mono tracking-wide">
              {key}
            </kbd>
            {index < displayKeys.length - 1 && (
              <span className="mx-0.5 text-gray-400 dark:text-gray-500">+</span>
            )}
          </span>
        ))}
      </div>
    </div>
  )
})

interface ShortcutGroupProps {
  title: string
  icon: React.ComponentType<{ className?: string }>
  iconColor: string
  shortcuts: ShortcutItemProps[]
}

const ShortcutGroup = memo(function ShortcutGroup({ title, icon: Icon, iconColor, shortcuts }: ShortcutGroupProps) {
  return (
    <div className="bg-white dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700/50 overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/30">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconColor}`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
      </div>
      <div className="p-2">
        {shortcuts.map((shortcut, index) => (
          <ShortcutItem key={index} {...shortcut} />
        ))}
      </div>
    </div>
  )
})

export const KeyboardShortcutsTab = memo(function KeyboardShortcutsTab() {
  const shortcutGroups = useMemo(() => [
    {
      title: 'Навигация',
      icon: Command,
      iconColor: 'bg-gradient-to-br from-blue-500 to-blue-600',
      shortcuts: [
        { keys: ['Ctrl', ','], description: 'Открыть настройки' },
        { keys: ['Ctrl', 'K'], description: 'Командная палитра' },
        { keys: ['Ctrl', 'F'], description: 'Поиск' },
        { keys: ['Ctrl', '/'], description: 'Справка / Туториал' },
        { keys: ['Escape'], description: 'Закрыть модальное окно' },
      ]
    },
    {
      title: 'Таймер и записи',
      icon: Timer,
      iconColor: 'bg-gradient-to-br from-rose-500 to-rose-600',
      shortcuts: [
        { keys: ['Ctrl', 'T'], description: 'Старт/стоп таймера' },
        { keys: ['Ctrl', 'N'], description: 'Создать новую запись' },
      ]
    },
    {
      title: 'Действия с данными',
      icon: Folder,
      iconColor: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
      shortcuts: [
        { keys: ['Ctrl', 'Z'], description: 'Отменить действие' },
        { keys: ['Ctrl', 'Y'], description: 'Повторить действие' },
        { keys: ['Delete'], description: 'Удалить выбранное' },
      ]
    },
    {
      title: 'Интерфейс',
      icon: Palette,
      iconColor: 'bg-gradient-to-br from-violet-500 to-violet-600',
      shortcuts: [
        { keys: ['Ctrl', 'D'], description: 'Переключить тему (светлая/тёмная)' },
      ]
    },
  ], [])

  return (
    <div className="space-y-4">
      {/* Подсказка про ОС */}
      <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30">
        <Command className="w-4 h-4 text-blue-500 flex-shrink-0" />
        <p className="text-sm text-blue-700 dark:text-blue-300">
          На Mac используйте <kbd className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-800/50 rounded text-xs font-mono">⌘ Command</kbd> вместо <kbd className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-800/50 rounded text-xs font-mono">Ctrl</kbd>
        </p>
      </div>

      {/* Группы горячих клавиш */}
      <div className="grid gap-4">
        {shortcutGroups.map((group, index) => (
          <ShortcutGroup key={index} {...group} />
        ))}
      </div>

      {/* Дополнительная информация */}
      <div className="mt-6 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700/50">
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <span>Совет: Используйте <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono">Ctrl+K</kbd> для быстрого доступа ко всем функциям через командную палитру</span>
        </div>
      </div>
    </div>
  )
})
