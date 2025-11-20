import { useState, useEffect } from 'react'

/**
 * Хук для определения первого визита пользователя
 * @returns {boolean} true если это первый визит
 */
export function useFirstVisit() {
  // ✅ ИСПРАВЛЕНО: Инициализируем из localStorage синхронно для правильного первого рендера
  const [isFirstVisit, setIsFirstVisit] = useState(() => {
    if (typeof window === 'undefined') return false
    const firstVisitKey = 'app_first_visit'
    const hasVisited = localStorage.getItem(firstVisitKey)
    return !hasVisited
  })

  useEffect(() => {
    const firstVisitKey = 'app_first_visit'
    const hasVisited = localStorage.getItem(firstVisitKey)
    
    if (!hasVisited) {
      // Помечаем, что пользователь уже посетил приложение (с небольшой задержкой)
      // чтобы дать время компонентам отреагировать на первый визит
      const timer = setTimeout(() => {
        localStorage.setItem(firstVisitKey, 'true')
      }, 100)
      
      return () => clearTimeout(timer)
    }
  }, [])

  return isFirstVisit
}

