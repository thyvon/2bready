import type { Transition, Variants } from 'framer-motion';

// Same "modern SaaS" easing used on the marketing site — fast, snappy, no
// bounce — so app-level motion reads as the same product, just tuned quicker
// (app chrome needs to feel responsive, not cinematic).
export const easeOut: Transition = { duration: 0.18, ease: [0.4, 0, 0.2, 1] };
export const easeOutExpo: Transition = { duration: 0.32, ease: [0.16, 1, 0.3, 1] };

export const pageTransition: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: easeOutExpo },
  exit: { opacity: 0, y: -8, transition: { ...easeOut, duration: 0.12 } },
};

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: easeOutExpo },
  exit: { opacity: 0, transition: { ...easeOut, duration: 0.12 } },
};

export const cardGridContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.02 } },
};

export const cardGridItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: easeOutExpo },
};
