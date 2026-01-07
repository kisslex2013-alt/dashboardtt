import { useEffect } from 'react'
import { useUIStore } from '../store/useUIStore'

/**
 * Хук для автоматического показа приветственного окна (Tutorial)
 * при первом визите или в режиме инкогнито
 */
export function useWelcomeScreen() {
  const openModal = useUIStore(state => state.openModal)

  useEffect(() => {
    // Проверка редиректа на промо-страницу
    const checkPromoRedirect = () => {
      try {
        // Проверяем флаги посещения в localStorage и sessionStorage
        const promoVisitedLocal = localStorage.getItem('promo_visited')
        const promoVisitedSession = sessionStorage.getItem('promo_visited')
        
        if (promoVisitedLocal === 'true' || promoVisitedSession === 'true') {
          return false
        }

        // Если не посещали - ставим флаг и редиректим
        // Пробуем записать везде, где можем, чтобы избежать циклов
        try { localStorage.setItem('promo_visited', 'true') } catch (e) {}
        try { sessionStorage.setItem('promo_visited', 'true') } catch (e) {}

        window.location.href = '/promo/index.html'
        return true
      } catch (error) {
        console.warn('Storage check failed', error)
        return false
      }
    }

    // Если ушли на редирект - прерываем выполнение
    if (checkPromoRedirect()) return

    // Проверяем, был ли уже показан Tutorial (существующая логика)
    const shouldShowWelcome = () => {
      try {
        const tutorialCompleted = localStorage.getItem('tutorial_completed')
        if (tutorialCompleted === 'true') return false

        const testKey = '__storage_test__'
        localStorage.setItem(testKey, 'test')
        localStorage.removeItem(testKey)
        
        return true
      } catch (error) {
        return true
      }
    }

    const timer = setTimeout(() => {
      if (shouldShowWelcome()) {
        openModal('tutorial')
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [openModal])
}
