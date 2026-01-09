import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { generateUUID } from '../utils/uuid'
import type { SettingsState, Category, WorkScheduleStats, ExportReminderSettings, UserProfile } from '../types'

/**
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 *
 * Это хранилище содержит все настройки приложения:
 * - Тема (светлая/темная)
 * - Категории работы с ставками
 * - Цели и планы
 * - Настройки уведомлений
 * - Рабочий график
 */

// Дефолтные категории работы
// 🎨 Семантические цвета для интуитивного понимания типа работы (Phase 1: Quick Wins)
const SEMANTIC_COLORS = {
  deepWork: '#6366F1',     // Indigo - глубокая концентрация (разработка, код)
  communication: '#F59E0B', // Amber - общение и встречи
  learning: '#8B5CF6',     // Purple - обучение и рост
  routine: '#64748B',      // Slate - рутина и администрирование
  creative: '#EC4899',     // Pink - креативная работа (дизайн)
  personal: '#10B981',     // Green - личные дела
  consulting: '#06B6D4',   // Cyan - консультации и менеджмент
  other: '#6B7280',        // Gray - остальное
}

const defaultCategories = [
  { id: 'remix', name: 'remix', icon: 'Code', rate: 500, color: SEMANTIC_COLORS.deepWork },
  { id: 'marketing', name: 'Маркетинг', icon: 'TrendingUp', rate: 600, color: SEMANTIC_COLORS.communication },
  { id: 'development', name: 'Разработка', icon: 'Code', rate: 1500, color: SEMANTIC_COLORS.deepWork },
  { id: 'design', name: 'Дизайн', icon: 'Palette', rate: 1200, color: SEMANTIC_COLORS.creative },
  { id: 'management', name: 'Менеджмент', icon: 'Users', rate: 1300, color: SEMANTIC_COLORS.consulting },
  { id: 'consulting', name: 'Консультации', icon: 'MessageCircle', rate: 1400, color: SEMANTIC_COLORS.consulting },
  { id: 'teaching', name: 'Обучение', icon: 'BookOpen', rate: 800, color: SEMANTIC_COLORS.learning },
  { id: 'other', name: 'Другое', icon: 'MoreHorizontal', rate: 1000, color: SEMANTIC_COLORS.other },
]

export const DEFAULT_EXPORT_REMINDER_SETTINGS: ExportReminderSettings = {
  enabled: true,
  showWhenNeverExported: true,
  minEntriesForReminder: 1,
  enableOvertimeReminder: true,
  enableTimeBasedReminder: true,
  remindAfterDays: 7,
  showOncePerDay: true,
  minIntervalMinutes: 720, // 12 часов
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      // Тема приложения
      userProfile: {
        name: 'User',
        email: 'user@example.com',
        avatar: null
      },
      theme: 'dark', // По умолчанию темная тема
      colorScheme: 'default', // 'default' | 'claymorphism' | 'soft-pop' | 'neon-dark' | 'pastel-light' | 'corporate' | 'high-contrast' | 'auto' - цветовая схема оформления
      animations: true,
      themeTransitionType: 'blur', // Тип анимации перехода темы: 'circle', 'fade', 'wipe', 'blur', 'rotate'

      // Вид отображения списка записей
      listView: 'list', // 'list' | 'grid' | 'timeline'

      // Режим отображения: Focus (только работа) или Analytics (полная аналитика)
      viewMode: 'analytics', // 'focus' | 'analytics'

      // Фильтры по умолчанию (независимые для каждого блока)
      defaultEntriesFilter: 'month', // Фильтр для блока "Записи времени"
      defaultAnalyticsFilter: 'month', // Фильтр для блока "Аналитика и графики"

      // Дефолтная конфигурация видимости графиков
      defaultChartVisibility: null, // null означает использование стандартной конфигурации (все графики включены)

      // Категории работы
      categories: defaultCategories,

      // Категория по умолчанию (для таймеров и новых записей)
      defaultCategory: 'remix', // ID или название категории по умолчанию

      // Цели
      dailyGoal: 8000, // ₽ в день
      dailyHours: 8, // часов в день

      // Настройки уведомлений
      notifications: {
        enabled: true,
        sound: true,
        volume: 80,
        hourlyReminder: true,
        planCompleted: true,
        // Периодические звуковые уведомления во время работы таймера
        soundNotificationsEnabled: true,
        notificationInterval: 30, // минут между уведомлениями
        notificationSound: 'chime', // 'chime' | 'alert' | 'phone' | 'doorbell' | 'alarm' | 'notification' | 'bell' | 'beep' | 'ping' | 'gentle' | 'soft' | 'zen' | 'focus' | 'breeze' | 'crystal' | 'harmony' | 'whisper' | 'bloom'
        // Визуальный вариант уведомления
        variant: 6, // 1-6 (по умолчанию 6 - Neon Glow ✨)
        // Анимация фавикона
        faviconAnimationEnabled: true,
        faviconAnimationStyle: 'pulse', // 'pulse' | 'blink' | 'rotate' | 'wave' | 'gradient' | 'morph' | 'particles' | 'breathe'
        faviconAnimationColor: '#3b82f6', // синий (основной цвет проекта)
        faviconAnimationSpeed: 'normal', // 'slow' | 'normal' | 'fast'
        // Break reminders - напоминания о перерывах (Phase 1: Quick Wins)
        breakRemindersEnabled: true,
        breakReminderInterval: 2, // часов работы до напоминания о перерыве
        // Overtime alerts - предупреждения о переработке (Phase 1: Quick Wins)
        overtimeAlertsEnabled: true,
        overtimeWarningThreshold: 1.0, // коэффициент превышения нормы для предупреждения (например, 1.0 = 100% = 8 часов при норме 8)
        overtimeCriticalThreshold: 1.5, // коэффициент превышения нормы для критического предупреждения (например, 1.5 = 150% = 12 часов при норме 8)
        overtimeSoundAlert: true, // звуковое уведомление при переработке
        exportReminder: { ...DEFAULT_EXPORT_REMINDER_SETTINGS },
        // Настройки отображения уведомлений по категориям
        display: {
          enabled: true, // Общее включение/выключение всех уведомлений
          categories: {
            timer: { enabled: true, types: { success: true, error: true, warning: true, info: true } },
            entries: { enabled: true, types: { success: true, error: true, warning: true, info: true } },
            categories: { enabled: true, types: { success: true, error: true, warning: true, info: true } },
            exportImport: { enabled: true, types: { success: true, error: true, warning: true, info: true } },
            backups: { enabled: true, types: { success: true, error: true, warning: true, info: true } },
            settings: { enabled: true, types: { success: true, error: true, warning: true, info: true } },
            filters: { enabled: true, types: { success: true, error: true, warning: true, info: true } },
            actions: { enabled: true, types: { success: true, error: true, warning: true, info: true } },
            cleanup: { enabled: true, types: { success: true, error: true, warning: true, info: true } },
            colors: { enabled: true, types: { success: true, error: true, warning: true, info: true } },
            validation: { enabled: true, types: { success: false, error: true, warning: true, info: false } }, // Ошибки валидации всегда показывать
            overtime: {
              enabled: true,
              types: { success: false, error: false, warning: true, info: false },
              conditions: {
                threshold: 1.0, // Порог предупреждения (коэффициент)
                criticalThreshold: 1.5, // Критический порог (коэффициент)
                onlyWorkDays: false, // Учитывать только рабочие дни
              },
              frequency: {
                showOncePerDay: true, // Показывать только один раз в день
                minInterval: 60, // Минимальный интервал между показами (минуты)
              },
            },
            breaks: {
              enabled: true,
              types: { success: false, error: false, warning: true, info: true },
              conditions: {
                minDurationMinutes: 0, // Минимальная длительность работы (минуты)
                onlyActiveWork: true, // Только активная работа
              },
              frequency: {
                showEveryXHours: 2, // Показывать каждые 2 часа
                minInterval: 30, // Минимальный интервал между показами (минуты)
              },
            },
            autoSync: { enabled: true, types: { success: true, error: true, warning: false, info: true } },
          },
        },
      },

      // Рабочий график по дням недели
      workSchedule: {
        monday: { enabled: true, hours: 8, rate: 1000 },
        tuesday: { enabled: true, hours: 8, rate: 1000 },
        wednesday: { enabled: true, hours: 8, rate: 1000 },
        thursday: { enabled: true, hours: 8, rate: 1000 },
        friday: { enabled: true, hours: 8, rate: 1000 },
        saturday: { enabled: false, hours: 0, rate: 1000 },
        sunday: { enabled: false, hours: 0, rate: 1000 },
      },

      // Шаблон рабочего графика
      workScheduleTemplate: '5/2', // '5/2', '2/2', '3/3', '5/5'

      // Начало рабочей недели (1 = Понедельник, 7 = Воскресенье)
      workScheduleStartDay: 1,

      // Кастомные рабочие дни (объект с датами в формате YYYY-MM-DD)
      // { '2024-10-30': false } означает что 30.10.2024 - выходной
      customWorkDates: {},

      // Настройки дат выплат
      // Гибкая система настройки выплат с возможностью настройки дат, периодов и названий
      paymentDates: [
        {
          id: 'payment-1',
          name: '1/2 месяца',
          day: 25,
          monthOffset: 0, // 0 = текущий месяц, 1 = следующий, -1 = предыдущий
          customDate: '', // Конкретная дата выплаты (ДД.ММ), если указана - используется вместо day и monthOffset
          period: { start: 1, end: 15 }, // Период расчета (1-31)
          color: '#10B981', // Цвет для визуализации
          order: 1, // Порядок отображения
          enabled: true, // Включена ли выплата
        },
        {
          id: 'payment-2',
          name: '2/2 месяца',
          day: 10,
          monthOffset: 1, // Следующего месяца
          customDate: '', // Конкретная дата выплаты (ДД.ММ), если указана - используется вместо day и monthOffset
          period: { start: 16, end: 31 },
          color: '#06B6D4',
          order: 2,
          enabled: true,
        },
      ],

      // Настройки таймера
      timer: {
        sound: true,
        hourlyAlert: true,
        autoSave: true,
        roundingMinutes: 15, // Округление времени до 15 минут
      },

      // Настройки Pomodoro таймера (Phase 2: Core Features)
      pomodoro: {
        enabled: false, // Включен ли Pomodoro режим
        autoStartBreaks: true, // Автоматически запускать перерывы
        autoStartWork: false, // Автоматически запускать работу после перерыва
        soundOnComplete: true, // Звук при завершении интервала
        showNotifications: true, // Показывать уведомления
      },

      // Автосохранение
      autoSave: true,
      autoSaveInterval: 30, // секунды

      // Бэкапы
      backup: {
        autoBackupEnabled: true,
        backupFrequency: 'daily', // daily, weekly, manual
        maxBackups: 10,
      },

      // Настройки плавающей панели таймера
      floatingPanel: {
        enabled: false, // ИЗМЕНЕНО: По умолчанию выключена
        size: 'compact', // 'compact' | 'expanded'
        theme: 'glass', // 'glass' | 'solid' | 'minimal'
        position: { x: 20, y: 20 }, // позиция на экране
      },

      // Настройки видимости графиков
      // ИСПРАВЛЕНО: При первом открытии по умолчанию активны только "Динамика доходов" и "Тренды"
      chartVisibility: {
        dynamics: true, // Динамика доходов - активна по умолчанию
        trends: true, // Тренды - активна по умолчанию
        categoryDistribution: false, // Распределение по категориям
        weekdayAnalysis: false, // Анализ дней недели (объединенный: часы + доход)
        rateDistribution: false, // Распределение ставок
        scatter: false, // Часы vs Доход
        hourAnalysis: false, // Анализ часов дня (объединенный: доход + ставка)
        forecast: true, // Прогноз заработка
        calendar: false, // Календарь доходов
        categoryEfficiency: false, // Доходы по категориям
        whatIf: true, // What-If Калькулятор (Predictive Analytics)
        seasonality: true, // Сезонность доходов
      },

      // Режим отображения графиков
      chartDisplay: 'combined', // 'separate' | 'combined'

      // Типы графиков в объединенном режиме
      combinedDynamicsType: 'area', // 'bar' | 'line' | 'area'
      combinedRateType: 'line', // 'bar' | 'line' | 'area'

      // Продвинутые настройки
      advanced: {
        debugMode: false,
        experimentalFeatures: false,
      },

      /**
       * Устанавливает тему приложения
       * @export interface SettingsState {
  userProfile: UserProfile
  theme: 'light' | 'dark' | 'auto'
       */
      setTheme: theme => {
        set({ theme })
        // Применяем класс к HTML элементу
        if (theme === 'dark') {
          document.documentElement.classList.add('dark')
          document.documentElement.classList.remove('light')
        } else if (theme === 'light') {
          document.documentElement.classList.add('light')
          document.documentElement.classList.remove('dark')
        } else {
          // auto - определяем по системной теме
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
          if (prefersDark) {
            document.documentElement.classList.add('dark')
            document.documentElement.classList.remove('light')
          } else {
            document.documentElement.classList.add('light')
            document.documentElement.classList.remove('dark')
          }
        }
        // Применяем colorScheme после изменения темы
        const { colorScheme } = get()
        get().applyColorScheme(colorScheme)
      },

      /**
       * Устанавливает цветовую схему оформления
       * @param {string} colorScheme - 'default' | 'claymorphism' | 'soft-pop' | 'neon-dark' | 'pastel-light' | 'corporate' | 'high-contrast' | 'auto'
       */
      setColorScheme: colorScheme => {
        set({ colorScheme })
        get().applyColorScheme(colorScheme)
      },

      /**
       * Применяет цветовую схему к документу
       * @param {string} colorScheme - 'default' | 'claymorphism' | 'soft-pop' | 'neon-dark' | 'pastel-light' | 'corporate' | 'high-contrast' | 'auto'
       */
      applyColorScheme: colorScheme => {
        if (colorScheme === 'auto') {
          // Определяем по системным настройкам (можно расширить логику)
          // Пока используем 'default' для auto
          document.documentElement.setAttribute('data-color-scheme', 'default')
        } else {
          document.documentElement.setAttribute('data-color-scheme', colorScheme)
        }
      },

      /**
       * Устанавливает тип анимации перехода темы
       * @param {string} type - 'circle', 'fade', 'wipe', 'blur', 'rotate'
       */
      setThemeTransitionType: type => set({ themeTransitionType: type }),

      /**
       * Переключает анимации
       */
      toggleAnimations: () => set(state => ({ animations: !state.animations })),

      /**
       * Устанавливает вид отображения списка записей
       * @param {string} view - 'list', 'grid', 'timeline'
       */
      setListView: view => set({ listView: view }),

      /**
       * Устанавливает режим отображения (focus/analytics)
       * @param {string} mode - 'focus' | 'analytics'
       */
      setViewMode: mode => set({ viewMode: mode }),

      /**
       * Переключает режим отображения между focus и analytics
       */
      toggleViewMode: () => set(state => ({ 
        viewMode: state.viewMode === 'focus' ? 'analytics' : 'focus' 
      })),

      /**
       * Устанавливает фильтр по умолчанию для блока "Записи времени"
       * @param {string} filter - 'today', 'halfMonth1', 'halfMonth2', 'month', 'year', 'all', 'custom'
       */
      setDefaultEntriesFilter: filter => set({ defaultEntriesFilter: filter }),

      /**
       * Устанавливает фильтр по умолчанию для блока "Аналитика и графики"
       * @param {string} filter - 'today', 'halfMonth1', 'halfMonth2', 'month', 'year', 'all', 'custom'
       */
      setDefaultAnalyticsFilter: filter => set({ defaultAnalyticsFilter: filter }),

      /**
       * Обновляет видимость графиков
       * @param {Object} visibility - объект с ключами видимости графиков
       */
      updateChartVisibility: visibility =>
        set(state => ({
          chartVisibility: {
            ...state.chartVisibility,
            ...visibility,
          },
        })),

      /**
       * Устанавливает дефолтную конфигурацию видимости графиков
       * @param {Object} visibility - объект с видимостью графиков
       */
      setDefaultChartVisibility: visibility =>
        set({
          defaultChartVisibility: visibility,
        }),

      /**
       * Обновляет настройки
       * @param {Object} updates - объект с новыми настройками
       */
      updateSettings: updates =>
        set(state => {
          // Глубокое слияние для вложенных объектов
          const merged = { ...state }
          for (const key in updates) {
            if (
              typeof updates[key] === 'object' &&
              updates[key] !== null &&
              !Array.isArray(updates[key])
            ) {
              merged[key] = { ...merged[key], ...updates[key] }
            } else {
              merged[key] = updates[key]
            }
          }
          return merged
        }),

      /**
       * 🎨 Обновляет цвета категорий на семантические (Phase 1: Quick Wins)
       * Сохраняет все остальные параметры категорий (ставки, иконки, имена)
       */
      updateCategoryColors: () => {
        const currentCategories = get().categories

        const updatedCategories = currentCategories.map(cat => {
          const name = cat.name.toLowerCase()
          let newColor = cat.color

          // Определяем семантический цвет по названию категории
          if (name.includes('remix') || name.includes('development') || name.includes('разработ')) {
            newColor = SEMANTIC_COLORS.deepWork
          } else if (name.includes('marketing') || name.includes('маркетинг')) {
            newColor = SEMANTIC_COLORS.communication
          } else if (name.includes('design') || name.includes('дизайн')) {
            newColor = SEMANTIC_COLORS.creative
          } else if (name.includes('management') || name.includes('менеджмент') || name.includes('consulting') || name.includes('консультац')) {
            newColor = SEMANTIC_COLORS.consulting
          } else if (name.includes('teaching') || name.includes('обучен')) {
            newColor = SEMANTIC_COLORS.learning
          } else if (name.includes('other') || name.includes('другое')) {
            newColor = SEMANTIC_COLORS.other
          }

          return { ...cat, color: newColor }
        })

        set({ categories: updatedCategories })
        return updatedCategories
      },

      /**
       * Добавляет новую категорию
       * @param {Object} category - объект категории
       */
      addCategory: category =>
        set(state => ({
          categories: [...state.categories, { ...category, id: generateUUID() }],
        })),

      /**
       * Обновляет категорию
       * @param {string} id - ID категории
       * @param {Object} updates - обновления
       */
      updateCategory: (id, updates) => {
        // ✅ СТАНДАРТИЗАЦИЯ ID: Конвертируем в строку для корректного сравнения
        const idString = String(id)
        return set(state => ({
          categories: state.categories.map(cat =>
            String(cat.id) === idString ? { ...cat, ...updates } : cat
          ),
        }))
      },

      /**
       * Удаляет категорию
       * @param {string} id - ID категории
       */
      deleteCategory: id => {
        // ✅ СТАНДАРТИЗАЦИЯ ID: Конвертируем в строку для корректного сравнения
        const idString = String(id)
        return set(state => ({
          categories: state.categories.filter(cat => String(cat.id) !== idString),
        }))
      },

      /**
       * Получает категорию по названию
       * @param {string} name - название категории
       * @returns {Object|null} объект категории или null
       */
      getCategory: name => {
        const { categories } = get()
        return categories.find(cat => cat.name === name) || null
      },

      /**
       * Устанавливает категорию по умолчанию
       * @param {string} categoryIdOrName - ID или название категории
       */
      setDefaultCategory: categoryIdOrName =>
        set({
          defaultCategory: categoryIdOrName,
        }),

      /**
       * Добавляет новую дату выплаты
       * @param {Object} payment - объект выплаты
       */
      addPaymentDate: payment =>
        set(state => {
          const newPayment = {
            ...payment,
            id: payment.id || generateUUID(),
            order: payment.order !== undefined ? payment.order : state.paymentDates.length + 1,
            enabled: payment.enabled !== undefined ? payment.enabled : true,
          }
          return {
            paymentDates: [...state.paymentDates, newPayment],
          }
        }),

      /**
       * Обновляет дату выплаты
       * @param {string} id - ID выплаты
       * @param {Object} updates - обновления
       */
      updatePaymentDate: (id, updates) => {
        // ✅ СТАНДАРТИЗАЦИЯ ID: Конвертируем в строку для корректного сравнения
        const idString = String(id)
        return set(state => ({
          paymentDates: state.paymentDates.map(p =>
            String(p.id) === idString ? { ...p, ...updates } : p
          ),
        }))
      },

      /**
       * Удаляет дату выплаты
       * @param {string} id - ID выплаты
       */
      deletePaymentDate: id => {
        // ✅ СТАНДАРТИЗАЦИЯ ID: Конвертируем в строку для корректного сравнения
        const idString = String(id)
        return set(state => ({
          paymentDates: state.paymentDates
            .filter(p => String(p.id) !== idString)
            .map((p, index) => ({ ...p, order: index + 1 })), // Перенумеровываем порядок
        }))
      },

      /**
       * Изменяет порядок выплат
       * @param {Array<string>} newOrder - массив ID выплат в новом порядке
       */
      reorderPaymentDates: newOrder => {
        // ✅ СТАНДАРТИЗАЦИЯ ID: Конвертируем все ID в строки для корректного сравнения
        const newOrderStrings = newOrder.map(id => String(id))
        return set(state => ({
          paymentDates: newOrderStrings
            .map((idString, index) => {
              const payment = state.paymentDates.find(p => String(p.id) === idString)
              return payment ? { ...payment, order: index + 1 } : null
            })
            .filter(Boolean), // Удаляем null значения
        }))
      },

      /**
       * Импортирует категории из JSON
       * @param {Array} newCategories - массив импортируемых категорий
       */
      importCategories: newCategories => {
        set({ categories: newCategories })
      },

      /**
       * Получает статистику рабочего графика
       * @returns {Object} статистика графика
       */
      getWorkScheduleStats: () => {
        const { workSchedule } = get()
        const days = Object.values(workSchedule)
        const workingDays = days.filter(day => day.enabled)

        const totalHoursPerWeek = workingDays.reduce((sum, day) => sum + day.hours, 0)
        const averageRate = workingDays.reduce((sum, day) => sum + day.rate, 0) / workingDays.length
        const weeklyGoal = workingDays.reduce((sum, day) => sum + day.hours * day.rate, 0)

        return {
          workingDaysCount: workingDays.length,
          totalHoursPerWeek,
          averageRate: averageRate.toFixed(2),
          weeklyGoal: weeklyGoal.toFixed(2),
          monthlyGoal: (weeklyGoal * 4.33).toFixed(2), // Примерно 4.33 недели в месяце
        }
      },

      /**
       * Сбрасывает все настройки к дефолтным
       */
      resetToDefaults: () =>
        set({
        theme: 'dark',
        colorScheme: 'default',
        animations: true,
        themeTransitionType: 'blur',
          listView: 'list',
          categories: defaultCategories,
          dailyGoal: 8000,
          dailyHours: 8,
          notifications: {
            enabled: true,
            sound: true,
            volume: 80,
            hourlyReminder: true,
            planCompleted: true,
            soundNotificationsEnabled: true,
            notificationInterval: 30,
            notificationSound: 'chime',
            variant: 6, // Визуальный вариант уведомления: 1-6 (Neon Glow по умолчанию)
            faviconAnimationEnabled: true,
            faviconAnimationStyle: 'pulse',
            faviconAnimationColor: '#3b82f6',
            faviconAnimationSpeed: 'normal',
            breakRemindersEnabled: true,
            breakReminderInterval: 2,
            overtimeAlertsEnabled: true,
            overtimeWarningThreshold: 1.0,
            overtimeCriticalThreshold: 1.5,
            overtimeSoundAlert: true,
            exportReminder: { ...DEFAULT_EXPORT_REMINDER_SETTINGS },
          },
          pomodoro: {
            enabled: false,
            autoStartBreaks: true,
            autoStartWork: false,
            soundOnComplete: true,
            showNotifications: true,
          },
          workSchedule: {
            monday: { enabled: true, hours: 8, rate: 1000 },
            tuesday: { enabled: true, hours: 8, rate: 1000 },
            wednesday: { enabled: true, hours: 8, rate: 1000 },
            thursday: { enabled: true, hours: 8, rate: 1000 },
            friday: { enabled: true, hours: 8, rate: 1000 },
            saturday: { enabled: false, hours: 0, rate: 1000 },
            sunday: { enabled: false, hours: 0, rate: 1000 },
          },
          workScheduleTemplate: '5/2',
          workScheduleStartDay: 1,
          customWorkDates: {},
          timer: {
            sound: true,
            hourlyAlert: true,
            autoSave: true,
            roundingMinutes: 15,
          },
          autoSave: true,
          autoSaveInterval: 30,
          backup: {
            autoBackupEnabled: true,
            backupFrequency: 'daily',
            maxBackups: 10,
          },
          floatingPanel: {
            enabled: true,
            size: 'compact',
            theme: 'glass',
            position: { x: 20, y: 20 },
          },
          chartVisibility: {
            dynamics: true,
            trends: true,
            categoryDistribution: true,
            weekdayAnalysis: true,
            rateDistribution: true,
            scatter: true,
            hourAnalysis: true,
            forecast: true,
            calendar: true,
            categoryEfficiency: true,
            whatIf: true,
            seasonality: true,
          },
          chartDisplay: 'combined',
          combinedDynamicsType: 'area',
          combinedRateType: 'line',
          advanced: {
            debugMode: false,
            experimentalFeatures: false,
          },
        }),
    }),
    {
      name: 'time-tracker-settings',
      version: 6, // ✅ Увеличили версию для включения Neon Glow уведомлений
      // Миграция для существующих пользователей
      migrate: (persistedState, version) => {
        const newState = { ...persistedState }

        // Миграция v0 → v1: добавляем paymentDates если их нет
        if (version < 1) {
          if (
            !newState.paymentDates ||
            newState.paymentDates.length === 0
          ) {
            newState.paymentDates = [
              {
                id: 'payment-1',
                name: '1/2 месяца',
                day: 25,
                monthOffset: 0,
                period: { start: 1, end: 15 },
                color: '#10B981',
                order: 1,
                enabled: true,
              },
              {
                id: 'payment-2',
                name: '2/2 месяца',
                day: 10,
                monthOffset: 1,
                period: { start: 16, end: 31 },
                color: '#06B6D4',
                order: 2,
                enabled: true,
              },
            ]
          }
        }

        // 🎨 Миграция v1 → v2: обновляем цвета категорий на семантические (Phase 1: Quick Wins)
        if (version < 2 && newState.categories) {
          newState.categories = newState.categories.map(cat => {
            const name = cat.name.toLowerCase()
            let newColor = cat.color

            // Определяем семантический цвет по названию категории
            if (name.includes('remix') || name.includes('development') || name.includes('разработ')) {
              newColor = SEMANTIC_COLORS.deepWork
            } else if (name.includes('marketing') || name.includes('маркетинг')) {
              newColor = SEMANTIC_COLORS.communication
            } else if (name.includes('design') || name.includes('дизайн')) {
              newColor = SEMANTIC_COLORS.creative
            } else if (name.includes('management') || name.includes('менеджмент') || name.includes('consulting') || name.includes('консультац')) {
              newColor = SEMANTIC_COLORS.consulting
            } else if (name.includes('teaching') || name.includes('обучен')) {
              newColor = SEMANTIC_COLORS.learning
            } else if (name.includes('other') || name.includes('другое')) {
              newColor = SEMANTIC_COLORS.other
            }

            return { ...cat, color: newColor }
          })

          console.log('🎨 Цвета категорий обновлены на семантические!')
        }

        // Миграция v2 → v3: добавляем whatIf в chartVisibility
        if (version < 3) {
          if (newState.chartVisibility && typeof newState.chartVisibility.whatIf === 'undefined') {
            newState.chartVisibility.whatIf = true
          }
        }

        // Миграция v3 → v4: добавляем seasonality в chartVisibility
        if (version < 4) {
          if (newState.chartVisibility && typeof newState.chartVisibility.seasonality === 'undefined') {
            newState.chartVisibility.seasonality = true
          }
        }

        // Миграция v4 → v5: включаем forecast в chartVisibility для существующих пользователей
        if (version < 5) {
          if (newState.chartVisibility && newState.chartVisibility.forecast === false) {
            newState.chartVisibility.forecast = true
          }
        }

        // Миграция v5 → v6: включаем Neon Glow уведомления (вариант 6)
        if (version < 6) {
          if (newState.notifications) {
            newState.notifications.variant = 6
          }
        }

        return newState
      },
    }
  )
)

// ===== Атомарные селекторы (рекомендуемое использование) =====
export const useTheme = () => useSettingsStore(state => state.theme)
export const useColorScheme = () => useSettingsStore(state => state.colorScheme)
export const useAnimationsEnabled = () => useSettingsStore(state => state.animations)
export const useCategories = () => useSettingsStore(state => state.categories)
export const useDailyGoal = () => useSettingsStore(state => state.dailyGoal)
export const useDailyHours = () => useSettingsStore(state => state.dailyHours)
export const useChartVisibility = () => useSettingsStore(state => state.chartVisibility)
export const useChartDisplay = () => useSettingsStore(state => state.chartDisplay)
export const useCombinedDynamicsType = () => useSettingsStore(state => state.combinedDynamicsType)
export const useCombinedRateType = () => useSettingsStore(state => state.combinedRateType)
export const useNotificationsSettings = () => useSettingsStore(state => state.notifications)
export const useWorkSchedule = () => useSettingsStore(state => state.workSchedule)
export const useWorkScheduleTemplate = () => useSettingsStore(state => state.workScheduleTemplate)
export const useWorkScheduleStartDay = () => useSettingsStore(state => state.workScheduleStartDay)
export const useCustomWorkDates = () => useSettingsStore(state => state.customWorkDates)
export const usePaymentDates = () => useSettingsStore(state => state.paymentDates)
export const useFloatingPanel = () => useSettingsStore(state => state.floatingPanel)
export const useListView = () => useSettingsStore(state => state.listView)
export const useViewMode = () => useSettingsStore(state => state.viewMode)
export const useSetViewMode = () => useSettingsStore(state => state.setViewMode)
export const useToggleViewMode = () => useSettingsStore(state => state.toggleViewMode)
export const useDefaultEntriesFilter = () => useSettingsStore(state => state.defaultEntriesFilter)
export const useDefaultAnalyticsFilter = () => useSettingsStore(state => state.defaultAnalyticsFilter)
export const useDefaultChartVisibility = () => useSettingsStore(state => state.defaultChartVisibility)
export const useThemeTransitionType = () => useSettingsStore(state => state.themeTransitionType)
export const usePomodoroSettings = () => useSettingsStore(state => state.pomodoro)

// Actions
export const useSetTheme = () => useSettingsStore(state => state.setTheme)
export const useSetColorScheme = () => useSettingsStore(state => state.setColorScheme)
export const useSetThemeTransitionType = () => useSettingsStore(state => state.setThemeTransitionType)
export const useUpdateSettings = () => useSettingsStore(state => state.updateSettings)
export const useUpdateChartVisibility = () => useSettingsStore(state => state.updateChartVisibility)
export const useSetDefaultChartVisibility = () => useSettingsStore(state => state.setDefaultChartVisibility)
export const useAddCategory = () => useSettingsStore(state => state.addCategory)
export const useUpdateCategory = () => useSettingsStore(state => state.updateCategory)
export const useDeleteCategory = () => useSettingsStore(state => state.deleteCategory)
export const useSetListView = () => useSettingsStore(state => state.setListView)
export const useSetDefaultEntriesFilter = () => useSettingsStore(state => state.setDefaultEntriesFilter)
export const useUserProfile = () => useSettingsStore(state => state.userProfile)
export const useSetDefaultAnalyticsFilter = () => useSettingsStore(state => state.setDefaultAnalyticsFilter)
export const useAddPaymentDate = () => useSettingsStore(state => state.addPaymentDate)
export const useUpdatePaymentDate = () => useSettingsStore(state => state.updatePaymentDate)
export const useDeletePaymentDate = () => useSettingsStore(state => state.deletePaymentDate)


export const useReorderPaymentDates = () => useSettingsStore(state => state.reorderPaymentDates)
export const useUpdateCategoryColors = () => useSettingsStore(state => state.updateCategoryColors)
export const useDefaultCategory = () => useSettingsStore(state => state.defaultCategory)
export const useSetDefaultCategory = () => useSettingsStore(state => state.setDefaultCategory)
export const useWorkScheduleStats = () => useSettingsStore(state => state.getWorkScheduleStats())
