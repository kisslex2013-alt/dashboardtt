import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { History, Rocket, Heart, Code } from '../../utils/icons'
import { Button } from '../ui/Button'
import { BaseModal } from '../ui/BaseModal'
import { GridCard } from './about/GridCard'
import { NestedModal } from './about/NestedModal'
import { HistorySection, RoadmapSection } from './about/HistoryAndRoadmap'
import { TechStackSection, SupportSection } from './about/AboutSections'
import { AppLogo } from '../layout/Header/components/AppLogo'
import { aboutGradients, AboutSection } from '../../utils/aboutGradients'
import { APP_VERSION_FULL } from '../../config/appVersion'

/**
 * Модальное окно "О приложении" - Редизайн Концепт №4
 * - 2×2 Grid с красивыми карточками
 * - Nested modals для детального просмотра
 * - Минималистичный дизайн
 */
export function AboutModal({ isOpen, onClose }) {
  const [activeSection, setActiveSection] = useState<AboutSection>(null)

  // Данные для карточек
  const gridCards = [
    {
      id: 'history' as const,
      icon: History,
      title: 'История',
      subtitle: 'Последние обновления',
      stats: `${APP_VERSION_FULL} • 8 изменений`,
      accentClass: 'blue-500',
    },
    {
      id: 'roadmap' as const,
      icon: Rocket,
      title: 'Планы',
      subtitle: 'Дорожная карта развития',
      stats: '3 критичных • 5 важных',
      accentClass: 'orange-500',
    },
    {
      id: 'tech' as const,
      icon: Code,
      title: 'Технологии',
      subtitle: 'Стек технологий',
      stats: '8 основных библиотек',
      accentClass: 'purple-500',
    },
    {
      id: 'support' as const,
      icon: Heart,
      title: 'Поддержка',
      subtitle: 'Помочь проекту',
      stats: '3 способа',
      accentClass: 'green-500',
    },
  ]

  return (
    <>
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        title="Time Tracker Dashboard"
        subtitle={
          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-medium">
            {APP_VERSION_FULL}
          </div>
        }
        size="large"
        className={`transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${
          activeSection 
            ? 'md:!max-w-6xl md:!w-[95vw] md:!h-[90vh]' 
            : 'md:max-w-2xl'
        }`}
        closeOnOverlayClick={false}
        disableContentScroll={true}
        footer={
          !activeSection && (
            <div>
              <Button variant="default" onClick={onClose} className="w-full mb-2">
                Закрыть
              </Button>
              <p className="text-xs text-center text-gray-500 dark:text-gray-400 mb-0">
                Создано с ❤️ для эффективного учета времени
              </p>
            </div>
          )
        }
      >
        <div className="flex flex-col md:flex-row h-full overflow-hidden">
          {/* Левая колонка (Меню) */}
          <div className={`
            flex flex-col h-full overflow-y-auto custom-scrollbar transition-all duration-300 overflow-x-hidden
            ${activeSection ? 'md:w-[35%] md:border-r md:border-gray-100 dark:md:border-gray-800 md:pr-6' : 'w-full'}
          `}>
            {/* Логотип приложения */}
            <div className="flex justify-center mb-6 pt-1">
              <div className="w-24 h-24 rounded-2xl bg-blue-50/50 dark:bg-gray-800/30 flex items-center justify-center shadow-sm border border-gray-100 dark:border-gray-700/50 transform transition-transform hover:scale-105 backdrop-blur-sm">
                <AppLogo className="w-16 h-16" />
              </div>
            </div>

            {/* Краткое описание */}
            <div className="mb-8 text-center px-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Современный инструмент для управления временем и аналитики продуктивности
              </p>
            </div>

            {/* Grid карточек - адаптируется в 1 колонку при Split View если нужно */}
            <div className={`grid gap-4 mb-6 transition-all duration-300 p-1 overflow-visible ${activeSection ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {gridCards.map(card => (
                <GridCard
                  key={card.id}
                  icon={card.icon}
                  title={card.title}
                  subtitle={card.subtitle}
                  stats={card.stats}
                  accentClass={card.accentClass}
                  onClick={() => setActiveSection(card.id)}
                  compact={!!activeSection}
                />
              ))}
            </div>
            
            {/* Футер для мобилок или когда Split View активен (можно дублировать или оставить пустым) */}
          </div>

          {/* Правая колонка (Контент) - интегрирована в поток */}
          <AnimatePresence mode="wait">
            {activeSection && (
              <div className="hidden md:block md:w-[65%] h-full pl-6 overflow-hidden">
                 <NestedModal
                    isOpen={true}
                    onClose={() => setActiveSection(null)}
                    title={gridCards.find(c => c.id === activeSection)?.title || ''}
                    icon={gridCards.find(c => c.id === activeSection)?.icon || Rocket}
                    embedded={true} // Новый проп для режима "В потоке"
                  >
                    {activeSection === 'history' && <HistorySection />}
                    {activeSection === 'roadmap' && <RoadmapSection />}
                    {activeSection === 'tech' && <TechStackSection />}
                    {activeSection === 'support' && <SupportSection />}
                  </NestedModal>
              </div>
            )}
          </AnimatePresence>

          {/* Мобильная версия NestedModal (по-прежнему Overlay) */}
          <AnimatePresence>
            {activeSection && (
               <div className="md:hidden">
                 <NestedModal
                    isOpen={true}
                    onClose={() => setActiveSection(null)}
                    title={gridCards.find(c => c.id === activeSection)?.title || ''}
                    icon={gridCards.find(c => c.id === activeSection)?.icon || Rocket}
                    embedded={false}
                  >
                    {activeSection === 'history' && <HistorySection />}
                    {activeSection === 'roadmap' && <RoadmapSection />}
                    {activeSection === 'tech' && <TechStackSection />}
                    {activeSection === 'support' && <SupportSection />}
                  </NestedModal>
               </div>
            )}
          </AnimatePresence>
        </div>
      </BaseModal>
    </>
  )
}
