import { useState, useEffect } from 'react'

const FIRST_VISIT_KEY = 'app_first_visit'

/**
 * Хук для определения первого визита пользователя
 * @returns true если это первый визит
 */
export function useFirstVisit(): boolean {
  // ✅ ИСПРАВЛЕНО: Инициализируем из localStorage синхронно для правильного первого рендера
  const [isFirstVisit, setIsFirstVisit] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    const hasVisited = localStorage.getItem(FIRST_VISIT_KEY)
    return !hasVisited
  })

  useEffect(() => {
    const hasVisited = localStorage.getItem(FIRST_VISIT_KEY)

    if (!hasVisited) {
      // Помечаем, что пользователь уже посетил приложение (с небольшой задержкой)
      // чтобы дать время компонентам отреагировать на первый визит
      const timer = setTimeout(() => {
        localStorage.setItem(FIRST_VISIT_KEY, 'true')
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [])

  return isFirstVisit
}
