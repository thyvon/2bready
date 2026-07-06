import type { Transition, Variants } from 'framer-motion';

// Same "modern SaaS" easing used on the marketing site — fast, snappy, no
// bounce — so app-level motion reads as the same product, just tuned quicker
// (app chrome needs to feel responsive, not cinematic).
export const easeOut: Transition = { duration: 0.18, ease: [0.4, 0, 0.2, 1] };
export const easeOutExpo: Transition = { duration: 0.32, ease: [0.16, 1, 0.3, 1] };

// Pure fade, no vertical slide — a y-offset combined with a slower duration
// reads as a "shake" rather than smooth. Enter and exit share the same
// easing curve (only duration differs) so appearing/disappearing feel like
// one consistent motion, not two mismatched animations.
const pageEase = [0.22, 1, 0.36, 1] as const;

export const pageTransition: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.55, ease: pageEase } },
  exit: { opacity: 0, transition: { duration: 0.35, ease: pageEase } },
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
