"use client";

import { ReactLenis } from "lenis/react";
import "lenis/dist/lenis.css";
import type { ReactNode } from "react";

/**
 * App-wide smooth scrolling. Touch devices keep native scrolling (`syncTouch: false`) so inertia,
 * pull gestures and the browser's own momentum feel native; wheel/trackpad input is smoothed.
 * `respectReducedMotion` makes Lenis track input 1:1 for users who prefer reduced motion.
 * Overlays that scroll on their own (e.g. the mobile drawer) opt out with `data-lenis-prevent`.
 */
export function LenisProvider({ children }: { children: ReactNode }) {
  return (
    <ReactLenis
      root
      options={{
        autoRaf: true,
        lerp: 0.1,
        smoothWheel: true,
        syncTouch: false,
        anchors: true,
        respectReducedMotion: true,
      }}
    >
      {children}
    </ReactLenis>
  );
}
