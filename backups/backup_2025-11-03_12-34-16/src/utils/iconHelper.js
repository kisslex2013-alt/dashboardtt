/**
 * 🎨 Утилита для динамической загрузки иконок из lucide-react
 * 
 * ✅ ОПТИМИЗИРОВАНО: Используются только named imports для tree-shaking
 * Вместо `import * as LucideIcons` импортируем только используемые иконки
 * 
 * Иконки импортируются по требованию по строковому имени.
 * Поддерживает все используемые в проекте иконки.
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
  CheckSquare
} from 'lucide-react';

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
  CheckSquare
};

/**
 * Получает компонент иконки по строковому имени
 * @param {string} iconName - название иконки (например, "Code", "TrendingUp")
 * @returns {React.Component|null} Компонент иконки или null, если не найдена
 */
export function getIcon(iconName) {
  if (!iconName || typeof iconName !== 'string') {
    return null;
  }
  
  // Преобразуем название в PascalCase, если нужно
  const normalizedName = iconName.charAt(0).toUpperCase() + iconName.slice(1);
  
  // Ищем иконку в маппинге используемых иконок
  const Icon = ICON_MAP[normalizedName] || ICON_MAP[iconName];
  
  if (!Icon) {
    // Если иконка не найдена, возвращаем дефолтную (Folder)
    console.warn(`Иконка "${iconName}" не найдена. Используется дефолтная "Folder".`);
    return ICON_MAP.Folder || null;
  }
  
  return Icon;
}

/**
 * Проверяет, существует ли иконка с таким именем
 * @param {string} iconName - название иконки
 * @returns {boolean} true, если иконка существует
 */
export function iconExists(iconName) {
  return getIcon(iconName) !== null;
}

/**
 * Получает список всех доступных иконок
 * @returns {string[]} Массив названий доступных иконок
 */
export function getAvailableIcons() {
  return Object.keys(ICON_MAP);
}
