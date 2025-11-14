import { Smartphone } from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore';
import { BaseModal } from '../ui/BaseModal';

/**
 * 🎨 Модальное окно настроек плавающей панели таймера
 * 
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 * 
 * Это модальное окно позволяет настраивать:
 * - Включение/выключение плавающей панели
 * - Размер панели (компактный/расширенный)
 * - Тему оформления (стеклянная/твердая/минимальная)
 * - Сброс позиции панели на экране
 * 
 * Все настройки сохраняются автоматически в localStorage.
 */
export function FloatingPanelSettingsModal({ isOpen, onClose }) {
  const { floatingPanel, updateSettings } = useSettingsStore();
  
  // Используем значения по умолчанию если floatingPanel не инициализирован
  const panelSettings = floatingPanel || {
    enabled: false, // По умолчанию выключена
    size: 'compact',
    theme: 'glass',
    position: { x: 20, y: 20 }
  };

  const handleTogglePanel = () => {
    updateSettings({
      floatingPanel: {
        ...panelSettings,
        enabled: !panelSettings.enabled
      }
    });
  };

  const handleSizeChange = (size) => {
    updateSettings({
      floatingPanel: {
        ...panelSettings,
        size
      }
    });
  };

  const handleThemeChange = (theme) => {
    updateSettings({
      floatingPanel: {
        ...panelSettings,
        theme
      }
    });
  };

  const handleResetPosition = () => {
    updateSettings({
      floatingPanel: {
        ...panelSettings,
        position: { x: 20, y: 20 }
      }
    });
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Настройки плавающей панели"
      titleIcon={Smartphone}
      size="medium"
    >
      <div className="space-y-6">
        {/* Включение/выключение */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Включить панель
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Показывать плавающую панель на экране
            </p>
          </div>
          <button
            onClick={handleTogglePanel}
            className={`
              relative inline-flex h-6 w-11 items-center rounded-full transition-colors
              ${panelSettings.enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}
            `}
            aria-label={panelSettings.enabled ? 'Выключить панель' : 'Включить панель'}
          >
            <span
              className={`
                inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                ${panelSettings.enabled ? 'translate-x-6' : 'translate-x-1'}
              `}
            />
          </button>
        </div>

        {/* Размер панели */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Размер панели
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleSizeChange('compact')}
              className={`
                p-3 rounded-lg border transition-colors
                ${panelSettings.size === 'compact'
                  ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-300'
                  : 'bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                }
              `}
            >
              <div className="text-center">
                <div className="text-sm font-medium">Компактный</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  200×100px
                </div>
              </div>
            </button>
            <button
              onClick={() => handleSizeChange('expanded')}
              className={`
                p-3 rounded-lg border transition-colors
                ${panelSettings.size === 'expanded'
                  ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-300'
                  : 'bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                }
              `}
            >
              <div className="text-center">
                <div className="text-sm font-medium">Расширенный</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  320×180px
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Тема панели */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Тема панели
          </h3>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleThemeChange('glass')}
              className={`
                p-3 rounded-lg border transition-colors
                ${panelSettings.theme === 'glass'
                  ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500'
                  : 'bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                }
              `}
            >
              <div className="text-center">
                <div className="text-sm font-medium">Стеклянная</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Размытие
                </div>
              </div>
            </button>
            <button
              onClick={() => handleThemeChange('solid')}
              className={`
                p-3 rounded-lg border transition-colors
                ${panelSettings.theme === 'solid'
                  ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500'
                  : 'bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                }
              `}
            >
              <div className="text-center">
                <div className="text-sm font-medium">Твердая</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Непрозрачная
                </div>
              </div>
            </button>
            <button
              onClick={() => handleThemeChange('minimal')}
              className={`
                p-3 rounded-lg border transition-colors
                ${panelSettings.theme === 'minimal'
                  ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500'
                  : 'bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                }
              `}
            >
              <div className="text-center">
                <div className="text-sm font-medium">Минимальная</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Простая
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Дополнительные действия */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={handleResetPosition}
            className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
          >
            Сбросить позицию
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Готово
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
