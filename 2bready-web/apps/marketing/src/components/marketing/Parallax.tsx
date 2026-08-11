'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

interface ParallaxProps {
  children: React.ReactNode;
  /** How fast the element moves relative to scroll (positive = slower, drifts with page). */
  speed?: number;
  className?: string;
}

export default function Parallax({ children, speed = 0.85, className }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const translateY = useTransform(scrollYProgress, [0, 1], [0, -140 * (1 - speed)]);

  return (
    <motion.div ref={ref} style={{ y: translateY }} className={className}>
      {children}
    </motion.div>
  );
}
