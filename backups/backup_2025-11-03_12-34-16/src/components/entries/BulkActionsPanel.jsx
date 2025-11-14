import { Folder, Download, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';

/**
 * Панель массовых действий для выбранных записей
 */
export function BulkActionsPanel({ 
  selectedCount, 
  onSelectAll, 
  onDeselectAll, 
  onBulkCategory, 
  onBulkExport, 
  onBulkDelete 
}) {
  return (
    <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
      <div className="flex items-center justify-between flex-wrap gap-3">
        {/* Левая часть: Информация о выборе */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
            Выбрано: <span className="font-semibold">{selectedCount}</span> записей
          </span>
          
          <button
            onClick={onSelectAll}
            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 underline"
          >
            Выбрать все
          </button>
          
          <button
            onClick={onDeselectAll}
            className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 underline"
          >
            Отменить все
          </button>
        </div>

        {/* Правая часть: Кнопки действий */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={onBulkCategory}
            variant="success"
            size="sm"
            icon={Folder}
          >
            Изменить категорию
          </Button>
          
          <Button
            onClick={onBulkExport}
            variant="secondary"
            size="sm"
            icon={Download}
          >
            Экспортировать
          </Button>
          
          <Button
            onClick={onBulkDelete}
            variant="danger"
            size="sm"
            icon={Trash2}
          >
            Удалить
          </Button>
        </div>
      </div>
    </div>
  );
}

