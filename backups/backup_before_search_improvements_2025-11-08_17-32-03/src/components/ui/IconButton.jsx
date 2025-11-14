import { useMemo } from 'react';
import { useIconEditorStore } from '../../store/useIconEditorStore';
import { getIcon } from '../../utils/iconHelper';
import { Icon } from '@iconify/react';

/**
 * 🎯 Простой компонент кнопки с иконкой, поддерживающий замену иконок
 * 
 * Используется для кнопок, которые не используют компонент Button,
 * но должны поддерживать замену иконок через iconId
 * 
 * @param {string} iconId - уникальный ID для режима редактирования иконок
 * @param {React.Component} defaultIcon - иконка по умолчанию (Lucide компонент)
 * @param {React.ReactNode} children - содержимое кнопки
 * @param {Object} props - остальные пропсы передаются в button элемент
 */
export function IconButton({ iconId, defaultIcon: DefaultIcon, children, ...props }) {
  // Получаем замену иконки из store (только в dev режиме)
  const iconReplacement = useIconEditorStore((state) => 
    iconId && import.meta.env.DEV ? state.getIconReplacement(iconId) : null
  );
  
  // Определяем какую иконку использовать: замену или оригинал
  const DisplayIcon = useMemo(() => {
    if (iconId && iconReplacement) {
      if (import.meta.env.DEV) {
        console.log('[IconButton] Применение замены иконки:', iconId, '->', iconReplacement);
      }
      const ReplacementIconComponent = getIcon(iconReplacement);
      if (ReplacementIconComponent) {
        return ReplacementIconComponent;
      }
    }
    return DefaultIcon;
  }, [iconId, iconReplacement, DefaultIcon]);
  
  // Определяем, является ли иконка Iconify
  const isIconify = iconReplacement && iconReplacement.startsWith('iconify:');
  
  return (
    <button
      {...props}
      data-icon-id={iconId}
    >
      {isIconify ? (
        <Icon 
          icon={iconReplacement.replace('iconify:', '')} 
          className="w-5 h-5 flex-shrink-0"
        />
      ) : (
        <DisplayIcon className="w-5 h-5 flex-shrink-0" />
      )}
      {children}
    </button>
  );
}

