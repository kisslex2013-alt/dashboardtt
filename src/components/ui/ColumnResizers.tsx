import { memo, useState } from 'react'
import { useNotifications } from '../../hooks/useNotifications'

/**
 * 🔧 Компонент разделителя столбцов для Grid
 *
 * Вертикальная линия между ячейками grid, которая появляется
 * только в режиме изменения размеров и позволяет перетаскивать
 * границы столбцов.
 *
 * @param {Object} props - пропсы компонента
 * @param {string} props.column - имя столбца для изменения
 * @param {Function} props.onDragStart - функция начала перетаскивания
 * @param {boolean} props.isDragging - флаг активного перетаскивания
 * @param {string} [props.position='right'] - позиция разделителя ('left' | 'right')
 */
interface DividerProps {
  column: string
  onDragStart: (mode: 'grid' | 'table', column: string, startX: number) => void
  isDragging: boolean
  position?: 'left' | 'right'
}

export const GridColumnDivider = memo(({ column, onDragStart, isDragging, position = 'right' }: DividerProps) => {
  const handleMouseDown = e => {
    e.preventDefault()
    e.stopPropagation()
    onDragStart('grid', column, e.clientX)
  }

  return (
    <div
      className={`
        absolute top-0 bottom-0 cursor-col-resize
        transition-all duration-200
        ${
          isDragging ? 'bg-blue-600 z-20 w-1' : 'bg-blue-500 z-10 w-0.5 hover:bg-blue-600 hover:w-1'
        }
      `}
      style={{
        [position === 'right' ? 'right' : 'left']: '-2px',
      }}
      onMouseDown={handleMouseDown}
      title={`Перетащите для изменения отступа столбца "${column}"`}
      role="separator"
      aria-label={`Разделитель столбца ${column}`}
    >
      {/* Увеличенная область для захвата (невидимая) */}
      <div className="absolute inset-y-0 -left-2 -right-2 cursor-col-resize" aria-hidden="true" />
    </div>
  )
})

/**
 * 🔧 Компонент разделителя столбцов для Table
 *
 * Вертикальная линия в `<th>` элементах таблицы, которая появляется
 * только в режиме изменения размеров и позволяет перетаскивать
 * границы столбцов.
 *
 * @param {Object} props - пропсы компонента
 * @param {string} props.column - имя столбца для изменения
 * @param {Function} props.onDragStart - функция начала перетаскивания
 * @param {boolean} props.isDragging - флаг активного перетаскивания
 * @param {string} [props.position='right'] - позиция разделителя ('left' | 'right')
 */
export const TableColumnDivider = memo(
  ({ column, onDragStart, isDragging, position = 'right' }: DividerProps) => {
    const handleMouseDown = e => {
      e.preventDefault()
      e.stopPropagation()
      onDragStart('table', column, e.clientX)
    }

    return (
      <div
        className={`
        absolute top-0 bottom-0 cursor-col-resize
        transition-all duration-200
        ${
          isDragging ? 'bg-blue-600 z-20 w-1' : 'bg-blue-500 z-10 w-0.5 hover:bg-blue-600 hover:w-1'
        }
      `}
        style={{
          [position === 'right' ? 'right' : 'left']: '-2px',
        }}
        onMouseDown={handleMouseDown}
        title={`Перетащите для изменения ширины столбца "${column}"`}
        role="separator"
        aria-label={`Разделитель столбца ${column}`}
      >
        {/* Увеличенная область для захвата (невидимая) */}
        <div className="absolute inset-y-0 -left-2 -right-2 cursor-col-resize" aria-hidden="true" />
      </div>
    )
  }
)

/**
 * 🔧 Индикатор режима изменения столбцов
 *
 * Показывает текущий режим и подсказки по горячим клавишам.
 *
 * @param {Object} props - пропсы компонента
 * @param {boolean} props.isVisible - видимость индикатора
 * @param {Function} props.onReset - функция сброса настроек
 * @param {Function} props.onSaveAsDefaults - функция сохранения как дефолтных значений
 */
interface IndicatorProps {
  isVisible: boolean
  onReset: () => void
  onSaveAsDefaults: () => boolean
}

export const ResizeModeIndicator = memo(({ isVisible, onReset, onSaveAsDefaults }: IndicatorProps) => {
  const [showConfirm, setShowConfirm] = useState(false)
  const { showNotification } = useNotifications()

  if (!isVisible) return null

  const handleSaveAsDefaults = () => {
    if (showConfirm) {
      const success = onSaveAsDefaults()
      if (success) {
        setShowConfirm(false)
        // Показываем уведомление об успехе
        showNotification(
          '✅ Дефолтные значения ширины столбцов сохранены! При деплое они автоматически применятся для всех пользователей.',
          'success',
          5000
        )
      } else {
        showNotification('Ошибка сохранения значений по умолчанию', 'error', 5000)
      }
    } else {
      setShowConfirm(true)
      // Автоматически скрываем подтверждение через 3 секунды
      setTimeout(() => setShowConfirm(false), 3000)
    }
  }

  return (
    <>
      {/* Индикатор в левом верхнем углу */}
      <div className="fixed top-4 left-4 bg-blue-500 text-white px-3 py-2 rounded-lg shadow-lg z-[9999] flex items-center gap-2 animate-slide-down">
        <span className="text-sm font-medium">🔧 Режим изменения столбцов</span>
        <kbd className="px-2 py-1 bg-blue-600 rounded text-xs font-mono">Alt+Shift+R</kbd>
        <span className="text-xs opacity-75">или Esc для выхода</span>
      </div>

      {/* Кнопки управления в правом верхнем углу */}
      <div className="fixed top-4 right-4 flex items-center gap-2 z-[9999] animate-slide-down">
        {/* Кнопка сохранения как дефолтных значений */}
        <button
          onClick={handleSaveAsDefaults}
          className={`px-3 py-2 rounded-lg shadow-lg transition-colors flex items-center gap-2 ${
            showConfirm
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-yellow-500 hover:bg-yellow-600 text-white'
          }`}
          title={
            showConfirm
              ? 'Нажмите еще раз для подтверждения'
              : 'Сохранить текущие значения как значения по умолчанию для всех пользователей'
          }
          aria-label="Сохранить как значения по умолчанию"
        >
          <span>{showConfirm ? '✓' : '💾'}</span>
          <span className="text-sm font-medium">
            {showConfirm ? 'Подтвердить' : 'Сохранить как дефолт'}
          </span>
        </button>

        {/* Кнопка сброса */}
        <button
          onClick={onReset}
          className="bg-red-500 text-white px-3 py-2 rounded-lg shadow-lg hover:bg-red-600 transition-colors flex items-center gap-2"
          title="Сбросить все настройки к значениям по умолчанию"
          aria-label="Сбросить настройки столбцов"
        >
          <span>🔄</span>
          <span className="text-sm font-medium">Сброс</span>
        </button>
      </div>
    </>
  )
})
