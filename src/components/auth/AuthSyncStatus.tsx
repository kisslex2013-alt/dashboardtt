import React, { useEffect } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { User, LogOut, CheckCircle2, Loader2, ChevronDown, UserCircle } from 'lucide-react'
import { useAuthStore } from '../../store/useAuthStore'
import { useUIStore } from '../../store/useUIStore'
import { useEntriesStore } from '../../store/useEntriesStore' // Added
import { supabaseService } from '../../services/supabase'

const AVATARS = ['👽', '👨‍💻', '🦄', '🦁', '🦉', '🦊', '⚡', '🔥']

export const AuthSyncStatus: React.FC = () => {
  const { user, isAuthenticated, isSyncing, checkAuth, logout, updateProfile } = useAuthStore()
  const { openModal } = useUIStore()
  const syncAttempted = React.useRef(false) // Use React.useRef since useRef might not be imported

  // Initial Sync is now handled in useAuthStore.ts to ensure reliability on all devices
  
  useEffect(() => {
    checkAuth()
    const interval = setInterval(() => supabaseService.checkHealth(), 60000)
    return () => clearInterval(interval)
  }, [])

  const handleLoginClick = () => {
    openModal('auth', null)
  }

  // Если не авторизован - красная/оранжевая пульсация кнопки
  if (!isAuthenticated) {
    return (
      <button 
        onClick={handleLoginClick}
        className="glass-button p-2 rounded-lg transition-all duration-300 hover-lift-scale text-orange-400 hover:text-white animate-glow-orange"
        title="Войти / Регистрация"
      >
        <User className="w-5 h-5" />
      </button>
    )
  }

  return (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button 
        className="glass-button p-1 rounded-lg flex items-center justify-center transition-all duration-300 group w-[42px] h-[42px] border border-green-500/40 shadow-[0_0_15px_rgba(34,197,94,0.2)] hover:shadow-[0_0_20px_rgba(34,197,94,0.4)]"
        title="Профиль"
      >
        <div className="w-8 h-8 rounded-md bg-gradient-to-br from-green-500/20 to-blue-500/20 flex items-center justify-center text-xl overflow-hidden group-hover:scale-105 transition-transform">
           {user?.avatar || user?.email?.[0]?.toUpperCase() || '👤'}
        </div>
      </Menu.Button>

      <Transition
        enter="transition ease-out duration-200"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-300"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 mt-2 w-64 origin-top-right divide-y divide-white/10 rounded-xl glass-effect shadow-2xl focus:outline-none z-[100] text-accent">
          <div className="p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Вы вошли как</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate text-ellipsis">{user?.email}</p>
          </div>
          
          <div className="p-4">
             <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider font-bold">Выберите аватар</p>
             <div className="grid grid-cols-4 gap-2">
                 {AVATARS.map(avatar => (
                     <button
                        key={avatar}
                        onClick={() => updateProfile({ avatar })}
                        className={`w-10 h-10 flex items-center justify-center rounded-lg text-xl hover:bg-white/10 dark:hover:bg-white/5 transition-colors ${user?.avatar === avatar ? 'bg-blue-100 dark:bg-blue-600/20 border border-blue-500' : 'border border-transparent'}`}
                     >
                         {avatar}
                     </button>
                 ))}
             </div>
          </div>

          <div className="p-2">
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={logout}
                  className={`${
                    active ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'
                  } group flex w-full items-center rounded-lg px-2 py-2 text-sm transition-colors`}
                >
                  <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                  Выйти
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  )
}
