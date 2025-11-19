/**
 * 📘 Центральный файл TypeScript типов
 *
 * Этот файл содержит все основные типы, используемые в проекте.
 * Типы организованы по категориям для лучшей читаемости.
 */

// ===== Entry Types =====

/**
 * Запись времени (основная сущность приложения)
 */
export interface TimeEntry {
  id: string
  categoryId: string
  date: string
  start: string
  end: string
  duration: string | number
  earned: string | number
  rate: string | number
  category?: string // Название категории (опционально)
  description?: string
  createdAt?: string // ISO string
  updatedAt?: string // ISO string
}

/**
 * Категория работы
 */
export interface Category {
  id: string
  name: string
  color: string
  icon?: string
  rate?: number
}

// ===== Statistics Types =====

/**
 * Статистика за период
 */
export interface PeriodStats {
  totalHours: string
  totalEarned: string
  averageRate: string
  entriesCount: number
}

/**
 * Данные по категориям
 */
export interface CategoryData {
  hours: number
  earned: number
  count: number
  averageRate: string
}

/**
 * Группировка по категориям
 */
export interface CategoryGrouping {
  [category: string]: CategoryData
}

/**
 * Эффективность выполнения плана
 */
export interface Efficiency {
  percentage: string
  color: 'green' | 'yellow' | 'red' | 'gray'
  status: 'excellent' | 'good' | 'poor' | 'no-plan'
}

/**
 * Тренд изменения показателя
 */
export interface Trend {
  change: string
  percentage: string
  direction: 'up' | 'down' | 'stable'
  color: 'green' | 'red' | 'gray'
}

/**
 * Производительность по дню недели
 */
export interface DayProductivity {
  totalHours: number
  totalEarned: number
  entriesCount: number
  averageHours: string
}

/**
 * Производительность по всем дням недели
 */
export interface WeeklyProductivity {
  sunday: DayProductivity
  monday: DayProductivity
  tuesday: DayProductivity
  wednesday: DayProductivity
  thursday: DayProductivity
  friday: DayProductivity
  saturday: DayProductivity
}

/**
 * Данные по часам дня
 */
export interface HourlyData {
  totalHours: number
  totalEarned: number
  entriesCount: number
  efficiency: string
}

/**
 * Рекомендация по времени работы
 */
export interface TimeRecommendation {
  type: 'best-time' | 'worst-time'
  hour: number
  efficiency: string
  message: string
}

/**
 * Оптимальное время работы
 */
export interface OptimalTime {
  hourlyData: { [hour: number]: HourlyData }
  mostProductiveHour: number | null
  leastProductiveHour: number | null
  recommendations: TimeRecommendation[]
}

/**
 * Прогноз заработка
 */
export interface EarningsForecast {
  forecast: string
  averageDaily?: string
  trend?: Trend
  confidence: 'low' | 'medium' | 'high'
  message: string
}

// ===== Productivity Score Types =====

/**
 * Фактор продуктивности
 */
export interface ProductivityFactor {
  value: number // Баллы (из максимума)
  max: number // Максимум баллов
  percentage: number // Процент выполнения
}

/**
 * Все факторы продуктивности
 */
export interface ProductivityFactors {
  goalCompletion: ProductivityFactor
  consistency: ProductivityFactor
  focusTime: ProductivityFactor
  breakBalance: ProductivityFactor
}

/**
 * Результат расчета Productivity Score
 */
export interface ProductivityScore {
  score: number // Общий балл (0-100)
  factors: ProductivityFactors
}

// ===== Work Schedule Types =====

/**
 * Шаблон рабочего графика
 */
export type WorkScheduleTemplate = '5/2' | '2/2' | '3/3' | '5/5' | 'custom'

/**
 * Настройки рабочего графика
 */
export interface WorkScheduleSettings {
  workScheduleTemplate?: WorkScheduleTemplate
  workScheduleStartDay?: number // 1 = Monday, 7 = Sunday
  customWorkDates?: { [date: string]: boolean }
}

// ===== Animation Types =====

/**
 * Скорость анимации
 */
export type AnimationSpeed = 'fast' | 'normal' | 'slow'

/**
 * Тип анимации появления
 */
export type AppearAnimationType = 'fade' | 'slide-up' | 'slide-down' | 'slide-in-right'

/**
 * Тип анимации исчезновения
 */
export type DisappearAnimationType = 'fade' | 'slide-out-right'

/**
 * Интенсивность подъема
 */
export type LiftIntensity = 'light' | 'medium' | 'large'

/**
 * Интенсивность масштабирования
 */
export type ScaleIntensity = 'light' | 'medium' | 'expressive'

/**
 * Опции анимации кнопки
 */
export interface ButtonAnimationOptions {
  scaleIntensity?: ScaleIntensity
  includeLift?: boolean
}

/**
 * Опции анимации карточки
 */
export interface CardAnimationOptions {
  liftIntensity?: LiftIntensity
  includeScale?: boolean
}

// ===== Icon Types =====

/**
 * Пропсы для Iconify иконки
 */
export interface IconifyProps {
  width?: number | string
  height?: number | string
  color?: string
  [key: string]: any
}

/**
 * Компонент иконки (Lucide или Iconify)
 */
export type IconComponent = React.ComponentType<any>

// ===== Constants Types =====

/**
 * Ширины столбцов Grid view
 */
export interface GridColumnWidths {
  percentMargin: number
  insightsMargin: number
  totalMargin: number
}

/**
 * Ширины столбцов Table view
 */
export interface TableColumnWidths {
  checkbox: number
  time: number
  category: number
  hours: number
  income: number
}

/**
 * Замены иконок
 */
export interface IconReplacements {
  [iconId: string]: string
}

/**
 * Замены цветов кнопок
 */
export interface ButtonColorReplacements {
  [iconId: string]: string
}

/**
 * Настройки иконок
 */
export interface IconSettings {
  iconReplacements: IconReplacements
  buttonColorReplacements: ButtonColorReplacements
}

// ===== Store Types =====

/**
 * Результат создания бэкапа
 */
export interface BackupResult {
  success: boolean
  timestamp?: number
  error?: string
}

/**
 * Данные для бэкапа
 */
export interface BackupData {
  entries: TimeEntry[]
  categories: Category[]
  dailyGoal: number
  dailyHours: number
  theme: string
  timestamp: number
}

/**
 * Состояние EntriesStore
 */
export interface EntriesState {
  entries: TimeEntry[]
  addEntry: (entry: Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateEntry: (id: string | number, updates: Partial<TimeEntry>) => void
  deleteEntry: (id: string | number) => void
  clearEntries: () => void
  importEntries: (newEntries: TimeEntry[]) => void
  restoreEntries: (entries: TimeEntry[]) => void
  getEntriesByPeriod: (startDate: Date, endDate: Date) => TimeEntry[]
  getTodayEntries: () => TimeEntry[]
  getStatistics: (entries?: TimeEntry[] | null) => PeriodStats
  bulkUpdateCategory: (entryIds: Array<string | number>, categoryId: string) => void
  bulkDeleteEntries: (entryIds: Array<string | number>) => void
  getEntriesByIds: (entryIds: Array<string | number>) => TimeEntry[]
  createManualBackup: () => Promise<BackupResult>
  clearBackupTimer: () => void
  restoreFromBackup: (timestamp: number) => Promise<boolean>
}

/**
 * Настройки уведомлений
 */
export interface NotificationSettings {
  enabled: boolean
  sound: boolean
  volume: number
  hourlyReminder: boolean
  planCompleted: boolean
  soundNotificationsEnabled: boolean
  notificationInterval: number
  notificationSound: 'chime' | 'alert' | 'phone' | 'doorbell' | 'alarm' | 'notification' | 'bell' | 'beep'
  variant: number
  faviconAnimationEnabled: boolean
  faviconAnimationStyle: 'pulse' | 'blink' | 'rotate' | 'wave' | 'gradient' | 'morph' | 'particles' | 'breathe'
  faviconAnimationColor: string
  faviconAnimationSpeed: 'slow' | 'normal' | 'fast'
  breakRemindersEnabled: boolean
  breakReminderInterval: number
  overtimeAlertsEnabled: boolean
  overtimeWarningThreshold: number
  overtimeCriticalThreshold: number
  overtimeSoundAlert: boolean
}

/**
 * День рабочего графика
 */
export interface WorkScheduleDay {
  enabled: boolean
  hours: number
  rate: number
}

/**
 * Рабочий график по дням недели
 */
export interface WorkSchedule {
  monday: WorkScheduleDay
  tuesday: WorkScheduleDay
  wednesday: WorkScheduleDay
  thursday: WorkScheduleDay
  friday: WorkScheduleDay
  saturday: WorkScheduleDay
  sunday: WorkScheduleDay
}

/**
 * Дата выплаты
 */
export interface PaymentDate {
  id: string
  name: string
  day: number
  monthOffset: number
  customDate: string
  period: { start: number; end: number }
  color: string
  order: number
  enabled: boolean
}

/**
 * Настройки таймера
 */
export interface TimerSettings {
  sound: boolean
  hourlyAlert: boolean
  autoSave: boolean
  roundingMinutes: number
}

/**
 * Настройки Pomodoro
 */
export interface PomodoroSettings {
  enabled: boolean
  autoStartBreaks: boolean
  autoStartWork: boolean
  soundOnComplete: boolean
  showNotifications: boolean
}

/**
 * Настройки бэкапа
 */
export interface BackupSettings {
  autoBackupEnabled: boolean
  backupFrequency: 'daily' | 'weekly' | 'manual'
  maxBackups: number
}

/**
 * Настройки плавающей панели
 */
export interface FloatingPanelSettings {
  enabled: boolean
  size: 'compact' | 'expanded'
  theme: 'glass' | 'solid' | 'minimal'
  position: { x: number; y: number }
}

/**
 * Видимость графиков
 */
export interface ChartVisibility {
  dynamics: boolean
  trends: boolean
  categoryDistribution: boolean
  weekdayAnalysis: boolean
  rateDistribution: boolean
  scatter: boolean
  hourAnalysis: boolean
  forecast: boolean
  calendar: boolean
  categoryEfficiency: boolean
}

/**
 * Продвинутые настройки
 */
export interface AdvancedSettings {
  debugMode: boolean
  experimentalFeatures: boolean
}

/**
 * Статистика рабочего графика
 */
export interface WorkScheduleStats {
  workingDaysCount: number
  totalHoursPerWeek: number
  averageRate: string
  weeklyGoal: string
  monthlyGoal: string
}

/**
 * Состояние SettingsStore
 */
export interface SettingsState {
  theme: 'light' | 'dark' | 'auto'
  colorScheme: 'default' | 'claymorphism' | 'soft-pop' | 'neon-dark' | 'pastel-light' | 'corporate' | 'high-contrast' | 'auto'
  animations: boolean
  themeTransitionType: 'circle' | 'fade' | 'wipe' | 'blur' | 'rotate'
  listView: 'list' | 'grid' | 'timeline'
  defaultEntriesFilter: string
  defaultAnalyticsFilter: string
  defaultChartVisibility: ChartVisibility | null
  categories: Category[]
  dailyGoal: number
  dailyHours: number
  notifications: NotificationSettings
  workSchedule: WorkSchedule
  workScheduleTemplate: WorkScheduleTemplate
  workScheduleStartDay: number
  customWorkDates: { [date: string]: boolean }
  paymentDates: PaymentDate[]
  timer: TimerSettings
  pomodoro: PomodoroSettings
  autoSave: boolean
  autoSaveInterval: number
  backup: BackupSettings
  floatingPanel: FloatingPanelSettings
  chartVisibility: ChartVisibility
  chartDisplay: 'separate' | 'combined'
  combinedDynamicsType: 'bar' | 'line' | 'area'
  combinedRateType: 'bar' | 'line' | 'area'
  advanced: AdvancedSettings
  setTheme: (theme: 'light' | 'dark' | 'auto') => void
  setColorScheme: (colorScheme: string) => void
  applyColorScheme: (colorScheme: string) => void
  setThemeTransitionType: (type: 'circle' | 'fade' | 'wipe' | 'blur' | 'rotate') => void
  toggleAnimations: () => void
  setListView: (view: 'list' | 'grid' | 'timeline') => void
  setDefaultEntriesFilter: (filter: string) => void
  setDefaultAnalyticsFilter: (filter: string) => void
  updateChartVisibility: (visibility: Partial<ChartVisibility>) => void
  setDefaultChartVisibility: (visibility: ChartVisibility | null) => void
  updateSettings: (updates: Partial<SettingsState>) => void
  updateCategoryColors: () => Category[]
  addCategory: (category: Omit<Category, 'id'>) => void
  updateCategory: (id: string | number, updates: Partial<Category>) => void
  deleteCategory: (id: string | number) => void
  getCategory: (name: string) => Category | null
  addPaymentDate: (payment: Partial<PaymentDate>) => void
  updatePaymentDate: (id: string | number, updates: Partial<PaymentDate>) => void
  deletePaymentDate: (id: string | number) => void
  reorderPaymentDates: (newOrder: Array<string | number>) => void
  importCategories: (newCategories: Category[]) => void
  getWorkScheduleStats: () => WorkScheduleStats
  resetToDefaults: () => void
}

/**
 * Состояние HistoryStore
 */
export interface HistoryState {
  undoStack: TimeEntry[][]
  redoStack: TimeEntry[][]
  lastActionName: string
  pushToUndo: (state: TimeEntry[], actionName: string) => void
  undo: () => TimeEntry[] | null
  redo: () => TimeEntry[] | null
  canUndo: () => boolean
  canRedo: () => boolean
  getLastActionName: () => string
  clearHistory: () => void
}

// ===== Component Props Types =====

/**
 * Пропсы для Button компонента
 */
export interface ButtonProps {
  children?: React.ReactNode
  variant?: 'primary' | 'secondary' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  icon?: React.ComponentType<any>
  iconId?: string
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
  disabled?: boolean
  className?: string
  type?: 'button' | 'submit' | 'reset'
  hapticFeedback?: boolean
}

/**
 * Пропсы для BaseModal компонента
 */
export interface BaseModalProps {
  disableContentScroll?: boolean // Отключить автоматическую прокрутку контента
  fixedHeight?: boolean // Зафиксировать высоту окна (не изменяется при смене контента)
  isOpen: boolean
  onClose: () => void
  title: string
  titleIcon?: React.ComponentType<any> | React.ReactNode
  subtitle?: string
  children: React.ReactNode
  size?: 'small' | 'medium' | 'large' | 'full'
  showCloseButton?: boolean
  closeOnOverlayClick?: boolean
  className?: string
  footer?: React.ReactNode
}

/**
 * Пропсы для Input компонента
 */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ComponentType<any>
  containerClassName?: string
}

/**
 * Пропсы для IconSelect компонента
 */
export interface IconSelectProps {
  value: string
  onChange: (value: string) => void
  color?: string
}

/**
 * Пропсы для MonthPicker компонента
 */
export interface MonthPickerProps {
  value: string | null
  onChange: (value: string) => void
  onClose?: () => void
  inputRef?: React.RefObject<HTMLInputElement>
}

/**
 * Пропсы для CustomDatePicker компонента
 */
export interface CustomDatePickerProps {
  value: string | null
  onChange: (value: string) => void
  onClose?: () => void
  placeholder?: string
  inputRef?: React.RefObject<HTMLInputElement>
}

/**
 * Пропсы для InfoTooltip компонента
 */
export interface InfoTooltipProps {
  text: string
}

/**
 * Пропсы для ChartTypeSwitcher компонента
 */
export interface ChartTypeSwitcherProps {
  currentType?: 'bar' | 'line' | 'area'
  onChange: (type: 'bar' | 'line' | 'area') => void
}

/**
 * Пропсы для CategorySelect компонента
 */
export interface CategorySelectProps {
  value: string
  onChange: (value: string) => void
  options: Array<{
    name: string
    icon?: string
    color?: string
  }>
  onAddNew?: () => void
  placeholder?: string
  error?: string
}

/**
 * Пропсы для LoadingSpinner компонента
 */
export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  text?: string
}

/**
 * Пропсы для SimpleTooltip компонента
 */
export interface SimpleTooltipProps {
  children: React.ReactElement
  text: string
  position?: 'top' | 'bottom' | 'left' | 'right'
}

/**
 * Пропсы для ColorPicker компонента
 */
export interface ColorPickerProps {
  value?: string
  onChange: (color: string) => void
}

/**
 * Пропсы для SkeletonCard компонента
 */
export interface SkeletonCardProps {
  variant?: 'default' | 'entry' | 'stat' | 'chart'
  className?: string
}

/**
 * Пропсы для SkeletonList компонента
 */
export interface SkeletonListProps {
  count?: number
  variant?: 'default' | 'entry' | 'stat' | 'chart'
  className?: string
}

/**
 * Пропсы для SkeletonGrid компонента
 */
export interface SkeletonGridProps {
  count?: number
  variant?: 'default' | 'entry' | 'stat' | 'chart'
  columns?: number
  className?: string
}

/**
 * Пропсы для Toggle компонента
 */
export interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  className?: string
}

/**
 * Пропсы для EntryItem компонента
 */
export interface EntryItemProps {
  entry: TimeEntry
  onEdit: (entry: TimeEntry) => void
}

/**
 * Диапазон дат для фильтрации
 */
export interface DateRange {
  start: string
  end: string
}

/**
 * Пропсы для TrendsChart компонента
 */
export interface TrendsChartProps {
  entries?: TimeEntry[]
  dateFilter?: 'today' | 'week' | 'month' | 'year' | 'all' | 'custom'
  customDateRange?: DateRange
}

/**
 * Пропсы для DynamicsChart компонента
 */
export interface DynamicsChartProps {
  entries?: TimeEntry[]
  dateFilter?: 'today' | 'week' | 'month' | 'year' | 'all' | 'custom'
  customDateRange?: DateRange
}

/**
 * Пропсы для EditEntryModal компонента
 */
export interface EditEntryModalProps {
  isOpen: boolean
  onClose: () => void
  entry: TimeEntry | null
  onSave?: (entry: TimeEntry) => void
}

/**
 * Пропсы для CategoriesModal компонента
 */
export interface CategoriesModalProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * Пропсы для BackupModal компонента
 */
export interface BackupModalProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * Пропсы для ImportModal компонента
 */
export interface ImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: (data: any, mode: 'replace' | 'merge') => Promise<void>
}

/**
 * Пропсы для ConfirmModal компонента
 */
export interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
  onConfirm: () => void | Promise<void>
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
}

/**
 * Пропсы для EntriesList компонента
 */
export interface EntriesListProps {
  entries?: TimeEntry[]
  dateFilter?: string
  customDateRange?: DateRange
  onEdit?: (entry: TimeEntry) => void
}

/**
 * Пропсы для EntriesListHeader компонента
 */
export interface EntriesListHeaderProps {
  view: 'list' | 'grid' | 'timeline'
  onViewChange: (view: 'list' | 'grid' | 'timeline') => void
  selectedCount: number
  onSelectAll?: () => void
  onDeselectAll?: () => void
}

/**
 * Пропсы для BulkActionsPanel компонента
 */
export interface BulkActionsPanelProps {
  selectedIds: Array<string | number>
  onCancel: () => void
  onBulkDelete: () => void
  onBulkChangeCategory: () => void
}

/**
 * Пропсы для InsightsPanel компонента
 */
export interface InsightsPanelProps {
  entries?: TimeEntry[]
  dateFilter?: string
  customDateRange?: DateRange
}

/**
 * Пропсы для StatisticsDashboard компонента
 */
export interface StatisticsDashboardProps {
  entries?: TimeEntry[]
  dateFilter?: string
  customDateRange?: DateRange
}