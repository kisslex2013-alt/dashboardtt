"use client";

import React, { ComponentPropsWithoutRef, useMemo } from "react";
import { AnimatePresence, motion, MotionProps } from "framer-motion";

/**
 * AnimatedList - компонент для последовательной анимации списка элементов.
 * Вдохновлён Magic UI AnimatedList.
 *
 * @example
 * <AnimatedList delay={200}>
 *   {items.map((item) => <NotificationItem key={item.id} {...item} />)}
 * </AnimatedList>
 */
export interface AnimatedListProps extends ComponentPropsWithoutRef<"ul"> {
  /** Элементы списка */
  children: React.ReactNode;
  /** Задержка между появлением элементов в мс */
  delay?: number;
}

export function AnimatedList({
  children,
  className,
  delay = 100,
  ...props
}: AnimatedListProps) {
  const childrenArray = React.Children.toArray(children);

  return (
    <ul className={className} {...props}>
      <AnimatePresence mode="popLayout">
        {childrenArray.map((child, index) => (
          <AnimatedListItem key={index} delay={index * delay}>
            {child}
          </AnimatedListItem>
        ))}
      </AnimatePresence>
    </ul>
  );
}

interface AnimatedListItemProps extends MotionProps {
  children: React.ReactNode;
  delay?: number;
}

function AnimatedListItem({ children, delay = 0 }: AnimatedListItemProps) {
  const animationsVariants = useMemo(
    () => ({
      initial: { opacity: 0, y: 20, scale: 0.95 },
      animate: { opacity: 1, y: 0, scale: 1 },
      exit: { opacity: 0, y: -20, scale: 0.95 },
    }),
    []
  );

  return (
    <motion.li
      variants={animationsVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 24,
        delay: delay / 1000,
      }}
      layout
      className="relative"
    >
      {children}
    </motion.li>
  );
}

export default AnimatedList;
