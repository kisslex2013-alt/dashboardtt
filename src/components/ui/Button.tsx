import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import type { ButtonProps } from '../../types'
import { X } from '../../utils/icons'
import { useIconEditorStore } from '../../store/useIconEditorStore'
import { getIcon } from '../../utils/iconHelper'
import { IconSelect } from './IconSelect'
import { useHapticFeedback } from '../../hooks/useHapticFeedback'

/**
 * 🎯 Кнопка с различными вариантами стилей
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconId,
  onClick,
  disabled,
  className = '',
  type = 'button',
  hapticFeedback = true,
}: ButtonProps) {
  const [showIconSelector, setShowIconSelector] = useState(false)
  const buttonRef = useRef(null)
  const selectorRef = useRef(null)
  const triggerHaptic = useHapticFeedback() // ✅ ОПТИМИЗАЦИЯ: Haptic feedback для мобильных устройств

  // Генерируем автоматический iconId если его нет, но есть иконка
  // Работает в dev и production для применения замен из localStorage
  const effectiveIconId = useMemo(() => {
    if (iconId) {
      if (import.meta.env.DEV) {
        console.log('[Button] Используется переданный iconId:', iconId)
      }
      return iconId
    }
    if (Icon) {
      // Генерируем ID на основе имени компонента иконки или текста кнопки
      // Работает в dev и production для применения замен из localStorage
      const iconName = Icon.name || Icon.displayName || 'Icon'
      const buttonText = typeof children === 'string' ? children : ''
      const generatedId = `auto-${iconName}-${buttonText}`.toLowerCase().replace(/\s+/g, '-')
      if (import.meta.env.DEV) {
        console.log(
          '[Button] Сгенерирован effectiveIconId:',
          generatedId,
          'для иконки:',
          iconName,
          'текст:',
          buttonText
        )
      }
      return generatedId
    }
    return null
  }, [iconId, Icon, children])

  // Получаем замену иконки из store (работает в dev и production, но сохраняется только локально)
  // Подписываемся на изменения iconReplacements для автоматического обновления
  const iconReplacement = useIconEditorStore(state =>
    effectiveIconId ? state.getIconReplacement(effectiveIconId) : null
  )
  const replaceIcon = useIconEditorStore(state => state.replaceIcon)

  // Получаем замену цвета кнопки из store (работает в dev и production, но сохраняется только локально)
  const buttonColorReplacement = useIconEditorStore(state =>
    effectiveIconId ? state.getButtonColor(effectiveIconId) : null
  )
  const replaceButtonColor = useIconEditorStore(state => state.replaceButtonColor)

  // Подписываемся на изменения iconReplacements и buttonColorReplacements для принудительного обновления
  // Это нужно, чтобы компонент перерендерился при изменении замены иконки или цвета
  const iconReplacements = useIconEditorStore(state => state.iconReplacements)
  const buttonColorReplacements = useIconEditorStore(state => state.buttonColorReplacements)

  useEffect(() => {
    if (import.meta.env.DEV && effectiveIconId) {
      const replacement = iconReplacements[effectiveIconId]
      const colorReplacement = buttonColorReplacements[effectiveIconId]
      console.log(
        '[Button] Проверка замены для',
        effectiveIconId,
        ':',
        replacement,
        'цвет:',
        colorReplacement
      )
      if (replacement) {
        console.log('[Button] Найдена замена иконки:', replacement)
      }
      if (colorReplacement) {
        console.log('[Button] Найдена замена цвета:', colorReplacement)
      }
    }
  }, [iconReplacements, buttonColorReplacements, effectiveIconId])

  // Определяем какую иконку использовать: замену или оригинал
  let DisplayIcon = Icon
  if (effectiveIconId && iconReplacement) {
    // Если есть замена, загружаем её через iconHelper
    if (import.meta.env.DEV) {
      console.log('[Button] Применение замены иконки:', effectiveIconId, '->', iconReplacement)
    }
    const ReplacementIconComponent = getIcon(iconReplacement)
    if (ReplacementIconComponent) {
      DisplayIcon = ReplacementIconComponent
      if (import.meta.env.DEV) {
        console.log('[Button] Иконка успешно заменена')
      }
    } else {
      if (import.meta.env.DEV) {
        console.warn('[Button] Не удалось загрузить замену иконки:', iconReplacement)
      }
    }
  }

  // Обработчик правого клика для смены иконки (только в dev режиме и если есть иконка)
  const handleContextMenu = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (import.meta.env.DEV && Icon && effectiveIconId) {
        e.preventDefault()
        e.stopPropagation()
        setShowIconSelector(true)
      }
    },
    [Icon, effectiveIconId]
  )

  // Закрытие селектора при клике вне
  useEffect(() => {
    if (!showIconSelector) return

    const handleClickOutside = (e: MouseEvent) => {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node) &&
        selectorRef.current &&
        !selectorRef.current.contains(e.target as Node)
      ) {
        setShowIconSelector(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showIconSelector])

  // Обработчик выбора иконки
  const handleIconSelect = useCallback(
    (iconName: string) => {
      if (effectiveIconId && iconName) {
        replaceIcon(effectiveIconId, iconName)
        setShowIconSelector(false)
      }
    },
    [effectiveIconId, replaceIcon]
  )
  // Унифицированные базовые стили с новой системой анимаций
  const baseStyles = 'glass-button transition-normal hover-lift-scale'

  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600',
    danger: 'bg-red-500 hover:bg-red-600 text-white',
    success: 'bg-green-500 hover:bg-green-600 text-white',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  }

  // Определяем стиль для цвета кнопки (если есть замена)
  const buttonStyle = useMemo(() => {
    if (buttonColorReplacement && effectiveIconId) {
      // Если цвет в формате hex (#3B82F6), применяем через style
      if (buttonColorReplacement.startsWith('#')) {
        return {
          backgroundColor: buttonColorReplacement,
          color: '#ffffff', // Белый текст для контраста
        }
      }
      // Если это Tailwind класс, возвращаем null (будет применен через className)
      return null
    }
    return null
  }, [buttonColorReplacement, effectiveIconId])

  // Определяем класс для цвета (если это Tailwind класс)
  const colorClassName = useMemo(() => {
    if (buttonColorReplacement && effectiveIconId && !buttonColorReplacement.startsWith('#')) {
      // Если это Tailwind класс (например, "blue-500"), применяем как bg-{color}
      return `bg-${buttonColorReplacement} hover:opacity-90 text-white`
    }
    return ''
  }, [buttonColorReplacement, effectiveIconId])

  // ✅ ОПТИМИЗАЦИЯ: Обработчик клика с haptic feedback
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      // ✅ ИСПРАВЛЕНО: Останавливаем распространение события, чтобы оно не блокировалось родительскими обработчиками
      // НЕ используем preventDefault(), чтобы не блокировать стандартное поведение кнопки
      e.stopPropagation()

      if (disabled) {
        e.preventDefault() // Только для disabled кнопок предотвращаем действие
        return
      }

      if (hapticFeedback) {
        // Определяем тип вибрации в зависимости от варианта кнопки
        const hapticPattern = variant === 'danger' ? 'error' : variant === 'success' ? 'success' : 'light'
        triggerHaptic(hapticPattern as 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error')
      }
      if (onClick) {
        onClick(e)
      }
    },
    [disabled, hapticFeedback, variant, triggerHaptic, onClick]
  )

  return (
    <div className="relative" ref={buttonRef}>
      <button
        type={type}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        disabled={disabled}
        {...(effectiveIconId ? { 'data-icon-id': effectiveIconId } : {})} // Добавляем атрибут для режима редактирования
        className={`
          ${baseStyles}
          ${buttonColorReplacement && effectiveIconId ? colorClassName : variants[variant]}
          ${sizes[size]}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'click-shrink'}
          ${className}
          flex items-center justify-center
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          ${import.meta.env.DEV && Icon ? '' : ''}
        `}
        style={buttonStyle || undefined}
        aria-disabled={disabled}
        title={import.meta.env.DEV && Icon ? 'Правый клик для смены иконки и цвета' : undefined}
      >
        {DisplayIcon && <DisplayIcon className="mr-2 w-5 h-5 flex-shrink-0" aria-hidden="true" />}
        <span>{children}</span>
      </button>

      {/* Селектор иконок при правом клике (только в dev режиме) */}
      {import.meta.env.DEV && Icon && effectiveIconId && showIconSelector && (
        <div
          ref={selectorRef}
          className="absolute top-full left-0 mt-2 z-[99999] glass-effect rounded-lg border border-gray-300 dark:border-gray-600 shadow-xl p-4 min-w-[300px]"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold">Сменить иконку</h4>
            <button
              onClick={() => setShowIconSelector(false)}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Закрыть"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <IconSelect value={iconReplacement || ''} onChange={handleIconSelect} color="#3B82F6" />
        </div>
      )}
    </div>
  )
}

