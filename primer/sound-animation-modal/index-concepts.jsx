import { useState } from 'react'
import { SoundAnimationConcept1 } from './concept-1-classic'
import { SoundAnimationConcept2 } from './concept-2-cards'
import { SoundAnimationConcept3 } from './concept-3-compact'
import { SoundAnimationConcept4 } from './concept-4-visual'
import { SoundAnimationConcept5 } from './concept-5-advanced'

/**
 * Навигация между 5 концептами настроек звуков и анимации
 * Используйте этот компонент для переключения между концептами
 */
export function SoundAnimationConceptsNavigator() {
  const [activeConcept, setActiveConcept] = useState(1)
  const [isOpen, setIsOpen] = useState(false)

  const concepts = [
    { id: 1, name: 'Классический', component: SoundAnimationConcept1, desc: 'Вертикальный список с иконками' },
    { id: 2, name: 'Карточный', component: SoundAnimationConcept2, desc: 'Сетка карточек 2x4' },
    { id: 3, name: 'Компактный', component: SoundAnimationConcept3, desc: 'Аккордеон с группами' },
    { id: 4, name: 'Визуальный', component: SoundAnimationConcept4, desc: 'С волнами и анимациями' },
    { id: 5, name: 'Продвинутый', component: SoundAnimationConcept5, desc: 'С табами и расширенными настройками' }
  ]

  const ActiveComponent = concepts.find(c => c.id === activeConcept)?.component

  return (
    <>
      {/* Кнопка для открытия */}
      <button
        onClick={() => setIsOpen(true)}
        className="glass-button px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-normal hover-lift-scale click-shrink"
      >
        Открыть концепты звуков
      </button>

      {/* Навигация между концептами */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999998] flex items-center justify-center p-4">
          <div className="glass-effect rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  Концепты настроек звуков
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Выберите концепт для просмотра
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="glass-button p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Список концептов */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {concepts.map((concept) => (
                <button
                  key={concept.id}
                  onClick={() => setActiveConcept(concept.id)}
                  className={`glass-effect rounded-xl p-4 border-l-4 text-left transition-all duration-300 ${
                    activeConcept === concept.id
                      ? 'border-blue-500 bg-blue-500/10 dark:bg-blue-500/20'
                      : 'border-gray-300 dark:border-gray-600 hover:bg-white/20 dark:hover:bg-gray-800/70'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      Концепт {concept.id}
                    </span>
                    {activeConcept === concept.id && (
                      <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded">
                        Активен
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
                    {concept.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {concept.desc}
                  </p>
                </button>
              ))}
            </div>

            {/* Предпросмотр активного концепта */}
            {ActiveComponent && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <ActiveComponent
                  isOpen={true}
                  onClose={() => {}}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

