import { useState, useEffect } from 'react'
import { loadChangelog } from '../utils/changelogParser'

interface Feature {
  name: string
  description: string
  emoji: string
}

interface UseChangelogFeaturesReturn {
  features: Feature[]
  isLoading: boolean
  error: string | null
}

interface ChangelogItem {
  text: string
  emoji?: string
}

interface VersionData {
  version: string
  categories: Record<string, ChangelogItem[]>
}

/**
 * Хук для загрузки новых возможностей из changelog.md для указанной версии
 * @param version - версия (например, '1.3.0')
 */
export function useChangelogFeatures(version: string): UseChangelogFeaturesReturn {
  const [features, setFeatures] = useState<Feature[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function fetchFeatures(): Promise<void> {
      try {
        setIsLoading(true)
        setError(null)

        const changelog = await loadChangelog() as VersionData[]

        if (!isMounted) return

        const versionData = changelog.find((v: VersionData) => v.version === version)

        if (versionData && versionData.categories['Новые возможности']) {
          const formattedFeatures: Feature[] = versionData.categories['Новые возможности'].map((item: ChangelogItem) => {
            const parts = item.text.split(' - ')
            const name = parts[0] || item.text
            const description = parts.slice(1).join(' - ') || ''

            return {
              name: name.trim(),
              description: description.trim(),
              emoji: item.emoji || '✓',
            }
          })

          setFeatures(formattedFeatures)
        } else {
          setFeatures([])
        }
      } catch (err) {
        if (!isMounted) return
        console.error('Error loading changelog features:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
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
