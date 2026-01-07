import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Globe, Check, AlertCircle } from 'lucide-react'

export function LanguageSection() {
  const [language, setLanguage] = useState<'ru' | 'en'>('ru')

  const handleLanguageChange = (lang: 'ru' | 'en') => {
    // В будущем здесь будет смена языка через i18n
    // Сейчас просто локальный стейт для демо
    if (lang === 'en') {
       // Можно показать уведомление что перевод в работе
    }
    setLanguage(lang)
  }

  const languages = [
    { id: 'ru', name: 'Русский', icon: '🇷🇺' },
    { id: 'en', name: 'English', icon: '🇬🇧' },
  ]

  return (
    <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-100 dark:border-gray-800 backdrop-blur-sm relative overflow-hidden">
       {/* Демо стикер/значок для всего блока */}
       {/* <div className="absolute top-0 right-0 bg-gradient-to-l from-blue-500/20 to-transparent px-2 py-0.5 rounded-bl-lg">
          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Demo</span>
       </div> */}

      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <span>Язык интерфейса</span>
        </h3>
        {/* Бейдж DEMO */}
        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-400/30">
          DEMO
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {languages.map((lang) => {
           const isActive = language === lang.id
           
           return (
             <button
               key={lang.id}
               onClick={() => handleLanguageChange(lang.id as 'ru' | 'en')}
               className={`
                 w-full flex items-center justify-between p-3 rounded-lg border transition-all duration-200
                 ${isActive 
                   ? 'bg-white dark:bg-gray-800 border-blue-500 shadow-sm ring-1 ring-blue-500/10' 
                   : 'bg-transparent border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 opacity-60 grayscale-[0.5] hover:opacity-100 hover:grayscale-0'
                 }
               `}
             >
               <div className="flex items-center gap-3">
                 <span className="text-xl leading-none">{lang.icon}</span>
                 <span className={`text-sm font-medium ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                   {lang.name}
                 </span>
               </div>
               
               {isActive && (
                 <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                   <Check className="w-3 h-3 text-white" strokeWidth={3} />
                 </div>
               )}
             </button>
           )
        })}
      </div>
      
      {/* Предупреждение о демо режиме */}
      {language === 'en' && (
         <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-3 p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 flex items-start gap-2"
         >
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-400">
               Перевод интерфейса находится в разработке. Некоторые элементы могут отображаться на русском.
            </p>
         </motion.div>
      )}
    </div>
  )
}
