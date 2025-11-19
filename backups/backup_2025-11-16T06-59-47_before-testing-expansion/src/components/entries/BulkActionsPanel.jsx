import { Folder, Download, Trash2 } from '../../utils/icons'
import { Button } from '../ui/Button'
import { useIsMobile } from '../../hooks/useIsMobile'

/**
 * Панель массовых действий для выбранных записей
 *
 * АДАПТИВНОСТЬ: На мобильных устройствах использует упрощенную вертикальную структуру
 */
export function BulkActionsPanel({
  selectedCount,
  onSelectAll,
  onDeselectAll,
  onBulkCategory,
  onBulkExport,
  onBulkDelete,
}) {
  const isMobile = useIsMobile()

  return (
    <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
      <div
        className={`flex ${isMobile ? 'flex-col' : 'items-center justify-between'} flex-wrap gap-3`}
      >
        {/* Информация о выборе */}
        <div
          className={`flex items-center ${isMobile ? 'justify-between w-full' : 'gap-3'} flex-wrap`}
        >
          <span
            className={`${isMobile ? 'text-base' : 'text-sm'} font-medium text-blue-800 dark:text-blue-200`}
          >
            Выбрано: <span className="font-semibold">{selectedCount}</span> записей
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onSelectAll}
              className={`${isMobile ? 'text-sm px-3 py-1.5' : 'text-xs'} text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 underline touch-manipulation`}
              style={isMobile ? { minHeight: '44px' } : {}}
            >
              Выбрать все
            </button>

            <button
              onClick={onDeselectAll}
              className={`${isMobile ? 'text-sm px-3 py-1.5' : 'text-xs'} text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 underline touch-manipulation`}
              style={isMobile ? { minHeight: '44px' } : {}}
            >
              Отменить все
            </button>
          </div>
        </div>

        {/* Кнопки действий - на мобильных вертикально */}
        <div
          className={`flex ${isMobile ? 'flex-col w-full gap-2' : 'items-center gap-2'} flex-wrap`}
        >
          <Button
            onClick={onBulkCategory}
            variant="success"
            size={isMobile ? 'md' : 'sm'}
            icon={Folder}
            iconId="bulk-category"
            className={isMobile ? 'w-full touch-manipulation' : ''}
            style={isMobile ? { minHeight: '44px' } : {}}
          >
            Изменить категорию
          </Button>

          <Button
            onClick={onBulkExport}
            variant="secondary"
            size={isMobile ? 'md' : 'sm'}
            icon={Download}
            iconId="bulk-export"
            className={isMobile ? 'w-full touch-manipulation' : ''}
            style={isMobile ? { minHeight: '44px' } : {}}
          >
            Экспортировать
          </Button>

          <Button
            onClick={onBulkDelete}
            variant="danger"
            size={isMobile ? 'md' : 'sm'}
            icon={Trash2}
            iconId="bulk-delete"
            className={isMobile ? 'w-full touch-manipulation' : ''}
            style={isMobile ? { minHeight: '44px' } : {}}
          >
            Удалить
          </Button>
        </div>
      </div>
    </div>
  )
}
