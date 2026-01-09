import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase, supabaseService } from '../services/supabase'
import { useUIStore } from './useUIStore'
import { resetEntriesStore, useEntriesStore } from './useEntriesStore'
import { checkSyncConfirmation, createPreRestoreBackup, mergeEntries, resolveTimeOverlaps, type SyncConfirmationData, type CloudBackupData, type TimeOverlap, type OverlapResolution } from '../utils/syncUtils'
import { logger } from '../utils/logger'

interface User {
  id: string
  email: string
  name?: string
  avatar?: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isSyncing: boolean
  lastSyncTime: number | null
  
  // Данные для диалога подтверждения синхронизации
  pendingSyncData: {
    show: boolean
    data: SyncConfirmationData | null
    cloudBackup: CloudBackupData | null
  }
  
  // Данные для диалога пересечений времени
  pendingOverlaps: {
    show: boolean
    overlaps: TimeOverlap[]
    resolution: OverlapResolution | null
  }
  
  login: (data: any) => Promise<void>
  register: (data: any) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
  
  updateProfile: (data: Partial<User>) => Promise<void>
  resetPassword: (email: string) => Promise<void>
  resendConfirmation: (email: string) => Promise<void>
  setSyncing: (isSyncing: boolean) => void
  setLastSyncTime: (time: number) => void
  
  // Новые функции для безопасной синхронизации
  handleSyncDecision: (decision: 'merge' | 'use-cloud' | 'keep-local') => Promise<void>
  closeSyncDialog: () => void
  
  // Функции для обработки пересечений
  handleFixOverlaps: () => Promise<void>
  closeOverlapsDialog: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isSyncing: false,
      lastSyncTime: null,
      pendingSyncData: {
        show: false,
        data: null,
        cloudBackup: null,
      },
      pendingOverlaps: {
        show: false,
        overlaps: [],
        resolution: null,
      },

      login: async ({ email, password }) => {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        
        if (error) throw error
        
        if (data.user) {
          set({
            user: {
              id: data.user.id,
              email: data.user.email || '',
              // @ts-ignore
              name: data.user.user_metadata?.name || data.user.user_metadata?.full_name || 'User',
              // @ts-ignore
              avatar: data.user.user_metadata?.avatar,
            },
            isAuthenticated: true
          })

          // ✅ SAFE SYNC: Проверяем, нужно ли показать диалог подтверждения
          try {
             const store = useEntriesStore.getState()
             const localEntries = store.entries
             const cloudBackup = await supabaseService.downloadLastBackup(data.user.id)
             
             if (cloudBackup) {
               const syncCheck = checkSyncConfirmation(localEntries, cloudBackup as unknown as CloudBackupData, get().lastSyncTime)
               
               if (syncCheck.needsConfirmation) {
                 // Показываем диалог — пользователь должен выбрать
                 set({
                   pendingSyncData: {
                     show: true,
                     data: syncCheck,
                     cloudBackup: cloudBackup as unknown as CloudBackupData,
                   }
                 })
               } else {
                 // Безопасно — выполняем автоматически
                 if (syncCheck.recommendation === 'merge') {
                   const { merged } = mergeEntries(localEntries, cloudBackup.entries || [])
                   useEntriesStore.setState({ entries: merged })
                 } else if (syncCheck.recommendation === 'use-cloud') {
                   await store.restoreFromCloudBackup(cloudBackup)
                 }
                 // keep-local — ничего не делаем
                 set({ lastSyncTime: Date.now() })
               }
             }
          } catch (e) {
             console.error('Critical Sync Error on Login:', e)
          }
        }
      },

      register: async ({ email, password }) => {
        console.log('Attempting to register:', email)
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin
          }
        })
        
        if (error) {
           console.error('Supabase SignUp Error:', error)
           throw error
        }
        
        console.log('Supabase SignUp Success:', data)

        if (data.user) {
          // Если авто-вход не сработал (например, требуется подтверждение почты), то логиним
          if (!data.session) {
             console.warn('Registration successful but no session. Email confirmation required?')
             // Мы не выбрасываем ошибку здесь, а даем UI обработать это
             // Но для AuthModal это "success", но isAuthenticated = false.
             // Можно кинуть специальную ошибку, чтобы показать алерт.
             throw new Error('Регистрация успешна! Проверьте вашу почту для подтверждения аккаунта.')
          }
           
          set({
            user: {
              id: data.user.id,
              email: data.user.email || '',
            },
            isAuthenticated: !!data.session
          })
        }
      },

      logout: async () => {
        await supabase.auth.signOut()
        set({ user: null, isAuthenticated: false, lastSyncTime: null })
        resetEntriesStore()
      },

      checkAuth: async () => {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          set({
            user: {
              id: session.user.id,
              email: session.user.email || '',
              // @ts-ignore
              name: session.user.user_metadata?.name || session.user.user_metadata?.full_name || 'User',
              // @ts-ignore
              avatar: session.user.user_metadata?.avatar,
            },
            isAuthenticated: true
          })

          // ✅ SAFE SYNC: Проверяем синхронизацию при восстановлении сессии
          try {
             const store = useEntriesStore.getState()
             const localEntries = store.entries
             const cloudBackup = await supabaseService.downloadLastBackup(session.user.id)
             
             if (cloudBackup) {
               const syncCheck = checkSyncConfirmation(localEntries, cloudBackup as unknown as CloudBackupData, get().lastSyncTime)
               
               if (syncCheck.needsConfirmation) {
                 set({
                   pendingSyncData: {
                     show: true,
                     data: syncCheck,
                     cloudBackup: cloudBackup as unknown as CloudBackupData,
                   }
                 })
               } else if (syncCheck.recommendation === 'merge') {
                 const { merged } = mergeEntries(localEntries, cloudBackup.entries || [])
                 useEntriesStore.setState({ entries: merged })
                 set({ lastSyncTime: Date.now() })
               } else if (syncCheck.recommendation === 'use-cloud') {
                 await store.restoreFromCloudBackup(cloudBackup)
               }
             }
          } catch (e) {
             console.error('Critical Sync Error on Session Restore:', e)
          }

        } else {
          set({ user: null, isAuthenticated: false })
        }
      },

      updateProfile: async (data) => {
          // Обновляем метаданные в Supabase
          const { data: { user }, error } = await supabase.auth.updateUser({
              data: { 
                avatar: data.avatar,
                name: data.name
              }
          })
          
          if (error) throw error
          
          if (user) {
              set((state) => ({
                  user: {
                      id: state.user!.id,
                      email: state.user!.email,
                      ...data,
                      name: user.user_metadata?.name || data.name || state.user?.name,
                      avatar: user.user_metadata?.avatar || data.avatar || state.user?.avatar
                  }
              }))
          }
      },

      resetPassword: async (email) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin, // SPA: токены передаются через hash
        })
        if (error) throw error
      },

      resendConfirmation: async (email) => {
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email,
          options: {
            emailRedirectTo: window.location.origin
          }
        })
        if (error) throw error
      },

      setSyncing: (isSyncing) => set({ isSyncing }),
      setLastSyncTime: (time) => set({ lastSyncTime: time }),
      
      // Обработка решения пользователя в диалоге синхронизации
      handleSyncDecision: async (decision) => {
        const { pendingSyncData } = get()
        if (!pendingSyncData.cloudBackup) return
        
        const store = useEntriesStore.getState()
        const localEntries = store.entries
        const cloudBackup = pendingSyncData.cloudBackup
        
        set({ isSyncing: true })
        
        try {
          // Создаём бэкап перед любым изменением
          await createPreRestoreBackup(localEntries, 'pre-sync-decision')
          
          switch (decision) {
            case 'merge':
              const { merged, overlaps } = mergeEntries(localEntries, cloudBackup.entries || [])
              useEntriesStore.setState({ entries: merged })
              
              // Если есть пересечения — показываем модал
              if (overlaps.length > 0) {
                set({
                  pendingOverlaps: {
                    show: true,
                    overlaps,
                    resolution: null,
                  }
                })
              }
              break
              
            case 'use-cloud':
              await store.restoreFromCloudBackup(cloudBackup)
              break
              
            case 'keep-local':
              // Ничего не делаем с entries, но обновляем lastSyncTime
              break
          }
          
          // После ЛЮБОГО решения — загружаем актуальные (возможно очищенные) данные в облако
          // ⚠️ КРИТИЧЕСКИ ВАЖНО: при use-cloud данные восстанавливаются, но integrity check
          // может удалить невалидные записи. Нужно сразу перезаписать облако чистой версией!
          const { user } = get()
          if (user) {
            const currentEntries = useEntriesStore.getState().entries
            const settingsStore = await import('../store/useSettingsStore').then(m => m.useSettingsStore.getState())
            
            try {
              await supabaseService.uploadBackup(user.id, {
                entries: currentEntries,
                categories: settingsStore.categories,
                dailyGoal: settingsStore.dailyGoal,
                dailyHours: settingsStore.dailyHours,
                theme: settingsStore.theme,
                timestamp: Date.now(),
                version: 1,
              } as any)
              logger.log('✅ Бэкап успешно загружен в облако после разрешения конфликта')
            } catch (err) {
              logger.error('❌ Ошибка загрузки бэкапа после разрешения конфликта:', err)
              // Продолжаем, даже если загрузка не удалась - локальные данные уже обновлены
            }
          }
          
          set({
            lastSyncTime: Date.now(),
            pendingSyncData: { show: false, data: null, cloudBackup: null },
            isSyncing: false,
          })
        } catch (e) {
          console.error('Sync decision error:', e)
          set({ isSyncing: false })
        }
      },
      
      closeSyncDialog: () => {
        set({ pendingSyncData: { show: false, data: null, cloudBackup: null } })
      },
      
      // Обработчик автоисправления пересечений
      handleFixOverlaps: async () => {
        const { pendingOverlaps, user } = get()
        if (!pendingOverlaps.show || pendingOverlaps.overlaps.length === 0) return
        
        const currentEntries = useEntriesStore.getState().entries
        const resolution = resolveTimeOverlaps(currentEntries)
        
        // Применяем исправления
        useEntriesStore.setState({ entries: resolution.fixed })
        
        // Загружаем в облако
        if (user) {
          const settingsStore = await import('../store/useSettingsStore').then(m => m.useSettingsStore.getState())
          supabaseService.uploadBackup(user.id, {
            entries: resolution.fixed,
            categories: settingsStore.categories,
            dailyGoal: settingsStore.dailyGoal,
            dailyHours: settingsStore.dailyHours,
            theme: settingsStore.theme,
            timestamp: Date.now(),
            version: 1,
          } as any).catch(err => console.error('Post-fix upload failed:', err))
        }
        
        // Показываем результат
        set({
          pendingOverlaps: {
            show: true,
            overlaps: [],
            resolution,
          },
          lastSyncTime: Date.now(),
        })
      },
      
      closeOverlapsDialog: () => {
        set({ pendingOverlaps: { show: false, overlaps: [], resolution: null } })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        lastSyncTime: state.lastSyncTime 
      }),
    }
  )
)
