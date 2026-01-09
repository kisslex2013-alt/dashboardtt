/**
 * 🤖 Типы для системы AI-уведомлений
 *
 * Описывает структуру умных уведомлений, их приоритеты,
 * быстрые действия и настройки системы.
 */

import { ReactNode } from 'react'

/**
 * Приоритет уведомления
 * - critical: Критические (показываются Browser Push, красная анимация)
 * - high: Важные (желтая анимация)
 * - normal: Обычные (синяя анимация)
 */
export type NotificationPriority = 'critical' | 'high' | 'normal'

/**
 * Типы уведомлений
 */
export type NotificationType =
  | 'burnout-warning'      // 🔥 Риск выгорания (работаешь слишком много без перерывов)
  | 'goal-risk'            // ⚠️ Риск не достичь цели месяца
  | 'monthly-forecast'     // 📊 Прогноз месяца (на основе текущего темпа)
  | 'productivity-pattern' // 📈 Обнаружен паттерн продуктивности
  | 'inefficient-category' // ⏱️ Неэффективная категория работы
  | 'achievement'          // 🏆 Достижение (цель достигнута, рекорд побит)
  | 'weekly-insight'       // 💡 Еженедельный инсайт
  | 'anomaly'              // 🔍 Аномалия в данных
  | 'month-summary'        // 📅 Итоги месяца (для последних дней)

/**
 * Быстрое действие в dropdown уведомлений
 * Например: "Подробнее", "Отложить", "Скрыть"
 */
export interface QuickAction {
  /** Текст кнопки */
  label: string
  /** Вариант кнопки (влияет на стиль) */
  variant?: 'primary' | 'secondary' | 'danger'
  /** Обработчик клика */
  onClick: (notification: AINotification) => void
}

/**
 * Действие в модалке детального просмотра
 * Например: "Открыть статистику", "Изменить настройки"
 */
export interface NotificationAction {
  /** Текст кнопки */
  label: string
  /** Иконка (компонент из lucide-react) */
  icon?: ReactNode
  /** Первичная кнопка (синяя, выделенная) */
  primary?: boolean
  /** Обработчик клика */
  onClick: () => void
}

/**
 * Основная структура AI-уведомления
 */
export interface AINotification {
  /** Уникальный ID */
  id: string
  /** Тип уведомления */
  type: NotificationType
  /** Приоритет */
  priority: NotificationPriority
  /** Заголовок (краткий) */
  title: string
  /** Превью для списка (1-2 предложения) */
  preview: string
  /** Полное содержимое (может быть ReactNode с форматированием) */
  content: ReactNode
  /** Иконка уведомления */
  icon: ReactNode
  /** Дополнительные данные для анализа */
  data?: {
    /** Процент от цели */
    goalProgress?: number
    /** Прогноз заработка */
    forecastEarned?: number
    /** Количество часов */
    hours?: number
    /** Категория */
    category?: string
    /** Глубина анализа (для индикатора) */
    analysisDepth?: {
      daysAnalyzed: number
      entriesCount?: number
    }
    /** Любые другие данные */
    [key: string]: any
  }
  /** Список рекомендаций */
  recommendations?: string[]
  /** Быстрые действия для dropdown */
  quickActions?: QuickAction[]
  /** Действия для модалки */
  actions?: NotificationAction[]
  /** Прочитано ли */
  isRead: boolean
  /** Тестовое уведомление (созданное в режиме тестирования) */
  isTest: boolean
  /** "Удивительный" инсайт — показывается с WOW-эффектом */
  isSurprising?: boolean
  /** Дата создания */
  createdAt: string
  /** Дата прочтения */
  readAt?: string
  /** Отложено до (ISO timestamp) */
  snoozedUntil?: string
}

/**
 * Настройки тихих часов
 * В эти часы не показываются уведомления (кроме критических)
 */
export interface QuietHours {
  /** Включены ли тихие часы */
  enabled: boolean
  /** Начало (HH:mm, например "22:00") */
  start: string
  /** Конец (HH:mm, например "08:00") */
  end: string
  /** Только по выходным */
  weekendsOnly: boolean
}

/**
 * Какие типы уведомлений включены
 */
export interface EnabledNotificationTypes {
  /** 🔥 Предупреждения о выгорании */
  burnoutWarning: boolean
  /** 📈 Паттерны продуктивности */
  productivityPatterns: boolean
  /** 📊 Прогноз месяца */
  monthlyForecast: boolean
  /** ⏱️ Неэффективные категории */
  inefficientCategories: boolean
  /** 🏆 Достижения */
  achievements: boolean
}

/**
 * Режим частоты уведомлений
 * - minimal: Минимум (только критические, 1-2 в неделю)
 * - balanced: Баланс (важные + критические, 3-5 в неделю)
 * - maximum: Максимум (все типы, до 10 в неделю)
 */
export type FrequencyMode = 'minimal' | 'balanced' | 'maximum'

/**
 * Статистика тестового режима
 */
export interface TestStats {
  /** Всего создано тестовых уведомлений */
  totalCreated: number
  /** Текущее количество тестовых */
  currentCount: number
}

/**
 * Настройки расширенного тестового режима
 */
export interface AdvancedTestSettings {
  /** Выбранный тип уведомления */
  type: NotificationType
  /** Выбранный приоритет */
  priority: NotificationPriority
  /** Включить Browser Push (для критических) */
  withBrowserPush: boolean
  /** Включить Toast */
  withToast: boolean
  /** Включить звук */
  withSound: boolean
}
