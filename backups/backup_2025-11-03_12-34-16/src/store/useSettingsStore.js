import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
const defaultCategories = [
  { id: "remix", name: "remix", icon: "Code", rate: 500, color: "#3B82F6" },
  { id: "marketing", name: "Маркетинг", icon: "TrendingUp", rate: 600, color: "#F59E0B" },
  { id: "development", name: "Разработка", icon: "Code", rate: 1500, color: "#3B82F6" },
  { id: "design", name: "Дизайн", icon: "Palette", rate: 1200, color: "#8B5CF6" },
  { id: "management", name: "Менеджмент", icon: "Users", rate: 1300, color: "#10B981" },
  { id: "consulting", name: "Консультации", icon: "MessageCircle", rate: 1400, color: "#06B6D4" },
  { id: "teaching", name: "Обучение", icon: "BookOpen", rate: 800, color: "#EF4444" },
  { id: "other", name: "Другое", icon: "MoreHorizontal", rate: 1000, color: "#6B7280" }
];

export const useSettingsStore = create(
  persist(
    (set, get) => ({
      // Тема приложения
      theme: 'dark', // По умолчанию темная тема
      animations: true,
      
      // Вид отображения списка записей
      listView: 'list', // 'list' | 'grid' | 'timeline'
      
      // Фильтры по умолчанию (независимые для каждого блока)
      defaultEntriesFilter: 'month', // Фильтр для блока "Записи времени"
      defaultAnalyticsFilter: 'month', // Фильтр для блока "Аналитика и графики"
      
      // Дефолтная конфигурация видимости графиков
      defaultChartVisibility: null, // null означает использование стандартной конфигурации (все графики включены)
      
      // Категории работы
      categories: defaultCategories,
      
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
        notificationSound: 'chime', // 'chime' | 'alert' | 'phone' | 'doorbell' | 'alarm' | 'notification' | 'bell' | 'beep'
        // Анимация фавикона
        faviconAnimationEnabled: true,
        faviconAnimationStyle: 'pulse', // 'pulse' | 'blink' | 'rotate' | 'wave' | 'gradient' | 'morph' | 'particles' | 'breathe'
        faviconAnimationColor: '#3b82f6', // синий (основной цвет проекта)
        faviconAnimationSpeed: 'normal', // 'slow' | 'normal' | 'fast'
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
      
      // Настройки таймера
      timer: {
        sound: true,
        hourlyAlert: true,
        autoSave: true,
        roundingMinutes: 15, // Округление времени до 15 минут
      },
      
      // Автосохранение
      autoSave: true,
      autoSaveInterval: 30, // секунды
      
      // Бэкапы
      backup: {
        autoBackupEnabled: true,
        backupFrequency: "daily", // daily, weekly, manual
        maxBackups: 10,
      },
      
      // Настройки плавающей панели таймера
      floatingPanel: {
        enabled: true,
        size: 'compact', // 'compact' | 'expanded'
        theme: 'glass', // 'glass' | 'solid' | 'minimal'
        position: { x: 20, y: 20 }, // позиция на экране
      },
      
      // Настройки видимости графиков
      // ИСПРАВЛЕНО: При первом открытии по умолчанию активны только "Динамика доходов" и "Тренды"
      chartVisibility: {
        dynamics: true,      // Динамика доходов - активна по умолчанию
        trends: true,        // Тренды - активна по умолчанию
        categoryDistribution: false,  // Распределение по категориям
        timeDistribution: false,      // Распределение времени
        rateDistribution: false,      // Распределение ставок
        weekday: false,       // Доход по дням недели
        scatter: false,       // Часы vs Доход
        idealDay: false,      // Идеальный час
        forecast: false,      // Прогноз заработка
        calendar: false,      // Календарь доходов
        categoryEfficiency: false,   // Доходы по категориям
        productivityHours: false,    // Продуктивность по часам
      },
      
      // Режим отображения графиков
      chartDisplay: 'combined', // 'separate' | 'combined'
      
      // Типы графиков в объединенном режиме
      combinedDynamicsType: 'area', // 'bar' | 'line' | 'area'
      combinedRateType: 'line',     // 'bar' | 'line' | 'area'
      
      // Продвинутые настройки
      advanced: {
        debugMode: false,
        experimentalFeatures: false,
      },
      
      /**
       * Устанавливает тему приложения
       * @param {string} theme - 'light', 'dark', 'auto'
       */
      setTheme: (theme) => {
        set({ theme });
        // Применяем класс к HTML элементу
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
          document.documentElement.classList.remove('light');
        } else if (theme === 'light') {
          document.documentElement.classList.add('light');
          document.documentElement.classList.remove('dark');
        } else {
          // auto - определяем по системной теме
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          if (prefersDark) {
            document.documentElement.classList.add('dark');
            document.documentElement.classList.remove('light');
          } else {
            document.documentElement.classList.add('light');
            document.documentElement.classList.remove('dark');
          }
        }
      },
      
      /**
       * Переключает анимации
       */
      toggleAnimations: () => set((state) => ({ animations: !state.animations })),
      
      /**
       * Устанавливает вид отображения списка записей
       * @param {string} view - 'list', 'grid', 'timeline'
       */
      setListView: (view) => set({ listView: view }),
      
      /**
       * Устанавливает фильтр по умолчанию для блока "Записи времени"
       * @param {string} filter - 'today', 'halfMonth1', 'halfMonth2', 'month', 'year', 'all', 'custom'
       */
      setDefaultEntriesFilter: (filter) => set({ defaultEntriesFilter: filter }),
      
      /**
       * Устанавливает фильтр по умолчанию для блока "Аналитика и графики"
       * @param {string} filter - 'today', 'halfMonth1', 'halfMonth2', 'month', 'year', 'all', 'custom'
       */
      setDefaultAnalyticsFilter: (filter) => set({ defaultAnalyticsFilter: filter }),
      
      /**
       * Обновляет видимость графиков
       * @param {Object} visibility - объект с ключами видимости графиков
       */
      updateChartVisibility: (visibility) => set((state) => ({
        chartVisibility: {
          ...state.chartVisibility,
          ...visibility,
        },
      })),
      
      /**
       * Устанавливает дефолтную конфигурацию видимости графиков
       * @param {Object} visibility - объект с видимостью графиков
       */
      setDefaultChartVisibility: (visibility) => set({
        defaultChartVisibility: visibility,
      }),
      
      /**
       * Обновляет настройки
       * @param {Object} updates - объект с новыми настройками
       */
      updateSettings: (updates) => set((state) => {
        // Глубокое слияние для вложенных объектов
        const merged = { ...state };
        for (const key in updates) {
          if (typeof updates[key] === 'object' && updates[key] !== null && !Array.isArray(updates[key])) {
            merged[key] = { ...merged[key], ...updates[key] };
          } else {
            merged[key] = updates[key];
          }
        }
        return merged;
      }),
      
      /**
       * Добавляет новую категорию
       * @param {Object} category - объект категории
       */
      addCategory: (category) => set((state) => ({
        categories: [...state.categories, { ...category, id: crypto.randomUUID() }]
      })),
      
      /**
       * Обновляет категорию
       * @param {string} id - ID категории
       * @param {Object} updates - обновления
       */
      updateCategory: (id, updates) => set((state) => ({
        categories: state.categories.map(cat => 
          cat.id === id ? { ...cat, ...updates } : cat
        )
      })),
      
      /**
       * Удаляет категорию
       * @param {string} id - ID категории
       */
      deleteCategory: (id) => set((state) => ({
        categories: state.categories.filter(cat => cat.id !== id)
      })),
      
      /**
       * Получает категорию по названию
       * @param {string} name - название категории
       * @returns {Object|null} объект категории или null
       */
      getCategory: (name) => {
        const { categories } = get();
        return categories.find(cat => cat.name === name) || null;
      },
      
      /**
       * Импортирует категории из JSON
       * @param {Array} newCategories - массив импортируемых категорий
       */
      importCategories: (newCategories) => {
        set({ categories: newCategories });
      },
      
      /**
       * Получает статистику рабочего графика
       * @returns {Object} статистика графика
       */
      getWorkScheduleStats: () => {
        const { workSchedule } = get();
        const days = Object.values(workSchedule);
        const workingDays = days.filter(day => day.enabled);
        
        const totalHoursPerWeek = workingDays.reduce((sum, day) => sum + day.hours, 0);
        const averageRate = workingDays.reduce((sum, day) => sum + day.rate, 0) / workingDays.length;
        const weeklyGoal = workingDays.reduce((sum, day) => sum + (day.hours * day.rate), 0);
        
        return {
          workingDaysCount: workingDays.length,
          totalHoursPerWeek,
          averageRate: averageRate.toFixed(2),
          weeklyGoal: weeklyGoal.toFixed(2),
          monthlyGoal: (weeklyGoal * 4.33).toFixed(2), // Примерно 4.33 недели в месяце
        };
      },
      
      /**
       * Сбрасывает все настройки к дефолтным
       */
      resetToDefaults: () => set({
        theme: 'dark',
        animations: true,
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
          backupFrequency: "daily",
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
          timeDistribution: true,
          rateDistribution: true,
          weekday: true,
          scatter: true,
          idealDay: true,
          forecast: true,
          calendar: true,
          categoryEfficiency: true,
          productivityHours: true,
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
      version: 1,
    }
  )
);
