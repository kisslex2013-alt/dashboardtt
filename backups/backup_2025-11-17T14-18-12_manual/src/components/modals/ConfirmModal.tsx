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
  const handleConfirm = () => {
    onConfirm?.()
    onClose()
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={title || 'Подтверждение'}
      titleIcon={AlertTriangle}
      size="small"
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose} className="flex-1" iconId="confirm-cancel">
            {cancelText}
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirm}
            className="flex-1"
            iconId="confirm-submit"
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
