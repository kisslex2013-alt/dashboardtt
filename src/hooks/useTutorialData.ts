import { useMemo, useState, useEffect } from 'react'
import { tutorialSteps, TutorialStep } from '../data/tutorial-data'
import { useChangelogFeatures } from './useChangelogFeatures'
import { APP_VERSION } from '../utils/tutorialConstants'

interface UseTutorialDataReturn {
  steps: TutorialStep[]
  isLoading: boolean
  hasDemoData: boolean
}

export function useTutorialData(isOpen: boolean): UseTutorialDataReturn {
  const [hasDemoData, setHasDemoData] = useState(false)
  const { features: newFeatures, isLoading: isLoadingFeatures } = useChangelogFeatures(APP_VERSION)

  useEffect(() => {
    if (isOpen) {
      const demoDataLoaded = localStorage.getItem('demo_data_loaded') === 'true'
      setHasDemoData(demoDataLoaded)
    }
  }, [isOpen])

  const steps = useMemo(() => {
    return tutorialSteps.map(step => {
      // Inject New Features
      if (step.blocks.some(b => b.component === 'NewFeatures')) {
        return {
          ...step,
          blocks: step.blocks.map(block => {
            if (block.component === 'NewFeatures') {
              return {
                ...block,
                isLoading: isLoadingFeatures,
                features: newFeatures,
              }
            }
            return block
          }),
        }
      }

      // Inject Demo Data state
      if (step.blocks.some(b => b.component === 'DemoData')) {
        return {
          ...step,
          title: hasDemoData ? 'Важно: Демонстрационные данные' : 'Готово к работе!',
          icon: hasDemoData ? 'AlertTriangle' : 'CheckCircle',
          blocks: step.blocks.map(block => {
            if (block.component === 'DemoData') {
              return {
                ...block,
                hasDemoData,
              }
            }
            return block
          }),
        }
      }

      return step
    })
  }, [newFeatures, isLoadingFeatures, hasDemoData])

  return {
    steps,
    isLoading: isLoadingFeatures,
    hasDemoData,
  }
}
