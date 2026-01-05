import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Rocket, PartyPopper } from '../../utils/icons'
import { Button } from '../ui/Button'
import { BaseModal } from '../ui/BaseModal'
import { useTutorialData } from '../../hooks/useTutorialData'
import { TutorialContent } from './tutorial/TutorialContent'
import { TUTORIAL_ICON_MAP } from '../../utils/tutorialConstants'

/**
 * Модальное окно обучения (Tutorial)
 * - Данные загружаются из @src/data/tutorial-data.ts
 * - Логика данных в @src/hooks/useTutorialData.ts
 * - Рендеринг контента в @src/components/modals/tutorial/TutorialContent.tsx
 */
export function TutorialModal({ isOpen, onClose, onClearDemoData }: { isOpen: boolean, onClose: () => void, onClearDemoData?: () => void }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [direction, setDirection] = useState(0)
  
  const { steps, isLoading } = useTutorialData(isOpen)

  // Навигация
  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setDirection(1)
      setCurrentStep((prev) => prev + 1)
    }
  }, [currentStep, steps.length])

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setDirection(-1)
      setCurrentStep((prev) => prev - 1)
    }
  }, [currentStep])

  const handleJumpToStep = (index: number) => {
    if (index === currentStep) return
    setDirection(index > currentStep ? 1 : -1)
    setCurrentStep(index)
  }

  const handleFinish = () => {
    localStorage.setItem('tutorial_completed', 'true')
    setDirection(1)
    onClose()
    setCurrentStep(0)
  }

  const handleSkip = () => {
    localStorage.setItem('tutorial_completed', 'true')
    setDirection(1)
    onClose()
    setCurrentStep(0)
  }

  const handleClearDemoData = () => {
    if (onClearDemoData) {
      onClearDemoData()
      handleFinish()
    }
  }

  // Обработчик клавиатуры
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return
      if (e.key === 'ArrowRight') {
        handleNext()
      } else if (e.key === 'ArrowLeft') {
        handlePrevious()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleNext, handlePrevious])

  if (!isOpen || steps.length === 0) return null

  const currentStepData = steps[currentStep]
  const Icon = currentStepData ? TUTORIAL_ICON_MAP[currentStepData.icon] : Rocket
  
  const isLastStep = currentStep === steps.length - 1
  // Check if current step has "DemoData" component block AND we have demo data
  const showClearDemoDataButton = currentStepData.blocks.some(b => b.component === 'DemoData' && (b as any).hasDemoData)

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleSkip}
      title={currentStepData.title}
      titleIcon={Icon}
      size="large"
      closeOnOverlayClick={false}
      className="relative overflow-hidden"
    >
      {currentStepData.title === 'Синхронизация данных' && (
        <div className="absolute top-0 right-0 w-32 h-32 overflow-hidden pointer-events-none z-10">
            <div className="absolute top-[24px] -right-[28px] w-[120px] transform rotate-45 bg-blue-600 text-white text-[10px] font-bold py-1 text-center shadow-md animate-pulse">
                BETA VERSION
            </div>
        </div>
      )}

      {/* Индикатор шагов (кликабельный) */}
      <div className="flex gap-2 mb-6">
        {steps.map((step, index) => (
          <div
            key={`progress-${index}`}
            onClick={() => handleJumpToStep(index)}
            className={`h-1.5 rounded-full cursor-pointer transition-all duration-300 ${
              index === currentStep
                ? 'bg-blue-600 w-8'
                : index < currentStep
                ? 'bg-blue-200 dark:bg-blue-800 w-4'
                : 'bg-gray-200 dark:bg-gray-700 w-4'
            }`}
          />
        ))}
      </div>

      <div className="min-h-[300px] max-h-[60vh] overflow-y-auto custom-scrollbar px-1 overflow-x-hidden">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={{
              enter: (direction: number) => ({
                x: direction > 0 ? 1000 : -1000,
                opacity: 0,
              }),
              center: {
                zIndex: 1,
                x: 0,
                opacity: 1,
              },
              exit: (direction: number) => ({
                zIndex: 0,
                x: direction < 0 ? 1000 : -1000,
                opacity: 0,
              }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
          >
            <TutorialContent step={currentStepData} />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex justify-between items-center mt-8 pt-4 border-t border-gray-100 dark:border-gray-800">
        <Button
          variant="ghost"
          onClick={handleSkip}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          Пропустить обучение
        </Button>

        <div className="flex gap-3">
          {currentStep > 0 && (
            <Button variant="outline" onClick={handlePrevious} className="flex items-center gap-2">
              <ChevronLeft className="w-4 h-4" /> Назад
            </Button>
          )}

          {isLastStep ? (
             <div className="flex gap-2">
                 {showClearDemoDataButton && (
                     <Button variant="destructive" onClick={handleClearDemoData}>
                         Удалить демо данные
                     </Button>
                 )}
                <Button onClick={handleFinish} className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2">
                  Начать работу <PartyPopper className="w-4 h-4" />
                </Button>
             </div>
          ) : (
            <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
              Далее <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </BaseModal>
  )
}
