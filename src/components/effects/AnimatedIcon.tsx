"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import type { LucideIcon } from "lucide-react";

// Spring-physics micro-interactions for Lucide icons (the idea behind Animate UI's animated icons,
// built on lucide-react + motion). Triggered by `active` (parent hover/focus), pointer hover, or tap.
const VARIANTS = {
  wiggle: { rotate: [0, -14, 12, -8, 0], transition: { duration: 0.7, ease: "easeInOut" } },
  pop: { scale: [1, 1.28, 0.94, 1.08, 1], transition: { duration: 0.6, ease: "easeOut" } },
  spin: { rotate: 360, transition: { type: "spring", stiffness: 120, damping: 14 } },
  rise: { y: [0, -5, 0], transition: { duration: 0.55, ease: "easeOut" } },
} satisfies Record<string, Variants[string]>;

export type IconMotion = keyof typeof VARIANTS;

export function AnimatedIcon({
  icon: Icon,
  motionType = "wiggle",
  active = false,
  className = "h-5 w-5",
  strokeWidth = 1.8,
}: {
  icon: LucideIcon;
  motionType?: IconMotion;
  /** When true (e.g. the parent card is hovered or focused) the animation plays. */
  active?: boolean;
  className?: string;
  strokeWidth?: number;
}) {
  const reduce = useReducedMotion();
  const v = VARIANTS[motionType];
  return (
    <motion.span
      aria-hidden
      className="inline-flex"
      initial={false}
      animate={active && !reduce ? v : { rotate: 0, scale: 1, y: 0 }}
      whileHover={reduce ? undefined : v}
      whileTap={reduce ? undefined : { scale: 0.88 }}
    >
      <Icon className={className} strokeWidth={strokeWidth} />
    </motion.span>
  );
}
