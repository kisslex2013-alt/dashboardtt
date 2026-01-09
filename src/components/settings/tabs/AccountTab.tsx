
import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Mail, LogOut, Trash2, Zap, Award, Calendar, Edit2, Camera, Shield, Check, X, CreditCard, Loader2, Cloud, CloudOff, AlertTriangle, ChevronRight } from 'lucide-react'
import { useAuthStore } from '../../../store/useAuthStore'
import { useEntriesStore } from '../../../store/useEntriesStore'
import { useUIStore } from '../../../store/useUIStore'
import { SettingsCard } from '../SettingsCard'
import { Button } from '../../ui/Button'
import { useNotifications } from '../../../hooks/useNotifications'
import { useOnClickOutside } from '../../../hooks/useOnClickOutside'

const AVATARS = ['👽', '👨‍💻', '🦄', '🦁', '🦉', '🦊', '⚡', '🔥']

export const AccountTab = () => {
  const { user, logout, updateProfile, resetPassword, isSyncing, lastSyncTime } = useAuthStore()
  const entriesCount = useEntriesStore(state => state.entries.length) 
  const { openModal } = useUIStore()
  const { showError, showSuccess, showWarning } = useNotifications()

  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState(user?.name || 'User')
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false)
  const [isSyncDetailsOpen, setIsSyncDetailsOpen] = useState(false)
  
  const avatarPickerRef = useRef<HTMLDivElement>(null)
  useOnClickOutside(avatarPickerRef, () => setIsAvatarPickerOpen(false))

  const handleSaveProfile = async () => {
    if (!editedName.trim()) {
      showError('Имя не может быть пустым')
      return
    }
    
    try {
      await updateProfile({ name: editedName })
      setIsEditing(false)
      showSuccess('Профиль обновлен')
    } catch (e) {
      showError('Ошибка обновления профиля')
    }
  }

  const handleAvatarSelect = async (avatar: string) => {
    try {
      await updateProfile({ avatar })
      setIsAvatarPickerOpen(false)
      showSuccess('Аватар обновлен')
    } catch (e) {
      showError('Ошибка обновления аватара')
    }
  }

  const handleLogout = () => {
    if (confirm('Вы уверены, что хотите выйти?')) {
      logout()
    }
  }

  const handleDeleteAccount = () => {
    if (confirm('Вы уверены? Это действие необратимо удалит все ваши данные.')) {
        showError('Функция удаления аккаунта недоступна в демо-режиме')
    }
  }

  const handleChangePlan = () => {
     showWarning('Управление подпиской скоро будет доступно')
  }

  const handleHistory = () => {
      showWarning('История списаний пуста')
  }
  
  const handleChangePassword = async () => {
      if (!user?.email) {
        showError('Email не найден')
        return
      }
      try {
        await resetPassword(user.email)
        showSuccess('Письмо для сброса пароля отправлено на ваш Email')
      } catch (e) {
        showError('Ошибка отправки письма для сброса пароля')
      }
  }

  // Mock stats - in real app would come from backend or computed from entries
  const stats = [
    {
      label: 'Всего времени',
      value: '142ч 30м',
      icon: Calendar,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10'
    },
    {
      label: 'Стрик',
      value: '12 дней',
      icon: Zap,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10'
    },
    {
      label: 'Всего записей',
      value: entriesCount.toString(),
      icon: Edit2, // Or a better icon like FileText or Database
      color: 'text-indigo-500',
      bg: 'bg-indigo-500/10'
    }
  ]

  return (
    <div className="space-y-6 pb-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-2xl bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700/50 relative overflow-visible shadow-sm dark:shadow-none" // overflow-visible for avatar dropdown
      >
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
             <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 blur-3xl rounded-full -mr-32 -mt-32" />
        </div>
        
        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
          <div className="relative group" ref={avatarPickerRef}>
            <button 
                onClick={() => setIsAvatarPickerOpen(!isAvatarPickerOpen)}
                className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-4xl overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl hover:border-primary-500/50 transition-colors"
            >
              {user?.avatar ? (
                <span>{user.avatar}</span>
              ) : (
                <User size={40} className="text-slate-400" />
              )}
            </button>
            <button 
                onClick={() => setIsAvatarPickerOpen(!isAvatarPickerOpen)}
                className="absolute bottom-0 right-0 p-2 bg-primary-500 hover:bg-primary-600 rounded-full text-white shadow-lg transition-colors border-2 border-white dark:border-slate-800"
            >
              <Camera size={16} />
            </button>

            {/* Avatar Picker Dropdown */}
            <AnimatePresence>
                {isAvatarPickerOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        className="absolute top-full left-0 mt-2 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl z-50 w-64"
                    >
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 font-medium">ВЫБЕРИТЕ АВАТАР</p>
                        <div className="grid grid-cols-4 gap-2">
                            {AVATARS.map(avatar => (
                                <button
                                    key={avatar}
                                    onClick={() => handleAvatarSelect(avatar)}
                                    className={`w-10 h-10 flex items-center justify-center rounded-lg text-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors ${user?.avatar === avatar ? 'bg-primary-500/20 border border-primary-500' : 'border border-transparent'}`}
                                >
                                    {avatar}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2">
            {isEditing ? (
              <div className="flex items-center gap-2 max-w-xs mx-auto sm:mx-0">
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="px-3 py-1.5 bg-slate-800 border border-slate-600 rounded-lg text-white w-full focus:outline-none focus:border-primary-500"
                  autoFocus
                />
                <Button size="sm" onClick={handleSaveProfile} className="h-9 w-9 p-0 flex items-center justify-center"><Check size={16} /></Button>
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="h-9 w-9 p-0 flex items-center justify-center"><X size={16} /></Button>
              </div>
            ) : (
              <div className="flex items-center justify-center sm:justify-start gap-2 group">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white max-w-[200px] truncate" title={user?.name || 'User'}>{user?.name || 'User'}</h2>
                <button 
                  onClick={() => setIsEditing(true)}
                  className="p-1 text-slate-400 hover:text-primary-500 dark:hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Edit2 size={16} />
                </button>
              </div>
            )}
            
            <div className="flex items-center justify-center sm:justify-start gap-2 text-slate-500 dark:text-slate-400">
              <Mail size={16} />
              <span className="truncate max-w-[200px]" title={user?.email}>{user?.email}</span>
            </div>
          </div>

          <div className="px-4 py-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 rounded-lg border border-amber-500/20 text-sm font-medium shadow-[0_0_10px_rgba(245,158,11,0.1)]">
            Pro Plan
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-4 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm dark:shadow-none"
          >
            <div className={`p-3 rounded-lg ${stat.bg}`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div>
              <div className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">{stat.value}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700/50 shadow-sm dark:shadow-none relative overflow-hidden">
        {/* Ribbon BETA VERSION */}
        <div className="absolute top-0 right-0 w-32 h-32 overflow-hidden pointer-events-none z-10">
          <div className="absolute top-[24px] -right-[28px] w-[120px] transform rotate-45 bg-blue-600 text-white text-[10px] font-bold py-1 text-center shadow-md animate-pulse">
            BETA VERSION
          </div>
        </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">Синхронизация данных</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Статус облачного сохранения данных</p>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl mb-4 border border-gray-100 dark:border-transparent">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isSyncing ? 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' : 
                  lastSyncTime ? 'bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-600/20 dark:text-gray-400'
                }`}>
                  {isSyncing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : lastSyncTime ? (
                    <Cloud className="w-5 h-5" />
                  ) : (
                    <CloudOff className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="text-gray-900 dark:text-white font-medium">
                    {isSyncing ? 'Синхронизация...' : lastSyncTime ? 'Синхронизировано' : 'Не синхронизировано'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {lastSyncTime 
                      ? `Последнее обновление: ${new Date(lastSyncTime).toLocaleString('ru-RU')}`
                      : 'Данные еще не отправлены в облако'}
                  </div>
                </div>
              </div>
              
              {user && (
                <div className="flex gap-6">
                  <div className="text-right">
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      {useEntriesStore.getState().entries.length} записей
                    </div>
                    <div className="text-xs text-gray-500">
                      на устройстве
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-blue-600 dark:text-blue-400">
                      {useAuthStore.getState().cloudEntriesCount ?? '—'} записей
                    </div>
                    <div className="text-xs text-gray-500">
                      в облаке
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Кнопка показать детали */}
            <button
              onClick={() => setIsSyncDetailsOpen(!isSyncDetailsOpen)}
              className="w-full mt-4 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 bg-gray-50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600/50 transition-all flex items-center justify-between group"
            >
              <span className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                {isSyncDetailsOpen ? 'Скрыть подробности' : 'Подробнее о синхронизации'}
              </span>
              <ChevronRight className={`w-4 h-4 transition-transform ${isSyncDetailsOpen ? 'rotate-90' : ''}`} />
            </button>

            {/* Подробное описание - collapsible */}
            <AnimatePresence>
              {isSyncDetailsOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-4 mt-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <Cloud className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Облачное хранение</h4>
                    <p className="text-sm text-blue-800 dark:text-blue-200/90 mb-2">
                      При входе в аккаунт ваши данные автоматически сохраняются в зашифрованном облачном хранилище Supabase.
                    </p>
                    <ul className="text-xs text-blue-700 dark:text-blue-300/80 space-y-1 list-disc list-inside">
                      <li>Доступ с любого устройства</li>
                      <li>Автоматическое резервное копирование</li>
                      <li>Защита от потери данных</li>
                      <li>Умная синхронизация при конфликтах</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-2">Локальное хранение</h4>
                    <p className="text-sm text-purple-800 dark:text-purple-200/90 mb-2">
                      Без входа в аккаунт данные хранятся только в браузере (localStorage).
                    </p>
                    <ul className="text-xs text-purple-700 dark:text-purple-300/80 space-y-1 list-disc list-inside">
                      <li>Работает без интернета</li>
                      <li>Мгновенный доступ к данным</li>
                      <li>Привязано к браузеру и устройству</li>
                      <li>Удалится при очистке кеша браузера</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-900 dark:text-amber-100 mb-2">Важно перед регистрацией</h4>
                    <p className="text-sm text-amber-800 dark:text-amber-200/90 mb-2">
                      Если у вас уже есть локальные данные, обязательно сделайте экспорт перед входом в аккаунт!
                    </p>
                    <ol className="text-xs text-amber-700 dark:text-amber-300/80 space-y-1.5 list-decimal list-inside">
                      <li>Нажмите кнопку "Экспорт" в шапке приложения</li>
                      <li>Сохраните JSON файл в надёжном месте</li>
                      <li>Войдите в аккаунт или зарегистрируйтесь</li>
                      <li>При необходимости импортируйте сохранённые данные</li>
                    </ol>
                  </div>
                </div>
              </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SettingsCard title="Подписка" description="Управление тарифным планом">
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              {/* Ribbon */}
              <div className="absolute top-0 right-0 w-32 h-32 overflow-hidden pointer-events-none z-10">
                <div className="absolute top-[24px] -right-[28px] w-[120px] transform rotate-45 bg-amber-500 text-white text-[10px] font-bold py-1 text-center shadow-md animate-pulse">
                  DEMO MODE
                </div>
              </div>

              <div>
                <div className="font-medium text-slate-900 dark:text-white">Pro Plan</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">$9.00 / месяц</div>
              </div>
              <div className="px-3 py-1 bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400 text-xs rounded-full border border-green-500/20">
                Активен
              </div>
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              Следующее списание: <span className="text-slate-900 dark:text-white">12 Февраля 2026</span>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" className="w-full" onClick={handleChangePlan}>Изменить тариф</Button>
              <Button variant="secondary" className="w-full" onClick={handleHistory}>История списаний</Button>
            </div>
          </div>
        </SettingsCard>

        <SettingsCard title="Безопасность" description="Управление доступом и данными">
          <div className="space-y-3">
             {/* 1. Login / Logout - Green Glow */}
            <Button 
              variant="secondary" 
              className={`w-full justify-start gap-2 transition-all duration-300 ${
                  user 
                    ? 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20 hover:shadow-[0_0_15px_rgba(244,63,94,0.1)]' // Logout still red? Or Green as requested? User said "Login... Green". I'll make Login Green. Logout... maybe neutral or red? "Войти в аккаунт (зеленым)".  Let's make Login Green. Logout Red seems appropriate for "Exit".
                    : 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20 hover:shadow-[0_0_15px_rgba(34,197,94,0.2)]'
              } border`}
              onClick={user ? handleLogout : () => openModal('auth', null)}
            >
              {user ? <LogOut size={16} /> : <User size={16} />}
              {user ? 'Выйти из аккаунта' : 'Войти в аккаунт'}
            </Button>

            {/* 2. Change Password - Blue Glow */}
            <Button 
              variant="secondary" 
              className="w-full justify-start gap-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 hover:shadow-[0_0_15px_rgba(59,130,246,0.2)] transition-all duration-300"
              onClick={handleChangePassword}
            >
              <Shield size={16} />
              Сменить пароль
            </Button>

             {/* 3. Delete Account - Red Glow */}
            <Button 
              variant="destructive" 
              className="w-full justify-start gap-2 bg-red-500/5 text-red-400 border border-red-500/10 hover:bg-red-500/10 hover:text-red-300 hover:shadow-[0_0_15px_rgba(244,63,94,0.2)] transition-all duration-300"
              onClick={handleDeleteAccount}
            >
              <Trash2 size={16} />
              Удалить аккаунт
            </Button>
          </div>
        </SettingsCard>
      </div>
    </div>
  )
}
