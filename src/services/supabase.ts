import { createClient } from '@supabase/supabase-js'
import type { BackupData } from '../types'

// Конфигурация Supabase (в продакшене лучше вынести в .env)
const SUPABASE_URL = 'https://ogieecraxlynhgogsqgl.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9naWVlY3JheGx5bmhnb2dzcWdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNDM3NjYsImV4cCI6MjA4MjkxOTc2Nn0.G2hiNmZST_PpUoOibW0O8kICOIfZ_8qtE4z2UtHXVCI'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export const supabaseService = {
  /**
   * Проверка связи с Supabase
   * (Пытаемся просто пропинговать, например получить сессию)
   */
  async checkHealth() {
    try {
      // Supabase не имеет health endpoint, но можно проверить доступность сети
      const { error } = await supabase.from('backups').select('count', { count: 'exact', head: true })
      // Если ошибка не связана с сетью (например, 401 или таблица не существует), то сервер жив
      return !error || error.code !== 'PGRST000' // Просто заглушка, реальный пинг сложнее
    } catch (e) {
      return false
    }
  },

  /**
   * Загрузка последнего бэкапа
   */
  async downloadLastBackup(userId: string): Promise<BackupData | null> {
    try {
      console.log('🔄 Checking for backups in cloud...', userId)
      const { data, error } = await supabase
        .from('backups')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) {
          console.error('❌ Supabase download failed:', error)
          return null
      }

      if (!data) {
          console.log('ℹ️ No backups found for user')
          return null
      }

      console.log('✅ Backup found:', data.id, 'Size:', JSON.stringify(data.data).length)
      return data.data as BackupData
    } catch (e) {
      console.error('❌ Supabase download exception:', e)
      return null
    }
  },

  /**
   * Сохранение бэкапа
   * Мы будем хранить только последние 5 записей, остальное удалять в триггере БД или вручную
   */
  async uploadBackup(userId: string, data: BackupData): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('backups')
        .insert({
          user_id: userId,
          data: data,
          version: data.version
        })

      if (error) {
        console.error('Supabase upload error:', error)
        return false
      }

      // Очистка старых (можно оптимизировать через RPC функцию)
      this.cleanupOldBackups(userId)

      return true
    } catch (e) {
      console.error('Supabase upload exception:', e)
      return false
    }
  },

  /**
   * Очистка старых бэкапов
   * Оставляет последние 5
   */
  async cleanupOldBackups(userId: string) {
     try {
       // Получаем все ID
       const { data } = await supabase
         .from('backups')
         .select('id, created_at')
         .eq('user_id', userId)
         .order('created_at', { ascending: false })
       
       if (data && data.length > 5) {
         const toDelete = data.slice(5).map(r => r.id)
         await supabase.from('backups').delete().in('id', toDelete)
       }
     } catch (e) {
       // ignore
     }
  }
}
