/**
 * 🎨 Утилиты для анимаций
 *
 * Централизованная система анимаций для унификации всех переходов в проекте.
 * Следует принципам Material Design и best practices для производительности.
 *
 * @fileoverview Утилиты для работы с анимациями
 */

/**
 * Стандартные длительности анимаций (в миллисекундах)
 */
export const ANIMATION_DURATIONS = {
  /** Быстрые реакции (active состояния, клики) */
  FAST: 150,
  /** Стандартные переходы (hover, появление элементов) */
  NORMAL: 300,
  /** Крупные изменения (модальные окна, крупные переходы) */
  SLOW: 500,
}

/**
 * Стандартные easing функции
 */
export const ANIMATION_EASING = {
  /** Для появления элементов (мягкое начало, быстрое окончание) */
  EASE_OUT: 'ease-out',
  /** Для плавных переходов (hover, состояния) */
  EASE_IN_OUT: 'ease-in-out',
  /** Material Design стандарт (cubic-bezier(0.4, 0, 0.2, 1)) */
  STANDARD: 'cubic-bezier(0.4, 0, 0.2, 1)',
}

/**
 * Стандартные значения transform
 */
export const TRANSFORM_VALUES = {
  /** Легкий подъем */
  LIFT_LIGHT: -2,
  /** Средний подъем */
  LIFT_MEDIUM: -4,
  /** Крупный подъем */
  LIFT_LARGE: -8,
  /** Легкое увеличение */
  SCALE_LIGHT: 1.02,
  /** Среднее увеличение */
  SCALE_MEDIUM: 1.05,
  /** Выразительное увеличение */
  SCALE_EXPRESSIVE: 1.1,
  /** Уменьшение при active */
  SCALE_ACTIVE: 0.95,
  /** Поворот chevron */
  ROTATE_CHEVRON: 180,
  /** Поворот иконки при hover */
  ROTATE_ICON_HOVER: 12,
}

/**
 * Генерирует CSS transition строку
 *
 * @param {string[]} properties - Свойства для анимации (например, ['transform', 'opacity'])
 * @param {number} duration - Длительность в миллисекундах
 * @param {string} easing - Easing функция
 * @returns {string} CSS transition строка
 *
 * @example
 * getTransition(['transform', 'opacity'], ANIMATION_DURATIONS.NORMAL, ANIMATION_EASING.STANDARD)
 * // returns: "transform 300ms cubic-bezier(0.4, 0, 0.2, 1), opacity 300ms cubic-bezier(0.4, 0, 0.2, 1)"
 */
export function getTransition(
  properties = ['all'],
  duration = ANIMATION_DURATIONS.NORMAL,
  easing = ANIMATION_EASING.STANDARD
) {
  return properties.map(prop => `${prop} ${duration}ms ${easing}`).join(', ')
}

/**
 * Генерирует CSS класс для transition
 *
 * @param {'fast'|'normal'|'slow'} speed - Скорость анимации
 * @returns {string} CSS класс для Tailwind или inline стиль
 *
 * @example
 * getTransitionClass('normal') // returns: "transition-normal"
 */
export function getTransitionClass(speed = 'normal') {
  const durations = {
    fast: ANIMATION_DURATIONS.FAST,
    normal: ANIMATION_DURATIONS.NORMAL,
    slow: ANIMATION_DURATIONS.SLOW,
  }

  const duration = durations[speed] || durations.normal
  return `transition-all duration-[${duration}ms]`
}

/**
 * Генерирует inline стиль для transition
 *
 * @param {string[]} properties - Свойства для анимации
 * @param {'fast'|'normal'|'slow'} speed - Скорость анимации
 * @param {string} easing - Easing функция (опционально)
 * @returns {object} React style объект
 *
 * @example
 * getTransitionStyle(['transform', 'opacity'], 'normal')
 * // returns: { transition: "transform 300ms cubic-bezier(0.4, 0, 0.2, 1), opacity 300ms cubic-bezier(0.4, 0, 0.2, 1)" }
 */
export function getTransitionStyle(
  properties = ['transform', 'opacity'],
  speed = 'normal',
  easing = null
) {
  const durations = {
    fast: ANIMATION_DURATIONS.FAST,
    normal: ANIMATION_DURATIONS.NORMAL,
    slow: ANIMATION_DURATIONS.SLOW,
  }

  const duration = durations[speed] || durations.normal
  const easingFunc = easing || ANIMATION_EASING.STANDARD

  return {
    transition: getTransition(properties, duration, easingFunc),
  }
}

/**
 * Генерирует CSS класс для hover эффекта "lift" (подъем)
 *
 * @param {'light'|'medium'|'large'} intensity - Интенсивность подъема
 * @returns {string} Tailwind классы
 *
 * @example
 * getHoverLiftClass('medium') // returns: "hover:-translate-y-1 hover:shadow-xl"
 */
export function getHoverLiftClass(intensity = 'light') {
  const lifts = {
    light: '-translate-y-0.5', // -2px
    medium: '-translate-y-1', // -4px
    large: '-translate-y-2', // -8px
  }

  const shadow = intensity === 'large' ? 'hover:shadow-2xl' : 'hover:shadow-xl'
  const lift = lifts[intensity] || lifts.light

  return `hover:${lift} ${shadow}`
}

/**
 * Генерирует CSS класс для hover эффекта "scale"
 *
 * @param {'light'|'medium'|'expressive'} intensity - Интенсивность масштабирования
 * @returns {string} Tailwind классы
 *
 * @example
 * getHoverScaleClass('medium') // returns: "hover:scale-105"
 */
export function getHoverScaleClass(intensity = 'medium') {
  const scales = {
    light: 'scale-[1.02]',
    medium: 'scale-105', // 1.05
    expressive: 'scale-110', // 1.1
  }

  const scale = scales[intensity] || scales.medium
  return `hover:${scale}`
}

/**
 * Генерирует CSS класс для active эффекта "shrink"
 *
 * @returns {string} Tailwind классы
 *
 * @example
 * getActiveShrinkClass() // returns: "active:scale-95"
 */
export function getActiveShrinkClass() {
  return 'active:scale-95'
}

/**
 * Генерирует CSS класс для комбинированного hover эффекта (lift + scale)
 *
 * @param {'light'|'medium'|'large'} liftIntensity - Интенсивность подъема
 * @param {'light'|'medium'|'expressive'} scaleIntensity - Интенсивность масштабирования
 * @returns {string} Tailwind классы
 *
 * @example
 * getHoverCombinedClass('medium', 'medium')
 * // returns: "hover:-translate-y-1 hover:shadow-xl hover:scale-105"
 */
export function getHoverCombinedClass(liftIntensity = 'light', scaleIntensity = 'medium') {
  const lift = getHoverLiftClass(liftIntensity)
  const scale = getHoverScaleClass(scaleIntensity)
  return `${lift} ${scale}`
}

/**
 * Генерирует CSS классы для кнопки с унифицированными анимациями
 *
 * @param {object} options - Опции анимации
 * @param {'light'|'medium'|'expressive'} options.scaleIntensity - Интенсивность scale при hover
 * @param {boolean} options.includeLift - Включать ли translateY при hover
 * @returns {string} Tailwind классы
 *
 * @example
 * getButtonAnimationClasses({ scaleIntensity: 'medium', includeLift: true })
 * // returns: "transition-normal hover:scale-105 hover:-translate-y-0.5 hover:shadow-xl active:scale-95"
 */
export function getButtonAnimationClasses({ scaleIntensity = 'medium', includeLift = true } = {}) {
  const transition = getTransitionClass('normal')
  const hoverScale = getHoverScaleClass(scaleIntensity)
  const activeShrink = getActiveShrinkClass()

  if (includeLift) {
    const hoverLift = getHoverLiftClass('light')
    return `${transition} ${hoverLift} ${hoverScale} ${activeShrink}`
  }

  return `${transition} ${hoverScale} ${activeShrink}`
}

/**
 * Генерирует CSS классы для карточки с унифицированными анимациями
 *
 * @param {object} options - Опции анимации
 * @param {'light'|'medium'|'large'} options.liftIntensity - Интенсивность подъема
 * @param {boolean} options.includeScale - Включать ли scale при hover
 * @returns {string} Tailwind классы
 *
 * @example
 * getCardAnimationClasses({ liftIntensity: 'medium', includeScale: false })
 * // returns: "transition-normal hover:-translate-y-1 hover:shadow-xl"
 */
export function getCardAnimationClasses({ liftIntensity = 'medium', includeScale = false } = {}) {
  const transition = getTransitionClass('normal')
  const hoverLift = getHoverLiftClass(liftIntensity)

  if (includeScale) {
    const hoverScale = getHoverScaleClass('light')
    return `${transition} ${hoverLift} ${hoverScale}`
  }

  return `${transition} ${hoverLift}`
}

/**
 * Генерирует CSS классы для анимации появления элемента
 *
 * @param {'fade'|'slide-up'|'slide-down'|'slide-in-right'} type - Тип анимации
 * @param {'fast'|'normal'|'slow'} speed - Скорость анимации
 * @returns {string} Tailwind классы
 *
 * @example
 * getAppearAnimationClass('slide-up', 'normal')
 * // returns: "animate-slide-up"
 */
export function getAppearAnimationClass(type = 'fade', speed = 'normal') {
  const classes = {
    fade: 'animate-fade-in',
    'slide-up': 'animate-slide-up',
    'slide-down': 'animate-slide-down',
    'slide-in-right': 'animate-slide-in-right',
  }

  const baseClass = classes[type] || classes.fade

  // Добавляем speed модификатор если нужен (fast/slow)
  if (speed !== 'normal') {
    return `${baseClass}-${speed}`
  }

  return baseClass
}

/**
 * Генерирует CSS классы для анимации исчезновения элемента
 *
 * @param {'fade'|'slide-out-right'} type - Тип анимации
 * @param {'fast'|'normal'} speed - Скорость анимации
 * @returns {string} Tailwind классы
 *
 * @example
 * getDisappearAnimationClass('fade', 'fast')
 * // returns: "animate-fade-out-fast"
 */
export function getDisappearAnimationClass(type = 'fade', speed = 'normal') {
  const classes = {
    fade: 'animate-fade-out',
    'slide-out-right': 'animate-slide-out-right',
  }

  const baseClass = classes[type] || classes.fade

  if (speed !== 'normal') {
    return `${baseClass}-${speed}`
  }

  return baseClass
}

/**
 * Генерирует CSS класс для анимации rotate иконки
 *
 * @param {number} degrees - Градусы поворота (обычно 180 для chevron)
 * @returns {string} Tailwind классы
 *
 * @example
 * getIconRotateClass(180) // returns: "rotate-180"
 */
export function getIconRotateClass(degrees = 180) {
  // Для стандартных значений используем Tailwind классы
  if (degrees === 180) return 'rotate-180'
  if (degrees === 90) return 'rotate-90'
  if (degrees === -90) return '-rotate-90'

  // Для нестандартных значений используем arbitrary value
  return `rotate-[${degrees}deg]`
}

/**
 * Генерирует inline стиль для staggered анимации (задержка для элементов списка)
 *
 * @param {number} index - Индекс элемента в списке
 * @param {number} delayMs - Задержка между элементами в миллисекундах
 * @returns {object} React style объект с animationDelay
 *
 * @example
 * getStaggeredDelayStyle(0, 50) // returns: { animationDelay: "0ms" }
 * getStaggeredDelayStyle(2, 50) // returns: { animationDelay: "100ms" }
 */
export function getStaggeredDelayStyle(index, delayMs = 50) {
  return {
    animationDelay: `${index * delayMs}ms`,
  }
}

/**
 * Все константы и функции уже экспортируются как named exports выше.
 * Default export удален в пользу named exports для лучшей tree-shaking поддержки.
 *
 * Для импорта используйте:
 * import { ANIMATION_DURATIONS, getTransition } from './utils/animations'
 *
 * Или для импорта всех:
 * import * as animations from './utils/animations'
 */
