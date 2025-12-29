/**
 * 🌊 Ripple Effect Component
 *
 * Material Design ripple эффект для кнопок и интерактивных элементов.
 * Best practice: визуальная обратная связь при клике.
 */

import React, { useState, useCallback, useRef, MouseEvent, TouchEvent, CSSProperties } from 'react'

interface RippleItem {
  id: number
  x: number
  y: number
  size: number
}

interface UseRippleOptions {
  /** Цвет ripple */
  color?: string
  /** Длительность анимации в мс */
  duration?: number
  /** Отключить ripple */
  disabled?: boolean
}

interface UseRippleResult {
  /** Рендер функция для ripple элементов */
  ripples: React.ReactNode
  /** Обработчик события для создания ripple */
  onRipple: (e: MouseEvent | TouchEvent) => void
  /** Контейнерные стили */
  containerStyle: CSSProperties
}

/**
 * useRipple — хук для добавления ripple эффекта
 *
 * @example
 * const { ripples, onRipple, containerStyle } = useRipple()
 *
 * <button onClick={onRipple} style={containerStyle}>
 *   Click me
 *   {ripples}
 * </button>
 */
export function useRipple({
  color = 'rgba(255, 255, 255, 0.4)',
  duration = 600,
  disabled = false,
}: UseRippleOptions = {}): UseRippleResult {
  const [ripples, setRipples] = useState<RippleItem[]>([])
  const nextId = useRef(0)

  const onRipple = useCallback((e: MouseEvent | TouchEvent) => {
    if (disabled) return

    const target = e.currentTarget as HTMLElement
    const rect = target.getBoundingClientRect()

    let clientX: number
    let clientY: number

    if ('touches' in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    const x = clientX - rect.left
    const y = clientY - rect.top

    // Размер ripple = диагональ элемента * 2
    const size = Math.max(rect.width, rect.height) * 2

    const id = nextId.current++

    setRipples(prev => [...prev, { id, x, y, size }])

    // Удаляем ripple после анимации
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== id))
    }, duration)
  }, [disabled, duration])

  const containerStyle: CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
  }

  const ripplesElement = (
    <>
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          style={{
            position: 'absolute',
            left: ripple.x - ripple.size / 2,
            top: ripple.y - ripple.size / 2,
            width: ripple.size,
            height: ripple.size,
            borderRadius: '50%',
            backgroundColor: color,
            transform: 'scale(0)',
            animation: `ripple-expand ${duration}ms ease-out forwards`,
            pointerEvents: 'none',
          }}
        />
      ))}
    </>
  )

  return {
    ripples: ripplesElement,
    onRipple,
    containerStyle,
  }
}

/**
 * RippleButton — кнопка с встроенным ripple эффектом
 */
interface RippleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Цвет ripple */
  rippleColor?: string
  /** Отключить ripple */
  disableRipple?: boolean
  /** Дочерние элементы */
  children: React.ReactNode
}

export function RippleButton({
  rippleColor = 'rgba(255, 255, 255, 0.4)',
  disableRipple = false,
  children,
  className = '',
  onClick,
  style,
  ...props
}: RippleButtonProps) {
  const { ripples, onRipple, containerStyle } = useRipple({
    color: rippleColor,
    disabled: disableRipple,
  })

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    onRipple(e)
    onClick?.(e)
  }

  return (
    <button
      className={className}
      onClick={handleClick}
      style={{ ...containerStyle, ...style }}
      {...props}
    >
      {children}
      {ripples}
    </button>
  )
}

/**
 * Ripple — обертка для добавления ripple к любому элементу
 */
interface RippleProps {
  /** Дочерний элемент */
  children: React.ReactElement
  /** Цвет ripple */
  color?: string
  /** Отключить ripple */
  disabled?: boolean
}

export function Ripple({ children, color, disabled }: RippleProps) {
  const { ripples, onRipple, containerStyle } = useRipple({ color, disabled })

  const child = children as React.ReactElement<{
    onClick?: (e: MouseEvent) => void
    style?: CSSProperties
  }>

  const handleClick = (e: MouseEvent) => {
    onRipple(e)
    child.props.onClick?.(e)
  }

  return (
    <>
      {React.cloneElement(child, {
        onClick: handleClick,
        style: { ...containerStyle, ...child.props.style },
      })}
      {ripples}
    </>
  )
}
