import { memo } from 'react'
import PropTypes from 'prop-types'
import { Edit2, Trash2, Clock } from 'lucide-react'
import { useDeleteEntry } from '../../store/useEntriesStore'
import { formatDuration, formatEarned, formatRateWithUnit } from '../../utils/formatting'
import { calculateDuration } from '../../utils/calculations'
import { useConfirmModal } from '../../hooks/useConfirmModal'
import { useCategory } from '../../hooks/useCategory'
import { ConfirmModal } from '../modals/ConfirmModal'

/**
 * 📝 Карточка отдельной записи времени
 * - Показывает категорию, время начала/окончания, длительность
 * - Описание работы
 * - Ставку и заработок
 * - Кнопки редактирования и удаления
 *
 * Оптимизирован с React.memo для предотвращения лишних ре-рендеров
 */
export const EntryItem = memo(({ entry, onEdit }) => {
  // ✅ ОПТИМИЗАЦИЯ: Используем атомарный селектор для минимизации ре-рендеров
  const deleteEntry = useDeleteEntry()
  const { confirmConfig, openConfirm } = useConfirmModal()

  // ✅ ОПТИМИЗАЦИЯ: Используем централизованный хук для работы с категориями
  const { getCategoryName } = useCategory({ defaultName: 'remix' })

  const categoryName = getCategoryName(entry)

  // Вычисляем длительность, если её нет (используем общую утилиту)
  const getDuration = () => {
    if (entry.duration) return formatDuration(entry.duration)

    if (entry.start && entry.end) {
      return formatDuration(calculateDuration(entry.start, entry.end))
    }

    return '0.00'
  }

  const handleDelete = () => {
    openConfirm({
      title: 'Удалить запись?',
      message: 'Вы уверены, что хотите удалить эту запись? Это действие нельзя отменить.',
      onConfirm: () => deleteEntry(entry.id),
      confirmText: 'Удалить',
      cancelText: 'Отмена',
    })
  }

  return (
    <div className="glass-effect rounded-lg p-4 hover-lift-scale transition-normal border border-transparent hover:border-blue-500">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            {/* Категория с иконкой */}
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
              {categoryName}
            </span>

            {/* Время */}
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {entry.start} {entry.end ? `- ${entry.end}` : '(в процессе)'}
            </span>

            {/* Длительность */}
            <span className="text-sm font-medium">{getDuration()} ч</span>

            {/* Индикатор таймера */}
            {!entry.isManual && (
              <Clock className="w-4 h-4 text-green-500" title="Запись из таймера" />
            )}
          </div>

          {/* Описание */}
          {entry.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{entry.description}</p>
          )}

          {/* Ставка и заработок */}
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-500">
              Ставка: <span className="font-medium">{formatRateWithUnit(entry.rate || 0)}</span>
            </span>
            <span className="text-green-600 dark:text-green-400 font-semibold">
              Заработано: {formatEarned(entry.earned || 0)} ₽
            </span>
          </div>
        </div>

        {/* Действия */}
        <div className="flex gap-2 ml-4">
          <button
            aria-label="Редактировать запись"
            onClick={() => onEdit && onEdit(entry)}
            className="p-2 glass-button rounded-lg hover:bg-blue-500 hover:text-white transition-colors hover-lift-scale click-shrink"
            data-icon-id="entry-item-edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            aria-label="Удалить запись"
            onClick={handleDelete}
            className="p-2 glass-button rounded-lg hover:bg-red-500 hover:text-white transition-colors hover-lift-scale click-shrink"
            data-icon-id="entry-item-delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <ConfirmModal {...confirmConfig} />
    </div>
  )
})

EntryItem.propTypes = {
  entry: PropTypes.shape({
    id: PropTypes.string.isRequired,
    date: PropTypes.string,
    start: PropTypes.string,
    end: PropTypes.string,
    duration: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    category: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    categoryId: PropTypes.string,
    description: PropTypes.string,
    rate: PropTypes.number,
    earned: PropTypes.number,
    isManual: PropTypes.bool,
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
}
