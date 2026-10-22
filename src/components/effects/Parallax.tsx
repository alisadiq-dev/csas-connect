"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef, type ReactNode } from "react";

/**
 * Scroll-linked depth shift: the layer drifts up to `distance` px against the scroll as it crosses the
 * viewport, so backgrounds, cards and foreground move at different speeds. Works with Lenis (which
 * drives the real window scroll). Disabled for reduced motion. GPU-composited (translate3d only).
 */
export function Parallax({
  children,
  distance = 60,
  className = "",
}: {
  children?: ReactNode;
  /** Pixels of travel in each direction; negative values move with the scroll instead. */
  distance?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [distance, -distance]);

  return (
    <motion.div ref={ref} className={`will-change-transform ${className}`} style={reduce ? undefined : { y }}>
      {children}
    </motion.div>
  );
}
