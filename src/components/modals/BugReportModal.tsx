import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BaseModal } from '../ui/BaseModal'
import { Bug, Lightbulb, MessageCircle, Send, CheckCircle, AlertCircle } from 'lucide-react'
import { bugReportService, type BugReportType, type BugSeverity } from '../../services/bugReportService'

interface BugReportModalProps {
  isOpen: boolean
  onClose: () => void
}

const reportTypes: { id: BugReportType; label: string; icon: typeof Bug; color: string }[] = [
  { id: 'bug', label: 'Баг', icon: Bug, color: 'text-red-500' },
  { id: 'feature', label: 'Идея', icon: Lightbulb, color: 'text-yellow-500' },
  { id: 'feedback', label: 'Отзыв', icon: MessageCircle, color: 'text-blue-500' },
]

const severityLevels: { id: BugSeverity; label: string; emoji: string; color: string }[] = [
  { id: 'low', label: 'Низкая', emoji: '🟢', color: 'border-green-500 bg-green-500/10' },
  { id: 'medium', label: 'Средняя', emoji: '🟡', color: 'border-yellow-500 bg-yellow-500/10' },
  { id: 'high', label: 'Высокая', emoji: '🟠', color: 'border-orange-500 bg-orange-500/10' },
  { id: 'critical', label: 'Критическая', emoji: '🔴', color: 'border-red-500 bg-red-500/10' },
]

export function BugReportModal({ isOpen, onClose }: BugReportModalProps) {
  const [type, setType] = useState<BugReportType>('bug')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [severity, setSeverity] = useState<BugSeverity>('medium')
  const [contactEmail, setContactEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const resetForm = () => {
    setType('bug')
    setTitle('')
    setDescription('')
    setSeverity('medium')
    setContactEmail('')
    setSubmitStatus('idle')
    setErrorMessage('')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      setErrorMessage('Заполните заголовок и описание')
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')

    const result = await bugReportService.submitReport({
      type,
      title: title.trim(),
      description: description.trim(),
      severity,
      contactEmail: contactEmail.trim() || undefined,
    })

    setIsSubmitting(false)

    if (result.success) {
      setSubmitStatus('success')
      // Автозакрытие через 2 секунды
      setTimeout(() => {
        handleClose()
      }, 2000)
    } else {
      setSubmitStatus('error')
      setErrorMessage(result.error || 'Ошибка при отправке')
    }
  }

  const isFormValid = title.trim().length > 0 && description.trim().length > 0

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Сообщить о проблеме"
      titleIcon={Bug}
      size="medium"
    >
      <AnimatePresence mode="wait">
        {submitStatus === 'success' ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center justify-center py-12 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 10, stiffness: 100 }}
            >
              <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
            </motion.div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Спасибо за обратную связь!
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Ваш репорт успешно отправлен
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-5"
          >
            {/* Тип репорта */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Тип обращения
              </label>
              <div className="flex gap-2">
                {reportTypes.map((rt) => {
                  const Icon = rt.icon
                  const isSelected = type === rt.id
                  return (
                    <button
                      key={rt.id}
                      onClick={() => setType(rt.id)}
                      className={`
                        flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg
                        border-2 transition-all duration-200
                        ${isSelected 
                          ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400' 
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }
                      `}
                    >
                      <Icon className={`w-4 h-4 ${isSelected ? rt.color : 'text-gray-400'}`} />
                      <span className="text-sm font-medium">{rt.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Заголовок */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Заголовок <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Кратко опишите проблему..."
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 
                  bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                  focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  placeholder:text-gray-400 transition-all"
                maxLength={100}
              />
            </div>

            {/* Описание */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Описание <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Опишите подробнее, что произошло. Если это баг — укажите шаги для воспроизведения..."
                rows={4}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 
                  bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                  focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  placeholder:text-gray-400 transition-all resize-none"
                maxLength={2000}
              />
            </div>

            {/* Серьёзность (только для багов) */}
            {type === 'bug' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Серьёзность
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {severityLevels.map((level) => {
                    const isSelected = severity === level.id
                    return (
                      <button
                        key={level.id}
                        onClick={() => setSeverity(level.id)}
                        className={`
                          flex flex-col items-center py-2 px-2 rounded-lg
                          border-2 transition-all duration-200
                          ${isSelected 
                            ? level.color 
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                          }
                        `}
                      >
                        <span className="text-lg">{level.emoji}</span>
                        <span className="text-xs mt-1 font-medium text-gray-600 dark:text-gray-400">
                          {level.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Email для связи (опционально) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email для связи <span className="text-gray-400 text-xs">(опционально)</span>
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 
                  bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                  focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  placeholder:text-gray-400 transition-all"
              />
            </div>

            {/* Информация о сборе данных */}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Вместе с репортом отправляется техническая информация: версия браузера, 
                размер экрана и версия приложения. Это поможет быстрее найти и исправить проблему.
              </p>
            </div>

            {/* Ошибка */}
            {errorMessage && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-300">{errorMessage}</p>
              </div>
            )}

            {/* Кнопка отправки */}
            <button
              onClick={handleSubmit}
              disabled={!isFormValid || isSubmitting}
              className={`
                w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg
                font-medium transition-all duration-200
                ${isFormValid && !isSubmitting
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              {isSubmitting ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                  Отправка...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Отправить
                </>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </BaseModal>
  )
}
