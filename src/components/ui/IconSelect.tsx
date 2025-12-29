import { useState, useRef, useEffect, useCallback, useMemo, useTransition, memo } from 'react'
import { createPortal } from 'react-dom'
import {
  ChevronDown,
  Search,
  Loader2,
  Code,
  TrendingUp,
  Palette,
  Users,
  MessageCircle,
  BookOpen,
  MoreHorizontal,
  Grid,
  Activity,
  Calendar,
  Clock,
  DollarSign,
  Settings,
  Play,
  CheckCircle,
  Bell,
  Upload,
  Download,
  Database,
  Folder,
  FileText,
  X,
  Plus,
  Edit2,
  Trash2,
  Save,
  Eye,
  EyeOff,
  Filter,
} from '../../utils/icons'
import { Icon } from '@iconify/react'
import { useModal, useAnimationState } from '../../hooks'
import type { IconSelectProps } from '../../types'

/**
 * 🎯 Выпадающий селект для выбора иконки
 *
 * Поддерживает:
 * - Статический список предустановленных иконок (Lucide + популярные Iconify)
 * - Поиск по Iconify API (100,000+ иконок)
 */
export function IconSelect({ value, onChange, color = '#3B82F6' }: IconSelectProps) {
  const { isOpen, toggle, close } = useModal(false)
  const { shouldMount, isAnimating, isExiting } = useAnimationState({
    isOpen,
    duration: 200,
  })

  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 })
  const selectRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Состояния для поиска по Iconify API
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Используем useTransition для отложенного обновления UI при поиске
  const [isPending, startTransition] = useTransition()

  // Статический список иконок (Lucide и популярные Iconify)
  const iconOptions = useMemo(
    () => [
      // Lucide иконки
      { name: 'Code', component: Code, type: 'lucide', label: 'Code' },
      { name: 'TrendingUp', component: TrendingUp, type: 'lucide', label: 'Trending Up' },
      { name: 'Palette', component: Palette, type: 'lucide', label: 'Palette' },
      { name: 'Users', component: Users, type: 'lucide', label: 'Users' },
      { name: 'MessageCircle', component: MessageCircle, type: 'lucide', label: 'Message' },
      { name: 'BookOpen', component: BookOpen, type: 'lucide', label: 'Book' },
      { name: 'MoreHorizontal', component: MoreHorizontal, type: 'lucide', label: 'More' },
      { name: 'Grid', component: Grid, type: 'lucide', label: 'Grid' },
      { name: 'Activity', component: Activity, type: 'lucide', label: 'Activity' },
      { name: 'Calendar', component: Calendar, type: 'lucide', label: 'Calendar' },
      { name: 'Clock', component: Clock, type: 'lucide', label: 'Clock' },
      { name: 'DollarSign', component: DollarSign, type: 'lucide', label: 'Dollar' },
      { name: 'Settings', component: Settings, type: 'lucide', label: 'Settings' },
      { name: 'Play', component: Play, type: 'lucide', label: 'Play' },
      { name: 'CheckCircle', component: CheckCircle, type: 'lucide', label: 'Check' },
      { name: 'Bell', component: Bell, type: 'lucide', label: 'Bell' },
      { name: 'Upload', component: Upload, type: 'lucide', label: 'Upload' },
      { name: 'Download', component: Download, type: 'lucide', label: 'Download' },
      { name: 'Database', component: Database, type: 'lucide', label: 'Database' },
      { name: 'Folder', component: Folder, type: 'lucide', label: 'Folder' },
      { name: 'FileText', component: FileText, type: 'lucide', label: 'File' },
      { name: 'X', component: X, type: 'lucide', label: 'Close' },
      { name: 'Plus', component: Plus, type: 'lucide', label: 'Add' },
      { name: 'Edit2', component: Edit2, type: 'lucide', label: 'Edit' },
      { name: 'Trash2', component: Trash2, type: 'lucide', label: 'Delete' },
      { name: 'Save', component: Save, type: 'lucide', label: 'Save' },
      { name: 'Eye', component: Eye, type: 'lucide', label: 'Show' },
      { name: 'EyeOff', component: EyeOff, type: 'lucide', label: 'Hide' },
      { name: 'Filter', component: Filter, type: 'lucide', label: 'Filter' },
      { name: 'Search', component: Search, type: 'lucide', label: 'Search' },

      // Популярные Iconify иконки
      { name: 'iconify:mdi:code-tags', type: 'iconify', label: 'Code Tags' },
      { name: 'iconify:mdi:trending-up', type: 'iconify', label: 'Trending Up' },
      { name: 'iconify:mdi:palette', type: 'iconify', label: 'Palette' },
      { name: 'iconify:mdi:account-group', type: 'iconify', label: 'Users' },
      { name: 'iconify:mdi:message-text', type: 'iconify', label: 'Message' },
      { name: 'iconify:mdi:book-open-variant', type: 'iconify', label: 'Book' },
      { name: 'iconify:mdi:view-grid', type: 'iconify', label: 'Grid' },
      { name: 'iconify:mdi:chart-line', type: 'iconify', label: 'Chart' },
      { name: 'iconify:mdi:calendar', type: 'iconify', label: 'Calendar' },
      { name: 'iconify:mdi:clock-outline', type: 'iconify', label: 'Clock' },
      { name: 'iconify:mdi:currency-usd', type: 'iconify', label: 'Dollar' },
      { name: 'iconify:mdi:cog', type: 'iconify', label: 'Settings' },
      { name: 'iconify:mdi:play', type: 'iconify', label: 'Play' },
      { name: 'iconify:mdi:check-circle', type: 'iconify', label: 'Check' },
      { name: 'iconify:mdi:bell', type: 'iconify', label: 'Bell' },
      { name: 'iconify:mdi:upload', type: 'iconify', label: 'Upload' },
      { name: 'iconify:mdi:download', type: 'iconify', label: 'Download' },
      { name: 'iconify:mdi:database', type: 'iconify', label: 'Database' },
      { name: 'iconify:mdi:folder', type: 'iconify', label: 'Folder' },
      { name: 'iconify:mdi:file-document', type: 'iconify', label: 'Document' },
      { name: 'iconify:mdi:rocket-launch', type: 'iconify', label: 'Rocket' },
      { name: 'iconify:mdi:heart', type: 'iconify', label: 'Heart' },
      { name: 'iconify:mdi:lightning-bolt', type: 'iconify', label: 'Lightning' },
      { name: 'iconify:mdi:fire', type: 'iconify', label: 'Fire' },
      { name: 'iconify:mdi:chart-bar', type: 'iconify', label: 'Bar Chart' },
      { name: 'iconify:mdi:pin', type: 'iconify', label: 'Pin' },
      { name: 'iconify:mdi:layers', type: 'iconify', label: 'Layers' },
      { name: 'iconify:mdi:archive', type: 'iconify', label: 'Archive' },
      { name: 'iconify:mdi:undo', type: 'iconify', label: 'Undo' },
      { name: 'iconify:mdi:redo', type: 'iconify', label: 'Redo' },
    ],
    []
  )

  // Функция поиска по Iconify API с debounce и отменой предыдущих запросов
  const searchIconifyIcons = useCallback(async query => {
    if (!query || query.trim().length < 3) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    // Отменяем предыдущий запрос, если он еще выполняется
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Создаем новый AbortController для этого запроса
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    setIsSearching(true)
    try {
      const response = await fetch(
        `https://api.iconify.design/search?query=${encodeURIComponent(query.trim())}&limit=100`,
        { signal: abortController.signal }
      )

      if (!response.ok) {
        throw new Error('Ошибка поиска иконок')
      }

      const data = await response.json()

      // Проверяем, не был ли запрос отменен
      if (abortController.signal.aborted) {
        return
      }

      if (data.icons && Array.isArray(data.icons)) {
        const icons = data.icons.map(iconId => {
          const parts = iconId.split(':')
          const collection = parts[0] || ''
          const name = parts[1] || iconId
          const label = name.replace(/-/g, ' ').replace(/_/g, ' ')

          return {
            name: `iconify:${iconId}`,
            label: label.charAt(0).toUpperCase() + label.slice(1),
            type: 'iconify',
            collection,
          }
        })

        startTransition(() => {
          setSearchResults(icons)
          setIsSearching(false)
        })
      } else {
        startTransition(() => {
          setSearchResults([])
          setIsSearching(false)
        })
      }
    } catch (error) {
      // Игнорируем ошибку отмены запроса
      if (error.name === 'AbortError') {
        return
      }

      console.error('Ошибка поиска иконок:', error)
      startTransition(() => {
        setSearchResults([])
        setIsSearching(false)
      })
    }
  }, [])

  // Debounced поиск при изменении searchQuery
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }

    if (searchQuery.trim().length >= 3) {
      searchTimeoutRef.current = setTimeout(() => {
        startTransition(() => {
          searchIconifyIcons(searchQuery)
        })
      }, 500) // Debounce 500ms
    } else {
      startTransition(() => {
        setSearchResults([])
        setIsSearching(false)
      })
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
    }
  }, [searchQuery, searchIconifyIcons])

  // Определяем выбранную иконку
  const selectedIcon =
    iconOptions.find(opt => opt.name === value) ||
    searchResults.find(opt => opt.name === value) ||
    iconOptions.find(opt => opt.name === 'Folder')

  const selectedIconDisplay = selectedIcon || iconOptions[0]
  const SelectedIconComponent =
    selectedIconDisplay.type === 'iconify'
      ? () => (
          <Icon icon={selectedIconDisplay.name.replace('iconify:', '')} width={16} height={16} />
        )
      : selectedIconDisplay.component || Folder

  // Логика открытия вынесена в useAnimationState
  // Логика закрытия тоже там

  // Позиционирование dropdown
  useEffect(() => {
    if (shouldMount && selectRef.current) {
      const rect = selectRef.current.getBoundingClientRect()
      setPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      })
    }
  }, [shouldMount])

  // Фокус на поле поиска при открытии dropdown
  useEffect(() => {
    if (isOpen && shouldMount && searchInputRef.current) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isOpen, shouldMount])

  // Закрытие по клику вне
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = e => {
      if (
        selectRef.current &&
        !selectRef.current.contains(e.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        close()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, close])

  const handleSelect = useCallback(
    iconName => {
      onChange(iconName)
      close()
      setSearchQuery('')
      setSearchResults([])
    },
    [onChange]
  )

  // Определяем, какие иконки показывать
  const iconsToShow = useMemo(() => {
    if (searchQuery.trim().length >= 3) {
      return searchResults.slice(0, 100) // Ограничиваем до 100 результатов
    }
    return iconOptions
  }, [searchQuery, searchResults, iconOptions])

  return (
    <>
      <div ref={selectRef} className="relative">
        <button
          type="button"
          onClick={toggle}
          className="flex-1 px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 flex items-center gap-1.5 hover:border-blue-500 transition-colors"
        >
          {selectedIconDisplay.type === 'iconify' ? (
            <Icon
              icon={selectedIconDisplay.name.replace('iconify:', '')}
              width={14}
              height={14}
              style={{ color }}
            />
          ) : (
            <SelectedIconComponent className="w-3.5 h-3.5 flex-shrink-0" style={{ color }} />
          )}
          <span className="text-xs text-gray-700 dark:text-gray-300 truncate flex-1 text-left">
            {selectedIconDisplay.label || selectedIconDisplay.name || 'Folder'}
          </span>
          <ChevronDown
            className={`w-3 h-3 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* Dropdown список */}
      {shouldMount &&
        createPortal(
          <div
            ref={dropdownRef}
            className={`fixed z-[9999999] glass-effect rounded-lg border border-gray-300 dark:border-gray-600 shadow-xl backdrop-blur-lg bg-white/95 dark:bg-gray-800/95 ${
              !isAnimating && !isExiting ? 'opacity-0 -translate-y-4' : ''
            } ${isAnimating ? 'animate-slide-down' : ''} ${
              isExiting ? 'animate-slide-up-out' : ''
            }`}
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
              width: `${Math.max(position.width, 400)}px`,
              maxHeight: '500px',
              overflowY: 'auto',
              transformOrigin: 'top',
            }}
          >
            {/* Поле поиска */}
            <div className="p-2 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={e => {
                    const value = e.target.value.slice(0, 50)
                    startTransition(() => {
                      setSearchQuery(value)
                    })
                  }}
                  placeholder={
                    searchQuery ? 'Поиск...' : 'Поиск по 100,000+ иконкам (минимум 3 символа)...'
                  }
                  className="w-full pl-10 pr-10 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-normal"
                  maxLength={50}
                  onKeyDown={e => {
                    if (e.key === 'Escape') {
                      close()
                    }
                  }}
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 animate-spin" />
                )}
              </div>
              {searchQuery && searchQuery.trim().length >= 3 && searchResults.length > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 px-1">
                  Найдено: {searchResults.length}{' '}
                  {searchResults.length === 1
                    ? 'иконка'
                    : searchResults.length < 5
                      ? 'иконки'
                      : 'иконок'}
                </p>
              )}
            </div>

            {/* Список иконок */}
            <div className="p-2">
              {iconsToShow.length === 0 && !isSearching ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-500 dark:text-gray-400">
                  {searchQuery.trim().length >= 3 ? (
                    <>
                      <Search className="w-8 h-8 mb-2 opacity-50" />
                      <p className="text-sm">Ничего не найдено</p>
                    </>
                  ) : (
                    <>
                      <Search className="w-8 h-8 mb-2 opacity-50" />
                      <p className="text-sm">Начните вводить запрос для поиска</p>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {/* Ограничиваем количество отображаемых иконок для производительности */}
                  {(isPending || isSearching
                    ? iconsToShow.slice(0, 50)
                    : iconsToShow.slice(0, 100)
                  ).map(option => {
                    const isSelected = option.name === value
                    const isIconify = option.type === 'iconify'

                    return (
                      <IconButton
                        key={option.name}
                        option={option}
                        isSelected={isSelected}
                        isIconify={isIconify}
                        color={color}
                        onSelect={handleSelect}
                      />
                    )
                  })}
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  )
}

interface IconButtonProps {
  option: any // Using specific type if available, otherwise any for now to resolve error
  isSelected: boolean
  isIconify: boolean
  color: string
  onSelect: (name: string) => void
}

// Мемоизированный компонент иконки
const IconButton = memo(({ option, isSelected, isIconify, color, onSelect }: IconButtonProps) => {
  return (
    <button
      type="button"
      onClick={() => onSelect(option.name)}
      className={`
        p-1.5 rounded transition-all flex items-center justify-center
        ${
          isSelected
            ? 'bg-blue-100 dark:bg-blue-900/30 ring-1 ring-blue-500'
            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
        }
      `}
      title={option.label || option.name}
    >
      {isIconify ? (
        <Icon icon={option.name.replace('iconify:', '')} width={16} height={16} style={{ color }} />
      ) : (
        <option.component className="w-4 h-4" style={{ color }} />
      )}
    </button>
  )
})

IconButton.displayName = 'IconButton'
