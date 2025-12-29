/**
 * 🎭 Stagger Animation Components
 *
 * Компоненты для анимации списков с последовательным появлением элементов.
 * Best practice: элементы появляются один за другим с небольшой задержкой.
 */

import { Children, cloneElement, isValidElement, ReactNode } from 'react'

interface StaggeredListProps {
  /** Дочерние элементы списка */
  children: ReactNode
  /** Задержка между элементами в мс */
  staggerDelay?: number
  /** Начальная задержка в мс */
  initialDelay?: number
  /** Длительность анимации в мс */
  duration?: number
  /** Дополнительные классы для контейнера */
  className?: string
}

/**
 * StaggeredList — список с последовательным появлением элементов
 *
 * @example
 * <StaggeredList staggerDelay={50}>
 *   <div>Item 1</div>
 *   <div>Item 2</div>
 *   <div>Item 3</div>
 * </StaggeredList>
 */
export function StaggeredList({
  children,
  staggerDelay = 50,
  initialDelay = 0,
  duration = 300,
  className = '',
}: StaggeredListProps) {
  const childArray = Children.toArray(children)

  return (
    <div className={className}>
      {childArray.map((child, index) => {
        if (!isValidElement(child)) return child

        const delay = initialDelay + index * staggerDelay
        const childProps = child.props as { style?: React.CSSProperties }

        return cloneElement(child as React.ReactElement<{ style?: React.CSSProperties }>, {
          style: {
            ...childProps.style,
            animation: `fadeIn ${duration}ms ease-out ${delay}ms both`,
            opacity: 0,
          },
          key: child.key ?? index,
        })
      })}
    </div>
  )
}

interface StaggeredItemProps {
  /** Дочерний элемент */
  children: ReactNode
  /** Индекс элемента для расчета задержки */
  index: number
  /** Задержка между элементами в мс */
  staggerDelay?: number
  /** Начальная задержка в мс */
  initialDelay?: number
  /** Дополнительные классы */
  className?: string
}

/**
 * StaggeredItem — отдельный элемент с анимацией появления
 * Используется для ручного контроля над анимацией
 *
 * @example
 * {items.map((item, index) => (
 *   <StaggeredItem key={item.id} index={index}>
 *     <ItemCard item={item} />
 *   </StaggeredItem>
 * ))}
 */
export function StaggeredItem({
  children,
  index,
  staggerDelay = 50,
  initialDelay = 0,
  className = '',
}: StaggeredItemProps) {
  const delay = initialDelay + index * staggerDelay

  return (
    <div
      className={`staggered-fade-in ${className}`}
      style={{
        animationDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

/**
 * useStaggerAnimation — хук для расчета стилей анимации
 *
 * @example
 * const { getItemStyle } = useStaggerAnimation()
 *
 * {items.map((item, index) => (
 *   <div style={getItemStyle(index)}>{item.name}</div>
 * ))}
 */
export function useStaggerAnimation(staggerDelay = 50, initialDelay = 0, duration = 300) {
  const getItemStyle = (index: number) => ({
    animation: `fadeIn ${duration}ms ease-out both`,
    animationDelay: `${initialDelay + index * staggerDelay}ms`,
    opacity: 0,
  })

  const getItemClassName = () => 'staggered-fade-in'

  return { getItemStyle, getItemClassName }
}
