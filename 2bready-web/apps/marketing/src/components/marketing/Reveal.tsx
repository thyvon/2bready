'use client';

import { motion, type Variants } from 'framer-motion';

export type RevealDirection = 'up' | 'down' | 'left' | 'right' | 'none';

interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  x?: number;
  direction?: RevealDirection;
  blur?: boolean;
  scale?: boolean;
  className?: string;
  once?: boolean;
  amount?: number;
}

const SPRING_EASE = [0.22, 1, 0.36, 1] as const;

function offset(direction: RevealDirection, fallbackY: number, fallbackX: number): { y: number; x: number } {
  switch (direction) {
    case 'up': return { y: fallbackY, x: 0 };
    case 'down': return { y: -fallbackY, x: 0 };
    case 'left': return { y: 0, x: fallbackX };
    case 'right': return { y: 0, x: -fallbackX };
    default: return { y: fallbackY, x: fallbackX };
  }
}

export default function Reveal({
  children,
  delay = 0,
  y = 24,
  x = 0,
  direction = 'up',
  blur = true,
  scale = false,
  className,
  once = true,
  amount = 0.2,
}: RevealProps) {
  const { y: fromY, x: fromX } = offset(direction, y, x);
  const initial: Variants = {
    hidden: {
      opacity: 0,
      y: fromY,
      x: fromX,
      filter: blur ? 'blur(6px)' : 'blur(0px)',
      ...(scale ? { scale: 0.96 } : {}),
    },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      filter: 'blur(0px)',
      ...(scale ? { scale: 1 } : {}),
      transition: {
        duration: 0.7,
        delay,
        ease: SPRING_EASE,
      },
    },
  };

  return (
    <motion.div
      variants={initial}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
      className={className}
      style={{ willChange: 'transform, opacity, filter' }}
    >
      {children}
    </motion.div>
  );
}
