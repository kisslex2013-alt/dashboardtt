import { Folder, Download, Trash2, CheckSquare, X  } from '../../utils/icons'
import { useIsMobile } from '../../hooks/useIsMobile'
import { motion } from 'framer-motion'

/**
 * Панель массовых действий для выбранных записей
 *
 * Современный дизайн с glassmorphism эффектом
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
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="mb-4 px-4 py-3 glass-effect rounded-xl shadow-lg"
    >
      <div
        className={`flex ${isMobile ? 'flex-col gap-3' : 'items-center justify-between'}`}
      >
        {/* Левая часть: счетчик и ссылки */}
        <div
          className={`flex items-center ${isMobile ? 'justify-between w-full' : 'gap-4'}`}
        >
          {/* Бейдж с количеством */}
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/20 text-primary">
              <CheckSquare className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium text-text-primary">
               <span className="text-lg font-bold text-primary">{selectedCount}</span>
               <span className="text-text-secondary ml-1.5">записей</span>
            </span>
          </div>

          {/* Ссылки управления */}
          <div className="flex items-center gap-1">
            <button
              onClick={onSelectAll}
              className="px-2.5 py-1.5 text-xs font-medium text-text-secondary hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
            >
              Выбрать все
            </button>
            <span className="text-text-tertiary">•</span>
            <button
              onClick={onDeselectAll}
              className="px-2.5 py-1.5 text-xs font-medium text-text-secondary hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              Отменить
            </button>
          </div>
        </div>

        {/* Правая часть: кнопки действий */}
        <div
          className={`flex ${isMobile ? 'flex-row w-full gap-2' : 'items-center gap-2'}`}
        >
          <button
            onClick={onBulkCategory}
            className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium 
              bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 
              hover:bg-emerald-500/25 transition-colors
              ${isMobile ? 'flex-1' : ''}`}
          >
            <Folder className="w-4 h-4" />
            <span className={isMobile ? 'sr-only' : ''}>Изменить категорию</span>
            {isMobile && <span>Категория</span>}
          </button>

          <button
            onClick={onBulkExport}
            className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium 
              bg-blue-500/15 text-blue-600 dark:text-blue-400 
              hover:bg-blue-500/25 transition-colors
              ${isMobile ? 'flex-1' : ''}`}
          >
            <Download className="w-4 h-4" />
            <span className={isMobile ? 'sr-only' : ''}>Экспортировать</span>
            {isMobile && <span>Экспорт</span>}
          </button>

          <button
            onClick={onBulkDelete}
            className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium 
              bg-red-500/15 text-red-600 dark:text-red-400 
              hover:bg-red-500/25 transition-colors
              ${isMobile ? 'flex-1' : ''}`}
          >
            <Trash2 className="w-4 h-4" />
            <span className={isMobile ? 'sr-only' : ''}>Удалить</span>
            {isMobile && <span>Удалить</span>}
          </button>
        </div>
      </div>
    </motion.div>
  )
}
