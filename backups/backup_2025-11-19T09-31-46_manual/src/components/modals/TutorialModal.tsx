import { useState, useEffect, useMemo } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  PlayCircle,
  Clock,
  Settings,
  BarChart3,
  Download,
  List,
  Grid3x3,
  Activity,
  Calendar,
  Target,
  Lightbulb,
  Eye,
  Trash2,
  AlertTriangle,
  DollarSign,
  Sparkles,
} from '../../utils/icons'
import { Button } from '../ui/Button'
import { BaseModal } from '../ui/BaseModal'
import { AnimatedModalContent } from '../ui/AnimatedModalContent'
import { useChangelogFeatures } from '../../hooks/useChangelogFeatures'

/**
 * Модальное окно обучения (Tutorial)
 * - 11 подробных шагов обучения
 * - Навигация вперед/назад
 * - Индикатор прогресса
 * - Сохранение флага завершения в localStorage
 * - Информация о тестовых данных и возможность их удаления
 * - Отдельный шаг о настройке плана заработка и дат выплат
 */
export function TutorialModal({ isOpen, onClose, onClearDemoData }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [hasDemoData, setHasDemoData] = useState(false)
  
  // Загружаем новые возможности из changelog.md
  const { features: newFeatures, isLoading: isLoadingFeatures } = useChangelogFeatures('1.3.0')

  // Проверяем наличие тестовых данных
  useEffect(() => {
    const demoDataLoaded = localStorage.getItem('demo_data_loaded') === 'true'
    setHasDemoData(demoDataLoaded)
  }, [isOpen])

  // Создаем steps динамически с учетом загруженных данных из changelog
  const steps = useMemo(() => [
    {
      title: 'Добро пожаловать!',
      icon: PlayCircle,
      content: (
        <div className="space-y-3">
          <p className="text-gray-700 dark:text-gray-300">
            <strong>Time Tracker Dashboard v1.3.0</strong> - это современное приложение для учета
            рабочего времени с мощной аналитикой и умными инструментами.
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            В этом кратком туре мы покажем вам основные возможности приложения.
          </p>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mt-4">
            <h2 className="font-semibold text-sm mb-2">Основные возможности:</h2>
            <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
              <li>⏱️ Таймер для отслеживания времени в реальном времени</li>
              <li>📝 Ручное добавление записей с валидацией пересечений</li>
              <li>📊 Детальная аналитика: графики, тренды, план/факт анализ</li>
              <li>📅 Календарь доходов с сравнением периодов</li>
              <li>💰 Автоматический расчет заработка и ставок</li>
              <li>🎯 Настройка рабочего графика (5/2, 2/2, 3/3, кастомный)</li>
              <li>👁️ Три вида отображения: Список, Сетка, Таймлайн</li>
              <li>🔔 Звуковые уведомления и напоминания</li>
              <li>💾 Экспорт и импорт данных (JSON)</li>
              <li>↩️ История действий (Undo/Redo)</li>
              <li>🔍 Умный поиск по записям с фильтрацией</li>
              <li>📈 Расширенная аналитика: анализ дней недели, часов дня, прогнозы</li>
              <li>🎨 Кастомные иконки и цвета кнопок (dev режим)</li>
              <li>📏 Настраиваемые размеры столбцов в списке записей</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      title: 'Новые функции v1.3.0',
      icon: Sparkles,
      content: (
        <div className="space-y-3">
          <p className="text-gray-700 dark:text-gray-300">
            В этой версии мы добавили несколько полезных функций для улучшения вашего опыта работы с приложением.
          </p>
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg mt-4">
            <h5 className="font-semibold text-sm mb-2">✨ Новые функции v1.3.0:</h5>
            {isLoadingFeatures ? (
              <div className="text-sm text-gray-500 dark:text-gray-400">Загрузка...</div>
            ) : newFeatures.length > 0 ? (
              <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                {newFeatures.map((feature, index) => (
                  <li key={index}>
                    {feature.emoji} <strong>{feature.name}</strong>
                    {feature.description && ` - ${feature.description}`}
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                <li>✓ <strong>AI-уведомления</strong> - умные уведомления о продуктивности, рисках переработки, достижениях и прогнозах</li>
                <li>✓ <strong>Настройки AI-уведомлений</strong> - гибкая настройка типов уведомлений, частоты и способов отображения</li>
              </ul>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Учет времени',
      icon: Clock,
      content: (
        <div className="space-y-3">
          <h2 className="font-semibold">Два способа добавления записей:</h2>

          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <h5 className="font-semibold text-sm mb-2">1. Таймер (рекомендуется)</h5>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Нажмите кнопку "Старт таймер" или клавишу{' '}
              <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">S</kbd>
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
              Таймер автоматически создаст запись при остановке.
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h5 className="font-semibold text-sm mb-2">2. Ручное добавление</h5>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Нажмите "Новая запись" или клавишу{' '}
              <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">N</kbd> /{' '}
              <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">T</kbd>
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
              Заполните время начала, окончания и заработок.
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg mt-4">
            <h5 className="font-semibold text-xs mb-1">💡 Совет:</h5>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Длительность и ставка рассчитываются автоматически на основе введенного заработка.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: 'Настройка плана и выплат',
      icon: DollarSign,
      content: (
        <div className="space-y-3">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 dark:border-yellow-600 p-4 rounded-lg">
            <h5 className="font-semibold text-sm mb-2 text-yellow-900 dark:text-yellow-100">
              ⚠️ Важно: Настройте перед началом работы!
            </h5>
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Перед началом работы с приложением необходимо настроить план заработка и даты выплат.
              Это позволит системе корректно рассчитывать план/факт анализ и отслеживать ваши цели.
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h5 className="font-semibold text-sm mb-2">📋 План заработка</h5>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
              Настройте дневную цель заработка в разделе "Настройки" → "Рабочий график":
            </p>
            <ul className="text-xs space-y-1 text-gray-600 dark:text-gray-400 list-disc list-inside ml-2">
              <li>Укажите дневной план заработка (например, 6000 ₽)</li>
              <li>Выберите рабочий график (5/2, 2/2, 3/3 или кастомный)</li>
              <li>Система автоматически рассчитает месячный план</li>
            </ul>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <h5 className="font-semibold text-sm mb-2">📅 Даты выплат</h5>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
              Настройте даты выплат в разделе "Настройки" → "Даты выплат":
            </p>
            <ul className="text-xs space-y-1 text-gray-600 dark:text-gray-400 list-disc list-inside ml-2">
              <li>Укажите даты выплат (например, 5 и 20 число каждого месяца)</li>
              <li>Можно добавить несколько периодов выплат</li>
              <li>Система будет отслеживать заработок по периодам выплат</li>
            </ul>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg mt-4">
            <h5 className="font-semibold text-xs mb-1">💡 Совет:</h5>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              После настройки плана и дат выплат вы сможете видеть план/факт анализ и отслеживать
              выполнение целей в реальном времени.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: 'Категории и ставки',
      icon: Settings,
      content: (
        <div className="space-y-3">
          <p className="text-gray-700 dark:text-gray-300">
            Каждая запись привязана к категории. Категории помогают анализировать время по типам
            работы.
          </p>

          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <h5 className="font-semibold text-sm mb-2">Встроенные категории:</h5>
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-700 dark:text-gray-300">
              <div>💻 Разработка</div>
              <div>🎨 Дизайн</div>
              <div>👥 Менеджмент</div>
              <div>📈 Маркетинг</div>
              <div>💬 Консультации</div>
              <div>📚 Обучение</div>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
            <h5 className="font-semibold text-sm mb-2">📊 Автоматический расчет:</h5>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              При вводе заработка за период, приложение автоматически рассчитывает вашу ставку
              (₽/час) на основе отработанного времени.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: 'Виды отображения',
      icon: Eye,
      content: (
        <div className="space-y-3">
          <p className="text-gray-700 dark:text-gray-300">
            Приложение предлагает три удобных способа просмотра ваших записей.
          </p>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h5 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <List className="w-4 h-4" /> Список
            </h5>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Классический табличный вид со всеми деталями. Удобно для просмотра большого количества
              записей, сортировки и поиска.
            </p>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <h5 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <Grid3x3 className="w-4 h-4" /> Сетка
            </h5>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Карточки по дням с метриками и статусами. Быстро видите дни с высокой и низкой
              продуктивностью. Идеально для визуального анализа.
            </p>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <h5 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <Activity className="w-4 h-4" /> Таймлайн
            </h5>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Временная линия с записями в хронологическом порядке. Показывает перерывы между
              сессиями и общую картину рабочего дня.
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg mt-4">
            <h5 className="font-semibold text-xs mb-1">💡 Совет:</h5>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Переключайтесь между видами в зависимости от задачи. Для детального анализа
              используйте Список, для быстрого обзора — Сетку.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: 'Графики и аналитика',
      icon: BarChart3,
      content: (
        <div className="space-y-3">
          <p className="text-gray-700 dark:text-gray-300">
            Получайте детальные инсайты о вашей работе с помощью мощных инструментов аналитики.
          </p>

          <div className="space-y-2">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <h5 className="font-semibold text-sm">📈 Динамика доходов</h5>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Линейный график показывает изменение заработка во времени
              </p>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <h5 className="font-semibold text-sm">🥧 Распределение по категориям</h5>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Круговая диаграмма показывает, сколько времени тратится на каждую категорию
              </p>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
              <h5 className="font-semibold text-sm">📊 Тренды за 30 дней</h5>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Анализируйте тренды заработка, часов работы и средней ставки
              </p>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
              <h5 className="font-semibold text-sm">📅 Доход по дням недели</h5>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Узнайте, в какие дни недели вы зарабатываете больше всего
              </p>
            </div>

            <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
              <h5 className="font-semibold text-sm">📈 Прогноз заработка</h5>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Система анализирует ваши данные и прогнозирует будущий заработок
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Календарь доходов',
      icon: Calendar,
      content: (
        <div className="space-y-3">
          <p className="text-gray-700 dark:text-gray-300">
            Визуализируйте свой заработок в виде календаря с цветовой кодировкой интенсивности.
          </p>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h5 className="font-semibold text-sm mb-2">🎨 Цветовая индикация</h5>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Чем темнее цвет дня, тем больше вы заработали. Нерабочие дни отмечены пунктирной
              рамкой.
            </p>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <h5 className="font-semibold text-sm mb-2">⚖️ Сравнение периодов</h5>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Рядом отображаются два календаря: текущий и сравниваемый период. При наведении на день
              в одном календаре автоматически подсвечивается соответствующий день недели в другом.
            </p>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <h5 className="font-semibold text-sm mb-2">🔍 Детальная информация</h5>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Наведите курсор на любой день, чтобы увидеть точную сумму заработка, количество
              отработанных часов и среднюю ставку.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: 'План и факт',
      icon: Target,
      content: (
        <div className="space-y-3">
          <p className="text-gray-700 dark:text-gray-300">
            Отслеживайте выполнение планов и целей по заработку с помощью системы План/Факт анализа.
          </p>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h5 className="font-semibold text-sm mb-2">📋 Настройка плана</h5>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Установите дневную и месячную цель заработка. Система автоматически рассчитает план на
              основе вашего рабочего графика.
            </p>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <h5 className="font-semibold text-sm mb-2">📊 Отслеживание прогресса</h5>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Карточки План/Факт показывают: план на день и месяц, фактический заработок, отклонение
              и процент выполнения.
            </p>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
            <h5 className="font-semibold text-sm mb-2">🎨 Цветовая индикация</h5>
            <ul className="text-sm text-gray-700 dark:text-gray-300 mt-2 space-y-1">
              <li>
                🟢 <strong>Зеленый:</strong> факт ≥ план (цель выполнена)
              </li>
              <li>
                🟡 <strong>Желтый:</strong> факт 70-99% плана (почти достигнуто)
              </li>
              <li>
                🔴 <strong>Красный:</strong> факт &lt; 70% плана (требуется внимание)
              </li>
            </ul>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <h5 className="font-semibold text-sm mb-2">⚙️ Рабочий график</h5>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Настройте свой рабочий график: стандартный 5/2, сменный 2/2 или 3/3, или создайте
              кастомный график. Система автоматически учтет рабочие и выходные дни.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: 'Автоматические инсайты',
      icon: Lightbulb,
      content: (
        <div className="space-y-3">
          <p className="text-gray-700 dark:text-gray-300">
            Система анализирует ваши данные и автоматически генерирует умные подсказки о вашей
            работе.
          </p>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h5 className="font-semibold text-sm mb-2">📅 Лучший день недели</h5>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Узнайте, в какой день недели вы зарабатываете больше всего в среднем. Это поможет
              оптимизировать расписание.
            </p>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <h5 className="font-semibold text-sm mb-2">⏰ Пик продуктивности</h5>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Система определяет часы дня, когда ваша средняя ставка максимальна. Планируйте важные
              задачи на это время.
            </p>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <h5 className="font-semibold text-sm mb-2">📈 Тренд заработка</h5>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Анализ показывает, растет или падает ваш заработок в последние 30 дней. Отслеживайте
              динамику развития.
            </p>
          </div>

          <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
            <h5 className="font-semibold text-sm mb-2">🎯 Самая длинная сессия</h5>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Узнайте о самой продолжительной рабочей сессии за период. Это может указать на периоды
              максимальной продуктивности.
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg mt-4">
            <h5 className="font-semibold text-xs mb-1">💡 Условие:</h5>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Инсайты появляются автоматически при наличии 30 и более записей. Чем больше данных,
              тем точнее анализ.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: 'Настройки и валидация',
      icon: Settings,
      content: (
        <div className="space-y-3">
          <p className="text-gray-700 dark:text-gray-300">
            Приложение включает умную валидацию и гибкие настройки для комфортной работы.
          </p>

          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
            <h5 className="font-semibold text-sm mb-2">🛡️ Валидация пересечений</h5>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Система автоматически проверяет, не пересекается ли новое время работы с существующими
              записями за тот же день. Это предотвращает создание конфликтующих записей.
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h5 className="font-semibold text-sm mb-2">✅ Валидация времени</h5>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Приложение проверяет, что время окончания позже времени начала. Ошибки отображаются в
              реальном времени при вводе.
            </p>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <h5 className="font-semibold text-sm mb-2">🎨 Персонализация</h5>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Настройте категории с иконками и цветами, создайте кастомный рабочий график, включите
              звуковые уведомления — всё для вашего комфорта.
            </p>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <h5 className="font-semibold text-sm mb-2">🌓 Темная тема</h5>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Переключайтесь между светлой и темной темой для комфортной работы в любое время суток.
              Настройки сохраняются автоматически.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: 'Экспорт и импорт данных',
      icon: Download,
      content: (
        <div className="space-y-3">
          <p className="text-gray-700 dark:text-gray-300">
            Сохраняйте свои данные и переносите их между устройствами.
          </p>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h5 className="font-semibold text-sm mb-2">📥 Экспорт</h5>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Нажмите кнопку экспорта{' '}
              <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">⬇️</kbd> в
              шапке, чтобы скачать все данные в формате JSON. В файл попадут: записи времени,
              категории, настройки и рабочий график.
            </p>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <h5 className="font-semibold text-sm mb-2">📤 Импорт</h5>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Нажмите кнопку импорта{' '}
              <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">⬆️</kbd> и
              выберите файл. Вы можете заменить все данные или добавить импортированные к
              существующим. Идеально для резервного копирования.
            </p>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <h5 className="font-semibold text-sm mb-2">↩️ История действий (Undo/Redo)</h5>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Используйте{' '}
              <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">Ctrl+Z</kbd>{' '}
              для отмены и{' '}
              <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">Ctrl+Y</kbd>{' '}
              для повтора последних действий. Система сохраняет историю всех изменений.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: hasDemoData ? 'Важно: Демонстрационные данные' : 'Готово к работе!',
      icon: hasDemoData ? AlertTriangle : PlayCircle,
      content: hasDemoData ? (
        <div className="space-y-4">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 dark:border-yellow-600 p-5 rounded-lg">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-10 h-10 bg-yellow-400 dark:bg-yellow-600 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-yellow-900 dark:text-yellow-100" />
                </div>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-base mb-3 text-yellow-900 dark:text-yellow-100">
                  📊 Демонстрационные данные загружены
                </h4>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                В базе данных сейчас находятся <strong>тестовые демонстрационные записи</strong>,
                которые были автоматически загружены при первом запуске для визуального показа
                функционала приложения.
              </p>

              <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Эти данные помогли вам увидеть:</strong>
                </p>
                <ul className="text-sm text-yellow-800 dark:text-yellow-200 mt-2 space-y-1 list-disc list-inside">
                  <li>Графики и аналитику с реальными данными</li>
                  <li>Календарь доходов с заполненными днями</li>
                  <li>Статистику и инсайты</li>
                  <li>План/Факт анализ</li>
                </ul>
              </div>

              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-300 dark:border-red-700">
                <p className="text-sm font-semibold text-red-800 dark:text-red-200 mb-2">
                  ⚠️ Важно!
                </p>
                <p className="text-sm text-red-700 dark:text-red-300">
                  После ознакомления с возможностями приложения{' '}
                  <strong>рекомендуется удалить эти тестовые данные</strong>, чтобы начать работу с
                  чистой базой и добавлять только свои реальные записи.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-lg border-2 border-green-500 mt-4">
            <p className="text-sm font-semibold text-green-700 dark:text-green-300 text-center">
              🎉 Готово! Теперь вы знаете все основные возможности приложения. Начните работу и
              отслеживайте свое время эффективно!
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="bg-green-100 dark:bg-green-900/30 p-5 rounded-lg border-2 border-green-500">
            <p className="text-lg font-semibold text-green-700 dark:text-green-300 text-center mb-3">
              🎉 Поздравляем!
            </p>
            <p className="text-sm text-green-700 dark:text-green-300 text-center">
              Теперь вы знаете все основные возможности приложения. Начните работу и отслеживайте
              свое время эффективно!
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h5 className="font-semibold text-sm mb-2">💡 Полезные советы:</h5>
            <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
              <li>• Используйте таймер для автоматического учета времени</li>
              <li>• Регулярно экспортируйте данные для резервного копирования</li>
              <li>• Настройте рабочий график для точного планирования</li>
              <li>• Анализируйте статистику для оптимизации рабочего времени</li>
            </ul>
          </div>
        </div>
      ),
    },
  ], [newFeatures, isLoadingFeatures, hasDemoData])

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleFinish = () => {
    localStorage.setItem('tutorial_completed', 'true')
    onClose()
    setCurrentStep(0)
  }

  const handleSkip = () => {
    localStorage.setItem('tutorial_completed', 'true')
    onClose()
    setCurrentStep(0)
  }

  const currentStepData = steps[currentStep]
  const Icon = currentStepData.icon

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleSkip}
      title={currentStepData.title}
      titleIcon={Icon}
      size="large"
      closeOnOverlayClick={false}
    >
      {/* Индикатор шагов */}
      <div className="flex gap-2 mb-6">
        {steps.map((step, index) => (
          <div
            key={`progress-${step.title}-${index}`}
            className={`flex-1 h-2 rounded-full transition-colors ${
              index === currentStep
                ? 'bg-blue-500'
                : index < currentStep
                  ? 'bg-green-500'
                  : 'bg-gray-300 dark:bg-gray-600'
            }`}
          />
        ))}
      </div>

      {/* Контент С анимацией */}
      <AnimatedModalContent contentKey={currentStep}>
        {currentStepData.content}
      </AnimatedModalContent>

      {/* Навигация */}
      <div className="flex justify-between items-center">
        <button
          onClick={handleSkip}
          className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          Пропустить тур
        </button>

        <div className="flex gap-2">
          {currentStep > 0 && (
            <Button
              variant="secondary"
              onClick={handlePrevious}
              icon={ChevronLeft}
              iconId="tutorial-previous"
            >
              Назад
            </Button>
          )}

          {currentStep < steps.length - 1 ? (
            <Button
              variant="primary"
              onClick={handleNext}
              icon={ChevronRight}
              iconId="tutorial-next"
            >
              Далее
            </Button>
          ) : (
            <Button variant="success" onClick={handleFinish} iconId="tutorial-finish">
              Начать работу 🚀
            </Button>
          )}
        </div>
      </div>
    </BaseModal>
  )
}
