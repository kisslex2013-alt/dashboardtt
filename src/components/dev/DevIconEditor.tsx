import React, { useState, useEffect } from 'react'
import { IconSelect } from '../ui/IconSelect'
import { ColorPicker } from '../ui/ColorPicker'
import { useIconEditor } from '../../hooks/useIconEditor'
import { useIconEditorStore } from '../../store/useIconEditorStore'
import { getIcon } from '../../utils/iconHelper'
import { logger } from '../../utils/logger'

interface DevIconEditorProps {
  showSuccess: (message: string) => void
  showError: (message: string) => void
}

/**
 * Development-only component for editing icons and button colors
 * This component is only loaded in DEV mode (import.meta.env.DEV)
 *
 * Extracted from App.tsx to reduce main component complexity
 * and ensure dev-only code is properly isolated
 */
export function DevIconEditor({ showSuccess, showError }: DevIconEditorProps) {
  const { replaceIcon, getIconReplacement } = useIconEditor()
  const replaceButtonColor = useIconEditorStore(state => state.replaceButtonColor)
  const getButtonColor = useIconEditorStore(state => state.getButtonColor)
  const saveAsDefaults = useIconEditorStore(state => state.saveAsDefaults)
  const iconReplacements = useIconEditorStore(state => state.iconReplacements)
  const buttonColorReplacements = useIconEditorStore(state => state.buttonColorReplacements)

  const [globalIconSelector, setGlobalIconSelector] = useState<{
    isOpen: boolean
    iconId: string | null
  }>({ isOpen: false, iconId: null })

  // Global right-click handler for icon/color editing
  useEffect(() => {
    const handleGlobalContextMenu = (e: MouseEvent) => {
      const target = (e.target as Element).closest('button')
      if (!target) return

      const hasIcon = target.querySelector('svg')
      if (!hasIcon) return

      if (target.closest('[data-icon-selector]')) return

      let iconId = target.getAttribute('data-icon-id')

      if (!iconId) {
        const buttonText = target.textContent?.trim() || ''
        const iconElement = target.querySelector('svg')
        const iconClass = iconElement?.className || ''
        const iconNameMatch = iconClass.match(/lucide-(\w+)/)
        let iconName = iconNameMatch ? iconNameMatch[1] : 'icon'
        iconName = iconName.charAt(0).toUpperCase() + iconName.slice(1)
        iconId = `auto-${iconName}-${buttonText}`.toLowerCase().replace(/\s+/g, '-')

        target.setAttribute('data-icon-id', iconId)
        logger.log('[IconEditor] Сгенерирован iconId:', iconId, 'для кнопки:', buttonText)
      }

      e.preventDefault()
      e.stopPropagation()
      setGlobalIconSelector({ isOpen: true, iconId })
    }

    document.addEventListener('contextmenu', handleGlobalContextMenu)
    return () => document.removeEventListener('contextmenu', handleGlobalContextMenu)
  }, [])

  const tailwindToHex = (twClass: string): string => {
    const colors: Record<string, string> = {
      'blue-500': '#3B82F6',
      'green-500': '#10B981',
      'red-500': '#EF4444',
      'gray-200': '#E5E7EB',
      'gray-500': '#6B7280',
      'gray-700': '#374151',
    }
    return colors[twClass] || twClass
  }

  if (!globalIconSelector.isOpen) return null

  const currentIcon =
    (globalIconSelector.iconId ? iconReplacements[globalIconSelector.iconId] : null) ||
    (globalIconSelector.iconId ? getIconReplacement(globalIconSelector.iconId) : null) ||
    'Folder'
  const currentColor =
    (globalIconSelector.iconId ? buttonColorReplacements[globalIconSelector.iconId] : null) ||
    (globalIconSelector.iconId ? getButtonColor(globalIconSelector.iconId) : null) ||
    '#3B82F6'
  const IconComponent = getIcon(currentIcon)
  const bgColor =
    currentColor && currentColor.startsWith('#')
      ? currentColor
      : currentColor
        ? tailwindToHex(currentColor)
        : '#3B82F6'

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={() => setGlobalIconSelector({ isOpen: false, iconId: null })}
      data-icon-selector="true"
    >
      <div
        className="glass-effect rounded-xl p-6 shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Сменить иконку и цвет</h3>
          <button
            onClick={() => setGlobalIconSelector({ isOpen: false, iconId: null })}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Закрыть"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Button Preview */}
        {globalIconSelector.iconId && (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Превью кнопки
            </label>
            <div className="flex items-center gap-3">
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-colors"
                style={{ backgroundColor: bgColor }}
                disabled
              >
                {IconComponent && <IconComponent className="w-4 h-4" />}
                <span>Кнопка: {globalIconSelector.iconId}</span>
              </button>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                <div>Иконка: {currentIcon || 'не выбрана'}</div>
                <div>Цвет: {currentColor || 'не выбран'}</div>
              </div>
            </div>
          </div>
        )}

        {/* Icon Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Иконка
          </label>
          <IconSelect
            value={globalIconSelector.iconId ? getIconReplacement(globalIconSelector.iconId) || '' : ''}
            onChange={(iconName: string) => {
              if (iconName && globalIconSelector.iconId) {
                logger.log('[IconEditor] Замена иконки:', globalIconSelector.iconId, '->', iconName)
                replaceIcon(globalIconSelector.iconId, iconName)
              }
            }}
            color="#3B82F6"
          />
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 my-6"></div>

        {/* Color Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Цвет кнопки
          </label>
          <ColorPicker
            value={globalIconSelector.iconId ? getButtonColor(globalIconSelector.iconId) || '' : ''}
            onChange={(color: string) => {
              if (color && globalIconSelector.iconId) {
                logger.log('[IconEditor] Замена цвета:', globalIconSelector.iconId, '->', color)
                replaceButtonColor(globalIconSelector.iconId, color)
              }
            }}
          />
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 my-6"></div>

        {/* Save Button */}
        <div>
          <button
            onClick={() => {
              const success = saveAsDefaults()
              if (success) {
                showSuccess(
                  'Дефолтные значения иконок и цветов сохранены! При деплое они автоматически применятся для всех пользователей.'
                )
                setGlobalIconSelector({ isOpen: false, iconId: null })
              } else {
                showError('Ошибка сохранения значений по умолчанию')
              }
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Сохранить как дефолт
          </button>
        </div>
      </div>
    </div>
  )
}
