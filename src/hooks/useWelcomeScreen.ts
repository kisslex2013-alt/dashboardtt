import { useEffect } from 'react'
import { useUIStore } from '../store/useUIStore'

/**
 * Хук для автоматического показа приветственного окна (Tutorial)
 * при первом визите или в режиме инкогнито
 */
export function useWelcomeScreen() {
  const openModal = useUIStore(state => state.openModal)

  useEffect(() => {
    // Проверяем, был ли уже показан Tutorial
    const shouldShowWelcome = () => {
      try {
        // Пытаемся получить флаг завершения Tutorial
        const tutorialCompleted = localStorage.getItem('tutorial_completed')
        
        // Если флаг есть, значит пользователь уже видел Tutorial
        if (tutorialCompleted === 'true') {
          return false
        }

        // Проверяем режим инкогнито: пытаемся записать тестовое значение
        const testKey = '__storage_test__'
        localStorage.setItem(testKey, 'test')
        localStorage.removeItem(testKey)
        
        // localStorage работает, и tutorial не был завершен - показываем
        return true
      } catch (error) {
        // Ошибка означает режим инкогнито или блокировку localStorage
        // В этом случае всегда показываем приветственное окно
        console.log('Режим инкогнито или localStorage недоступен - показываем приветствие')
        return true
      }
    }

    // Небольшая задержка для лучшего UX (чтобы приложение успело загрузиться)
    const timer = setTimeout(() => {
      if (shouldShowWelcome()) {
        openModal('tutorial')
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [openModal])
}
