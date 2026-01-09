import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  HelpCircle, 
  BookOpen, 
  Clock, 
  BarChart3, 
  Database, 
  Keyboard, 
  Sparkles,
  Play,
  Plus,
  Download,
  Shield,
  Zap,
  Target,
  TrendingUp,
  BarChart2,
  GitCompare,
  Cloud,
  ChevronRight
} from '../../utils/icons'
import { Focus } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { BaseModal } from '../ui/BaseModal'
import { useIsMobile } from '../../hooks/useIsMobile'
import { Button } from '../ui/Button'
import { SettingsNavItem } from './settings/SettingsNavItem'

/**
 * 📚 Справочный центр (Help Center Modal)
 * Полноценная справочная система с табами по аналогии с настройками
 * Описывает все функции приложения подробно
 */

interface HelpSection {
  id: string
  icon: LucideIcon
  title: string
  subtitle: string
  accentClass: string
}

interface HelpGroup {
  id: string
  title: string
  items: HelpSection[]
}

// Структура разделов справки
const helpGroups: HelpGroup[] = [
  {
    id: 'basics',
    title: 'Основы',
    items: [
      { id: 'getting-started', icon: BookOpen, title: 'Начало работы', subtitle: 'Быстрый старт', accentClass: 'blue-500' },
      { id: 'timer', icon: Clock, title: 'Таймер', subtitle: 'Учёт времени', accentClass: 'green-500' },
      { id: 'entries', icon: Database, title: 'Записи', subtitle: 'База данных', accentClass: 'violet-500' },
    ]
  },
  {
    id: 'analytics',
    title: 'Аналитика',
    items: [
      { id: 'basic-analytics', icon: BarChart3, title: 'Базовая', subtitle: 'Общая статистика', accentClass: 'cyan-500' },
      { id: 'descriptive', icon: TrendingUp, title: 'Описательная', subtitle: 'Графики и тренды', accentClass: 'indigo-500' },
      { id: 'predictive', icon: BarChart2, title: 'Предиктивная', subtitle: 'Прогнозы', accentClass: 'fuchsia-500' },
      { id: 'comparative', icon: GitCompare, title: 'Сравнительная', subtitle: 'MoM и YoY', accentClass: 'amber-500' },
    ]
  },
  {
    id: 'features',
    title: 'Функции',
    items: [
      { id: 'view-modes', icon: Focus, title: 'Режимы просмотра', subtitle: 'Focus / Analytics', accentClass: 'purple-500' },
      { id: 'ai-assistant', icon: Sparkles, title: 'AI Ассистент', subtitle: 'Умные инсайты', accentClass: 'rose-500' },
      { id: 'categories', icon: Target, title: 'Категории', subtitle: 'Теги проектов', accentClass: 'emerald-500' },
      { id: 'hotkeys', icon: Keyboard, title: 'Горячие клавиши', subtitle: 'Быстрый доступ', accentClass: 'sky-500' },
      { id: 'sync', icon: Cloud, title: 'Синхронизация', subtitle: 'Облако и бэкапы', accentClass: 'slate-500' },
    ]
  },
]

// Плоский список всех секций для навигации
const allSectionsFlat = helpGroups.flatMap(group => group.items)

// Контент для каждого раздела справки
const helpContent: Record<string, { title: string; sections: { heading?: string; content?: string; icon?: React.ComponentType<{ className?: string }>; tip?: string }[] }> = {
  'getting-started': {
    title: 'Начало работы',
    sections: [
      {
        heading: 'Добро пожаловать!',
        content: 'Time Tracker Dashboard — это современное приложение для учёта рабочего времени и анализа продуктивности. Оно поможет вам отслеживать, сколько времени вы тратите на разные проекты, и покажет полезную аналитику.',
      },
      {
        heading: 'Первые шаги',
        content: '1. **Запустите таймер** — нажмите кнопку Play в правом верхнем углу или используйте хоткей T\n2. **Выберите категорию** — укажите, над каким проектом работаете\n3. **Остановите таймер** — когда закончите, время автоматически сохранится\n4. **Посмотрите статистику** — раскройте блоки аналитики для анализа',
        icon: Play,
      },
      {
        tip: 'Используйте демо-данные для изучения интерфейса. Их можно удалить в любой момент через Настройки → Данные.',
      },
    ]
  },
  'timer': {
    title: 'Таймер',
    sections: [
      {
        heading: 'Как работает таймер',
        content: 'Таймер отслеживает ваше рабочее время в реальном времени. Есть два способа запуска:\n\n• **Кнопка Play** — в шапке или в разделе "База данных"\n• **Хоткей T** — мгновенный запуск/остановка',
        icon: Clock,
      },
      {
        heading: 'Автосохранение',
        content: 'При остановке таймера запись автоматически:\n- Сохраняется в базу данных\n- Рассчитывает доход по вашей ставке\n- Обновляет статистику и графики',
      },
      {
        heading: 'Pomodoro режим',
        content: 'Включите Pomodoro в Настройках → Продуктивность для работы циклами по 25 минут с перерывами.',
        tip: 'Pomodoro и обычный таймер могут работать одновременно!',
      },
    ]
  },
  'entries': {
    title: 'База данных записей',
    sections: [
      {
        heading: 'Управление записями',
        content: 'Секция "База данных" содержит все ваши записи о работе. Доступно несколько видов отображения:\n\n• **Сетка** — компактные карточки\n• **Список** — детальный вид\n• **Таймлайн** — хронология\n• **Календарь** — по датам',
        icon: Database,
      },
      {
        heading: 'Быстрое добавление',
        content: 'Кнопка "+" позволяет создать запись вручную, указав:\n- Дату и время\n- Длительность\n- Категорию/проект\n- Почасовую ставку\n- Описание',
        icon: Plus,
      },
      {
        heading: 'Импорт и Экспорт',
        content: '• **Экспорт** — скачайте все данные в JSON-файл\n• **Импорт** — загрузите данные из файла\n\nЭто позволяет переносить данные между устройствами и создавать резервные копии.',
        icon: Download,
      },
    ]
  },
  'basic-analytics': {
    title: 'Базовая аналитика',
    sections: [
      {
        heading: 'Что показывает',
        content: 'Базовая аналитика — это ваш дашборд с ключевыми метриками:\n\n• **Всего часов** — общее отработанное время\n• **Общий доход** — сумма заработка\n• **Средняя ставка** — ваша эффективная ставка\n• **Количество записей** — сколько сессий работы',
        icon: BarChart3,
      },
      {
        heading: 'Фильтрация',
        content: 'Можете выбрать период для анализа:\n- Сегодня\n- Неделя / Месяц / Год\n- Произвольный диапазон дат',
      },
      {
        tip: 'Нажмите на иконку Pin рядом с фильтром, чтобы установить его по умолчанию.',
      },
    ]
  },
  'descriptive': {
    title: 'Описательная аналитика',
    sections: [
      {
        heading: 'Графики и визуализации',
        content: 'Раздел содержит детальные графики вашей работы:\n\n• **Динамика доходов** — как менялся заработок\n• **Распределение по категориям** — на что уходит время\n• **Анализ дней недели** — какие дни самые продуктивные\n• **Анализ часов** — в какое время работаете эффективнее',
        icon: TrendingUp,
      },
      {
        heading: 'Режимы отображения',
        content: '• **Раздельно** — каждый график отдельно\n• **Совместно** — графики на общей оси',
      },
      {
        heading: 'Выбор графиков',
        content: 'Кнопка "Графики" позволяет включать/выключать отдельные визуализации по вашему выбору.',
        tip: 'Календарь доходов (Heatmap) показывает интенсивность работы за год!',
      },
    ]
  },
  'predictive': {
    title: 'Предиктивная аналитика',
    sections: [
      {
        heading: 'Прогнозирование',
        content: 'На основе ваших данных система строит прогнозы:\n\n• **Прогноз заработка** — сколько заработаете к концу месяца/года\n• **Тренды** — как меняется ваша продуктивность\n• **What-If калькулятор** — моделирование сценариев',
        icon: BarChart2,
      },
      {
        heading: 'Анализ выгорания',
        content: 'Виджет "Прогноз выгорания" анализирует:\n- Частоту переработок\n- Регулярность перерывов\n- Паттерны нагрузки\n\nИ предупреждает о рисках переутомления.',
      },
      {
        heading: 'Сезонность',
        content: 'Heatmap сезонности показывает, в какие месяцы и дни недели вы работаете активнее. Это помогает планировать нагрузку.',
      },
    ]
  },
  'comparative': {
    title: 'Сравнительная аналитика',
    sections: [
      {
        heading: 'Сравнение периодов',
        content: 'Анализируйте изменения вашей продуктивности:\n\n• **MoM (Month-over-Month)** — сравнение с прошлым месяцем\n• **YoY (Year-over-Year)** — сравнение с прошлым годом\n• **Тренд за 6 месяцев** — среднесрочная динамика',
        icon: GitCompare,
      },
      {
        heading: 'Анализ периодов',
        content: 'Показывает ваши лучшие и худшие недели по доходу и отработанным часам.',
      },
      {
        heading: 'Радар сравнения',
        content: 'Наглядное сравнение текущего и прошлого месяца по 5 метрикам: доход, часы, записи, ставка, продуктивность.',
      },
    ]
  },
  'ai-assistant': {
    title: 'AI Ассистент',
    sections: [
      {
        heading: 'Умные уведомления',
        content: 'AI анализирует ваши данные и генерирует персональные инсайты:\n\n• **Паттерны продуктивности** — когда вы работаете эффективнее\n• **Аномалии** — необычные изменения в данных\n• **Рекомендации** — советы по оптимизации',
        icon: Sparkles,
      },
      {
        heading: 'Типы уведомлений',
        content: '• **Инсайт** — интересное наблюдение\n• **Достижение** — поздравление с успехом\n• **Предупреждение** — внимание к проблеме\n• **Совет** — практическая рекомендация',
      },
      {
        heading: 'Настройка',
        content: 'В Настройках → AI Ассистент можно:\n- Включить/выключить уведомления\n- Выбрать типы и приоритеты\n- Настроить частоту проверки',
        tip: 'AI учится на ваших данных — чем больше записей, тем точнее инсайты!',
      },
    ]
  },
  'categories': {
    title: 'Категории',
    sections: [
      {
        heading: 'Что такое категории',
        content: 'Категории — это теги для ваших рабочих сессий. Они позволяют разделять время по проектам, клиентам или типам задач.',
        icon: Target,
      },
      {
        heading: 'Создание категорий',
        content: 'В Настройках → Категории можно:\n\n• Добавить новую категорию\n• Выбрать цвет и иконку\n• Установить почасовую ставку по умолчанию\n• Архивировать неиспользуемые',
      },
      {
        heading: 'Анализ по категориям',
        content: 'Графики автоматически группируют данные по категориям, показывая:\n- Распределение времени\n- Доход по проектам\n- Эффективность категорий',
      },
    ]
  },
  'hotkeys': {
    title: 'Горячие клавиши',
    sections: [
      {
        heading: 'Быстрый доступ',
        content: 'Используйте клавиатуру для мгновенных действий:\n\n• **T** — Запуск/остановка таймера\n• **N** — Новая запись\n• **Ctrl+K** — Командная палитра\n• **/** — Поиск\n• **F1** — Справка\n• **Esc** — Закрыть модальное окно',
        icon: Keyboard,
      },
      {
        heading: 'Навигация',
        content: '• **Ctrl+S** — Сохранить\n• **Ctrl+Z** — Отменить\n• **Ctrl+Y** — Повторить\n• **Ctrl+Shift+E** — Экспорт данных',
      },
      {
        tip: 'Все хоткейи можно посмотреть в Настройках → Горячие клавиши',
      },
    ]
  },
  'sync': {
    title: 'Синхронизация и бэкапы',
    sections: [
      {
        heading: 'Локальное хранение',
        content: 'По умолчанию все данные хранятся локально в браузере (LocalStorage). Это безопасно, но данные привязаны к устройству.',
        icon: Shield,
      },
      {
        heading: 'Облачная синхронизация',
        content: 'Зарегистрируйтесь, чтобы:\n\n• Синхронизировать данные между устройствами\n• Автоматически создавать облачные бэкапы\n• Не потерять данные при очистке браузера',
        icon: Cloud,
      },
      {
        heading: 'Ручные бэкапы',
        content: 'В Настройках → Данные можно:\n\n• Экспортировать все данные в JSON\n• Импортировать из файла\n• Создать резервную копию настроек',
        tip: 'Рекомендуем делать ручной бэкап раз в неделю!',
      },
    ]
  },
  'view-modes': {
    title: 'Режимы просмотра: Focus / Analytics',
    sections: [
      {
        heading: 'Два режима работы',
        content: 'Приложение поддерживает два режима интерфейса, которые можно переключать в шапке сайта:\n\n• **Focus Mode** — минималистичный режим для работы\n• **Analytics Mode** — полная аналитика и графики',
        icon: Focus,
      },
      {
        heading: 'Focus Mode 🎯',
        content: 'Режим для концентрации на работе:\n\n• Скрывает всю аналитику и графики\n• Оставляет только список записей и таймер\n• Идеален для ежедневного использования',
      },
      {
        heading: 'Analytics Mode 📊',
        content: 'Полный режим с аналитикой:\n\n• Базовая статистика\n• Описательная аналитика (графики)\n• Предиктивная аналитика (прогнозы)\n• Сравнительная аналитика (MoM, YoY)',
      },
      {
        heading: 'Быстрое переключение',
        content: '• Кнопки в шапке (иконки 🎯 и 📊)\n• Горячая клавиша: **Ctrl+Shift+F**',
        icon: Keyboard,
      },
      {
        tip: 'Режим сохраняется автоматически и будет активен при следующем открытии приложения!',
      },
    ]
  },
}

// Компонент для отображения контента раздела
function HelpContentSection({ sectionId, onNext, hasNext }: { sectionId: string; onNext: () => void; hasNext: boolean }) {
  const content = helpContent[sectionId]
  const sectionInfo = allSectionsFlat.find(s => s.id === sectionId)
  const SectionIcon = sectionInfo?.icon
  
  if (!content) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <HelpCircle className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
        <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">
          Раздел в разработке
        </h3>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
          Скоро здесь появится подробная справка
        </p>
      </div>
    )
  }
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 space-y-5">
        {/* Заголовок с иконкой */}
        <div className="flex items-center gap-3">
          {SectionIcon && <SectionIcon className="w-7 h-7 text-blue-500" />}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {content.title}
          </h2>
        </div>
        
        {content.sections.map((section, index) => (
          <div key={index} className="space-y-2">
            {section.heading && (
              <div className="flex items-center gap-2">
                {section.icon && <section.icon className="w-5 h-5 text-blue-500" />}
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  {section.heading}
                </h3>
              </div>
            )}
            
            {section.content && (
              <div className="text-gray-600 dark:text-gray-300 leading-relaxed pl-0.5">
                {section.content.split('\n').map((line, i) => {
                  // Простой парсинг **bold**
                  const parts = line.split(/(\*\*[^*]+\*\*)/g)
                  return (
                    <p key={i} className="mb-1.5">
                      {parts.map((part, j) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                          return <strong key={j} className="font-semibold text-gray-800 dark:text-gray-100">{part.slice(2, -2)}</strong>
                        }
                        return part
                      })}
                    </p>
                  )
                })}
              </div>
            )}
            
            {section.tip && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                <Zap className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {section.tip}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Кнопка Далее */}
      {hasNext && (
        <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <Button 
            onClick={onNext}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
          >
            Далее
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  )
}

// Приветственный экран
function WelcomeScreen({ onSelectSection }: { onSelectSection: (id: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-6 shadow-lg">
        <BookOpen className="w-10 h-10 text-white" />
      </div>
      
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
        Справочный центр
      </h2>
      
      <p className="text-gray-600 dark:text-gray-300 max-w-md mb-8">
        Здесь вы найдёте подробную информацию о всех функциях приложения. 
        Выберите раздел слева или начните с основ.
      </p>
      
      <button
        onClick={() => onSelectSection('getting-started')}
        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all hover:scale-105 shadow-lg shadow-blue-500/25"
      >
        Начать изучение
        <ChevronRight className="w-5 h-5" />
      </button>
      
      <div className="mt-8 grid grid-cols-3 gap-4 max-w-lg">
        {[
          { id: 'timer', icon: Clock, label: 'Таймер', color: 'text-green-500' },
          { id: 'basic-analytics', icon: BarChart3, label: 'Аналитика', color: 'text-cyan-500' },
          { id: 'hotkeys', icon: Keyboard, label: 'Хоткеи', color: 'text-amber-500' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => onSelectSection(item.id)}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <item.icon className={`w-6 h-6 ${item.color}`} />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

interface HelpCenterModalProps {
  isOpen: boolean
  onClose: () => void
  initialSection?: string | null
}

export function HelpCenterModal({ isOpen, onClose, initialSection = null }: HelpCenterModalProps) {
  const isMobile = useIsMobile()
  const [activeSection, setActiveSection] = useState<string | null>(initialSection)
  
  // Сброс при открытии
  useEffect(() => {
    if (isOpen) {
      setActiveSection(initialSection)
    }
  }, [isOpen, initialSection])
  
  // Навигация: следующий раздел
  const handleNext = useCallback(() => {
    if (!activeSection) {
      setActiveSection(allSectionsFlat[0].id)
      return
    }
    const currentIndex = allSectionsFlat.findIndex(s => s.id === activeSection)
    if (currentIndex < allSectionsFlat.length - 1) {
      setActiveSection(allSectionsFlat[currentIndex + 1].id)
    }
  }, [activeSection])
  
  const hasNext = useMemo(() => {
    if (!activeSection) return true
    const currentIndex = allSectionsFlat.findIndex(s => s.id === activeSection)
    return currentIndex < allSectionsFlat.length - 1
  }, [activeSection])
  
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Справка"
      titleIcon={BookOpen}
      size="large"
      className="!max-w-5xl"
      disableContentScroll
    >
      <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} -mx-6`}>
        {/* Боковая навигация */}
        <div className={`${isMobile ? 'border-b' : 'border-r'} border-gray-200 dark:border-gray-700 ${isMobile ? 'pb-4' : 'pr-4 w-72 flex-shrink-0'}`}>
          <nav className={`p-4 pl-6 ${isMobile ? 'flex gap-2 overflow-x-auto pb-2' : 'flex flex-col gap-2'}`}>
            {helpGroups.map((group, groupIndex) => (
              <div key={group.id} className={isMobile ? 'flex gap-2' : ''}>
                {!isMobile && (
                  <div className={`
                    px-3 text-sm text-gray-500 dark:text-gray-400 font-medium
                    pb-2
                    ${groupIndex > 0 ? 'mt-1 pt-1 border-t border-gray-100 dark:border-gray-800' : ''}
                  `}>
                    {group.title}
                  </div>
                )}
                <div className={isMobile ? 'flex gap-2' : 'flex flex-col gap-2'}>
                  {group.items.map((item) => (
                    <SettingsNavItem
                      key={item.id}
                      icon={item.icon}
                      title={item.title}
                      subtitle={item.subtitle}
                      accentClass={item.accentClass}
                      onClick={() => setActiveSection(item.id)}
                      isActive={activeSection === item.id}
                    />
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </div>
        
        {/* Контент */}
        <div className="flex-1 p-6 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection || 'welcome'}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              {activeSection ? (
                <HelpContentSection 
                  sectionId={activeSection} 
                  onNext={handleNext}
                  hasNext={hasNext}
                />
              ) : (
                <WelcomeScreen onSelectSection={setActiveSection} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </BaseModal>
  )
}

export default HelpCenterModal
