import type { Transition, Variants } from 'framer-motion';

// Shared easing/duration for the "modern SaaS" feel — fast, snappy, no bounce.
export const easeOut: Transition = { duration: 0.18, ease: [0.4, 0, 0.2, 1] };

export const pageTransition: Variants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: easeOut },
  exit: { opacity: 0, y: -6, transition: { ...easeOut, duration: 0.12 } },
};

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: easeOut },
  exit: { opacity: 0, transition: { ...easeOut, duration: 0.12 } },
};

export const navPillTransition: Transition = { type: 'spring', stiffness: 500, damping: 40 };

// Horizontal slide for wizard/stepper content — direction is 1 for forward, -1 for back.
export const stepTransition = (direction: 1 | -1): Variants => ({
  initial: { opacity: 0, x: direction * 24 },
  animate: { opacity: 1, x: 0, transition: easeOut },
  exit: { opacity: 0, x: direction * -24, transition: { ...easeOut, duration: 0.12 } },
});
