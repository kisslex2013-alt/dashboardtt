"use client";

import React, { ComponentPropsWithoutRef, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";

/**
 * 🎭 StaggeredList (AnimatedList)
 *
 * Компонент для анимации списков с последовательным появлением элементов.
 * Использует Framer Motion для плавных spring-анимаций.
 *
 * @example
 * <StaggeredList staggerDelay={100}>
 *   {items.map((item) => <ItemCard key={item.id} {...item} />)}
 * </StaggeredList>
 */
export interface StaggeredListProps extends ComponentPropsWithoutRef<"ul"> {
  /** Элементы списка */
  children: React.ReactNode;
  /** Задержка между появлением элементов в мс (default: 50) */
  staggerDelay?: number;
  /** Начальная задержка перед первым элементом в мс (default: 0) */
  initialDelay?: number;
  /** Длительность анимации в мс (устаревший, используется spring) */
  duration?: number;
}

export function StaggeredList({
  children,
  className,
  staggerDelay = 50,
  initialDelay = 0,
  ...props
}: StaggeredListProps) {
  const childrenArray = React.Children.toArray(children);

  return (
    <ul className={className} {...props}>
      <AnimatePresence mode="popLayout">
        {childrenArray.map((child, index) => (
          <StaggeredItem
            key={(child as React.ReactElement)?.key ?? index}
            index={index}
            staggerDelay={staggerDelay}
            initialDelay={initialDelay}
          >
            {child}
          </StaggeredItem>
        ))}
      </AnimatePresence>
    </ul>
  );
}

/**
 * Алиас для обратной совместимости
 */
export const AnimatedList = StaggeredList;

// ============================================
// StaggeredItem
// ============================================

interface StaggeredItemProps {
  children: React.ReactNode;
  index: number;
  staggerDelay?: number;
  initialDelay?: number;
  className?: string;
}

/**
 * StaggeredItem — отдельный элемент с анимацией появления.
 * Можно использовать самостоятельно для ручного контроля.
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
  className = "",
}: StaggeredItemProps) {
  const animationVariants = useMemo(
    () => ({
      initial: { opacity: 0, y: 20, scale: 0.95 },
      animate: { opacity: 1, y: 0, scale: 1 },
      exit: { opacity: 0, y: -20, scale: 0.95 },
    }),
    []
  );

  const delay = (initialDelay + index * staggerDelay) / 1000;

  return (
    <motion.li
      variants={animationVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 24,
        delay,
      }}
      layout
      className={`relative list-none ${className}`}
    >
      {children}
    </motion.li>
  );
}

// ============================================
// useStaggerAnimation Hook
// ============================================

/**
 * useStaggerAnimation — хук для расчета стилей анимации (CSS fallback).
 * Используется когда Framer Motion недоступен или для простых случаев.
 *
 * @example
 * const { getItemStyle } = useStaggerAnimation()
 *
 * {items.map((item, index) => (
 *   <div style={getItemStyle(index)}>{item.name}</div>
 * ))}
 */
export function useStaggerAnimation(
  staggerDelay = 50,
  initialDelay = 0,
  duration = 300
) {
  const getItemStyle = (index: number): React.CSSProperties => ({
    animation: `fadeIn ${duration}ms ease-out both`,
    animationDelay: `${initialDelay + index * staggerDelay}ms`,
    opacity: 0,
  });

  const getItemClassName = () => "staggered-fade-in";

  return { getItemStyle, getItemClassName };
}

export default StaggeredList;
