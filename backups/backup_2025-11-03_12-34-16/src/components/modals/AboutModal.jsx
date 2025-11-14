import { History, Rocket, Heart, Copy, Check, Code } from 'lucide-react';
import { Button } from '../ui/Button';
import { BaseModal } from '../ui/BaseModal';
import { useState } from 'react';

/**
 * Модальное окно "О приложении"
 * - Название и версия
 * - Описание
 * - История версий
 * - Технологии
 */
export function AboutModal({ isOpen, onClose }) {
  const [copiedCard, setCopiedCard] = useState(null);
  const [activeTab, setActiveTab] = useState('history');

  // Данные о технологиях с подробным описанием
  const technologies = [
    {
      name: 'React 18',
      description: 'Современная библиотека для создания пользовательских интерфейсов. Используется для построения компонентной архитектуры приложения.',
      version: '18.2+',
      icon: '⚛️',
    },
    {
      name: 'Zustand',
      description: 'Легковесная библиотека для управления состоянием приложения. Позволяет эффективно хранить и обновлять данные без излишней сложности.',
      version: '4.4+',
      icon: '🐻',
    },
    {
      name: 'Tailwind CSS',
      description: 'Utility-first CSS фреймворк для быстрой разработки современного дизайна. Обеспечивает консистентность стилей и высокую производительность.',
      version: '3.4+',
      icon: '🎨',
    },
    {
      name: 'Recharts',
      description: 'Популярная библиотека для создания интерактивных графиков и диаграмм. Используется для визуализации статистики доходов и рабочего времени.',
      version: '2.12+',
      icon: '📊',
    },
    {
      name: 'Tone.js',
      description: 'Web Audio API фреймворк для создания звуковых уведомлений и сигналов. Обеспечивает качественные звуковые эффекты для таймера.',
      version: '14.7+',
      icon: '🔊',
    },
    {
      name: 'date-fns',
      description: 'Мощная библиотека для работы с датами и временем. Обеспечивает простое форматирование, парсинг и манипуляции с датами.',
      version: '4.1+',
      icon: '📅',
    },
    {
      name: 'Vite',
      description: 'Быстрый сборщик для современных веб-приложений. Обеспечивает мгновенную перезагрузку модулей и оптимизированную сборку.',
      version: '5+',
      icon: '⚡',
    },
  ];

  // Планы развития проекта
  const roadmapItems = [
    {
      status: 'planning',
      icon: '🟡',
      title: 'Настройка даты выплаты',
      description: 'Возможность указать дату выплаты зарплаты для автоматического расчета доходов за период',
    },
    {
      status: 'planning',
      icon: '🟡',
      title: 'Кастомизация цветовой схемы',
      description: 'Настройка цветов интерфейса под ваши предпочтения',
    },
    {
      status: 'planning',
      icon: '🟡',
      title: 'Настройки анимаций',
      description: 'Гибкие настройки включения/отключения различных типов анимаций',
    },
    {
      status: 'planning',
      icon: '🟡',
      title: 'Улучшенная статистика',
      description: 'Расширенная аналитика с новыми типами графиков и отчетов',
    },
    {
      status: 'planning',
      icon: '🟡',
      title: 'Экспорт в PDF',
      description: 'Возможность экспортировать отчеты и статистику в PDF формат',
    },
    {
      status: 'planning',
      icon: '🟡',
      title: 'Интеграция с календарем',
      description: 'Синхронизация записей с Google Calendar, Outlook и другими календарями',
    },
  ];

  // Номера карт для поддержки проекта
  const bankCards = [
    {
      bank: 'Тинькофф',
      cardNumber: '5536913841637074',
      holder: 'Иван И.',
    },
    {
      bank: 'Сбербанк',
      cardNumber: '4276380037914880',
      holder: 'Иван И.',
    },
    {
      bank: 'Альфабанк',
      cardNumber: '5559494115113985',
      holder: 'Иван И.',
    },
  ];

  // Генерация URL для QR кода (используем API сервис)
  const getQRCodeUrl = (cardNumber, bank) => {
    // Формируем данные для QR кода
    // Вариант 1: СБП формат для российских банков
    const sbpData = `ST00012|Name=Иван И.|PersonalAcc=${cardNumber}|Sum=0000000000`;
    
    // Вариант 2: Просто номер карты (универсальный вариант)
    // Некоторые банки поддерживают автоматическое распознавание номера карты
    
    // Используем СБП формат для всех банков
    const qrData = encodeURIComponent(sbpData);
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}&bgcolor=ffffff&color=000000&margin=1`;
  };

  // Копирование номера карты в буфер обмена
  const handleCopyCard = async (cardNumber, bank) => {
    try {
      await navigator.clipboard.writeText(cardNumber);
      setCopiedCard(bank);
      setTimeout(() => setCopiedCard(null), 2000);
    } catch (err) {
      console.error('Ошибка копирования:', err);
    }
  };

  const versionHistory = [
    {
      version: 'v1.0.0',
      title: 'Стабильный релиз',
      changes: [
        'Валидация пересечений времени - предотвращает создание конфликтующих записей',
        'Микроанимации при наведении для более плавного и приятного интерфейса',
        'Синхронизация подсказок в календаре для удобного сравнения периодов',
        'План/Факт анализ с визуализацией выполнения целей',
        'Плавная анимация изменения размера модальных окон',
        'Расширенный туториал со всеми функциями приложения',
        'Улучшенная обработка ошибок с глобальными обработчиками',
        'Оптимизация производительности и стабильности',
      ],
    },
    {
      version: 'v0.9.5',
      title: 'Улучшения пользовательского опыта и валидация',
      changes: [
        'Валидация времени начала и окончания - предотвращает ошибки ввода',
        'Автоматическая очистка поля "Заработок" при фокусе для удобства ввода',
        'Улучшенная обработка ошибок с визуальными индикаторами',
        'Микроанимации выделения строк в списках и таймлайне',
        'Исправление размытия текста при анимациях',
        'Улучшенная навигация в туториале',
      ],
    },
    {
      version: 'v0.9.0',
      title: 'Архитектурная модернизация и улучшение производительности',
      changes: [
        'Полный переход на модульную React-архитектуру с разделением на компоненты',
        'Реорганизация кодовой базы для улучшения поддерживаемости и расширяемости',
        'Оптимизация производительности за счет ленивой загрузки компонентов',
        'Улучшенная система управления состоянием для стабильной работы',
        'Модульная структура проекта для упрощения разработки и тестирования',
        'Оптимизация работы с данными для быстрой загрузки интерфейса',
      ],
    },
    {
      version: 'v0.8.5',
      title: 'Расширенная аналитика и календарь доходов',
      changes: [
        'Календарь доходов с цветовой индикацией интенсивности заработка',
        'Сравнение периодов с синхронизированными подсказками',
        'Автоматические инсайты о продуктивности и заработке',
        'План/Факт анализ с визуализацией выполнения целей',
        'Графики и тренды для глубокого анализа данных',
        'Расширенная статистика по категориям и дням недели',
      ],
    },
    {
      version: 'v0.8.3',
      title: 'Три вида отображения и улучшения интерфейса',
      changes: [
        'Вид "Список" для детального просмотра всех записей',
        'Вид "Сетка" для визуального анализа по дням',
        'Вид "Таймлайн" для хронологического отображения работы',
        'Переключение между видами для удобной работы',
        'Улучшенная группировка записей по дням',
        'Оптимизированный интерфейс для разных сценариев использования',
      ],
    },
    {
      version: 'v0.8.1',
      title: 'Базовый функционал и система управления данными',
      changes: [
        'Таймер для отслеживания времени в реальном времени',
        'Ручное добавление и редактирование записей времени',
        'Система категорий с цветовой кодировкой и иконками',
        'Экспорт и импорт данных в формате JSON',
        'Система отмены и повтора действий (Undo/Redo)',
        'Автоматическое сохранение всех данных',
        'Звуковые уведомления и настройки звуков',
      ],
    },
    {
      version: 'v0.8.0',
      title: 'Настройка рабочего графика и кастомные графики',
      changes: [
        'Добавлена настройка рабочего графика с выбором шаблонов',
        'Поддержка стандартного графика 5/2 и сменных графиков 2/2, 3/3, 5/5',
        'Кастомный график с возможностью выбора рабочих дней вручную',
        'Автоматический пересчет месячных планов на основе выбранного графика',
        'Интерактивный календарь для настройки индивидуального графика',
        'Выбор начала рабочей недели для всех типов графиков',
        'Синхронизация настроек между компонентами приложения',
        'Обновленная аналитика с корректными расчетами планов',
      ],
    },
  ];

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Time Tracker Dashboard"
      subtitle="Версия 1.0.0"
      size="large"
    >
      {/* Описание */}
      <div className="mb-4">
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm">
          Современное приложение для учета рабочего времени с мощной аналитикой. 
          Отслеживайте время, анализируйте продуктивность и оптимизируйте свой заработок.
        </p>
      </div>

      {/* Вкладки */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('history')}
            className={`
              px-4 py-3 text-sm font-medium transition-colors relative
              ${activeTab === 'history'
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
              ${activeTab === 'roadmap'
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
              ${activeTab === 'tech'
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
              ${activeTab === 'support'
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

      {/* Содержимое вкладок */}
      <div className="min-h-[300px] mb-6 max-h-[55vh] overflow-y-auto overflow-x-hidden custom-scrollbar pr-2">
        {/* Вкладка: История изменений */}
        {activeTab === 'history' && (
          <div key="history" className="space-y-4">
            {versionHistory.map((item, index) => (
              <div
                key={index}
                className="glass-effect rounded-lg p-4 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-start gap-3 mb-2">
                  <span className="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded whitespace-nowrap">
                    {item.version}
                  </span>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {item.title}
                    </h4>
                  </div>
                </div>
                <ul className="mt-3 space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
                  {item.changes.map((change, changeIndex) => (
                    <li key={changeIndex} className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>{change}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            
          </div>
        )}

        {/* Вкладка: Планы развития */}
        {activeTab === 'roadmap' && (
          <div key="roadmap" className="space-y-3">
            {roadmapItems.map((item, index) => (
              <div
                key={index}
                className="glass-effect rounded-lg p-4 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl mt-0.5">{item.icon}</span>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {item.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 italic">
              * Статус развития функций может изменяться. Следите за обновлениями!
            </p>
          </div>
        )}

        {/* Вкладка: Технологии */}
        {activeTab === 'tech' && (
          <div key="tech" className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Это приложение построено на современном технологическом стеке, 
              обеспечивающем высокую производительность и удобство разработки.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {technologies.map((tech, index) => (
                <div
                  key={index}
                  className="glass-effect rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-start gap-3 mb-2">
                    <span className="text-2xl">{tech.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {tech.name}
                        </h4>
                        <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded">
                          {tech.version}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {tech.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Вкладка: Поддержать проект */}
        {activeTab === 'support' && (
          <div key="support">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Если вам нравится это приложение, вы можете поддержать его развитие. 
              Любая сумма поможет улучшить проект и добавить новые функции.
            </p>
            
            {/* Grid layout для карт */}
            <div className="grid grid-cols-3 gap-4">
              {/* Названия банков */}
              {bankCards.map((card, index) => (
                <div key={`bank-${index}`} className="text-center">
                  <div className="font-semibold text-gray-900 dark:text-white mb-4">
                    {card.bank}
                  </div>
                </div>
              ))}
              
              {/* Номера карт с кнопками копирования */}
              {bankCards.map((card, index) => (
                <div key={`card-${index}`} className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2 w-full">
                    <code className="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1.5 rounded border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 flex-1 text-center">
                      {card.cardNumber.match(/.{1,4}/g)?.join(' ') || card.cardNumber}
                    </code>
                  </div>
                  <button
                    onClick={() => handleCopyCard(card.cardNumber, card.bank)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-xs w-full justify-center"
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
              ))}
              
              {/* QR коды */}
              {bankCards.map((card, index) => (
                <div key={`qr-${index}`} className="flex flex-col items-center gap-2">
                  <img
                    src={getQRCodeUrl(card.cardNumber, card.bank)}
                    alt={`QR код для ${card.bank}`}
                    className="w-28 h-28 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white p-2"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    Сканируйте для перевода
                  </p>
                </div>
              ))}
              
              {/* Получатели */}
              {bankCards.map((card, index) => (
                <div key={`holder-${index}`} className="text-center">
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
      </div>

      {/* Футер */}
      <div className="mt-6">
        <Button variant="primary" onClick={onClose} className="w-full mb-2">
          Закрыть
        </Button>
        <p className="text-xs text-center text-gray-500 dark:text-gray-400 mb-0">
          Создано с ❤️ для эффективного учета времени
        </p>
      </div>
    </BaseModal>
  );
}

