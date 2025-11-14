import { useState } from 'react';

/**
 * 🔔 Хук для управления модальным окном подтверждения
 * 
 * Упрощает использование ConfirmModal без дублирования кода
 * 
 * @returns {object} { isOpen, openConfirm, closeConfirm, confirmConfig }
 * 
 * @example
 * const { isOpen, openConfirm, closeConfirm, confirmConfig } = useConfirmModal();
 * 
 * // Открыть модалку
 * openConfirm({
 *   title: 'Удалить запись?',
 *   message: 'Вы уверены?',
 *   onConfirm: () => deleteEntry(id),
 *   confirmText: 'Удалить'
 * });
 * 
 * // В компоненте
 * <ConfirmModal {...confirmConfig} />
 */
export function useConfirmModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState({
    title: 'Подтверждение',
    message: 'Вы уверены, что хотите выполнить это действие?',
    onConfirm: () => {},
    confirmText: 'Подтвердить',
    cancelText: 'Отмена'
  });

  const openConfirm = (newConfig) => {
    setConfig({
      title: config.title,
      message: config.message,
      onConfirm: () => {},
      confirmText: config.confirmText,
      cancelText: config.cancelText,
      ...newConfig
    });
    setIsOpen(true);
  };

  const closeConfirm = () => {
    setIsOpen(false);
  };

  const handleConfirm = () => {
    config.onConfirm?.();
    closeConfirm();
  };

  return {
    isOpen,
    openConfirm,
    closeConfirm,
    confirmConfig: {
      isOpen,
      onClose: closeConfirm,
      onConfirm: handleConfirm,
      ...config
    }
  };
}

