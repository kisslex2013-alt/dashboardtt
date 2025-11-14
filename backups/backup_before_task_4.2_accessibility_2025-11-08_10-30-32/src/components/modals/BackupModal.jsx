import { useState, useEffect, useCallback } from 'react';
import { HardDrive, Download, Upload, Trash2, Clock, Archive } from 'lucide-react';
import { BaseModal } from '../ui/BaseModal';
import { AnimatedModalContent } from '../ui/AnimatedModalContent';
import { backupManager } from '../../utils/backupManager';
import { useEntriesStore } from '../../store/useEntriesStore';
import { useUIStore } from '../../store/useUIStore';
import { Button } from '../ui/Button';
import { logger } from '../../utils/logger';
import { useConfirmModal } from '../../hooks/useConfirmModal';
import { ConfirmModal } from './ConfirmModal';
import { handleError } from '../../utils/errorHandler';

/**
 * 💾 Модальное окно управления резервными копиями
 * 
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 * 
 * Это модальное окно позволяет:
 * - Просматривать все сохраненные бэкапы
 * - Создавать новые бэкапы вручную
 * - Восстанавливать данные из бэкапа
 * - Удалять старые бэкапы
 * 
 * Все бэкапы хранятся в IndexedDB браузера и не удаляются при очистке localStorage
 */
export function BackupModal({ isOpen, onClose }) {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  
  const { createManualBackup, restoreFromBackup } = useEntriesStore();
  const { showSuccess, showError } = useUIStore();
  
  // Для подтверждений удаления и восстановления
  const deleteConfirm = useConfirmModal();
  const restoreConfirm = useConfirmModal();

  /**
   * Загружает список всех бэкапов из IndexedDB
   * Использует useCallback для предотвращения лишних перерендеров
   */
  const loadBackups = useCallback(async () => {
    setLoading(true);
    try {
      const backupList = await backupManager.listBackups();
      // Обновляем только если список действительно изменился
      setBackups(prevBackups => {
        const prevTimestamps = prevBackups.map(b => b.timestamp).sort().join(',');
        const newTimestamps = backupList.map(b => b.timestamp).sort().join(',');
        if (prevTimestamps === newTimestamps) {
          return prevBackups; // Не обновляем, если список не изменился
        }
        return backupList;
      });
    } catch (error) {
      // ИСПРАВЛЕНО: Используем централизованную обработку ошибок
      const errorMessage = handleError(error, { operation: 'Загрузка списка бэкапов' });
      logger.error('❌ Ошибка загрузки списка бэкапов:', error);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  // Загружаем список бэкапов при открытии модального окна и синхронизируем с другими вкладками
  useEffect(() => {
    if (isOpen) {
      loadBackups();
      
      // Слушаем события изменения видимости вкладки для обновления списка
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible' && isOpen) {
          // При активации вкладки обновляем список резервных копий
          loadBackups();
        }
      };
      
      // Слушаем события фокуса для синхронизации
      const handleFocus = () => {
        if (isOpen) {
          loadBackups();
        }
      };
      
      // Подписываемся на события изменения бэкапов в других вкладках через BroadcastChannel
      const unsubscribeBackupChanges = backupManager.onBackupChange(() => {
        if (isOpen) {
          logger.log('🔄 Обнаружено изменение резервных копий в другой вкладке');
          loadBackups();
        }
      });
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('focus', handleFocus);
      
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('focus', handleFocus);
        if (unsubscribeBackupChanges) {
          unsubscribeBackupChanges();
        }
      };
    }
  }, [isOpen, loadBackups]);

  /**
   * Создает новый ручной бэкап
   */
  const handleCreateBackup = async () => {
    setIsCreating(true);
    try {
      const result = await createManualBackup();
      if (result.success) {
        showSuccess('Резервная копия успешно создана');
        // Небольшая задержка для гарантии, что IndexedDB обновился
        setTimeout(() => {
          loadBackups(); // Обновляем список
        }, 100);
      } else {
        showError('Не удалось создать резервную копию');
      }
    } catch (error) {
      // ИСПРАВЛЕНО: Используем централизованную обработку ошибок
      const errorMessage = handleError(error, { operation: 'Создание резервной копии' });
      logger.error('❌ Ошибка создания бэкапа:', error);
      showError(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  /**
   * Восстанавливает данные из выбранного бэкапа
   */
  const handleRestore = (timestamp) => {
    restoreConfirm.openConfirm({
      title: 'Восстановить данные?',
      message: 'Вы уверены, что хотите восстановить данные из этого бэкапа? Текущие данные будут заменены.',
      confirmText: 'Восстановить',
      cancelText: 'Отмена',
      onConfirm: async () => {
        setIsRestoring(true);
        try {
          const success = await restoreFromBackup(timestamp);
          if (success) {
            showSuccess('Данные успешно восстановлены');
            onClose();
          } else {
            showError('Не удалось восстановить данные');
          }
        } catch (error) {
          // ИСПРАВЛЕНО: Используем централизованную обработку ошибок
          const errorMessage = handleError(error, { operation: 'Восстановление из бэкапа', timestamp });
          logger.error('❌ Ошибка восстановления:', error);
          showError(errorMessage);
        } finally {
          setIsRestoring(false);
        }
      }
    });
  };

  /**
   * Удаляет выбранный бэкап
   */
  const handleDelete = (timestamp) => {
    deleteConfirm.openConfirm({
      title: 'Удалить резервную копию?',
      message: 'Вы уверены, что хотите удалить этот бэкап? Это действие нельзя отменить.',
      confirmText: 'Удалить',
      cancelText: 'Отмена',
      onConfirm: async () => {
        try {
          const success = await backupManager.deleteBackup(timestamp);
          if (success) {
            showSuccess('Бэкап успешно удален');
            await loadBackups(); // Обновляем список
          } else {
            showError('Не удалось удалить бэкап');
          }
        } catch (error) {
          // ИСПРАВЛЕНО: Используем централизованную обработку ошибок
          const errorMessage = handleError(error, { operation: 'Удаление бэкапа', timestamp });
          logger.error('❌ Ошибка удаления бэкапа:', error);
          showError(errorMessage);
        }
      }
    });
  };

  /**
   * Форматирует дату для отображения
   */
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /**
   * Форматирует относительное время (например, "2 часа назад")
   */
  const formatRelativeTime = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'только что';
    if (minutes < 60) return `${minutes} ${minutes === 1 ? 'минуту' : minutes < 5 ? 'минуты' : 'минут'} назад`;
    if (hours < 24) return `${hours} ${hours === 1 ? 'час' : hours < 5 ? 'часа' : 'часов'} назад`;
    return `${days} ${days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'} назад`;
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Управление резервными копиями"
      titleIcon={HardDrive}
      size="large"
      className="flex flex-col"
    >
      {/* Кнопка создания бэкапа */}
      <div className="mb-4">
        <Button
          onClick={handleCreateBackup}
          disabled={isCreating}
          variant="primary"
          icon={Archive}
          className="w-full"
          iconId="backup-create"
        >
          {isCreating ? 'Создание...' : 'Создать резервную копию'}
        </Button>
      </div>

      {/* Список бэкапов С анимацией */}
      <AnimatedModalContent contentKey={backups.length}>
        <div className="flex-1 overflow-y-auto pr-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-500 dark:text-gray-400">Загрузка...</div>
              </div>
            ) : backups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Archive className="w-12 h-12 text-gray-400 dark:text-gray-600 mb-2" />
                <p className="text-gray-500 dark:text-gray-400">
                  Резервные копии отсутствуют
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  Создайте первую резервную копию, чтобы сохранить ваши данные
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {backups.map((backup) => (
                  <div
                    key={backup.timestamp}
                    className="glass-effect rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatDate(backup.timestamp)}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            ({formatRelativeTime(backup.timestamp)})
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                          <span>Записей: {backup.entriesCount}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          onClick={() => handleRestore(backup.timestamp)}
                          disabled={isRestoring}
                          variant="secondary"
                          icon={Upload}
                          size="sm"
                          title="Восстановить"
                          iconId="backup-restore"
                        >
                          Восстановить
                        </Button>
                        <Button
                          onClick={() => handleDelete(backup.timestamp)}
                          variant="danger"
                          icon={Trash2}
                          iconId="backup-delete"
                          size="sm"
                          title="Удалить"
                        >
                          Удалить
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>
      </AnimatedModalContent>

      {/* Footer с информацией */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Резервные копии автоматически создаются при изменениях данных.
          Хранится максимум 10 последних копий.
        </p>
      </div>
      
      {/* Модальные окна подтверждения */}
      <ConfirmModal {...deleteConfirm.confirmConfig} />
      <ConfirmModal {...restoreConfirm.confirmConfig} />
    </BaseModal>
  );
}
