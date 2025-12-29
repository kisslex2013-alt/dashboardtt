import {
  History,
  Rocket,
  Heart,
  Copy,
  Check,
  Code,
  Loader2,
  ChevronDown,
  ChevronUp,
} from '../../utils/icons'
import { Button } from '../ui/Button'
import { BaseModal } from '../ui/BaseModal'
import { AnimatedModalContent } from '../ui/AnimatedModalContent'
import { useState, useEffect } from 'react'
import { loadChangelog } from '../../utils/changelogParser'
import { loadImplementationPlan } from '../../utils/implementationPlanParser'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Модальное окно "О приложении"
 * - Название и версия
 * - Описание
 * - История версий
 * - Технологии
 */
export function AboutModal({ isOpen, onClose }) {
  const [copiedCard, setCopiedCard] = useState(null)
  const [activeTab, setActiveTab] = useState('history')
  const [changelogData, setChangelogData] = useState([])
  const [planData, setPlanData] = useState(null)
  const [isLoadingChangelog, setIsLoadingChangelog] = useState(false)
  const [isLoadingPlan, setIsLoadingPlan] = useState(false)

  // Состояния для аккордеонов разделов задач (минималистичный стиль - только категории)
  const [expandedSections, setExpandedSections] = useState({
    critical: false,
    important: false,
    desirable: false,
  })

  // Состояния для аккордеонов версий в истории изменений
  const [expandedVersions, setExpandedVersions] = useState({})

  // Состояния для аккордеонов технологий
  const [expandedTechs, setExpandedTechs] = useState({})

  // Функция для переключения версии
  const toggleVersion = version => {
    setExpandedVersions(prev => ({
      ...prev,
      [version]: !prev[version],
    }))
  }

  // Функция для подсчета изменений в категории
  const getCategoryCount = (version, category) => {
    if (!changelogData || changelogData.length === 0) return 0
    const versionData = changelogData.find(v => v.version === version)
    if (!versionData || !versionData.categories[category]) return 0
    return versionData.categories[category].length
  }

  // Функция для подсчета общего количества изменений в версии
  const getTotalChanges = version => {
    if (!changelogData || changelogData.length === 0) return 0
    const versionData = changelogData.find(v => v.version === version)
    if (!versionData || !versionData.categories) return 0
    return Object.values(versionData.categories).reduce((sum, items) => sum + items.length, 0)
  }

  // Функция для переключения раздела (минималистичный стиль - только категории)
  const toggleSection = section => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  // Функция для подсчета задач
  const getTaskCount = (section, status) => {
    if (!planData || !planData[section] || !planData[section][status]) return 0
    return planData[section][status].length
  }

  // Функция для подсчета общего количества задач в разделе
  const getTotalTasks = section => {
    if (!planData || !planData[section]) return 0
    return (
      getTaskCount(section, 'completed') +
      getTaskCount(section, 'inProgress') +
      getTaskCount(section, 'planning')
    )
  }

  // Данные о технологиях с подробным описанием
  const technologies = [
    {
      name: 'React 18',
      description:
        'Современная библиотека для создания пользовательских интерфейсов. Используется для построения компонентной архитектуры приложения.',
      version: '18.2+',
      icon: '⚛️',
    },
    {
      name: 'Zustand',
      description:
        'Легковесная библиотека для управления состоянием приложения. Позволяет эффективно хранить и обновлять данные без излишней сложности.',
      version: '4.4+',
      icon: '🐻',
    },
    {
      name: 'Tailwind CSS',
      description:
        'Utility-first CSS фреймворк для быстрой разработки современного дизайна. Обеспечивает консистентность стилей и высокую производительность.',
      version: '3.4+',
      icon: '🎨',
    },
    {
      name: 'Recharts',
      description:
        'Популярная библиотека для создания интерактивных графиков и диаграмм. Используется для визуализации статистики доходов и рабочего времени.',
      version: '2.12+',
      icon: '📊',
    },
    {
      name: 'Tone.js',
      description:
        'Web Audio API фреймворк для создания звуковых уведомлений и сигналов. Обеспечивает качественные звуковые эффекты для таймера.',
      version: '14.7+',
      icon: '🔊',
    },
    {
      name: 'date-fns',
      description:
        'Мощная библиотека для работы с датами и временем. Обеспечивает простое форматирование, парсинг и манипуляции с датами.',
      version: '4.1+',
      icon: '📅',
    },
    {
      name: 'Vite',
      description:
        'Быстрый сборщик для современных веб-приложений. Обеспечивает мгновенную перезагрузку модулей и оптимизированную сборку.',
      version: '5+',
      icon: '⚡',
    },
    {
      name: 'Framer Motion',
      description:
        'Библиотека для создания плавных анимаций в React. Используется для анимации чисел, текста, дат и других элементов интерфейса.',
      version: '12.23+',
      icon: '🎬',
    },
  ]

  // Номера карт для поддержки проекта
  const bankCards = [
    {
      bank: 'Тинькофф',
      cardNumber: '2200 7010 0588 9560',
      holder: 'Алексей С.',
    },
    {
      bank: 'Сбербанк',
      cardNumber: '5469 1300 1116 2383',
      holder: 'Алексей С.',
    },
    {
      bank: 'Альфабанк',
      cardNumber: '2200 1529 7420 8525',
      holder: 'Алексей С.',
    },
  ]

  // ИСПРАВЛЕНО: Единый QR код для всех карт
  // Приоритет: 1) WebP изображение (оптимизированное), 2) PNG изображение (fallback), 3) Автоматическая генерация через API
  // ✅ ОПТИМИЗАЦИЯ: Используем WebP формат с fallback на PNG для старых браузеров
  const getQRCodeUrl = () => {
    // ВАРИАНТ 1: Использовать оптимизированное WebP изображение QR кода
    // Браузер автоматически выберет WebP, если поддерживается, иначе PNG
    return '/images/qr-code-alexey.webp'

    // ВАРИАНТ 2: Использовать PNG изображение (fallback для старых браузеров)
    // return '/images/qr-code-alexey.png';

    // ВАРИАНТ 3: Автоматическая генерация QR кода через API (используется по умолчанию)
    // Формируем данные для QR кода на основе Тинькофф (первая карта)
    // ИСПРАВЛЕНО: Используем данные карты Тинькофф для QR кода
    // const tinkoffCardNumber = '2200701005889560'; // Без пробелов для QR кода
    // const sbpData = `ST00012|Name=Алексей С.|PersonalAcc=${tinkoffCardNumber}|Sum=0000000000`;

    // Генерируем QR код через API
    // const qrData = encodeURIComponent(sbpData);
    // return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}&bgcolor=ffffff&color=000000&margin=1`;
  }

  // Копирование номера карты в буфер обмена (без пробелов для удобства)
  const handleCopyCard = async (cardNumber, bank) => {
    try {
      // Убираем пробелы из номера карты при копировании
      const cardNumberWithoutSpaces = cardNumber.replace(/\s/g, '')
      await navigator.clipboard.writeText(cardNumberWithoutSpaces)
      setCopiedCard(bank)
      setTimeout(() => setCopiedCard(null), 2000)
    } catch (err) {
      console.error('Ошибка копирования:', err)
    }
  }

  // Загрузка changelog при открытии вкладки "История"
  useEffect(() => {
    if (isOpen && activeTab === 'history' && changelogData.length === 0 && !isLoadingChangelog) {
      setIsLoadingChangelog(true)
      loadChangelog()
        .then(data => {
          setChangelogData(data)
          setIsLoadingChangelog(false)
        })
        .catch(error => {
          console.error('Error loading changelog:', error)
          setIsLoadingChangelog(false)
        })
    }
  }, [isOpen, activeTab, changelogData.length, isLoadingChangelog])

  // Загрузка планов при открытии вкладки "Планы"
  useEffect(() => {
    if (isOpen && activeTab === 'roadmap' && !planData && !isLoadingPlan) {
      setIsLoadingPlan(true)
      loadImplementationPlan()
        .then(data => {
          setPlanData(data)
          setIsLoadingPlan(false)
        })
        .catch(error => {
          console.error('Error loading implementation plan:', error)
          setIsLoadingPlan(false)
        })
    }
  }, [isOpen, activeTab, planData, isLoadingPlan])

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Time Tracker Dashboard"
      subtitle="Версия 1.3.0"
      size="large"
      closeOnOverlayClick={false}
      disableContentScroll={true}
      footer={
        <div>
          <Button variant="primary" onClick={onClose} className="w-full mb-2" iconId="about-close">
            Закрыть
          </Button>
          <p className="text-xs text-center text-gray-500 dark:text-gray-400 mb-0">
            Создано с ❤️ для эффективного учета времени
          </p>
        </div>
      }
    >
      {/* Логотип приложения */}
      <div className="flex justify-center mb-6 logo-animation-1">
        <svg
          viewBox="0 0 200 200"
          xmlns="http://www.w3.org/2000/svg"
          className="w-32 h-32 object-contain logo-data-pulse"
          aria-label="Time Tracker Logo"
        >
          <defs>
            <linearGradient id="grad4-v1-about" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style={{ stopColor: '#3B82F6', stopOpacity: 1 }} />
              <stop offset="50%" style={{ stopColor: '#10B981', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#F59E0B', stopOpacity: 1 }} />
            </linearGradient>
          </defs>
          {/* Концентрические круги - пульсируют */}
          <circle
            className="circle-1"
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="#3B82F6"
            strokeWidth="2"
            opacity="0.2"
          >
            <animate attributeName="r" values="90;100;90" dur="2s" repeatCount="indefinite" />
            <animate
              attributeName="opacity"
              values="0.2;0.4;0.2"
              dur="2s"
              repeatCount="indefinite"
            />
          </circle>
          <circle
            className="circle-2"
            cx="100"
            cy="100"
            r="75"
            fill="none"
            stroke="#10B981"
            strokeWidth="2"
            opacity="0.3"
          >
            <animate attributeName="r" values="75;85;75" dur="2.2s" repeatCount="indefinite" />
            <animate
              attributeName="opacity"
              values="0.3;0.5;0.3"
              dur="2.2s"
              repeatCount="indefinite"
            />
          </circle>
          <circle
            className="circle-3"
            cx="100"
            cy="100"
            r="60"
            fill="none"
            stroke="#F59E0B"
            strokeWidth="2"
            opacity="0.4"
          >
            <animate attributeName="r" values="60;70;60" dur="2.4s" repeatCount="indefinite" />
            <animate
              attributeName="opacity"
              values="0.4;0.6;0.4"
              dur="2.4s"
              repeatCount="indefinite"
            />
          </circle>
          <circle
            className="circle-4"
            cx="100"
            cy="100"
            r="45"
            fill="url(#grad4-v1-about)"
            opacity="0.2"
          >
            <animate attributeName="r" values="45;55;45" dur="2.6s" repeatCount="indefinite" />
            <animate
              attributeName="opacity"
              values="0.2;0.4;0.2"
              dur="2.6s"
              repeatCount="indefinite"
            />
          </circle>
          {/* Пульс (волна данных) - анимация как в реальном ECG */}
          <path
            className="pulse-path"
            d="M 30 100 L 50 100 L 60 70 L 70 130 L 80 100 L 100 100 L 110 85 L 120 115 L 130 100 L 150 100 L 170 100"
            fill="none"
            stroke="url(#grad4-v1-about)"
            strokeWidth="4"
            strokeLinecap="round"
          >
            <animate
              attributeName="d"
              values="M 30 100 L 50 100 L 60 70 L 70 130 L 80 100 L 100 100 L 110 85 L 120 115 L 130 100 L 150 100 L 170 100;M 30 100 L 50 100 L 60 65 L 70 135 L 80 100 L 100 100 L 110 80 L 120 120 L 130 100 L 150 100 L 170 100;M 30 100 L 50 100 L 60 60 L 70 140 L 80 100 L 100 100 L 110 75 L 120 125 L 130 100 L 150 100 L 170 100;M 30 100 L 50 100 L 60 65 L 70 135 L 80 100 L 100 100 L 110 80 L 120 120 L 130 100 L 150 100 L 170 100;M 30 100 L 50 100 L 60 70 L 70 130 L 80 100 L 100 100 L 110 85 L 120 115 L 130 100 L 150 100 L 170 100"
              dur="1.2s"
              repeatCount="indefinite"
              calcMode="spline"
              keySplines="0.4 0 0.2 1; 0.4 0 0.2 1; 0.4 0 0.2 1; 0.4 0 0.2 1"
            />
          </path>
          {/* Точки на пульсе - вращаются по циферблату с разной скоростью */}
          <g className="pulse-dot-group-1" transform="translate(100, 100)">
            <circle className="pulse-dot" cx="0" cy="-35" r="4" fill="#3B82F6" />
          </g>
          <g className="pulse-dot-group-2" transform="translate(100, 100)">
            <circle className="pulse-dot" cx="0" cy="-30" r="4" fill="#10B981" />
          </g>
          <g className="pulse-dot-group-3" transform="translate(100, 100)">
            <circle className="pulse-dot" cx="0" cy="-25" r="4" fill="#F59E0B" />
          </g>
          <g className="pulse-dot-group-4" transform="translate(100, 100)">
            <circle className="pulse-dot" cx="0" cy="-20" r="4" fill="#10B981" />
          </g>
          {/* Стрелки часов - часовая и минутная */}
          <circle
            className="center-circle"
            cx="100"
            cy="100"
            r="15"
            fill="none"
            stroke="#3B82F6"
            strokeWidth="3"
          />
          <g transform="translate(100, 100)">
            {/* Часовая стрелка - толще, короче, медленнее */}
            <g className="hour-hand">
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="-25"
                stroke="#3B82F6"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </g>
            {/* Минутная стрелка - тоньше, длиннее, быстрее */}
            <g className="minute-hand">
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="-40"
                stroke="#10B981"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </g>
          </g>
          <circle className="center-dot" cx="100" cy="100" r="3" fill="#F59E0B" />
        </svg>
      </div>

      {/* Описание */}
      <div className="mb-4">
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm">
          Современное приложение для учета рабочего времени с мощной аналитикой. Отслеживайте время,
          анализируйте продуктивность и оптимизируйте свой заработок.
        </p>
      </div>

      {/* Вкладки */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('history')}
            className={`
              px-4 py-3 text-sm font-medium transition-colors relative
              ${
                activeTab === 'history'
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }
            `}
          >
            <div className="flex items-center gap-2">
              <History className="w-4 h-4" />
              <span>История</span>
            </div>
            {activeTab === 'history' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('roadmap')}
            className={`
              px-4 py-3 text-sm font-medium transition-colors relative
              ${
                activeTab === 'roadmap'
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }
            `}
          >
            <div className="flex items-center gap-2">
              <Rocket className="w-4 h-4" />
              <span>Планы</span>
            </div>
            {activeTab === 'roadmap' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('tech')}
            className={`
              px-4 py-3 text-sm font-medium transition-colors relative
              ${
                activeTab === 'tech'
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }
            `}
          >
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4" />
              <span>Технологии</span>
            </div>
            {activeTab === 'tech' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('support')}
            className={`
              px-4 py-3 text-sm font-medium transition-colors relative
              ${
                activeTab === 'support'
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }
            `}
          >
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              <span>Поддержка</span>
            </div>
            {activeTab === 'support' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
            )}
          </button>
        </div>
      </div>

      {/* Содержимое вкладок С анимацией */}
      <AnimatedModalContent contentKey={activeTab}>
        {/* Вкладка: История изменений */}
        {activeTab === 'history' && (
          <div className="max-h-[calc(90vh-500px)] overflow-y-auto pr-2 space-y-3">
            {isLoadingChangelog ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Загрузка истории изменений...
                </p>
              </div>
            ) : changelogData.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Не удалось загрузить историю изменений
                </p>
              </div>
            ) : (
              changelogData.map((item, index) => {
                const versionKey = item.version
                const isExpanded = expandedVersions[versionKey] || false
                const categoryColors = {
                  'Новые возможности': { color: 'blue', text: 'text-blue-600 dark:text-blue-400' },
                  'Улучшения интерфейса': {
                    color: 'purple',
                    text: 'text-purple-600 dark:text-purple-400',
                  },
                  'Исправления ошибок': { color: 'red', text: 'text-red-600 dark:text-red-400' },
                  'Технические улучшения': {
                    color: 'teal',
                    text: 'text-teal-600 dark:text-teal-400',
                  },
                }

                return (
                  <div
                    key={versionKey}
                    className="glass-effect rounded-lg p-4 border border-gray-200/50 dark:border-gray-700/50 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all duration-200"
                  >
                    <button
                      onClick={() => toggleVersion(versionKey)}
                      className="w-full flex items-center justify-between text-left"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex flex-col gap-0.5 flex-shrink-0">
                          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                            {item.version}
                          </span>
                          {item.date && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                              {(() => {
                                const [year, month, day] = item.date.split('-')
                                return `${day}.${month}.${year}`
                              })()}
                            </span>
                          )}
                        </div>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white truncate flex-1">
                          {item.title}
                        </span>
                        {/* ✅ A11Y: Улучшаем контраст для темной темы */}
                        <span className="text-xs text-gray-400 dark:text-gray-300 whitespace-nowrap">
                          {getTotalChanges(versionKey)} измен.
                        </span>
                      </div>
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                      >
                        {/* ✅ A11Y: Улучшаем контраст для темной темы */}
                        <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-300 ml-2 flex-shrink-0" />
                      </motion.div>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                          className="overflow-hidden"
                        >
                          <div className="mt-3 pt-3 border-t border-gray-200/50 dark:border-gray-700/50 space-y-2">
                            {Object.entries(item.categories).map(([categoryName, items]) => {
                              if (items.length === 0) return null
                              const categoryInfo = categoryColors[categoryName] || {
                                color: 'blue',
                                text: 'text-blue-600 dark:text-blue-400',
                              }

                              return (
                                <div key={categoryName} className="space-y-1.5">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className={`text-xs font-semibold ${categoryInfo.text}`}>
                                      {categoryName === 'Новые возможности'
                                        ? '✨'
                                        : categoryName === 'Улучшения интерфейса'
                                          ? '🎨'
                                          : categoryName === 'Исправления ошибок'
                                            ? '🐛'
                                            : categoryName === 'Технические улучшения'
                                              ? '⚙️'
                                              : '📝'}{' '}
                                      {categoryName === 'Новые возможности'
                                        ? 'Новые'
                                        : categoryName === 'Улучшения интерфейса'
                                          ? 'Интерфейс'
                                          : categoryName === 'Исправления ошибок'
                                            ? 'Исправления'
                                            : categoryName === 'Технические улучшения'
                                              ? 'Технические'
                                              : categoryName}{' '}
                                      ({getCategoryCount(versionKey, categoryName)})
                                    </span>
                                  </div>
                                  <div className="pl-4 space-y-1 text-xs text-gray-600 dark:text-gray-400">
                                    {items.map((change, changeIndex) => {
                                      if (typeof change === 'object' && change !== null) {
                                        return <div key={change.text || `${categoryName}-${changeIndex}`}>• {change.text}</div>
                                      }
                                      const emojiMatch =
                                        typeof change === 'string'
                                          ? change.match(
                                              /^([\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}])/u
                                            )
                                          : null
                                      const emoji = emojiMatch ? emojiMatch[0] : null
                                      const text =
                                        typeof change === 'string'
                                          ? (emoji
                                              ? change.substring(emoji.length).trim()
                                              : change
                                            ).replace(/^\*\*[^*]+\*\*\s*-\s*/, '')
                                          : String(change)
                                      return <div key={`${categoryName}-${text}-${changeIndex}`}>• {text}</div>
                                    })}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* Вкладка: Планы развития */}
        {activeTab === 'roadmap' && (
          <div className="max-h-[calc(90vh-500px)] overflow-y-auto pr-2 space-y-4">
            {isLoadingPlan ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Загрузка планов развития...
                </p>
              </div>
            ) : !planData ? (
              <div className="text-center py-12">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Не удалось загрузить планы развития
                </p>
              </div>
            ) : (
              <>
                {/* Критичные задачи */}
                <div className="glass-effect rounded-lg p-4 border border-red-200/50 dark:border-red-700/50 hover:border-red-300 dark:hover:border-red-600 hover:shadow-md transition-all duration-200 mb-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500"></span>
                      <h3 className="text-sm font-semibold text-red-600 dark:text-red-400">
                        Критичные задачи
                      </h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ({getTotalTasks('critical')})
                      </span>
                    </div>
                    <button
                      onClick={() => toggleSection('critical')}
                      className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
                    >
                      <motion.div
                        animate={{ rotate: expandedSections.critical ? 180 : 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </motion.div>
                    </button>
                  </div>

                  <AnimatePresence>
                    {expandedSections.critical && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 pt-3 border-t border-red-200/50 dark:border-red-700/50 space-y-2">
                          {/* Выполнено */}
                          {planData.critical.completed.length > 0 && (
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                                  ✅ Выполнено ({getTaskCount('critical', 'completed')})
                                </span>
                              </div>
                              <div className="pl-4 space-y-1 text-xs text-gray-600 dark:text-gray-400">
                                {planData.critical.completed.map((task, index) => (
                                  <div key={`task-critical-completed-${task.title}-${index}`}>• {task.title}</div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* В разработке */}
                          {planData.critical.inProgress.length > 0 && (
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-semibold text-orange-600 dark:text-orange-400">
                                  ⚠️ В разработке ({getTaskCount('critical', 'inProgress')})
                                </span>
                              </div>
                              <div className="pl-4 space-y-1 text-xs text-gray-600 dark:text-gray-400">
                                {planData.critical.inProgress.map((task, index) => (
                                  <div key={`task-critical-inProgress-${task.title}-${index}`}>• {task.title}</div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Отложено */}
                          {planData.critical.planning.length > 0 && (
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-semibold text-yellow-600 dark:text-yellow-400">
                                  📋 Отложено ({getTaskCount('critical', 'planning')})
                                </span>
                              </div>
                              <div className="pl-4 space-y-1 text-xs text-gray-600 dark:text-gray-400">
                                {planData.critical.planning.map((task, index) => (
                                  <div key={`task-critical-planning-${task.title}-${index}`}>• {task.title}</div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Важные задачи */}
                <div className="glass-effect rounded-lg p-4 border border-orange-200/50 dark:border-orange-700/50 hover:border-orange-300 dark:hover:border-orange-600 hover:shadow-md transition-all duration-200 mb-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                      <h3 className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                        Важные задачи
                      </h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ({getTotalTasks('important')})
                      </span>
                    </div>
                    <button
                      onClick={() => toggleSection('important')}
                      className="text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300 transition-colors"
                    >
                      <motion.div
                        animate={{ rotate: expandedSections.important ? 180 : 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </motion.div>
                    </button>
                  </div>

                  <AnimatePresence>
                    {expandedSections.important && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 pt-3 border-t border-orange-200/50 dark:border-orange-700/50 space-y-2">
                          {/* Выполнено */}
                          {planData.important.completed.length > 0 && (
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                                  ✅ Выполнено ({getTaskCount('important', 'completed')})
                                </span>
                              </div>
                              <div className="pl-4 space-y-1 text-xs text-gray-600 dark:text-gray-400">
                                {planData.important.completed.map((task, index) => (
                                  <div key={`task-important-completed-${task.title}-${index}`}>• {task.title}</div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* В разработке */}
                          {planData.important.inProgress.length > 0 && (
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-semibold text-orange-600 dark:text-orange-400">
                                  ⚠️ В разработке ({getTaskCount('important', 'inProgress')})
                                </span>
                              </div>
                              <div className="pl-4 space-y-1 text-xs text-gray-600 dark:text-gray-400">
                                {planData.important.inProgress.map((task, index) => (
                                  <div key={`task-important-inProgress-${task.title}-${index}`}>• {task.title}</div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Отложено */}
                          {planData.important.planning.length > 0 && (
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-semibold text-yellow-600 dark:text-yellow-400">
                                  📋 Отложено ({getTaskCount('important', 'planning')})
                                </span>
                              </div>
                              <div className="pl-4 space-y-1 text-xs text-gray-600 dark:text-gray-400">
                                {planData.important.planning.map((task, index) => (
                                  <div key={`task-important-planning-${task.title}-${index}`}>• {task.title}</div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Желательные задачи */}
                <div className="glass-effect rounded-lg p-4 border border-green-200/50 dark:border-green-700/50 hover:border-green-300 dark:hover:border-green-600 hover:shadow-md transition-all duration-200 mb-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                      <h3 className="text-sm font-semibold text-green-600 dark:text-green-400">
                        Желательные задачи
                      </h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ({getTotalTasks('desirable')})
                      </span>
                    </div>
                    <button
                      onClick={() => toggleSection('desirable')}
                      className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 transition-colors"
                    >
                      <motion.div
                        animate={{ rotate: expandedSections.desirable ? 180 : 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </motion.div>
                    </button>
                  </div>

                  <AnimatePresence>
                    {expandedSections.desirable && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 pt-3 border-t border-green-200/50 dark:border-green-700/50 space-y-2">
                          {/* Выполнено */}
                          {planData.desirable.completed.length > 0 && (
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                                  ✅ Выполнено ({getTaskCount('desirable', 'completed')})
                                </span>
                              </div>
                              <div className="pl-4 space-y-1 text-xs text-gray-600 dark:text-gray-400">
                                {planData.desirable.completed.map((task, index) => (
                                  <div key={`task-desirable-completed-${task.title}-${index}`}>• {task.title}</div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* В разработке */}
                          {planData.desirable.inProgress.length > 0 && (
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-semibold text-orange-600 dark:text-orange-400">
                                  ⚠️ В разработке ({getTaskCount('desirable', 'inProgress')})
                                </span>
                              </div>
                              <div className="pl-4 space-y-1 text-xs text-gray-600 dark:text-gray-400">
                                {planData.desirable.inProgress.map((task, index) => (
                                  <div key={`task-desirable-inProgress-${task.title}-${index}`}>• {task.title}</div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Отложено */}
                          {planData.desirable.planning.length > 0 && (
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-semibold text-yellow-600 dark:text-yellow-400">
                                  📋 Отложено ({getTaskCount('desirable', 'planning')})
                                </span>
                              </div>
                              <div className="pl-4 space-y-1 text-xs text-gray-600 dark:text-gray-400">
                                {planData.desirable.planning.map((task, index) => (
                                  <div key={`task-desirable-planning-${task.title}-${index}`}>• {task.title}</div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400 mt-6 italic">
                  * Статус развития функций может изменяться. Следите за обновлениями!
                </p>
              </>
            )}
          </div>
        )}

        {/* Вкладка: Технологии */}
        {activeTab === 'tech' && (
          <div className="max-h-[calc(90vh-500px)] overflow-y-auto pr-2 space-y-3">
            {technologies.map((tech, index) => {
              const techKey = `tech-${index}`
              const isExpanded = expandedTechs[techKey] || false
              const toggleTech = () => {
                setExpandedTechs(prev => ({
                  ...prev,
                  [techKey]: !prev[techKey],
                }))
              }

              return (
                <div
                  key={`tech-${tech.name}-${index}`}
                  className="glass-effect rounded-lg p-4 border border-gray-200/50 dark:border-gray-700/50 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all duration-200"
                >
                  <button
                    onClick={toggleTech}
                    className="w-full flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-xl flex-shrink-0">{tech.icon}</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white truncate flex-1">
                        {tech.name}
                      </span>
                      <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded whitespace-nowrap flex-shrink-0">
                        {tech.version}
                      </span>
                    </div>
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                    >
                      <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-300 ml-2 flex-shrink-0" />
                    </motion.div>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 pt-3 border-t border-gray-200/50 dark:border-gray-700/50">
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {tech.description}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        )}

        {/* Вкладка: Поддержать проект */}
        {activeTab === 'support' && (
          <div className="min-h-[300px]">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Если вам нравится это приложение, вы можете поддержать его развитие. Любая сумма
              поможет улучшить проект и добавить новые функции.
            </p>

            {/* Grid layout для карт */}
            <div className="grid grid-cols-3 gap-4">
              {/* Названия банков */}
              {bankCards.map((card, index) => (
                <div key={`bank-${card.bank}`} className="text-center">
                  <div className="font-semibold text-gray-900 dark:text-white mb-4">
                    {card.bank}
                  </div>
                </div>
              ))}

              {/* Номера карт с кнопками копирования */}
              {bankCards.map((card, index) => {
                // ИСПРАВЛЕНО: Правильное форматирование номера карты в формат xxxx xxxx xxxx xxxx
                // Сначала убираем все пробелы, затем разбиваем на группы по 4 цифры
                const formattedCardNumber =
                  card.cardNumber
                    .replace(/\s/g, '')
                    .match(/.{1,4}/g)
                    ?.join(' ') || card.cardNumber

                return (
                  <div key={`card-${card.bank}-${card.cardNumber}`} className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2 w-full">
                      <code className="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1.5 rounded border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 flex-1 text-center">
                        {formattedCardNumber}
                      </code>
                    </div>
                    <button
                      onClick={() => handleCopyCard(card.cardNumber, card.bank)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-xs w-full justify-center"
                      title="Копировать номер карты"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Копировать</span>
                    </button>
                    {copiedCard === card.bank && (
                      <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Скопировано!
                      </span>
                    )}
                  </div>
                )
              })}

              {/* QR коды - единый QR код для всех карт */}
              {bankCards.map((card, index) => (
                <div key={`qr-${card.bank}`} className="flex flex-col items-center gap-2">
                  <picture>
                    {/* ✅ ОПТИМИЗАЦИЯ: WebP формат с fallback на PNG для старых браузеров */}
                    <source srcSet="/images/qr-code-alexey.webp" type="image/webp" />
                    <img
                      src="/images/qr-code-alexey.png"
                      alt={`QR код для ${card.bank}`}
                      className="w-28 h-28 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white p-2"
                      loading="lazy"
                    />
                  </picture>
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    Сканируйте для перевода
                  </p>
                </div>
              ))}

              {/* Получатели */}
              {bankCards.map((card, index) => (
                <div key={`holder-${card.bank}-${card.holder || 'unknown'}`} className="text-center">
                  {card.holder && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Получатель: {card.holder}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-6 italic">
              Спасибо за вашу поддержку! 🙏
            </p>
          </div>
        )}
      </AnimatedModalContent>
    </BaseModal>
  )
}
