import { useState } from 'react';

/**
 * 🔔 Хук для управления модальным окном подтверждения
 * 
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 * 
 * Этот хук упрощает использование модального окна подтверждения действий.
 * Вместо управления состоянием вручную, хук предоставляет готовые функции
 * для открытия и закрытия модального окна с нужной конфигурацией.
 * 
 * Упрощает использование ConfirmModal без дублирования кода.
 * 
 * @returns {Object} объект с методами и конфигурацией модального окна
 * @returns {boolean} returns.isOpen - открыто ли модальное окно
 * @returns {Function} returns.openConfirm - функция открытия модального окна
 * @param {Object} config - конфигурация модального окна
 * @param {string} config.title - заголовок модального окна
 * @param {string} config.message - текст сообщения
 * @param {Function} config.onConfirm - функция, вызываемая при подтверждении
 * @param {string} [config.confirmText='Подтвердить'] - текст кнопки подтверждения
 * @param {string} [config.cancelText='Отмена'] - текст кнопки отмены
 * @returns {Function} returns.closeConfirm - функция закрытия модального окна
 * @returns {Object} returns.confirmConfig - готовая конфигурация для передачи в ConfirmModal
 * 
 * @example
 * function DeleteButton({ entryId, onDelete }) {
 *   const { openConfirm, confirmConfig } = useConfirmModal();
 *   
 *   const handleClick = () => {
 *     openConfirm({
 *       title: 'Удалить запись?',
 *       message: 'Вы уверены, что хотите удалить эту запись?',
 *       onConfirm: () => onDelete(entryId),
 *       confirmText: 'Удалить',
 *       cancelText: 'Отмена'
 *     });
 *   };
 *   
 *   return (
 *     <>
 *       <button onClick={handleClick}>Удалить</button>
 *       <ConfirmModal {...confirmConfig} />
 *     </>
 *   );
 * }
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

