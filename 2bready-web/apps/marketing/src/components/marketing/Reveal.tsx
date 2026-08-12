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
  blur = false,
  scale = false,
  className,
  once = true,
  amount = 0.2,
}: RevealProps) {
  const { y: fromY, x: fromX } = offset(direction, y, x);

  // Only touch `filter` when the blur prop is on. Even a no-op `blur(0px)`
  // forces a filter compositing layer that keeps text rasterized on a GPU
  // layer, which reads as soft/blurry glyphs on some browsers.
  const hidden: Variants = {
    hidden: {
      opacity: 0,
      y: fromY,
      x: fromX,
      ...(blur ? { filter: 'blur(6px)' } : {}),
      ...(scale ? { scale: 0.97 } : {}),
    },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      ...(blur ? { filter: 'blur(0px)' } : {}),
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
      variants={hidden}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
      className={className}
      style={{ willChange: 'transform, opacity' }}
    >
      {children}
    </motion.div>
  );
}
