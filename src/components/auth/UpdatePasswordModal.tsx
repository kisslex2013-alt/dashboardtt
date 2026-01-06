import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Dialog } from '@headlessui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, KeyRound, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import { supabase } from '../../services/supabase'
import { useUIStore } from '../../store/useUIStore'

interface UpdatePasswordModalProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * Модальное окно для установки нового пароля
 * Показывается после перехода по ссылке сброса пароля из email
 */
export const UpdatePasswordModal: React.FC<UpdatePasswordModalProps> = ({ isOpen, onClose }) => {
  const { showSuccess, showError } = useUIStore()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  // Сбрасываем состояние при открытии
  useEffect(() => {
    if (isOpen) {
      setPassword('')
      setConfirmPassword('')
      setIsSuccess(false)
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Валидация
    if (password.length < 8) {
      showError('Пароль должен быть не менее 8 символов')
      return
    }

    if (password !== confirmPassword) {
      showError('Пароли не совпадают')
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({ password })

      if (error) {
        throw error
      }

      setIsSuccess(true)
      showSuccess('Пароль успешно обновлён!')

      // Закрываем через 2 секунды
      setTimeout(() => {
        onClose()
        // Очищаем URL от токенов
        window.history.replaceState({}, document.title, window.location.pathname)
      }, 2000)
    } catch (e: any) {
      console.error('Update password error:', e)
      showError(e.message || 'Ошибка обновления пароля')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return createPortal(
    <AnimatePresence>
      <Dialog
        static
        as={motion.div}
        open={isOpen}
        onClose={() => {}} // Не позволяем закрыть кликом вне модала
        className="relative z-[9999999]"
      >
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel
            as={motion.div}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="mx-auto max-w-sm rounded-2xl bg-[#1A1A1A] p-8 shadow-xl border border-white/10 w-full"
          >
            {isSuccess ? (
              // Успешное обновление
              <div className="flex flex-col items-center gap-4 py-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center"
                >
                  <CheckCircle2 className="w-10 h-10 text-green-500" />
                </motion.div>
                <div className="text-center">
                  <h3 className="text-xl font-bold text-white mb-2">Пароль обновлён!</h3>
                  <p className="text-white/60 text-sm">Теперь вы можете войти с новым паролем</p>
                </div>
              </div>
            ) : (
              // Форма ввода нового пароля
              <>
                <div className="flex justify-between items-center mb-6">
                  <Dialog.Title className="text-2xl font-bold text-white flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                      <KeyRound className="w-5 h-5 text-blue-400" />
                    </div>
                    Новый пароль
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-white/40 hover:text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <p className="text-white/60 text-sm mb-6">
                  Введите новый пароль для вашего аккаунта. Минимум 8 символов.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white/60 mb-1">
                      Новый пароль
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={8}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full px-4 py-3 pr-12 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-blue-500 transition-colors"
                        placeholder="••••••••"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/60 mb-1">
                      Подтвердите пароль
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-blue-500 transition-colors"
                      placeholder="••••••••"
                    />
                  </div>

                  {/* Индикатор совпадения паролей */}
                  {confirmPassword && (
                    <div
                      className={`text-xs flex items-center gap-1 ${password === confirmPassword ? 'text-green-400' : 'text-red-400'}`}
                    >
                      {password === confirmPassword ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" /> Пароли совпадают
                        </>
                      ) : (
                        <>
                          <X className="w-3 h-3" /> Пароли не совпадают
                        </>
                      )}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading || password !== confirmPassword || password.length < 8}
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white font-medium transition-all transform active:scale-95 flex items-center justify-center gap-2 mt-4"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <KeyRound className="w-5 h-5" />
                        Сохранить пароль
                      </>
                    )}
                  </button>
                </form>
              </>
            )}
          </Dialog.Panel>
        </div>
      </Dialog>
    </AnimatePresence>,
    document.body
  )
}

export default UpdatePasswordModal
