import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { Dialog } from '@headlessui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, LogIn, UserPlus, CheckCircle2 } from 'lucide-react'
import { useUIStore } from '../../store/useUIStore'
import { useAuthStore } from '../../store/useAuthStore'
import { useEntriesStore } from '../../store/useEntriesStore'
import { useSettingsStore } from '../../store/useSettingsStore'

import { supabaseService } from '../../services/supabase'

const AuthModal = () => {
  const { modals, closeModal, showSuccess, showError } = useUIStore()
  const { login, register, isAuthenticated, user, logout } = useAuthStore()
  const [isLoginMode, setIsLoginMode] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [syncStatus, setSyncStatus] = useState<string | null>(null)

  const isOpen = modals.auth.isOpen

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setSyncStatus(null)

    try {
      let success = false
      if (isLoginMode) {
        await login({ email, password })
        success = true
      } else {
        await register({ email, password })
        success = true
      }

      if (success) {
        showSuccess(isLoginMode ? 'Успешный вход' : 'Регистрация успешна')
        
        // После успешного входа - пробуем синхронизировать данные
        // Сценарий: Скачиваем данные с сервера
        await handleInitialSync()
        
        closeModal('auth')
      } else {
        showError('Ошибка. Проверьте данные или соединение.')
      }
    } catch (e: any) {
      console.error('Auth Error Details:', e)
      let msg = 'Произошла ошибка'
      if (typeof e === 'string') msg = e
      else if (e?.message) msg = e.message
      else if (e?.error_description) msg = e.error_description
      else if (typeof e === 'object') msg = JSON.stringify(e)
      
      showError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInitialSync = async () => {
    // Получаем текущего пользователя из стора (он уже должен быть там после логина)
    const currentUser = useAuthStore.getState().user
    if (!currentUser) return

    setSyncStatus('Проверка облачных данных...')
    
    try {
      const backup = await supabaseService.downloadLastBackup(currentUser.id)
      
      if (backup) {
         // Нашли бэкап - предлагаем восстановить или восстанавливаем молча?
         // Для zero-code простоты - восстанавливаем молча, если локально пусто?
         // Или спрашиваем? Давайте пока молча объединим или перезапишем.
         
         const { entries } = useEntriesStore.getState()
         
         if (entries.length === 0) {
             // Локально пусто - смело восстанавливаем
             setSyncStatus('Загрузка данных из облака...')
             await useEntriesStore.getState().restoreFromBackup(backup.timestamp) // Используем существующий механизм
             showSuccess('Данные восстановлены из облака')
         } else {
             // Локально есть данные. Конфликт?
             // Пока просто уведомляем, что есть данные в облаке
             // TODO: Реализовать Merge или выбор
             showSuccess('Синхронизация активна')
         }
      } else {
          // Бэкапа нет - значит новый юзер или чистый.
          // Загружаем текущие локальные данные в облако
           setSyncStatus('Сохранение локальных данных в облако...')
           await syncToCloud()
      }
    } catch (e) {
        console.error(e)
    }
  }
  
  const syncToCloud = async () => {
      const currentUser = useAuthStore.getState().user
      if (!currentUser) return
      
      const { entries } = useEntriesStore.getState()
      const settings = useSettingsStore.getState()
      
      await supabaseService.uploadBackup(currentUser.id, {
          entries,
          settings: {
              categories: settings.categories,
              dailyGoal: settings.dailyGoal,
              theme: settings.theme
          },
          timestamp: Date.now(),
          version: 1
      })
  }

  if (!isOpen) return null

  // Если уже авторизован - показываем статус
  if (isAuthenticated && user) {
      return (
      createPortal(
        <AnimatePresence>
            <Dialog 
                static 
                as={motion.div}
                open={isOpen} 
                onClose={() => closeModal('auth')}
                className="relative z-[9999999]"
            >
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
                
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel 
                        as={motion.div}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="mx-auto max-w-sm rounded-2xl bg-[#1A1A1A] p-6 shadow-xl border border-white/10 w-full"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <Dialog.Title className="text-xl font-bold text-white flex items-center gap-2">
                                <CheckCircle2 className="w-6 h-6 text-green-500" />
                                Аккаунт
                            </Dialog.Title>
                            <button onClick={() => closeModal('auth')} className="text-white/40 hover:text-white transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="flex flex-col items-center gap-4 mb-6">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white">
                                {user.name?.[0] || user.email[0].toUpperCase()}
                            </div>
                            <div className="text-center">
                                <div className="text-white font-medium">{user.email}</div>
                                <div className="text-xs text-white/50">Синхронизация активна</div>
                            </div>
                        </div>

                        <button 
                            onClick={() => {
                                logout()
                                closeModal('auth')
                            }}
                            className="w-full py-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors font-medium"
                        >
                            Выйти
                        </button>
                    </Dialog.Panel>
                </div>
            </Dialog>
        </AnimatePresence>,
        document.body
      )
      )
  }

  return (
    createPortal(
      <AnimatePresence>
        <Dialog 
          static 
          as={motion.div}
          open={isOpen} 
          onClose={() => closeModal('auth')}
          className="relative z-[9999999]"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />

          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel 
              as={motion.div}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mx-auto max-w-sm rounded-2xl bg-[#1A1A1A] p-8 shadow-xl border border-white/10 w-full relative overflow-hidden"
            >
               {/* Ribbon BETA VERSION */}
               <div className="absolute top-0 right-0 w-32 h-32 overflow-hidden pointer-events-none z-10">
                  <div className="absolute top-[24px] -right-[28px] w-[120px] transform rotate-45 bg-blue-600 text-white text-[10px] font-bold py-1 text-center shadow-md animate-pulse">
                    BETA VERSION
                  </div>
               </div>
               <div className="flex justify-between items-center mb-8">
                  <Dialog.Title className="text-2xl font-bold text-white">
                      {isLoginMode ? 'Вход' : 'Регистрация'}
                  </Dialog.Title>
                  <button onClick={() => closeModal('auth')} className="text-white/40 hover:text-white transition-colors">
                      <X className="w-6 h-6" />
                  </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                      <label className="block text-sm font-medium text-white/60 mb-1">Email</label>
                      <input 
                          type="email" 
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-blue-500 transition-colors"
                          placeholder="your@email.com"
                      />
                  </div>
                  
                  <div>
                       <label className="block text-sm font-medium text-white/60 mb-1">Пароль</label>
                      <input 
                          type="password" 
                          required
                          minLength={8}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-blue-500 transition-colors"
                          placeholder="••••••••"
                      />
                  </div>

                  {syncStatus && (
                      <div className="text-xs text-blue-400 text-center animate-pulse">
                          {syncStatus}
                      </div>
                  )}

                  <button 
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all transform active:scale-95 flex items-center justify-center gap-2 mt-2"
                  >
                      {isLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                          isLoginMode ? <><LogIn className="w-5 h-5" /> Войти</> : <><UserPlus className="w-5 h-5" /> Создать аккаунт</>
                      )}
                  </button>
              </form>

              <div className="mt-6 text-center">
                  <button 
                      onClick={() => setIsLoginMode(!isLoginMode)}
                      className="text-sm text-white/40 hover:text-white transition-colors"
                  >
                      {isLoginMode ? 'Нет аккаунта? Зарегистрироваться' : 'Есть аккаунт? Войти'}
                  </button>
              </div>
              


            </Dialog.Panel>
          </div>
        </Dialog>
      </AnimatePresence>,
      document.body
    )
  )
}

export default AuthModal
