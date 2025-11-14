import { useState } from 'react';
import { Folder } from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore';
import { Button } from '../ui/Button';
import { BaseModal } from '../ui/BaseModal';
import { getIcon } from '../../utils/iconHelper';

/**
 * Модальное окно для массового изменения категории записей
 */
export function BulkCategoryModal({ isOpen, onClose, selectedCount, onConfirm }) {
  const { categories } = useSettingsStore();
  const [selectedCategoryId, setSelectedCategoryId] = useState('');

  const handleConfirm = () => {
    if (selectedCategoryId) {
      onConfirm(selectedCategoryId);
      setSelectedCategoryId('');
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedCategoryId('');
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Изменить категорию"
      size="small"
      footer={
        <div className="flex gap-3">
          <Button
            onClick={handleClose}
            variant="secondary"
            className="flex-1"
          >
            Отмена
          </Button>
          <Button
            onClick={handleConfirm}
            variant="primary"
            disabled={!selectedCategoryId}
            className="flex-1"
          >
            Применить
          </Button>
        </div>
      }
    >

      {/* Content */}
      <div className="mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Выбрано записей: <span className="font-semibold">{selectedCount}</span>
        </p>

        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
          Выберите новую категорию:
        </label>

        <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
          {categories.map((category) => {
            const CategoryIcon = category.icon ? getIcon(category.icon) : Folder;
            
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategoryId(category.id)}
                className={`
                  w-full p-3 rounded-lg border transition-normal hover-lift-scale
                  flex items-center gap-3 text-left
                  ${
                    selectedCategoryId === category.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }
                `}
              >
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: category.color }}
                />
                {CategoryIcon && (
                  <CategoryIcon
                    className="w-5 h-5 flex-shrink-0"
                    style={{ color: category.color }}
                  />
                )}
                <span className="flex-1 font-medium text-gray-900 dark:text-white">
                  {category.name}
                </span>
                {selectedCategoryId === category.id && (
                  <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </BaseModal>
  );
}

