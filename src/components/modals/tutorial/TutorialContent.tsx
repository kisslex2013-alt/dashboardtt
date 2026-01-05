import React from 'react'
import {
  Sparkles,
  AlertTriangle,
  PartyPopper,
  Lightbulb,
  BarChart3,
} from '../../../utils/icons'
import { TutorialStep, TutorialBlock } from '../../../data/tutorial-data'
import { TUTORIAL_ICON_MAP, getFeatureIcon, APP_VERSION } from '../../../utils/tutorialConstants'

const THEME_STYLES = {
  blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', icon: 'text-blue-600' },
  green: { bg: 'bg-green-50 dark:bg-green-900/20', icon: 'text-green-600' },
  yellow: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', icon: 'text-yellow-600' },
  red: { bg: 'bg-red-50 dark:bg-red-900/20', icon: 'text-red-600' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', icon: 'text-purple-600' },
  orange: { bg: 'bg-orange-50 dark:bg-orange-900/20', icon: 'text-orange-600' },
  gray: { bg: 'bg-gray-50 dark:bg-gray-800/50', icon: 'text-gray-500' },
}

const BORDER_MAP = {
  yellow: 'border-2 border-yellow-400 dark:border-yellow-600',
  green: 'border-2 border-green-500', 
  red: 'border border-red-300 dark:border-red-700',
}

// Simple Markdown Parser for **bold** text and ### headers
const SimpleMarkdown = ({ children }: { children: string }) => {
  if (!children) return null
  
  // Handle Headers (###)
  if (children.startsWith('### ')) {
    return <h3 className="font-semibold text-base mb-2">{children.replace('### ', '')}</h3>
  }
  
  const parts = children.split(/(\*\*.*?\*\*)/g)
  
  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={index}>{part.slice(2, -2)}</strong>
        }
        return part
      })}
    </>
  )
}

interface TutorialContentProps {
  step: TutorialStep
}

export function TutorialContent({ step }: TutorialContentProps) {
  return (
    <div className="space-y-3">
      {step.blocks.map((block, index) => (
        <BlockRenderer key={index} block={block} />
      ))}
    </div>
  )
}

// getFeatureIcon импортируется из tutorialConstants.ts

function BlockRenderer({ block }: { block: TutorialBlock & { isLoading?: boolean, features?: any[], hasDemoData?: boolean } }) {
  if (block.type === 'text') {
    return (
      <div className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-line">
        <SimpleMarkdown>{block.content as string}</SimpleMarkdown>
      </div>
    )
  }

  if (block.type === 'alert') {
    const Icon = block.icon ? TUTORIAL_ICON_MAP[block.icon] : null
    const theme = block.color ? THEME_STYLES[block.color] : { bg: '', icon: '' }
    
     // Special case for "important" yellowish borders or red/green borders
    let extraClasses = ''
    if (block.title?.includes('Важно') || block.title?.includes('Готово')  || block.title?.includes('Поздравляем')) {
        if(block.color === 'yellow') extraClasses = ` ${BORDER_MAP.yellow}`
        if(block.color === 'green') extraClasses = ` ${BORDER_MAP.green}`
        if(block.color === 'red') extraClasses = ` ${BORDER_MAP.red}`
    }

    return (
      <div className={`${theme.bg} p-4 rounded-lg ${extraClasses}`}>
        {block.title && (
          <h5 className="font-semibold text-sm mb-2 flex items-center gap-2">
            {Icon && <Icon className={`w-4 h-4 ${theme.icon}`} />}
            {block.title}
          </h5>
        )}
        {block.content && (
           <div className="text-sm text-gray-700 dark:text-gray-300">
             <SimpleMarkdown>{block.content as string}</SimpleMarkdown>
           </div>
        )}
        {block.items && (
          <ul className="text-sm space-y-2 mt-2 text-gray-700 dark:text-gray-300">
            {block.items.map((item, idx) => {
               const ItemIcon = item.icon ? TUTORIAL_ICON_MAP[item.icon] : null
               return (
                <li key={idx} className="flex items-center gap-2">
                  {ItemIcon && <ItemIcon className={`w-4 h-4 ${theme.icon}`} />} 
                  <span><SimpleMarkdown>{item.text as string}</SimpleMarkdown></span>
                </li>
               )
            })}
          </ul>
        )}
      </div>
    )
  }

  if (block.type === 'list') {
      
      return (
          <div className="space-y-2">
              {block.items?.map((item, idx) => {
                  const ItemIcon = item.icon ? TUTORIAL_ICON_MAP[item.icon] : null
                  // Cycle safely through available theme colors
                  const safeColors = ['blue', 'purple', 'green', 'orange', 'red']
                  const safeColorKey = safeColors[idx % safeColors.length] as keyof typeof THEME_STYLES
                  const theme = THEME_STYLES[safeColorKey]

                  // Parse text for "Title - Description" format or "Detailed: Title - Description"
                  let title = item.text as string
                  let description = ''
                  
                  if (typeof item.text === 'string') {
                      let textToParse = item.text
                      if (textToParse.startsWith('Detailed:')) {
                         textToParse = textToParse.replace('Detailed:', '').trim()
                      }
                      
                      const parts = textToParse.split(' - ')
                      if (parts.length > 1) {
                          title = parts[0]
                          description = parts.slice(1).join(' - ')
                      } else {
                          title = textToParse
                      }
                  }

                   return (
                     <div key={idx} className={`p-3 rounded-lg ${theme.bg} transition-colors`}>
                       <div className="flex flex-col gap-1">
                           <h5 className="font-semibold text-sm flex items-center gap-2 text-gray-900 dark:text-gray-100">
                             {ItemIcon && <ItemIcon className={`w-4 h-4 ${theme.icon}`} />}
                             <SimpleMarkdown>{title}</SimpleMarkdown>
                           </h5>
                           {description && (
                               <p className="text-sm text-gray-700 dark:text-gray-300 pl-6 opacity-90">
                                   <SimpleMarkdown>{description}</SimpleMarkdown>
                               </p>
                           )}
                       </div>
                     </div>
                   )
              })}
          </div>
      )
  }

  if (block.type === 'grid') {
    const theme = block.color ? THEME_STYLES[block.color] : { bg: 'bg-gray-50', icon: '' }
    return (
      <div className={`${theme.bg} p-4 rounded-lg`}>
        {block.title && <h5 className="font-semibold text-sm mb-2">{block.title}</h5>}
        <div className="grid grid-cols-2 gap-2 text-sm text-gray-700 dark:text-gray-300">
          {block.items?.map((item, idx) => {
             const ItemIcon = item.icon ? TUTORIAL_ICON_MAP[item.icon] : null
             return (
               <div key={idx} className="flex items-center gap-2">
                 {ItemIcon && <ItemIcon className="w-3.5 h-3.5" />}
                 {item.text}
               </div>
             )
          })}
        </div>
      </div>
    )
  }

  if (block.type === 'dynamic') {
    if (block.component === 'NewFeatures') {
      if (block.isLoading) {
        return <div className="text-sm text-gray-500 dark:text-gray-400">Загрузка...</div>
      }
      // getFeatureIcon используется из tutorialConstants.ts

      if (block.features && block.features.length > 0) {
        return (
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg mt-4">
             <h5 className="font-semibold text-sm mb-2 flex items-center gap-2">
               <Sparkles className="w-4 h-4 text-green-600" /> Новые функции v{APP_VERSION}:
             </h5>
             <ul className="text-sm space-y-2 text-gray-700 dark:text-gray-300">
               {block.features.map((feature: any, index: number) => {
                 const fullText = feature.description 
                    ? `${feature.name} - ${feature.description}`
                    : feature.name
                 
                 const Icon = getFeatureIcon(feature.name)
                 
                 return (
                   <li key={index} className="flex items-start gap-2">
                      <Icon className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                      <div className="leading-tight">
                         <SimpleMarkdown>{fullText}</SimpleMarkdown>
                      </div>
                   </li>
                 )
               })}
             </ul>
          </div>
        )
      }
      return (
         <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg mt-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
               Информация о новых функциях временно недоступна.
            </p>
         </div>
      )
    }

    if (block.component === 'DemoData') {
       if (block.hasDemoData) {
           return (
            <div className="space-y-4">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 dark:border-yellow-600 p-5 rounded-lg">
              <div className="flex items-start gap-3 mb-4">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-10 h-10 bg-yellow-400 dark:bg-yellow-600 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-yellow-900 dark:text-yellow-100" />
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-base mb-3 text-yellow-900 dark:text-yellow-100 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" /> Демонстрационные данные загружены
                  </h4>
                </div>
              </div>
  
              <div className="space-y-3">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  В базе данных сейчас находятся <strong>тестовые демонстрационные записи</strong>,
                  которые были автоматически загружены при первом запуске для визуального показа
                  функционала приложения.
                </p>
  
                <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>Эти данные помогли вам увидеть:</strong>
                  </p>
                  <ul className="text-sm text-yellow-800 dark:text-yellow-200 mt-2 space-y-1 list-disc list-inside">
                    <li>Графики и аналитику с реальными данными</li>
                    <li>Календарь доходов с заполненными днями</li>
                    <li>Статистику и инсайты</li>
                    <li>План/Факт анализ</li>
                  </ul>
                </div>
  
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-300 dark:border-red-700">
                  <p className="text-sm font-semibold text-red-800 dark:text-red-200 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Важно!
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    После ознакомления с возможностями приложения{' '}
                    <strong>рекомендуется удалить эти тестовые данные</strong>, чтобы начать работу с
                    чистой базой и добавлять только свои реальные записи.
                  </p>
                </div>
              </div>
            </div>
  
            <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-lg border-2 border-green-500 mt-4">
              <p className="text-sm font-semibold text-green-700 dark:text-green-300 text-center flex items-center justify-center gap-2">
                <PartyPopper className="w-5 h-5" /> Готово! Теперь вы знаете все основные возможности приложения. Начните работу и
                отслеживайте свое время эффективно!
              </p>
            </div>
          </div>
           )
       } else {
           return (
            <div className="space-y-3">
            <div className="bg-green-100 dark:bg-green-900/30 p-5 rounded-lg border-2 border-green-500">
              <p className="text-lg font-semibold text-green-700 dark:text-green-300 text-center mb-3 flex items-center justify-center gap-2">
                <PartyPopper className="w-6 h-6" /> Поздравляем!
              </p>
              <p className="text-sm text-green-700 dark:text-green-300 text-center">
                Теперь вы знаете все основные возможности приложения. Начните работу и отслеживайте
                свое время эффективно!
              </p>
            </div>
  
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h5 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <Lightbulb className="w-4 h-4" /> Полезные советы:
              </h5>
              <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                <li>• Используйте таймер для автоматического учета времени</li>
                <li>• Регулярно экспортируйте данные для резервного копирования</li>
                <li>• Настройте рабочий график для точного планирования</li>
                <li>• Анализируйте статистику для оптимизации рабочего времени</li>
              </ul>
            </div>
          </div>
           )
       }
    }
  }

  return null
}
