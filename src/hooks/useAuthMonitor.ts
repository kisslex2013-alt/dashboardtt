import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '../store/useAuthStore'
import { supabase, supabaseService } from '../services/supabase'

/**
 * Хук для мониторинга состояния авторизации и здоровья сервера
 * Также обрабатывает событие PASSWORD_RECOVERY для показа модала сброса пароля
 */
export function useAuthMonitor() {
  const { checkAuth } = useAuthStore()
  const [showUpdatePassword, setShowUpdatePassword] = useState(false)

  const handleCloseUpdatePassword = useCallback(() => {
    setShowUpdatePassword(false)
  }, [])

  useEffect(() => {
    // Проверяем авторизацию при запуске приложения
    checkAuth()

    // Подписываемся на события авторизации Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔐 Auth event:', event)

      if (event === 'PASSWORD_RECOVERY') {
        // Пользователь перешёл по ссылке сброса пароля — показываем модал
        console.log('🔑 Password recovery event detected!')
        setShowUpdatePassword(true)
      }

      if (event === 'SIGNED_IN' && session) {
        // Пользователь успешно вошёл — обновляем состояние
        checkAuth()
      }

      if (event === 'SIGNED_OUT') {
        // Пользователь вышел
        checkAuth()
      }
    })

    // Периодическая проверка здоровья сервера (раз в 5 минут)
    const interval = setInterval(() => {
      supabaseService.checkHealth()
    }, 5 * 60 * 1000)

    return () => {
      subscription.unsubscribe()
      clearInterval(interval)
    }
  }, [checkAuth])

  return {
    showUpdatePassword,
    handleCloseUpdatePassword,
  }
}

