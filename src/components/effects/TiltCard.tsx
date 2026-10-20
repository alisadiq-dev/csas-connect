"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";

/**
 * Card with a subtle 3D tilt and a border glow that follows the pointer (Inspira UI / Aceternity
 * "3D card" + "glowing border" ideas). The effect only runs for mouse/pen hover and is skipped for
 * touch and `prefers-reduced-motion`; touch users get a press (scale) response instead.
 */
export function TiltCard({
  children,
  className = "",
  maxTilt = 6,
  style,
}: {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const move = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || e.pointerType === "touch" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.transform = `perspective(900px) rotateX(${((0.5 - py) * maxTilt).toFixed(2)}deg) rotateY(${((px - 0.5) * maxTilt).toFixed(2)}deg) translateZ(0)`;
    el.style.setProperty("--mx", `${(px * 100).toFixed(1)}%`);
    el.style.setProperty("--my", `${(py * 100).toFixed(1)}%`);
    el.style.setProperty("--glow", "1");
  };

  const reset = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "";
    el.style.setProperty("--glow", "0");
  };

  return (
    <div
      ref={ref}
      onPointerMove={move}
      onPointerLeave={reset}
      onPointerCancel={reset}
      style={style}
      className={`border-glow transition-transform duration-200 ease-out will-change-transform active:scale-[0.985] motion-reduce:transition-none ${className}`}
    >
      {children}
    </div>
  );
}
