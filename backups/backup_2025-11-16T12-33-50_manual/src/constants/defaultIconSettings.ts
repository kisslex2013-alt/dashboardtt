/**
 * 🎨 Дефолтные настройки иконок и цветов кнопок
 *
 * Этот файл содержит все дефолтные значения иконок и цветов для кнопок приложения.
 * Эти значения применяются при первом запуске или если в localStorage нет сохраненных данных.
 *
 * ВАЖНО: Эти значения автоматически обновляются при изменении иконок/цветов в dev режиме.
 * После деплоя эти значения используются для всех пользователей (включая инкогнито).
 *
 * Структура:
 * - iconReplacements: { iconId: iconName } - где iconName это имя иконки из Lucide или Iconify
 * - buttonColorReplacements: { iconId: color } - где color это Tailwind класс или hex цвет
 *
 * Последнее обновление: 2025-11-09 (текущие дефолтные значения)
 */

import type { IconReplacements, ButtonColorReplacements, IconSettings } from '../types'

export const DEFAULT_ICON_REPLACEMENTS: IconReplacements = {
  // Header buttons
  'header-select': 'CheckSquare',
  'header-add-new': 'Plus',
  'header-timer-start': 'iconify:oi:timer',
  'header-timer-stop': 'Square',
  'header-import': 'Download',
  'header-export': 'Upload',
  'header-categories': 'iconify:mdi:category-plus',
  'header-backups': 'iconify:lucide:database-backup',
  'header-undo': 'Undo',
  'header-redo': 'Redo',
  'header-search': 'Search',
  'header-select-cancel': 'X',
  'header-promo': 'Sparkles',
  'header-mobile-menu': 'Menu',
  'header-compare-period': 'ChevronDown',
  'header-compare': 'GitCompare',
  'header-theme-light': 'Moon',
  'header-theme-dark': 'Sun',
  'header-sound-settings': 'iconify:mdi:bell',
  'header-floating-panel-settings': 'Smartphone',
  'header-tutorial': 'iconify:typcn:info',
  'header-about': 'Palette',

  // View buttons
  'view-list': 'List',
  'view-grid': 'Grid',
  'view-timeline': 'Clock',

  // Entry buttons
  'entry-item-edit': 'Edit2',
  'entry-item-delete': 'Trash2',
  'edit-entry-save': 'Save',
  'edit-entry-cancel': 'X',
  'edit-entry-delete': 'Trash2',

  // Modal buttons
  'backup-create': 'Archive',
  'backup-restore': 'Upload',
  'backup-delete': 'Trash2',
  'import-cancel': 'X',
  'import-submit': 'Upload',
  'confirm-cancel': 'X',
  'confirm-submit': 'Check',
  'about-close': 'X',

  // Bulk actions
  'bulk-category': 'Folder',
  'bulk-export': 'Upload',
  'bulk-delete': 'Trash2',

  // Floating panel
  'floating-panel-minimize': 'ChevronDown',
  'floating-panel-maximize': 'ChevronUp',
  'floating-panel-stop': 'Square',
  'floating-panel-settings': 'Settings',

  // Tutorial
  'tutorial-previous': 'ChevronLeft',
  'tutorial-next': 'ChevronRight',
  'tutorial-finish': 'Check',
  'clear-demo-data': 'Trash2',

  // Empty state
  'empty-state-action-compact': 'Plus',
  'empty-state-action-default': 'Plus',
  'empty-state-action-large': 'Plus',

  // Modal close
  'modal-close': 'X',
}

/**
 * Дефолтные цвета кнопок
 * Цвета указаны как Tailwind классы (например, 'blue-500') или hex значения
 */
export const DEFAULT_BUTTON_COLOR_REPLACEMENTS: ButtonColorReplacements = {
  // Header buttons - основные цвета
  'header-select': '#9e4242',
  'header-add-new': '#3B82F6',
  'header-timer-start': '#5cc85c',
  'header-timer-stop': 'red-500',
  'header-import': '#1e2937',
  'header-export': '#1e2937',
  'header-categories': '#1e2937',
  'header-backups': '#1e2937',
  'header-search': '#1e2937',
  'header-select-cancel': 'red-500',
}

/**
 * Получить все дефолтные настройки
 */
export function getDefaultIconSettings(): IconSettings {
  return {
    iconReplacements: { ...DEFAULT_ICON_REPLACEMENTS },
    buttonColorReplacements: { ...DEFAULT_BUTTON_COLOR_REPLACEMENTS },
  }
}
