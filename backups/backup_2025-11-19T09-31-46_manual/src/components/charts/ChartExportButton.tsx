import { useState, useRef } from 'react'
import { Download, Image as ImageIcon, FileText } from '../../utils/icons'
import { Button } from '../ui/Button'

/**
 * 📥 Кнопка экспорта графика
 *
 * Компонент для экспорта графиков в PNG или SVG
 *
 * Особенности:
 * - Dropdown меню с выбором формата
 * - Визуальная обратная связь
 * - Обработка ошибок
 * - Компактный режим для мобильных
 *
 * Phase 2: UI/UX Improvements - Task 2.5.2
 */

interface ChartExportButtonProps {
  onExport: (format: 'png' | 'svg') => Promise<void>
  chartName?: string
  disabled?: boolean
  compact?: boolean
  className?: string
}

export function ChartExportButton({
  onExport,
  chartName = 'chart',
  disabled = false,
  compact = false,
  className = '',
}: ChartExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const handleExport = async (format: 'png' | 'svg') => {
    setIsExporting(true)
    setError(null)
    setShowMenu(false)

    try {
      await onExport(format)
    } catch (err) {
      console.error('Export error:', err)
      setError(`Не удалось экспортировать график в ${format.toUpperCase()}`)
      setTimeout(() => setError(null), 3000)
    } finally {
      setIsExporting(false)
    }
  }

  // Закрытие меню при клике вне его
  const handleClickOutside = (e: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
      setShowMenu(false)
    }
  }

  // Добавляем слушатель при открытии меню
  useState(() => {
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  })

  if (compact) {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          disabled={disabled || isExporting}
          className={`
            p-2 rounded-lg transition-all
            ${
              disabled || isExporting
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }
            focus:outline-none focus:ring-2 focus:ring-blue-500
          `}
          aria-label="Экспорт графика"
          title="Скачать график"
        >
          {isExporting ? (
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Download className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          )}
        </button>

        {showMenu && (
          <div
            ref={menuRef}
            className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
          >
            <div className="py-1">
              <button
                onClick={() => handleExport('png')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <ImageIcon className="w-4 h-4" />
                <span>Скачать PNG</span>
              </button>
              <button
                onClick={() => handleExport('svg')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                <span>Скачать SVG</span>
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute top-full right-0 mt-2 px-3 py-2 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-xs rounded-lg shadow-lg whitespace-nowrap">
            {error}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <Button
        variant="secondary"
        size="sm"
        icon={Download}
        onClick={() => setShowMenu(!showMenu)}
        disabled={disabled || isExporting}
      >
        {isExporting ? 'Экспорт...' : 'Скачать'}
      </Button>

      {showMenu && (
        <div
          ref={menuRef}
          className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
        >
          <div className="py-1">
            <button
              onClick={() => handleExport('png')}
              disabled={isExporting}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 disabled:opacity-50"
            >
              <ImageIcon className="w-4 h-4" />
              <div className="flex-1">
                <div className="font-medium">Скачать PNG</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Растровое изображение</div>
              </div>
            </button>
            <button
              onClick={() => handleExport('svg')}
              disabled={isExporting}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 disabled:opacity-50"
            >
              <FileText className="w-4 h-4" />
              <div className="flex-1">
                <div className="font-medium">Скачать SVG</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Векторная графика</div>
              </div>
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute top-full right-0 mt-2 px-4 py-2 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-sm rounded-lg shadow-lg">
          {error}
        </div>
      )}
    </div>
  )
}
