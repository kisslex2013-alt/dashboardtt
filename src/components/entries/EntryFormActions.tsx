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
import { Save, Trash2 } from '../../utils/icons'

export function EntryFormActions({ onSave, onClose, onDelete, effectiveEntry, isSaving }) {
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
    <div className={`flex ${isMobile ? 'flex-col-reverse gap-3' : 'justify-between gap-2'} items-center`}>
      {effectiveEntry && effectiveEntry.id && (
        <Button
          variant="destructive"
          onClick={handleDelete}
          className={isMobile ? 'w-full touch-manipulation' : 'w-10 h-10 !p-0 flex items-center justify-center rounded-lg'}
          aria-label="Удалить запись"
          disabled={isSaving}
        >
           {isMobile ? 'Удалить' : <Trash2 className="w-5 h-5" />}
        </Button>
      )}
      <div className={`flex gap-2 ${isMobile ? 'w-full' : 'ml-auto'}`}>
        <Button
          variant="secondary"
          onClick={handleClose}
          type="button"
          className={isMobile ? 'flex-1 touch-manipulation' : ''}
          style={isMobile ? { minHeight: '44px' } : {}}
          disabled={isSaving}
        >
          Отмена
        </Button>
        <Button
          onClick={handleSave}
          type="button"
          className={isMobile ? 'flex-1 touch-manipulation' : ''}
          style={isMobile ? { minHeight: '44px' } : {}}
          disabled={isSaving}
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Сохр...' : 'Сохранить'}
        </Button>
      </div>
    </div>
  )
}
