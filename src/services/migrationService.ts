
import { useEntriesStore } from '../store/useEntriesStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { useUIStore } from '../store/useUIStore'
import { useAuthStore } from '../store/useAuthStore'

/**
 * Сервис миграции данных из старых ключей localStorage
 * Используется для восстановления данных после обновления версии приложения,
 * когда изменились ключи хранилища (например, time-tracker-entries -> entries-storage)
 */
export const migrationService = {
  /**
   * Инициализация миграции
   * Проверяет наличие старых данных и отсутствие новых
   */
  init: () => {
    try {
      // Проверяем, есть ли уже данные в новом хранилище
      const currentEntriesState = localStorage.getItem('entries-storage')
      let hasCurrentData = false
      
      if (currentEntriesState) {
        try {
          const parsed = JSON.parse(currentEntriesState)
          if (parsed.state && parsed.state.entries && parsed.state.entries.length > 0) {
            hasCurrentData = true
          }
        } catch (e) {
          // Ошибка парсинга - считаем что данных нет
        }
      }

      // Проверка флага завершенной миграции для оптимизации
      if (localStorage.getItem('MIGRATION_V1_COMPLETED') === 'true') {
        return
      }

      // Если в новом хранилище уже есть данные, миграцию не запускаем
      // (чтобы не перезатереть текущую работу)
      if (hasCurrentData) {
        console.log('✅ Migration: Current storage has data, skipping migration')
        // Помечаем как выполненную, так как данные уже есть
        localStorage.setItem('MIGRATION_V1_COMPLETED', 'true')
        return
      }

      console.log('🔄 Migration: Checking for legacy data...')

      // Список возможных старых ключей (от наиболее вероятных к менее)
      const legacyKeys = [
        'time-tracker-entries', // Вероятный старый ключ (по аналогии с time-tracker-settings)
        'entries',              // Возможный простой ключ
        'time-tracker-store',   // Возможный общий ключ
        'zustand-store'         // Дефолтный ключ zustand (маловероятно, но возможно)
      ]

      for (const key of legacyKeys) {
        const legacyData = localStorage.getItem(key)
        
        if (legacyData) {
          console.log(`📦 Migration: Found legacy data in key "${key}"`)
          try {
            const parsed = JSON.parse(legacyData)
            
            // Пытаемся извлечь entries в зависимости от структуры
            let entriesToRestore: any[] | null = null

            // Вариант 1: zustand persist structure { state: { entries: [...] } }
            if (parsed.state && Array.isArray(parsed.state.entries)) {
              entriesToRestore = parsed.state.entries
            } 
            // Вариант 2: direct array [...]
            else if (Array.isArray(parsed)) {
              entriesToRestore = parsed
            }
            // Вариант 3: { entries: [...] }
            else if (parsed.entries && Array.isArray(parsed.entries)) {
              entriesToRestore = parsed.entries
            }

            if (entriesToRestore && entriesToRestore.length > 0) {
              console.log(`📥 Migration: Restoring ${entriesToRestore.length} entries...`)
              
              // Записываем в новый store
              useEntriesStore.getState().importEntries(entriesToRestore)
              
              // Показываем уведомление
              useUIStore.getState().showSuccess(
                `Восстановлено ${entriesToRestore.length} записей из старой версии`,
                5000
              )
              
              // Предлагаем авторизацию, если пользователь не залогинен
              const { user } = useAuthStore.getState()
              if (!user) {
                setTimeout(() => {
                   useUIStore.getState().showInfo(
                    'Рекомендуем войти в систему, чтобы сохранить восстановленные данные в облаке',
                    8000
                   )
                   useUIStore.getState().openModal('auth')
                }, 1000)
              }

              // По желанию можно удалить старый ключ или оставить как backup
              // localStorage.removeItem(key) 
              localStorage.setItem('MIGRATION_V1_COMPLETED', 'true')
              console.log('✅ Migration: Successfully migrated data')
              return // Успешно мигрировали, выходим
            }
          } catch (e) {
            console.error(`❌ Migration: Failed to parse data from "${key}"`, e)
          }
        }
      }
      
      console.log('ℹ️ Migration: No legacy data found or migration not needed')

    } catch (error) {
      console.error('❌ Migration: Critical error', error)
    }
  }
}
