import { memo, useCallback } from 'react'
import { Edit2, Trash2, Clock, Loader2 } from '../../utils/icons'
import { useDeleteEntry } from '../../store/useEntriesStore'
import { formatDuration, formatEarned, formatRateWithUnit } from '../../utils/formatting'
import { calculateDuration } from '../../utils/calculations'
import { useConfirmModal } from '../../hooks/useConfirmModal'
import { useCategory } from '../../hooks/useCategory'
import { useHapticFeedback } from '../../hooks/useHapticFeedback'
import { useOptimisticUpdate } from '../../hooks/useOptimisticUpdate'
import { ConfirmModal } from '../modals/ConfirmModal'
import type { EntryItemProps } from '../../types'

/**
 * 📝 Карточка отдельной записи времени
 * - Показывает категорию, время начала/окончания, длительность
 * - Описание работы
 * - Ставку и заработок
 * - Кнопки редактирования и удаления
 *
 * Оптимизирован с React.memo для предотвращения лишних ре-рендеров
 * ✅ OPTIMISTIC UI: Запись исчезает мгновенно при удалении
 */
export const EntryItem = memo<EntryItemProps>(({ entry, onEdit }) => {
  // ✅ ОПТИМИЗАЦИЯ: Используем атомарный селектор для минимизации ре-рендеров
  const deleteEntry = useDeleteEntry()
  const { confirmConfig, openConfirm } = useConfirmModal()
  const triggerHaptic = useHapticFeedback() // ✅ UX: Haptic feedback для мобильных устройств

  // 🎯 OPTIMISTIC UI: Состояние видимости записи
  const {
    value: isVisible,
    isPending: isDeleting,
    error: deleteError,
    update: optimisticDelete,
  } = useOptimisticUpdate(true)

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

  // ✅ ОПТИМИЗАЦИЯ: Мемоизируем обработчик редактирования
  const handleEdit = useCallback(() => {
    triggerHaptic('light') // ✅ UX: Легкая вибрация при редактировании
    onEdit && onEdit(entry)
  }, [entry, onEdit, triggerHaptic])

  const handleDelete = () => {
    triggerHaptic('error') // ✅ UX: Вибрация при попытке удаления
    openConfirm({
      title: 'Удалить запись?',
      message: 'Вы уверены, что хотите удалить эту запись? Это действие нельзя отменить.',
      onConfirm: async () => {
        triggerHaptic('heavy') // ✅ UX: Сильная вибрация при подтверждении удаления

        try {
          // 🎯 OPTIMISTIC UI: Сразу скрываем запись, затем удаляем в фоне
          await optimisticDelete(
            false, // Оптимистичное значение - запись скрыта
            async () => {
              // Оборачиваем синхронный deleteEntry в Promise
              return new Promise<boolean>((resolve) => {
                deleteEntry(entry.id)
                // Даем время на обновление store (setState асинхронен)
                setTimeout(() => resolve(false), 50)
              })
            }
          )
        } catch (error) {
          // ❌ Если удаление провалилось, запись вернется автоматически
          console.error('Ошибка при удалении записи:', error)
          triggerHaptic('error')
        }
      },
      confirmText: 'Удалить',
      cancelText: 'Отмена',
    })
  }

  // 🎯 OPTIMISTIC UI: Не рендерим скрытую запись
  if (!isVisible) {
    return null
  }

  return (
    <div
      className={`glass-effect rounded-lg p-4 hover-lift-scale transition-normal border border-transparent hover:border-blue-500 relative ${
        isDeleting ? 'opacity-60 pointer-events-none' : ''
      }`}
    >
      {/* 🎯 OPTIMISTIC UI: Индикатор удаления */}
      {isDeleting && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-black/50 rounded-lg z-10">
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-lg">
            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Удаление...</span>
          </div>
        </div>
      )}

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
            onClick={handleEdit}
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

      {/* 🎯 OPTIMISTIC UI: Ошибка удаления */}
      {deleteError && (
        <div className="mt-3 p-2 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-200">
            ❌ Не удалось удалить запись. Попробуйте снова.
          </p>
        </div>
      )}

      <ConfirmModal {...confirmConfig} />
    </div>
  )
})

EntryItem.displayName = 'EntryItem'
