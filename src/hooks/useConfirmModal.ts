import { useState, useCallback, useRef, useEffect } from 'react'

interface ConfirmConfig {
  title: string
  message: string
  onConfirm: () => void
  confirmText: string
  cancelText: string
}

interface ConfirmModalConfig {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText: string
  cancelText: string
}

interface UseConfirmModalReturn {
  isOpen: boolean
  openConfirm: (config: Partial<ConfirmConfig>) => void
  closeConfirm: () => void
  confirmConfig: ConfirmModalConfig
}

/**
 * 🔔 Хук для управления модальным окном подтверждения
 *
 * Упрощает использование ConfirmModal без дублирования кода.
 * Предоставляет готовые функции для открытия и закрытия модального окна.
 *
 * @returns объект с методами и конфигурацией модального окна
 *
 * @example
 * function DeleteButton({ entryId, onDelete }) {
 *   const { openConfirm, confirmConfig } = useConfirmModal();
 *
 *   const handleClick = () => {
 *     openConfirm({
 *       title: 'Удалить запись?',
 *       message: 'Вы уверены?',
 *       onConfirm: () => onDelete(entryId),
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
export function useConfirmModal(): UseConfirmModalReturn {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [config, setConfig] = useState<ConfirmConfig>({
    title: 'Подтверждение',
    message: 'Вы уверены, что хотите выполнить это действие?',
    onConfirm: () => {},
    confirmText: 'Подтвердить',
    cancelText: 'Отмена',
  })

  // Используем ref для хранения актуального onConfirm
  const onConfirmRef = useRef<() => void>(config.onConfirm)

  useEffect(() => {
    onConfirmRef.current = config.onConfirm
  }, [config.onConfirm])

  const openConfirm = (newConfig: Partial<ConfirmConfig>): void => {
    setConfig({
      title: 'Подтверждение',
      message: 'Вы уверены, что хотите выполнить это действие?',
      onConfirm: () => {},
      confirmText: 'Подтвердить',
      cancelText: 'Отмена',
      ...newConfig,
    })
    setIsOpen(true)
  }

  const closeConfirm = useCallback((): void => {
    setIsOpen(false)
  }, [])

  const handleConfirm = useCallback((): void => {
    if (onConfirmRef.current) {
      onConfirmRef.current()
    }
    closeConfirm()
  }, [closeConfirm])

  return {
    isOpen,
    openConfirm,
    closeConfirm,
    confirmConfig: {
      isOpen,
      onClose: closeConfirm,
      onConfirm: handleConfirm,
      title: config.title,
      message: config.message,
      confirmText: config.confirmText,
      cancelText: config.cancelText,
    },
  }
}
