/**
 * 🤖 Сервис генерации AI-уведомлений
 *
 * Отвечает за:
 * - Генерацию тестовых уведомлений
 * - Создание реальных уведомлений на основе анализа данных
 * - Проверку частоты показа
 * - Проверку тихих часов
 */

import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import {
  Flame,
  AlertTriangle,
  TrendingUp,
  Lightbulb,
  Target,
  Trophy,
  BarChart3,
  AlertCircle,
} from '../utils/icons'
import type {
  AINotification,
  NotificationType,
  NotificationPriority,
  AdvancedTestSettings,
} from '../types/aiNotifications'

/**
 * Генератор уникальных ID для тестовых уведомлений
 */
const generateTestId = (): string => {
  return `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Генератор уникальных ID для реальных уведомлений
 */
const generateId = (type: NotificationType): string => {
  return `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Получить иконку для типа уведомления
 */
const getIcon = (type: NotificationType) => {
  const iconMap = {
    'burnout-warning': <Flame className="w-5 h-5" />,
    'goal-risk': <AlertTriangle className="w-5 h-5" />,
    'monthly-forecast': <TrendingUp className="w-5 h-5" />,
    'productivity-pattern': <Lightbulb className="w-5 h-5" />,
    'inefficient-category': <Target className="w-5 h-5" />,
    'achievement': <Trophy className="w-5 h-5" />,
    'weekly-insight': <BarChart3 className="w-5 h-5" />,
    'anomaly': <AlertCircle className="w-5 h-5" />,
  }
  return iconMap[type] || <AlertCircle className="w-5 h-5" />
}

/**
 * Получить название типа на русском
 */
const getTypeLabel = (type: NotificationType): string => {
  const labels: Record<NotificationType, string> = {
    'burnout-warning': 'Предупреждение о выгорании',
    'goal-risk': 'Риск недостижения цели',
    'monthly-forecast': 'Прогноз месяца',
    'productivity-pattern': 'Паттерн продуктивности',
    'inefficient-category': 'Неэффективная категория',
    'achievement': 'Достижение',
    'weekly-insight': 'Еженедельный инсайт',
    'anomaly': 'Аномалия',
  }
  return labels[type]
}

/**
 * Получить тестовые данные для каждого типа уведомления
 */
const getTestNotificationData = (
  type: NotificationType,
  priority: NotificationPriority
): Omit<AINotification, 'id' | 'isRead' | 'isTest' | 'createdAt'> => {
  const notifications: Record<
    NotificationType,
    Omit<AINotification, 'id' | 'isRead' | 'isTest' | 'createdAt'>
  > = {
    'burnout-warning': {
      type: 'burnout-warning',
      priority: 'critical',
      title: '🔥 Риск выгорания!',
      preview:
        'Вы работаете 12+ часов в день последние 5 дней. Рекомендуем снизить нагрузку.',
      content: (
        <div>
          <p className="mb-3">
            Анализ ваших данных показывает повышенный риск выгорания:
          </p>
          <ul className="list-disc list-inside space-y-1 mb-3">
            <li>Работа 12+ часов в день последние 5 дней</li>
            <li>Всего 2 часа перерывов за неделю</li>
            <li>Снижение продуктивности на 23% за последние 3 дня</li>
          </ul>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Рекомендуем сделать выходной или снизить нагрузку до 8 часов в день.
          </p>
        </div>
      ),
      icon: getIcon('burnout-warning'),
      data: {
        avgHoursPerDay: 12.5,
        consecutiveDays: 5,
        productivityDrop: 23,
      },
      recommendations: [
        'Сделайте выходной завтра',
        'Ограничьте работу до 8 часов в день',
        'Добавьте 2-3 перерыва по 15 минут',
        'Переместите несрочные задачи на следующую неделю',
      ],
    },
    'goal-risk': {
      type: 'goal-risk',
      priority: 'high',
      title: '⚠️ Риск не достичь цели',
      preview:
        'При текущем темпе вы заработаете 78,000₽ вместо целевых 100,000₽.',
      content: (
        <div>
          <p className="mb-3">
            До конца месяца осталось 10 дней, но прогноз показывает недостачу:
          </p>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg mb-3">
            <p className="text-sm">
              <strong>Цель:</strong> 100,000₽
              <br />
              <strong>Прогноз:</strong> 78,000₽
              <br />
              <strong>Недостача:</strong> 22,000₽
            </p>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Чтобы достичь цели, нужно работать на 28% больше.
          </p>
        </div>
      ),
      icon: getIcon('goal-risk'),
      data: {
        goalAmount: 100000,
        forecastAmount: 78000,
        gap: 22000,
        daysRemaining: 10,
        requiredIncrease: 28,
      },
      recommendations: [
        'Увеличить рабочее время на 2 часа в день',
        'Сфокусироваться на высокооплачиваемых задачах',
        'Отказаться от низкоприоритетных задач',
      ],
    },
    'monthly-forecast': {
      type: 'monthly-forecast',
      priority: 'normal',
      title: '📊 Прогноз месяца',
      preview: 'При текущем темпе вы заработаете ~125,000₽ (+25% к цели).',
      content: (
        <div>
          <p className="mb-3">Прогноз на основе последних 20 дней:</p>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mb-3">
            <p className="text-sm">
              <strong>Текущая цель:</strong> 100,000₽
              <br />
              <strong>Прогноз:</strong> 125,000₽
              <br />
              <strong>Перевыполнение:</strong> +25,000₽ (+25%)
            </p>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Отличный темп! Вы идёте с опережением графика.
          </p>
        </div>
      ),
      icon: getIcon('monthly-forecast'),
      data: {
        goalAmount: 100000,
        forecastAmount: 125000,
        overachievement: 25000,
        daysAnalyzed: 20,
      },
      recommendations: [
        'Поддерживайте текущий темп',
        'Можете взять 1-2 дополнительных выходных',
        'Используйте свободное время для обучения',
      ],
    },
    'productivity-pattern': {
      type: 'productivity-pattern',
      priority: 'normal',
      title: '💡 Обнаружен паттерн продуктивности',
      preview:
        'Вы наиболее продуктивны с 10:00 до 13:00. Планируйте сложные задачи на это время.',
      content: (
        <div>
          <p className="mb-3">Анализ 30 дней показал ваш пик продуктивности:</p>
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg mb-3">
            <p className="text-sm">
              <strong>Лучшее время:</strong> 10:00 - 13:00
              <br />
              <strong>Эффективность:</strong> +47% выше среднего
              <br />
              <strong>Хуже всего:</strong> 16:00 - 18:00 (-31%)
            </p>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Планируйте самые сложные задачи на утро.
          </p>
        </div>
      ),
      icon: getIcon('productivity-pattern'),
      data: {
        peakTime: '10:00 - 13:00',
        peakEfficiency: 47,
        worstTime: '16:00 - 18:00',
        worstEfficiency: -31,
      },
      recommendations: [
        'Планируйте сложные задачи на 10:00-13:00',
        'Рутинные задачи делайте после 16:00',
        'Возьмите перерыв в 15:00-16:00',
      ],
    },
    'inefficient-category': {
      type: 'inefficient-category',
      priority: 'normal',
      title: '⏱️ Неэффективная категория',
      preview:
        'Категория "Встречи" занимает 30% времени, но приносит только 12% дохода.',
      content: (
        <div>
          <p className="mb-3">Обнаружена неэффективная категория работы:</p>
          <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg mb-3">
            <p className="text-sm">
              <strong>Категория:</strong> Встречи
              <br />
              <strong>Время:</strong> 30% (24 часа)
              <br />
              <strong>Доход:</strong> 12% (9,600₽)
              <br />
              <strong>Средняя ставка:</strong> 400₽/ч (на 33% ниже средней)
            </p>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Рекомендуем оптимизировать или сократить встречи.
          </p>
        </div>
      ),
      icon: getIcon('inefficient-category'),
      data: {
        category: 'Встречи',
        timePercent: 30,
        incomePercent: 12,
        hours: 24,
        earned: 9600,
        avgRate: 400,
        belowAverage: 33,
      },
      recommendations: [
        'Сократите продолжительность встреч на 30%',
        'Делегируйте часть встреч',
        'Проводите встречи в формате stand-up (15 мин)',
        'Перераспределите время в пользу "Разработки"',
      ],
    },
    'achievement': {
      type: 'achievement',
      priority: 'normal',
      title: '🏆 Достижение разблокировано!',
      preview: 'Вы достигли цели месяца за 20 дней! Новый личный рекорд.',
      content: (
        <div>
          <p className="mb-3">Поздравляем с достижением!</p>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg mb-3">
            <p className="text-sm">
              <strong>Достижение:</strong> "Ранняя цель"
              <br />
              <strong>Описание:</strong> Достигнута цель месяца за 20 дней
              <br />
              <strong>Заработано:</strong> 100,000₽
              <br />
              <strong>Дней до конца месяца:</strong> 10
            </p>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Отличный результат! Можете взять заслуженный отдых.
          </p>
        </div>
      ),
      icon: getIcon('achievement'),
      data: {
        achievementName: 'Ранняя цель',
        goalAmount: 100000,
        daysUsed: 20,
        daysRemaining: 10,
      },
      recommendations: [
        'Возьмите 2-3 выходных',
        'Используйте время для обучения новым навыкам',
        'Поставьте новую растянутую цель (+30%)',
      ],
    },
    'weekly-insight': {
      type: 'weekly-insight',
      priority: 'normal',
      title: '💡 Еженедельный инсайт',
      preview:
        'На этой неделе вы заработали 28,000₽ за 32 часа работы. Средняя ставка: 875₽/ч.',
      content: (
        <div>
          <p className="mb-3">Итоги недели:</p>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mb-3">
            <p className="text-sm">
              <strong>Заработано:</strong> 28,000₽ (+12% к прошлой неделе)
              <br />
              <strong>Часов работы:</strong> 32ч (-5% к прошлой неделе)
              <br />
              <strong>Средняя ставка:</strong> 875₽/ч (+18%)
              <br />
              <strong>Лучший день:</strong> Среда (7,200₽ за 7ч)
            </p>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Ставка растёт при снижении времени - отличный тренд!
          </p>
        </div>
      ),
      icon: getIcon('weekly-insight'),
      data: {
        earned: 28000,
        hours: 32,
        avgRate: 875,
        earnedChange: 12,
        hoursChange: -5,
        rateChange: 18,
        bestDay: 'Среда',
        bestDayEarned: 7200,
      },
      recommendations: [
        'Продолжайте повышать ставку',
        'Фокусируйтесь на качестве, а не количестве часов',
        'Анализируйте, что работает в среду',
      ],
    },
    'anomaly': {
      type: 'anomaly',
      priority: 'high',
      title: '🔍 Обнаружена аномалия',
      preview:
        'Вчера вы заработали 15,000₽ за 4 часа (3,750₽/ч) - в 4 раза выше обычного!',
      content: (
        <div>
          <p className="mb-3">Обнаружено необычное событие:</p>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg mb-3">
            <p className="text-sm">
              <strong>Дата:</strong> Вчера
              <br />
              <strong>Заработано:</strong> 15,000₽ (обычно: 3,500₽)
              <br />
              <strong>Ставка:</strong> 3,750₽/ч (обычно: 875₽/ч)
              <br />
              <strong>Отклонение:</strong> +4.3x от среднего
            </p>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Проанализируйте, что было сделано иначе.
          </p>
        </div>
      ),
      icon: getIcon('anomaly'),
      data: {
        date: 'Вчера',
        earned: 15000,
        normalEarned: 3500,
        rate: 3750,
        normalRate: 875,
        deviation: 4.3,
      },
      recommendations: [
        'Проанализируйте, какие задачи выполнялись',
        'Попробуйте повторить успешный паттерн',
        'Подумайте о повышении базовой ставки',
      ],
    },
  }

  return { ...notifications[type], priority }
}

/**
 * Класс для управления AI-уведомлениями
 */
export class AINotificationService {
  /**
   * Генерация одного тестового уведомления
   */
  static generateTestNotification(
    type: NotificationType,
    priority: NotificationPriority = 'normal'
  ): AINotification {
    const data = getTestNotificationData(type, priority)

    return {
      ...data,
      id: generateTestId(),
      isRead: false,
      isTest: true,
      createdAt: new Date().toISOString(),
    }
  }

  /**
   * Генерация массива тестовых уведомлений
   */
  static generateBulkTestNotifications(count: number): AINotification[] {
    const types: NotificationType[] = [
      'burnout-warning',
      'goal-risk',
      'monthly-forecast',
      'productivity-pattern',
      'inefficient-category',
      'achievement',
      'weekly-insight',
      'anomaly',
    ]

    const priorities: NotificationPriority[] = ['critical', 'high', 'normal']

    const notifications: AINotification[] = []

    for (let i = 0; i < count; i++) {
      const randomType = types[Math.floor(Math.random() * types.length)]
      const randomPriority =
        priorities[Math.floor(Math.random() * priorities.length)]

      notifications.push(
        this.generateTestNotification(randomType, randomPriority)
      )

      // Задержка между созданиями для уникальности timestamp
      const delay = Math.random() * 1000
      const createdAt = new Date(Date.now() - delay * i).toISOString()
      notifications[i].createdAt = createdAt
    }

    return notifications
  }

  /**
   * Генерация расширенного теста с настройками
   */
  static generateAdvancedTest(settings: AdvancedTestSettings): AINotification {
    const notification = this.generateTestNotification(
      settings.type,
      settings.priority
    )

    // Добавляем флаги для тестирования разных способов отображения
    return {
      ...notification,
      data: {
        ...notification.data,
        testSettings: {
          withBrowserPush: settings.withBrowserPush,
          withToast: settings.withToast,
          withSound: settings.withSound,
        },
      },
    }
  }

  /**
   * Получить все типы уведомлений (для UI выбора)
   */
  static getAllTypes(): Array<{
    value: NotificationType
    label: string
    description: string
  }> {
    return [
      {
        value: 'burnout-warning',
        label: '🔥 Предупреждение о выгорании',
        description: 'Критическое: работа без перерывов',
      },
      {
        value: 'goal-risk',
        label: '⚠️ Риск недостижения цели',
        description: 'Высокий: не достигнете цели месяца',
      },
      {
        value: 'monthly-forecast',
        label: '📊 Прогноз месяца',
        description: 'Обычный: прогноз на конец месяца',
      },
      {
        value: 'productivity-pattern',
        label: '💡 Паттерн продуктивности',
        description: 'Обычный: обнаружен пик продуктивности',
      },
      {
        value: 'inefficient-category',
        label: '⏱️ Неэффективная категория',
        description: 'Обычный: низкая отдача от категории',
      },
      {
        value: 'achievement',
        label: '🏆 Достижение',
        description: 'Обычный: цель достигнута',
      },
      {
        value: 'weekly-insight',
        label: '💡 Еженедельный инсайт',
        description: 'Обычный: итоги недели',
      },
      {
        value: 'anomaly',
        label: '🔍 Аномалия',
        description: 'Высокий: необычное событие',
      },
    ]
  }

  /**
   * Получить все приоритеты (для UI выбора)
   */
  static getAllPriorities(): Array<{
    value: NotificationPriority
    label: string
    color: string
  }> {
    return [
      { value: 'critical', label: 'Критический', color: 'red' },
      { value: 'high', label: 'Высокий', color: 'yellow' },
      { value: 'normal', label: 'Обычный', color: 'blue' },
    ]
  }
}
