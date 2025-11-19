import { useMemo } from 'react'
import { useIconEditorStore } from '../../store/useIconEditorStore'
import { getIcon } from '../../utils/iconHelper'
import { Icon } from '@iconify/react'
import { DEFAULT_BUTTON_COLOR_REPLACEMENTS } from '../../constants/defaultIconSettings'
import { shallow } from 'zustand/shallow'
import { logger } from '../../utils/logger'

/**
 * Конвертирует rgb/rgba строку в hex
 * @param {string} rgb - строка вида "rgb(30, 41, 55)" или "rgba(30, 41, 55, 1)"
 * @returns {string|null} hex цвет или null если не удалось распарсить
 */
function rgbToHex(rgb) {
  if (!rgb || typeof rgb !== 'string') return null

  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (!match) return null

  const r = parseInt(match[1], 10)
  const g = parseInt(match[2], 10)
  const b = parseInt(match[3], 10)

  return (
    '#' +
    [r, g, b]
      .map(x => {
        const hex = x.toString(16)
        return hex.length === 1 ? '0' + hex : hex
      })
      .join('')
  )
}

/**
 * Конвертирует Tailwind класс цвета в hex
 * @param {string} tailwindClass - Tailwind класс (например, 'blue-500', 'green-500', 'gray-200')
 * @returns {string|null} hex цвет или null если не удалось конвертировать
 */
function tailwindToHex(tailwindClass) {
  if (!tailwindClass || typeof tailwindClass !== 'string') return null

  // Маппинг Tailwind цветов в hex (стандартная палитра Tailwind)
  const tailwindColors = {
    // Blue
    'blue-500': '#3B82F6',
    'blue-600': '#2563EB',
    // Green
    'green-500': '#10B981',
    'green-600': '#059669',
    // Red
    'red-500': '#EF4444',
    'red-600': '#DC2626',
    // Gray
    'gray-200': '#E5E7EB',
    'gray-300': '#D1D5DB',
    'gray-400': '#9CA3AF',
    'gray-500': '#6B7280',
    'gray-600': '#4B5563',
    'gray-700': '#374151',
    'gray-800': '#1F2937',
    'gray-900': '#111827',
    // Yellow
    'yellow-500': '#F59E0B',
    // Purple
    'purple-500': '#A855F7',
    // Pink
    'pink-500': '#EC4899',
    // Indigo
    'indigo-500': '#6366F1',
    // Teal
    'teal-500': '#14B8A6',
    // Orange
    'orange-500': '#F97316',
  }

  return tailwindColors[tailwindClass] || null
}

/**
 * Нормализует цвет к hex формату для сравнения
 * @param {string} color - цвет в любом формате (hex, rgb, Tailwind класс)
 * @returns {string|null} нормализованный цвет или null
 */
function normalizeColorForComparison(color) {
  if (!color || typeof color !== 'string') return null

  // Если это rgb/rgba - конвертируем в hex
  if (color.startsWith('rgb')) {
    return rgbToHex(color)
  }

  // Если это hex - нормализуем (нижний регистр, добавляем # если нужно)
  if (color.startsWith('#')) {
    return color.toLowerCase()
  }

  // Если это Tailwind класс - конвертируем в hex для сравнения
  const hex = tailwindToHex(color)
  if (hex) {
    return hex.toLowerCase()
  }

  // Если не удалось конвертировать - возвращаем как есть
  return color
}

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
  // Получаем замену иконки из store - подписываемся на весь объект для правильной реактивности
  // Используем shallow сравнение, чтобы перерисовка происходила только при реальных изменениях
  const iconReplacements = useIconEditorStore(state => state.iconReplacements, shallow)
  const iconReplacement = useMemo(() => {
    if (!iconId) return null
    return iconReplacements[iconId] || null
  }, [iconId, iconReplacements])

  // Получаем замену цвета кнопки из store - подписываемся на весь объект для правильной реактивности
  // Используем shallow сравнение, чтобы перерисовка происходила только при реальных изменениях
  const buttonColorReplacements = useIconEditorStore(
    state => state.buttonColorReplacements,
    shallow
  )
  const buttonColorReplacement = useMemo(() => {
    if (!iconId) return null
    return buttonColorReplacements[iconId] || null
  }, [iconId, buttonColorReplacements])

  // Логируем для отладки
  if (iconId && iconReplacement) {
    logger.log('[IconButton] Получена замена иконки для', iconId, ':', iconReplacement)
  }
  if (iconId && buttonColorReplacement) {
    logger.log('[IconButton] Получен цвет для', iconId, ':', buttonColorReplacement)
  }

  // Определяем какую иконку использовать: замену или оригинал
  const DisplayIcon = useMemo(() => {
    if (iconId && iconReplacement) {
      logger.log('[IconButton] Применение замены иконки:', iconId, '->', iconReplacement)
      const ReplacementIconComponent = getIcon(iconReplacement)
      if (ReplacementIconComponent) {
        return ReplacementIconComponent
      } else {
        logger.warn('[IconButton] Не удалось загрузить замену иконки:', iconReplacement)
      }
    }
    return DefaultIcon
  }, [iconId, iconReplacement, DefaultIcon])

  // Определяем, является ли иконка Iconify
  const isIconify = iconReplacement && iconReplacement.startsWith('iconify:')

  // Определяем стиль для цвета кнопки (если есть замена)
  const buttonStyle = useMemo(() => {
    if (buttonColorReplacement && iconId) {
      let backgroundColor = null

      // Если цвет в формате hex (#3B82F6) или rgb/rgba - используем напрямую
      if (buttonColorReplacement.startsWith('#') || buttonColorReplacement.startsWith('rgb')) {
        backgroundColor = buttonColorReplacement
      }
      // Если это Tailwind класс - конвертируем в hex
      else {
        backgroundColor = tailwindToHex(buttonColorReplacement)
        if (backgroundColor) {
          logger.log(
            '[IconButton] Конвертирован Tailwind класс',
            buttonColorReplacement,
            'в hex',
            backgroundColor,
            'для',
            iconId
          )
        } else {
          logger.warn(
            '[IconButton] Не удалось конвертировать Tailwind класс',
            buttonColorReplacement,
            'для',
            iconId
          )
        }
      }

      // Если удалось получить цвет - применяем через style
      // Важно: backgroundColor должен быть последним, чтобы переопределить props.style
      if (backgroundColor) {
        return {
          ...props.style, // Сначала применяем существующие стили
          backgroundColor, // Затем переопределяем цвет фона
          color: '#ffffff', // Белый текст для контраста
        }
      }
    }
    return props.style || null
  }, [buttonColorReplacement, iconId, props.style])

  // Определяем класс для цвета (если это Tailwind класс)
  // Теперь не используем, так как все цвета применяются через style
  // Оставляем пустым, чтобы не конфликтовать с style
  const colorClassName = useMemo(() => {
    // Все цвета теперь применяются через style (включая Tailwind классы, конвертированные в hex)
    return ''
  }, [])

  // Очищаем className от классов bg-*, если есть замена цвета
  // Важно: удаляем классы ТОЛЬКО если есть явная замена цвета (не дефолтная)
  const cleanedClassName = useMemo(() => {
    if (!buttonColorReplacement || !iconId) {
      // Нет замены цвета - используем className как есть
      return props.className || ''
    }
    // Удаляем все классы bg-* (включая dark:bg-* и hover:bg-*) из className, чтобы цвет из store имел приоритет
    const className = props.className || ''
    return className
      .replace(/\bbg-\S+/g, '') // Удаляем bg-*
      .replace(/\bdark:bg-\S+/g, '') // Удаляем dark:bg-*
      .replace(/\bhover:bg-\S+/g, '') // Удаляем hover:bg-*
      .replace(/\bdark:hover:bg-\S+/g, '') // Удаляем dark:hover:bg-*
      .replace(/\s+/g, ' ') // Убираем лишние пробелы
      .trim()
  }, [buttonColorReplacement, iconId, props.className])

  // Формируем финальный className
  const finalClassName = useMemo(() => {
    const result = `${cleanedClassName} ${colorClassName}`.trim()
    logger.log('[IconButton] Финальный className для', iconId, ':', result)
    logger.log('[IconButton] cleanedClassName:', cleanedClassName)
    logger.log('[IconButton] colorClassName:', colorClassName)
    logger.log('[IconButton] buttonStyle:', buttonStyle)
    return result
  }, [cleanedClassName, colorClassName, iconId, buttonStyle])

  // Исключаем style и className из props, чтобы они не переопределяли наши значения
  const { style: propsStyle, className: propsClassName, ...restProps } = props

  return (
    <button {...restProps} data-icon-id={iconId} className={finalClassName} style={buttonStyle}>
      {isIconify ? (
        <Icon icon={iconReplacement.replace('iconify:', '')} className="w-5 h-5 flex-shrink-0" />
      ) : (
        <DisplayIcon className="w-5 h-5 flex-shrink-0" />
      )}
      {children}
    </button>
  )
}
