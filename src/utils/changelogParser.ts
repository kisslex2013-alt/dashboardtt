/**
 * 🎓 Парсер для changelog.md
 */

interface FeatureItem {
  emoji: string | null
  text: string
}

interface VersionCategories {
  'Новые возможности': FeatureItem[]
  'Улучшения интерфейса': FeatureItem[]
  'Исправления ошибок': FeatureItem[]
  'Технические улучшения': FeatureItem[]
}

export interface ChangelogVersion {
  version: string
  date: string
  title: string
  categories: VersionCategories
  technicalInfo: Record<string, string>
}

type CategoryName = keyof VersionCategories

/**
 * Парсит changelog.md и возвращает структурированные данные
 */
export function parseChangelog(changelogContent: string): ChangelogVersion[] {
  const versions: ChangelogVersion[] = []
  const lines = changelogContent.split('\n')

  let currentVersion: ChangelogVersion | null = null
  let currentCategory: CategoryName | null = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    const versionMatch = line.match(/^## \[([^\]]+)\]\s*-\s*(\d{4}-\d{2}-(?:XX|\d{2}))/)
    if (versionMatch) {
      if (currentVersion) {
        versions.push(currentVersion)
      }
      currentVersion = {
        version: versionMatch[1],
        date: versionMatch[2],
        title: '',
        categories: {
          'Новые возможности': [],
          'Улучшения интерфейса': [],
          'Исправления ошибок': [],
          'Технические улучшения': [],
        },
        technicalInfo: {},
      }
      currentCategory = null
      continue
    }

    if (!currentVersion) continue

    if (line.startsWith('### ')) {
      const titleMatch = line.match(/^###\s*(.+)$/)
      if (titleMatch) {
        currentVersion.title = titleMatch[1].replace(/[*`]/g, '').trim()
      }
      continue
    }

    if (line.startsWith('#### ')) {
      const categoryMatch = line.match(/^####\s*(.+)$/)
      if (categoryMatch) {
        const categoryName = categoryMatch[1].replace(/[*`]/g, '').trim().toLowerCase()

        if (categoryName.includes('новые возможности')) {
          currentCategory = 'Новые возможности'
        } else if (categoryName.includes('улучшения интерфейса')) {
          currentCategory = 'Улучшения интерфейса'
        } else if (categoryName.includes('исправления ошибок') || categoryName.includes('критические исправления')) {
          currentCategory = 'Исправления ошибок'
        } else if (categoryName.includes('технические улучшения')) {
          currentCategory = 'Технические улучшения'
        } else {
          currentCategory = null
        }
      }
      continue
    }

    if (line.startsWith('- ') && currentCategory && currentVersion.categories[currentCategory]) {
      const item = line.substring(2).trim()
      if (
        item &&
        !item.startsWith('**Версия**:') &&
        !item.startsWith('**Файлы**:') &&
        !item.startsWith('**Деплой**:') &&
        !item.startsWith('**Статус**:')
      ) {
        const emojiMatch = item.match(
          /^([\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}]+)/u
        )
        const emoji = emojiMatch ? emojiMatch[0].trim() : null

        let textWithoutEmoji = item
        if (emoji) {
          textWithoutEmoji = item.substring(emoji.length).trim()
        }

        const cleanedText = textWithoutEmoji.replace(/\*\*([^*]+)\*\*\s*-\s*/g, '$1 - ')

        const featureItem: FeatureItem = {
          emoji: emoji || null,
          text: cleanedText,
        }
        currentVersion.categories[currentCategory].push(featureItem)
      }
      continue
    }

    if (
      line.startsWith('- **Версия**:') ||
      line.startsWith('- **Файлы**:') ||
      line.startsWith('- **Деплой**:') ||
      line.startsWith('- **Статус**:')
    ) {
      const match = line.match(/- \*\*([^*]+)\*\*:\s*(.+)$/)
      if (match) {
        currentVersion.technicalInfo[match[1].trim()] = match[2].trim()
      }
      continue
    }
  }

  if (currentVersion) {
    versions.push(currentVersion)
  }

  return versions
}

/**
 * Загружает changelog.md и парсит его
 */
export async function loadChangelog(): Promise<ChangelogVersion[]> {
  try {
    const response = await fetch('/changelog/changelog.md')
    if (!response.ok) {
      throw new Error(`Failed to load changelog: ${response.status}`)
    }
    const content = await response.text()
    return parseChangelog(content)
  } catch (error) {
    console.error('Error loading changelog:', error)
    return []
  }
}
