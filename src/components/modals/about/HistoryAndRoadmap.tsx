import React, { useState, useEffect } from 'react'
import { ChevronDown, Loader2, Flame, Star, Lightbulb, CheckCircle2, ClipboardList } from '../../../utils/icons'
import { loadChangelog, ChangelogVersion } from '../../../utils/changelogParser'
import { loadImplementationPlan } from '../../../utils/implementationPlanParser'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Секция "История" для nested modal
 */
export function HistorySection() {
  const [changelogData, setChangelogData] = useState<ChangelogVersion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedVersions, setExpandedVersions] = useState<Record<string, boolean>>({})

  useEffect(() => {
    loadChangelog()
      .then(data => {
        setChangelogData(data)
        setIsLoading(false)
      })
      .catch(error => {
        console.error('Error loading changelog:', error)
        setIsLoading(false)
      })
  }, [])

  const toggleVersion = (version: string) => {
    setExpandedVersions(prev => ({
      ...prev,
      [version]: !prev[version],
    }))
  }

  const getCategoryCount = (version: ChangelogVersion, category: keyof ChangelogVersion['categories']) => {
    return version.categories[category]?.length || 0
  }

  const categoryIcons = {
    'Новые возможности': '✨',
    'Улучшения интерфейса': '🎨',
    'Исправления ошибок': '🐛',
    'Технические улучшения': '⚙️',
  }

  // Функция для парсинга жирного текста (**text**)
  const renderFormattedText = (text: string) => {
    // Если нет маркеров жирного текста, возвращаем как есть
    if (!text.includes('**')) return text

    const parts = text.split(/(\*\*.*?\*\*)/g)
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-semibold text-gray-800 dark:text-gray-200">{part.slice(2, -2)}</strong>
      }
      return <span key={index}>{part}</span>
    })
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
        <p className="text-sm text-gray-600 dark:text-gray-400">Загрузка истории изменений...</p>
      </div>
    )
  }

  if (changelogData.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-gray-600 dark:text-gray-400">Не удалось загрузить историю изменений</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {changelogData.map((version, index) => {
        const isExpanded = expandedVersions[version.version] || false
        const totalChanges = Object.values(version.categories).reduce((sum, items) => sum + items.length, 0)
        const isLatest = index === 0 // Самая новая версия

        return (
          <motion.div
            key={version.version}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50 border transition-colors ${
              isLatest
                ? 'border-blue-400 dark:border-blue-500 shadow-lg shadow-blue-500/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
            }`}
          >
            <button
              onClick={() => toggleVersion(version.version)}
              className="w-full flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{version.version}</span>
                  {version.date && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {version.date.split('-').reverse().join('.')}
                    </span>
                  )}
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white truncate flex-1">
                  {version.title}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {totalChanges} измен.
                </span>
              </div>
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
              >
                <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-300 ml-2 flex-shrink-0" />
              </motion.div>
            </button>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 pt-3 border-t border-gray-200/50 dark:border-gray-700/50 space-y-3">
                    {Object.entries(version.categories).map(([categoryName, items]) => {
                      if (items.length === 0) return null
                      const icon = categoryIcons[categoryName as keyof typeof categoryIcons] || '📝'

                      return (
                        <div key={categoryName} className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                              {icon} {categoryName} ({items.length})
                            </span>
                          </div>
                          <div className="pl-4 space-y-1 text-xs text-gray-600 dark:text-gray-400">
                            {items.map((item, itemIndex) => (
                              <div key={itemIndex}>
                                • {renderFormattedText(typeof item === 'object' && item !== null ? item.text : String(item))}
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )
      })}
    </div>
  )
}

/**
 * Секция "Планы" для nested modal
 */
export function RoadmapSection() {
  const [planData, setPlanData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})

  useEffect(() => {
    loadImplementationPlan()
      .then(data => {
        setPlanData(data)
        setIsLoading(false)
      })
      .catch(error => {
        console.error('Error loading implementation plan:', error)
        setIsLoading(false)
      })
  }, [])

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500 mb-4" />
        <p className="text-sm text-gray-600 dark:text-gray-400">Загрузка планов развития...</p>
      </div>
    )
  }

  if (!planData) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-gray-600 dark:text-gray-400">Не удалось загрузить планы развития</p>
      </div>
    )
  }

  const sections = [
    { key: 'critical', title: 'Критичные задачи', color: 'red', icon: Flame },
    { key: 'important', title: 'Важные задачи', color: 'orange', icon: Star },
    { key: 'desirable', title: 'Желательные задачи', color: 'yellow', icon: Lightbulb },
  ]

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Следите за развитием проекта и планируемыми улучшениями
      </p>

      {sections.map((section, index) => {
        const sectionData = planData[section.key]
        if (!sectionData) return null

        const isExpanded = expandedSections[section.key] || false

        const statuses = [
          { key: 'completed', label: 'Выполнено', icon: CheckCircle2, color: 'text-green-600 dark:text-green-400' },
          { key: 'inProgress', label: 'В разработке', icon: Loader2, color: 'text-orange-500 animate-spin' },
          { key: 'planning', label: 'Отложено', icon: ClipboardList, color: 'text-gray-500' },
        ]

        // Подсчет общего количества задач в секции
        const totalTasks = statuses.reduce((sum, status) => {
          return sum + (sectionData[status.key]?.length || 0)
        }, 0)

        // Иконка секции
        const SectionIcon = section.icon

        return (
          <motion.div
            key={section.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`rounded-lg bg-${section.color}-50 dark:bg-${section.color}-900/20 border transition-colors ${
              isExpanded
                ? `border-${section.color}-400 dark:border-${section.color}-500 shadow-md`
                : `border-${section.color}-200 dark:border-${section.color}-700 hover:border-${section.color}-300 dark:hover:border-${section.color}-600`
            }`}
          >
            <button
              onClick={() => toggleSection(section.key)}
              className="w-full flex items-center justify-between p-4 text-left"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full bg-${section.color}-100 dark:bg-${section.color}-900/40 text-${section.color}-600 dark:text-${section.color}-400`}>
                  <SectionIcon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className={`font-semibold text-${section.color}-700 dark:text-${section.color}-400 line-clamp-1`}>
                    {section.title}
                  </h4>
                  <p className={`text-xs text-${section.color}-600/80 dark:text-${section.color}-400/80`}>
                    {totalTasks} задач
                  </p>
                </div>
              </div>
              
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
              >
                <ChevronDown className={`w-5 h-5 text-${section.color}-500`} />
              </motion.div>
            </button>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className={`px-4 pb-4 space-y-4 border-t border-${section.color}-200/50 dark:border-${section.color}-700/50 pt-3`}>
                    {statuses.map(status => {
                      const tasks = sectionData[status.key]
                      if (!tasks || tasks.length === 0) return null

                      const StatusIcon = status.icon

                      return (
                        <div key={status.key} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <StatusIcon className={`w-3.5 h-3.5 ${status.color}`} />
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 opacity-80">
                              {status.label}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                              {tasks.length}
                            </span>
                          </div>
                          <div className="pl-6 space-y-1.5">
                            {tasks.map((task: any, idx: number) => (
                              <div key={idx} className="flex items-start gap-2 group">
                                <div className={`mt-1.5 w-1.5 h-1.5 rounded-full bg-${section.color}-400 dark:bg-${section.color}-600 flex-shrink-0 group-hover:scale-125 transition-transform`} />
                                <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                  {task.title}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )
      })}

      <p className="text-xs text-gray-500 dark:text-gray-400 italic mt-6 px-1">
        * Источник данных: файл <code>plans.md</code>. Статус развития функций может изменяться.
      </p>
    </div>
  )
}
