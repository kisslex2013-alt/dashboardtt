import PropTypes from 'prop-types';
import { AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button';
import { BaseModal } from '../ui/BaseModal';

/**
 * Универсальное модальное окно подтверждения
 * - Используется для подтверждения критичных действий
 * - Настраиваемое сообщение и кнопки
 */
export function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'Подтвердить', cancelText = 'Отмена' }) {
  const handleConfirm = () => {
    onConfirm?.();
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-yellow-500" />
          <span>{title || 'Подтверждение'}</span>
        </div>
      }
      size="small"
      footer={
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={onClose}
            className="flex-1"
          >
            {cancelText}
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirm}
            className="flex-1"
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
  );
}

ConfirmModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func,
  title: PropTypes.string,
  message: PropTypes.string,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string
};

