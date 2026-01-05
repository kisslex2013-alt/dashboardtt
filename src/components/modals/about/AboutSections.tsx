import React from 'react'
import { Copy, Check } from '../../../utils/icons'
import { motion } from 'framer-motion'

// Данные о технологиях
const technologies = [
  {
    name: 'React 18',
    description: 'Современная библиотека для создания пользовательских интерфейсов',
    version: '18.2+',
    icon: '⚛️',
  },
  {
    name: 'Zustand',
    description: 'Легковесная библиотека для управления состоянием приложения',
    version: '4.4+',
    icon: '🐻',
  },
  {
    name: 'Tailwind CSS',
    description: 'Utility-first CSS фреймворк для быстрой разработки',
    version: '3.4+',
    icon: '🎨',
  },
  {
    name: 'Recharts',
    description: 'Библиотека для создания интерактивных графиков и диаграмм',
    version: '2.12+',
    icon: '📊',
  },
  {
    name: 'Tone.js',
    description: 'Web Audio API фреймворк для звуковых уведомлений',
    version: '14.7+',
    icon: '🔊',
  },
  {
    name: 'date-fns',
    description: 'Мощная библиотека для работы с датами и временем',
    version: '4.1+',
    icon: '📅',
  },
  {
    name: 'Vite',
    description: 'Быстрый сборщик для современных веб-приложений',
    version: '5+',
    icon: '⚡',
  },
  {
    name: 'Framer Motion',
    description: 'Библиотека для создания плавных анимаций',
    version: '12.23+',
    icon: '🎬',
  },
]

// Данные банковских карт
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

/**
 * Секция "Технологии" для nested modal
 */
export function TechStackSection() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Приложение построено с использованием современного стека технологий
      </p>

      <div className="grid gap-4">
        {technologies.map((tech, index) => (
          <motion.div
            key={`${tech.name}-${index}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 transition-all hover:shadow-md"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">{tech.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white">{tech.name}</h4>
                  <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
                    {tech.version}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{tech.description}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

/**
 * Секция "Поддержка" для nested modal
 */
export function SupportSection() {
  const [copiedCard, setCopiedCard] = React.useState<string | null>(null)

  const handleCopyCard = async (cardNumber: string, bank: string) => {
    try {
      const cardNumberWithoutSpaces = cardNumber.replace(/\s/g, '')
      await navigator.clipboard.writeText(cardNumberWithoutSpaces)
      setCopiedCard(bank)
      
      // Confetti effect при копировании
      const button = document.activeElement as HTMLElement
      if (button) {
        // Создаем конфетти элементы
        for (let i = 0; i < 10; i++) {
          const confetti = document.createElement('div')
          confetti.style.position = 'fixed'
          confetti.style.width = '8px'
          confetti.style.height = '8px'
          confetti.style.backgroundColor = ['#10B981', '#34D399', '#6EE7B7'][Math.floor(Math.random() * 3)]
          confetti.style.borderRadius = '50%'
          confetti.style.pointerEvents = 'none'
          confetti.style.zIndex = '9999'
          
          const rect = button.getBoundingClientRect()
          confetti.style.left = `${rect.left + rect.width / 2}px`
          confetti.style.top = `${rect.top + rect.height / 2}px`
          
          document.body.appendChild(confetti)
          
          const angle = (Math.random() * 2 * Math.PI)
          const velocity = 50 + Math.random() * 50
          const vx = Math.cos(angle) * velocity
          const vy = Math.sin(angle) * velocity
          
          confetti.animate([
            { transform: 'translate(0, 0) scale(1)', opacity: 1 },
            { transform: `translate(${vx}px, ${vy}px) scale(0)`, opacity: 0 }
          ], {
            duration: 600,
            easing: 'cubic-bezier(0, .9, .57, 1)'
          }).onfinish = () => confetti.remove()
        }
      }
      
      setTimeout(() => setCopiedCard(null), 2000)
    } catch (err) {
      console.error('Ошибка копирования:', err)
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Если вам нравится это приложение, вы можете поддержать его развитие. Любая сумма поможет
        улучшить проект и добавить новые функции.
      </p>

      {/* Карточки банков */}
      <div className="space-y-4">
        {bankCards.map((card, index) => (
          <div
            key={`${card.bank}-${index}`}
            className="p-4 rounded-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-700"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900 dark:text-white">{card.bank}</h4>
              <span className="text-xs text-gray-500 dark:text-gray-400">{card.holder}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm font-mono bg-white dark:bg-gray-900 px-3 py-2 rounded border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                {card.cardNumber}
              </code>
              <button
                onClick={() => handleCopyCard(card.cardNumber, card.bank)}
                className="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
                title="Копировать номер карты"
              >
                {copiedCard === card.bank ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Скопировано</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Копировать</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* QR код */}
      <div className="text-center p-6 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
        <p className="text-sm font-medium text-gray-900 dark:text-white mb-4">
          Или используйте QR-код для перевода
        </p>
        <picture>
          <source srcSet="/images/qr-code-alexey.webp" type="image/webp" />
          <img
            src="/images/qr-code-alexey.png"
            alt="QR код для перевода"
            className="w-48 h-48 mx-auto rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white p-2"
            loading="lazy"
          />
        </picture>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
          Сканируйте камерой телефона
        </p>
      </div>

      <p className="text-xs text-center text-gray-500 dark:text-gray-400 italic">
        Спасибо за вашу поддержку! 🙏
      </p>
    </div>
  )
}
