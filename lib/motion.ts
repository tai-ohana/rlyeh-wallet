import type { Transition, Variants } from 'framer-motion'

/**
 * Motion design tokens for R'lyeh Wallet.
 * Keep animations subtle, fast, and consistent across the app.
 */

// Springs — use for UI that should feel tactile (layout shifts, active indicators, modals)
export const springSoft: Transition = {
  type: 'spring',
  stiffness: 420,
  damping: 36,
  mass: 0.9,
}

export const springSnappy: Transition = {
  type: 'spring',
  stiffness: 600,
  damping: 32,
  mass: 0.6,
}

export const springBouncy: Transition = {
  type: 'spring',
  stiffness: 520,
  damping: 22,
  mass: 0.7,
}

// Tween presets — use for fades and simple translations
export const easeOut: Transition = {
  duration: 0.28,
  ease: [0.22, 1, 0.36, 1], // easeOutQuint-ish
}

export const easeInOut: Transition = {
  duration: 0.35,
  ease: [0.65, 0, 0.35, 1],
}

// ── Common variants ─────────────────────────────────

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: easeOut },
}

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: easeOut },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: springSoft },
}

// Stagger container — wrap a list and let its children animate in sequence.
export const staggerContainer = (stagger = 0.04, delay = 0): Variants => ({
  hidden: {},
  visible: {
    transition: {
      staggerChildren: stagger,
      delayChildren: delay,
    },
  },
})

// Page transition — used by (dashboard)/template.tsx
export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
}
