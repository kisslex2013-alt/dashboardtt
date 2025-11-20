import { AlertTriangle } from '../../utils/icons'
import { Button } from '../ui/Button'
import { BaseModal } from '../ui/BaseModal'
import type { ConfirmModalProps } from '../../types'

/**
 * Универсальное модальное окно подтверждения
 * - Используется для подтверждения критичных действий
 * - Настраиваемое сообщение и кнопки
 */
export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Подтвердить',
  cancelText = 'Отмена',
}: ConfirmModalProps) {
  // ✅ ИСПРАВЛЕНО: Обработчики с явной остановкой распространения событий
  const handleConfirm = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    e?.preventDefault()
    if (onConfirm) {
      onConfirm()
    }
    onClose()
  }

  const handleCancel = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    e?.preventDefault()
    onClose()
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={title || 'Подтверждение'}
      titleIcon={AlertTriangle}
      size="small"
      closeOnOverlayClick={false}
      nested={true}
      footer={
        <div 
          className="flex gap-2"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <Button 
            variant="secondary" 
            onClick={handleCancel} 
            className="flex-1" 
            iconId="confirm-cancel"
            type="button"
          >
            {cancelText}
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirm}
            className="flex-1"
            iconId="confirm-submit"
            type="button"
          >
            {confirmText}
          </Button>
        </div>
      }
    >
      {/* Сообщение */}
      <div className="mb-4">
        <p className="text-gray-700 dark:text-gray-300">
          {message || 'Вы уверены, что хотите выполнить это действие?'}
        </p>
      </div>
    </BaseModal>
  )
}
