import type { Transition, Variants } from 'framer-motion';

// Shared easing/duration for the "modern SaaS" feel — fast, snappy, no bounce.
export const easeOut: Transition = { duration: 0.18, ease: [0.4, 0, 0.2, 1] };

// Same decelerate curve used across the marketing site's Reveal/hero animations
// ([0.16, 1, 0.3, 1], a smooth "ease-out-expo") — reused here so page-level
// motion in the portal reads as the same product as the marketing pages, just
// tuned faster (app chrome needs to feel responsive, not cinematic).
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

export const navPillTransition: Transition = { type: 'spring', stiffness: 500, damping: 40 };

// Horizontal slide for wizard/stepper content — direction is 1 for forward, -1 for back.
export const stepTransition = (direction: 1 | -1): Variants => ({
  initial: { opacity: 0, x: direction * 24 },
  animate: { opacity: 1, x: 0, transition: easeOutExpo },
  exit: { opacity: 0, x: direction * -24, transition: { ...easeOut, duration: 0.12 } },
});

// Staggered card-grid entrance — the app-scale version of the marketing site's
// Reveal + staggerChildren pattern (FeaturesSection), tuned quicker since this
// fires on every dashboard page load, not just once on scroll-into-view.
export const cardGridContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.02 } },
};

export const cardGridItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: easeOutExpo },
};
