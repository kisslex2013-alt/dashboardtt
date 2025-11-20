/**
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 *
 * Этот компонент содержит кнопки действий формы записи времени.
 * Он разделен из EditEntryModal для улучшения читаемости.
 *
 * Компонент получает обработчики действий через пропсы.
 */

import { Button } from '../ui/Button'
import { useIsMobile } from '../../hooks/useIsMobile'

/**
 * Компонент кнопок действий формы записи времени
 * @param {Object} props - Пропсы компонента
 * @param {Function} props.onSave - Обработчик сохранения
 * @param {Function} props.onClose - Обработчик закрытия
 * @param {Function} props.onDelete - Обработчик удаления
 * @param {Object|null} props.effectiveEntry - Текущая редактируемая запись (для показа кнопки удаления)
 */
export function EntryFormActions({ onSave, onClose, onDelete, effectiveEntry }) {
  const isMobile = useIsMobile()

  // ✅ ИСПРАВЛЕНО: Обработчики с проверкой на undefined и явной остановкой распространения событий
  const handleClose = (e) => {
    e?.stopPropagation()
    e?.preventDefault()
    if (onClose && typeof onClose === 'function') {
      onClose()
    } else {
      console.error('EntryFormActions: onClose is not a function', onClose)
    }
  }

  const handleDelete = (e) => {
    e?.stopPropagation()
    e?.preventDefault()
    if (onDelete && typeof onDelete === 'function') {
      onDelete()
    } else {
      console.error('EntryFormActions: onDelete is not a function', onDelete)
    }
  }

  const handleSave = (e) => {
    e?.stopPropagation()
    e?.preventDefault()
    if (onSave && typeof onSave === 'function') {
      onSave()
    } else {
      console.error('EntryFormActions: onSave is not a function', onSave)
    }
  }

  return (
    <div className={`flex ${isMobile ? 'flex-col-reverse gap-3' : 'justify-between gap-2'}`}>
      {effectiveEntry && effectiveEntry.id && (
        <Button
          variant="danger"
          onClick={handleDelete}
          iconId="edit-entry-delete"
          className={isMobile ? 'w-full touch-manipulation' : ''}
          style={isMobile ? { minHeight: '44px' } : {}}
        >
          Удалить
        </Button>
      )}
      <div className={`flex gap-2 ${isMobile ? 'w-full' : 'ml-auto'}`}>
        <Button
          variant="secondary"
          onClick={handleClose}
          type="button"
          iconId="edit-entry-cancel"
          className={isMobile ? 'flex-1 touch-manipulation' : ''}
          style={isMobile ? { minHeight: '44px' } : {}}
        >
          Отмена
        </Button>
        <Button
          onClick={handleSave}
          type="button"
          iconId="edit-entry-save"
          className={isMobile ? 'flex-1 touch-manipulation' : ''}
          style={isMobile ? { minHeight: '44px' } : {}}
        >
          Сохранить
        </Button>
      </div>
    </div>
  )
}
