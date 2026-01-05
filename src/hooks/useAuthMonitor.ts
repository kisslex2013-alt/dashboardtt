import { useEffect } from 'react'
import { useAuthStore } from '../store/useAuthStore'
import { supabaseService } from '../services/supabase'

/**
 * Хук для мониторинга состояния авторизации и здоровья сервера
 */
export function useAuthMonitor() {
  const { checkAuth } = useAuthStore()

  useEffect(() => {
    // Проверяем авторизацию при запуске приложения
    checkAuth()

    // Периодическая проверка здоровья сервера (раз в 5 минут)
    const interval = setInterval(() => {
      supabaseService.checkHealth()
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [checkAuth])
}
