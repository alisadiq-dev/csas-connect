"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { SlidingNumber } from "@/components/animate-ui/primitives/texts/sliding-number";

/**
 * A metric that rolls into place when scrolled into view, but is never at the mercy of the animation:
 *  - the real value is always in the DOM as screen-reader text (and for tests / no-JS);
 *  - reduced-motion users get the plain number;
 *  - if the animated digits haven't measured (width/height 0) after a short grace period — e.g. an
 *    IntersectionObserver or ResizeObserver that never fires — it falls back to the plain number.
 */
export function StatNumber({
  value,
  suffix = "",
  decimals = 0,
  suffixClassName = "text-3xl text-mint sm:text-4xl",
}: {
  value: number;
  suffix?: string;
  decimals?: number;
  suffixClassName?: string;
}) {
  const reduce = useReducedMotion();
  const box = useRef<HTMLSpanElement>(null);
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    if (reduce) return;
    const t = setTimeout(() => {
      const el = box.current;
      // The animated digit elements only render once the roller has measured its height; none means it never did.
      if (!el || el.querySelector('[data-slot="sliding-number-display"]') === null) setBroken(true);
    }, 3500);
    return () => clearTimeout(t);
  }, [reduce]);

  const plain = reduce || broken;
  return (
    <>
      <span className="sr-only">{`${value.toFixed(decimals)}${suffix}`}</span>
      <span aria-hidden ref={box} className="inline-flex items-baseline tabular-nums">
        {plain ? <span>{value.toFixed(decimals)}</span> : <SlidingNumber number={value} decimalPlaces={decimals} inView inViewMargin="0px" />}
        {suffix && <span className={suffixClassName}>{suffix}</span>}
      </span>
    </>
  );
}
