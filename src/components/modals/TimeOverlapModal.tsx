import { Clock, AlertTriangle, Check, Lightbulb } from '../../utils/icons'
import { Button } from '../ui/Button'
import { BaseModal } from '../ui/BaseModal'
import type { TimeOverlap, OverlapResolution } from '../../utils/syncUtils'

interface TimeOverlapModalProps {
  isOpen: boolean
  onClose: () => void
  overlaps: TimeOverlap[]
  onAutoFix: () => void
  onIgnore: () => void
  resolution?: OverlapResolution
}

/**
 * Модальное окно для отображения пересечений времени
 * с возможностью автоматического исправления
 */
export function TimeOverlapModal({
  isOpen,
  onClose,
  overlaps,
  onAutoFix,
  onIgnore,
  resolution,
}: TimeOverlapModalProps) {
  
  const formatTime = (minutes: number) => {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    if (h > 0 && m > 0) return `${h}ч ${m}мин`
    if (h > 0) return `${h}ч`
    return `${m}мин`
  }

  // Если есть resolution — показываем результат исправления
  if (resolution && resolution.fixedCount > 0) {
    return (
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        title="Пересечения исправлены"
        titleIcon={Check}
        size="medium"
      >
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-green-800 dark:text-green-200 text-sm">
            ✅ Исправлено {resolution.fixedCount} пересечений
          </p>
        </div>

        <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
          {resolution.changes.map((change, idx) => (
            <div 
              key={idx}
              className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm"
            >
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Clock className="w-4 h-4" />
                <span className="line-through">{change.oldStart} - {change.oldEnd}</span>
                <span className="text-green-600 dark:text-green-400">→</span>
                <span className="font-medium text-green-600 dark:text-green-400">{change.newStart} - {change.newEnd}</span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                {change.reason}
              </div>
            </div>
          ))}
        </div>

        <Button
          variant="default"
          onClick={onClose}
          className="w-full justify-center"
        >
          Готово
        </Button>
      </BaseModal>
    )
  }

  // Показываем список пересечений
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Обнаружены пересечения времени"
      titleIcon={AlertTriangle}
      size="medium"
    >
      <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
        <p className="text-amber-800 dark:text-amber-200 text-sm flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>
            Найдено <strong>{overlaps.length} пересечений</strong> во временных записях.
            Это может привести к неточностям в статистике.
          </span>
        </p>
      </div>

      {/* Список пересечений */}
      <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
        {overlaps.slice(0, 10).map((overlap, idx) => (
          <div 
            key={idx}
            className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
          >
            <div className="text-sm font-medium text-red-800 dark:text-red-200">
              {overlap.date}
            </div>
            <div className="text-xs text-red-600 dark:text-red-400 mt-1 space-y-1">
              <div>
                {overlap.entry1.category || 'Запись 1'}: {overlap.entry1.start} - {overlap.entry1.end}
              </div>
              <div>
                {overlap.entry2.category || 'Запись 2'}: {overlap.entry2.start} - {overlap.entry2.end}
              </div>
              <div className="font-medium">
                Пересечение: {formatTime(overlap.overlapMinutes)}
              </div>
            </div>
          </div>
        ))}
        {overlaps.length > 10 && (
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            ...и ещё {overlaps.length - 10} пересечений
          </div>
        )}
      </div>

      {/* Рекомендация */}
      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-blue-800 dark:text-blue-200 text-sm flex items-start gap-2">
          <Lightbulb className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>
            <strong>Рекомендация:</strong> Автоматически сдвинуть записи, чтобы они не пересекались.
            Более поздние записи будут сдвинуты после более ранних.
          </span>
        </p>
      </div>

      {/* Кнопки */}
      <div className="flex flex-col gap-2">
        <Button
          variant="default"
          onClick={onAutoFix}
          className="w-full justify-center"
        >
          Исправить автоматически
        </Button>
        <Button
          variant="outline"
          onClick={onIgnore}
          className="w-full justify-center"
        >
          Игнорировать
        </Button>
      </div>
    </BaseModal>
  )
}
