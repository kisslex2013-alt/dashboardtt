/**
 * 🎨 Утилита для динамической загрузки иконок из lucide-react и Iconify
 *
 * ✅ ОПТИМИЗИРОВАНО: Используются только named imports для tree-shaking
 * Вместо `import * as LucideIcons` импортируем только используемые иконки
 *
 * Иконки импортируются по требованию по строковому имени.
 * Поддерживает все используемые в проекте иконки из Lucide React.
 * Поддерживает Iconify иконки через формат "iconify:collection:name" (например, "iconify:mdi:clock-outline")
 */

// ✅ ОПТИМИЗАЦИЯ: Импортируем только используемые иконки (named imports для tree-shaking)
import {
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
  Edit2,
  Trash2,
  Plus,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  X,
  Info,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Square,
  Maximize2,
  Minimize2,
  Moon,
  Sun,
  HelpCircle,
  GitCompare,
  Volume2,
  History,
  Rocket,
  Heart,
  Copy,
  Check,
  FileJson,
  Zap,
  Flame,
  Sliders,
  BarChart3,
  Pin,
  LineChart,
  Layers,
  Loader2,
  HardDrive,
  Archive,
  Undo,
  Redo,
  List,
  Search,
  CheckSquare,
} from 'lucide-react'

// Импорт Iconify (ES modules)
import { Icon as IconifyIcon } from '@iconify/react'
import React from 'react'

/**
 * Маппинг всех используемых иконок в проекте
 * Это позволяет tree-shaking работать правильно
 */
const ICON_MAP = {
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
  Edit2,
  Trash2,
  Plus,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  X,
  Info,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Square,
  Maximize2,
  Minimize2,
  Moon,
  Sun,
  HelpCircle,
  GitCompare,
  Volume2,
  History,
  Rocket,
  Heart,
  Copy,
  Check,
  FileJson,
  Zap,
  Flame,
  Sliders,
  BarChart3,
  Pin,
  LineChart,
  Layers,
  Loader2,
  HardDrive,
  Archive,
  Undo,
  Redo,
  List,
  Search,
  CheckSquare,
}

/**
 * Получает компонент иконки по строковому имени
 * Поддерживает два формата:
 * 1. Lucide React: "Code", "TrendingUp" и т.д.
 * 2. Iconify: "iconify:mdi:clock-outline", "iconify:carbon:analytics" и т.д.
 *
 * @param {string} iconName - название иконки или Iconify ID
 * @param {object} iconifyProps - дополнительные пропсы для Iconify (width, height, color)
 * @returns {React.Component|null} Компонент иконки или null, если не найдена
 */
export function getIcon(iconName, iconifyProps = {}) {
  if (!iconName || typeof iconName !== 'string') {
    return null
  }

  // Проверяем, является ли это Iconify иконкой (формат: "iconify:collection:name")
  if (iconName.startsWith('iconify:')) {
    const iconifyId = iconName.replace('iconify:', '')

    // Возвращаем компонент-обертку для Iconify (используем React.createElement вместо JSX)
    return function IconifyWrapper(props) {
      return React.createElement(IconifyIcon, {
        icon: iconifyId,
        ...iconifyProps,
        ...props,
      })
    }
  }

  // Обычная Lucide React иконка
  const normalizedName = iconName.charAt(0).toUpperCase() + iconName.slice(1)
  const Icon = ICON_MAP[normalizedName] || ICON_MAP[iconName]

  if (!Icon) {
    // Если иконка не найдена, возвращаем дефолтную (Folder)
    console.warn(`Иконка "${iconName}" не найдена. Используется дефолтная "Folder".`)
    return ICON_MAP.Folder || null
  }

  return Icon
}

/**
 * Проверяет, существует ли иконка с таким именем
 * @param {string} iconName - название иконки или Iconify ID
 * @returns {boolean} true, если иконка существует
 */
export function iconExists(iconName) {
  if (!iconName || typeof iconName !== 'string') {
    return false
  }

  // Iconify иконки всегда считаются существующими (проверка будет при рендере)
  if (iconName.startsWith('iconify:')) {
    return true
  }

  // Проверяем Lucide React иконки
  const normalizedName = iconName.charAt(0).toUpperCase() + iconName.slice(1)
  return !!(ICON_MAP[normalizedName] || ICON_MAP[iconName])
}

/**
 * Проверяет, является ли иконка Iconify иконкой
 * @param {string} iconName - название иконки
 * @returns {boolean} true, если это Iconify иконка
 */
export function isIconifyIcon(iconName) {
  return iconName && typeof iconName === 'string' && iconName.startsWith('iconify:')
}

/**
 * Получает Iconify ID из полного имени
 * @param {string} iconName - полное имя в формате "iconify:collection:name"
 * @returns {string} Iconify ID (collection:name) или пустая строка
 */
export function getIconifyId(iconName) {
  if (isIconifyIcon(iconName)) {
    return iconName.replace('iconify:', '')
  }
  return ''
}

/**
 * Получает список всех доступных иконок
 * @returns {string[]} Массив названий доступных иконок
 */
export function getAvailableIcons() {
  return Object.keys(ICON_MAP)
}
