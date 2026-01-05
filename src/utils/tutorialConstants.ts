/**
 * Константы для TutorialModal
 * Централизованное хранение версии и маппинга иконок
 */

import {
  Rocket,
  Timer,
  Sliders,
  Settings,
  BarChart3,
  Download,
  List,
  Grid3x3,
  Activity,
  CalendarDays,
  Target,
  Zap,
  Eye,
  AlertTriangle,
  DollarSign,
  Sparkles,
  CheckCircle,
  Edit2,
  TrendingUp,
  Palette,
  Search,
  Bell,
  Undo,
  Save,
  Maximize2,
  ClipboardList,
  Monitor,
  Users,
  MessageCircle,
  BookOpen,
  PieChart,
  Scale,
  Shield,
  Upload,
  PartyPopper,
  Coins,
  Calendar,
  Lightbulb,
  Flag,
  Clock,
} from './icons'

/**
 * Текущая версия приложения для туториала
 * Импортируется из централизованного config
 */
export { APP_VERSION, APP_VERSION_FULL, APP_NAME } from '../config/appVersion'

/**
 * Маппинг строковых ключей на компоненты иконок Lucide
 * Используется для рендеринга иконок из конфигурации tutorial-data.ts
 */
export const TUTORIAL_ICON_MAP: Record<string, any> = {
  Rocket,
  Timer,
  Sliders,
  Settings,
  BarChart3,
  Download,
  List,
  Grid3x3,
  Activity,
  CalendarDays,
  Target,
  Zap,
  Eye,
  AlertTriangle,
  DollarSign,
  Sparkles,
  CheckCircle,
  Edit2,
  TrendingUp,
  Palette,
  Search,
  Bell,
  Undo,
  Save,
  Maximize2,
  ClipboardList,
  Monitor,
  Users,
  MessageCircle,
  BookOpen,
  PieChart,
  Scale,
  Shield,
  Upload,
  PartyPopper,
  Coins,
  Calendar,
  Lightbulb,
  Flag,
  Clock,
}

/**
 * Определение иконки на основе текста функции
 * Используется для динамического выбора иконки в списке новых функций
 */
export function getFeatureIcon(text: string) {
  const lower = text.toLowerCase()
  if (lower.includes('аналитика') || lower.includes('график')) return BarChart3
  if (lower.includes('календарь')) return CalendarDays
  if (lower.includes('ai') || lower.includes('умные') || lower.includes('новые')) return Sparkles
  if (lower.includes('безопасность') || lower.includes('защита') || lower.includes('логи')) return Shield
  if (lower.includes('базовая') || lower.includes('предиктивная') || lower.includes('описательная') || lower.includes('сравнительная')) return CheckCircle
  return CheckCircle
}
