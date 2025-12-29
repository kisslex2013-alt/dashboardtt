
import {
  Archive,
  BarChart2,
  Bell,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Layout,
  MessageSquare,
  Moon,
  Pause,
  Play,
  Settings,
  Shield,
  Smartphone,
  Sparkles,
  Speaker,
  Timer,
  Trash2,
  Volume2,
  Zap,
  Plus,
  Calendar as CalendarIcon,
  X,
  CreditCard,
  Target,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Activity,
  Award,
} from 'lucide-react'

// Анимации фавикона
export const animationStyles = [
  { value: 'pulse', label: 'Пульс', description: 'Плавная пульсация' },
  { value: 'blink', label: 'Мигание', description: 'Резкое мигание' },
  { value: 'rotate', label: 'Вращение', description: 'Вращение вокруг центра' },
  { value: 'wave', label: 'Волна', description: 'Расходящаяся волна' },
  { value: 'gradient', label: 'Градиент', description: 'Переливающийся градиент' },
  { value: 'morph', label: 'Морфинг', description: 'Изменение формы' },
  { value: 'particles', label: 'Частицы', description: 'Разлетающиеся частицы' },
  { value: 'breathe', label: 'Дыхание', description: 'Мягкое свечение' },
  { value: 'data-pulse', label: 'Data Pulse', description: 'Пульсация данных' },
]

export const animationSpeeds = [
  { value: 'slow', label: 'Медленно (4с)' },
  { value: 'normal', label: 'Нормально (2с)' },
  { value: 'fast', label: 'Быстро (1с)' },
]

export const presetColors = [
  { value: '#3b82f6', label: 'Blue', preview: 'bg-blue-500' },
  { value: '#10b981', label: 'Green', preview: 'bg-green-500' },
  { value: '#f59e0b', label: 'Orange', preview: 'bg-orange-500' },
  { value: '#ef4444', label: 'Red', preview: 'bg-red-500' },
  { value: '#8b5cf6', label: 'Purple', preview: 'bg-purple-500' },
  { value: '#ec4899', label: 'Pink', preview: 'bg-pink-500' },
  { value: '#06b6d4', label: 'Cyan', preview: 'bg-cyan-500' },
  { value: '#6366f1', label: 'Indigo', preview: 'bg-indigo-500' },
]

// Типы AI уведомлений
export const allTypes = [
  { value: 'burnout-warning', label: 'Выгорание' },
  { value: 'productivity-pattern', label: 'Паттерны продуктивности' },
  { value: 'monthly-forecast', label: 'Прогноз месяца' },
  { value: 'inefficient-categories', label: 'Неэффективные категории' },
  { value: 'achievement', label: 'Достижения' },
  { value: 'goal-risk', label: 'Риск цели' },
  { value: 'anomaly', label: 'Аномалия' },
] as const

export const allPriorities = [
  { value: 'low', label: 'Низкий' },
  { value: 'medium', label: 'Средний' },
  { value: 'high', label: 'Высокий' },
  { value: 'critical', label: 'Критический' },
] as const
