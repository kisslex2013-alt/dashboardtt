import { useState, useEffect } from 'react'
import { loadChangelog } from '../utils/changelogParser'

/**
 * Хук для загрузки новых возможностей из changelog.md для указанной версии
 * @param {string} version - версия (например, '1.3.0')
 * @returns {{ features: Array, isLoading: boolean, error: string | null }}
 */
export function useChangelogFeatures(version) {
  const [features, setFeatures] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true

    async function fetchFeatures() {
      try {
        setIsLoading(true)
        setError(null)
        
        const changelog = await loadChangelog()
        
        if (!isMounted) return

        // Отладочные логи
        console.log('🔍 [useChangelogFeatures] Загружен changelog:', changelog)
        console.log('🔍 [useChangelogFeatures] Ищем версию:', version)

        // Находим нужную версию
        const versionData = changelog.find(v => v.version === version)
        
        console.log('🔍 [useChangelogFeatures] Найденные данные версии:', versionData)
        
        if (versionData && versionData.categories['Новые возможности']) {
          console.log('🔍 [useChangelogFeatures] Новые возможности (сырые):', versionData.categories['Новые возможности'])
          
          // Преобразуем формат для отображения
          const formattedFeatures = versionData.categories['Новые возможности'].map(item => {
            // Извлекаем название функции (до первого " - ")
            const parts = item.text.split(' - ')
            const name = parts[0] || item.text
            const description = parts.slice(1).join(' - ') || ''
            
            return {
              name: name.trim(),
              description: description.trim(),
              emoji: item.emoji || '✓',
            }
          })
          
          console.log('🔍 [useChangelogFeatures] Отформатированные функции:', formattedFeatures)
          console.log('🔍 [useChangelogFeatures] Количество функций:', formattedFeatures.length)
          
          setFeatures(formattedFeatures)
        } else {
          console.warn('⚠️ [useChangelogFeatures] Не найдены новые возможности для версии', version)
          console.log('🔍 [useChangelogFeatures] Доступные категории:', versionData?.categories ? Object.keys(versionData.categories) : 'нет данных')
          setFeatures([])
        }
      } catch (err) {
        if (!isMounted) return
        console.error('Error loading changelog features:', err)
        setError(err.message)
        setFeatures([])
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchFeatures()

    return () => {
      isMounted = false
    }
  }, [version])

  return { features, isLoading, error }
}

